// Botón flotante solo en las páginas de administración
SynapseBox.ready(async () => {
  if (!SynapseBox.page.startsWith("admin")) return;
  try { const s = await SynapseBox.session(); if (!s.admin) return; } catch { return; }
  const b = document.createElement("button");
  b.className = "btn ghost"; b.style.cssText = "position:fixed;left:12px;bottom:56px;z-index:50";
  const paint = s => b.textContent = "Mantenimiento: " + (s.on ? "ACTIVO" : "apagado");
  paint(await SynapseBox.api("/api/plugins/modo-mantenimiento/state"));
  b.onclick = async () => {
    const s = await SynapseBox.api("/api/plugins/modo-mantenimiento/state");
    dialog("Modo mantenimiento", `<label class="fld"><span>Mensaje para los usuarios</span><input class="input" id="mm" value="${esc(s.msg)}"></label><label class="chk"><input type="checkbox" id="mo" ${s.on ? "checked" : ""}><span><b>Activar</b><small>Los administradores siguen entrando con normalidad.</small></span></label>`,
      async d => { paint(await SynapseBox.api("/api/plugins/modo-mantenimiento/state", { on: d.querySelector("#mo").checked, msg: d.querySelector("#mm").value })); toast("Guardado"); }, "Guardar");
  };
  document.body.append(b);
});
