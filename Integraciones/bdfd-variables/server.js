// Variables para BDFD (Bot Designer for Discord) guardadas en el almacenamiento del usuario.
// API: /api/bdfd/<ID_USUARIO>/<acción>  ·  clave en la cabecera x-api-key (o ?key=)
// Acciones: set · get · add · delete · recover · purge · list · info
const fsp = require("fs").promises, path = require("path"), crypto = require("crypto");

module.exports = api => {
  const { get, run } = api.db;
  const { usage, dirSize } = api.core("lib/storage");
  const { base, limitB } = api.core("lib/paths");
  const ROOT = "BDFD-Variables", TRASH = "_papelera";
  const SCOPES = ["global", "user", "server", "channel", "member", "bot"];
  const MAX_VALUE = 65536, MAX_LIST = 500;

  const sha = s => crypto.createHash("sha256").update(s).digest("hex");
  const cfg = () => api.data.read("users", {}), save = c => api.data.write("users", c);
  const fail = (code, message, status) => Object.assign(Error(message), { code, status });
  const enc = s => { s = String(s ?? ""); if (!s || s.length > 100) throw fail("bad_request", "Valor vacío o de más de 100 caracteres", 400); return encodeURIComponent(s).replace(/\./g, "%2E"); };
  const dec = f => { try { return decodeURIComponent(f.replace(/\.json$/, "")); } catch { return f; } };

  // ---------- seguridad: intentos fallidos por IP y una operación a la vez por usuario ----------
  const fails = new Map(), locks = new Map();
  const throttled = ip => { const f = fails.get(ip); return !!f && f.n >= 10 && Date.now() - f.t < 6e5; };
  const bad = ip => { if (fails.size > 5000) fails.clear(); const f = fails.get(ip); if (!f || Date.now() - f.t > 6e5) fails.set(ip, { n: 1, t: Date.now() }); else { f.n++; f.t = Date.now(); } };
  const lock = (k, fn) => { const prev = locks.get(k) || Promise.resolve(), next = prev.then(fn, fn); const tail = next.catch(() => { }); locks.set(k, tail); tail.then(() => { if (locks.get(k) === tail) locks.delete(k); }); return next; };

  function auth(req) {
    if (throttled(req.ip)) throw fail("too_many_attempts", "Demasiados intentos fallidos: espera unos minutos", 429);
    const p = { ...req.query, ...(req.body && typeof req.body === "object" ? req.body : {}) };
    const key = String(req.get("x-api-key") || (req.get("authorization") || "").replace(/^Bearer\s+/i, "") || p.key || "");
    const u = get("SELECT * FROM users WHERE uuid=?", String(req.params.uuid)), c = u && cfg()[u.id];
    const ok = !!(u && c && c.enabled && c.keyHash && !u.suspended && key.length >= 20 && crypto.timingSafeEqual(Buffer.from(sha(key)), Buffer.from(c.keyHash)));
    if (!ok) { bad(req.ip); throw fail("invalid_credentials", "ID o clave incorrectos, o la opción está desactivada en el perfil", 401); }
    delete p.key;
    return { id: u.id, p, c };
  }

  // ---------- rutas y archivos dentro del almacenamiento del usuario ----------
  function target(u, p, trash) {
    const scope = String(p.scope || "user").toLowerCase();
    if (!SCOPES.includes(scope)) throw fail("bad_scope", `«scope» debe ser uno de: ${SCOPES.join(", ")}`, 400);
    const id = scope === "global" ? "_" : String(p.id ?? ""), bot = p.bot ? String(p.bot) : "default";
    const dir = path.join(base(u), ROOT, ...(trash ? [TRASH] : []), enc(bot), scope, enc(id));
    const named = p.name !== undefined && p.name !== "";
    return { scope, id: scope === "global" ? null : id, bot, dir, name: named ? String(p.name) : null, file: named ? path.join(dir, enc(p.name) + ".json") : null };
  }
  const needName = t => { if (!t.file) throw fail("bad_request", "Falta el parámetro «name»", 400); return t.file; };
  const read = async f => {
    let t; try { t = await fsp.readFile(f, "utf8"); } catch (e) { if (e.code === "ENOENT") return null; throw e; }
    try { const j = JSON.parse(t); if (j && typeof j === "object" && "value" in j) return j; } catch { /* archivo editado a mano */ }
    return { value: t, created_at: null, updated_at: null };
  };
  const sizeOf = async f => { try { return (await fsp.stat(f)).size; } catch { return 0; } };
  const bump = (u, d) => { if (d) run("UPDATE users SET used_bytes=MAX(0,used_bytes+?) WHERE id=?", d, u.id); };

  // Comprueba la cuota ANTES de crear o ampliar un archivo. Borrar y vaciar la papelera nunca se bloquean.
  async function room(u, add, old) {
    const lim = limitB(u); if (lim === Infinity) return;
    const used = await usage(u);
    if (used - old + add > lim) throw fail("storage_full", "Almacenamiento lleno: libera espacio (borra archivos o vacía la papelera de variables) para guardar más", 507);
  }
  async function write(u, f, rec) {
    const text = JSON.stringify(rec), add = Buffer.byteLength(text), old = await sizeOf(f);
    await room(u, add, old);
    await fsp.mkdir(path.dirname(f), { recursive: true }); await fsp.writeFile(f, text);
    bump(u, add - old); return add;
  }
  const str = v => v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  const out = (action, t, rec, extra) => ({ ok: true, action, scope: t.scope, id: t.id, bot: t.bot, name: t.name, ...extra, ...(rec ? { value: rec.value, created_at: rec.created_at, updated_at: rec.updated_at } : {}) });

  const actions = {
    async set(u, p) {
      const t = target(u, p), f = needName(t), value = str(p.value);
      if (Buffer.byteLength(value) > MAX_VALUE) throw fail("value_too_large", `El valor supera ${MAX_VALUE} bytes`, 413);
      const prev = await read(f), now = Date.now(), rec = { name: t.name, value, created_at: prev?.created_at || now, updated_at: now };
      const size = await write(u, f, rec);
      return out("set", t, rec, { exists: true, created: !prev, size });
    },
    async get(u, p) {
      const t = target(u, p), rec = await read(needName(t));
      if (!rec) return out("get", t, null, { exists: false, value: str(p.default) });
      return out("get", t, rec, { exists: true });
    },
    async add(u, p) { // suma (o resta, con negativos) a una variable numérica
      const t = target(u, p), f = needName(t), amount = Number(p.value ?? 1), prev = await read(f), cur = Number(prev ? prev.value : (p.default ?? 0));
      if (!Number.isFinite(amount) || !Number.isFinite(cur)) throw fail("not_a_number", "La variable o el valor no son números", 400);
      const now = Date.now(), rec = { name: t.name, value: String(parseFloat((cur + amount).toFixed(10))), created_at: prev?.created_at || now, updated_at: now };
      await write(u, f, rec);
      return out("add", t, rec, { exists: true, created: !prev });
    },
    async delete(u, p) { // va a la papelera de variables (sigue ocupando espacio hasta vaciarla)
      const t = target(u, p), f = needName(t), rec = await read(f);
      if (!rec) return out("delete", t, null, { deleted: false });
      const tf = target(u, p, true).file, oldT = await sizeOf(tf), old = await sizeOf(f), text = JSON.stringify({ ...rec, name: t.name, deleted_at: Date.now() });
      await fsp.mkdir(path.dirname(tf), { recursive: true }); await fsp.writeFile(tf, text); await fsp.rm(f);
      bump(u, Buffer.byteLength(text) - oldT - old);
      return out("delete", t, null, { deleted: true, recoverable: true });
    },
    async recover(u, p) {
      const t = target(u, p), f = needName(t), tf = target(u, p, true).file, rec = await read(tf);
      if (!rec) return out("recover", t, null, { recovered: false });
      if (await sizeOf(f) && !/^(1|true|yes)$/i.test(String(p.overwrite))) throw fail("exists", "Ya existe una variable con ese nombre (usa overwrite=true para reemplazarla)", 409);
      const oldT = await sizeOf(tf), { deleted_at, ...clean } = rec;
      await write(u, f, { ...clean, name: t.name, updated_at: Date.now() });
      await fsp.rm(tf); bump(u, -oldT);
      return out("recover", t, clean, { recovered: true });
    },
    async purge(u, p) { // borrado definitivo: libera almacenamiento
      if (p.name !== undefined && p.name !== "") {
        const t = target(u, p), tf = target(u, p, true).file, s = await sizeOf(tf);
        if (!s) return out("purge", t, null, { purged: false });
        await fsp.rm(tf); bump(u, -s); return out("purge", t, null, { purged: true, freed: s });
      }
      if (!/^(1|true|yes)$/i.test(String(p.confirm))) throw fail("confirm_required", "Para vaciar toda la papelera de variables añade confirm=yes (o indica «name»)", 400);
      const dir = path.join(base(u), ROOT, TRASH), s = await dirSize(dir);
      await fsp.rm(dir, { recursive: true, force: true }); bump(u, -s);
      return { ok: true, action: "purge", purged: true, freed: s, all: true };
    },
    async list(u, p) {
      const inTrash = /^(1|true|yes)$/i.test(String(p.trash)), t = target(u, { ...p, name: undefined }, inTrash);
      let es = []; try { es = await fsp.readdir(t.dir, { withFileTypes: true }); } catch { /* sin variables todavía */ }
      const rows = [];
      for (const e of es) if (e.isFile() && e.name.endsWith(".json")) { const st = await fsp.stat(path.join(t.dir, e.name)); rows.push({ name: dec(e.name), size: st.size, updated_at: st.mtimeMs | 0 }); }
      rows.sort((a, b) => a.name.localeCompare(b.name));
      return { ok: true, action: "list", scope: t.scope, id: t.id, bot: t.bot, trash: inTrash, count: rows.length, truncated: rows.length > MAX_LIST, variables: rows.slice(0, MAX_LIST) };
    },
    async info(u) {
      const used = await usage(u, true), lim = limitB(u), vb = await dirSize(path.join(base(u), ROOT)), tb = await dirSize(path.join(base(u), ROOT, TRASH));
      return { ok: true, action: "info", storage: { used, limit: lim === Infinity ? null : lim, free: lim === Infinity ? null : Math.max(0, lim - used), full: lim !== Infinity && used >= lim }, variables_bytes: vb - tb, trash_bytes: tb };
    },
  };

  api.router.all("/api/bdfd/:uuid/:action", async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const { id, p, c } = auth(req), fn = actions[req.params.action];
      if (!fn) throw fail("unknown_action", `Acciones: ${Object.keys(actions).join(", ")}`, 404);
      if (Date.now() - (c.lastUsed || 0) > 6e4) { const all = cfg(); if (all[id]) { all[id].lastUsed = Date.now(); save(all); } }
      res.json(await lock(id, () => fn(get("SELECT * FROM users WHERE id=?", id), p)));
    } catch (e) {
      if (!e.status) api.log("error:", e.message);
      res.status(e.status || 500).json({ ok: false, error: e.code || "internal_error", message: e.status ? e.message : "Error interno" });
    }
  });

  // ---------- rutas del perfil (requieren sesión) ----------
  const needUser = (req, res, next) => req.user ? next() : res.status(401).json({ error: "No autorizado" });
  api.get("/api/plugins/bdfd-variables/me", needUser, async (req, res) => {
    const c = cfg()[req.user.id] || {}, u = get("SELECT * FROM users WHERE id=?", req.user.id), lim = limitB(u);
    res.json({ enabled: !!c.enabled, uuid: u.uuid, createdAt: c.createdAt || null, lastUsed: c.lastUsed || null, used: await usage(u), limit: lim === Infinity ? -1 : lim });
  });
  api.post("/api/plugins/bdfd-variables/enable", needUser, (req, res) => {
    const on = !!req.body?.enabled, all = cfg(), c = all[req.user.id] || {}; let key = null;
    if (on) {
      if (!c.keyHash || req.body.regenerate) { key = "sbv_" + crypto.randomBytes(24).toString("base64url"); c.keyHash = sha(key); c.createdAt = Date.now(); }
      c.enabled = true;
    } else { c.enabled = false; delete c.keyHash; } // al desactivar, la clave deja de valer
    all[req.user.id] = c; save(all);
    res.json({ success: true, enabled: c.enabled, key }); // la clave solo se muestra aquí, una vez
  });
};
