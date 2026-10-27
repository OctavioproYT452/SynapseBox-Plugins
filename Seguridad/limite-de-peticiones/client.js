// Sección «Límite de peticiones» en Administración → Extensiones.
SynapseBox.admin({
  id: "limite-de-peticiones", title: "Límite de peticiones",
  async render(el, h) {
    const load = async () => {
      const s = await h.api("/api/plugins/limite-de-peticiones/status"), c = s.config, num = (id, l, hint, v) => h.fld(l, hint, `<input class="input" type="number" id="${id}" value="${v}" min="1">`);
      el.innerHTML = h.head("Límite de peticiones", "Frena el abuso y los ataques de fuerza bruta. Los administradores y el acceso local nunca se limitan.") + `
      <div class="stats"><div class="card stat"><div><small>Bloqueadas desde el reinicio</small><b>${s.blocked}</b></div></div><div class="card stat"><div><small>IP vigiladas ahora</small><b>${s.tracking}</b></div></div></div>
      <div class="card" style="display:grid;gap:12px;max-width:640px;margin-top:12px">
        ${h.chk("lp-on", "Activar el límite", "", c.enabled)}
        ${num("lp-max", "Peticiones máximas por IP", "Dentro de la ventana de tiempo de abajo", c.max)}${num("lp-win", "Ventana (segundos)", "", c.windowSec)}
        ${num("lp-lm", "Intentos de inicio de sesión por IP", "Al superarlos se bloquea el login de esa IP hasta que acabe la ventana", c.loginMax)}${num("lp-lw", "Ventana del inicio de sesión (minutos)", "", c.loginWindowMin)}
        <div class="row"><button class="btn" id="lp-save">Guardar</button><button class="btn ghost" id="lp-reset">Reiniciar contadores</button></div></div>
      ${s.top.length ? `<div class="card" style="margin-top:12px"><h4 class="h0">IP más bloqueadas</h4><div class="scroll"><table class="tbl rt"><thead><tr><th>IP</th><th>Bloqueos</th></tr></thead><tbody>${s.top.map(t => `<tr><td data-l="IP">${h.esc(t.ip)}</td><td data-l="Bloqueos">${t.n}</td></tr>`).join("")}</tbody></table></div></div>` : ""}`;
      const v = id => el.querySelector(id).value;
      el.querySelector("#lp-save").onclick = async () => { try { await h.api("/api/plugins/limite-de-peticiones/config", { enabled: el.querySelector("#lp-on").checked, max: v("#lp-max"), windowSec: v("#lp-win"), loginMax: v("#lp-lm"), loginWindowMin: v("#lp-lw") }); h.toast("Guardado"); load(); } catch (e) { h.toast(e.message, 1); } };
      el.querySelector("#lp-reset").onclick = async () => { await h.api("/api/plugins/limite-de-peticiones/reset", {}); load(); };
    };
    await load();
  },
});
