// Bloquea IPs (exactas o con comodín final: 192.168.1.*). Gestión: pestaña de administración (botón flotante).
module.exports = api => {
  const clean = ip => String(ip || "").replace(/^::ffff:/, "");
  const match = (ip, r) => r.endsWith("*") ? ip.startsWith(r.slice(0, -1)) : ip === r;
  const cfg = () => api.data.read("config", { deny: [] });
  api.use((req, res, next) => {
    const ip = clean(req.ip);
    if (ip === "127.0.0.1" || ip === "::1") return next(); // nunca se bloquea el acceso local
    if (cfg().deny.some(r => match(ip, r))) return res.status(403).type("text").send("Acceso denegado");
    next();
  });
  const adm = (req, res, next) => req.user?.is_admin ? next() : res.status(403).json({ error: "Solo administradores" });
  api.get("/api/plugins/bloqueo-por-ip/config", adm, (req, res) => res.json(cfg()));
  api.post("/api/plugins/bloqueo-por-ip/config", adm, (req, res) => {
    const deny = (Array.isArray(req.body?.deny) ? req.body.deny : []).map(x => String(x).trim()).filter(x => /^[0-9a-fA-F:.]{2,45}\*?$/.test(x)).slice(0, 500);
    if (deny.some(r => match(clean(req.ip), r))) return res.status(400).json({ error: "No puedes bloquear tu propia IP" });
    api.data.write("config", { deny }); res.json({ success: true, deny });
  });
};
