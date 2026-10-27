// Ajustes del reloj (diseño, posición, formato…). Los lee cualquier usuario; solo un administrador los cambia.
module.exports = api => {
  const DEF = { design: "pildora", pos: "br", h24: true, seconds: true, date: false, tz: "", size: "m", opacity: 100, clickThrough: true, pages: "all" };
  const DESIGNS = ["pildora", "minimal", "neon", "lcd", "vidrio", "terminal", "analogico", "flip"];
  const pick = (v, list, d) => list.includes(v) ? v : d;
  const cfg = () => ({ ...DEF, ...api.data.read("config", {}) });
  const clean = b => {
    let tz = String(b.tz || "").trim().slice(0, 60);
    if (tz) { try { new Intl.DateTimeFormat("es", { timeZone: tz }); } catch { tz = ""; } }
    return {
      design: pick(b.design, DESIGNS, DEF.design), pos: pick(b.pos, ["tl", "tr", "bl", "br"], DEF.pos), h24: !!b.h24, seconds: !!b.seconds, date: !!b.date,
      tz, size: pick(b.size, ["s", "m", "l"], DEF.size), opacity: Math.min(100, Math.max(20, parseInt(b.opacity, 10) || 100)),
      clickThrough: !!b.clickThrough, pages: pick(b.pages, ["all", "no-admin", "panel"], DEF.pages),
    };
  };
  api.get("/api/plugins/reloj-en-panel/config", (req, res) => res.json({ ...cfg(), designs: DESIGNS }));
  api.post("/api/plugins/reloj-en-panel/config", api.adminOnly, (req, res) => { const c = clean(req.body || {}); api.data.write("config", c); res.json({ success: true, ...c }); });
};
