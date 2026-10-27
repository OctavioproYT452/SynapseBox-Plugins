// Plantilla de servidor. «api» ofrece: use, get, post, adminOnly, serveFile, serveDir, on, data, db, core, log…
module.exports = {
  activate(api) {
    const cfg = () => api.data.read("config", { mensaje: "¡Hola desde el servidor!" });
    api.get("/api/plugins/hola-plugin/saludo", (req, res) => res.json({ mensaje: cfg().mensaje, usuario: req.user?.username || null }));
    api.get("/api/plugins/hola-plugin/config", api.adminOnly, (req, res) => res.json(cfg()));
    api.post("/api/plugins/hola-plugin/config", api.adminOnly, (req, res) => { api.data.write("config", { mensaje: String(req.body?.mensaje || "").slice(0, 120) || "¡Hola desde el servidor!" }); res.json({ success: true }); });
    api.log("activado");
  },
  deactivate(api) { api.log("desactivado"); },
};
