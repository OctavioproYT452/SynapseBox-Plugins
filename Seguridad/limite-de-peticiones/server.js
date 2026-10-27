// Limita las peticiones por IP (anti fuerza bruta y abuso). Ajustes: Administración → Extensiones → Límite de peticiones.
module.exports = {
  activate(api) {
    const DEF = { enabled: true, windowSec: 60, max: 600, loginMax: 10, loginWindowMin: 10 };
    const cfg = () => ({ ...DEF, ...api.data.read("config", {}) });
    const hits = new Map(), logins = new Map(), stats = { blocked: 0, byIp: new Map(), since: Date.now() };
    const ipOf = req => String(req.ip || "").replace(/^::ffff:/, "");
    const bump = (map, ip, win) => { const n = Date.now(), e = map.get(ip); if (!e || n >= e.reset) { const v = { n: 1, reset: n + win }; map.set(ip, v); return v; } e.n++; return e; };
    const deny = (req, res, e, what) => {
      const ip = ipOf(req); stats.blocked++; stats.byIp.set(ip, (stats.byIp.get(ip) || 0) + 1);
      if (stats.byIp.size > 200) stats.byIp.delete(stats.byIp.keys().next().value);
      res.set("Retry-After", String(Math.max(1, Math.ceil((e.reset - Date.now()) / 1000)))).status(429).json({ error: what });
    };
    api.use((req, res, next) => {
      const c = cfg(); if (!c.enabled || !req.path.startsWith("/api/")) return next();
      const ip = ipOf(req); if (ip === "127.0.0.1" || ip === "::1" || req.user?.is_admin) return next();
      if (req.method === "POST" && req.path === "/api/login") { const e = bump(logins, ip, c.loginWindowMin * 6e4); if (e.n > c.loginMax) return deny(req, res, e, "Demasiados intentos de inicio de sesión. Espera unos minutos."); }
      const e = bump(hits, ip, c.windowSec * 1000);
      if (e.n > c.max) return deny(req, res, e, "Demasiadas peticiones. Espera un momento.");
      next();
    });
    const timer = setInterval(() => { const n = Date.now(); for (const m of [hits, logins]) for (const [k, v] of m) if (n >= v.reset) m.delete(k); }, 60000); timer.unref?.();
    api._timer = timer;
    api.get("/api/plugins/limite-de-peticiones/status", api.adminOnly, (req, res) => res.json({
      config: cfg(), blocked: stats.blocked, since: stats.since, top: [...stats.byIp].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ip, n]) => ({ ip, n })), tracking: hits.size,
    }));
    api.post("/api/plugins/limite-de-peticiones/config", api.adminOnly, (req, res) => {
      const b = req.body || {}, n = (v, d, lo, hi) => Math.min(hi, Math.max(lo, parseInt(v, 10) || d));
      const c = { enabled: !!b.enabled, windowSec: n(b.windowSec, DEF.windowSec, 5, 3600), max: n(b.max, DEF.max, 10, 100000), loginMax: n(b.loginMax, DEF.loginMax, 3, 1000), loginWindowMin: n(b.loginWindowMin, DEF.loginWindowMin, 1, 1440) };
      api.data.write("config", c); res.json({ success: true, ...c });
    });
    api.post("/api/plugins/limite-de-peticiones/reset", api.adminOnly, (req, res) => { hits.clear(); logins.clear(); stats.blocked = 0; stats.byIp.clear(); stats.since = Date.now(); res.json({ success: true }); });
  },
  deactivate(api) { clearInterval(api._timer); },
};
