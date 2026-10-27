// Copias de seguridad de la base de datos (usuarios, enlaces, ajustes…) con VACUUM INTO: copia consistente sin parar el servidor.
// No incluye los archivos de los usuarios. Para restaurar: para SynapseBox y sustituye data/synapsebox.db por la copia.
const fs = require("fs"), path = require("path");
module.exports = {
  activate(api) {
    const DEF = { everyH: 24, keep: 7 };
    const dir = path.join(api.dataDir, "backups"); fs.mkdirSync(dir, { recursive: true });
    const cfg = () => ({ ...DEF, ...api.data.read("config", {}) });
    const NAME = /^synapsebox-\d{8}-\d{6}(-auto)?\.db$/;
    const stamp = () => new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14).replace(/^(\d{8})(\d{6})$/, "$1-$2");
    const list = () => fs.readdirSync(dir).filter(f => NAME.test(f)).map(f => { const s = fs.statSync(path.join(dir, f)); return { name: f, size: s.size, t: s.mtimeMs, auto: f.includes("-auto") }; }).sort((a, b) => b.t - a.t);
    const rotate = () => { for (const f of list().slice(cfg().keep)) fs.rmSync(path.join(dir, f.name), { force: true }); };
    const make = auto => {
      const file = path.join(dir, `synapsebox-${stamp()}${auto ? "-auto" : ""}.db`);
      if (fs.existsSync(file)) throw Error("Espera un segundo antes de crear otra copia");
      api.db.run(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
      rotate(); api.log("copia creada", path.basename(file)); return path.basename(file);
    };
    const tick = () => { const c = cfg(); if (!c.everyH) return; const l = list()[0]; if (!l || Date.now() - l.t >= c.everyH * 36e5) { try { make(true); } catch (e) { api.log("copia automática falló:", e.message); } } };
    api._timer = setInterval(tick, 10 * 60000); api._timer.unref?.(); setTimeout(tick, 15000).unref?.();

    api.get("/api/plugins/copias-de-seguridad/list", api.adminOnly, (req, res) => res.json({ backups: list(), config: cfg() }));
    api.post("/api/plugins/copias-de-seguridad/create", api.adminOnly, (req, res) => { try { res.json({ success: true, name: make(false) }); } catch (e) { res.status(400).json({ error: e.message }); } });
    api.post("/api/plugins/copias-de-seguridad/config", api.adminOnly, (req, res) => {
      const n = (v, d, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d));
      const c = { everyH: n(req.body?.everyH, DEF.everyH, 0, 720), keep: n(req.body?.keep, DEF.keep, 1, 100) };
      api.data.write("config", c); rotate(); res.json({ success: true, ...c });
    });
    api.get("/api/plugins/copias-de-seguridad/file/:name", api.adminOnly, (req, res) => { if (!NAME.test(req.params.name)) return res.status(400).json({ error: "Nombre inválido" }); res.download(path.join(dir, req.params.name)); });
    api.delete("/api/plugins/copias-de-seguridad/file/:name", api.adminOnly, (req, res) => { if (!NAME.test(req.params.name)) return res.status(400).json({ error: "Nombre inválido" }); fs.rmSync(path.join(dir, req.params.name), { force: true }); res.json({ success: true }); });
  },
  deactivate(api) { clearInterval(api._timer); },
};
