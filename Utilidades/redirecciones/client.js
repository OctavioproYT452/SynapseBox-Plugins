// Sección «Redirecciones» en Administración → Extensiones.
SynapseBox.admin({
  id: "redirecciones", title: "Redirecciones",
  async render(el, h) {
    const { rules } = await h.api("/api/plugins/redirecciones/rules");
    const row = r => `<div class="row rd-r" style="gap:8px;flex-wrap:wrap"><input class="input rd-f" placeholder="/corto" value="${h.esc(r.from)}" style="flex:1;min-width:120px"><input class="input rd-t" placeholder="/destino o https://…" value="${h.esc(r.to)}" style="flex:2;min-width:160px"><select class="input rd-c" style="width:110px">${[[301, "301 fija"], [302, "302 temporal"], [307, "307"]].map(([k, l]) => `<option value="${k}" ${k === r.code ? "selected" : ""}>${l}</option>`).join("")}</select><button class="btn sm ghost dng rd-d" type="button">${h.ic("trash")}</button></div>`;
    el.innerHTML = h.head("Redirecciones", "Cuando alguien abra una dirección de la izquierda, irá a la de la derecha.") + `<div class="card" style="display:grid;gap:10px;max-width:760px"><div id="rd-l" style="display:grid;gap:8px">${rules.map(row).join("")}</div><div class="row"><button class="btn ghost" id="rd-a" type="button">Añadir redirección</button><button class="btn" id="rd-s">Guardar</button></div><small class="muted">El origen no puede ser /api, /admin, /plugins, /dav ni /s, para no dejarte sin acceso.</small></div>`;
    const bind = r => r.querySelector(".rd-d").onclick = () => r.remove();
    el.querySelectorAll(".rd-r").forEach(bind);
    el.querySelector("#rd-a").onclick = () => { const d = document.createElement("div"); d.innerHTML = row({ from: "", to: "", code: 302 }); const r = d.firstElementChild; el.querySelector("#rd-l").append(r); bind(r); };
    el.querySelector("#rd-s").onclick = async () => {
      const rules = [...el.querySelectorAll(".rd-r")].map(r => ({ from: r.querySelector(".rd-f").value, to: r.querySelector(".rd-t").value, code: r.querySelector(".rd-c").value }));
      try { await h.api("/api/plugins/redirecciones/rules", { rules }); h.toast("Guardado"); } catch (e) { h.toast(e.message, 1); }
    };
  },
});
