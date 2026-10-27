// Sección «CORS» en Administración → Extensiones.
SynapseBox.admin({
  id: "cors-configurable", title: "CORS",
  async render(el, h) {
    const c = await h.api("/api/plugins/cors-configurable/config");
    el.innerHTML = h.head("CORS", "Qué páginas web de otros dominios pueden llamar a la API desde el navegador.") + `<div class="card" style="display:grid;gap:12px;max-width:640px">
      ${h.fld("Orígenes permitidos", "Uno por línea, por ejemplo https://miweb.com. «*» permite todos (solo sin cookies).", `<textarea class="input" id="co-o" rows="6">${h.esc(c.origins.join("\n"))}</textarea>`)}
      ${h.chk("co-c", "Permitir cookies de sesión", "Solo con orígenes concretos. Hazlo únicamente con webs de tu confianza.", c.credentials)}
      <div class="row"><button class="btn" id="co-s">Guardar</button></div></div>`;
    el.querySelector("#co-s").onclick = async () => { try { await h.api("/api/plugins/cors-configurable/config", { origins: el.querySelector("#co-o").value.split("\n"), credentials: el.querySelector("#co-c").checked }); h.toast("Guardado"); } catch (e) { h.toast(e.message, 1); } };
  },
});
