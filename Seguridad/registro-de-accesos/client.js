// Sección «Registro» en Administración → Extensiones: tabla con filtros, exportación CSV y ajustes.
SynapseBox.admin({
  id: "registro-de-accesos", title: "Registro",
  async render(el, h) {
    let { log, config } = await h.api("/api/plugins/registro-de-accesos/log"), q = "", only = "";
    const rows = () => log.filter(r => (!only || (only === "err" ? r.status >= 400 : r.m === only)) && (!q || [r.user, r.url, r.ip].join(" ").toLowerCase().includes(q))).slice(0, 300);
    const table = () => { const r = rows(); el.querySelector("#rg-t").innerHTML = r.length ? `<div class="scroll"><table class="tbl rt"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Estado</th><th>IP</th></tr></thead><tbody>${r.map(x => `<tr><td data-l="Fecha">${new Date(x.t).toLocaleString()}</td><td data-l="Usuario">${h.esc(x.user || "—")}</td><td data-l="Acción"><b>${x.m}</b> <small>${h.esc(x.url)}</small></td><td data-l="Estado"><span class="badge ${x.status >= 400 ? "bad" : ""}">${x.status}</span></td><td data-l="IP">${h.esc(x.ip || "")}</td></tr>`).join("")}</tbody></table></div><small class="muted">${r.length} de ${log.length} registros (se muestran los 300 más recientes)</small>` : `<p class="muted">No hay registros que coincidan.</p>`; };
    const csv = () => { const e = v => '"' + String(v ?? "").replace(/"/g, '""') + '"'; const t = "fecha,usuario,metodo,ruta,estado,ip\n" + log.map(x => [new Date(x.t).toISOString(), x.user, x.m, x.url, x.status, x.ip].map(e).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv" })); a.download = "registro-synapsebox.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
    el.innerHTML = h.head("Registro de actividad", "Qué se ha modificado, quién y desde dónde.", `<div class="row"><button class="btn ghost sm" id="rg-csv">Exportar CSV</button><button class="btn ghost sm dng" id="rg-clr">Vaciar</button></div>`) + `
      <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap"><input class="input" id="rg-q" placeholder="Buscar usuario, ruta o IP…" style="max-width:280px"><select class="input" id="rg-f" style="max-width:180px"><option value="">Todo</option><option value="err">Solo errores</option>${["POST", "PUT", "PATCH", "DELETE", "GET"].map(m => `<option>${m}</option>`).join("")}</select></div><div id="rg-t" style="margin-top:10px"></div></div>
      <details class="card" style="margin-top:12px;max-width:640px"><summary><b>Ajustes</b></summary><div style="display:grid;gap:12px;margin-top:10px">
        ${h.fld("Máximo de registros guardados", "Entre 50 y 5000", `<input class="input" type="number" id="rg-max" min="50" max="5000" value="${config.max}">`)}
        ${["POST", "PUT", "PATCH", "DELETE", "GET"].map(m => h.chk("rg-m-" + m, "Registrar " + m, m === "GET" ? "Genera mucho volumen" : "", config.methods.includes(m))).join("")}
        ${h.chk("rg-own", "Ignorar mis acciones como administrador", "", config.ignoreOwn)}
        <div class="row"><button class="btn" id="rg-save">Guardar ajustes</button></div></div></details>`;
    table();
    el.querySelector("#rg-q").oninput = e => { q = e.target.value.toLowerCase(); table(); };
    el.querySelector("#rg-f").onchange = e => { only = e.target.value; table(); };
    el.querySelector("#rg-csv").onclick = csv;
    el.querySelector("#rg-clr").onclick = async () => { if (await h.yes("Vaciar registro", "Se borrarán todos los registros guardados.")) { await h.api("/api/plugins/registro-de-accesos/log", null, "DELETE"); log = []; table(); } };
    el.querySelector("#rg-save").onclick = async () => { try { await h.api("/api/plugins/registro-de-accesos/config", { max: el.querySelector("#rg-max").value, methods: ["POST", "PUT", "PATCH", "DELETE", "GET"].filter(m => el.querySelector("#rg-m-" + m).checked), ignoreOwn: el.querySelector("#rg-own").checked }); h.toast("Ajustes guardados"); } catch (e) { h.toast(e.message, 1); } };
  },
});
