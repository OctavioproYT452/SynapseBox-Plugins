// Atajos de teclado configurables: se guardan en el servidor y se aplican a todos los usuarios.
module.exports = api => {
  const DEF = { mod: "alt", keys: { h: "/panel.html", a: "/admin/index.html", t: "/themes.html" } };
  const cfg = () => { const c = api.data.read("config", null) || DEF; return { mod: c.mod || "alt", keys: c.keys || DEF.keys }; };
  api.get("/api/plugins/atajos-de-teclado/config", (req, res) => res.json(cfg()));
  api.post("/api/plugins/atajos-de-teclado/config", api.adminOnly, (req, res) => {
    const keys = {};
    for (const [k, v] of Object.entries(req.body?.keys || {})) {
      const key = String(k).toLowerCase();
      if (/^[a-z0-9]$/.test(key) && /^\/(?!\/)[\w\-./?=&#]{0,100}$/.test(String(v)) && !String(v).includes("..")) keys[key] = String(v);
    }
    const mod = ["alt", "ctrl", "shift"].includes(req.body?.mod) ? req.body.mod : "alt";
    api.data.write("config", { mod, keys }); res.json({ success: true, mod, keys });
  });
};
