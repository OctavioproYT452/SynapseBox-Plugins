// Registra las peticiones que modifican datos (y, si quieres, los intentos de inicio de sesión). Consulta: Administración → Extensiones → Registro.
module.exports = api => {
  const DEF = { max: 500, methods: ["POST", "PUT", "PATCH", "DELETE"], ignoreOwn: false };
  const cfg = () => ({ ...DEF, ...api.data.read("config", {}) });
  api.use((req, res, next) => {
    const c = cfg();
    if (!c.methods.includes(req.method) || !req.path.startsWith("/api/") || req.path.startsWith("/api/plugins/registro-de-accesos/")) return next();
    res.on("finish", () => {
      if (c.ignoreOwn && req.user?.is_admin) return;
      const log = api.data.read("log", []);
      log.push({ t: Date.now(), user: req.user?.username || null, m: req.method, url: req.path, status: res.statusCode, ip: String(req.ip || "").replace(/^::ffff:/, "") });
      api.data.write("log", log.slice(-c.max));
    });
    next();
  });
  api.get("/api/plugins/registro-de-accesos/log", api.adminOnly, (req, res) => res.json({ log: api.data.read("log", []).reverse(), config: cfg() }));
  api.post("/api/plugins/registro-de-accesos/config", api.adminOnly, (req, res) => {
    const b = req.body || {};
    const c = { max: Math.min(5000, Math.max(50, parseInt(b.max, 10) || DEF.max)), methods: (Array.isArray(b.methods) ? b.methods : DEF.methods).filter(m => ["POST", "PUT", "PATCH", "DELETE", "GET"].includes(m)), ignoreOwn: !!b.ignoreOwn };
    api.data.write("config", c); res.json({ success: true, ...c });
  });
  api.delete("/api/plugins/registro-de-accesos/log", api.adminOnly, (req, res) => { api.data.write("log", []); res.json({ success: true }); });
};
