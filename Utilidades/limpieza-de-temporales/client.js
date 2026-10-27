// Sección «Temporales» en Administración → Extensiones.
SynapseBox.admin({
  id: "limpieza-de-temporales", title: "Temporales",
  async render(el, h) {
    const load = async () => {
      const s = await h.api("/api/plugins/limpieza-de-temporales/status"), c = s.config, stat = (l, v) => `<div class="card stat"><div><small>${l}</small><b>${v}</b></div></div>`;
      el.innerHTML = h.head("Limpieza de temporales", "Borra de la carpeta temporal lo que lleva mucho tiempo sin usarse.", `<button class="btn" id="lt-n">Limpiar ahora</button>`) + `
      <div class="stats">${stat("Elementos", s.files)}${stat("Ocupan", h.fmt(s.bytes))}${stat("Antiguos (se borrarían)", s.old + " · " + h.fmt(s.oldBytes))}${stat("Última limpieza", s.last ? new Date(s.last.t).toLocaleString() + " (" + s.last.removed + ")" : "—")}</div>
      <div class="card" style="display:grid;gap:12px;max-width:520px;margin-top:12px">
        ${h.chk("lt-on", "Limpieza automática", "", c.enabled)}
        ${h.fld("Revisar cada (horas)", "", `<input class="input" type="number" id="lt-e" min="1" max="720" value="${c.everyH}">`)}
        ${h.fld("Borrar lo que tenga más de (horas)", "Mínimo 6, para no tocar subidas en curso", `<input class="input" type="number" id="lt-o" min="6" max="8760" value="${c.olderH}">`)}
        <div class="row"><button class="btn ghost" id="lt-s">Guardar</button></div></div>`;
      el.querySelector("#lt-n").onclick = async () => { if (await h.yes("Limpiar ahora", "Se borrarán los temporales antiguos.")) { const r = await h.api("/api/plugins/limpieza-de-temporales/clean", {}); h.toast(`Eliminados ${r.removed} elementos (${h.fmt(r.bytes)})`); load(); } };
      el.querySelector("#lt-s").onclick = async () => { try { await h.api("/api/plugins/limpieza-de-temporales/config", { enabled: el.querySelector("#lt-on").checked, everyH: el.querySelector("#lt-e").value, olderH: el.querySelector("#lt-o").value }); h.toast("Guardado"); load(); } catch (e) { h.toast(e.message, 1); } };
    };
    await load();
  },
});
