// Cierra la sesión tras un tiempo sin actividad. Ajustes: Administración → Extensiones → Inactividad.
module.exports = api => {
  const DEF = { minutes: 30, warnSec: 60, includeAdmins: true };
  const cfg = () => ({ ...DEF, ...api.data.read("config", {}) });
  api.get("/api/plugins/cierre-por-inactividad/config", (req, res) => { const c = cfg(); res.json(req.user?.is_admin && !c.includeAdmins ? { ...c, minutes: 0 } : c); });
  api.post("/api/plugins/cierre-por-inactividad/config", api.adminOnly, (req, res) => {
    const b = req.body || {}, n = (v, d, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d));
    const c = { minutes: n(b.minutes, DEF.minutes, 0, 1440), warnSec: n(b.warnSec, DEF.warnSec, 10, 600), includeAdmins: !!b.includeAdmins };
    api.data.write("config", c); res.json({ success: true, ...c });
  });
};
