// Borra de la carpeta temporal (data/tmp) lo que lleve más de N horas sin tocarse: subidas a medias, restos de conversiones…
const fs = require("fs"), path = require("path");
module.exports = {
  activate(api) {
    const DEF = { enabled: true, everyH: 6, olderH: 24 };
    const cfg = () => ({ ...DEF, ...api.data.read("config", {}) });
    const TMP = path.resolve(api.config.TMP);
    const size = p => { let n = 0; try { const s = fs.lstatSync(p); if (s.isDirectory()) for (const f of fs.readdirSync(p)) n += size(path.join(p, f)); else n = s.size; } catch { /* desapareció */ } return n; };
    const scan = olderMs => {
      let files = 0, bytes = 0, old = 0, oldBytes = 0;
      if (!fs.existsSync(TMP)) return { files, bytes, old, oldBytes, list: [] };
      const list = [];
      for (const f of fs.readdirSync(TMP)) { const p = path.join(TMP, f); try { const s = fs.lstatSync(p), b = size(p); files++; bytes += b; if (Date.now() - s.mtimeMs > olderMs) { old++; oldBytes += b; list.push(p); } } catch { /* siguiente */ } }
      return { files, bytes, old, oldBytes, list };
    };
    const clean = () => {
      const r = scan(cfg().olderH * 36e5);
      for (const p of r.list) { if (!path.resolve(p).startsWith(TMP + path.sep)) continue; try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* en uso */ } }
      const out = { t: Date.now(), removed: r.old, bytes: r.oldBytes }; api.data.write("last", out); api.log(`limpieza: ${r.old} elementos`); return out;
    };
    const tick = () => { const c = cfg(), l = api.data.read("last", null); if (c.enabled && (!l || Date.now() - l.t >= c.everyH * 36e5)) clean(); };
    api._timer = setInterval(tick, 15 * 60000); api._timer.unref?.(); setTimeout(tick, 30000).unref?.();
    api.get("/api/plugins/limpieza-de-temporales/status", api.adminOnly, (req, res) => { const r = scan(cfg().olderH * 36e5); res.json({ config: cfg(), files: r.files, bytes: r.bytes, old: r.old, oldBytes: r.oldBytes, last: api.data.read("last", null) }); });
    api.post("/api/plugins/limpieza-de-temporales/clean", api.adminOnly, (req, res) => res.json({ success: true, ...clean() }));
    api.post("/api/plugins/limpieza-de-temporales/config", api.adminOnly, (req, res) => {
      const n = (v, d, lo, hi) => Math.min(hi, Math.max(lo, parseInt(v, 10) || d));
      api.data.write("config", { enabled: !!req.body?.enabled, everyH: n(req.body?.everyH, DEF.everyH, 1, 720), olderH: n(req.body?.olderH, DEF.olderH, 6, 8760) }); res.json({ success: true });
    });
  },
  deactivate(api) { clearInterval(api._timer); },
};
