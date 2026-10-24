// Registra las peticiones que modifican datos. Consulta: GET /api/plugins/registro-de-accesos/log (solo admin)
module.exports = api => {
  const MAX = 500;
  api.use((req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method) || !req.path.startsWith("/api/")) return next();
    res.on("finish", () => {
      const log = api.data.read("log", []);
      log.push({ t: Date.now(), user: req.user?.username || null, m: req.method, url: req.path, status: res.statusCode, ip: req.ip });
      api.data.write("log", log.slice(-MAX));
    });
    next();
  });
  api.get("/api/plugins/registro-de-accesos/log", (req, res) => {
    if (!req.user?.is_admin) return res.status(403).json({ error: "Solo administradores" });
    res.json({ log: api.data.read("log", []).reverse() });
  });
};
