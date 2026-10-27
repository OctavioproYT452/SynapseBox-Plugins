// Mensaje de bienvenida: se muestra una vez a cada persona en su navegador (y otra vez si el administrador lo renueva).
module.exports = api => {
  const DEF = { enabled: false, title: "¡Bienvenido!", text: "", rev: 1 };
  const cfg = () => ({ ...DEF, ...api.data.read("config", {}) });
  api.get("/api/plugins/mensaje-de-bienvenida/config", (req, res) => { const c = cfg(); res.json(req.user ? c : { ...c, enabled: false }); });
  api.post("/api/plugins/mensaje-de-bienvenida/config", api.adminOnly, (req, res) => {
    const b = req.body || {}, old = cfg();
    const c = { enabled: !!b.enabled, title: String(b.title || DEF.title).slice(0, 80), text: String(b.text || "").slice(0, 2000), rev: b.renew ? old.rev + 1 : old.rev };
    api.data.write("config", c); res.json({ success: true, ...c });
  });
};
