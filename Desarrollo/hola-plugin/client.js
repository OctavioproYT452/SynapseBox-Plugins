// Plantilla de cliente. «SynapseBox» ofrece: page, ready, api, css, html, toast, on, emit, session
SynapseBox.ready(async () => {
  if (SynapseBox.page !== "panel") return;
  try { const r = await SynapseBox.api("/api/plugins/hola-plugin/saludo"); SynapseBox.toast(r.mensaje); } catch {}
});
