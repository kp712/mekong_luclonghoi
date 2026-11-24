/* ahead.js: "the season ahead" lines shared by the planner (app.js, #outlook) and the dashboard (dash.js, tile "ahead").
   Ahead.salt(siteId, today) -> {en, vi, risk} for the KTTV 10-day salt forecast at a site, or null when there is none or its
   period ended more than 14 days before `today` (the forecast is then old news and is hidden, not shown as current).
   Reads SITES_JSON (load.js): salt_forecast (issue date, period, risk) and the site's salt_forecast (station, ppt), both from build.py.
   test_build.py (test_forecast_stale) runs this file in Node. Ahead.planting(today): the official planting windows, hidden after finish_by. Ahead.outlook(siteId, today): the 3-month SEAS5 rain outlook, hidden when its months are past or its issue date is over 45 days old. Ahead.price(today): the rice price line, hidden when its month is over 3 months old. */
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
  /* Official planting windows (pipeline/planting_windows.json, hand-kept): the first entry for `region` whose finish_by has not passed, else null.
     Pins carry no region and are all in the Delta, hence the default. */
  function planting(region = "mekong_delta", today = new Date()) {
    const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const w = (typeof SITES_JSON !== "undefined" && SITES_JSON.planting || []).find((x) => x.region === region && t <= Date.UTC(...ymd(x.finish_by).map((v, i) => (i === 1 ? v - 1 : v))));
    if (!w) return null;
    const [iy, im, id] = ymd(w.issued), [fy, fm, fd] = ymd(w.finish_by);
    const src = w.source.title.split(":")[0], each = (vi) => w.windows.map((x) => `${span(x.from, x.to, vi)}, ${vi ? x.vi : x.en}`).join("; ");
    return {
      en: `Official planting windows, ${w.season_en} (${src}, issued ${id} ${MON[im - 1]} ${iy}): ${each()}; ${w.finish_en} ${fd} ${MON[fm - 1]} ${fy}. ${w.note_en}`,
      vi: `Lịch thời vụ chính thức, ${w.season_vi} (${src}, ban hành ngày ${id}/${im}/${iy}): ${each(true)}; ${w.finish_vi} ngày ${fd}/${fm}/${fy}. ${w.note_vi}`
    };
  }
  /* 3-month rain outlook at a pin (build.py outlook3 + seasonal meta, from pipeline/fetch_seasonal.py): wetter / drier / normal per month, never mm.
     Months already over or unlabelled (near-zero climatology) are dropped; null when none are left, when the issue date is over 45 days old, or when the site has none (province points). */
  const OUT_DAYS = 45, OUT_EN = { wetter: "wetter", drier: "drier", normal: "near normal" }, OUT_VI = { wetter: "mưa nhiều hơn thường lệ", drier: "mưa ít hơn thường lệ", normal: "gần mức thường lệ" };
  function outlook(siteId, today = new Date()) {
    const J = typeof SITES_JSON !== "undefined" && SITES_JSON, m = J && J.seasonal, s = m && J.sites.find((x) => x.id === siteId), o = s && s.outlook3;
    if (!o) return null;
    const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()), [iy, im, id] = ymd(m.issued);
    if (t - Date.UTC(iy, im - 1, id) > OUT_DAYS * 864e5) return null;
    const left = o.filter((x) => { const [y, mo] = ymd(x.month); return x.label && t < Date.UTC(y, mo, 1) });  // month ends before today: past
    if (!left.length) return null;
    const each = (vi) => left.map((x) => `${vi ? "tháng " + ymd(x.month)[1] : MON[ymd(x.month)[1] - 1]} ${(vi ? OUT_VI : OUT_EN)[x.label]}`).join("; ");
    return {
      en: `Rain outlook, ${each()}. ECMWF SEAS5 via Open-Meteo, not bias-corrected, run of ${id} ${MON[im - 1]} ${iy}, the start of the first forecast month. A forecast, not a measurement: wetter or drier means more than 20% above or below the model's own normal for that month (our choice of threshold). Sóc Trăng areas only.`,
      vi: `Dự báo mưa: ${each(true)}. ECMWF SEAS5 qua Open-Meteo, chưa hiệu chỉnh sai lệch, lần chạy ngày ${id}/${im}/${iy}, đầu tháng dự báo đầu tiên. Đây là dự báo, không phải số đo: "nhiều hơn" hoặc "ít hơn" là lệch trên 20% so với mức thường lệ của chính mô hình cho tháng đó (ngưỡng do nhóm chọn). Chỉ có cho các vùng Sóc Trăng.`
    };
  }
  /* Rice price (build.py rice_price, from pipeline/fetch_prices.py): FAO FPMA Bạc Liêu wholesale rice, 5% broken, VND/kg, latest month against its 2020-26 median.
     It sits beside the profit figures but does not move them. Hidden when the latest month is over 3 months old (team choice) or missing. Not a "season ahead" item, so it has no site argument. */
  const PRICE_MONTHS = 3, thou = (n, vi) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, vi ? "." : ",");
  function price(today = new Date(), short = false) {
    const p = typeof SITES_JSON !== "undefined" && SITES_JSON.rice_price;
    if (!p) return null;
    const [y, m] = ymd(p.month);
    if ((today.getFullYear() - y) * 12 + today.getMonth() + 1 - m > PRICE_MONTHS) return null;
    const up = p.pct >= 0, pc = num(Math.abs(p.pct)), when = `${MON[m - 1]} ${y}`, n = p.n;
    if (short) return {  // one line for each planner card
      en: `Rice price (milled, wholesale, FAO/VFA, ${when}): ${thou(p.vnd_kg)} ₫/kg, ${up ? "+" : "−"}${pc}% vs 2020–26 median`,
      vi: `Giá gạo (gạo xay xát, bán buôn, FAO/VFA, tháng ${m}/${y}): ${thou(p.vnd_kg, true)} ₫/kg, ${up ? "+" : "−"}${num(Math.abs(p.pct), true)}% so với trung vị 2020–26`,
      src: "FAO FPMA · VFA"
    };
    return {
      en: `Rice price (Bạc Liêu wholesale, FAO/VFA, ${when}): ${thou(p.vnd_kg)} ₫/kg (milled, 5% broken), ${pc}% ${up ? "above" : "below"} its 2020–26 median (${n} months). Profit figures are fixed published medians; they do not move with this price.`,
      vi: `Giá gạo (bán buôn Bạc Liêu, FAO/VFA, tháng ${m}/${y}): ${thou(p.vnd_kg, true)} ₫/kg (gạo 5% tấm), ${num(Math.abs(p.pct), true)}% ${up ? "cao hơn" : "thấp hơn"} trung vị 2020–26 (${n} tháng). Các số liệu lợi nhuận là trung vị đã công bố, cố định; không thay đổi theo giá này.`,
      src: "FAO FPMA · VFA"
    };
  }
  return { salt, planting, outlook, price };
})();
