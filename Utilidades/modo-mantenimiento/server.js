// Modo mantenimiento: los no administradores reciben 503. El inicio de sesión sigue disponible.
module.exports = api => {
  const raw = () => api.data.read("state", { on: false, msg: "Estamos en mantenimiento. Vuelve en unos minutos.", until: 0 });
  const st = () => { const s = raw(); if (s.on && s.until && Date.now() >= s.until) { s.on = false; s.until = 0; api.data.write("state", s); } return s; }; // se apaga solo al llegar la hora de fin
  const OPEN = /^\/(api\/(login|logout|session|login\/2fa)$|api\/plugins\/modo-mantenimiento\/)/;
  const page = msg => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mantenimiento</title><body style="font:18px system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#0f1420;color:#e6ebf5;text-align:center"><div><h1>🛠️ Mantenimiento</h1><p>${String(msg).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))}</p></div>`;
  const retry = s => String(s.until ? Math.max(30, Math.round((s.until - Date.now()) / 1000)) : 120);
  api.use((req, res, next) => {
    const s = st(); if (!s.on || req.user?.is_admin) return next();
    const p = req.path;
    if (p.startsWith("/api/")) { if (OPEN.test(p)) return next(); return res.set("Retry-After", retry(s)).status(503).json({ error: s.msg, maintenance: true }); }
    if ((p.endsWith(".html") && p !== "/index.html") || p.startsWith("/dav") || p.startsWith("/s/")) return res.set("Retry-After", retry(s)).status(503).send(page(s.msg));
    next();
  });
  api.get("/api/plugins/modo-mantenimiento/state", api.adminOnly, (req, res) => res.json(st()));
  api.post("/api/plugins/modo-mantenimiento/state", api.adminOnly, (req, res) => {
    const until = Number(req.body?.until) > Date.now() ? Math.round(Number(req.body.until)) : 0;
    const s = { on: !!req.body?.on, msg: String(req.body?.msg || raw().msg).slice(0, 300), until: req.body?.on ? until : 0 };
    api.data.write("state", s); res.json({ success: true, ...s });
  });
};
