// Envía avisos a un webhook (Discord u otro servicio): inicios de sesión, intentos fallidos, acciones de administración y arranque.
module.exports = api => {
  const DEF = { url: "", format: "discord", events: { login_ok: false, login_fail: true, admin_action: true, server_start: true } };
  const cfg = () => { const c = api.data.read("config", {}); return { ...DEF, ...c, events: { ...DEF.events, ...(c.events || {}) } }; };
  const status = { last: null, error: null }, queue = []; let sending = false;
  const send = async (text, c = cfg()) => {
    if (!/^https:\/\//i.test(c.url)) throw Error("La URL debe empezar por https://");
    const body = c.format === "discord" ? { content: text.slice(0, 1900), username: "SynapseBox" } : { text, source: "SynapseBox", time: new Date().toISOString() };
    const r = await fetch(c.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw Error("El webhook respondió " + r.status);
  };
  const pump = async () => {
    if (sending) return; sending = true;
    while (queue.length) { const t = queue.shift(); try { await send(t); status.last = Date.now(); status.error = null; } catch (e) { status.error = e.message; } await new Promise(r => setTimeout(r, 1200)); }
    sending = false;
  };
  const notify = (ev, text) => { const c = cfg(); if (!c.url || !c.events[ev] || queue.length > 20) return; queue.push(text); pump(); };
  const ip = req => String(req.ip || "").replace(/^::ffff:/, "");

  api.use((req, res, next) => {
    if (req.method === "GET" || !req.path.startsWith("/api/") || req.path.startsWith("/api/plugins/")) return next();
    const user = req.user?.username;
    if (req.method === "POST" && req.path === "/api/login") {
      const who = String(req.body?.username || "?").slice(0, 40);
      res.on("finish", () => res.statusCode < 400 ? notify("login_ok", `✅ Inicio de sesión: **${who}** (${ip(req)})`) : notify("login_fail", `⚠️ Intento de inicio de sesión fallido: **${who}** (${ip(req)}) · código ${res.statusCode}`));
    } else if (req.path.startsWith("/api/admin/") && req.user?.is_admin) {
      res.on("finish", () => { if (res.statusCode < 400) notify("admin_action", `🛠️ **${user}** ejecutó ${req.method} ${req.path.slice(0, 120)}`); });
    }
    next();
  });
  api.on("server:start", () => notify("server_start", "🟢 SynapseBox se ha iniciado (v" + api.core("version").info().current + ")"));

  api.get("/api/plugins/avisos-por-webhook/config", api.adminOnly, (req, res) => { const c = cfg(); res.json({ ...c, url: c.url ? c.url.slice(0, 24) + "…" : "", hasUrl: !!c.url, status }); });
  api.post("/api/plugins/avisos-por-webhook/config", api.adminOnly, (req, res) => {
    const b = req.body || {}, old = cfg();
    let url = typeof b.url === "string" && b.url.trim() && !b.url.includes("…") ? b.url.trim().slice(0, 500) : old.url;
    if (b.clearUrl) url = "";
    if (url && !/^https:\/\//i.test(url)) return res.status(400).json({ error: "La URL debe empezar por https://" });
    const e = {}; for (const k of Object.keys(DEF.events)) e[k] = !!b.events?.[k];
    api.data.write("config", { url, format: b.format === "json" ? "json" : "discord", events: e }); res.json({ success: true });
  });
  api.post("/api/plugins/avisos-por-webhook/test", api.adminOnly, async (req, res) => {
    try { await send("🔔 Prueba de SynapseBox: el webhook funciona."); res.json({ success: true }); } catch (e) { res.status(400).json({ error: e.message }); }
  });
};
