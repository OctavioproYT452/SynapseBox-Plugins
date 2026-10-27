// Cierre de sesión por inactividad (comparte la actividad entre pestañas) + sección de ajustes.
(() => {
  const KEY = "sb-idle-last";
  const get = () => { try { return +localStorage.getItem(KEY) || Date.now(); } catch { return Date.now(); } };
  const set = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* sin almacenamiento */ } };

  SynapseBox.ready(async () => {
    SynapseBox.admin({
      id: "cierre-por-inactividad", title: "Inactividad",
      async render(el, h) {
        const c = await h.api("/api/plugins/cierre-por-inactividad/config");
        el.innerHTML = h.head("Cierre por inactividad", "Cierra la sesión de quien se deja el navegador abierto.") + `<div class="card" style="display:grid;gap:12px;max-width:520px">
          ${h.fld("Minutos sin actividad", "0 = desactivado", `<input class="input" type="number" id="ci-m" min="0" max="1440" value="${c.minutes}">`)}
          ${h.fld("Aviso previo (segundos)", "Se muestra una cuenta atrás con un botón para seguir conectado", `<input class="input" type="number" id="ci-w" min="10" max="600" value="${c.warnSec}">`)}
          ${h.chk("ci-a", "Aplicar también a administradores", "", c.includeAdmins)}
          <div class="row"><button class="btn" id="ci-s">Guardar</button></div></div>`;
        el.querySelector("#ci-s").onclick = async () => { try { await h.api("/api/plugins/cierre-por-inactividad/config", { minutes: el.querySelector("#ci-m").value, warnSec: el.querySelector("#ci-w").value, includeAdmins: el.querySelector("#ci-a").checked }); h.toast("Guardado"); } catch (e) { h.toast(e.message, 1); } };
      },
    });
    let s; try { s = await SynapseBox.session(); } catch { return; }
    if (!s.logged) return;
    let c; try { c = await SynapseBox.api("/api/plugins/cierre-por-inactividad/config"); } catch { return; }
    if (!c.minutes) return;
    const limit = c.minutes * 6e4, warn = Math.min(c.warnSec * 1000, limit);
    let box = null, last = Date.now(); set();
    const act = () => { if (box) return; const n = Date.now(); if (n - last > 2000) { last = n; set(); } };
    ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"].forEach(e => addEventListener(e, act, { passive: true }));
    const close = async () => { try { await SynapseBox.api("/api/logout", {}); } catch { /* da igual */ } location.href = "/"; };
    const hide = () => { box?.remove(); box = null; };
    setInterval(() => {
      const idle = Date.now() - get(), left = limit - idle;
      if (left <= 0) return close();
      if (left > warn) { if (box) hide(); return; }
      if (!box) {
        box = document.createElement("div"); box.setAttribute("role", "alertdialog");
        box.style.cssText = "position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9999;padding:12px 16px;border-radius:12px;background:var(--card,#222);color:var(--text,#fff);border:1px solid var(--warn,#f59e0b);box-shadow:0 8px 30px #0006;display:flex;gap:12px;align-items:center;font:600 14px system-ui";
        box.innerHTML = `<span>Tu sesión se cerrará por inactividad en <b id="ci-n"></b> s</span><button class="btn sm" type="button">Seguir conectado</button>`;
        box.querySelector("button").onclick = () => { set(); last = Date.now(); hide(); };
        document.body.append(box);
      }
      box.querySelector("#ci-n").textContent = Math.ceil(left / 1000);
    }, 1000);
  });
})();
