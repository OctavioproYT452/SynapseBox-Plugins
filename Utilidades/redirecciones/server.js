// Redirecciones: una dirección de tu SynapseBox lleva a otra (útil para enlaces cortos o páginas movidas).
module.exports = api => {
  const rules = () => api.data.read("rules", []);
  const BAD = /^\/(api|admin|plugins|dav|s)(\/|$)/;
  api.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const r = rules().find(x => x.from === req.path);
    r ? res.redirect(r.code, r.to) : next();
  });
  api.get("/api/plugins/redirecciones/rules", api.adminOnly, (req, res) => res.json({ rules: rules() }));
  api.post("/api/plugins/redirecciones/rules", api.adminOnly, (req, res) => {
    const out = [], seen = new Set();
    for (const x of (Array.isArray(req.body?.rules) ? req.body.rules : []).slice(0, 200)) {
      const from = String(x.from || "").trim(), to = String(x.to || "").trim(), code = [301, 302, 307].includes(+x.code) ? +x.code : 302;
      if (!from && !to) continue;
      if (!/^\/[\w\-./]{0,120}$/.test(from) || BAD.test(from) || from === "/") return res.status(400).json({ error: `Origen no válido: «${from}» (debe empezar por / y no puede ser /api, /admin, /plugins, /dav ni /s)` });
      if (!(/^\/(?!\/)[\w\-./?=&#%]{0,300}$/.test(to) || /^https:\/\/[^\s]{3,300}$/.test(to))) return res.status(400).json({ error: `Destino no válido: «${to}» (usa /ruta o https://…)` });
      if (to === from) return res.status(400).json({ error: "El destino no puede ser igual al origen: «" + from + "»" });
      if (seen.has(from)) return res.status(400).json({ error: "Origen repetido: «" + from + "»" }); seen.add(from);
      out.push({ from, to, code });
    }
    api.data.write("rules", out); res.json({ success: true, rules: out });
  });
};
