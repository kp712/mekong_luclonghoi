/* side.js (Draft 5): the left info panel on the map page (desktop) and the full-screen switch
   for the drawer.
   - #side: before an area is picked, the 5 areas (salt level, usual salt months), the month
     slider (#d5Month from extra.js, moved in here on desktop) and a salt legend; after a pick,
     a short summary of the area for the slider's month (NASA GPM rain, NASA POWER water need,
     salt estimate, NASA MODIS crops a year).
   - #dFull in the drawer head toggles body.drawer-full (drawer over the whole map; the phone
     sheet at full height). Esc leaves full screen before app.js closes the drawer.
   Reads: RX.Core, App (site, lang, openPanel), D5.mon(), MapView (hover, resize).
   Exposes: const Side = { render, full }. Called from D5.area() (extra.js) after every area render
   and language change, and from D5's month slider. */
const Side = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const C = () => (typeof RX !== "undefined" ? RX.Core : null);
  const lang = () => (window.App && App.lang ? App.lang() : (C() ? C().lang : "vi"));
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang()] || o.en || "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const desktop = () => window.matchMedia("(min-width: 761px)").matches;
  const mon = () => (typeof D5 !== "undefined" && D5.mon ? D5.mon() : new Date().getMonth());
  const nf = (n, d = 0) => { const t = (+n).toFixed(d); return lang() === "vi" ? t.replace(".", ",") : t; };

  const T = {
    panel: { vi: "Thông tin khu vực", en: "Area information" },
    eyebrow: { vi: "Bờ biển Sóc Trăng · dữ liệu NASA", en: "Sóc Trăng coast · NASA Earth data" },
    pickH: { vi: "Chọn khu vực của bạn", en: "Choose your area" },
    pickP: { vi: "Chạm vào một khu vực bên dưới hoặc trên bản đồ để xem lịch luân canh 12 tháng.", en: "Tap an area below or on the map to see a 12-month rotation plan." },
    usual: { vi: "Mặn thường", en: "Salt usually" },
    saltNow: { vi: (m) => m.toLowerCase() + " có mặn", en: (m) => "salty in " + m },
    legendH: { vi: "Mức mặn", en: "Salt level" },
    legendNote: { vi: "Độ mặn: ước tính từ báo cáo trạm đo, không phải vệ tinh", en: "Salinity: estimate from station reports, not satellite" },
    chosen: { vi: "Khu vực đã chọn", en: "Selected area" },
    monHint: { vi: "Kéo thanh tháng bên dưới để xem tháng khác", en: "Move the month slider below to see another month" },
    rain: { vi: "Mưa trong tháng", en: "Rain this month" },
    need: { vi: "Cây cần", en: "Crop needs" },
    rainUp: { vi: "Mưa nhiều hơn nhu cầu nước của cây", en: "Rain is above the crop's water need" },
    rainDown: { vi: "Mưa ít hơn nhu cầu nước của cây", en: "Rain is below the crop's water need" },
    salt: { vi: "Mặn tháng này", en: "Salt this month" },
    yes: { vi: "Có", en: "Yes" }, no: { vi: "Không", en: "No" },
    saltSrc: { vi: "Ước tính từ báo cáo trạm đo, không phải vệ tinh", en: "Estimate from station reports, not satellite" },
    crops: { vi: "Số vụ mỗi năm", en: "Crops a year" },
    cropsU: { vi: "vụ/năm", en: "crops/yr" },
    cropsSrc: { vi: "Vệ tinh NASA MODIS ghi nhận", en: "Seen by satellite, NASA MODIS" },
    open: { vi: "Xem kế hoạch cho khu vực này", en: "Open the plan for this area" },
    more: { vi: "Bấm để xem đầy đủ", en: "Tap for full details" }, less: { vi: "Thu gọn", en: "Collapse" },
    other: { vi: "Đổi khu vực", en: "Change area" },
    hint: { vi: "Chạm vào một tỉnh hoặc khu vực trên bản đồ, hoặc gõ tên ở ô tìm kiếm.", en: "Tap a province or area on the map, or type its name in the search box." },
    full: { vi: "Mở toàn màn hình", en: "Full screen" },
    unfull: { vi: "Thu nhỏ", en: "Exit full screen" }
  };
  const LV = { high: { vi: "Mặn cao", en: "High salt" }, medium: { vi: "Mặn vừa", en: "Medium salt" }, low: { vi: "Mặn thấp", en: "Low salt" } };
  const lvOf = (s) => (s && LV[s.level] ? s.level : "medium");
  const lvName = (s) => L((C() && C().UI && C().UI.salt && C().UI.salt[lvOf(s)]) || LV[lvOf(s)]);
  const ICO = {
    chev: '<svg class="sd-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    shrink: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'
  };

  /* ---------- the panel ---------- */
  let side = null;
  let hudOpen = false, hudId = null;   /* the area box starts as a small data HUD; a click opens the full box */
  function ensure() {
    if (side || !document.body) return side;
    side = document.createElement("aside");
    side.id = "side"; side.className = "sd";
    side.innerHTML = '<div id="sdFind"></div><div id="sdTop"></div><div id="sdLayer"></div><div id="sdMonthHost"></div><div id="sdFoot"></div>';   /* #sdFind, #sdLayer: vn.js */
    document.body.appendChild(side);
    document.body.classList.add("has-side");
    side.addEventListener("click", (e) => {
      const x = e.target.closest && e.target.closest("[data-sd]");
      if (!x) { if (side.classList.contains("is-hud") && e.target.closest && e.target.closest("#sdTop") && !e.target.closest("[data-site],button,input,a")) { hudOpen = true; render() } return }   /* rows carry data-site: app.js's page click handler picks the area */
      if (x.dataset.sd === "hud") { hudOpen = !hudOpen; render(); return }
      if (x.dataset.sd === "open" && window.App && App.openPanel) App.openPanel(1);
      if (x.dataset.sd === "ex") { const b = $("#ex3Btn"); b && b.click(); }
    });
    const hov = (e) => { const r = e.target.closest && e.target.closest("[data-site]"); typeof MapView !== "undefined" && MapView.hover && MapView.hover(r ? r.dataset.site : null); };
    side.addEventListener("mouseover", hov); side.addEventListener("focusin", hov);
    side.addEventListener("mouseleave", () => typeof MapView !== "undefined" && MapView.hover && MapView.hover(null));
    side.addEventListener("focusout", (e) => { if (!side.contains(e.relatedTarget)) typeof MapView !== "undefined" && MapView.hover && MapView.hover(null); });
    return side;
  }
  /* The month slider sits in the panel on desktop and floats over the map on phones (as before). */
  function placeSlider() {
    const el = $("#d5Month"), host = $("#sdMonthHost");
    if (!el || !host) return;
    const want = desktop() ? host : document.body;
    if (el.parentNode !== want) want.appendChild(el);
  }

  function rowsHTML(sites, m) {
    const c = C();
    return '<ul class="sd-list">' + sites.map((s) => {
      const now = s.salt.includes(m + 1);
      return `<li><button type="button" class="sd-row${now ? " is-now" : ""}" data-site="${esc(s.id)}">
        <span class="sd-dot lv-${lvOf(s)}" aria-hidden="true"></span>
        <span class="sd-row-t"><b>${esc(c.short(s))}</b><small>${esc(L(T.usual))} ${esc(c.saltRange(s))}</small></span>
        <span class="sd-chip lv-${lvOf(s)}">${esc(lvName(s))}</span>${ICO.chev}</button></li>`;
    }).join("") + "</ul>";
  }
  function legendHTML() {
    return `<div class="sd-legend"><p class="sd-k">${esc(L(T.legendH))}</p><ul>${["high", "medium", "low"].map((k) =>
      `<li><i class="sd-dot lv-${k}" aria-hidden="true"></i>${esc(L((C().UI && C().UI.salt && C().UI.salt[k]) || LV[k]))}</li>`).join("")}</ul>
      <p class="sd-note">${esc(L(T.legendNote))}</p></div>`;
  }
  function areaHTML(id, m) {
    const c = C(), r = c.site(id), rain = Math.round(r.rain[m]), need = Math.round(r.et0[m]);
    const salty = r.salt.includes(m + 1), top = Math.max(rain, need, 1);
    return `<div class="sd-hudh"><p class="sd-eyebrow">${esc(L(T.chosen))}</p><button type="button" class="sd-hudbtn" data-sd="hud" aria-expanded="${hudOpen}">${esc(L(hudOpen ? T.less : T.more))}</button></div>
      <div class="sd-title"><h2 class="sd-h">${esc(c.short(r))}</h2><span class="sd-chip lv-${lvOf(r)}"><i class="sd-dot lv-${lvOf(r)}" aria-hidden="true"></i>${esc(lvName(r))}</span></div>
      <p class="sd-mon"><b>${esc(c.monthsLong()[m])}</b><span>${esc(L(T.monHint))}</span></p>
      <dl class="sd-stats">
        <div class="sd-stat sd-rain"><dt>${esc(L(T.rain))}</dt>
          <dd><b>${nf(rain)} mm</b><span>${esc(L(T.need))} ~${nf(need)} mm</span></dd>
          <dd class="sd-bars" aria-hidden="true"><i class="r" style="width:${(100 * rain / top).toFixed(1)}%"></i><i class="n" style="width:${(100 * need / top).toFixed(1)}%"></i></dd>
          <dd class="sd-say">${esc(L(rain >= need ? T.rainUp : T.rainDown))}</dd>
          <dd class="sd-src">NASA GPM IMERG · NASA POWER</dd></div>
        <div class="sd-stat"><dt>${esc(L(T.salt))}</dt>
          <dd${salty ? ' class="risk"' : ""}><b>${esc(L(salty ? T.yes : T.no))}</b>${salty ? `<span>${esc(lvName(r).toLowerCase())}</span>` : ""}</dd>
          <dd class="sd-src">${esc(L(T.saltSrc))}</dd></div>
        <div class="sd-stat"><dt>${esc(L(T.crops))}</dt>
          <dd><b>${typeof r.crops === "number" ? nf(r.crops, 1) : "–"}</b><span>${esc(L(T.cropsU))}</span></dd>
          <dd class="sd-src">${esc(L(T.cropsSrc))}</dd></div>
      </dl>`;
  }

  function render() {
    const c = C();
    if (!c || !ensure()) return;
    side.setAttribute("aria-label", L(T.panel));
    /* keep keyboard focus across re-renders (the slider re-renders this on every month) */
    const a = document.activeElement, key = a && side.contains(a) && !$("#d5Month", side)?.contains(a)
      ? (a.dataset.site ? `[data-site="${a.dataset.site}"]` : a.dataset.sd ? `[data-sd="${a.dataset.sd}"]` : null) : null;
    const m = mon(), sites = c.sites(), vn = typeof VnMap !== "undefined" && VnMap.card ? VnMap.card() : "";
    const s = !vn && window.App && App.site ? App.site() : null;   /* a province picked on the country map comes first */
    side.classList.toggle("is-area", !!s || !!vn);
    side.classList.toggle("is-prov", !!vn);
    if (s && s.id !== hudId) { hudId = s.id; hudOpen = false }
    side.classList.toggle("is-hud", !!s && !hudOpen);
    if (vn) { $("#sdTop").innerHTML = vn; $("#sdFoot").innerHTML = ""; }
    else if (!s && $("#sdFind") && $("#sdFind").children.length) {   /* nothing picked: the search above and the layer box say it all */
      $("#sdTop").innerHTML = `<p class="sd-lead sd-hint">${esc(L(T.hint))}</p>`; $("#sdFoot").innerHTML = "";
    } else if (!s) {
      const ex = $("#ex3Btn"), exT = ex ? ex.textContent.trim() : "";
      $("#sdTop").innerHTML = `<p class="sd-eyebrow">${esc(L(T.eyebrow))}</p><h2 class="sd-h">${esc(L(T.pickH))}</h2>
        <p class="sd-lead">${esc(L(T.pickP))}</p>${rowsHTML(sites, m)}${exT ? `<button type="button" class="sd-ex" data-sd="ex">${ICO.arrow}<span>${esc(exT)}</span></button>` : ""}`;
      $("#sdFoot").innerHTML = legendHTML();
    } else {
      $("#sdTop").innerHTML = areaHTML(s.id, m);
      const open = document.body.classList.contains("drawer-open");
      $("#sdFoot").innerHTML = (open ? "" : `<button type="button" class="sd-open" data-sd="open"><span>${esc(L(T.open))}</span>${ICO.arrow}</button>`) +
        `<div class="sd-other"><p class="sd-k">${esc(L(T.other))}</p><div class="sd-chips">${sites.filter((x) => x.id !== s.id).map((x) =>
          `<button type="button" data-site="${esc(x.id)}"><i class="sd-dot lv-${lvOf(x)}" aria-hidden="true"></i>${esc(c.short(x))}</button>`).join("")}</div></div>`;
    }
    placeSlider();
    typeof VnMap !== "undefined" && VnMap.mount && !($("#sdFind") || {}).children?.length && VnMap.mount();
    if (key) { const n = side.querySelector(key); n && n.focus({ preventScroll: true }); }
    paintFull();
  }

  /* ---------- full-screen drawer ---------- */
  let want = false;   /* the farmer's choice, kept for this page visit only (no storage) */
  const B = () => document.body;
  const isFull = () => B().classList.contains("drawer-full");
  function fullBtn() {
    const close = $("#dClose");
    if (!close || $("#dFull")) return;
    const wrap = document.createElement("div");
    wrap.className = "d-acts";
    close.parentNode.insertBefore(wrap, close);
    const b = document.createElement("button");
    b.type = "button"; b.className = "icon-btn"; b.id = "dFull";
    b.addEventListener("click", () => setFull(!isFull()));
    wrap.appendChild(b); wrap.appendChild(close);
  }
  function paintFull() {
    const b = $("#dFull"); if (!b) return;
    const on = isFull(), t = L(on ? T.unfull : T.full);
    b.innerHTML = on ? ICO.shrink : ICO.expand;
    b.setAttribute("aria-label", t); b.title = t; b.setAttribute("aria-pressed", on ? "true" : "false");
  }
  /* full screen: each step splits into two columns, answers on the left, results on the right */
  const RIGHT = { v1: "#year, #areaFold", v2: "#bestNow", v4: "#s4m, #d5Cost, #ppRev, #planFold" };
  function split(on) {
    Object.keys(RIGHT).forEach((id) => {
      const v = document.getElementById(id); if (!v) return;
      const l = v.querySelector(":scope > .fc-l"), r = v.querySelector(":scope > .fc-r");
      if (on && !l) {
        const kids = [...v.children]; kids.forEach((k, i) => (k.dataset.fcI = i));
        const L0 = document.createElement("div"), R0 = document.createElement("div"); L0.className = "fc-l"; R0.className = "fc-r";
        kids.forEach((k) => (k.matches(RIGHT[id]) ? R0 : L0).appendChild(k)); v.append(L0, R0); v.classList.add("fc");
      } else if (!on && l) {
        const kids = [...l.children, ...r.children].sort((a, b) => (+(a.dataset.fcI ?? 999)) - (+(b.dataset.fcI ?? 999)));
        kids.forEach((k) => { v.appendChild(k); delete k.dataset.fcI }); l.remove(); r.remove(); v.classList.remove("fc");
      }
    });
  }
  function setFull(on, keepWant) {
    const was = isFull();
    if (on && !B().classList.contains("drawer-open")) on = false;
    B().classList.toggle("drawer-full", !!on);
    try { split(!!on) } catch (e) {}
    if (!keepWant) want = !!on;
    paintFull();
    if (was !== !!on) setTimeout(() => { typeof MapView !== "undefined" && MapView.resize && MapView.resize(); }, 80);
  }
  /* Esc: leave full screen first; app.js's own Esc (modal, settings, tour, guide, close drawer) runs otherwise. */
  const shown = (el) => el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isFull()) return;
    const m = $("#modal");
    if (m && (m.open || m.classList.contains("open"))) return;
    if ($("#gearBtn[aria-expanded='true']")) return;
    if ([...document.querySelectorAll(".tour, .gd")].some(shown)) return;
    e.preventDefault(); e.stopPropagation();
    setFull(false);
    const b = $("#dFull"); b && b.focus({ preventScroll: true });
  }, true);

  /* step 2 in two pages: (a) what you grow and your field, only inputs; Next -> (b) the priority sliders and best plan; Next -> step 3 */
  const W2 = { a: { vi: "Ruộng của bạn trồng gì?", en: "What do you grow?" }, aSub: { vi: "Chọn cho từng vụ, rồi bấm Tiếp", en: "Pick for each season, then tap Next" }, next: { vi: "Tiếp: điều bạn coi trọng", en: "Next: what matters to you" } };
  let sub = "a", lastView = null, saved = null;
  const v2 = () => document.getElementById("v2"), v2on = () => { const v = v2(); return !!(v && v.classList.contains("on")) };
  function paintSub() {
    const v = v2(); if (!v) return;
    const on = v2on();
    v.classList.toggle("sub-a", on && sub === "a"); v.classList.toggle("sub-b", on && sub === "b");
    const nx = $("#dNext"), sp = nx && (nx.querySelector("[data-t]") || nx.querySelector("span")), ti = $("#dTitle"), su = $("#dSub");
    if (on && sub === "a") {
      if (!saved && sp && ti) saved = { n: sp.textContent, t: ti.textContent, s: su ? su.textContent : "" };
      if (sp) sp.textContent = (window.App && App.hasField && !App.hasField() && App.t) ? App.t("needFieldB") : L(W2.next); if (ti) ti.textContent = L(W2.a); if (su) su.textContent = L(W2.aSub);
    } else if (saved) {
      if (on) { if (sp) sp.textContent = saved.n; if (ti) ti.textContent = saved.t; if (su) su.textContent = saved.s }
      saved = null;
    }
  }
  document.addEventListener("click", (e) => {
    if (!v2on()) return;
    /* the field comes first: no field saved on this area -> the field form, not the next page */
    if (e.target.closest("#dNext") && sub === "a" && window.App && App.hasField && !App.hasField()) { e.preventDefault(); e.stopImmediatePropagation(); App.askField(); return }
    if (e.target.closest("#dNext") && sub === "a") { e.preventDefault(); e.stopImmediatePropagation(); sub = "b"; paintSub(); const b = $(".d-body"); if (b) b.scrollTop = 0; return }
    if (e.target.closest("#dPrev") && sub === "b") { e.preventDefault(); e.stopImmediatePropagation(); sub = "a"; paintSub(); const b = $(".d-body"); if (b) b.scrollTop = 0; }
  }, true);
  function watchViews() {
    const views = [...document.querySelectorAll("#drawer section.view")];
    const mo = new MutationObserver(() => {
      const cur = views.find((x) => x.classList.contains("on")); const id = cur ? cur.id : null;
      if (id === lastView) return;
      if (id === "v2") { sub = lastView === "v3" ? "b" : "a"; saved = null }
      lastView = id; setTimeout(paintSub, 0);
    });
    views.forEach((x) => mo.observe(x, { attributes: true, attributeFilter: ["class"] }));
    /* app.js rewrites the footer text and title on each go(): put the page-a words back */
    const t = $("#dTitle"); t && new MutationObserver(() => { if (v2on() && sub === "a" && t.textContent !== L(W2.a)) { saved = null; paintSub() } }).observe(t, { childList: true, characterData: true, subtree: true });
    lastView = (views.find((x) => x.classList.contains("on")) || {}).id || null; paintSub();
  }

  function start() {
    ensure(); fullBtn(); render(); try { watchViews() } catch (e) {}
    /* drawer closes: drop full screen (and come back to it when the drawer opens again); refresh the panel's "open plan" button */
    let open = B().classList.contains("drawer-open");
    new MutationObserver(() => {
      const now = B().classList.contains("drawer-open");
      if (now === open) return;
      open = now;
      if (!now && isFull()) setFull(false, true);
      else if (now && want && !isFull()) setFull(true, true);
      render();
    }).observe(B(), { attributes: true, attributeFilter: ["class"] });
    const mq = window.matchMedia("(min-width: 761px)");
    const onMq = () => { placeSlider(); };
    mq.addEventListener ? mq.addEventListener("change", onMq) : mq.addListener(onMq);
  }
  if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(start); else start();
  function toSub(x) { sub = x === "b" ? "b" : "a"; paintSub(); const b = $(".d-body"); if (b) b.scrollTop = 0 }
  return { render, full: setFull, sub: toSub };
})();
