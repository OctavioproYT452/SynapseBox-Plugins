// Sección «Salud» en Administración → Extensiones: estado en vivo y enlaces para tus monitores.
SynapseBox.admin({
  id: "health-check", title: "Salud",
  async render(el, h) {
    const t0 = performance.now();
    const d = await h.api("/healthz").catch(e => ({ ok: false, error: e.message }));
    const ms = Math.round(performance.now() - t0), up = d.uptime_s || 0;
    const stat = (l, v) => `<div class="card stat"><div><small>${l}</small><b>${v}</b></div></div>`;
    el.innerHTML = h.head("Salud del servidor", "Lo que ven tus monitores (UptimeRobot, Docker, Kubernetes…).", `<button class="btn ghost sm" id="hc-r">Actualizar</button>`) + `
      <div class="stats">${stat("Estado", `<span class="badge ${d.ok ? "" : "bad"}">${d.ok ? "Correcto" : "Con fallos"}</span>`)}${stat("Base de datos", d.db === false ? "Caída" : "OK")}${stat("Activo desde hace", Math.floor(up / 3600) + " h " + Math.floor(up % 3600 / 60) + " min")}${stat("Versión", h.esc(d.version || "—"))}${stat("Respuesta", ms + " ms")}${d.rss_mb ? stat("Memoria (RSS)", d.rss_mb + " MB") + stat("Node", h.esc(d.node || "")) : ""}</div>
      <div class="card" style="margin-top:12px"><b>Dirección para tu monitor</b><input class="input" readonly onfocus="this.select()" value="${h.esc(location.origin)}/healthz"><small class="muted">Responde 200 si todo va bien y 503 si la base de datos falla.</small></div>`;
    el.querySelector("#hc-r").onclick = () => SynapseBox.adminSections.find(x => x.id === "health-check").render(el, h);
  },
});
