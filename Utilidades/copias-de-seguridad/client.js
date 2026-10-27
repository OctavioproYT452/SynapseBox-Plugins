// Sección «Copias» en Administración → Extensiones.
SynapseBox.admin({
  id: "copias-de-seguridad", title: "Copias de seguridad",
  async render(el, h) {
    const load = async () => {
      const { backups, config: c } = await h.api("/api/plugins/copias-de-seguridad/list");
      el.innerHTML = h.head("Copias de seguridad", "Copia de la base de datos (usuarios, enlaces y ajustes). No incluye los archivos de los usuarios.", `<button class="btn" id="cb-new">Crear copia ahora</button>`) + `
      <div class="card" style="display:grid;gap:12px;max-width:640px">
        ${h.fld("Copia automática cada (horas)", "0 = sin copias automáticas", `<input class="input" type="number" id="cb-h" min="0" max="720" value="${c.everyH}">`)}
        ${h.fld("Copias que se conservan", "Las más antiguas se borran solas", `<input class="input" type="number" id="cb-k" min="1" max="100" value="${c.keep}">`)}
        <div class="row"><button class="btn ghost" id="cb-save">Guardar ajustes</button></div></div>
      <div class="card" style="margin-top:12px">${backups.length ? `<div class="scroll"><table class="tbl rt"><thead><tr><th>Copia</th><th>Tamaño</th><th></th></tr></thead><tbody>${backups.map(b => `<tr><td data-l="Copia"><b>${new Date(b.t).toLocaleString()}</b> <small class="muted">${b.auto ? "automática" : "manual"}</small></td><td data-l="Tamaño">${h.fmt(b.size)}</td><td data-l=""><div class="row end"><a class="btn sm ghost" href="/api/plugins/copias-de-seguridad/file/${encodeURIComponent(b.name)}" download>${h.ic("download")}</a><button class="btn sm ghost dng" data-del="${h.esc(b.name)}">${h.ic("trash")}</button></div></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty"><b>Todavía no hay copias</b></div>`}
        <small class="muted">Para restaurar: detén SynapseBox, sustituye <code>data/synapsebox.db</code> por la copia descargada y arráncalo de nuevo.</small></div>`;
      el.querySelector("#cb-new").onclick = async e => { e.target.disabled = true; try { await h.api("/api/plugins/copias-de-seguridad/create", {}); h.toast("Copia creada"); } catch (x) { h.toast(x.message, 1); } load(); };
      el.querySelector("#cb-save").onclick = async () => { try { await h.api("/api/plugins/copias-de-seguridad/config", { everyH: el.querySelector("#cb-h").value, keep: el.querySelector("#cb-k").value }); h.toast("Guardado"); load(); } catch (x) { h.toast(x.message, 1); } };
      el.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => { if (await h.yes("Borrar copia", "Se eliminará del servidor.")) { await h.api("/api/plugins/copias-de-seguridad/file/" + encodeURIComponent(b.dataset.del), null, "DELETE"); load(); } });
    };
    await load();
  },
});
