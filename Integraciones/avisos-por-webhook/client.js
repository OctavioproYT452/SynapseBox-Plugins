// Sección «Avisos» en Administración → Extensiones.
SynapseBox.admin({
  id: "avisos-por-webhook", title: "Avisos (webhook)",
  async render(el, h) {
    const load = async () => {
      const c = await h.api("/api/plugins/avisos-por-webhook/config"), EV = { login_fail: "Intentos de inicio de sesión fallidos", login_ok: "Inicios de sesión correctos", admin_action: "Acciones de administración", server_start: "Arranque del servidor" };
      el.innerHTML = h.head("Avisos por webhook", "Recibe en Discord (u otro servicio) lo importante que pasa en SynapseBox.") + `<div class="card" style="display:grid;gap:12px;max-width:640px">
        ${h.fld("URL del webhook", c.hasUrl ? "Guardada (oculta). Escribe otra para cambiarla." : "Debe empezar por https://", `<input class="input" id="wh-u" autocomplete="off" placeholder="https://discord.com/api/webhooks/…" value="${h.esc(c.url)}">`)}
        ${h.fld("Formato", "", `<select class="input" id="wh-f"><option value="discord" ${c.format === "discord" ? "selected" : ""}>Discord</option><option value="json" ${c.format === "json" ? "selected" : ""}>JSON genérico ({text, source, time})</option></select>`)}
        ${Object.entries(EV).map(([k, l]) => h.chk("wh-" + k, l, "", c.events[k])).join("")}
        <div class="row"><button class="btn" id="wh-s">Guardar</button><button class="btn ghost" id="wh-t" ${c.hasUrl ? "" : "disabled"}>Enviar prueba</button>${c.hasUrl ? `<button class="btn ghost dng" id="wh-c">Quitar URL</button>` : ""}</div>
        <small class="muted">${c.status.error ? "Último error: " + h.esc(c.status.error) : c.status.last ? "Último aviso enviado: " + new Date(c.status.last).toLocaleString() : "Aún no se ha enviado ningún aviso desde el último reinicio."}</small></div>`;
      const body = extra => ({ url: el.querySelector("#wh-u").value, format: el.querySelector("#wh-f").value, events: Object.fromEntries(Object.keys(EV).map(k => [k, el.querySelector("#wh-" + k).checked])), ...extra });
      el.querySelector("#wh-s").onclick = async () => { try { await h.api("/api/plugins/avisos-por-webhook/config", body()); h.toast("Guardado"); load(); } catch (e) { h.toast(e.message, 1); } };
      el.querySelector("#wh-t").onclick = async () => { try { await h.api("/api/plugins/avisos-por-webhook/test", {}); h.toast("Prueba enviada"); } catch (e) { h.toast(e.message, 1); } };
      const clr = el.querySelector("#wh-c"); if (clr) clr.onclick = async () => { await h.api("/api/plugins/avisos-por-webhook/config", body({ clearUrl: true })); load(); };
    };
    await load();
  },
});
