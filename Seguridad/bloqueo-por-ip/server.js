// Bloquea IPs (exactas o con comodín final: 192.168.1.*). Gestión: Administración → Extensiones → Bloqueo por IP.
module.exports = api => {
  const clean = ip => String(ip || "").replace(/^::ffff:/, "");
  const match = (ip, r) => r.endsWith("*") ? ip.startsWith(r.slice(0, -1)) : ip === r;
  const RE = /^[0-9a-fA-F:.]{2,45}\*?$/;
  const cfg = () => { const c = api.data.read("config", {}); return { deny: c.deny || [], allow: c.allow || [] }; };
  const list = v => [...new Set((Array.isArray(v) ? v : []).map(x => String(x).trim()).filter(x => RE.test(x)))].slice(0, 500);
  const stats = () => api.data.read("stats", { total: 0, recent: [] });
  api.use((req, res, next) => {
    const ip = clean(req.ip);
    if (ip === "127.0.0.1" || ip === "::1") return next(); // nunca se bloquea el acceso local
    const c = cfg();
    if (c.allow.some(r => match(ip, r)) || !c.deny.some(r => match(ip, r))) return next();
    const s = stats(); s.total++; s.recent.unshift({ t: Date.now(), ip, url: req.path.slice(0, 120) }); s.recent = s.recent.slice(0, 50);
    try { api.data.write("stats", s); } catch { /* no debe impedir el bloqueo */ }
    res.status(403).type("text").send("Acceso denegado");
  });
  api.get("/api/plugins/bloqueo-por-ip/config", api.adminOnly, (req, res) => res.json({ ...cfg(), me: clean(req.ip), ...stats() }));
  api.post("/api/plugins/bloqueo-por-ip/config", api.adminOnly, (req, res) => {
    const deny = list(req.body?.deny), allow = list(req.body?.allow), me = clean(req.ip);
    if (deny.some(r => match(me, r)) && !allow.some(r => match(me, r))) return res.status(400).json({ error: "No puedes bloquear tu propia IP (" + me + ")" });
    api.data.write("config", { deny, allow }); res.json({ success: true, deny, allow });
  });
  api.post("/api/plugins/bloqueo-por-ip/clear-stats", api.adminOnly, (req, res) => { api.data.write("stats", { total: 0, recent: [] }); res.json({ success: true }); });
};
