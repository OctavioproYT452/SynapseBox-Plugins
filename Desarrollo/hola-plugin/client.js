// Plantilla de cliente. «SynapseBox» ofrece: page, ready, api, css, html, toast, on, emit, session, admin
SynapseBox.ready(async () => {
  if (SynapseBox.page !== "panel") return;
  try { const r = await SynapseBox.api("/api/plugins/hola-plugin/saludo"); SynapseBox.toast(r.mensaje); } catch {}
});

// Sección propia en Administración → Extensiones (así NO hace falta ningún botón flotante).
// render(el, h): «el» es el contenedor; «h» trae head, fld, chk, esc, toast, api, dialog, yes, ic, fmt.
SynapseBox.admin({
  id: "hola-plugin", title: "Hola plugin",
  async render(el, h) {
    const c = await h.api("/api/plugins/hola-plugin/config");
    el.innerHTML = h.head("Hola plugin", "Ejemplo de sección de configuración.") + `<div class="card" style="display:grid;gap:12px;max-width:520px">
      ${h.fld("Mensaje de saludo", "Se muestra como aviso al abrir el panel.", `<input class="input" id="hp-m" value="${h.esc(c.mensaje)}" maxlength="120">`)}
      <div class="row"><button class="btn" id="hp-s">Guardar</button></div></div>`;
    el.querySelector("#hp-s").onclick = async () => { try { await h.api("/api/plugins/hola-plugin/config", { mensaje: el.querySelector("#hp-m").value }); h.toast("Guardado"); } catch (e) { h.toast(e.message, 1); } };
  },
});
