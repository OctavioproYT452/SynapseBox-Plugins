// Botón flotante solo en las páginas de administración
SynapseBox.ready(async () => {
  if (!SynapseBox.page.startsWith("admin")) return;
  try { const s = await SynapseBox.session(); if (!s.admin) return; } catch { return; }
  const b = document.createElement("button");
  b.className = "btn ghost"; b.textContent = "IPs bloqueadas";
  b.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:50";
  b.onclick = async () => {
    const { deny } = await SynapseBox.api("/api/plugins/bloqueo-por-ip/config");
    dialog("IPs bloqueadas", `<small>Una por línea. Admite comodín final, por ejemplo 203.0.113.*</small><textarea class="input" rows="8" id="ips">${esc(deny.join("\n"))}</textarea>`,
      async d => { await SynapseBox.api("/api/plugins/bloqueo-por-ip/config", { deny: d.querySelector("#ips").value.split("\n") }); toast("Guardado"); }, "Guardar");
  };
  document.body.append(b);
});
