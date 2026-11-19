/* vn.js: the Vietnam map (vietnam.html). Same look as the Sóc Trăng map (map.js / map.css): satellite imagery,
   white dashed outlines, a see-through colour layer blended between data points and clipped to the outlines, gold pins
   with name plates. Data: data/provinces.json (pipeline/build.py), outlines: VN_GEO (app/vn_geo.js, make_outlines.py).
   34 provinces since 1 July 2025, each joined from its former provinces; 63 province points with their own model and
   the 5 Sóc Trăng area pins (those open the main app). Globals used: L (Leaflet 1.9.4), VN_GEO. */
(() => {
  const $ = (s) => document.querySelector(s);
  const store = { get: (k) => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} } };
  let lang = store.get("mre-lang") === "en" ? "en" : "vi";
  const T = {
    title: ["Vietnam map", "Bản đồ Việt Nam"], pick: ["Choose a province", "Chọn tỉnh"], back: ["Sóc Trăng areas", "5 khu vực Sóc Trăng"],
    load: ["Loading…", "Đang tải…"], fail: ["Could not load the data. Check your connection and reload.", "Không tải được dữ liệu. Kiểm tra kết nối rồi tải lại trang."],
    nomap: ["The map library did not load, so only the province list works.", "Không tải được thư viện bản đồ, chỉ dùng được danh sách tỉnh."],
    show: ["Map colour shows:", "Màu trên bản đồ là:"], rain: ["Rain", "Mưa"], bal: ["Rain minus water need", "Mưa trừ nhu cầu nước"],
    year: ["Whole year", "Cả năm"], typical: ["Typical year", "Năm thường"], elnino: ["El Niño years", "Năm El Niño"],
    rainH: ["Rain, NASA GPM IMERG (mm)", "Lượng mưa, NASA GPM IMERG (mm)"],
    balH: ["Rain minus crop water need (ET₀, NASA POWER + FAO-56), mm", "Mưa trừ nhu cầu nước của cây (ET₀, NASA POWER + FAO-56), mm"],
    dry: ["drier", "khô hơn"], wet: ["wetter", "ẩm hơn"], less: ["less", "ít"], more: ["more", "nhiều"],
    keyNote: ["One value per province point (63 points), blended between points: an estimate between them, not a measurement.", "Mỗi điểm tỉnh một giá trị (63 điểm), màu chuyển dần giữa các điểm là nội suy, không phải số đo."],
    keyPill: ["Map key", "Chú thích"], hide: ["Hide", "Thu gọn"], close: ["Close", "Đóng"],
    formed: ["Since 1 July 2025, joined from", "Từ 1/7/2025, sáp nhập từ"], kept: ["Since 1 July 2025: unchanged", "Từ 1/7/2025: giữ nguyên"],
    avg: ["Province average", "Trung bình tỉnh"], pt: ["Point", "Điểm"], former: ["former", "cũ"],
    avgNote: ["Average of the province's points, one per former province.", "Trung bình các điểm của tỉnh, mỗi tỉnh cũ một điểm."],
    ptNote: ["Data at this point: the former provincial capital (weather ~50 km grid, rain ~10 km grid).", "Số liệu tại điểm này: tỉnh lỵ cũ (thời tiết lưới ~50 km, mưa lưới ~10 km)."],
    rainY: ["Rain a year", "Mưa cả năm"], et0Y: ["Crop water need a year", "Nhu cầu nước cả năm"], hot: ["Days ≥ 35 °C a year", "Ngày ≥ 35 °C mỗi năm"],
    clay: ["Topsoil clay", "Sét tầng mặt"], ph: ["pH", "pH"], crops: ["Crops a year seen by MODIS", "Số vụ/năm MODIS thấy"],
    ndviAt: ["NASA MODIS NDVI, the 250 m pixel at the pin", "NASA MODIS NDVI, ô 250 m tại điểm ghim"],
    ndviTown: ["The MODIS pixel at the pin is a town or water (never greener than 0.5), so it is not used", "Ô MODIS tại điểm ghim là đô thị hoặc mặt nước (độ xanh luôn dưới 0,5), nên không dùng"],
    nosoil: ["No soil data (town or water pixel)", "Chưa có số liệu đất (điểm ở đô thị hoặc mặt nước)"],
    soilKm: ["nearest farmland, {k} km from the pin", "vùng đất nông nghiệp gần nhất, cách điểm ghim {k} km"],
    soilAvg: ["average of {n} of {m} points", "trung bình {n}/{m} điểm"],
    salt: ["Salt", "Độ mặn"], chart: ["Rain and crop water need by month", "Mưa và nhu cầu nước theo tháng"],
    lgRain: ["Rain (NASA GPM)", "Mưa (NASA GPM)"], lgEt0: ["Water need ET₀", "Nhu cầu nước ET₀"],
    check: ["Rain check: NASA POWER gives {p} mm a year against GPM's {g} mm ({d}%), month-by-month match r = {r}.", "Kiểm tra mưa: NASA POWER cho {p} mm/năm so với {g} mm của GPM ({d}%), tương quan theo tháng r = {r}."],
    cards: ["Rotation options (Mekong Delta only)", "Phương án luân canh (chỉ ĐBSCL)"], summary: ["What the data says", "Số liệu cho thấy"],
    sc: { water: ["Water", "Nước"], income: ["Income", "Thu nhập"], soil: ["Soil", "Đất"], pests: ["Pests", "Sâu bệnh"], salt: ["Weather & salt", "Thời tiết & mặn"] },
    conf: { low: ["Low confidence", "Độ tin cậy thấp"], medium: ["Medium confidence", "Độ tin cậy vừa"], high: ["High confidence", "Độ tin cậy cao"] },
    order: ["Listed in the project's fixed order, not ranked. Scores 1–5, higher is better; — = not scored.", "Xếp theo thứ tự cố định của dự án, không xếp hạng. Điểm 1–5, cao hơn là tốt hơn; — = chưa chấm."],
    why: ["Why these scores", "Vì sao có điểm này"], risks: ["Risks", "Rủi ro"], gaps: ["Check first", "Cần kiểm tra"],
    open: ["Open the 5 Sóc Trăng areas in the planner", "Mở 5 khu vực Sóc Trăng trong công cụ lập kế hoạch"],
    area: ["Sóc Trăng area: open in the planner", "Khu vực Sóc Trăng: mở trong công cụ"],
    sources: ["Sources", "Nguồn"], region: ["Region", "Vùng"], estimate: ["estimate", "ước tính"]
  };
  const t = (k, sub) => { let s = (sub ? T[k][sub] : T[k])[lang === "vi" ? 1 : 0]; return s; };
  const fill = (s, o) => s.replace(/\{(\w)\}/g, (_, k) => o[k]);
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const num = (v, d = 0) => v == null ? "—" : Number(v).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const nm = (o) => (o && (o[lang] || o.en)) || "";
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const MON = { en: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], vi: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] };
  const MONL = { en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], vi: Array.from({ length: 12 }, (_, i) => "Tháng " + (i + 1)) };
  const isPhone = () => window.innerWidth <= 760;
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let D = null, P = {}, PL = {}, map = null, polys = {}, pins = {}, gradLayer = null;
  let sel = null, view = "avg", yr = "typical", mode = "rain", mon = -1, keyOpen = !isPhone(), hov = null;

  /* ---------- geometry: arcs -> rings ---------- */
  const G = typeof VN_GEO !== "undefined" ? VN_GEO : null;
  const arcPts = (i) => (i >= 0 ? G.arcs[i] : G.arcs[~i].slice().reverse());
  const ringPts = (r) => { const out = []; r.forEach((i) => { const a = arcPts(i); out.push(...(out.length ? a.slice(1) : a)) }); return out };
  const ll = (p) => [p[1], p[0]];
  const MAIN = { w: 102.1, e: 109.6, s: 8.3, n: 23.45 };  // mainland + near islands: the colour layer and the home view

  /* ---------- the data a view shows ---------- */
  const climOf = (o) => (yr === "elnino" ? o.elnino.climate : o.climate);
  function value(o, m) {
    const c = climOf(o), r = m < 0 ? sum(c.rain_mm) : c.rain_mm[m];
    return mode === "rain" ? r : r - (m < 0 ? sum(c.et0_mm) : c.et0_mm[m]);
  }

  /* ---------- colour layer: blended between the 63 points, clipped to the outlines (as map.js paintCells) ---------- */
  const BLUE = [[0, [233, 241, 230]], [0.35, [143, 196, 214]], [0.7, [52, 131, 196]], [1, [23, 63, 140]]];
  const DIV = [[0, [196, 92, 38]], [0.35, [232, 170, 94]], [0.5, [240, 232, 205]], [0.65, [128, 190, 214]], [1, [30, 90, 170]]];
  function ramp(stops, f) {
    f = Math.max(0, Math.min(1, f));
    for (let i = 1; i < stops.length; i++) if (f <= stops[i][0]) {
      const [a0, c0] = stops[i - 1], [a1, c1] = stops[i], k = (f - a0) / (a1 - a0);
      return c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
    }
    return stops[stops.length - 1][1];
  }
  let range = [0, 1];
  function paint() {
    if (!map || !G) return;
    const pts = D.places.map((x) => ({ lat: x.lat, lon: x.lon, v: value(x, mon) }));
    const vs = pts.map((p) => p.v);
    if (mode === "rain") range = [Math.min(...vs), Math.max(...vs)];
    else { const a = Math.max(...vs.map(Math.abs)); range = [-a, a]; }
    const B = MAIN, W = Math.round(700 * Math.min(2, window.devicePixelRatio || 1)), H = Math.round(W * (B.n - B.s) / ((B.e - B.w) * Math.cos(16 * Math.PI / 180)));
    const gw = 110, gh = Math.round(gw * H / W);
    const small = document.createElement("canvas"); small.width = gw; small.height = gh;
    const sx = small.getContext("2d"), img = sx.createImageData(gw, gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const lon = B.w + (i + 0.5) / gw * (B.e - B.w), lat = B.n - (j + 0.5) / gh * (B.n - B.s);
      let w = 0, v = 0;
      for (const p of pts) { const d2 = (p.lat - lat) ** 2 + ((p.lon - lon) * 0.96) ** 2, q = 1 / (d2 * d2 + 1e-12); w += q; v += q * p.v; }
      const f = (v / w - range[0]) / Math.max(1e-6, range[1] - range[0]);
      const rgb = ramp(mode === "rain" ? BLUE : DIV, f), k = (j * gw + i) * 4;
      img.data[k] = rgb[0]; img.data[k + 1] = rgb[1]; img.data[k + 2] = rgb[2]; img.data[k + 3] = 112;
    }
    sx.putImageData(img, 0, 0);
    const big = document.createElement("canvas"); big.width = W; big.height = H;
    const bx = big.getContext("2d");
    bx.beginPath();
    Object.values(G.province).forEach((rs) => rs.forEach((r) => ringPts(r).forEach(([lon, lat], q) => {
      const x = (lon - B.w) / (B.e - B.w) * W, y = (B.n - lat) / (B.n - B.s) * H; q ? bx.lineTo(x, y) : bx.moveTo(x, y);
    })));
    bx.clip("evenodd");
    bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = "high";
    bx.drawImage(small, 0, 0, W, H);
    const url = big.toDataURL("image/png");
    if (gradLayer) gradLayer.setUrl(url); else gradLayer = L.imageOverlay(url, [[B.s, B.w], [B.n, B.e]], { pane: "grad", interactive: false }).addTo(map);
    drawKey();
  }

  /* ---------- key (bottom left, like the Sóc Trăng map key) ---------- */
  function drawKey() {
    const el = $("#vnKey");
    const grad = (mode === "rain" ? BLUE : DIV).map(([f, c]) => `rgb(${c}) ${Math.round(f * 100)}%`).join(",");
    const ends = mode === "rain" ? [t("less"), t("more")] : [t("dry"), t("wet")];
    const months = `<select id="vnMon" aria-label="${esc(t("year"))}"><option value="-1">${esc(t("year"))}</option>${MONL[lang].map((m, i) => `<option value="${i}"${i === mon ? " selected" : ""}>${esc(m)}</option>`).join("")}</select>`;
    el.innerHTML = (keyOpen ? `<div class="vn-key-pop" role="group" aria-label="${esc(t("keyPill"))}">
<div class="vn-key-top"><b>${esc(t("show"))}</b><button type="button" class="vn-x" data-key="close" aria-label="${esc(t("close"))}">✕</button></div>
<div class="vn-two">${["rain", "bal"].map((m) => `<button type="button" data-mode="${m}" aria-pressed="${mode === m}">${esc(t(m))}</button>`).join("")}</div>
<div class="vn-two">${["typical", "elnino"].map((m) => `<button type="button" data-yr="${m}" aria-pressed="${yr === m}">${esc(t(m))}</button>`).join("")}</div>
${months}
<b class="vn-key-h">${esc(t(mode === "rain" ? "rainH" : "balH"))}</b>
<i class="vn-ramp" style="background:linear-gradient(90deg,${grad})"></i>
<div class="vn-ends"><span>${num(range[0])} · ${esc(ends[0])}</span><span>${esc(ends[1])} · ${num(range[1])}</span></div>
<p class="vn-note">${esc(t("keyNote"))}</p></div>` : "") +
      `<button type="button" class="vn-pill" data-key="toggle" aria-expanded="${keyOpen}"><i class="vn-ramp vn-ramp-s" style="background:linear-gradient(90deg,${grad})"></i><span>${esc(t(mode === "rain" ? "rain" : "bal"))}</span><em>${esc(keyOpen ? t("hide") : t("keyPill"))}</em></button>`;
    const ms = $("#vnMon"); if (ms) ms.value = String(mon);
  }
  $("#vnKey").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mode) { mode = b.dataset.mode; paint(); }
    else if (b.dataset.yr) { yr = b.dataset.yr; paint(); render(); labels(); }
    else if (b.dataset.key) { keyOpen = b.dataset.key === "toggle" ? !keyOpen : false; drawKey(); }
  });
  $("#vnKey").addEventListener("change", (e) => { if (e.target.id === "vnMon") { mon = +e.target.value; paint(); } });

  /* ---------- outlines and pins ---------- */
  function drawMap() {
    map.createPane("grad").style.zIndex = 404; map.getPane("grad").style.pointerEvents = "none";
    map.createPane("inner").style.zIndex = 406; map.getPane("inner").style.pointerEvents = "none";
    map.createPane("cells").style.zIndex = 410;
    map.createPane("labels").style.zIndex = 610;
    const R = L.svg({ pane: "cells", padding: 0.6 }), RI = L.svg({ pane: "inner", padding: 0.6 });
    // borders between former provinces inside one new province: thin dotted lines
    G.inner.forEach((i) => L.polyline(G.arcs[i].map(ll), { pane: "inner", renderer: RI, interactive: false, className: "vn-inner", smoothFactor: 0, noClip: true }).addTo(map));
    D.provinces.forEach((p) => {
      const poly = L.polygon(G.province[p.id].map((r) => ringPts(r).map(ll)), { pane: "cells", renderer: R, className: "sg-cell sg-area", smoothFactor: 0, noClip: true, bubblingMouseEvents: false, weight: 1.5 }).addTo(map);
      poly.on("mouseover", () => hover(p.id));
      poly.on("mouseout", () => hover(null));
      poly.on("click", () => choose(p.id, "avg"));
      polys[p.id] = poly;
    });
    const add = (o, kind, onClick) => {
      const size = kind === "own" ? 44 : kind === "former" ? 32 : 24;
      const label = nm(o.name);
      const m = L.marker([o.lat, o.lon], { icon: L.divIcon({ className: "sg-pin vn-pin-" + kind, html: `<button type="button" class="sg-pin-btn" aria-label="${esc(label)}"><i class="sg-p-pulse"></i><i class="sg-p-ring"></i><i class="sg-p-core"></i><i class="sg-p-tick sg-t-n"></i><i class="sg-p-tick sg-t-e"></i><i class="sg-p-tick sg-t-s"></i><i class="sg-p-tick sg-t-w"></i></button>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }), keyboard: false, zIndexOffset: kind === "own" ? 300 : kind === "former" ? 200 : 100 }).addTo(map);
      const lm = L.marker([o.lat, o.lon], { pane: "labels", interactive: false, keyboard: false, icon: L.divIcon({ className: "sg-label-wrap", html: '<span class="sg-label sg-hide vn-label-' + kind + '"></span>', iconSize: [0, 0] }) }).addTo(map);
      const btn = m.getElement().querySelector("button"), lab = lm.getElement().querySelector(".sg-label");
      [btn, lab].forEach((x) => { L.DomEvent.disableClickPropagation(x); x.addEventListener("click", (e) => { e.stopPropagation(); onClick(); }); });
      btn.addEventListener("mouseenter", () => hover(o.province || "can_tho"));
      btn.addEventListener("mouseleave", () => hover(null));
      pins[o.id + ":" + kind] = { o, kind, btn, lab, m, lm };
    };
    D.places.forEach((x) => add(x, x.own ? "own" : "former", () => choose(x.province, x.id)));
    D.pins.forEach((s) => add(s, "area", () => { location.href = "index.html"; }));
    labels();
    map.on("zoomend moveend", placeLabels);
    map.on("click", () => { if (sel) choose(null); });
  }
  function labels() {
    Object.values(pins).forEach((p) => {
      const o = p.o, pr = P[o.province];
      let small = "";
      if (p.kind === "former") small = `${t("former")} → ${nm(pr.name)}`;
      else if (p.kind === "own") small = `GPM · ${num(sum(climOf(o).rain_mm))} ${lang === "vi" ? "mm mưa/năm" : "mm rain/yr"}`;
      else if (p.kind === "area") small = lang === "vi" ? "Sóc Trăng cũ" : "former Sóc Trăng";
      const name = p.kind === "area" ? nm(o.name).split(" (")[0].replace(/^(Former |Khu vực )/, "").replace(/( area| cũ)$/, "") : nm(o.name);
      p.lab.innerHTML = `<i class="sg-dot vn-dot-${esc(P[o.province || "can_tho"].region)}" aria-hidden="true"></i><b>${esc(name)}</b>${small ? `<small>${esc(small)}</small>` : ""}`;
      p.btn.setAttribute("aria-label", p.kind === "area" ? `${name}: ${t("area")}` : name);
    });
    placeLabels();
  }
  /* name plates: right of the pin, else left; hidden when both sides are taken (shown on hover/selection).
     Zoomed out, only the provinces' own pins get plates; former provinces from zoom 7.5, the Sóc Trăng areas from 9.5. */
  function placeLabels() {
    if (!map) return;
    const z = map.getZoom(), taken = [], size = map.getSize();
    const show = (k) => k === "own" || (k === "former" && z >= 7.5) || (k === "area" && z >= 9.5);
    const list = Object.values(pins);
    list.forEach((p) => { const vis = show(p.kind) || p.kind === "own"; p.m.getElement().style.display = (p.kind === "area" && z < 8.5) ? "none" : ""; p.vis = vis; });
    list.forEach((p) => { const c = map.latLngToContainerPoint([p.o.lat, p.o.lon]); p.c = c; taken.push({ x0: c.x - 8, x1: c.x + 8, y0: c.y - 8, y1: c.y + 8 }); });
    const isSel = (p) => sel && (p.o.id === view || (view === "avg" && p.kind === "own" && p.o.province === sel));
    const order = list.slice().sort((a, b) => isSel(b) - isSel(a) || ({ own: 0, former: 1, area: 2 })[a.kind] - ({ own: 0, former: 1, area: 2 })[b.kind]);
    order.forEach((p) => {
      const lab = p.lab, on = isSel(p);
      lab.classList.toggle("is-sel", !!on); p.btn.classList.toggle("is-sel", !!on);
      if (!(show(p.kind) || on) || p.c.x < -50 || p.c.y < -50 || p.c.x > size.x + 50 || p.c.y > size.y + 50) { lab.classList.add("sg-hide"); return; }
      const w = lab.offsetWidth || 120, h = lab.offsetHeight || 30, ph = isPhone();
      // desktop: right of the pin, else left; phones (map.css): under the pin, else above
      const right = ph ? { x0: p.c.x - w / 2, x1: p.c.x + w / 2, y0: p.c.y + 18, y1: p.c.y + 24 + h } : { x0: p.c.x + 14, x1: p.c.x + 20 + w, y0: p.c.y - h / 2, y1: p.c.y + h / 2 };
      const left = ph ? { x0: p.c.x - w / 2, x1: p.c.x + w / 2, y0: p.c.y - 24 - h, y1: p.c.y - 18 } : { x0: p.c.x - 20 - w, x1: p.c.x - 14, y0: p.c.y - h / 2, y1: p.c.y + h / 2 };
      const free = (r) => !taken.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0 && !(q.x0 > p.c.x - 9 && q.x1 < p.c.x + 9 && q.y0 > p.c.y - 9 && q.y1 < p.c.y + 9));
      const spot = free(right) ? right : free(left) ? left : on ? right : null;
      lab.classList.toggle("sg-left", !ph && spot === left);
      lab.classList.toggle("sg-above", ph && spot === left);
      lab.classList.toggle("sg-hide", !spot);
      if (spot) taken.push(spot);
    });
  }
  function hover(id) {
    hov = id;
    Object.entries(polys).forEach(([k, p]) => { const e = p.getElement(); if (e) e.classList.toggle("is-hover", k === id); });
  }

  /* ---------- selection and the side panel ---------- */
  function choose(id, v) {
    sel = id || null; view = v || "avg";
    if (sel && keyOpen && window.innerWidth < 1200) { keyOpen = false; drawKey(); }  // room for the province on smaller screens
    Object.entries(polys).forEach(([k, p]) => { const e = p.getElement(); if (e) e.classList.toggle("is-sel", k === sel); });
    $("#vnMap").classList.toggle("sg-has-sel", !!sel);
    $("#vnPick").value = sel || "";
    document.body.classList.toggle("vn-open", !!sel);
    render();
    placeLabels();
    if (sel && map) {
      const b = polys[sel].getBounds(), mainH = $(".vn-main").clientHeight,
        pad = isPhone() ? { tl: [16, 16], br: [16, Math.round(mainH * 0.58) + 12] } : { tl: [keyOpen ? 380 : 40, 40], br: [480, 40] };
      const o = view !== "avg" ? PL[view] : null;
      if (o) map.fitBounds(L.latLngBounds([[o.lat - 0.25, o.lon - 0.25], [o.lat + 0.25, o.lon + 0.25]]).extend(b.getCenter()).pad(0.1), { paddingTopLeft: pad.tl, paddingBottomRight: pad.br, maxZoom: 9, animate: !reduced() });
      else map.fitBounds(b, { paddingTopLeft: pad.tl, paddingBottomRight: pad.br, maxZoom: 9, animate: !reduced() });
    }
  }
  let cited = [];
  const cite = (src) => (src || []).filter((i) => D.sources[i]).map((i) => { if (!cited.includes(i)) cited.push(i); return `<a class="vn-cite" href="#vn-src-${i}">${cited.indexOf(i) + 1}</a>`; }).join("");
  const lineHTML = (x) => `<li>${esc(nm(x))}${cite(x.src)}</li>`;
  function chart(c) {
    const W = 360, H = 120, top = Math.max(...c.rain_mm, ...c.et0_mm) || 1, bw = W / 12;
    const y = (v) => H - 18 - (v / top) * (H - 26);
    const bars = c.rain_mm.map((v, i) => `<rect x="${i * bw + 4}" y="${y(v)}" width="${bw - 8}" height="${H - 18 - y(v)}" rx="2" class="vn-bar"><title>${esc(MONL[lang][i])}: ${num(v)} mm</title></rect>`).join("");
    const line = c.et0_mm.map((v, i) => `${i * bw + bw / 2},${y(v)}`).join(" ");
    const lab = MON[lang].map((m, i) => `<text x="${i * bw + bw / 2}" y="${H - 4}" text-anchor="middle">${m}</text>`).join("");
    return `<figure class="vn-chart"><figcaption>${esc(t("chart"))}${cite(D.chart_src)}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("chart"))}">${bars}<polyline points="${line}" class="vn-et0"/>${lab}</svg>
<div class="vn-lg"><span><i class="vn-sw-rain"></i>${esc(t("lgRain"))}</span><span><i class="vn-sw-et0"></i>${esc(t("lgEt0"))}</span></div></figure>`;
  }
  function render() {
    const el = $("#vnPanel");
    if (!sel) { el.hidden = true; el.innerHTML = ""; return; }
    cited = [];
    const p = P[sel], fm = p.former.length > 1;
    const avg = view === "avg" && fm;  // an unmerged province is its one point: show the point (soil distance, MODIS)
    const o = avg ? p : PL[view === "avg" ? p.id : view], c = climOf(o);
    const tabs = `<div class="vn-tabs" role="group">${fm ? `<button type="button" data-view="avg" aria-pressed="${avg}">${esc(t("avg"))}</button>` : ""}${p.former.map((f) => `<button type="button" data-view="${esc(f.id)}" aria-pressed="${view === f.id || (!fm && view === "avg")}">${esc(nm(f.name))}${f.id !== p.id ? ` <small>${esc(t("former"))}</small>` : ""}</button>`).join("")}</div>`;
    const soil = o.soil;
    const soilSub = !soil ? "" : avg ? fill(t("soilAvg"), { n: p.points.soil.length, m: p.former.length }) : soil.km ? fill(t("soilKm"), { k: num(soil.km) }) : "";
    const tiles = [
      [t("rainY"), num(sum(c.rain_mm)) + " mm", "NASA GPM IMERG", D.chart_src.slice(1, 2)],
      [t("et0Y"), num(sum(c.et0_mm)) + " mm", "NASA POWER · FAO-56", D.chart_src.slice(0, 1).concat(D.chart_src.slice(2))],
      [t("hot"), num(sum(c.hot_days), 0), "NASA POWER", D.chart_src.slice(0, 1)],
      soil ? [t("clay"), num(soil.clay_pct, 1) + "% · pH " + num(soil.ph, 1), soilSub || "SoilGrids", D.soil_src] : [t("clay"), "—", t("nosoil"), D.soil_src],
      !avg && o.ndvi ? (o.ndvi.farmland ? [t("crops"), num(o.ndvi.crops_per_year, 1), t("ndviAt"), D.ndvi_src] : [t("crops"), "—", t("ndviTown"), D.ndvi_src]) : null
    ].filter(Boolean).map(([k, v, s, src]) => `<div class="vn-tile"><span>${esc(k)}</span><b>${esc(v)}</b><small>${esc(s)}${cite(src)}</small></div>`).join("");
    const sm = (yr === "elnino" ? o.elnino.summary : o.summary) || [];
    const cards = (yr === "elnino" ? o.elnino.cards : o.cards) || [];
    const chkAt = view === "avg" ? p.id : view, chk = PL[chkAt].gpm_check;
    const cardHTML = (c0) => {
      const cd = c0.variants ? c0.variants[c0.crop_default] || Object.values(c0.variants)[0] : c0;  // upland: the default crop, as the main app shows
      const s = cd.scores;
      const bars = Object.keys(T.sc).map((k) => `<li><span>${esc(t("sc", k))}</span><i style="--v:${s[k] == null ? 0 : (s[k] - 1) / 4}"></i><b>${s[k] == null ? "—" : num(s[k], 1)}</b></li>`).join("");
      const sec = (k) => (cd[k] && cd[k].length ? `<h4>${esc(t(k))}</h4><ul>${cd[k].map(lineHTML).join("")}</ul>` : "");
      return `<li class="vn-card"><div class="vn-card-h"><b>${esc(nm(cd.name))}</b><span class="vn-conf vn-conf-${esc(cd.confidence)}">${esc(t("conf", cd.confidence))}</span></div><ul class="vn-scores">${bars}</ul>
<details><summary>${esc(t("why"))}</summary>${sec("why")}${sec("risks")}${sec("gaps")}</details></li>`;
    };
    el.innerHTML = `<div class="vn-grab" aria-hidden="true"></div>
<header class="vn-ph"><p class="vn-eye">${esc(t("region"))}: ${esc(nm(p.region_name))}${cite(D.region_src)}</p>
<h2>${esc(nm(p.name))}</h2><button type="button" class="vn-x" data-close aria-label="${esc(t("close"))}">✕</button>
<p class="vn-sub">${fm ? `${esc(t("formed"))} ${p.former.map((f) => esc(nm(f.name))).join(", ")}` : esc(t("kept"))}</p></header>
${tabs}
<div class="vn-two vn-yr">${["typical", "elnino"].map((m) => `<button type="button" data-yr="${m}" aria-pressed="${yr === m}">${esc(t(m))}</button>`).join("")}</div>
<p class="vn-note">${esc(avg && fm ? t("avgNote") : t("ptNote"))}</p>
<div class="vn-tiles">${tiles}</div>
${chart(c)}
<p class="vn-salt">${esc(nm(sm.find((x) => x.salt) || { en: "", vi: "" }))}</p>
${chk && chk.gpm_mm_yr ? `<p class="vn-note">${esc(fill(t("check"), { p: num(chk.power_mm_yr), g: num(chk.gpm_mm_yr), d: (chk.diff_pct > 0 ? "+" : "") + num(chk.diff_pct), r: num(chk.monthly_r, 2) }))} (${esc(t("pt"))}: ${esc(nm(PL[chkAt].name))})${cite(D.chart_src.slice(0, 2))}</p>` : ""}
<h3>${esc(t("summary"))}</h3><ul class="vn-lines">${sm.filter((x) => !x.salt).map(lineHTML).join("")}</ul>
${o.scored ? `<h3>${esc(t("cards"))}</h3><p class="vn-note">${esc(t("order"))}</p><ul class="vn-cards">${cards.map(cardHTML).join("")}</ul>` : `<p class="vn-notscored">${esc(nm(o.not_scored))}</p>`}
${(p.areas || []).length ? `<a class="vn-golink" href="index.html">${esc(t("open"))} →</a>` : ""}
<h3>${esc(t("sources"))}</h3><ol class="vn-src">${cited.map((i) => { const s = D.sources[i]; return `<li id="vn-src-${i}">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</li>`; }).join("")}</ol>`;
    el.hidden = false;
  }
  $("#vnPanel").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-close")) choose(null);
    else if (b.dataset.view) choose(sel, b.dataset.view === sel && P[sel].former.length === 1 ? "avg" : b.dataset.view);
    else if (b.dataset.yr) { yr = b.dataset.yr; render(); paint(); labels(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sel) choose(null); });

  /* ---------- top bar ---------- */
  function fillPick() {
    const s = $("#vnPick");
    s.innerHTML = `<option value="">${esc(t("pick"))}</option>` + Object.keys(D.regions).map((r) =>
      `<optgroup label="${esc(nm(D.regions[r]))}">${D.provinces.filter((p) => p.region === r).map((p) => `<option value="${p.id}">${esc(nm(p.name))}</option>`).join("")}</optgroup>`).join("");
    s.value = sel || "";
  }
  $("#vnPick").addEventListener("change", (e) => choose(e.target.value || null));
  function applyLang() {
    document.documentElement.lang = lang;
    $("#vnTitle").textContent = t("title");
    $("#vnBack span").textContent = t("back");
    $("#vnPickL").textContent = t("pick");
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    if (D) { fillPick(); labels(); drawKey(); render(); }
  }
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { lang = b.dataset.lang; store.set("mre-lang", lang); applyLang(); }));

  /* ---------- start ---------- */
  applyLang();
  $("#vnLoad").textContent = t("load");
  fetch("data/provinces.json").then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
    D = d;
    d.provinces.forEach((p) => { P[p.id] = p; });
    d.places.forEach((x) => { PL[x.id] = x; });
    $("#vnLoad").hidden = true;
    fillPick();
    if (typeof L === "undefined" || !G) { $("#vnLoad").hidden = false; $("#vnLoad").textContent = t("nomap"); return; }
    map = L.map("vnMap", { zoomControl: false, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, minZoom: 4.5, maxZoom: 13,
      maxBounds: [[MAIN.s - 4, MAIN.w - 6], [MAIN.n + 3, 118]], maxBoundsViscosity: 0.9, zoomAnimation: !reduced(), fadeAnimation: !reduced() });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.fitBounds([[MAIN.s, MAIN.w], [MAIN.n, MAIN.e]], { padding: [20, 20], animate: false });
    // the offline tiles (tiles.js) only cover Sóc Trăng, so the whole country uses the same Esri imagery online
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 13, maxNativeZoom: 13, className: "sg-tiles sg-tiles-sat",
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics · <a href="https://www.geoboundaries.org" target="_blank" rel="noopener">Outlines: geoBoundaries / OCHA, CC BY 3.0 IGO</a>'
    }).addTo(map);
    drawMap();
    paint();
    const q = new URLSearchParams(location.search).get("p");
    if (q && P[q]) choose(q);
    addEventListener("resize", () => { map.invalidateSize(); placeLabels(); });
  }).catch((e) => { console.warn(e); $("#vnLoad").hidden = false; $("#vnLoad").textContent = t("fail"); });
})();
