/* extra.js (Draft 5): the parts taken from concepts A and D, joined to Draft 4's app.
   - Light / dark switch in the top bar (saved as mre-theme).
   - Salt month slider (concept D): areas without salt that month fade. On desktop side.js moves it into the left panel.
   - Season wheel (concept A) in step 1 (best rotation) and step 4 (chosen plan); tapping a month moves the slider.
   - Field questions + crop-loss prediction (shared Model from rx.js) in step 4.
   Reads Draft 4 through window.App and MapView; reads the redesign data through RX. */
const D5 = (() => {
  const C = RX.Core, M = RX.Model, NS = "http://www.w3.org/2000/svg";
  const $ = (s, r = document) => r.querySelector(s);
  const T = {
    month: { vi: "Mặn theo tháng", en: "Salt by month" },
    count: { vi: (n, t) => `${n}/${t} khu vực có mặn`, en: (n, t) => `${n} of ${t} areas salty` },
    none: { vi: "Không khu vực nào có mặn", en: "No area is salty" },
    est: { vi: "Ước tính từ báo cáo trạm đo, không phải vệ tinh", en: "Estimate from station reports, not satellite" },
    play: { vi: "Chạy 12 tháng", en: "Play 12 months" }, stop: { vi: "Dừng", en: "Stop" },
    wheel: { vi: "Vòng 12 tháng · chạm vào một tháng", en: "12-month wheel · tap a month" },
    best: { vi: "Luân canh hợp nhất", en: "Best-fit rotation" },
    rice: { vi: "Lúa", en: "Rice" }, upland: { vi: "Màu", en: "Upland" }, shrimp: { vi: "Tôm", en: "Shrimp" }, rest: { vi: "Nghỉ", en: "Rest" },
    saltK: { vi: "Mặn", en: "Salt" }, rainK: { vi: "Mưa", en: "Rain" },
    grow: { vi: "Trồng", en: "Growing" }, salty: { vi: "Mặn", en: "Salt" }, yes: { vi: "Có", en: "Yes" }, no: { vi: "Không", en: "No" },
    rain: { vi: "Mưa", en: "Rain" }, need: { vi: "cây cần", en: "crop needs" },
    pred: { vi: "Dự báo cho ruộng của bạn", en: "Forecast for your field" },
    theme: { vi: "Đổi nền sáng / tối", en: "Switch light / dark" }, light: { vi: "Nền sáng", en: "Light" }, dark: { vi: "Nền tối", en: "Dark" }
  };
  const L = (o) => o[C.lang] || o.en;
  const COL = { R: "var(--rice)", U: "var(--upland)", S: "var(--shrimp)", "-": "var(--rest)" };
  const sites = () => C.sites();
  const anySalt = (m) => sites().some((s) => s.salt.includes(m + 1));
  let mon = new Date().getMonth(); if (!anySalt(mon)) mon = 2;   /* open on a salt month so the map shows something */
  let timer = null;

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const getT = () => { try { return localStorage.getItem("mre-theme") } catch (e) { return null } };
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  function themeBtn() {
    const b = document.createElement("button");
    b.type = "button"; b.className = "icon-btn"; b.id = "d5Theme";
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
    b.addEventListener("click", () => { const t = isDark() ? "light" : "dark"; root.dataset.theme = t; try { localStorage.setItem("mre-theme", t) } catch (e) {} paintTheme(); });
    const tools = $("#topbar .tools"); tools && tools.insertBefore(b, $(".set-wrap", tools));
  }
  function paintTheme() {
    const b = $("#d5Theme"), d = isDark(); if (b) { b.setAttribute("aria-label", L(T.theme)); b.setAttribute("aria-pressed", d) }
  }

  /* ---------- month slider (concept D) ---------- */
  function slider() {
    const el = document.createElement("div");
    el.id = "d5Month"; el.className = "glass";
    el.innerHTML = `<div class="row"><button type="button" class="play" id="d5Play"></button><div><b id="d5MName"></b><span id="d5MCount"></span></div></div>
      <div class="trk" id="d5Trk"><input type="range" id="d5Range" min="0" max="11" step="1"><div class="ticks" id="d5Ticks" aria-hidden="true"></div></div><p class="note" id="d5Note"></p>`;
    document.body.appendChild(el);
    /* --d5-h: how much of the screen's bottom the box takes (0 when hidden), so the map's credits and key sit above it */
    if (window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty("--d5-h", (el.offsetHeight ? Math.round(innerHeight - el.getBoundingClientRect().top) : 0) + "px")).observe(el);
    $("#d5Range").addEventListener("input", (e) => { setMonth(+e.target.value); });
    /* drag with a finger or mouse anywhere on the track (and the month letters): the month follows the finger */
    const trk = $("#d5Trk"), at = (x) => { const r = $("#d5Range").getBoundingClientRect(); return Math.max(0, Math.min(11, Math.round((x - r.left) / r.width * 11))) };
    let drag = false;
    trk.addEventListener("pointerdown", (e) => { drag = true; try { trk.setPointerCapture(e.pointerId) } catch (er) {} if (timer) { clearInterval(timer); timer = null } const m = at(e.clientX); if (m !== mon) setMonth(m); else paintSlider(); e.preventDefault() });
    trk.addEventListener("pointermove", (e) => { if (!drag) return; const m = at(e.clientX); if (m !== mon) setMonth(m) });
    const end = () => { drag = false }; trk.addEventListener("pointerup", end); trk.addEventListener("pointercancel", end);
    $("#d5Play").addEventListener("click", () => {
      if (timer) { clearInterval(timer); timer = null } else timer = setInterval(() => setMonth((mon + 1) % 12), 900);
      paintSlider();
    });
  }
  function setMonth(m) { mon = m; paintSlider(); paintWheels(); typeof Side !== "undefined" && Side.render && Side.render(); }
  function paintSlider() {
    const ids = sites().filter((s) => s.salt.includes(mon + 1)).map((s) => s.id), n = ids.length, t = sites().length;
    /* the rain layers (vn.js) write their own line and mark the wet months; salt keeps its own */
    const rain = typeof VnMap !== "undefined" && VnMap.sliderInfo ? VnMap.sliderInfo(mon) : null;
    $("#d5Month").classList.toggle("is-rain", !!rain);
    $("#d5MName").textContent = C.monthsLong()[mon];
    const vnSalt = !rain && typeof VnMap !== "undefined" && VnMap.saltCount ? VnMap.saltCount(mon) : null;
    $("#d5MCount").textContent = rain ? rain.count : vnSalt || (n ? L(T.count)(n, t) : L(T.none));
    $("#d5Range").value = mon; $("#d5Range").setAttribute("aria-label", L(T.month) + ": " + C.monthsLong()[mon]);
    $("#d5Ticks").innerHTML = C.months().map((x, i) => `<span class="${rain ? (rain.wet[i] ? "w" : "") : anySalt(i) ? "s" : ""}${i === mon ? " on" : ""}">${C.lang === "en" ? x.charAt(0) : x.replace(/^Th/, "")}</span>`).join("");
    $("#d5Note").textContent = rain ? rain.note : L(T.est);
    const p = $("#d5Play"); p.textContent = timer ? L(T.stop) : L(T.play); p.setAttribute("aria-pressed", !!timer);
    typeof MapView !== "undefined" && MapView.month && MapView.month(ids);
    typeof MapView !== "undefined" && MapView.setMonth && MapView.setMonth(mon);
    document.dispatchEvent(new CustomEvent("mre:month", { detail: mon }));
  }

  /* ---------- season wheel (concept A) ---------- */
  const pt = (r, a) => [180 + r * Math.cos(a), 180 + r * Math.sin(a)];
  const ang = (i) => -Math.PI / 2 + i * Math.PI / 6;
  function arc(r1, r2, a0, a1) {
    const [x0, y0] = pt(r2, a0), [x1, y1] = pt(r2, a1), [x2, y2] = pt(r1, a1), [x3, y3] = pt(r1, a0), lg = a1 - a0 > Math.PI ? 1 : 0;
    return `M${x0} ${y0}A${r2} ${r2} 0 ${lg} 1 ${x1} ${y1}L${x2} ${y2}A${r1} ${r1} 0 ${lg} 0 ${x3} ${y3}Z`;
  }
  const rcard = (s, id) => s.cards.find((c) => c.id === id) || s.cards[0];
  const wheels = {};   /* host id -> card id */
  function wheelHTML(host, cardId) {
    const s = C.site(App.site().id), c = rcard(s, cardId), maxR = Math.max(...sites().flatMap((x) => x.rain));
    const sc = App.ranked().find((r) => r.c.id === c.id);
    let g = "";
    for (let i = 0; i < 12; i++) {
      const a0 = ang(i) + .02, a1 = ang(i + 1) - .02, m = c.months[i], salty = s.salt.includes(i + 1);
      const len = 4 + 34 * s.rain[i] / maxR, [tx, ty] = pt(162, ang(i + .5)), on = i === mon;
      g += `<g class="sector" data-m="${i}" tabindex="0" role="button" aria-pressed="${on}" aria-label="${C.monthsLong()[i]}">
        <path class="hit" d="${arc(60, 174, ang(i), ang(i + 1))}" fill="transparent"/>
        <path d="${arc(68, 100, a0, a1)}" fill="${COL[m[0]] || COL["-"]}"/>
        <path d="${arc(104, 116, a0, a1)}" fill="${salty ? "var(--risk)" : "var(--line-2)"}" opacity="${salty ? (s.level === "high" ? 1 : s.level === "medium" ? .7 : .45) : 1}"/>
        <path d="${arc(122, 122 + len, ang(i) + .12, ang(i + 1) - .12)}" fill="var(--water)" opacity=".8"/>
        <text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="${on ? 700 : 500}" fill="${on ? "var(--ink)" : "var(--ink-3)"}">${C.months()[i].replace(/^Th/, "")}</text></g>`;
    }
    g += `<path d="${arc(64, 154, ang(mon), ang(mon + 1))}" fill="none" stroke="var(--ink)" stroke-width="1.6" pointer-events="none"/>`;
    const m = c.months[mon], salty = s.salt.includes(mon + 1);
    const leg = [["R", T.rice], ["U", T.upland], ["S", T.shrimp], ["-", T.rest]].filter(([k]) => c.months.some((x) => x[0] === k))
      .map(([k, t]) => `<span><i style="background:${COL[k]}"></i>${L(t)}</span>`).join("") +
      `<span><i style="background:var(--risk)"></i>${L(T.saltK)}</span><span><i style="background:var(--water)"></i>${L(T.rainK)}</span>`;
    return `<p class="eyebrow">${host === "d5W1" ? L(T.best) + " · " : ""}${L(T.wheel)}</p>
      <div class="d5-wheel"><svg viewBox="0 0 360 360" role="group" aria-label="${C.esc(L(c.name))}">${g}</svg>
        <div class="ctr"><div><p class="big">${sc ? fmtN(sc.s) : "–"}<small>/5</small></p><p class="nm">${C.esc(L(c.name).split(" (")[0])}</p></div></div></div>
      <div class="d5-legend">${leg}</div>
      <dl class="d5-mon"><dt>${C.monthsLong()[mon]}</dt><dd></dd>
        <dt>${L(T.grow)}</dt><dd>${C.esc(L(C.codeOf(m)))}${m.length > 1 ? " · " + (C.lang === "vi" ? "vụ " : "crop ") + m[1] : ""}</dd>
        <dt>${L(T.salty)}</dt><dd class="${salty ? "risk" : ""}">${L(salty ? T.yes : T.no)}${salty ? " (" + L(C.UI.salt[s.level]).toLowerCase() + ")" : ""}</dd>
        <dt>${L(T.rain)}</dt><dd>${s.rain[mon]} mm · ${L(T.need)} ~${s.et0[mon]} mm <span class="src">(NASA GPM, POWER)</span></dd></dl>`;
  }
  const fmtN = (n) => C.lang === "vi" ? n.toFixed(1).replace(".", ",") : n.toFixed(1);
  function host(id, after) {
    let el = document.getElementById(id);
    if (!el && after) { el = document.createElement("div"); el.id = id; el.className = "box d5-box"; after.insertAdjacentElement("afterend", el); }
    return el;
  }
  function paintWheels() {
    if (!App.site()) return;
    for (const id in wheels) { const el = document.getElementById(id); if (el && wheels[id]) el.innerHTML = wheelHTML(id, wheels[id]); }
  }
  document.addEventListener("click", (e) => { const g = e.target.closest(".d5-wheel .sector"); if (g) setMonth(+g.dataset.m); });
  document.addEventListener("keydown", (e) => {
    const g = e.target.closest && e.target.closest(".d5-wheel .sector"); if (!g) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const m = +g.dataset.m; setMonth(m); requestAnimationFrame(() => { const n = document.querySelector(`#${g.closest(".d5-box").id} .sector[data-m="${m}"]`); n && n.focus() }) }
  });

  /* ---------- sync language and year with Draft 4 ---------- */
  function sync() {
    if (C.lang !== App.lang()) C.setLang(App.lang());
    const y = App.mode() === "elnino" ? "elnino" : "typical"; if (C.year !== y) C.setYear(y);
  }

  /* ---------- hooks called by app.js ---------- */
  function area() {
    if (!window.App) return;
    sync(); paintTheme(); if ($("#d5Range")) paintSlider();
    typeof Side !== "undefined" && Side.render && Side.render();   /* left info panel on the map page (side.js) */
    const s = App.site(), el = host("d5W1", $("#areaFold > summary"));
    if (!s) { if (el) el.hidden = true; delete wheels.d5W1; return; }
    const best = App.ranked().find((r) => !r.c.not_here) || App.ranked()[0];
    el.hidden = false; wheels.d5W1 = best ? best.c.id : null;
    if (wheels.d5W1) el.innerHTML = wheelHTML("d5W1", wheels.d5W1);
  }
  let planCard = null;
  function plan(c) {
    if (!window.App) return;
    sync();
    const s = App.site(); if (!s || !c) return;
    planCard = c.id;
    const w = host("d5W4", $("#planFold > summary")); wheels.d5W4 = c.id; w.innerHTML = wheelHTML("d5W4", c.id);
    paintPred();
    typeof Cost !== "undefined" && Cost.plan(c);
  }
  function paintPred() {
    const s = App.site(); if (!s || !planCard) return;
    const p = host("d5Pred", $("#d5W4")), rc = rcard(C.site(s.id), planCard);
    p.innerHTML = `<p class="eyebrow">${L(T.pred)}</p>${M.askHTML()}${M.html(rc, s.id)}`;
  }
  M.onChange(() => paintPred());

  function start() {
    const t = getT(); if (t === "light" || t === "dark") root.dataset.theme = t;
    themeBtn(); slider(); sync(); paintSlider(); paintTheme();
    if (App.site()) area();
  }
  if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(start); else start();
  return { area, plan, month: setMonth, mon: () => mon };
})();
