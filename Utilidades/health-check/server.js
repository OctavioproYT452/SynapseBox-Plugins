// Endpoints de salud para monitores (UptimeRobot, Docker, Kubernetes…): /healthz y /api/plugins/health-check
module.exports = api => {
  const handler = (req, res) => {
    let db = true; try { api.db.get("SELECT 1 x"); } catch { db = false; }
    const out = { ok: db, uptime_s: Math.round(process.uptime()), version: api.core("version").info().current };
    if (req.user?.is_admin) { const m = process.memoryUsage(); Object.assign(out, { db, node: process.version, rss_mb: Math.round(m.rss / 1048576), heap_mb: Math.round(m.heapUsed / 1048576) }); }
    res.status(db ? 200 : 503).set("Cache-Control", "no-store").json(out);
  };
  api.get("/healthz", handler);
  api.get("/api/plugins/health-check", handler);
};
