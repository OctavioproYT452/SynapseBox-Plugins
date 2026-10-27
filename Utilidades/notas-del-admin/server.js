// Bloc de notas compartido entre los administradores.
module.exports = api => {
  api.get("/api/plugins/notas-del-admin/notes", api.adminOnly, (req, res) => res.json(api.data.read("notes", { text: "", t: 0, by: null })));
  api.post("/api/plugins/notas-del-admin/notes", api.adminOnly, (req, res) => {
    const n = { text: String(req.body?.text ?? "").slice(0, 50000), t: Date.now(), by: req.user.username };
    api.data.write("notes", n); res.json({ success: true, t: n.t, by: n.by });
  });
};
