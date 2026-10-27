// Muestra el mensaje una sola vez por navegador (en el panel) + sección de ajustes.
SynapseBox.admin({
  id: "mensaje-de-bienvenida", title: "Bienvenida",
  async render(el, h) {
    const c = await h.api("/api/plugins/mensaje-de-bienvenida/config");
    el.innerHTML = h.head("Mensaje de bienvenida", "Una ventana que cada persona ve una sola vez al entrar al panel.") + `<div class="card" style="display:grid;gap:12px;max-width:640px">
      ${h.chk("mb-on", "Mostrar el mensaje", "", c.enabled)}
      ${h.fld("Título", "", `<input class="input" id="mb-t" maxlength="80" value="${h.esc(c.title)}">`)}
      ${h.fld("Texto", "Admite saltos de línea. No admite formato.", `<textarea class="input" id="mb-x" rows="6" maxlength="2000">${h.esc(c.text)}</textarea>`)}
      ${h.chk("mb-n", "Mostrar de nuevo a todos", "Marca esto al guardar si has cambiado el mensaje y quieres que quien ya lo vio lo vuelva a ver.", false)}
      <div class="row"><button class="btn" id="mb-s">Guardar</button></div></div>`;
    el.querySelector("#mb-s").onclick = async () => { try { await h.api("/api/plugins/mensaje-de-bienvenida/config", { enabled: el.querySelector("#mb-on").checked, title: el.querySelector("#mb-t").value, text: el.querySelector("#mb-x").value, renew: el.querySelector("#mb-n").checked }); h.toast("Guardado"); } catch (e) { h.toast(e.message, 1); } };
  },
});
SynapseBox.ready(async () => {
  if (SynapseBox.page !== "panel") return;
  let c; try { c = await SynapseBox.api("/api/plugins/mensaje-de-bienvenida/config"); } catch { return; }
  if (!c.enabled || !c.text.trim()) return;
  const key = "sb-welcome-" + c.rev;
  try { if (localStorage.getItem(key)) return; } catch { /* sin almacenamiento: se muestra siempre */ }
  const d = document.createElement("dialog");
  d.style.cssText = "max-width:min(460px,92vw);border:1px solid var(--line,#444);border-radius:16px;background:var(--card,#222);color:var(--text,#fff);padding:22px";
  const t = document.createElement("h3"), p = document.createElement("p"), b = document.createElement("button");
  t.textContent = c.title; p.textContent = c.text; p.style.whiteSpace = "pre-wrap"; b.className = "btn"; b.textContent = "Entendido";
  b.onclick = () => { try { localStorage.setItem(key, "1"); } catch { /* da igual */ } d.close(); d.remove(); };
  d.append(t, p, b); document.body.append(d); d.showModal();
});
