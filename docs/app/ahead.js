/* ahead.js: "the season ahead" lines shared by the planner (app.js, #outlook) and the dashboard (dash.js, tile "ahead").
   Ahead.salt(siteId, today) -> {en, vi, risk} for the KTTV 10-day salt forecast at a site, or null when there is none or its
   period ended more than 14 days before `today` (the forecast is then old news and is hidden, not shown as current).
   Reads SITES_JSON (load.js): salt_forecast (issue date, period, risk) and the site's salt_forecast (station, ppt), both from build.py.
   test_build.py (test_forecast_stale) runs this file in Node. Ahead.planting(today): the official planting windows, hidden after finish_by. The outlook goes in this file too. */
const Ahead = (() => {
  const STALE_DAYS = 14;
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ymd = (iso) => iso.split("-").map(Number);
  const num = (x, vi) => { const s = (+x).toFixed(1); return vi ? s.replace(".", ",") : s };
  /* "1–10 Jun" / "28 May–3 Jun"; Vietnamese "1–10/6" / "28/5–3/6" */
  const span = (a, b, vi) => {
    const [, m1, d1] = ymd(a), [, m2, d2] = ymd(b);
    if (vi) return m1 === m2 ? `${d1}–${d2}/${m2}` : `${d1}/${m1}–${d2}/${m2}`;
    return m1 === m2 ? `${d1}–${d2} ${MON[m2 - 1]}` : `${d1} ${MON[m1 - 1]}–${d2} ${MON[m2 - 1]}`;
  };
  function salt(siteId, today = new Date()) {
    const J = typeof SITES_JSON !== "undefined" && SITES_JSON, m = J && J.salt_forecast;
    const s = m && J.sites.find((x) => x.id === siteId), f = s && s.salt_forecast;
    if (!f) return null;
    const [y, mo, d] = ymd(m.to), [iy, im, id] = ymd(m.issued);
    if (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(y, mo - 1, d) > STALE_DAYS * 864e5) return null;
    return {
      en: `KTTV forecast, ${span(m.from, m.to)}: up to ${num(f.ppt)}‰ at ${f.station} station (issued ${id} ${MON[im - 1]} ${iy}).`,
      vi: `Dự báo KTTV, ${span(m.from, m.to, true)}: tối đa ${num(f.ppt, true)}‰ tại trạm ${f.station} (bản tin ngày ${id}/${im}/${iy}).`,
      risk: m.risk ? { en: `KTTV salt disaster-risk level: ${m.risk}.`, vi: `Cấp độ rủi ro thiên tai do xâm nhập mặn (KTTV): cấp ${m.risk}.` } : null
    };
  }
  /* Official planting windows (pipeline/planting_windows.json, hand-kept); null once finish_by has passed. */
  function planting(today = new Date()) {
    const w = (typeof SITES_JSON !== "undefined" && SITES_JSON.planting || [])[0];
    const [fy, fm, fd] = w ? ymd(w.finish_by) : [];
    if (!w || Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) > Date.UTC(fy, fm - 1, fd)) return null;
    const [iy, im, id] = ymd(w.issued), [sy, sn] = [w.season.slice(0, 7), w.season.slice(8)];
    const src = w.source.title.split(":")[0], each = (vi) => w.windows.map((x) => `${span(x.from, x.to, vi)}, ${vi ? x.vi : x.en}`).join("; ");
    return {
      en: `Official planting windows, ${sn} ${sy} (${src}, issued ${id} ${MON[im - 1]} ${iy}): ${each()}; ${w.finish_en} ${fd} ${MON[fm - 1]} ${fy}. ${w.note_en}`,
      vi: `Lịch thời vụ chính thức, ${sn} ${sy} (${src}, ngày ${id}/${im}/${iy}): ${each(true)}; ${w.finish_vi} ngày ${fd}/${fm}/${fy}. ${w.note_vi}`
    };
  }
  return { salt, planting };
})();
