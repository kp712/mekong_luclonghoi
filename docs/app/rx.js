/* rx.js: the shared prediction model from the redesign concepts (drafts/redesign/src/core.js), in its own scope */
const RX = (() => {
const DATA = SiteData.rx(SITES_JSON);   /* compact model data, made from docs/data/sites.json by load.js */

/* core.js — shared by all 4 concepts: language, scoring (same rule as docs/app.js scoreOf), month codes. */
const Core = (() => {
  let lang = "vi";
  try { lang = localStorage.getItem("mre-lang") || "vi"; } catch (e) {}
  const subs = [];
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang] || o.en || "");
  const setLang = (l) => { lang = l; try { localStorage.setItem("mre-lang", l); } catch (e) {} document.documentElement.lang = l; subs.forEach((f) => f(l)); };
  const KEYS = ["salt", "water", "soil", "income", "pests"];
  const UI = {
    score: { water: { vi: "Tiết kiệm nước", en: "Saves water" }, salt: { vi: "An toàn mặn", en: "Salt safety" },
             soil: { vi: "Tốt cho đất", en: "Better soil" }, income: { vi: "Thu nhập", en: "Income" }, pests: { vi: "Ít sâu bệnh", en: "Fewer pests" } },
    scoreShort: { water: { vi: "Nước", en: "Water" }, salt: { vi: "Mặn", en: "Salt" }, soil: { vi: "Đất", en: "Soil" }, income: { vi: "Thu nhập", en: "Income" }, pests: { vi: "Sâu bệnh", en: "Pests" } },
    levels: [{ vi: "Không quan trọng", en: "Not important" }, { vi: "Hơi quan trọng", en: "A little" }, { vi: "Quan trọng", en: "Important" }, { vi: "Rất quan trọng", en: "Very important" }],
    salt: { high: { vi: "Mặn cao", en: "High salt" }, medium: { vi: "Mặn vừa", en: "Medium salt" }, low: { vi: "Mặn thấp", en: "Low salt" } },
    conf: { high: { vi: "Tin cậy cao", en: "High confidence" }, medium: { vi: "Tin cậy vừa", en: "Medium confidence" }, low: { vi: "Tin cậy thấp", en: "Low confidence" } },
    est: { vi: "ước tính từ báo cáo công khai, không đo bằng vệ tinh", en: "estimate from public reports, not satellite" },
    disclaimer: { vi: "Công cụ này chỉ để tham khảo, không thay thế kinh nghiệm của bà con hay lời khuyên của cán bộ khuyến nông địa phương.",
                  en: "This tool helps you think. It does not replace your own judgement or advice from your local extension officer." },
    src: { rain: "NASA GPM IMERG", et0: "NASA POWER", ndvi: "NASA MODIS", soil: "SoilGrids" },
    crops: { vi: "vụ/năm (vệ tinh MODIS thấy)", en: "crops/yr (seen by MODIS)" },
    mm: "mm"
  };
  const MONTHS = { vi: ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"],
                   en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] };
  const MONTHS_LONG = { vi: ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"],
                        en: ["January","February","March","April","May","June","July","August","September","October","November","December"] };
  /* month codes in sites.json: R1/R2/R3 rice crops, U upland crop, S shrimp, - rest */
  const CODE = {
    R: { vi: "Lúa", en: "Rice", k: "rice" }, U: { vi: "Cây màu", en: "Upland crop", k: "upland" },
    S: { vi: "Tôm", en: "Shrimp", k: "shrimp" }, "-": { vi: "Nghỉ", en: "Rest", k: "rest" }
  };
  const codeOf = (m) => CODE[m[0]] || CODE["-"];
  const resFor = (card, m) => {
    const c = m[0];
    if (c === "S") return DATA.res.shrimp;
    if (c === "U") return DATA.res.watermelon;
    if (c === "R") return card.id === "salt_tolerant" ? DATA.res.rice_st : DATA.res.rice;
    return null;
  };
  /* crop blocks: consecutive equal codes -> [{code, from, to}] (0-based months, wraps Dec->Jan) */
  function blocks(months) {
    const out = [];
    months.forEach((m, i) => {
      const last = out[out.length - 1];
      if (last && last.code === m) last.to = i; else out.push({ code: m, from: i, to: i });
    });
    if (out.length > 1 && out[0].code === out[out.length - 1].code && out[0].code !== "-") {
      const l = out.pop(); out[0].from = l.from; out[0].wrap = true;
    }
    return out;
  }
  function scoreOf(card, w) {
    const ks = KEYS.filter((k) => card.scores[k] != null);
    const tot = ks.reduce((a, k) => a + w[k], 0);
    return tot ? ks.reduce((a, k) => a + w[k] * card.scores[k], 0) / tot : ks.reduce((a, k) => a + card.scores[k], 0) / ks.length;
  }
  const rank = (site, w) => site.cards.map((c) => ({ c, s: scoreOf(c, w) })).sort((a, b) => b.s - a.s);
  const fmt = (n, d = 1) => n == null ? "–" : (lang === "vi" ? n.toFixed(d).replace(".", ",") : n.toFixed(d));
  const short = (s) => L(s.name).split(" (")[0].replace(/^(Former |Khu vực )/, "").replace(/( area| cũ)$/, "");
  const saltRange = (s) => { const m = MONTHS[lang]; return m[s.salt[0] - 1] + "–" + m[s.salt[s.salt.length - 1] - 1]; };
  /* typical vs El Niño year: El Niño swaps in that year's rain, water need, salt and scores (all from sites.json) */
  let year = "typical";
  const nino = DATA.sites.map((s) => !s.nino ? s : Object.assign({}, s, { rain: s.nino.rain, et0: s.nino.et0,
    salt: s.nino.salt || s.salt, level: s.nino.level || s.level,
    cards: s.cards.map((c) => Object.assign({}, c, { scores: s.nino.scores[c.id] || c.scores })) }));
  const sites = () => (year === "elnino" ? nino : DATA.sites);
  const site = (id) => sites().find((x) => x.id === id) || sites()[0];
  const setYear = (y) => { year = y; subs.forEach((f) => f(lang)); };
  const YEAR = { typical: { vi: "Năm bình thường", en: "Typical year" }, elnino: { vi: "Năm El Niño", en: "El Niño year" } };
  /* stylised area map (coast outline from Draft 3/4, not a survey line) with the 5 pins */
  const LAND = [[105.40,9.91],[105.84,9.91],[105.93,9.81],[106.05,9.72],[106.17,9.64],[106.27,9.56],[106.33,9.50],[106.30,9.45],[106.22,9.41],[106.12,9.36],[106.03,9.31],[105.93,9.27],[105.82,9.23],[105.70,9.20],[105.58,9.18],[105.40,9.17]];
  const RIVER = [[105.86,9.95],[105.955,9.84],[106.06,9.755],[106.175,9.672],[106.28,9.595],[106.40,9.53]];
  function mapSVG(selId, opt = {}) {
    const W = 340, H = 250, x = (lon) => (lon - 105.38) / (106.42 - 105.38) * W, y = (lat) => (9.97 - lat) / (9.97 - 9.12) * H;
    const P = (a) => a.map((p) => x(p[0]).toFixed(1) + "," + y(p[1]).toFixed(1)).join(" ");
    const col = { high: "var(--salt)", medium: "var(--rice)", low: "var(--upland)" };
    const pins = sites().map((s) => {
      const on = s.id === selId, cx = x(s.lon), cy = y(s.lat), lx = cx + (s.lon > 106.1 ? -10 : 10);
      return `<g class="mp" data-site="${s.id}" role="button" tabindex="0" aria-label="${esc(L(s.name))}" aria-pressed="${on}" style="cursor:pointer">
        <circle cx="${cx}" cy="${cy}" r="22" fill="transparent"/>
        <circle cx="${cx}" cy="${cy}" r="${on ? 16 : 11}" fill="${col[s.level]}" opacity="${on ? .28 : .18}"/>
        <circle cx="${cx}" cy="${cy}" r="${on ? 7 : 5.5}" fill="${col[s.level]}" stroke="var(--card)" stroke-width="2"/>
        <text x="${lx}" y="${cy + 4}" text-anchor="${s.lon > 106.1 ? "end" : "start"}" font-size="12.5" font-weight="${on ? 700 : 500}" fill="var(--ink)" font-family="inherit">${esc(short(s))}</text></g>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="amap" role="group" aria-label="${lang === "vi" ? "Bản đồ khu vực" : "Area map"}">
      <rect width="${W}" height="${H}" fill="var(--sea, var(--bg))"/>
      <polygon points="${P(LAND)}" fill="var(--land, var(--card))" stroke="var(--line)" stroke-width="1"/>
      <polyline points="${P(RIVER)}" fill="none" stroke="var(--rain)" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      ${opt.noPins ? "" : pins}</svg>`;
  }
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return {
    get lang() { return lang; }, setLang, onLang: (f) => subs.push(f), L, KEYS, UI, CODE, codeOf, resFor, blocks,
    sites, site, setYear, get year() { return year; }, YEAR, mapSVG,
    months: () => MONTHS[lang], monthsLong: () => MONTHS_LONG[lang], scoreOf, rank, fmt, short, saltRange, esc
  };
})();
document.documentElement.lang = Core.lang;
/* keyboard for the SVG map pins (role=button) */
document.addEventListener("keydown", (e) => {
  const g = e.target.closest && e.target.closest(".mp");
  if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
});

/* =====================================================================
   Prediction model (see the report "Mekong Farmer Decisions and Prediction Model").
   1 salt in the field per month: station dry-season peak P in the middle salt months, P/2 in the first
     and last (team estimate); fresh canal water or a sluice-protected area (level low) = fresh.
   2 g/L -> dS/m with FAO factors (0.64 up to 5 dS/m, 0.80 above).
   3 FAO Maas-Hoffman loss: min(100, max(0, b (EC - a))).
   4 crop loss = worst month.  5 blend years with NOAA El Niño chance.  6 checks.  7 confidence.
   ===================================================================== */
const Model = (() => {
  const C = Core, L = C.L;
  const OUT = SITES_JSON.outlook || {};
  const P_NINO = OUT.pct ? OUT.pct / 100 : OUT.elnino ? 0.5 : 0;   /* NOAA's latest El Niño chance (sites.json). shortcut: 0.5 when NOAA gives an El Niño status without a %, until the outlook parser reads more wordings */
  const TOL = { rice: { a: 3.0, b: 12 }, maize: { a: 1.7, b: 12 } };  /* FAO Annex 1 (Maas & Grattan 1999) */
  const ans = { cur: "rice3", brackish: "yes", fresh: "sometimes", money: "yes", labour: "enough" };
  try { Object.assign(ans, JSON.parse(localStorage.getItem("mre-ans") || "{}")); } catch (e) {}
  const subs = [];
  const set = (k, v) => { ans[k] = v; try { localStorage.setItem("mre-ans", JSON.stringify(ans)); } catch (e) {} subs.forEach((f) => f()); };
  const ec = (g) => (g <= 3.2 ? g / 0.64 : g / 0.8);
  function profile(salt, peak, fresh) {
    const out = Array(12).fill(0);
    if (fresh || !peak) return out;
    /* order the months from the season's real start, so a season crossing the new year (e.g. 12,1,2,3) gets its halves on its true first and last months */
    const srt = salt.slice().sort((a, b) => a - b), gap = srt.findIndex((m, i) => i > 0 && m - srt[i - 1] > 1);
    const ms = gap > 0 ? srt.slice(gap).concat(srt.slice(0, gap)) : srt;
    ms.forEach((m, i) => { out[m - 1] = ms.length >= 3 && (i === 0 || i === ms.length - 1) ? peak / 2 : peak; });
    return out;
  }
  const lossAt = (tol, g) => Math.min(100, Math.max(0, tol.b * (ec(g) - tol.a)));
  const gAt = (dsm) => (dsm <= 5 ? dsm * 0.64 : dsm * 0.8);   /* dS/m -> g/L, inverse of ec() */
  /* Calibration with NASA MODIS: the crops the satellite sees harvested each year cannot be losing yield to salt
     in a typical year. k = field salt / river station salt. For each rotation that fits the seen crop count,
     A crop counts when MODIS sees at least a quarter of it (2.4 -> 3; team cut-off).
     k_r = the largest k that keeps its typical-year crops at or below the FAO threshold; k = the largest k_r
     (the smallest correction the observation forces), capped at 1. */
  const calib = {};
  function kFor(t) {
    if (t.id in calib) return calib[t.id];
    const n = Math.max(0, Math.ceil((t.crops || 0) - 0.25)), prof = profile(t.salt, t.peak, false);
    let best = 0, from = null;
    if (!n || !t.peak) { calib[t.id] = { k: 1, from: null }; return calib[t.id]; }
    t.cards.forEach((card) => {
      const bl = C.blocks(card.months).filter((b) => b.code[0] === "R" || b.code[0] === "U");
      if (bl.length < n) return;
      let kr = 1;
      bl.forEach((b) => {
        const tol = b.code[0] === "U" ? TOL.maize : TOL.rice;
        for (let i = b.from; ; i = (i + 1) % 12) { if (prof[i] > 0) kr = Math.min(kr, gAt(tol.a) / prof[i]); if (i === b.to) break; }
      });
      if (kr > best) { best = kr; from = card; }
    });
    calib[t.id] = { k: Math.min(1, best || 1), from };
    return calib[t.id];
  }
  function predict(card, siteId) {
    const t = DATA.sites.find((s) => s.id === siteId), n = t.nino || t;
    const fresh = ans.fresh === "yes" || t.level === "low";
    const cal = ans.fresh === "no" ? { k: 1, from: null } : kFor(t), k = cal.k;   /* no fresh water: the field may take river water as it is */
    const pt = profile(t.salt, t.peak, fresh).map((g) => g * k), pn = profile(n.salt || t.salt, n.peak || t.peak, fresh).map((g) => g * k);
    const crops = C.blocks(card.months).filter((b) => b.code[0] === "R" || b.code[0] === "U").map((b) => {
      const tol = b.code[0] === "U" ? TOL.maize : TOL.rice, idx = [];
      for (let i = b.from; ; i = (i + 1) % 12) { idx.push(i); if (i === b.to) break; }
      const typ = Math.max(...idx.map((i) => lossAt(tol, pt[i]))), nino = Math.max(...idx.map((i) => lossAt(tol, pn[i])));
      return { b, idx, typ, nino, blend: P_NINO * nino + (1 - P_NINO) * typ, res: C.resFor(card, b.code) };
    });
    const avg = (k) => (crops.length ? crops.reduce((a, c) => a + c[k], 0) / crops.length : 0);
    const needS = card.months.some((m) => m[0] === "S"), needU = card.months.some((m) => m[0] === "U");
    const checks = [];
    if (needS) checks.push(ans.brackish === "no" ? { ok: false, t: { vi: "Cần nước lợ để nuôi tôm, ruộng bạn không có.", en: "Needs brackish water for shrimp; your field has none." } } : { ok: true, t: { vi: "Có nước lợ cho vụ tôm.", en: "Brackish water is there for shrimp." } });
    if (card.id !== ans.cur && (needS || needU)) checks.push(ans.money === "no" ? { ok: false, t: { vi: "Cần vốn để chuyển đổi (ao, giống, thức ăn).", en: "Needs money to switch (pond, seed, feed)." } } : { ok: true, t: { vi: "Có vốn để chuyển đổi.", en: "Money to switch is there." } });
    if (needU) checks.push(ans.labour === "short" ? { ok: false, t: { vi: "Cây màu cần nhiều công lao động.", en: "Upland crops need more labour." } } : { ok: true, t: { vi: "Đủ lao động cho cây màu.", en: "Enough labour for the upland crop." } });
    /* confidence: card level, minus one for the team-estimated salt shape, a stand-in tolerance, or old station data */
    const lv = ["low", "medium", "high"];
    let c = lv.indexOf(card.conf || "low"), why = [{ vi: "hình dạng mặn theo tháng là ước tính của nhóm", en: "the monthly salt shape is a team estimate" }];
    if (needU || card.id === "salt_tolerant") why.push({ vi: "dùng ngưỡng chịu mặn thay thế", en: "a stand-in salt tolerance is used" });
    if (!fresh && k < 1) why.push({ vi: "hiệu chỉnh theo số vụ vệ tinh thấy giả định vụ đó không bị thiệt hại năm bình thường", en: "the satellite calibration assumes the crops it sees lose nothing in a typical year" });
    if ((t.lastYear || 2024) < 2024) why.push({ vi: "trạm đo có ít số liệu gần đây (" + t.lastYear + ")", en: "few recent station readings (" + t.lastYear + ")" });
    c = Math.max(0, c - why.length);
    return { crops, typ: avg("typ"), nino: avg("nino"), blend: avg("blend"), checks, possible: checks.every((x) => x.ok), conf: lv[c], why, fresh, peak: t.peak, peakN: n.peak, k, kFrom: cal.from, crops0: t.crops };
  }
  const pct = (v) => Math.round(v) + "%";
  const T = {
    h: { vi: "Dự báo thiệt hại do mặn", en: "Predicted salt loss" },
    nino: { vi: "Năm El Niño", en: "El Niño year" }, typ: { vi: "Năm bình thường", en: "Typical year" },
    none: { vi: "Kế hoạch này không trồng lúa hay cây màu trong tháng mặn.", en: "This plan grows no rice or upland crop in salt months." },
    fresh: { vi: "Ruộng có nước ngọt từ cống hoặc kênh nên được tính là không mặn.", en: "Fresh water from a sluice or canal reaches the field, so it counts as fresh." },
    cal: { vi: "Đã hiệu chỉnh theo vệ tinh: NASA MODIS thấy {n} vụ/năm ở đây, nên nước trong ruộng được tính mặn bằng khoảng {k} so với trạm đo trên sông.", en: "Calibrated with satellite data: NASA MODIS sees {n} crops a year here, so field water is taken as about {k} as salty as the river station." },
    raw: { vi: "Ruộng không có nước ngọt mùa khô: tính theo độ mặn của sông, chưa hiệu chỉnh.", en: "No fresh water in the dry season: uses the river's salt as it is, without calibration." },
    lead: { vi: "Nếu tưới bằng nước kênh trong tháng mặn, phần mùa vụ có thể mất:", en: "If the field takes canal water in salt months, the share of the crop that could be lost:" },
    conf: { vi: "Độ tin cậy", en: "Confidence" }, lv: { high: { vi: "Cao", en: "High" }, medium: { vi: "Vừa", en: "Medium" }, low: { vi: "Thấp", en: "Low" } },
    because: { vi: "vì", en: "because" }, no: { vi: "Không làm được", en: "Not possible" },
    how: { vi: "Cách tính: ngưỡng chịu mặn của FAO (lúa mất 12% cho mỗi dS/m trên 3,0), tháng tệ nhất của mỗi vụ, đỉnh mặn tại trạm gần nhất (ước tính từ báo cáo công khai, không đo bằng vệ tinh). El Niño: cân theo khả năng trong dự báo mới nhất của NOAA.",
           en: "How: FAO salt tolerance (rice loses 12% per dS/m above 3.0), each crop's worst month, the nearest station's salt peak (estimate from public reports, not satellite). El Niño: weighted by the chance in NOAA's latest forecast." },
    copy: { vi: "Sao chép để gửi cán bộ khuyến nông (Zalo)", en: "Copy to send your extension officer (Zalo)" }, copied: { vi: "Đã sao chép", en: "Copied" },
    ask: { vi: "Về ruộng của bạn", en: "About your field" },
    q: { brackish: { vi: "Nước lợ vào được ruộng?", en: "Brackish water reaches the field?" }, fresh: { vi: "Mùa khô có nước ngọt từ kênh?", en: "Fresh canal water in the dry season?" },
         money: { vi: "Có vốn để chuyển đổi?", en: "Money to switch?" }, labour: { vi: "Lao động gia đình?", en: "Family labour?" } },
    a: { yes: { vi: "Có", en: "Yes" }, no: { vi: "Không", en: "No" }, sometimes: { vi: "Lúc có lúc không", en: "Sometimes" }, enough: { vi: "Đủ", en: "Enough" }, short: { vi: "Thiếu", en: "Short" } }
  };
  const OPTS = { brackish: ["yes", "no"], fresh: ["yes", "sometimes", "no"], money: ["yes", "no"], labour: ["enough", "short"] };
  function askHTML() {
    return `<div class="pz-ask"><p class="pz-h">${L(T.ask)}</p>${Object.keys(OPTS).map((k) => `<div class="pz-q"><span>${L(T.q[k])}</span><div class="pz-seg" role="group" aria-label="${C.esc(L(T.q[k]))}">${OPTS[k].map((v) => `<button type="button" data-ans="${k}" data-v="${v}" aria-pressed="${ans[k] === v}">${L(T.a[v])}</button>`).join("")}</div></div>`).join("")}</div>`;
  }
  function html(card, siteId) {
    const r = predict(card, siteId), m = C.months();
    const order = C.year === "typical" ? ["typ", "nino"] : ["nino", "typ"];  /* worst case first unless the farmer picked a typical year */
    const bar = (v, k) => `<div class="pz-bar ${k}"><span>${L(T[k])}</span><i><b style="width:${Math.max(1, v)}%"></b></i><em>${pct(v)}</em></div>`;
    const rows = r.crops.map((c) => `<div class="pz-crop"><p><b>${C.esc(c.res ? L(c.res.name) : L(C.codeOf(c.b.code)))}</b> · ${m[c.b.from]}${c.b.from !== c.b.to ? "–" + m[c.b.to] : ""}</p>${order.map((k) => bar(c[k], k)).join("")}</div>`).join("");
    const confCls = { high: "hi", medium: "md", low: "lo" }[r.conf];
    return `<div class="pz">
      <p class="pz-h">${L(T.h)}</p>
      ${r.possible ? "" : `<p class="pz-no">${L(T.no)}</p>`}
      ${r.checks.length ? `<ul class="pz-checks">${r.checks.map((x) => `<li class="${x.ok ? "ok" : "no"}">${L(x.t)}</li>`).join("")}</ul>` : ""}
      ${r.fresh ? `<p class="pz-note">${L(T.fresh)}</p>` : r.crops.some((c) => c.nino > 0 || c.typ > 0) ? `<p class="pz-note">${L(T.lead)}</p>${rows}` : `<p class="pz-note">${L(T.none)}</p>`}
      ${!r.fresh && r.k < 1 ? `<p class="pz-cal">${L(T.cal).replace("{n}", C.fmt(r.crops0)).replace("{k}", Math.round(r.k * 100) + "%")}</p>` : ""}
      ${!r.fresh && Model.ans.fresh === "no" ? `<p class="pz-cal">${L(T.raw)}</p>` : ""}
      <p class="pz-conf ${confCls}"><b>${L(T.conf)}: ${L(T.lv[r.conf])}</b> — ${L(T.because)} ${r.why.map(L).join("; ")}.</p>
      <p class="pz-how">${L(T.how)}</p>
      <button type="button" class="pz-copy" data-copy="${card.id}" data-site="${siteId}">${L(T.copy)}</button>
    </div>`;
  }
  function summary(card, siteId) {
    const r = predict(card, siteId), s = DATA.sites.find((x) => x.id === siteId), m = C.months();
    const lines = [C.short(s) + " — " + L(card.name), L(card.cal)];
    r.crops.forEach((c) => lines.push(`${c.res ? L(c.res.name) : ""} ${m[c.b.from]}–${m[c.b.to]}: ${L(T.nino)} ${pct(c.nino)}, ${L(T.typ)} ${pct(c.typ)}`));
    r.checks.forEach((x) => lines.push((x.ok ? "✓ " : "✗ ") + L(x.t)));
    lines.push(L(T.conf) + ": " + L(T.lv[r.conf]), L(T.how));
    return lines.join("\n");
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-ans]"); if (a) { set(a.dataset.ans, a.dataset.v); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) {
      const card = C.site(cp.dataset.site).cards.find((c) => c.id === cp.dataset.copy), txt = summary(card, cp.dataset.site);
      const done = () => { cp.textContent = L(T.copied); setTimeout(() => (cp.textContent = L(T.copy)), 1600); };
      try { navigator.clipboard.writeText(txt).then(done, () => { prompt0(txt); }); } catch (err) { prompt0(txt); }
    }
  });
  function prompt0(txt) { const ta = document.createElement("textarea"); ta.value = txt; ta.className = "pz-fallback"; document.body.appendChild(ta); ta.select(); setTimeout(() => ta.remove(), 8000); }
  /* shared look; each design defines the colour tokens it uses */
  const st = document.createElement("style");
  st.textContent = `
.pz{display:grid;gap:10px}.pz-h{font-weight:700;font-size:1rem;margin:0}
.pz-note{margin:0;color:var(--ink2);font-size:.9375rem}
.pz-no{margin:0;font-weight:700;color:var(--salt)}
.pz-crop{display:grid;gap:6px;padding:10px 12px;border-radius:12px;background:var(--bg)}
.pz-crop p{margin:0;font-size:.9375rem}
.pz-bar{display:grid;grid-template-columns:118px 1fr 44px;align-items:center;gap:10px;font-size:.875rem;color:var(--ink2)}
.pz-bar i{display:block;height:10px;border-radius:5px;background:var(--line);overflow:hidden}
.pz-bar b{display:block;height:100%;border-radius:5px;background:var(--salt)}
.pz-bar.typ b{opacity:.5}.pz-bar em{font-style:normal;font-weight:700;color:var(--ink);text-align:right;font-variant-numeric:tabular-nums}
.pz-checks{margin:0;padding:0;list-style:none;display:grid;gap:6px;font-size:.9375rem}
.pz-checks li{padding-left:24px;position:relative}.pz-checks li::before{position:absolute;left:0;font-weight:700}
.pz-checks .ok::before{content:"✓";color:var(--ok,var(--upland,#3c8a3c))}.pz-checks .no::before{content:"✗";color:var(--salt)}
.pz-conf{margin:0;font-size:.9375rem;padding:10px 12px;border-radius:12px;border:1px solid var(--line)}
.pz-conf.lo b{color:var(--salt)}.pz-conf.md b{color:var(--warn,var(--gold,var(--ink)))}.pz-conf.hi b{color:var(--ok,var(--upland,var(--ink)))}
.pz-cal{margin:0;font-size:.875rem;color:var(--ink2);padding:8px 12px;border-left:3px solid var(--accent,var(--gold,var(--ink2)));background:var(--bg);border-radius:0 10px 10px 0}
.pz-how{margin:0;font-size:.8125rem;color:var(--ink3,var(--ink2))}
.pz-copy{min-height:48px;border-radius:12px;border:1.5px solid var(--ink);background:none;color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
.pz-fallback{position:fixed;left:16px;right:16px;bottom:16px;height:140px;z-index:99;font:inherit}
.pz-ask{display:grid;gap:10px}.pz-q{display:grid;gap:6px;font-size:.9375rem;font-weight:600}
.pz-seg{display:flex;gap:4px;padding:4px;border-radius:12px;background:var(--bg)}
.pz-seg button{flex:1;min-height:44px;border:0;border-radius:9px;background:none;font:inherit;font-weight:600;font-size:.9375rem;color:var(--ink2);cursor:pointer}
.pz-seg button[aria-pressed="true"]{background:var(--card);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.14)}`;
  document.head.appendChild(st);
  /* Map: estimated salt in the field water (‰) for one area and month (0-11). River station peak shaped by the
     usual salt months, times the MODIS-calibrated field/river ratio k. Ngã Năm's stated "low" override = fresh. */
  function saltAt(siteId, m, nino, field) {   /* field false = the river station's own shape (no sluice, no k) */
    const t = DATA.sites.find((s) => s.id === siteId); if (!t) return null;
    const n = nino ? (t.nino || t) : t;
    if (!field) return profile(n.salt || t.salt, n.peak || t.peak, false)[m];
    return profile(n.salt || t.salt, n.peak || t.peak, t.level === "low")[m] * kFor(t).k;
  }
  return { saltAt, kFor, predict, profile, html, askHTML, summary, onChange: (f) => subs.push(f), get ans() { return ans; }, set, P_NINO };
})();

return { Core, Model, DATA };
})();
