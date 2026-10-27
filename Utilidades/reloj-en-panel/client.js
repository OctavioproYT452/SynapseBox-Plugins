// Reloj flotante con 8 diseños. Se configura en Administración → Extensiones → Reloj.
(() => {
  const NAMES = { pildora: "Píldora", minimal: "Minimalista", neon: "Neón", lcd: "LCD retro", vidrio: "Vidrio", terminal: "Terminal", analogico: "Analógico", flip: "Flip" };
  const SIZE = { s: .85, m: 1, l: 1.4 };
  const CSS = `
.sbclk{position:fixed;z-index:50;font:600 calc(13px*var(--k,1)) system-ui;line-height:1.2;white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--text,#fff)}
.sbclk.tl{left:12px;top:12px}.sbclk.tr{right:12px;top:12px}.sbclk.bl{left:12px;bottom:12px}.sbclk.br{right:12px;bottom:12px}
.sbclk.static{position:static;display:inline-block}.sbclk.ct{pointer-events:none}
.sbclk .d{display:block;font-size:.78em;font-weight:500;opacity:.75;margin-top:2px}
.sbclk.pildora{padding:.5em 1em;border-radius:999px;background:var(--card,#222);border:1px solid var(--line,#444)}
.sbclk.minimal{font-weight:300;font-size:calc(22px*var(--k,1));text-shadow:0 1px 6px rgba(0,0,0,.45);letter-spacing:.02em}
.sbclk.neon{padding:.5em 1em;border-radius:10px;background:#05060c;color:#5ff;font-family:ui-monospace,Menlo,Consolas,monospace;border:1px solid #5ff6;text-shadow:0 0 6px #5ff,0 0 14px #0ff;box-shadow:0 0 14px #0ff4,inset 0 0 12px #0ff1}
.sbclk.lcd{padding:.5em .9em;border-radius:6px;background:#9db38a;color:#1b2515;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;letter-spacing:.12em;border:2px solid #2d3a24;box-shadow:inset 0 0 8px #0004}
.sbclk.vidrio{padding:.55em 1.1em;border-radius:14px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(10px) saturate(1.4);-webkit-backdrop-filter:blur(10px) saturate(1.4);box-shadow:0 6px 20px #0003;text-shadow:0 1px 2px #0005}
.sbclk.terminal{padding:.5em .9em;border-radius:6px;background:#0b0f0b;color:#4ade80;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:500;border:1px solid #1f3a1f}
.sbclk.terminal i{color:#86efac;font-style:normal;opacity:.7}.sbclk.terminal b{animation:sbblink 1s steps(1) infinite}@keyframes sbblink{50%{opacity:0}}
.sbclk.analogico{text-align:center;padding:.5em;border-radius:16px;background:var(--card,#222);border:1px solid var(--line,#444)}
.sbclk.analogico svg{display:block;width:calc(84px*var(--k,1));height:calc(84px*var(--k,1));margin:0 auto}
.sbclk.flip{display:flex;flex-wrap:wrap;gap:.3em;align-items:center;justify-content:center;max-width:calc(230px*var(--k,1))}.sbclk.flip .c{background:#1c1c20;color:#f2f2f2;border-radius:6px;padding:.35em .45em;font-size:calc(20px*var(--k,1));font-weight:700;position:relative;box-shadow:0 2px 6px #0006}
.sbclk.flip .c:after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:#000a}.sbclk.flip .s{opacity:.7}.sbclk.flip .d{flex-basis:100%}
`;
  function parts(cfg) {
    const o = { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: cfg.h24 ? "h23" : "h12" };
    if (cfg.tz) o.timeZone = cfg.tz;
    const p = Object.fromEntries(new Intl.DateTimeFormat("es", o).formatToParts(new Date()).filter(x => x.type !== "literal").map(x => [x.type, x.value]));
    const dopt = { weekday: "short", day: "numeric", month: "short" }; if (cfg.tz) dopt.timeZone = cfg.tz;
    return { h: p.hour, m: p.minute, s: p.second, ap: (p.dayPeriod || "").toLowerCase(), date: new Intl.DateTimeFormat("es", dopt).format(new Date()) };
  }
  function inner(cfg) {
    const t = parts(cfg), hm = t.h + ":" + t.m, hms = cfg.seconds ? hm + ":" + t.s : hm, ap = t.ap ? " " + t.ap : "";
    const d = cfg.date ? `<span class="d">${t.date}</span>` : "";
    switch (cfg.design) {
      case "terminal": return `<i>$</i> ${hms}${ap}<b>_</b>${d}`;
      case "flip": return [...t.h, ":", ...t.m, ...(cfg.seconds ? [":", ...t.s] : [])].map(c => c === ":" ? `<span class="s">:</span>` : `<span class="c">${c}</span>`).join("") + (t.ap ? `<span class="s">${t.ap}</span>` : "") + d;
      case "analogico": {
        const h = (+t.h % 12) + +t.m / 60, a = (deg, len, w, col) => `<line x1="50" y1="50" x2="${50 + len * Math.sin(deg * Math.PI / 180)}" y2="${50 - len * Math.cos(deg * Math.PI / 180)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
        const ticks = Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="8" x2="50" y2="${i % 3 ? 12 : 15}" stroke="currentColor" stroke-width="${i % 3 ? 1.5 : 2.5}" transform="rotate(${i * 30} 50 50)" opacity=".7"/>`).join("");
        return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/>${ticks}${a(h * 30, 24, 4, "currentColor")}${a(+t.m * 6, 35, 3, "currentColor")}${cfg.seconds ? a(+t.s * 6, 38, 1.5, "#ef4444") : ""}<circle cx="50" cy="50" r="3" fill="#ef4444"/></svg>${d}`;
      }
      default: return hms + ap + d;
    }
  }
  function apply(el, cfg, extra) {
    el.className = `sbclk ${cfg.design} ${extra || cfg.pos}${extra ? "" : cfg.clickThrough ? " ct" : ""}`;
    el.style.setProperty("--k", SIZE[cfg.size] || 1); el.style.opacity = extra ? 1 : cfg.opacity / 100;
    el.innerHTML = inner(cfg);
  }
  const ensureCss = () => { if (!document.getElementById("sbclk-css")) SynapseBox.css(CSS, "sbclk-css"); };

  SynapseBox.ready(async () => {
    ensureCss();
    // ----- sección de administración -----
    SynapseBox.admin({
      id: "reloj-en-panel", title: "Reloj",
      async render(el, h) {
        let c = await h.api("/api/plugins/reloj-en-panel/config");
        const sel = (id, opts, v) => `<select class="input" id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${k === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
        const draw = () => {
          el.innerHTML = h.head("Reloj flotante", "Elige un diseño y cómo se muestra en todas las páginas.") + `
          <div class="card"><h4 class="h0">Diseño</h4><div id="rk-g" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
            ${c.designs.map(d => `<button type="button" class="card" data-d="${d}" style="cursor:pointer;text-align:center;display:grid;gap:8px;justify-items:center;${d === c.design ? "outline:2px solid var(--accent)" : ""}"><span class="rk-p" data-p="${d}"></span><small>${NAMES[d]}</small></button>`).join("")}
          </div></div>
          <div class="card" style="display:grid;gap:12px;max-width:640px;margin-top:12px">
            ${h.fld("Posición", "", sel("rk-pos", [["tl", "Arriba izquierda"], ["tr", "Arriba derecha"], ["bl", "Abajo izquierda"], ["br", "Abajo derecha"]], c.pos))}
            ${h.fld("Tamaño", "", sel("rk-size", [["s", "Pequeño"], ["m", "Normal"], ["l", "Grande"]], c.size))}
            ${h.fld("Zona horaria", "Vacío = la del navegador. Ejemplo: Europe/Madrid o America/Mexico_City", `<input class="input" id="rk-tz" value="${h.esc(c.tz)}" maxlength="60">`)}
            ${h.fld("Opacidad (%)", "", `<input class="input" id="rk-op" type="number" min="20" max="100" value="${c.opacity}">`)}
            ${h.fld("Mostrar en", "", sel("rk-pages", [["all", "Todas las páginas"], ["no-admin", "Todas menos administración"], ["panel", "Solo el panel de archivos"]], c.pages))}
            ${h.chk("rk-h24", "Formato de 24 horas", "", c.h24)}${h.chk("rk-s", "Mostrar segundos", "", c.seconds)}${h.chk("rk-date", "Mostrar la fecha", "", c.date)}
            ${h.chk("rk-ct", "No estorbar", "Los clics atraviesan el reloj, así que nunca tapa botones ni enlaces.", c.clickThrough)}
            <div class="row"><button class="btn" id="rk-save">Guardar</button></div>
          </div>`;
          const live = () => { el.querySelectorAll(".rk-p").forEach(p => { const e = p.firstChild || p.appendChild(document.createElement("div")); apply(e, { ...c, design: p.dataset.p, seconds: true, date: false, size: "s" }, "static"); }); };
          live(); clearInterval(draw.t); draw.t = setInterval(() => { if (!document.body.contains(el.querySelector(".rk-p"))) return clearInterval(draw.t); live(); }, 1000);
          el.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { c = read(); c.design = b.dataset.d; draw(); });
          el.querySelector("#rk-save").onclick = async () => { try { await h.api("/api/plugins/reloj-en-panel/config", read()); h.toast("Reloj guardado"); } catch (e) { h.toast(e.message, 1); } };
        };
        const read = () => ({ ...c, pos: el.querySelector("#rk-pos").value, size: el.querySelector("#rk-size").value, tz: el.querySelector("#rk-tz").value, opacity: el.querySelector("#rk-op").value, pages: el.querySelector("#rk-pages").value, h24: el.querySelector("#rk-h24").checked, seconds: el.querySelector("#rk-s").checked, date: el.querySelector("#rk-date").checked, clickThrough: el.querySelector("#rk-ct").checked });
        draw();
      },
    });
    // ----- reloj flotante -----
    let cfg; try { cfg = await SynapseBox.api("/api/plugins/reloj-en-panel/config"); } catch { return; }
    const page = SynapseBox.page;
    if (cfg.pages === "no-admin" && page.startsWith("admin")) return;
    if (cfg.pages === "panel" && page !== "panel") return;
    const el = document.createElement("div"); document.body.append(el);
    const tick = () => apply(el, cfg); tick(); setInterval(tick, 1000);
  });
})();
