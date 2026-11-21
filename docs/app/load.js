/* load.js: the site's data comes only from docs/data/sites.json (built by pipeline/build.py).
   It is fetched once without blocking the page; the app scripts (index.html, type="text/x-after-data") start, in order,
   only after it has arrived, so every script still finds DATA ready. It is reshaped into the two forms the app code uses:
   DATA (map, cards, plan) and RX.DATA (salt model, dashboard). No numbers are added here.
   costs.json (published costs) and research.json (rice varieties, live-data feeds) sit next to this file. */
const SiteData = (() => {
  const get = (url) => fetch(url, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("Could not load " + url + " (" + r.status + ")"); return r.json() });
  const pick = (o, ks) => { const r = {}; ks.forEach((k) => { if (o[k] !== undefined) r[k] = o[k] }); return r };
  const map = (o, f) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, f(v, k)]));
  const tx = (x) => (x && typeof x === "object" ? { en: x.en || "", vi: x.vi || "" } : x);

  /* DATA: same shape the explorer (app.js) and the dashboard read */
  const CARD_KEYS = ["id", "kind", "name", "calendar", "months", "scores", "confidence", "not_here", "plan", "upland", "needs_brackish", "crop", "src", "benefits", "risks", "gaps", "why", "profit_range"];
  const card = (c) => (c.variants ? { id: c.id, kind: c.kind, variants: map(c.variants, card), crop_default: c.crop_default } : pick(c, CARD_KEYS));
  const line = (x) => ({ en: x.plain ? x.plain.en : x.en, vi: x.plain ? x.plain.vi : x.vi, full: { en: x.en, vi: x.vi }, salt: !!x.salt, src: x.src });
  const view = (v, base) => ({ rain: v.climate.rain_mm, climate: pick(v.climate, ["rain_min_mm", "rain_max_mm"]), et0: v.climate.et0_mm, ndvi: v.ndvi && v.ndvi.monthly,
    crops: (v.ndvi && v.ndvi.crops_per_year) ?? (base && base.ndvi && base.ndvi.crops_per_year),   /* El Niño view: the satellite crop count of the area */ salt: v.salinity.months, saltNote: v.salinity.note, summary: (v.summary || []).map(line), cards: (v.cards || []).map(card) });
  function app(J) {
    return {
      sites: J.sites.map((s) => Object.assign({ id: s.id, lat: s.lat, lon: s.lon, name: s.name }, view(s), s.elnino ? { el: view(s.elnino, s) } : {})),
      resources: map(J.resources, (r) => pick(r, ["name", "seed", "fertiliser", "steps"])),
      sources: J.sources, outlook: J.outlook, chart_src: J.chart_src, salt_src: J.salt_src, elnino_src: J.elnino_src
    };
  }

  /* RX.DATA: the compact form of the prediction model (same rules as drafts/redesign/make_data.py) */
  const one = (c) => (c.variants ? c.variants.watermelon || Object.values(c.variants)[0] : c);
  function rx(J) {
    const nino = (s) => {
      const e = s.elnino; if (!e) return null;
      const sc = {}; (e.cards || []).map(one).forEach((c) => { if (c.scores) sc[c.id] = c.scores });
      const sal = e.salinity || {};
      return { peak: sal.station_ppt, rain: e.climate.rain_mm, et0: e.climate.et0_mm, salt: sal.months, level: sal.level, scores: sc };
    };
    return {
      outlook: tx(J.outlook.text),
      sites: J.sites.map((s) => {
        const sal = s.salinity;
        return { id: s.id, lat: s.lat, lon: s.lon, name: tx(s.name), salt: sal.months, level: sal.level, saltNote: tx(sal.note || {}),
          rain: s.climate.rain_mm, et0: s.climate.et0_mm, crops: s.ndvi.crops_per_year, clay: s.soil.clay_pct,
          cards: s.cards.map(one).filter((c) => c.scores).map((c) => ({ id: c.id, kind: c.kind, name: tx(c.name), cal: tx(c.calendar || {}), months: c.months, scores: c.scores,
            conf: c.confidence, pros: (c.benefits || []).slice(0, 2).map(tx), cons: (c.risks || []).slice(0, 2).map(tx), water: c.water_mm })),
          nino: nino(s), peak: sal.station_ppt, lastYear: sal.last_year };
      }),
      res: map(J.resources, (r) => ({ name: tx(r.name), seed: tx(r.seed || {}), fert: "fertiliser" in r ? tx(r.fertiliser) : { en: "", vi: "" }, days: r.duration_days ?? null, steps: (r.steps || []).slice(0, 3).map(tx) }))
    };
  }
  return { get, app, rx };
})();
let SITES_JSON, DATA, COSTS, RESEARCH;
/* Farm: the one saved list of fields, shared by the planner (app.js) and the dashboard (dash.js), in "mre-farm".
   Both change the same field objects: {id, name, site, size (ha), seasons, cur, rot, ...the dashboard's plan}.
   Saves from before the merge (the planner's own "mre-fields", with ha) are moved in once, matched as before. */
const Farm = (() => {
  const get = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null") } catch (e) { return null } };
  const st = get("mre-farm") || { fields: [], sel: null, ui: "simple" };
  if (!Array.isArray(st.fields)) st.fields = [];
  const save = () => { try { localStorage.setItem("mre-farm", JSON.stringify(st)) } catch (e) {} };
  const old = get("mre-fields");
  if (Array.isArray(old)) {
    let last = null; try { last = localStorage.getItem("mre-last") } catch (e) {}
    old.forEach((a) => {
      if (!a || !a.id || !a.site) return;
      const d = st.fields.find((f) => f.appId === a.id || (!f.appId && f.site === a.site && f.name === a.name));
      if (d) { delete d.appId; if (!(d.size > 0) && a.ha > 0) d.size = a.ha; if (!d.seasons && a.seasons) d.seasons = a.seasons; if (a.cur) d.cur = a.cur; if (last === a.id) last = d.id }
      else st.fields.push({ id: a.id, name: a.name, site: a.site, size: a.ha > 0 ? a.ha : null, seasons: a.seasons, cur: a.cur });
    });
    st.fields.forEach((f) => delete f.appId);
    save();
    try { localStorage.removeItem("mre-fields"); if (last) localStorage.setItem("mre-last", last) } catch (e) {}
  }
  return { st, save };
})();
/* AppReady: the app scripts start "when the page is ready". They now arrive after the data, when the page is already
   parsed, so their start functions are queued here and run, in the order they asked, once the last script has loaded:
   the same order DOMContentLoaded gave them before. */
const AppReady = (() => {
  let q = [], open = false;
  const on = (fn) => { if (open) { fn(); return } if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => q ? q.push(fn) : fn()); else q.push(fn) };
  const flush = () => { open = true; const fs = q; q = null; fs.forEach((fn) => { try { fn() } catch (e) { console.error(e) } }) };
  return { on, flush, waiting: () => !open };
})();
(function boot() {
  /* a calm loading line while the data travels (slow phone connections), replaced by the app */
  const wait = document.createElement("p");
  wait.className = "boot-wait"; wait.setAttribute("role", "status");
  wait.innerHTML = '<span lang="vi">Đang tải dữ liệu…</span> <span lang="en">Loading data…</span>';
  document.body.appendChild(wait);
  const fail = (e) => {
    wait.remove();
    /* no data, no app: cover the page with a two-language message instead of a half-drawn, broken screen */
    const box = document.createElement("div");
    box.setAttribute("role", "alert");
    box.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:24px;background:#f6f4ec;color:#1f2a1f;font:18px/1.5 system-ui,sans-serif";
    box.innerHTML = '<p lang="vi" style="margin:0">Không tải được dữ liệu. Hãy kiểm tra kết nối mạng và tải lại trang.</p>'
      + '<p lang="en" style="margin:0">Couldn\'t load the data. Check your connection and reload the page.</p>'
      + '<button type="button" style="align-self:flex-start;min-height:44px;padding:8px 18px;font:inherit" onclick="location.reload()">Tải lại / Reload</button>';
    document.body.appendChild(box);
    console.error(e);
  };
  /* the app scripts, in page order; async = false keeps their order while they download in parallel */
  const start = () => {
    const tags = [...document.querySelectorAll('script[type="text/x-after-data"]')];
    let left = tags.length;
    const done = () => { if (--left <= 0) { wait.remove(); AppReady.flush() } };
    tags.forEach((t) => { const s = document.createElement("script"); s.src = t.dataset.src; s.async = false; s.onload = done; s.onerror = done; t.replaceWith(s) });
    if (!left) { wait.remove(); AppReady.flush() }
  };
  Promise.all([SiteData.get("data/sites.json"), SiteData.get("app/costs.json"), SiteData.get("app/research.json")])
    .then(([j, c, r]) => { SITES_JSON = j; DATA = SiteData.app(j); COSTS = c; RESEARCH = r; start() })
    .catch(fail);
})();
/* offline copy and home-screen install (sw.js); not available when the page is opened from disk (file://) */
if ("serviceWorker" in navigator && location.protocol !== "file:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
