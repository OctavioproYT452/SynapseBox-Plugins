// Añade «Variables BDFD» al menú de usuario del panel: activar, ver el ID y generar la clave.
SynapseBox.ready(() => {
  const m = document.getElementById("umenu");
  if (!m || typeof dialog !== "function") return;
  const addItem = () => {
    const hr = m.querySelector("hr");
    if (!hr || m.querySelector(".bdfd-mi")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "mi bdfd-mi";
    b.innerHTML = `<span class="mic">${ic("code")}</span><span class="grow"><b>Variables BDFD</b><small>API con tu ID y clave para tu bot</small></span>`;
    hr.before(b);
  };
  new MutationObserver(addItem).observe(m, { childList: true }); addItem();
  m.addEventListener("click", e => {
    if (!e.target.closest(".bdfd-mi")) return;
    m.classList.remove("open"); document.querySelector(".uscrim")?.classList.remove("on");
    setTimeout(() => openDialog().catch(x => toast(x.message, 1)), 120);
  });

  async function openDialog() {
    const d = dialog("Variables para BDFD", "<div id=\"bdfd\"></div>");
    const render = async (key) => {
      const s = await SynapseBox.api("/api/plugins/bdfd-variables/me"), box = d.querySelector("#bdfd"), o = location.origin;
      const full = s.limit >= 0 && s.used >= s.limit;
      box.innerHTML = `<p class="muted">Guarda variables de tu bot de BDFD en tu propio almacenamiento (carpeta <b>BDFD-Variables</b>). ${s.limit < 0 ? "Espacio ilimitado." : `Usas ${fmt(s.used)} de ${fmt(s.limit)}.`}</p>
        ${full ? `<p class="badge bad">Almacenamiento lleno: no se pueden guardar más variables hasta que liberes espacio.</p>` : ""}
        <p><b>Estado:</b> ${s.enabled ? "Activado" : "Desactivado"}</p>
        ${s.enabled ? `<label class="fld"><span>Tu ID</span><input class="input" readonly value="${esc(s.uuid)}"></label>` : ""}
        ${key ? `<div class="card" style="border-color:var(--warn)"><b>Tu clave (cópiala ahora, no se vuelve a mostrar):</b><input class="input" readonly value="${esc(key)}" onfocus="this.select()"></div>` : ""}
        ${s.enabled ? `<p class="muted">Copia estos ejemplos a BDFD y cambia <b>TU_CLAVE</b> por tu clave:</p>
          ${[["Probar la conexión", `$httpAddHeader[x-api-key;TU_CLAVE]\n$httpGet[${o}/api/bdfd/${s.uuid}/ping]\n$httpResult[message]`],
             ["Guardar monedas de un usuario", `$httpAddHeader[x-api-key;TU_CLAVE]\n$httpGet[${o}/api/bdfd/${s.uuid}/set?scope=user&id=$authorID&name=monedas&value=100]`],
             ["Leer monedas (0 si no existe)", `$httpAddHeader[x-api-key;TU_CLAVE]\n$httpGet[${o}/api/bdfd/${s.uuid}/get?scope=user&id=$authorID&name=monedas&default=0]\n$httpResult[value]`],
             ["Sumar 10 monedas", `$httpAddHeader[x-api-key;TU_CLAVE]\n$httpGet[${o}/api/bdfd/${s.uuid}/add?scope=user&id=$authorID&name=monedas&value=10]\n$httpResult[value]`]]
            .map(([t, c]) => `<details><summary>${esc(t)}</summary><pre style="white-space:pre-wrap;overflow:auto;font-size:12px">${esc(c)}</pre><button type="button" class="btn sm ghost" data-copy="${esc(c)}">Copiar</button></details>`).join("")}
          <small class="muted">Guía completa con más ejemplos en el README del plugin. Acciones: ping, set, get, add, delete, recover, purge, list, info.</small>` : ""}
        <div class="row" style="margin-top:12px;gap:8px">
          ${s.enabled ? `<button class="btn ghost" id="bd-r">Regenerar clave</button><button class="btn ghost dng" id="bd-o">Desactivar</button>` : `<button class="btn" id="bd-a">Activar y generar clave</button>`}
        </div>`;
      const act = (id, body) => { const b = box.querySelector(id); if (b) b.onclick = async () => { try { const r = await SynapseBox.api("/api/plugins/bdfd-variables/enable", body); render(r.key); } catch (x) { toast(x.message, 1); } }; };
      box.querySelectorAll("[data-copy]").forEach(b => b.onclick = () => navigator.clipboard.writeText(b.dataset.copy).then(() => toast("Copiado")));
      act("#bd-a", { enabled: true }); act("#bd-r", { enabled: true, regenerate: true }); act("#bd-o", { enabled: false });
    };
    await render();
  }
});
