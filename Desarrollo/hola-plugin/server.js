// Plantilla de servidor. «api» ofrece: use, get, post, serveFile, serveDir, on, data, db, core, log…
module.exports = {
  activate(api) {
    api.get("/api/plugins/hola-plugin/saludo", (req, res) => res.json({ mensaje: "¡Hola desde el servidor!", usuario: req.user?.username || null }));
    api.log("activado");
  },
  deactivate(api) { api.log("desactivado"); },
};
