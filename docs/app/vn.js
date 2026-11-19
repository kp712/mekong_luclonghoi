/* vn.js: the whole of Vietnam on the planner's own map (map.js), so there is one map: zoom out from the 5 Sóc Trăng
   areas to the 34 provinces. Same look as the areas: white dashed outlines (the 34 provinces, their former provinces
   dotted inside), a see-through colour layer blended between the 63 province points and clipped to the outlines (rain,
   or rain minus crop water need), gold pins with name plates, and a province panel. The colour, pins and key show when
   zoomed out past COUNTRY_Z (or with a province open); zoomed in, the planner looks as before.
   Data: data/provinces.json (pipeline/build.py), loaded after the app; outlines: VN_GEO (app/vn_geo.js, make_outlines.py).
   Globals used: L, VN_GEO, MapView (its Leaflet map), App, Dash, DISTRICTS. Exposes VnMap.country(). */
const VnMap = (() => {
  const $ = (s) => document.querySelector(s);
  const store = { get: (k) => { try { return localStorage.getItem(k) } catch (e) { return null } } };
  const appLang = () => (window.App && App.lang ? App.lang() : store.get("mre-lang") === "en" ? "en" : "vi");
  let lang = appLang();
  const COUNTRY_Z = 9.25;  // the planner's own view starts at zoom 9 (map.js used to stop there)
  document.body.insertAdjacentHTML("beforeend", '<div class="vn-key vn-app" id="vnKey" hidden></div><aside class="vn-panel vn-app" id="vnPanel" hidden aria-live="polite"></aside>');
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
    open: ["Zoom to the 5 Sóc Trăng areas to plan a field", "Phóng to 5 khu vực Sóc Trăng để lập kế hoạch ruộng"],
    sources: ["Sources", "Nguồn"],
    region: ["Region", "Vùng"],
    saltM: ["Salt", "Độ mặn"], saltH: ["Salt in the water (‰), 5 Sóc Trăng areas only", "Độ mặn của nước (‰), chỉ 5 khu vực Sóc Trăng"],
    fresh: ["fresh", "ngọt"], shrimp: ["shrimp water", "nước nuôi tôm"],
    saltNote: ["Blank = no salt estimate yet. Estimate from station reports, not satellite.", "Để trống = chưa có ước tính độ mặn. Ước tính từ báo cáo trạm đo, không phải vệ tinh."],
    rainNote: ["One scale all year. Colour between data points is an estimate, not a measurement.", "Một thang màu cả năm. Màu giữa các điểm số liệu là ước tính, không phải số đo."],
    find: ["Find your area", "Tìm khu vực của bạn"], findPh: ["Province, district or town", "Tỉnh, huyện hoặc thị trấn"],
    loc: ["Use my location", "Dùng vị trí của tôi"], kProv: ["Province", "Tỉnh"], kFormer: ["former province", "tỉnh cũ"], kArea: ["Sóc Trăng area", "Khu vực Sóc Trăng"],
    search: ["Search the map for “{q}”", "Tìm “{q}” trên bản đồ"], searching: ["Searching…", "Đang tìm…"],
    notFound: ["No place found. Try a province or district name.", "Không tìm thấy. Thử tên tỉnh hoặc huyện."],
    near: ["Nearest data: {n}, {k} km from {q}.", "Số liệu gần nhất: {n}, cách {q} {k} km."], inArea: ["{q} is in the {n} area.", "{q} nằm trong khu vực {n}."],
    you: ["your location", "vị trí của bạn"], locFail: ["Could not get your location.", "Không lấy được vị trí của bạn."],
    osm: ["Place search: OpenStreetMap Nominatim", "Tìm địa điểm: OpenStreetMap Nominatim"],
    chosen: ["Selected area", "Khu vực đã chọn"], details: ["Full details", "Xem đầy đủ"], hideD: ["Hide details", "Ẩn chi tiết"],
    rainM: ["Rain this month", "Mưa trong tháng"], saltMon: ["Salt this month", "Mặn tháng này"], noData: ["No data", "Chưa có"],
    cropsY: ["Crops a year", "Số vụ mỗi năm"], pts: ["{n} points", "{n} điểm"],
    sAvg: ["Average {a} mm · wettest {n} {m} mm", "Trung bình {a} mm · mưa nhiều nhất {n} {m} mm"],
    sBal: ["{n} of {t} points get more rain than crops need", "{n}/{t} điểm có mưa nhiều hơn cây cần"],
    srcRain: ["Rain: NASA GPM IMERG", "Mưa: NASA GPM IMERG"], srcBal: ["Rain: NASA GPM IMERG · water need: NASA POWER (FAO-56)", "Mưa: NASA GPM IMERG · nhu cầu nước: NASA POWER (FAO-56)"]
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
  let sel = null, view = "avg", yr = "typical", mode = "salt", keyOpen = !isPhone(), hov = null, panelOpen = true;
  const curMon = () => (typeof D5 !== "undefined" && D5.mon ? D5.mon() : new Date().getMonth());  // the month slider (extra.js) drives every mode
  let mon = curMon();
  const desktop = () => !isPhone();

  /* ---------- geometry: arcs -> rings ---------- */
  let G = typeof VN_GEO !== "undefined" ? VN_GEO : null;
  const arcPts = (i) => (i >= 0 ? G.arcs[i] : G.arcs[~i].slice().reverse());
  const ringPts = (r) => { const out = []; r.forEach((i) => { const a = arcPts(i); out.push(...(out.length ? a.slice(1) : a)) }); return out };
  const ll = (p) => [p[1], p[0]];
  const MAIN = { w: 102.1, e: 109.6, s: 8.3, n: 23.45 };  // mainland + near islands: the colour layer and the home view

  /* ---------- the data a view shows ---------- */
  const climOf = (o) => (yr === "elnino" ? o.elnino.climate : o.climate);
  function value(o, m) {
    const c = climOf(o), r = m < 0 ? sum(c.rain_mm) : c.rain_mm[m];
    return mode === "bal" ? r - (m < 0 ? sum(c.et0_mm) : c.et0_mm[m]) : r;
  }
  /* the data points of the rain layers: the 63 province points, plus the 5 Sóc Trăng areas in a typical year */
  const stSites = () => (typeof RX !== "undefined" && RX.Core && RX.Core.sites ? RX.Core.sites() : []);
  function points() {
    const pts = D.places.map((x) => ({ lat: x.lat, lon: x.lon, name: nm(x.name), rain: climOf(x).rain_mm, et0: climOf(x).et0_mm }));
    if (yr === "typical") stSites().forEach((s) => { if (s.rain && s.et0) pts.push({ lat: s.lat, lon: s.lon, name: RX.Core.short(s), rain: s.rain, et0: s.et0 }); });
    return pts;
  }
  const pv = (p, m) => (mode === "bal" ? p.rain[m] - p.et0[m] : p.rain[m]);
  /* one scale for the whole year (per mode and year type), so playing the 12 months shows the seasons */
  function yearRange() {
    const pts = points(), all = pts.flatMap((p) => p.rain.map((_, m) => pv(p, m)));
    if (mode === "rain") return [0, Math.max(...all)];
    const a = Math.max(...all.map(Math.abs)); return [-a, a];
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
  /* An image overlay is stretched by Leaflet in Web Mercator, so its rows follow Mercator y, not latitude: over 15° of
     latitude a plain lat/lon image drifts ~20 km off the outlines (unnoticeable over Sóc Trăng's small box in map.js). */
  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)), unmerc = (y) => (Math.atan(Math.exp(y)) - Math.PI / 4) * 360 / Math.PI;
  /* a see-through colour image over box B: colour(lat, lon) -> [r, g, b] sampled on a gw-wide grid, smoothed, clipped to rings */
  function clipImage(B, rings, gw, alpha, colour, base = 700) {
    const yN = merc(B.n), yS = merc(B.s), xr = (B.e - B.w) * Math.PI / 180;
    const W = Math.round(base * Math.min(2, window.devicePixelRatio || 1)), H = Math.round(W * (yN - yS) / xr);
    const gh = Math.max(2, Math.round(gw * H / W));
    const small = document.createElement("canvas"); small.width = gw; small.height = gh;
    const sx = small.getContext("2d"), img = sx.createImageData(gw, gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const rgb = colour(unmerc(yN - (j + 0.5) / gh * (yN - yS)), B.w + (i + 0.5) / gw * (B.e - B.w)), k = (j * gw + i) * 4;
      img.data[k] = rgb[0]; img.data[k + 1] = rgb[1]; img.data[k + 2] = rgb[2]; img.data[k + 3] = alpha;
    }
    sx.putImageData(img, 0, 0);
    const big = document.createElement("canvas"); big.width = W; big.height = H;
    const bx = big.getContext("2d");
    bx.beginPath();
    rings.forEach((r) => r.forEach(([lon, lat], q) => { const x = (lon - B.w) / (B.e - B.w) * W, y = (yN - merc(lat)) / (yN - yS) * H; q ? bx.lineTo(x, y) : bx.moveTo(x, y); }));
    bx.clip("evenodd");
    bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = "high";
    bx.drawImage(small, 0, 0, W, H);
    return big.toDataURL("image/png");
  }
  const idw = (pts, lat, lon) => { let w = 0, v = 0; for (const p of pts) { const d2 = (p.lat - lat) ** 2 + ((p.lon - lon) * 0.96) ** 2; if (d2 < 1e-10) return p.v; const q = 1 / (d2 * d2); w += q; v += q * p.v; } return v / w; };
  let range = [0, 1];
  /* salt: only the 5 Sóc Trăng areas have an estimate (map.js colours them); every province stays blank.
     rain / rain minus need: every province and the 5 areas, one colour scale for the year. */
  function paint() {
    if (!map || !G) return;
    const gp = map.getPane("grad"); if (gp) gp.style.display = mode === "salt" ? "" : "none";
    map.getPane("vn-grad").style.display = mode === "salt" ? "none" : "";
    document.body.classList.toggle("vn-rainlayer", mode !== "salt");
    if (mode !== "salt") {
      const pts = points().map((p) => ({ lat: p.lat, lon: p.lon, v: pv(p, mon) }));
      range = yearRange();
      const rings = Object.values(G.province).flatMap((rs) => rs.map(ringPts));
      const url = clipImage(MAIN, rings, 110, 150, (lat, lon) => ramp(mode === "rain" ? BLUE : DIV, (idw(pts, lat, lon) - range[0]) / Math.max(1e-6, range[1] - range[0])));
      if (gradLayer) gradLayer.setUrl(url); else gradLayer = L.imageOverlay(url, [[MAIN.s, MAIN.w], [MAIN.n, MAIN.e]], { pane: "vn-grad", interactive: false }).addTo(map);
    }
  }
  /* the month slider asks what to write under the month in the rain layers (null in salt: it keeps its own text) */
  function sliderInfo(m) {
    if (!D || mode === "salt") return null;
    const pts = points(), vs = pts.map((p) => pv(p, m));
    let count;
    if (mode === "rain") { const i = vs.indexOf(Math.max(...vs)); count = fill(t("sAvg"), { a: num(sum(vs) / vs.length), n: pts[i].name, m: num(vs[i]) }); }
    else count = fill(t("sBal"), { n: vs.filter((v) => v >= 0).length, t: vs.length });
    const wet = Array.from({ length: 12 }, (_, k) => { const r = sum(pts.map((p) => p.rain[k])), e = sum(pts.map((p) => p.et0[k])); return r >= e; });
    return { count, note: t(mode === "rain" ? "srcRain" : "srcBal"), wet };
  }

  /* ---------- the layer box: in the left panel (#sdLayer, side.js) on desktop, in the key pop-up on phones ---------- */
  const SALT = [[0, [47, 127, 208]], [0.1, [47, 163, 107]], [0.2, [226, 179, 58]], [0.47, [229, 121, 58]], [1, [200, 55, 45]]];  // map.js salt colours, 0.5–15 ‰
  function layerHTML() {
    const stops = mode === "salt" ? SALT : mode === "rain" ? BLUE : DIV;
    const grad = stops.map(([f, c]) => `rgb(${c}) ${Math.round(f * 100)}%`).join(",");
    const ends = mode === "salt" ? [`< 1‰ · ${t("fresh")}`, `${t("shrimp")} · 10‰ +`] : mode === "rain" ? [`${num(range[0])} · ${t("less")}`, `${t("more")} · ${num(range[1])} mm`] : [`${num(range[0])} · ${t("dry")}`, `${t("wet")} · ${num(range[1])}`];
    return `<p class="vn-lay-h">${esc(t("show"))}</p>
<div class="vn-three" role="group" aria-label="${esc(t("show"))}">${["salt", "rain", "bal"].map((m) => `<button type="button" data-mode="${m}" aria-pressed="${mode === m}">${esc(t(m === "salt" ? "saltM" : m))}</button>`).join("")}</div>
${mode === "salt" ? "" : `<div class="vn-two vn-yrs">${["typical", "elnino"].map((m) => `<button type="button" data-yr="${m}" aria-pressed="${yr === m}">${esc(t(m))}</button>`).join("")}</div>`}
<b class="vn-key-h">${esc(t(mode === "salt" ? "saltH" : mode === "rain" ? "rainH" : "balH"))}</b>
<i class="vn-ramp" style="background:linear-gradient(90deg,${grad})"></i>
<div class="vn-ends"><span>${esc(ends[0])}</span><span>${esc(ends[1])}</span></div>
<p class="vn-note">${esc(t(mode === "salt" ? "saltNote" : "rainNote"))}</p>`;
  }
  function findHTML() {
    return `<div class="vn-find"><label class="vn-find-l" for="vnFind">${esc(t("find"))}</label>
<div class="vn-find-in"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
<input id="vnFind" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(t("findPh"))}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="vnFindList">
<button type="button" class="vn-loc" id="vnLoc" aria-label="${esc(t("loc"))}" title="${esc(t("loc"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/></svg></button></div>
<ul class="vn-find-list" id="vnFindList" role="listbox" hidden></ul><p class="vn-find-msg" id="vnFindMsg" aria-live="polite"></p></div>`;
  }
  /* one copy of each part, placed where it belongs; the search field is built once so typing is never interrupted */
  let findEl = null, layEl = null;
  function drawKey() {
    if (!D) return;
    if (!findEl) { findEl = document.createElement("div"); findEl.className = "vn-findwrap"; findEl.innerHTML = findHTML(); wireFind(); }
    if (!layEl) { layEl = document.createElement("div"); layEl.className = "vn-lay"; layEl.addEventListener("click", onLayer); }
    layEl.innerHTML = layerHTML();
    const el = $("#vnKey"), sf = $("#sdFind"), sl = $("#sdLayer");
    if (desktop() && sf && sl) {
      if (findEl.parentNode !== sf) sf.appendChild(findEl);
      if (layEl.parentNode !== sl) sl.appendChild(layEl);
      el.innerHTML = "";
      return;
    }
    const stops = mode === "salt" ? SALT : mode === "rain" ? BLUE : DIV, grad = stops.map(([f, c]) => `rgb(${c}) ${Math.round(f * 100)}%`).join(",");
    if (!el.querySelector(".vn-pill")) el.innerHTML = `<div class="vn-key-pop" role="group"><div class="vn-key-top"><b>${esc(t("keyPill"))}</b><button type="button" class="vn-x" data-key="close" aria-label="${esc(t("close"))}">✕</button></div><div class="vn-kf"></div><div class="vn-kl"></div></div><button type="button" class="vn-pill" data-key="toggle"></button>`;
    const pop = el.querySelector(".vn-key-pop"); pop.hidden = !keyOpen;
    el.querySelector(".vn-kf").appendChild(findEl); el.querySelector(".vn-kl").appendChild(layEl);
    const pill = el.querySelector(".vn-pill"); pill.setAttribute("aria-expanded", keyOpen);
    pill.innerHTML = `<i class="vn-ramp vn-ramp-s" style="background:linear-gradient(90deg,${grad})"></i><span>${esc(t(mode === "salt" ? "saltM" : mode))}</span><em>${esc(keyOpen ? t("hide") : t("keyPill"))}</em>`;
  }
  function onLayer(e) {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mode && b.dataset.mode !== mode) { mode = b.dataset.mode; paint(); drawKey(); slider(); }
    else if (b.dataset.yr && b.dataset.yr !== yr) { yr = b.dataset.yr; paint(); drawKey(); render(); labels(); slider(); }
  }
  const slider = () => { try { typeof D5 !== "undefined" && D5.month && D5.month(curMon()); } catch (er) {} };
  $("#vnKey").addEventListener("click", (e) => {
    const b = e.target.closest("[data-key]"); if (!b) return;
    keyOpen = b.dataset.key === "toggle" ? !keyOpen : false; drawKey();
  });
  document.addEventListener("mre:month", (e) => { mon = e.detail; paint(); if (sel) render(); });

  /* ---------- "find your area": provinces, former provinces, the 5 Sóc Trăng areas; else a place search, then the nearest data ---------- */
  const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase().replace(/^(tinh|thanh pho|tp\.?|huyen|thi xa|quan|province|city)\s+/, "").trim();
  let opts = [], act = -1, here = null;
  function entries() {
    const out = [];
    D.provinces.forEach((p) => out.push({ k: "prov", id: p.id, name: nm(p.name), sub: t("kProv") + " · " + nm(D.regions[p.region]), region: p.region, keys: [p.name.en, p.name.vi] }));
    D.places.filter((x) => !x.own).forEach((x) => out.push({ k: "place", id: x.id, prov: x.province, name: nm(x.name), sub: t("kFormer") + " → " + nm(P[x.province].name), region: x.region, keys: [x.name.en, x.name.vi] }));
    stSites().forEach((s) => out.push({ k: "site", id: s.id, name: RX.Core.short(s), sub: t("kArea"), region: "mekong_delta", keys: [s.name && s.name.en, s.name && s.name.vi, RX.Core.short(s)] }));
    return out;
  }
  function listFor(q) {
    const f = fold(q), all = entries();
    if (!f) return Object.keys(D.regions).flatMap((r) => [{ k: "head", name: nm(D.regions[r]) }].concat(all.filter((o) => o.k === "prov" && o.region === r)));
    const score = (o) => { const ks = o.keys.filter(Boolean).map(fold); return ks.some((k) => k === f) ? 0 : ks.some((k) => k.startsWith(f)) ? 1 : ks.some((k) => k.split(/\s+/).some((w) => w.startsWith(f))) ? 2 : ks.some((k) => k.includes(f)) ? 3 : 9; };
    const hits = all.map((o) => [score(o), o]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0] || (a[1].k === "prov" ? -1 : 1)).slice(0, 8).map(([, o]) => o);
    if (f.length >= 3) hits.push({ k: "geo", name: fill(t("search"), { q: q.trim() }), q: q.trim() });
    return hits;
  }
  function showList(q) {
    const ul = $("#vnFindList"), inp = $("#vnFind");
    opts = listFor(q); act = -1;
    ul.innerHTML = opts.map((o, i) => o.k === "head" ? `<li class="vn-fh" role="presentation">${esc(o.name)}</li>`
      : `<li role="option" id="vnOpt${i}" data-i="${i}" aria-selected="false" class="vn-fo vn-fo-${o.k}">${o.k === "geo" ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>' : `<i class="sg-dot vn-dot-${esc(o.region)}" aria-hidden="true"></i>`}<span><b>${esc(o.name)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ""}</span>${o.k === "prov" || o.k === "place" || o.k === "site" ? `<em>${num(railOf(o))} mm</em>` : ""}</li>`).join("");
    ul.hidden = !opts.length; inp.setAttribute("aria-expanded", !ul.hidden);
  }
  function railOf(o) {   // this month's rain, shown on the right of each row
    if (o.k === "site") { const s = stSites().find((x) => x.id === o.id); return s && s.rain ? s.rain[mon] : null; }
    const x = o.k === "prov" ? P[o.id] : PL[o.id]; return x ? climOf(x).rain_mm[mon] : null;
  }
  function hideList() { const ul = $("#vnFindList"); if (ul) { ul.hidden = true; $("#vnFind").setAttribute("aria-expanded", "false"); } }
  function move(d) {
    const idx = opts.map((o, i) => (o.k === "head" ? -1 : i)).filter((i) => i >= 0); if (!idx.length) return;
    const p = idx.indexOf(act); act = idx[(p + d + idx.length) % idx.length];
    $("#vnFindList").querySelectorAll("[role=option]").forEach((li) => li.setAttribute("aria-selected", +li.dataset.i === act));
    const li = $("#vnOpt" + act); li && li.scrollIntoView({ block: "nearest" });
    $("#vnFind").setAttribute("aria-activedescendant", "vnOpt" + act);
  }
  const msg = (s) => { const m = $("#vnFindMsg"); if (m) m.textContent = s || ""; };
  function pickOpt(o) {
    if (!o || o.k === "head") return;
    hideList(); msg("");
    const inp = $("#vnFind");
    if (o.k === "geo") { geocode(o.q); return; }
    inp.value = o.name; mark(null);
    goTo(o);
  }
  function goTo(o) {
    if (o.k === "prov") choose(o.id, "avg");
    else if (o.k === "place") choose(o.prov, o.id);
    else if (o.k === "site") {   // the planner's own area: app.js picks it from any [data-site] click
      choose(null);
      const b = document.createElement("button"); b.type = "button"; b.dataset.site = o.id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove();
      try { MapView.focus(o.id); } catch (er) {}
    }
  }
  const kmBetween = (a, b, c, d) => { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const inRing = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  /* a place (searched or the phone's location) -> its Sóc Trăng area, else the nearest data point */
  function nearestTo(lat, lon, label) {
    mark([lat, lon]);
    const Dd = typeof DISTRICTS !== "undefined" ? DISTRICTS : {};
    const sid = Object.keys(Dd).find((id) => inRing(lon, lat, Dd[id]));
    if (sid) { const s = stSites().find((x) => x.id === sid); msg(fill(t("inArea"), { q: label, n: s ? RX.Core.short(s) : sid })); goTo({ k: "site", id: sid }); return; }
    const cand = D.places.map((x) => ({ o: { k: x.own ? "prov" : "place", id: x.own ? x.province : x.id, prov: x.province }, n: nm(x.name), km: kmBetween(lat, lon, x.lat, x.lon) }))
      .concat(stSites().map((s) => ({ o: { k: "site", id: s.id }, n: RX.Core.short(s), km: kmBetween(lat, lon, s.lat, s.lon) })));
    const best = cand.sort((a, b) => a.km - b.km)[0];
    msg(fill(t("near"), { n: best.n, k: num(best.km), q: label }));
    goTo(best.o);
  }
  function mark(ll0) {
    if (here) { here.remove(); here = null; }
    if (ll0 && map) here = L.circleMarker(ll0, { radius: 7, weight: 3, color: "#fff", fillColor: "#E2B33A", fillOpacity: 1, pane: "markerPane", interactive: false }).addTo(map);
  }
  function geocode(q) {
    msg(t("searching"));
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&accept-language=" + lang + "&q=" + encodeURIComponent(q))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((a) => { if (!a.length) { msg(t("notFound")); return; } nearestTo(+a[0].lat, +a[0].lon, a[0].display_name.split(",")[0]); const m = $("#vnFindMsg"); if (m) m.textContent += " " + t("osm") + "."; })
      .catch(() => msg(t("notFound")));
  }
  function wireFind() {
    const inp = findEl.querySelector("#vnFind"), ul = findEl.querySelector("#vnFindList");
    inp.addEventListener("focus", () => showList(inp.value));
    inp.addEventListener("input", () => { msg(""); showList(inp.value); });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (ul.hidden) showList(inp.value); move(e.key === "ArrowDown" ? 1 : -1); }
      else if (e.key === "Enter") { e.preventDefault(); const first = opts.find((o) => o.k !== "head"); pickOpt(act >= 0 ? opts[act] : inp.value.trim() ? first : null); }
      else if (e.key === "Escape") { if (!ul.hidden) { e.stopPropagation(); hideList(); } }
    });
    ul.addEventListener("pointerdown", (e) => e.preventDefault());   // keep focus in the field while picking
    ul.addEventListener("click", (e) => { const li = e.target.closest("[data-i]"); if (li) pickOpt(opts[+li.dataset.i]); });
    inp.addEventListener("blur", () => setTimeout(hideList, 120));
    findEl.querySelector("#vnLoc").addEventListener("click", () => {
      if (!navigator.geolocation) { msg(t("locFail")); return; }
      msg(t("searching"));
      navigator.geolocation.getCurrentPosition((p) => nearestTo(p.coords.latitude, p.coords.longitude, t("you")), () => msg(t("locFail")), { timeout: 10000, maximumAge: 600000 });
    });
  }

  /* ---------- the selected-province card at the top of the left panel (side.js shows it in place of the area card) ---------- */
  function card() {
    if (!sel || !D) return "";
    const p = P[sel], fm = p.former.length > 1, avg = view === "avg" && fm, o = avg ? p : PL[view === "avg" ? p.id : view];
    const rain = climOf(o).rain_mm[mon];
    let crops = null;
    if (avg) { const v = p.former.map((f) => PL[f.id] && PL[f.id].ndvi).filter((n) => n && n.farmland).map((n) => n.crops_per_year); if (v.length) crops = sum(v) / v.length; }
    else if (o.ndvi && o.ndvi.farmland) crops = o.ndvi.crops_per_year;
    return `<div class="sd-hudh"><p class="sd-eyebrow">${esc(t("chosen"))}</p><button type="button" class="sd-hudbtn" data-vncard="toggle" aria-expanded="${panelOpen}">${esc(t(panelOpen ? "hideD" : "details"))}</button></div>
<div class="sd-title"><h2 class="sd-h">${esc(nm(view !== "avg" && view !== p.id ? PL[view].name : p.name))}</h2><span class="sd-chip vn-chip"><i class="sg-dot vn-dot-${esc(p.region)}" aria-hidden="true"></i>${esc(nm(D.regions[p.region]).split(" và ")[0].split(" and ")[0])}</span></div>
<dl class="sd-stats vn-cstats">
<div class="sd-stat"><dt>${esc(t("rainM"))}</dt><dd><b>${num(rain)} mm</b></dd></div>
<div class="sd-stat"><dt>${esc(t("saltMon"))}</dt><dd class="vn-nodata"><b>${esc(t("noData"))}</b></dd></div>
<div class="sd-stat"><dt>${esc(t("cropsY"))}</dt><dd><b>${crops == null ? "–" : num(crops, 1)}</b></dd></div></dl>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-vncard]"); if (!b) return;
    panelOpen = !panelOpen; render(); sideRender();
  });
  const sideRender = () => { try { typeof Side !== "undefined" && Side.render && Side.render(); } catch (er) {} };

  /* ---------- hover card (same box as the Sóc Trăng areas' #hoverCard): a year at a glance ----------
     Bars = rain each month (blue when above the crops' water need, muted when below), gold tick = water need (ET₀),
     thin whisker = driest to wettest year, outlined column = the slider's month. Under it: field greenness (MODIS,
     where there is a farmland pixel) and hot days (≥ 35 °C), then this month in words. */
  const canHover = () => window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  const HC = {
    green: ["Greenness of the fields (NASA MODIS)", "Độ xanh của ruộng (NASA MODIS)"], heat: ["Hot days ≥ 35 °C (NASA POWER)", "Ngày nóng ≥ 35 °C (NASA POWER)"],
    wet: ["Rain above crop water use", "Mưa nhiều hơn cây cần"], dry: ["Drier than crops need", "Khô hơn cây cần"], range: ["Driest–wettest year", "Năm khô nhất–ẩm nhất"],
    salt: ["Salt", "Mặn"], noSalt: ["no estimate here yet", "chưa có ước tính ở đây"], tip: ["Click for full details", "Bấm để xem đầy đủ"],
    now: ["{m}: {r} mm rain, crops need {e} mm", "{m}: mưa {r} mm, cây cần {e} mm"], surplus: ["{v} mm to spare", "dư {v} mm"], deficit: ["short by {v} mm", "thiếu {v} mm"],
    hotN: ["{n} hot days", "{n} ngày nóng"], avgOf: ["Average of {n} former provinces", "Trung bình {n} tỉnh cũ"]
  };
  const ht = (k) => HC[k][lang === "vi" ? 1 : 0];
  function cardHTML(p, o) {
    const x = o || p, c = climOf(x), m = mon, top = Math.max(...c.rain_mm, ...c.et0_mm, 1) * 1.25;  // the wettest-year whisker may run off the top
    const pc = (v) => (Math.min(1, v / top) * 100).toFixed(1);
    const bars = c.rain_mm.map((r, i) => `<span class="hb ${r >= c.et0_mm[i] ? "wet" : "dry"}${i === m ? " now" : ""}"><i class="w" style="bottom:${pc(c.rain_min_mm[i])}%;height:${(pc(c.rain_max_mm[i]) - pc(c.rain_min_mm[i])).toFixed(1)}%"></i><i class="r" style="height:${Math.max(3, pc(r))}%"></i><i class="e" style="bottom:${pc(c.et0_mm[i])}%"></i></span>`).join("");
    const nd = (o || PL[p.id] || {}).ndvi, hmax = Math.max(...c.hot_days, 1);
    const green = nd && nd.farmland && nd.monthly ? `<div class="hc-green" aria-hidden="true">${nd.monthly.map((g) => `<i style="opacity:${Math.max(.15, Math.min(1, (g - .2) / .5)).toFixed(2)}"></i>`).join("")}</div><div class="hc-gl">${esc(ht("green"))}</div>` : "";
    const heat = sum(c.hot_days) >= 1 ? `<div class="hc-green vn-heat" aria-hidden="true">${c.hot_days.map((h) => `<i style="opacity:${h < .5 ? .08 : Math.max(.3, h / hmax).toFixed(2)}"></i>`).join("")}</div><div class="hc-gl">${esc(ht("heat"))}</div>` : "";
    const r = c.rain_mm[m], e = c.et0_mm[m], d = r - e, hot = c.hot_days[m];
    const title = o && !o.own ? `${nm(o.name)} <small>${esc(t("former"))} → ${esc(nm(p.name))}</small>` : esc(nm(p.name));
    return `<div class="hc-ey"><i class="sg-dot vn-dot-${esc(p.region)}"></i>${esc(t(yr))} · ${esc(nm(D.regions[p.region]).split(" và ")[0].split(" and ")[0])}</div>
<b class="hc-name">${title}</b>
${!o && p.former.length > 1 ? `<p class="vn-hc-sub">${esc(fill(ht("avgOf"), { n: p.former.length }))}</p>` : ""}
<div class="hc-bars vn-hc-bars" role="img" aria-label="${esc(c.rain_mm.map((v, i) => `${MONL[lang][i]} ${num(v)} mm`).join(", "))}">${bars}</div>
<div class="hc-m" aria-hidden="true">${MON[lang].map((x0, i) => `<span${i === m ? ' class="on"' : ""}>${x0}</span>`).join("")}</div>
${green}${heat}
<p class="vn-hc-now"><b>${esc(fill(ht("now"), { m: MONL[lang][m], r: num(r), e: num(e) }))}</b><span class="${d >= 0 ? "up" : "down"}">${esc(fill(ht(d >= 0 ? "surplus" : "deficit"), { v: num(Math.abs(d)) }))}</span>${hot >= .5 ? `<span class="hot">${esc(fill(ht("hotN"), { n: num(hot) }))}</span>` : ""}</p>
<p class="hc-salt"><span class="k-salt vn-k-none"></span>${esc(ht("salt"))}: <b>${esc(ht("noSalt"))}</b></p>
<p class="hc-key"><span><i class="k-wet"></i>${esc(ht("wet"))}</span><span><i class="k-dry"></i>${esc(ht("dry"))}</span><span><i class="k-e"></i>ET₀ NASA POWER</span><span><i class="vn-k-w"></i>${esc(ht("range"))}</span></p>
<small class="hc-tip">${esc(ht("tip"))}</small>`;
  }
  let hcOn = false;
  function card2(p, o, ev) {
    const hc = $("#hoverCard"); if (!hc) return;
    if (!p || !canHover() || !D || !countryOn) { if (hcOn) { hc.classList.remove("show", "vn-hc"); hc.setAttribute("aria-hidden", "true"); hcOn = false; } return; }
    hc.innerHTML = cardHTML(p, o); hc.classList.add("show", "vn-hc"); hc.removeAttribute("aria-hidden"); hc.hidden = false; hc.style.margin = "0"; hcOn = true;
    placeCard(ev);
  }
  function placeCard(ev) {
    const hc = $("#hoverCard"); if (!hcOn || !hc || !ev) return;
    const bw = hc.offsetWidth || 280, bh = hc.offsetHeight || 300;
    let x = ev.clientX + 22, y = ev.clientY - bh / 2;
    const sd = $("#side"), sr = sd && sd.offsetWidth ? sd.getBoundingClientRect().right + 10 : 10;
    if (x + bw > innerWidth - 10) x = ev.clientX - bw - 22;
    x = Math.max(sr, Math.min(innerWidth - bw - 10, x)); y = Math.max(70, Math.min(innerHeight - bh - 10, y));
    hc.style.left = x + "px"; hc.style.top = y + "px";
  }

  /* ---------- outlines and pins ---------- */
  function drawMap() {
    // under the planner's own panes (grad 404, cells 410, labels 610): its Sóc Trăng areas stay on top and keep their taps
    map.createPane("vn-grad").style.zIndex = 401; map.getPane("vn-grad").style.pointerEvents = "none";
    map.createPane("vn-inner").style.zIndex = 402; map.getPane("vn-inner").style.pointerEvents = "none";
    map.createPane("vn-cells").style.zIndex = 403;
    map.createPane("vn-labels").style.zIndex = 605;
    const R = L.svg({ pane: "vn-cells", padding: 0.6 }), RI = L.svg({ pane: "vn-inner", padding: 0.6 });
    // borders between former provinces inside one new province: thin dotted lines
    G.inner.forEach((i) => L.polyline(G.arcs[i].map(ll), { pane: "vn-inner", renderer: RI, interactive: false, className: "vn-inner", smoothFactor: 0, noClip: true }).addTo(map));
    D.provinces.forEach((p) => {
      const poly = L.polygon(G.province[p.id].map((r) => ringPts(r).map(ll)), { pane: "vn-cells", renderer: R, className: "vn-prov", smoothFactor: 0, noClip: true, bubblingMouseEvents: false, weight: 1.5 }).addTo(map);
      poly.on("mouseover", (e) => { hover(p.id); card2(p, null, e.originalEvent); });
      poly.on("mousemove", (e) => placeCard(e.originalEvent));
      poly.on("mouseout", () => { hover(null); card2(null); });
      poly.on("click", () => choose(p.id, "avg"));
      polys[p.id] = poly;
    });
    const add = (o, kind, onClick) => {
      const size = kind === "own" ? 44 : kind === "former" ? 32 : 24;
      const label = nm(o.name);
      const m = L.marker([o.lat, o.lon], { icon: L.divIcon({ className: "sg-pin vn-pin-" + kind, html: `<button type="button" class="sg-pin-btn" aria-label="${esc(label)}"><i class="sg-p-pulse"></i><i class="sg-p-ring"></i><i class="sg-p-core"></i><i class="sg-p-tick sg-t-n"></i><i class="sg-p-tick sg-t-e"></i><i class="sg-p-tick sg-t-s"></i><i class="sg-p-tick sg-t-w"></i></button>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }), keyboard: false, zIndexOffset: kind === "own" ? 300 : kind === "former" ? 200 : 100 }).addTo(map);
      const lm = L.marker([o.lat, o.lon], { pane: "vn-labels", interactive: false, keyboard: false, icon: L.divIcon({ className: "sg-label-wrap vn-lw", html: '<span class="sg-label sg-hide vn-label-' + kind + '"></span>', iconSize: [0, 0] }) }).addTo(map);
      const btn = m.getElement().querySelector("button"), lab = lm.getElement().querySelector(".sg-label");
      [btn, lab].forEach((x) => { L.DomEvent.disableClickPropagation(x); x.addEventListener("click", (e) => { e.stopPropagation(); onClick(); }); });
      btn.addEventListener("mouseenter", (e) => { hover(o.province); card2(P[o.province], o, e); });
      btn.addEventListener("mouseleave", () => { hover(null); card2(null); });
      pins[o.id + ":" + kind] = { o, kind, btn, lab, m, lm };
    };
    D.places.forEach((x) => add(x, x.own ? "own" : "former", () => choose(x.province, x.id)));
    labels();
    map.on("zoomend", country);
    map.on("zoomend moveend", placeLabels);
    map.on("click", () => { if (sel) choose(null); });
    country();
  }
  function labels() {
    Object.values(pins).forEach((p) => {
      const o = p.o, pr = P[o.province];
      let small = "";
      // what the satellites saw there, as on the Sóc Trăng plates: MODIS crops a year on farmland, else GPM rain a year
      if (o.ndvi && o.ndvi.farmland) small = `MODIS · ${num(o.ndvi.crops_per_year, 1)} ${lang === "vi" ? "vụ/năm" : "crops/yr"}`;
      else small = `GPM · ${num(sum(climOf(o).rain_mm))} ${lang === "vi" ? "mm mưa/năm" : "mm rain/yr"}`;
      const name = nm(o.name);
      p.lab.innerHTML = `<i class="sg-dot vn-dot-${esc(pr.region)}" aria-hidden="true"></i><b>${esc(name)}</b>${small ? `<small>${esc(small)}</small>` : ""}`;
      p.btn.setAttribute("aria-label", name);
    });
    placeLabels();
  }
  /* name plates: right of the pin, else left; hidden when both sides are taken (shown on hover/selection).
     Zoomed out, only the provinces' own pins get plates; former provinces from zoom 7.5. */
  function placeLabels() {
    if (!map) return;
    const z = map.getZoom(), taken = [], size = map.getSize();
    if (!countryOn) return;
    const show = (k) => k === "own" || (k === "former" && z >= 7.5);
    const list = Object.values(pins);
    list.forEach((p) => { const c = map.latLngToContainerPoint([p.o.lat, p.o.lon]); p.c = c; taken.push({ x0: c.x - 8, x1: c.x + 8, y0: c.y - 8, y1: c.y + 8 }); });
    const isSel = (p) => sel && (p.o.id === view || (view === "avg" && p.kind === "own" && p.o.province === sel));
    const rank = { own: 0, former: 1 };
    const order = list.slice().sort((a, b) => isSel(b) - isSel(a) || rank[a.kind] - rank[b.kind]);
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
  /* zoomed out (or a province open): colour, pins, plates and key; zoomed in on the planner: only the outlines */
  let countryOn = null;
  function country() {
    const on = map.getZoom() < COUNTRY_Z || !!sel;
    $("#vnKey").hidden = !on || desktop();
    if (on === countryOn) return;
    countryOn = on;
    map.getPane("vn-labels").style.display = on ? "" : "none";  // the colour layer follows the mode (paint), at every zoom
    Object.values(pins).forEach((p) => { p.m.getElement().style.display = on ? "" : "none"; });
    document.body.classList.toggle("vn-country", on);
    if (on) placeLabels();
  }
  function hover(id) {
    hov = id;
    Object.entries(polys).forEach(([k, p]) => { const e = p.getElement(); if (e) e.classList.toggle("is-hover", k === id); });
  }

  /* ---------- selection and the side panel ---------- */
  function choose(id, v) {
    card2(null);
    sel = id || null; view = v || "avg";
    if (sel && keyOpen && isPhone()) { keyOpen = false; drawKey(); }  // room for the province on phones
    if (sel) panelOpen = true;
    Object.entries(polys).forEach(([k, p]) => { const e = p.getElement(); if (e) e.classList.toggle("is-sel", k === sel); });
    const ps = $("#vnPick"); if (ps) ps.value = sel || "";
    document.body.classList.toggle("vn-open", !!sel);
    if (sel && window.App && App.closePanel) try { App.closePanel(); } catch (e) {}  // one panel on the right at a time
    render();
    country();
    placeLabels();
    if (sel && map) {
      const top = ($("#topbar") || { offsetHeight: 64 }).offsetHeight, b = polys[sel].getBounds(),
        pad = isPhone() ? { tl: [16, top + 16], br: [16, Math.round(innerHeight * 0.58) + 12] } : { tl: [380, top + 20], br: [panelOpen ? 480 : 40, 40] };
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
    sideRender();
    if (!sel || !panelOpen) { el.hidden = true; el.innerHTML = ""; return; }
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
${(p.areas || []).length ? `<button type="button" class="vn-golink" data-home>${esc(t("open"))} →</button>` : ""}
<h3>${esc(t("sources"))}</h3><ol class="vn-src">${cited.map((i) => { const s = D.sources[i]; return `<li id="vn-src-${i}">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</li>`; }).join("")}</ol>`;
    el.hidden = false;
  }
  $("#vnPanel").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-close")) { panelOpen = false; render(); }
    else if (b.hasAttribute("data-home")) { choose(null); try { MapView.home(); } catch (er) {} }
    else if (b.dataset.view) choose(sel, b.dataset.view === sel && P[sel].former.length === 1 ? "avg" : b.dataset.view);
    else if (b.dataset.yr) { yr = b.dataset.yr; render(); paint(); labels(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sel) { e.preventDefault(); choose(null); } });

  /* ---------- language follows the app; the planner's drawer and this panel never show together ---------- */
  function applyLang() { if (D) { if (findEl) { findEl.innerHTML = findHTML(); wireFind(); } labels(); drawKey(); render(); slider(); } }
  function sync() {
    const l = appLang(); if (l !== lang) { lang = l; applyLang(); }
    if (sel && document.body.classList.contains("drawer-open")) choose(null);
  }
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if (window.RX && RX.Core && RX.Core.onLang) RX.Core.onLang(() => setTimeout(sync, 0));

  /* the whole country on this map; from the dashboard, step out to the map first */
  function showCountry() {
    if (!map || !D) { want = true; return; }  // before the data: once it is drawn
    try { if (typeof Dash !== "undefined" && Dash.showMap) Dash.showMap(); } catch (e) {}
    try { if (window.App && App.closePanel) App.closePanel(); } catch (e) {}
    const top = ($("#topbar") || { offsetHeight: 64 }).offsetHeight;
    setTimeout(() => map.fitBounds([[MAIN.s, MAIN.w], [MAIN.n, MAIN.e]], { paddingTopLeft: [20, top + 10], paddingBottomRight: [20, isPhone() ? 90 : 30], animate: !reduced() }), 80);
  }
  let want = location.hash === "#vietnam";

  /* ---------- start, once the planner map exists ---------- */
  function start() {
    map = typeof MapView !== "undefined" && MapView.leaflet;
    if (!map || D) return;
    if (!G) {  // vn_geo.js (~90 KB gzipped) loads after the planner is up
      const s = document.createElement("script");
      s.src = "app/vn_geo.js";
      s.onload = () => { G = typeof VN_GEO !== "undefined" ? VN_GEO : null; if (G) start(); };
      document.head.appendChild(s);
      return;
    }
    fetch("data/provinces.json").then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
      D = d;
      d.provinces.forEach((p) => { P[p.id] = p; });
      d.places.forEach((x) => { PL[x.id] = x; });
      map.attributionControl.addAttribution('<a href="https://www.geoboundaries.org" target="_blank" rel="noopener">Outlines: geoBoundaries / OCHA, CC BY 3.0 IGO</a>');
      drawMap();
      paint();
      drawKey();
      slider();
      addEventListener("resize", () => { drawKey(); country(); });
      // the address index.html#vietnam: after the planner's own first view (home/dashboard may re-centre on Sóc Trăng once)
      if (want) {
        want = false; showCountry();
        // the app's start-up may re-centre on Sóc Trăng once more: for a few seconds, until the user touches the map, keep the country view
        let touched = false; const until = Date.now() + 5000;
        const mark = () => { touched = true; };
        map.getContainer().addEventListener("pointerdown", mark, { once: true }); map.getContainer().addEventListener("wheel", mark, { once: true });
        const keep = () => { if (touched || Date.now() > until) { map.off("moveend", keep); return; } if (map.getZoom() >= COUNTRY_Z) showCountry(); };
        map.on("moveend", keep);
      }
      addEventListener("resize", placeLabels);
    }).catch((e) => console.warn("vn.js", e));
  }
  if (typeof MapView !== "undefined" && MapView.leaflet) start(); else document.addEventListener("mapview:ready", start, { once: true });
  return { country: showCountry, card, sliderInfo, mount: drawKey, selected: () => sel };
})();
