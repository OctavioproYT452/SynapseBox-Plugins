// Atajos: modificador + tecla → página. Configurables en Administración → Extensiones → Atajos.
(() => {
  const MODS = { alt: "Alt", ctrl: "Ctrl", shift: "Shift" };
  let cfg = { mod: "alt", keys: { h: "/panel.html", a: "/admin/index.html", t: "/themes.html" } };
  fetch("/api/plugins/atajos-de-teclado/config").then(r => r.ok ? r.json() : null).then(c => { if (c && c.keys) cfg = c; }).catch(() => { });
  addEventListener("keydown", e => {
    const t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    const m = { alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey }, want = cfg.mod;
    if (typing && want !== "alt") return;
    if (!m[want] || Object.keys(m).some(k => k !== want && m[k]) || e.metaKey) return;
    const r = cfg.keys[(e.key || "").toLowerCase()];
    if (r) { e.preventDefault(); location.href = r; }
  });
  SynapseBox.admin({
    id: "atajos-de-teclado", title: "Atajos",
    async render(el, h) {
      const c = await h.api("/api/plugins/atajos-de-teclado/config"), rows = Object.entries(c.keys);
      const rowH = ([k, v]) => `<div class="row at-r" style="gap:8px"><input class="input at-k" maxlength="1" value="${h.esc(k)}" style="width:64px;text-align:center"><input class="input at-v grow" value="${h.esc(v)}" placeholder="/panel.html"><button class="btn sm ghost dng at-d" type="button">${h.ic("trash")}</button></div>`;
      el.innerHTML = h.head("Atajos de teclado", "Pulsa el modificador y una tecla para saltar a una página.") + `<div class="card" style="display:grid;gap:12px;max-width:640px">
        ${h.fld("Modificador", "", `<select class="input" id="at-mod">${Object.entries(MODS).map(([k, l]) => `<option value="${k}" ${k === c.mod ? "selected" : ""}>${l}</option>`).join("")}</select>`)}
        <div id="at-list" style="display:grid;gap:8px">${rows.map(rowH).join("")}</div>
        <div class="row"><button class="btn ghost" id="at-add" type="button">Añadir atajo</button><button class="btn" id="at-save">Guardar</button></div>
        <small class="muted">Rutas que empiezan por «/», por ejemplo /panel.html. Con Ctrl o Shift no se activan mientras escribes en un campo.</small></div>`;
      const bind = r => r.querySelector(".at-d").onclick = () => r.remove();
      el.querySelectorAll(".at-r").forEach(bind);
      el.querySelector("#at-add").onclick = () => { const d = document.createElement("div"); d.innerHTML = rowH(["", "/"]); const r = d.firstElementChild; el.querySelector("#at-list").append(r); bind(r); };
      el.querySelector("#at-save").onclick = async () => {
        const keys = {}; el.querySelectorAll(".at-r").forEach(r => { const k = r.querySelector(".at-k").value.trim().toLowerCase(), v = r.querySelector(".at-v").value.trim(); if (k && v) keys[k] = v; });
        try { await h.api("/api/plugins/atajos-de-teclado/config", { mod: el.querySelector("#at-mod").value, keys }); h.toast("Guardado. Recarga las páginas abiertas para aplicarlo."); } catch (e) { h.toast(e.message, 1); }
      };
    },
  });
})();
