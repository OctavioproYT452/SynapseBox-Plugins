// Estadísticas de uso por día: páginas vistas, llamadas a la API, errores, IP distintas y rutas más usadas.
module.exports = {
  activate(api) {
    const KEEP = 30; let days = api.data.read("days", {}), dirty = false;
    const day = () => new Date().toISOString().slice(0, 10);
    const ipOf = req => String(req.ip || "").replace(/^::ffff:/, "");
    api.use((req, res, next) => {
      const p = req.path, isApi = p.startsWith("/api/") && !p.startsWith("/api/plugins/estadisticas-de-uso/"), isPage = req.method === "GET" && p.endsWith(".html");
      if (!isApi && !isPage) return next();
      res.on("finish", () => {
        const d = days[day()] ||= { pages: 0, api: 0, err: 0, ips: {}, top: {} };
        isPage ? d.pages++ : d.api++; if (res.statusCode >= 400) d.err++;
        const ip = ipOf(req); if (Object.keys(d.ips).length < 5000) d.ips[ip] = 1;
        const k = isPage ? p : req.method + " " + p.split("/").slice(0, 4).join("/");
        if (d.top[k] || Object.keys(d.top).length < 300) d.top[k] = (d.top[k] || 0) + 1;
        dirty = true;
      });
      next();
    });
    const flush = () => {
      if (!dirty) return; dirty = false;
      for (const k of Object.keys(days).sort().slice(0, -KEEP)) delete days[k];
      try { api.data.write("days", days); } catch { /* se reintenta en el siguiente ciclo */ }
    };
    api._timer = setInterval(flush, 30000); api._timer.unref?.(); api._flush = flush;
    api.get("/api/plugins/estadisticas-de-uso/stats", api.adminOnly, (req, res) => {
      const out = Object.keys(days).sort().slice(-14).map(k => ({ day: k, pages: days[k].pages, api: days[k].api, err: days[k].err, ips: Object.keys(days[k].ips).length }));
      const t = days[day()], top = t ? Object.entries(t.top).sort((a, b) => b[1] - a[1]).slice(0, 10) : [];
      res.json({ days: out, top });
    });
    api.post("/api/plugins/estadisticas-de-uso/reset", api.adminOnly, (req, res) => { days = {}; dirty = true; flush(); res.json({ success: true }); });
  },
  deactivate(api) { clearInterval(api._timer); api._flush?.(); },
};
