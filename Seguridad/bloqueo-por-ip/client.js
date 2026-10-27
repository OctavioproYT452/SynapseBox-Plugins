// Sección «Bloqueo por IP» en Administración → Extensiones.
SynapseBox.admin({
  id: "bloqueo-por-ip", title: "Bloqueo por IP",
  async render(el, h) {
    const load = async () => {
      const c = await h.api("/api/plugins/bloqueo-por-ip/config");
      el.innerHTML = h.head("Bloqueo por IP", "Las IP bloqueadas reciben «403 Acceso denegado». El acceso local y las IP permitidas nunca se bloquean.") + `
      <div class="card" style="display:grid;gap:12px;max-width:640px">
        <small class="muted">Tu IP actual: <b>${h.esc(c.me)}</b></small>
        ${h.fld("IP bloqueadas", "Una por línea. Admite comodín final: 203.0.113.*", `<textarea class="input" rows="7" id="ib-deny">${h.esc(c.deny.join("\n"))}</textarea>`)}
        ${h.fld("IP siempre permitidas", "Tienen prioridad sobre las bloqueadas (por ejemplo, tu oficina dentro de un rango bloqueado)", `<textarea class="input" rows="3" id="ib-allow">${h.esc(c.allow.join("\n"))}</textarea>`)}
        <div class="row"><button class="btn" id="ib-save">Guardar</button></div>
      </div>
      <div class="card" style="margin-top:12px"><div class="row"><h4 class="h0 grow">Intentos bloqueados: ${c.total}</h4>${c.total ? `<button class="btn sm ghost" id="ib-clr">Vaciar</button>` : ""}</div>
        ${c.recent.length ? `<div class="scroll"><table class="tbl rt"><thead><tr><th>Fecha</th><th>IP</th><th>Ruta</th></tr></thead><tbody>${c.recent.map(r => `<tr><td data-l="Fecha">${new Date(r.t).toLocaleString()}</td><td data-l="IP">${h.esc(r.ip)}</td><td data-l="Ruta"><small>${h.esc(r.url)}</small></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Aún no se ha bloqueado ningún intento.</p>`}</div>`;
      const lines = id => el.querySelector(id).value.split("\n");
      el.querySelector("#ib-save").onclick = async () => { try { await h.api("/api/plugins/bloqueo-por-ip/config", { deny: lines("#ib-deny"), allow: lines("#ib-allow") }); h.toast("Guardado"); load(); } catch (e) { h.toast(e.message, 1); } };
      const clr = el.querySelector("#ib-clr"); if (clr) clr.onclick = async () => { await h.api("/api/plugins/bloqueo-por-ip/clear-stats", {}); load(); };
    };
    await load();
  },
});
