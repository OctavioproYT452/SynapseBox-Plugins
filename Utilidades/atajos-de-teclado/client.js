// Atajos: Alt+H → panel · Alt+A → admin · Alt+T → temas
const RUTAS = { h: "/panel.html", a: "/admin/index.html", t: "/themes.html" };
addEventListener("keydown", e => {
  if (!e.altKey || e.ctrlKey || e.metaKey) return;
  const r = RUTAS[e.key.toLowerCase()];
  if (r) { e.preventDefault(); location.href = r; }
});
