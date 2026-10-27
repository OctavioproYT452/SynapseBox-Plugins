// Sección «Mantenimiento» en Administración → Extensiones.
SynapseBox.admin({
  id: "modo-mantenimiento", title: "Mantenimiento",
  async render(el, h) {
    const load = async () => {
      const s = await h.api("/api/plugins/modo-mantenimiento/state");
      const local = s.until ? new Date(s.until - new Date(s.until).getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "";
      el.innerHTML = h.head("Modo mantenimiento", "Los usuarios ven un aviso 503; los administradores siguen entrando con normalidad.") + `
      <div class="card" style="display:grid;gap:12px;max-width:640px">
        <p>Estado: <b class="badge ${s.on ? "bad" : ""}">${s.on ? "ACTIVO" : "apagado"}</b>${s.on && s.until ? ` <small class="muted">· termina ${new Date(s.until).toLocaleString()}</small>` : ""}</p>
        ${h.fld("Mensaje para los usuarios", "", `<input class="input" id="mm-msg" maxlength="300" value="${h.esc(s.msg)}">`)}
        ${h.fld("Desactivar automáticamente el…", "Opcional. Si lo dejas vacío, sigue activo hasta que lo apagues.", `<input class="input" type="datetime-local" id="mm-until" value="${local}">`)}
        ${h.chk("mm-on", "Activar mantenimiento", "", s.on)}
        <div class="row"><button class="btn" id="mm-save">Guardar</button></div>
      </div>`;
      el.querySelector("#mm-save").onclick = async () => {
        const u = el.querySelector("#mm-until").value;
        try { await h.api("/api/plugins/modo-mantenimiento/state", { on: el.querySelector("#mm-on").checked, msg: el.querySelector("#mm-msg").value, until: u ? new Date(u).getTime() : 0 }); h.toast("Guardado"); load(); } catch (e) { h.toast(e.message, 1); }
      };
    };
    await load();
  },
});
