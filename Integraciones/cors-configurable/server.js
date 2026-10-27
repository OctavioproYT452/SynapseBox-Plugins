// CORS configurable: permite que páginas de otros dominios usen la API de SynapseBox desde el navegador.
module.exports = api => {
  const DEF = { origins: [], credentials: false };
  const cfg = () => ({ ...DEF, ...api.data.read("config", {}) });
  api.use((req, res, next) => {
    const origin = req.headers.origin; if (!origin || !req.path.startsWith("/api/")) return next();
    const c = cfg(), any = c.origins.includes("*");
    if (!any && !c.origins.includes(origin)) return next();
    res.set("Access-Control-Allow-Origin", any && !c.credentials ? "*" : origin).set("Vary", "Origin");
    if (c.credentials) res.set("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.set({ "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] || "Content-Type,Authorization,x-api-key", "Access-Control-Max-Age": "600" }).status(204).send("");
    next();
  });
  api.get("/api/plugins/cors-configurable/config", api.adminOnly, (req, res) => res.json(cfg()));
  api.post("/api/plugins/cors-configurable/config", api.adminOnly, (req, res) => {
    const origins = [...new Set((Array.isArray(req.body?.origins) ? req.body.origins : []).map(x => String(x).trim().replace(/\/+$/, "")).filter(x => x === "*" || /^https?:\/\/[\w.\-]+(:\d{1,5})?$/.test(x)))].slice(0, 100);
    api.data.write("config", { origins, credentials: !!req.body?.credentials && !origins.includes("*") }); res.json({ success: true });
  });
};
