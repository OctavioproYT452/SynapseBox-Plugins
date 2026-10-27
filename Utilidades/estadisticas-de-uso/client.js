// Sección «Estadísticas» en Administración → Extensiones.
SynapseBox.admin({
  id: "estadisticas-de-uso", title: "Estadísticas",
  async render(el, h) {
    const load = async () => {
      const { days, top } = await h.api("/api/plugins/estadisticas-de-uso/stats");
      const max = Math.max(1, ...days.map(d => d.pages + d.api)), tot = k => days.reduce((s, d) => s + d[k], 0), today = days[days.length - 1];
      const stat = (l, v) => `<div class="card stat"><div><small>${l}</small><b>${v}</b></div></div>`;
      el.innerHTML = h.head("Estadísticas de uso", "Últimos 14 días. Los datos de hoy se actualizan cada 30 segundos.", `<button class="btn ghost sm dng" id="eu-r">Reiniciar</button>`) + (days.length ? `
        <div class="stats">${stat("Páginas vistas (14 d)", tot("pages"))}${stat("Llamadas API (14 d)", tot("api"))}${stat("Errores (14 d)", tot("err"))}${stat("IP distintas hoy", today.ips)}</div>
        <div class="card" style="margin-top:12px"><h4 class="h0">Actividad por día</h4><div style="display:flex;align-items:flex-end;gap:6px;height:150px;margin-top:10px">${days.map(d => { const a = (d.pages + d.api) / max * 100; return `<div title="${d.day}: ${d.pages} páginas, ${d.api} API, ${d.err} errores, ${d.ips} IP" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:4px"><div style="width:100%;height:${Math.max(a, 2)}%;border-radius:6px 6px 0 0;background:var(--accent);min-height:3px"></div><small class="muted" style="font-size:10px">${d.day.slice(8)}</small></div>`; }).join("")}</div></div>
        ${top.length ? `<div class="card" style="margin-top:12px"><h4 class="h0">Rutas más usadas hoy</h4><div class="scroll"><table class="tbl rt"><thead><tr><th>Ruta</th><th>Veces</th></tr></thead><tbody>${top.map(([k, n]) => `<tr><td data-l="Ruta"><small>${h.esc(k)}</small></td><td data-l="Veces">${n}</td></tr>`).join("")}</tbody></table></div></div>` : ""}` : `<div class="card"><div class="empty"><b>Aún no hay datos</b><p class="muted">Aparecerán en cuanto alguien use SynapseBox.</p></div></div>`);
      el.querySelector("#eu-r").onclick = async () => { if (await h.yes("Reiniciar estadísticas", "Se borrará todo el histórico.")) { await h.api("/api/plugins/estadisticas-de-uso/reset", {}); load(); } };
    };
    await load();
  },
});
