// Sección «Notas» en Administración → Extensiones: bloc de notas con guardado automático.
SynapseBox.admin({
  id: "notas-del-admin", title: "Notas",
  async render(el, h) {
    const n = await h.api("/api/plugins/notas-del-admin/notes");
    el.innerHTML = h.head("Notas de administración", "Un bloc de notas común para quienes administran este servidor. Se guarda solo.") + `<div class="card"><textarea class="input" id="na-t" rows="16" style="width:100%;font-family:ui-monospace,monospace" maxlength="50000" placeholder="Pendientes, contraseñas de servicios NO, recordatorios…">${h.esc(n.text)}</textarea><small class="muted" id="na-s">${n.t ? "Última edición: " + new Date(n.t).toLocaleString() + (n.by ? " · " + h.esc(n.by) : "") : "Sin notas todavía"}</small></div>`;
    const ta = el.querySelector("#na-t"), st = el.querySelector("#na-s"); let timer;
    ta.oninput = () => { st.textContent = "Guardando…"; clearTimeout(timer); timer = setTimeout(async () => { try { const r = await h.api("/api/plugins/notas-del-admin/notes", { text: ta.value }); st.textContent = "Guardado " + new Date(r.t).toLocaleTimeString(); } catch (e) { st.textContent = "Error: " + e.message; } }, 700); };
  },
});
