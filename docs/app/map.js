/* map.js: Leaflet map for the Sigma draft. Globals used: L (Leaflet 1.9.4), TILES (tiles.js).
   Exposes: const MapView = { init, select, home, focus, resize, labels, month, hover }. */
/* Leaflet missing (CDN blocked or down): an empty MapView, so `typeof MapView` and the callers' feature checks
   keep working and the cards and plan still show without the map. A throwing initializer would leave the const uninitialised. */
const MapView = typeof L === "undefined" ? {} : (() => {
  /* Coast of the area (lon/lat) and the Hậu River, copied from Draft 3 (without its pixel projection). */
  const LAND = [[105.40,9.91],[105.84,9.91],[105.93,9.81],[106.05,9.72],[106.17,9.64],[106.27,9.56],[106.33,9.50],[106.30,9.45],[106.22,9.41],[106.12,9.36],[106.03,9.31],[105.93,9.27],[105.82,9.23],[105.70,9.20],[105.58,9.18],[105.40,9.17]];
  const RIVER = [[105.86,9.95],[105.955,9.84],[106.06,9.755],[106.175,9.672],[106.28,9.595],[106.40,9.53]];

  const BBOX = { w: 105.40, e: 106.40, s: 9.12, n: 9.91 };
  const PAD = 0.6;   // bbox padding for maxBounds (0.25 was too tight to centre an area clear of the drawer / bottom sheet)
  const LAYER_ZOOM = { sat: [9, 12] };

  let map, el, coordsEl, cb = {};
  let sites = [], lang = "en", tileLayer = null;
  let cells = {};            // id -> { ring: [[lon,lat]...], poly, bounds }
  let pins = {};             // id -> { btn, label, marker, labelMarker }
  let selId = null, cellOver = null, pinOver = null, lastEmit = null;
  let hovOutline = null, selOutline = null;
  let lastLL = null;

  const ll = (p) => [p[1], p[0]];                       // [lon,lat] -> Leaflet [lat,lon]
  const isPhone = () => window.innerWidth <= 760;
  /* "Former Vĩnh Châu area (rice, inland)" -> "Vĩnh Châu"; "Khu vực Vĩnh Châu cũ (lúa, nội đồng)" -> "Vĩnh Châu" */
  const shortName = (s) => (s.name[lang] || s.name.en || s.id).split(" (")[0]
    .replace(/^(Former |Khu vực )/, "").replace(/( area| cũ)$/, "");
  const fullName = (s) => s.name[lang] || s.name.en || s.id;
  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.body.classList.contains("calm");

  /* ---------- geometry ---------- */
  /* Keep the part of a polygon where f(p) <= 0 (Sutherland-Hodgman, one half-plane). */
  function clipHalf(poly, f) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const fa = f(a), fb = f(b);
      if (fa <= 0) out.push(a);
      if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) {
        const t = fa / (fa - fb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  /* Data area of each site: a ~17 km circle around the pin (the data describes the pin's
     neighbourhood), split between neighbours like a Voronoi diagram. Draft 3's LAND outline
     is stylised and does not follow the real coast on satellite imagery, so it is not used. */
  const R_LAT = 0.155, R_LON = 0.157;
  const circle = (s) => Array.from({ length: 48 }, (_, k) => {
    const a = (k / 48) * 2 * Math.PI;
    return [s.lon + R_LON * Math.cos(a), s.lat + R_LAT * Math.sin(a)];
  });
  /* Each area is a grid of hexagons (~1.6 km) clipped to its real district outline (DISTRICTS, districts.js,
     geoBoundaries 2020, pre-2025 districts): a hex belongs to an area only if its centre is inside that district,
     so nothing is drawn on the sea or outside the five areas. */
  const HEX_KM = 1.6, HEX_GAP = .9;
  const inRing = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const DIST = () => (typeof DISTRICTS !== "undefined" ? DISTRICTS : {});
  function buildCells() {
    cells = {};
    if (!sites.length) return;
    const D = DIST(), all = Object.values(D).flat();
    if (!all.length) return;
    const lat0 = sites.reduce((a, s) => a + s.lat, 0) / sites.length;
    const kx = 111.32 * Math.cos(lat0 * Math.PI / 180), ky = 110.57, lon0 = sites.reduce((a, s) => a + s.lon, 0) / sites.length;
    const r = HEX_KM, dx = Math.sqrt(3) * r, dy = 1.5 * r;
    const xs = all.map((p) => (p[0] - lon0) * kx), ys = all.map((p) => (p[1] - lat0) * ky);
    const x0 = Math.min(...xs) - dx, x1 = Math.max(...xs) + dx, y0 = Math.min(...ys) - dy, y1 = Math.max(...ys) + dy;
    const corner = [0, 1, 2, 3, 4, 5].map((k) => { const a = (60 * k + 30) * Math.PI / 180; return [Math.cos(a) * r * HEX_GAP, Math.sin(a) * r * HEX_GAP]; });
    sites.forEach((s) => { cells[s.id] = { ring: [], hexes: [], pts: [], bounds: null, outline: (D[s.id] || []).map(ll) }; });
    for (let j = 0, y = y0; y <= y1; j++, y = y0 + j * dy) {
      for (let x = x0 + (j & 1 ? dx / 2 : 0); x <= x1; x += dx) {
        const lon = lon0 + x / kx, lat = lat0 + y / ky;
        const sid = sites.map((s) => s.id).find((id) => D[id] && inRing(lon, lat, D[id]));
        if (!sid) continue;
        const c = cells[sid];
        c.hexes.push({ c: [lat, lon], ring: corner.map((o) => [lat0 + (y + o[1]) / ky, lon0 + (x + o[0]) / kx]) });
        c.pts.push([lat, lon]);
      }
    }
    sites.forEach((s) => { const c = cells[s.id]; if (c.pts.length) { c.bounds = L.latLngBounds(c.outline.length ? c.outline : c.pts); c.ring = [1]; } });
  }
  function areaAt(lon, lat) { const D = DIST(); return sites.map((s) => s.id).find((id) => D[id] && inRing(lon, lat, D[id])) || null; }
  function inLand(lon, lat) { return !!areaAt(lon, lat); }
  function nearest(lon, lat) { return areaAt(lon, lat); }

  /* ---------- what the hex colours show: salt (by month) or soil nitrogen ---------- */
  /* Salt bands (water, ‰) tied to what grows; see the "Salt and crops" doc (FAO Paper 29 Table 4, VnEconomy 2023). */
  const BANDS = [
    { max: 1, col: "#2F7FD0", vi: "Dưới 1‰ · ngọt: mọi cây, lúa an toàn", en: "Under 1‰ · fresh: every crop, rice safe" },
    { max: 2, col: "#2FA36B", vi: "1–2‰ · hơi mặn: lúa giảm ít; không trồng hành, ớt, bắp", en: "1–2‰ · slightly salty: rice loses a little; not onion, chilli, maize" },
    { max: 4, col: "#E2B33A", vi: "2–4‰ · mặn: lúa mất ¼ đến ½", en: "2–4‰ · salty: rice loses a quarter to half" },
    { max: 10, col: "#E5793A", vi: "4–10‰ · lợ: không trồng được cây", en: "4–10‰ · brackish: no field crop" },
    { max: 1e9, col: "#C8372D", vi: "Từ 10‰ · nước nuôi tôm", en: "10‰ and over · shrimp water" }
  ];
  const bandOf = (g) => BANDS.findIndex((b) => g < b.max);
  /* Gradient: colour stops at the middle of each band (0.5, 1.5, 3, 7, 15 ‰), mixed in between. */
  const STOPS = [[0.5, [47, 127, 208]], [1.5, [47, 163, 107]], [3, [226, 179, 58]], [7, [229, 121, 58]], [15, [200, 55, 45]]];
  function rampCol(g) {
    if (g <= STOPS[0][0]) return "rgb(" + STOPS[0][1] + ")";
    for (let i = 1; i < STOPS.length; i++) if (g <= STOPS[i][0]) {
      const [a0, c0] = STOPS[i - 1], [a1, c1] = STOPS[i], f = (g - a0) / (a1 - a0);
      return "rgb(" + c0.map((v, k) => Math.round(v + (c1[k] - v) * f)).join(",") + ")";
    }
    return "rgb(" + STOPS[STOPS.length - 1][1] + ")";
  }
  /* blend the 5 area values between their pins (one station per area), so colour changes gradually */
  function saltBlend(lat, lon, vals) {
    let w = 0, v = 0;
    for (const s of sites) { const d2 = (s.lat - lat) ** 2 + ((s.lon - lon) * 0.987) ** 2; if (d2 < 1e-8) return vals[s.id]; const q = 1 / (d2 * d2); w += q; v += q * vals[s.id]; }
    return v / w;
  }
  const N_COL = "#8E5BD0";
  const TX = {
    salt: { vi: "Độ mặn", en: "Salt" }, n: { vi: "Đạm trong đất", en: "Soil nitrogen" },
    show: { vi: "Màu trên bản đồ là:", en: "Map colour shows:" },
    saltH: { vi: "Màu = độ mặn (‰ = phần ngàn = gam muối trong 1 lít nước), ", en: "Colour = salt (‰ = parts per thousand = grams of salt in 1 litre), " },
    river: { vi: "Nước sông", en: "River water" }, field: { vi: "Nước trong ruộng", en: "Water in fields" },
    riverNote: { vi: "Đỉnh mặn thường gặp ở trạm đo gần nhất (KTTV, Viện Thủy lợi miền Nam, báo cáo công khai). Không đo bằng vệ tinh. Mỗi khu vực có 1 trạm; màu chuyển dần giữa các trạm là nội suy.", en: "Usual salt peak at the nearest station (KTTV, SIWRR public reports). Not satellite. One station per area; the colour blends between stations (interpolated)." },
    fieldNote: { vi: "Ước tính của nhóm: ruộng có cống và nước mưa nên ngọt hơn sông. Hệ số lấy theo số vụ lúa vệ tinh NASA MODIS thấy được. Đo nước ruộng trước khi bơm.", en: "Team estimate: sluices and rain keep fields fresher than the river, scaled so the rice crops NASA MODIS sees can survive. Measure your water before pumping." },
    nH: { vi: "Đậm hơn = nhiều đạm (N) hơn trong lớp đất mặt 0–15 cm", en: "Darker = more nitrogen (N) in the top 0–15 cm of soil" },
    nNote: { vi: "Đạm tổng số trong đất, không phải lượng đạm cây lấy được ngay: vẫn bón phân theo khuyến cáo. Nguồn: SoilGrids 2.0 (ISRIC), bản đồ mô hình 250 m, không phải NASA; lấy mẫu 6 điểm mỗi khu vực, nội suy giữa các điểm. Xét nghiệm đất tại ruộng chính xác hơn.", en: "Total nitrogen in the soil, not what the crop can take up right away: still fertilise as advised. Source: SoilGrids 2.0 (ISRIC), 250 m modelled map, not NASA; 6 sample points per area, blended between them. A soil test on your field is more accurate." },
    gkg: { vi: "g/kg", en: "g/kg" }, typ: { vi: "năm thường", en: "typical year" }
  };
  const tx = (k) => TX[k][lang] || TX[k].en;
  let water = "river", mode = "salt", mon = new Date().getMonth(), nPts = null, nRange = [0, 1];
  function nitrogenAt(lat, lon) {   /* inverse-distance blend of the SoilGrids sample points, g/kg */
    if (!nPts) return null;
    let w = 0, v = 0;
    for (const p of nPts) { const d2 = (p.lat - lat) ** 2 + ((p.lon - lon) * 0.987) ** 2; if (d2 < 1e-8) return p.n; const q = 1 / (d2 * d2); w += q; v += q * p.n; }
    return v / w;
  }
  /* The colour layer: one image over the five areas, a smooth gradient between the station values (salt) or the
     SoilGrids sample points (nitrogen), clipped to the district outlines and see-through so the satellite shows. */
  let gradLayer = null, gradBox = null;
  const ALPHA = 0.4;
  function paintCells() {
    if (!map) return;
    const vals = {};
    sites.forEach((s) => { vals[s.id] = typeof RX !== "undefined" && RX.Model && RX.Model.saltAt ? RX.Model.saltAt(s.id, mon, false, water === "field") : 0; if (cells[s.id]) cells[s.id].salt = vals[s.id]; });
    const D = DIST(), rings = Object.values(D);
    if (!rings.length) { drawLegend(); return; }
    if (!gradBox) { const all = rings.flat(); gradBox = { w: Math.min(...all.map((p) => p[0])), e: Math.max(...all.map((p) => p[0])), s: Math.min(...all.map((p) => p[1])), n: Math.max(...all.map((p) => p[1])) }; }
    const B = gradBox, W = Math.round(900 * Math.min(2, window.devicePixelRatio || 1)), H = Math.round(W * (B.n - B.s) / ((B.e - B.w) * Math.cos(9.5 * Math.PI / 180)));
    const gw = 120, gh = Math.max(2, Math.round(gw * H / W));
    const small = document.createElement("canvas"); small.width = gw; small.height = gh;
    const sx = small.getContext("2d"), img = sx.createImageData(gw, gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const lon = B.w + (i + 0.5) / gw * (B.e - B.w), lat = B.n - (j + 0.5) / gh * (B.n - B.s), k = (j * gw + i) * 4;
      let rgb, a;
      if (mode === "n" && nPts) { const v = nitrogenAt(lat, lon), f = Math.max(0, Math.min(1, (v - nRange[0]) / Math.max(1e-6, nRange[1] - nRange[0]))); rgb = [142, 91, 208]; a = 0.1 + 0.55 * f; }
      else { rgb = rampCol(saltBlend(lat, lon, vals)).slice(4, -1).split(",").map(Number); a = ALPHA; }
      img.data[k] = rgb[0]; img.data[k + 1] = rgb[1]; img.data[k + 2] = rgb[2]; img.data[k + 3] = Math.round(a * 255);
    }
    sx.putImageData(img, 0, 0);
    const big = document.createElement("canvas"); big.width = W; big.height = H;
    const bx = big.getContext("2d");
    bx.beginPath();
    rings.forEach((r) => r.forEach(([lon, lat], q) => { const x = (lon - B.w) / (B.e - B.w) * W, y = (B.n - lat) / (B.n - B.s) * H; q ? bx.lineTo(x, y) : bx.moveTo(x, y); }));
    bx.clip();
    bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = "high";
    bx.drawImage(small, 0, 0, W, H);
    const url = big.toDataURL("image/png"), bounds = [[B.s, B.w], [B.n, B.e]];
    if (gradLayer) gradLayer.setUrl(url); else gradLayer = L.imageOverlay(url, bounds, { pane: "grad", interactive: false, className: "sg-grad" }).addTo(map);
    drawLegend();
  }
  function setNitrogen(points) {
    nPts = (points || []).filter((p) => Array.isArray(p.n_cgkg)).map((p) => ({ lat: p.lat, lon: p.lon, site: p.site, n: (p.n_cgkg[0] + p.n_cgkg[1] * 2) / 3 / 100 }));
    if (!nPts.length) { nPts = null; return; }
    const v = nPts.map((p) => p.n); nRange = [Math.min(...v), Math.max(...v)];
  }
  function setMode(m) { mode = m === "n" && nPts ? "n" : "salt"; el.classList.toggle("sg-mode-n", mode === "n"); paintCells(); }
  function setMonth(m) { mon = ((m % 12) + 12) % 12; if (mode === "salt") paintCells(); }

  /* ---------- tiles ---------- */
  /* tiles are image files listed in tiles.js; a Set per layer answers "do we have this tile?" */
  const HAVE = {};
  /* Outside the saved Sóc Trăng tiles (the whole-country view, vn.js) the same layers come from their servers:
     Esri World Imagery, the saved tiles' source. */
  const ONLINE = {
    sat: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
  };
  const tileUrl = (name, key) => {
    const set = HAVE[name] || (HAVE[name] = new Set(TILES[name] || []));
    if (set.has(key)) return TILES.path + "/" + name + "/" + key + "." + TILES.ext[name];
    const [z, x, y] = key.split("/").map(Number);
    return ONLINE[name] ? ONLINE[name](z, x, y) : null;
  };
  const TileLayer = L.GridLayer.extend({
    initialize(name, options) {
      this._name = name;
      L.GridLayer.prototype.initialize.call(this, options);
    },
    createTile(coords, done) {
      const key = coords.z + "/" + coords.x + "/" + coords.y;
      const uri = tileUrl(this._name, key);
      if (!uri) {
        const d = document.createElement("div");
        d.className = "sg-tile-blank";
        setTimeout(() => done(null, d), 0);
        return d;
      }
      const img = document.createElement("img");
      img.alt = "";
      img.draggable = false;
      img.decoding = "async";
      img.onload = () => done(null, img);
      img.onerror = () => { img.style.visibility = "hidden"; done(null, img) };   // offline, an unsaved tile stays blank, not a broken-image icon
      img.src = uri;
      return img;
    }
  });
  function makeLayer(name) {
    const z = TILES[name + "Zoom"] || LAYER_ZOOM[name];
    return new TileLayer(name, {
      tileSize: 256, minNativeZoom: 0, maxNativeZoom: z[1], minZoom: 0, maxZoom: 14,  // below the saved zooms: online tiles
      keepBuffer: 4, updateWhenZooming: false, updateWhenIdle: false, className: "sg-tiles sg-tiles-" + name
    });
  }
  function setAttribution(name) {
    if (!map || !map.attributionControl) return;
    map.attributionControl.addAttribution(TILES.attribution[name]);
  }

  /* ---------- hover / select plumbing ---------- */
  function rectPt(cp) {
    const r = el.getBoundingClientRect();
    return { x: r.left + cp.x, y: r.top + cp.y };
  }
  let clearTimer = 0;
  let moving = false;
  function emitHover(point) {
    if (moving) { if (lastEmit && cb.onHover) cb.onHover(null); lastEmit = null; paintHover(null); return; }
    const cur = pinOver || cellOver;
    clearTimeout(clearTimer);
    if (!cur && lastEmit) {            // wait a beat: moving cell -> pin passes through "nothing"
      clearTimer = setTimeout(() => {
        if (!(pinOver || cellOver) && lastEmit) { lastEmit = null; if (cb.onHover) cb.onHover(null); paintHover(null); }
      }, 40);
      return;
    }
    if (cur !== lastEmit || (cur && point)) {
      lastEmit = cur;
      if (cb.onHover) cb.onHover(cur, cur ? point || lastPoint(cur) : undefined);
    }
    paintHover(cur);
  }
  let curPoint = null;
  function lastPoint(id) {
    if (curPoint) return curPoint;
    const ll0 = sites.find((s) => s.id === id);
    return ll0 ? rectPt(map.latLngToContainerPoint([ll0.lat, ll0.lon])) : { x: 0, y: 0 };
  }
  function paintHover(id) {
    sites.forEach((s) => {
      const c = cells[s.id];
      ((c && c.polys) || []).forEach((poly) => { const e = poly.getElement(); if (e) L.DomUtil[s.id === id ? "addClass" : "removeClass"](e, "is-hover"); });
      const p = pins[s.id];
      if (p) { p.btn.classList.toggle("is-hover", s.id === id); p.label.classList.toggle("is-hover", s.id === id); }
    });
  }
  function choose(id) { if (id && cb.onSelect) cb.onSelect(id); }

  /* ---------- drawing ---------- */
  function drawCells() {
    map.createPane("river").style.zIndex = 405;
    map.createPane("cells").style.zIndex = 410;
    /* one renderer drawn well past the screen edge, no clipping or per-zoom simplifying: outlines no longer pop or jump while zooming */
    const cellsR = L.svg({ pane: "cells", padding: 0.6 });
    map.createPane("hi").style.zIndex = 420;
    map.createPane("grad").style.zIndex = 404;
    map.getPane("grad").style.pointerEvents = "none";
    L.polyline(RIVER.map(ll), { pane: "river", renderer: L.svg({ pane: "river", padding: 0.6 }), noClip: true, smoothFactor: 0, interactive: false, className: "sg-river", weight: 1 }).addTo(map);
    sites.forEach((s) => {
      const c = cells[s.id];
      if (!c.ring.length) return;
      /* one shape per area: the colour comes from the see-through gradient layer under it; this shape is the outline and the tap target */
      c.polys = [c.outline].filter((o) => o.length).map(() => {
        const poly = L.polygon(c.outline, { pane: "cells", renderer: cellsR, noClip: true, smoothFactor: 0, className: "sg-cell sg-area", bubblingMouseEvents: false, weight: 1.5 }).addTo(map);
        poly.on("mouseover mousemove", (e) => { cellOver = s.id; curPoint = rectPt(e.containerPoint); emitHover(curPoint); });
        poly.on("mouseout", () => { cellOver = null; curPoint = null; emitHover(); });
        poly.on("click", () => choose(s.id));
        return poly;
      });
    });
    paintCells();
  }

  /* Pin name + what the satellite saw there: crops a year from NASA MODIS greenness (DATA.sites[].crops). */
  const CROPS_UNIT = { en: "crops/yr", vi: "vụ/năm" };
  function fillLabel(el, s) {
    el.textContent = "";
    /* salt level as a coloured dot (estimate from station reports, never satellite) */
    const lv = s.level === "high" || s.level === "medium" || s.level === "low" ? s.level : "medium";
    const dot = document.createElement("i"); dot.className = "sg-dot sg-lv-" + lv; dot.setAttribute("aria-hidden", "true"); el.appendChild(dot);
    const b = document.createElement("b"); b.textContent = shortName(s); el.appendChild(b);
    if (typeof s.crops === "number") {
      const m = document.createElement("small");
      m.textContent = "MODIS · " + (lang === "vi" ? String(s.crops).replace(".", ",") : s.crops) + " " + (CROPS_UNIT[lang] || CROPS_UNIT.en);
      el.appendChild(m);
    }
  }
  /* Map colour key: a pill button pinned bottom-left; tapping it pops the key up, ✕ closes it. */
  let keyEl = null, keyOpen = false;
  function drawLegend() {
    if (!map) return;
    if (!keyEl) {
      keyEl = document.createElement("div"); keyEl.id = "mapKey"; keyEl.className = "mk"; document.body.appendChild(keyEl);
      keyEl.addEventListener("click", (e) => {
        const b = e.target.closest("[data-mapmode]"); if (b) { setMode(b.dataset.mapmode); return; }
        const w = e.target.closest("[data-water]"); if (w) { water = w.dataset.water; paintCells(); return; }
        if (e.target.closest(".mk-x")) { keyOpen = false; drawLegend(); keyEl.querySelector(".mk-pill").focus(); return; }
        if (e.target.closest(".mk-pill")) { keyOpen = !keyOpen; drawLegend(); if (keyOpen) { const x = keyEl.querySelector(".mk-x"); x && x.focus(); } }
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && keyOpen) { keyOpen = false; drawLegend(); } });
    }
    const vi = lang === "vi";
    const months = vi ? ["tháng 1","tháng 2","tháng 3","tháng 4","tháng 5","tháng 6","tháng 7","tháng 8","tháng 9","tháng 10","tháng 11","tháng 12"] : ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const strip = mode === "n" ? `<i class="mk-strip mk-strip-n" style="--c:${N_COL}"></i>` : `<i class="mk-strip"></i>`;
    const pillTxt = mode === "n" ? tx("n") : (vi ? "Màu bản đồ = độ mặn" : "Map colour = salt");
    const seg = `<div class="mk-seg" role="group" aria-label="${tx("show")}"><span class="mk-l">${tx("show")}</span><div class="mk-two">` +
      `<button type="button" data-mapmode="salt" aria-pressed="${mode === "salt"}"><i class="sg-key-ic sg-ic-salt"></i>${tx("salt")}</button>` +
      (nPts ? `<button type="button" data-mapmode="n" aria-pressed="${mode === "n"}"><i class="sg-key-ic sg-ic-n"></i>${tx("n")}</button>` : "") + `</div></div>`;
    let body;
    if (mode === "n") {
      const f = (x) => (vi ? x.toFixed(1).replace(".", ",") : x.toFixed(1));
      body = `<b class="mk-h">${tx("nH")}</b><div class="sg-key-ramp"><i style="--c:${N_COL}"></i></div>` +
        `<div class="sg-key-ends"><span>${f(nRange[0])} ${tx("gkg")}</span><span>${f(nRange[1])} ${tx("gkg")}</span></div><p class="mk-note">${tx("nNote")}</p>`;
    } else {
      body = `<div class="mk-water" role="group">` + ["river", "field"].map((k) => `<button type="button" data-water="${k}" aria-pressed="${water === k}">${tx(k)}</button>`).join("") + `</div>` +
        `<b class="mk-h">${tx("saltH")}${tx(water).toLowerCase()}, ${months[mon]} (${tx("typ")})</b>` +
        `<div class="sg-key-grad" aria-hidden="true"></div><div class="sg-key-ends"><span>${vi ? "ngọt" : "fresh"}</span><span>${vi ? "mặn" : "salty"}</span></div><ul class="sg-key-list">` +
        BANDS.map((b) => `<li><i style="background:${b.col}"></i><span>${b[lang] || b.en}</span></li>`).join("") + `</ul><p class="mk-note">${tx(water + "Note")}</p>`;
    }
    keyEl.classList.toggle("open", keyOpen);
    keyEl.innerHTML = (keyOpen ? `<div class="mk-pop" role="dialog" aria-label="${vi ? "Chú thích màu bản đồ" : "Map colour key"}">
<div class="mk-top"><b>${vi ? "Màu trên bản đồ" : "Map colours"}</b><button type="button" class="mk-x" aria-label="${vi ? "Đóng" : "Close"}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg><span>${vi ? "Đóng" : "Close"}</span></button></div>
<div class="mk-body">${seg}${body}</div></div>` : "") +
      `<button type="button" class="mk-pill" aria-expanded="${keyOpen}" aria-controls="mapKey">${strip}<span>${esc0(pillTxt)}</span><em>${keyOpen ? (vi ? "Thu gọn" : "Hide") : (vi ? "Xem chú thích" : "Show key")}</em></button>`;
  }
  const esc0 = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function pinHTML(s) {
    return '<button type="button" class="sg-pin-btn" aria-label="' + fullName(s).replace(/"/g, "&quot;") + '">' +
      '<i class="sg-p-pulse"></i><i class="sg-p-pulse sg-p-pulse2"></i><i class="sg-p-ring"></i><i class="sg-p-core"></i>' +
      '<i class="sg-p-tick sg-t-n"></i><i class="sg-p-tick sg-t-e"></i><i class="sg-p-tick sg-t-s"></i><i class="sg-p-tick sg-t-w"></i></button>';
  }
  function drawPins() {
    map.createPane("labels").style.zIndex = 610;
    sites.forEach((s) => {
      const marker = L.marker([s.lat, s.lon], {
        icon: L.divIcon({ className: "sg-pin", html: pinHTML(s), iconSize: [44, 44], iconAnchor: [22, 22] }),
        interactive: false, keyboard: false, zIndexOffset: 100
      }).addTo(map);
      const labelMarker = L.marker([s.lat, s.lon], {
        pane: "labels", interactive: false, keyboard: false,
        icon: L.divIcon({ className: "sg-label-wrap", html: '<span class="sg-label"></span>', iconSize: [0, 0], iconAnchor: [0, 0] })
      }).addTo(map);
      const btn = marker.getElement().querySelector("button");
      const label = labelMarker.getElement().querySelector(".sg-label");
      fillLabel(label, s);
      pins[s.id] = { btn, label, marker, labelMarker };
      /* the name plate is a second way to pick the area (the button stays the keyboard control) */
      L.DomEvent.disableClickPropagation(label);
      label.addEventListener("click", (e) => { e.stopPropagation(); choose(s.id); });
      label.addEventListener("mouseenter", () => { pinOver = s.id; curPoint = pt(); emitHover(curPoint); });
      label.addEventListener("mouseleave", () => { pinOver = null; curPoint = null; emitHover(); });
      const pt = () => {
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      btn.addEventListener("mouseenter", () => { pinOver = s.id; curPoint = pt(); emitHover(curPoint); });
      btn.addEventListener("mouseleave", () => { pinOver = null; curPoint = null; emitHover(); });
      btn.addEventListener("focus", () => { pinOver = s.id; curPoint = pt(); emitHover(curPoint); });
      btn.addEventListener("blur", () => { pinOver = null; curPoint = null; emitHover(); });
      btn.addEventListener("click", (e) => { e.stopPropagation(); choose(s.id); });
      L.DomEvent.disableClickPropagation(btn);
      L.DomEvent.on(btn, "dblclick mousedown touchstart", L.DomEvent.stopPropagation);
    });
  }

  /* Place each name plate where it overlaps no other plate or pin: right of the pin, else left
     (phones: under the pin, else above). The selected area is placed first; a plate with no free
     side is hidden until hovered or selected. */
  function updateLabelVisibility() {
    if (!map) return;
    el.classList.remove("sg-nolabels");
    const phone = isPhone(), GAP = phone ? 22 : 20, PIN = 13;
    const W = el.clientWidth - (!phone && document.body.classList.contains("drawer-open") && !document.body.classList.contains("drawer-full") ? 460 : 0);
    const P = {};
    sites.forEach((s) => { P[s.id] = map.latLngToContainerPoint([s.lat, s.lon]); });
    const taken = sites.map((s) => ({ x0: P[s.id].x - PIN, x1: P[s.id].x + PIN, y0: P[s.id].y - PIN, y1: P[s.id].y + PIN }));
    // no plate under the page's own bars and boxes (top bar, back bar, left panel, month box, the country key) or the selected province's plate (vn.js)
    const mr = el.getBoundingClientRect();
    document.querySelectorAll("#topbar, #dvBack, #side, #d5Month, #vnKey > *, .leaflet-control-attribution, .leaflet-vn-labels-pane .sg-label.is-sel:not(.sg-hide)").forEach((c) => {
      const r = c.getBoundingClientRect(), cs = getComputedStyle(c);
      if (r.width && r.height && cs.visibility !== "hidden" && +cs.opacity > 0.05) taken.push({ x0: r.left - mr.left, x1: r.right - mr.left, y0: r.top - mr.top, y1: r.bottom - mr.top });
    });
    const clear = (b) => !taken.some((q) => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
    const inView = (b) => b.x0 >= 4 && b.x1 <= W - 4;
    const order = sites.slice().sort((a, b) => (b.id === selId) - (a.id === selId) || P[b.id].x - P[a.id].x);
    order.forEach((s) => {
      const lab = pins[s.id] && pins[s.id].label; if (!lab) return;
      const p = P[s.id], w = lab.offsetWidth || 120, h = lab.offsetHeight || 30;
      const opts = phone
        ? [["below", { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y + GAP, y1: p.y + GAP + h }], ["above", { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y - GAP - h, y1: p.y - GAP }]]
        : [["right", { x0: p.x + GAP, x1: p.x + GAP + w, y0: p.y - h / 2, y1: p.y + h / 2 }], ["left", { x0: p.x - GAP - w, x1: p.x - GAP, y0: p.y - h / 2, y1: p.y + h / 2 }]];
      const ok = opts.find((o) => clear(o[1]) && inView(o[1])) || opts.find((o) => clear(o[1]));
      const use = ok || opts[0];
      lab.classList.toggle("sg-left", use[0] === "left");
      lab.classList.toggle("sg-above", use[0] === "above");
      lab.classList.toggle("sg-hide", !ok);
      if (ok) taken.push(ok[1]);
    });
  }

  function updateCoords(latlng) {
    if (latlng) lastLL = latlng;
    if (!coordsEl) return;
    const p = lastLL || map.getCenter();
    const z = Math.round(map.getZoom() * 10) / 10;
    coordsEl.textContent = Math.abs(p.lat).toFixed(4) + "°" + (p.lat >= 0 ? "N" : "S") + " " +
      Math.abs(p.lng).toFixed(4) + "°" + (p.lng >= 0 ? "E" : "W") + " · Z" + z;
  }

  /* ---------- padding so the focused area clears the drawer / sheet ---------- */
  /* Right edge of the left info panel (side.js) on desktop, or 0 when it is not shown. */
  function sideRight() {
    const s = document.getElementById("side");
    if (!s || isPhone() || getComputedStyle(s).display === "none") return 0;
    const r = s.getBoundingClientRect();
    return r.width ? Math.round(r.right) : 0;
  }
  function drawerPad() {
    const w = window.innerWidth, h = window.innerHeight;
    if (isPhone()) return { tl: [16, 72], br: [16, Math.round(h * 0.52)] };
    const sr = w >= 1180 ? sideRight() : 0;   /* below 1180px the panel hides while the drawer is open */
    return { tl: [sr ? sr + 24 : Math.min(120, w * 0.08), 90], br: [460 + 40, 90] };
  }
  function homePad() {
    const w = window.innerWidth, h = window.innerHeight;
    if (isPhone()) {  // fit the pins into the space between the headline and the bottom controls
      const hero = document.querySelector("#hero"), dock = document.querySelector("#areaDock") || document.querySelector("#ticker");
      const heroOn = hero && !document.body.classList.contains("has-site") && getComputedStyle(hero).visibility !== "hidden";
      const top = heroOn ? Math.round(hero.getBoundingClientRect().bottom) + 24 : 96;
      const dr = dock && dock.getBoundingClientRect();  // a hidden dock measures 0x0: ignore it
      const bot = dr && dr.height ? Math.round(h - dr.top) + 24 : 150;
      return { tl: [60, Math.max(0, Math.min(top, h - bot - 160))], br: [96, bot] };  // wider right side: room for the pin names
    }
    const hero = document.querySelector("#hero");
    const heroOn = hero && !document.body.classList.contains("has-site") && getComputedStyle(hero).display !== "none";
    const sr = sideRight();
    const left = sr ? sr + 32 : heroOn && w >= 1100 ? Math.round(hero.getBoundingClientRect().right) + 32 : 100;
    return { tl: [Math.min(left, w * .56), 100], br: [56, 150] };
  }
  function allBounds() {
    let b = null;
    sites.forEach((s) => { const c = cells[s.id]; if (c && c.bounds) b = b ? b.extend(c.bounds) : L.latLngBounds(c.bounds.getSouthWest(), c.bounds.getNorthEast()); });
    return b || L.latLngBounds([BBOX.s, BBOX.w], [BBOX.n, BBOX.e]);
  }

  /* computers: panels over the map drop their blur while the map moves (re-blurring every frame costs more than the map);
     only those few panels get the class, never <body>, so the rest of the page is not restyled */
  let glassEls = null;
  function glassOver(on) {
    if (!glassEls) glassEls = ["side", "drawer"].map((id) => document.getElementById(id)).filter(Boolean);
    glassEls.forEach((g) => g.classList.toggle("map-moving", on));
  }

  /* ---------- public API ---------- */
  function init(container, siteList, callbacks) {
    el = container;
    sites = siteList || [];
    cb = callbacks || {};
    coordsEl = document.getElementById("coords");
    buildCells();
    if (typeof NITROGEN !== "undefined") setNitrogen(NITROGEN.points);

    /* one map for the whole country: zoom out from the Sóc Trăng areas to Vietnam's 34 provinces (vn.js) */
    const maxB = L.latLngBounds([4, 97], [26, 118]);
    map = L.map(el, {
      zoomControl: false, attributionControl: true, minZoom: 4.5, maxZoom: 13.5,
      /* smooth zoom: fine snapping for pinch and wheel, a slower wheel, and no zooming far past the sharpest tiles (z12) */
      zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, wheelDebounceTime: 20,
      bounceAtZoomLimits: false, inertiaDeceleration: 2600, easeLinearity: 0.25,
      maxBounds: maxB, maxBoundsViscosity: 0.9, worldCopyJump: false,
      zoomAnimation: !reduced(), fadeAnimation: !reduced(), markerZoomAnimation: !reduced()
    });
    el.classList.add("sg-map", "layer-sat");
    el.setAttribute("tabindex", "-1");
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    L.control.zoom({ position: "bottomright" }).addTo(map);

    /* a view must exist before layers and markers are added */
    map.fitBounds(allBounds(), { paddingTopLeft: homePad().tl, paddingBottomRight: homePad().br, animate: false });
    tileLayer = makeLayer("sat").addTo(map);
    setAttribution("sat");
    drawCells();
    drawPins();

    map.on("mousemove", (e) => updateCoords(e.latlng));
    map.on("zoomend moveend", () => { moving = false; updateCoords(); updateLabelVisibility(); });
    /* the class goes on the map element, not <body>: a body class restyles the whole page at the start of every zoom */
    map.on("movestart zoomstart", () => { moving = true; emitHover(); el.classList.add("map-moving"); glassOver(true); const hc = document.getElementById("hoverCard"); if (hc) hc.style.visibility = "hidden"; });
    map.on("moveend zoomend", () => { el.classList.remove("map-moving"); glassOver(false); const hc = document.getElementById("hoverCard"); if (hc) hc.style.visibility = ""; });
    map.on("click", (e) => {
      if (inLand(e.latlng.lng, e.latlng.lat)) choose(nearest(e.latlng.lng, e.latlng.lat));
    });
    map.on("mouseout", () => { lastLL = null; });

    updateCoords();
    updateLabelVisibility();
    labels(lang);
    document.dispatchEvent(new CustomEvent("mapview:ready"));  // vn.js adds the whole-country layer to this map
  }

  function select(id) {
    selId = id || null;
    pinOver = null; cellOver = null; curPoint = null;
    if (lastEmit && cb.onHover) cb.onHover(null);
    lastEmit = null;
    sites.forEach((s) => {
      const c = cells[s.id], p = pins[s.id], on = s.id === selId;
      ((c && c.polys) || []).forEach((poly) => { const e = poly.getElement(); if (e) L.DomUtil[on ? "addClass" : "removeClass"](e, "is-sel"); });
      if (p) {
        p.btn.classList.toggle("is-sel", on);
        p.btn.setAttribute("aria-pressed", on ? "true" : "false");
        p.label.classList.toggle("is-sel", on);
        p.labelMarker.setZIndexOffset(on ? 1000 : 0);
      }
    });
    el.classList.toggle("sg-has-sel", !!selId);
    paintHover(pinOver || cellOver);
    updateLabelVisibility();
  }
  /* Light up an area from outside the map (e.g. a row in the side panel), without the hover card. */
  function hover(id) { if (map) paintHover(id || null); }



  function home() {
    if (!map) return;
    const p = homePad();
    const b = isPhone() ? L.latLngBounds(sites.map((s) => [s.lat, s.lon])) : allBounds();  // phones: fit the pins, not the circles, for a closer view
    map.fitBounds(b, { paddingTopLeft: p.tl, paddingBottomRight: p.br, animate: !reduced() });   /* one GPU zoom step, not a frame-by-frame fly: no stutter */
  }

  function focus(id) {
    const c = cells[id];
    if (!map || !c || !c.bounds) return;
    const p = drawerPad();
    map.fitBounds(c.bounds, { paddingTopLeft: p.tl, paddingBottomRight: p.br, maxZoom: 11.25, animate: !reduced() });
  }

  function month(ids) {
    sites.forEach((s) => {
      const off = !!ids && !ids.includes(s.id);
      const p = pins[s.id]; if (p) p.label.classList.toggle("sg-off", off);
    });
  }
  function resize() { if (map) { map.invalidateSize({ pan: false }); updateLabelVisibility(); } }

  function labels(l) {
    if (l) lang = l;
    sites.forEach((s) => {
      const p = pins[s.id];
      if (!p) return;
      p.btn.setAttribute("aria-label", fullName(s));
      fillLabel(p.label, s);
    });
    drawLegend();
    if (map) updateLabelVisibility();
  }

  return { init, select, home, focus, resize, labels, month, hover, setMonth, setMode, setNitrogen, get mode() { return mode; },
    get leaflet() { return map; }, drawerPad };
})();
