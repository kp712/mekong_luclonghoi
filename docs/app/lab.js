/* Plan Lab for Draft 4 "Sigma": "Test your own plan". Ported from drafts/sigma/ref/draft3.html lines 4723-5192
   (engine + text copied verbatim from 4728-4961; the UI is rewritten for the dark shell).
   Needs the globals DATA, EXTRA, BUILDER (data.js), STR (strings.js) and window.App
   ({ t, lang, site, go }; optional: guide(), mode(), weights(), upCrop()). Public API: Lab.render(rootEl), Lab.refresh(). */
const Lab = (() => {
"use strict";
const B = BUILDER, C = B.const;
const RMAX = B.rice_months.max;  // rice 90–100 days (resources.json) -> at most 4 whole months per season
Object.assign(STR.en, {
plTabsL: "App views", plTabExplore: "Explorer", plTabLab: "Test your own plan",
plEyebrow: "Plan lab", plH: "Paint your own 12-month calendar",
plIntro: "Pick your area, paint what grows in each month, and see how the app's own card rules score it.",
plStep1: "Your area", plStep2: "Start from", plBlank: "Blank calendar", plFromRec: "Or start from a recommended plan",
plStep3: "Paint the calendar", plPaintHint: "Choose a brush, then tap a month. On a computer you can also drag across months.",
plBrushL: "Crop brush", plVariantL: "Upland crop",
plB_R: "Rice", plB_T: "Salt-tolerant rice", plB_S: "Shrimp", plB_U: "Upland crop", "plB_-": "Rest",
plS_R: "Rice", plS_T: "ST rice", plS_S: "Shrimp", plS_U: "Upland", "plS_-": "Rest",
plCrop: { watermelon: "Watermelon", maize: "Maize", mungbean: "Mung bean" },
plLegRain: "Rainy month (rain ≥ crop water demand)", plLegDry: "Dry month", plLegSalt: "Usual salt month (estimate from station reports)",
plUndo: "Undo", plReset: "Reset", plSeasons: "Seasons in your plan", plSeasonN: n => `Season ${n}`,
plMonthsN: n => `${n} month${n === 1 ? "" : "s"}`, plNoHarvest: "too short to harvest", plNoPlant: "Nothing planted yet.",
plYou: "Your plan", plBest: "Our best plan for these priorities", plLoadBest: "Load this plan", plOf100: "out of 100", plGrade: "Grade",
plBarProfit: "Income", plBarSalt: "Weather & salt", plBarWater: "Water", plBarSoil: "Soil", plBarPests: "Pests",
plBarNote: "Bars show the 1–5 card scores; longer is better (for Water: longer means less canal water).",
plProfit: v => `≈ ${v} M ₫/ha a year`, plProfitNA: c => `not scored: no checked profit figure for ${c} yet`,
plWater: v => `${v} mm canal water a year`, plSaltMonths: n => `${n} crop month${n === 1 ? "" : "s"} in salt months`,
plDelta: d => `${d > 0 ? "+" : d < 0 ? "−" : "±"}${Math.abs(d)} vs our best`, plMiniL: "Plan score",
plWarnH: "Watch out", plWarnNone: "No risky months found with these rules.",
plWarnSalt: (c, r, p) => `${c} in ${r}: these are usual salt months here (station readings up to ${p}‰; an estimate from station reports, not satellite).`,
plWarnSaltLow: (c, r, p) => `${c} in ${r}: salt usually reaches the river here in these months (station readings up to ${p}‰), but sluices keep it out of the fields, so the risk is rated low (an estimate from station reports, not satellite).`,
plWarnTol: " Salt-tolerant rice counts as half the risk (team estimate).",
plWarnUpland: r => `Canal water here in ${r} is usually far saltier than upland crops tolerate (FAO: maize loses yield above about 0.7‰): grow them only with stored fresh water.`,
plWarnShort: (c, r, n, k) => `${c} in ${r} lasts ${n}: too short to harvest (a season needs at least ${k}), so it earns nothing here.`,
plWarnShrimp: "Shrimp here: brackish water is not normally available in this inland area, so shrimp earns nothing in this score.",
plWarnNoIncome: "Nothing is harvested yet, so this is not a farming plan and it scores 0. Paint at least one full season.",
plSugH: "Suggested improvements", plSugEmpty: "Start by painting one full crop season, or pick a recommended plan in step 2 and change it.", plSugNone: "No single change raises this score. Well planned!",
plApply: n => `Apply suggested improvement (+${n} points)`,
plSugFallow: (c, r) => `Rest the field in ${r} instead of ${c}`, plSugShrimp: (c, r) => `Raise shrimp in ${r} instead of ${c}`,
plSugShift: (s, d) => `Start ${s} one month ${d < 0 ? "earlier" : "later"}`, plSugTol: s => `Use salt-tolerant rice for ${s}`,
plSugCrop: (a, b) => `Grow ${b} instead of ${a}`, plSugShrimpSeason: r => `Raise one shrimp season in ${r}, over the salt months`,
plPrio: "Scored with your priorities from Explorer:", plK: { water: "Water", income: "Income", soil: "Soil", salt: "Weather & salt", pests: "Pests" },
plView: { typical: "Typical year", elnino: "El Niño year" }, plLevel: { low: "Salt: low", medium: "Salt: medium", high: "Salt: high" },
plHowH: "How this score works",
plHow: [
"The five scores are the app's published card rules (the same formulas as the rotation cards), applied to the calendar you paint. Your plan score is their average, weighted by your priorities, turned into 0–100 as (score − 1) ÷ 4 × 100. Grades: A from 80, B from 65, C from 50, D below 50.",
"Data: rain from NASA GPM IMERG; crop water demand (ET₀), hot days, mean temperature and sudden cold nights from NASA POWER; salt months and salinity are estimates from public station reports, not satellite; profit is the median of published figures (2020–2025, million ₫ per ha).",
"Each run of the same crop is one season. A season shorter than its crop needs earns no harvest: rice 3 months (90–100 days), upland crops 3 months and shrimp 6 months (the shortest seasons in the app's own calendars). Painted rice is matched to winter–spring, summer–autumn or autumn–winter rice by the month it starts.",
"This is a planning aid, not advice for your exact field. Talk it over with your local extension officer before you change your calendar."
]
});
Object.assign(STR.vi, {
plTabsL: "Chế độ xem", plTabExplore: "Khám phá", plTabLab: "Tự thiết kế & chấm điểm lịch mùa vụ",
plEyebrow: "Thử kế hoạch", plH: "Tự vẽ lịch mùa vụ 12 tháng của bạn",
plIntro: "Chọn khu vực, tô cây trồng cho từng tháng, rồi xem điểm theo đúng quy tắc chấm thẻ của ứng dụng.",
plStep1: "Khu vực của bạn", plStep2: "Bắt đầu từ", plBlank: "Lịch trống", plFromRec: "Hoặc bắt đầu từ một kế hoạch gợi ý",
plStep3: "Tô lịch mùa vụ", plPaintHint: "Chọn cọ, rồi chạm vào một tháng. Trên máy tính, bạn cũng có thể kéo qua nhiều tháng.",
plBrushL: "Cọ cây trồng", plVariantL: "Loại cây màu",
plB_R: "Lúa", plB_T: "Lúa chịu mặn", plB_S: "Tôm", plB_U: "Cây màu", "plB_-": "Nghỉ",
plS_R: "Lúa", plS_T: "Lúa CM", plS_S: "Tôm", plS_U: "Màu", "plS_-": "Nghỉ",
plCrop: { watermelon: "Dưa hấu", maize: "Bắp", mungbean: "Đậu xanh" },
plLegRain: "Tháng mưa (mưa ≥ nhu cầu nước của cây)", plLegDry: "Tháng khô", plLegSalt: "Tháng thường bị mặn (ước tính từ báo cáo trạm)",
plUndo: "Hoàn tác", plReset: "Đặt lại", plSeasons: "Các vụ trong kế hoạch", plSeasonN: n => `Vụ ${n}`,
plMonthsN: n => `${n} tháng`, plNoHarvest: "quá ngắn để thu hoạch", plNoPlant: "Chưa trồng gì.",
plYou: "Kế hoạch của bạn", plBest: "Kế hoạch tốt nhất của chúng tôi theo ưu tiên này", plLoadBest: "Dùng kế hoạch này", plOf100: "trên 100", plGrade: "Hạng",
plBarProfit: "Thu nhập", plBarSalt: "Thời tiết & mặn", plBarWater: "Nước", plBarSoil: "Đất", plBarPests: "Sâu bệnh",
plBarNote: "Thanh thể hiện điểm thẻ từ 1 đến 5; càng dài càng tốt (với Nước: càng dài là càng ít nước kênh).",
plProfit: v => `khoảng ${v} triệu đồng/ha/năm`, plProfitNA: c => `chưa chấm: chưa có số liệu lợi nhuận đã kiểm chứng cho ${c}`,
plWater: v => `${v} mm nước tưới từ kênh mỗi năm`, plSaltMonths: n => `${n} tháng có cây trồng trong mùa mặn`,
plDelta: d => `${d > 0 ? "+" : d < 0 ? "−" : "±"}${Math.abs(d)} so với kế hoạch tốt nhất`, plMiniL: "Điểm kế hoạch",
plWarnH: "Cần lưu ý", plWarnNone: "Không thấy tháng rủi ro theo các quy tắc này.",
plWarnSalt: (c, r, p) => `${c} vào ${r}: đây là các tháng thường bị mặn ở khu vực này (độ mặn đo tại trạm lên đến ${p}‰ (phần ngàn); ước tính từ báo cáo trạm, không đo bằng vệ tinh).`,
plWarnSaltLow: (c, r, p) => `${c} vào ${r}: mặn thường lên sông ở đây vào các tháng này (độ mặn đo tại trạm lên đến ${p}‰ (phần ngàn)), nhưng cống ngăn mặn giữ cho ruộng không bị mặn nên rủi ro được xếp mức thấp (ước tính từ báo cáo trạm, không đo bằng vệ tinh).`,
plWarnTol: " Lúa chịu mặn được tính bằng nửa mức rủi ro (ước tính của nhóm).",
plWarnUpland: r => `Nước kênh ở đây vào ${r} thường mặn hơn nhiều so với mức cây màu chịu được (FAO: bắp giảm năng suất khi nước mặn trên khoảng 0,7‰ (phần ngàn)): chỉ nên trồng khi có nước ngọt trữ sẵn.`,
plWarnShort: (c, r, n, k) => `${c} vào ${r} chỉ kéo dài ${n}: quá ngắn để thu hoạch (mỗi vụ cần ít nhất ${k}), nên không có thu nhập.`,
plWarnShrimp: "Tôm ở đây: vùng nội đồng này thường không có nước lợ, nên tôm không được tính thu nhập trong điểm này.",
plWarnNoIncome: "Chưa có vụ nào thu hoạch, nên đây chưa phải là kế hoạch canh tác và được 0 điểm. Hãy tô ít nhất một vụ trọn vẹn.",
plSugH: "Gợi ý cải thiện", plSugEmpty: "Hãy bắt đầu bằng cách tô một vụ trọn vẹn, hoặc chọn một kế hoạch gợi ý ở bước 2 rồi chỉnh lại.", plSugNone: "Không có thay đổi đơn lẻ nào làm tăng điểm. Kế hoạch tốt!",
plApply: n => `Áp dụng gợi ý cải thiện (+${n} điểm)`,
plSugFallow: (c, r) => `Cho ruộng nghỉ vào ${r} thay vì ${c}`, plSugShrimp: (c, r) => `Nuôi tôm vào ${r} thay vì ${c}`,
plSugShift: (s, d) => `Xuống giống ${s} ${d < 0 ? "sớm" : "muộn"} hơn một tháng`, plSugTol: s => `Dùng lúa chịu mặn cho ${s}`,
plSugCrop: (a, b) => `Trồng ${b} thay vì ${a}`, plSugShrimpSeason: r => `Nuôi một vụ tôm vào ${r}, trùm qua các tháng mặn`,
plPrio: "Chấm điểm theo ưu tiên của bạn ở phần Khám phá:", plK: { water: "Nước", income: "Thu nhập", soil: "Đất", salt: "Thời tiết & mặn", pests: "Sâu bệnh" },
plView: { typical: "Năm bình thường", elnino: "Năm El Niño" }, plLevel: { low: "Mặn: thấp", medium: "Mặn: trung bình", high: "Mặn: cao" },
plHowH: "Cách tính điểm này",
plHow: [
"Năm điểm số dùng đúng quy tắc chấm thẻ đã công bố của ứng dụng (cùng công thức với các thẻ luân canh), áp dụng cho lịch bạn tô. Điểm kế hoạch là trung bình của năm điểm, có trọng số theo ưu tiên của bạn, đổi sang thang 0–100 bằng (điểm − 1) ÷ 4 × 100. Hạng: A từ 80, B từ 65, C từ 50, D dưới 50.",
"Dữ liệu: mưa từ NASA GPM IMERG; nhu cầu nước của cây (ET₀), số ngày nắng nóng, nhiệt độ trung bình và đêm lạnh đột ngột từ NASA POWER; tháng mặn và độ mặn là ước tính từ báo cáo công khai của các trạm đo, không đo bằng vệ tinh; lợi nhuận là mức giữa của các số liệu đã công bố (2020–2025, triệu đồng/ha).",
"Mỗi chuỗi tháng liền nhau cùng một cây là một vụ. Vụ ngắn hơn thời gian cây cần thì không được tính thu hoạch: lúa 3 tháng (90–100 ngày), cây màu 3 tháng và tôm 6 tháng (các vụ ngắn nhất trong lịch của chính ứng dụng). Lúa bạn tô được xếp vào vụ Đông Xuân, Hè Thu hoặc Thu Đông theo tháng bắt đầu.",
"Đây là công cụ hỗ trợ lập kế hoạch, không phải lời khuyên cho đúng thửa ruộng của bạn. Hãy trao đổi với cán bộ khuyến nông địa phương trước khi đổi lịch mùa vụ."
]
});
/* ================= engine: port of pipeline/build.py ================= */
const { evaluate, runs, normalize, isRice, pyRound } = Score;
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const labPen = () => (typeof window !== "undefined" && window.labourPen ? window.labourPen() : 0);
function planScore(ev, weights) {  // same weighting as the app's scoreOf(card)
if (!ev.seasons.some(s => !s.short)) return 0;
const sc = ev.scores, ks = KEYS.filter(k => sc[k] != null), tot = ks.reduce((a, k) => a + weights[k], 0);
const avg = tot ? ks.reduce((a, k) => a + weights[k] * sc[k], 0) / tot : ks.reduce((a, k) => a + sc[k], 0) / ks.length;
const s = avg - (ev.hasU ? labPen() : 0);
return Math.round(clamp((s - 1) / 4 * 100, 0, 100));
}
const grade = p => p >= 80 ? "A" : p >= 65 ? "B" : p >= 50 ? "C" : "D";
function paint(m, i, brush) {
const out = m.slice();
if (brush === "R" || brush === "T") {
if (m[i][0] === brush) return m;
const count = c => m.filter(x => x === c).length, L = m[(i + 11) % 12], Rn = m[(i + 1) % 12];
out[i] = L[0] === brush && count(L) < RMAX ? L : Rn[0] === brush && count(Rn) < RMAX ? Rn : brush + "new";
} else out[i] = brush;
return normalize(out);
}
function shiftRun(m, code, d) {
const idx = runs(m).find(([c]) => c === code)[1], first = idx[0], last = idx[idx.length - 1];
const enter = d > 0 ? (last + 1) % 12 : (first + 11) % 12;
if (m[enter] !== "-" || idx.length >= 12) return null;
const out = m.slice(); out[d > 0 ? first : last] = "-"; out[enter] = code;
return normalize(out);
}
const seasonName = (key, l) => key in B.crop_words ? B.crop_words[key][l] : (STR[l].plCrop[key] || key).toLowerCase();
function rangeText(idx, l) {  // indices in run order (may wrap) -> "Mar–Apr", "Dec–Feb"
const names = STR[l].monthsLong, groups = [];
idx.forEach(i => { const g = groups[groups.length - 1]; if (g && (g[g.length - 1] + 1) % 12 === i) g.push(i); else groups.push([i]) });
return groups.map(g => g.length === 1 ? names[g[0]] : `${names[g[0]]}–${names[g[g.length - 1]]}`).join(", ");
}
function suggestions(st, weights, noBrackish, l) {
const ev = evaluate(st.site, st.view, st.months, st.crop), now = planScore(ev, weights), out = [];
const shorts = e => e.seasons.filter(s => s.short).length, s0 = shorts(ev);
const add = (months, crop, text) => { const e = evaluate(st.site, st.view, months, crop), p = planScore(e, weights);
if (shorts(e) > s0) return;  // never suggest a season too short to harvest
out.push({ months, crop, text, gain: p - now, score: p, changed: months.map((c, i) => c[0] !== st.months[i][0] || (crop !== st.crop && c[0] === "U") ? i : -1).filter(i => i >= 0) }) };
const word = s => s.kind === "U" ? STR[l].plCrop[st.crop].toLowerCase() : seasonName(s.key, l);
for (const s of ev.seasons) {
if ((isRice(s.code) || s.kind === "U") && s.salty.length) {
const r = rangeText(s.salty, l), f = st.months.slice(); s.salty.forEach(i => f[i] = "-");
add(normalize(f), st.crop, STR[l].plSugFallow(word(s), r));
if (!noBrackish && s.kind !== "U") { const sh = st.months.slice(); s.salty.forEach(i => sh[i] = "S"); add(normalize(sh), st.crop, STR[l].plSugShrimp(word(s), r)) }
}
if (isRice(s.code)) {
[-1, 1].forEach(d => { const m = shiftRun(st.months, s.code, d); if (m) add(m, st.crop, STR[l].plSugShift(seasonName(s.key, l), d)) });
if (s.kind === "R") { const m = st.months.map(c => c === s.code ? "Tnew" : c); add(normalize(m), st.crop, STR[l].plSugTol(seasonName(s.key, l))) }
}
}
const salt = B.sites[st.site][st.view].salt.map(m => m - 1);
if (!noBrackish && ev.exposed.length && salt.length) {  // a whole shrimp season over the salt months (as rice_shrimp does)
const n = Math.max(B.min_months.S, salt.length), win = [...Array(n).keys()].map(k => (salt[0] + k) % 12), m = st.months.slice();
win.forEach(i => m[i] = "S"); add(normalize(m), st.crop, STR[l].plSugShrimpSeason(rangeText(win, l)));
}
if (ev.hasU) B.upland_crops.filter(k => k !== st.crop).forEach(k => add(st.months.slice(), k, STR[l].plSugCrop(STR[l].plCrop[st.crop].toLowerCase(), STR[l].plCrop[k].toLowerCase())));
const seen = new Set();
return out.filter(x => x.gain > 0).sort((a, b) => b.gain - a.gain)
.filter(x => { const k = x.months.join() + x.crop; if (seen.has(k)) return false; seen.add(k); return true }).slice(0, 3);
}
/* ---- text for the lab's guide button, verbatim from Draft 3 (the guide itself belongs to the app) ---- */
Object.assign(STR.en, { plGuideBtn: "How to use this page" });
Object.assign(STR.vi, { plGuideBtn: "Cách dùng trang này" });
/* ================= UI (Sigma: dark shell; app state is read through window.App and the shell's own controls) ================= */
const $ = s => root.querySelector(s);
const $$ = s => [...root.querySelectorAll(s)];
const A = () => window.App || {};
const L = () => (A().lang ? A().lang() : "en") === "vi" ? "vi" : "en";
const t = k => { const a = A(); return a.t ? a.t(k) : STR[L()][k] };
const pick = o => o[L()];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const num = x => L() === "vi" ? String(x).replace(".", ",") : String(x);
const T = (k, ...a) => { const x = t(k); return typeof x === "function" ? x(...a) : x };
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains("calm");
/* line icons: 24px grid, 1.5px stroke, currentColor */
const ICON = {
rice: '<path d="M12 21V8"/><path d="M12 8c-2.4-.6-3.6-2.4-3.6-5 2.4.6 3.6 2.4 3.6 5Z"/><path d="M12 8c2.4-.6 3.6-2.4 3.6-5-2.4.6-3.6 2.4-3.6 5Z"/><path d="M12 14c-2.4-.6-3.6-2.4-3.6-5"/><path d="M12 14c2.4-.6 3.6-2.4 3.6-5"/>',
shield: '<path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6l-7-3Z"/><path d="M12 8v8"/><path d="M9 12h6"/>',
shrimp: '<path d="M4 16c.8-6 5.6-10 11.5-9.2 3.2.4 4 3.4 2 5.2-1.8 1.7-4.6 1-5.8 3.2L9 20"/><path d="M4 16l3 1"/><circle cx="16" cy="9.5" r=".6"/>',
upland: '<path d="M12 21v-8"/><path d="M12 13c-4.2 0-6.2-3-6.2-7 4.2 0 6.2 3 6.2 7Z"/><path d="M12 15c0-4 2-6 6-6 0 4-2 6-6 6Z"/>',
fallow: '<path d="M4 12h3"/><path d="M10.5 12h3"/><path d="M17 12h3"/>',
tools: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4Z"/><path d="M14 7l3 3"/>',
guide: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.6a2.6 2.6 0 0 1 5 .6c0 1.6-2.5 2.1-2.5 3.7"/><path d="M12 17.2v.1"/>',
warn: '<path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 10v4.5"/><path d="M12 17.4v.1"/>',
check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
spark: '<path d="M12 3c.5 5 4 8.5 9 9-5 .5-8.5 4-9 9-.5-5-4-8.5-9-9 5-.5 8.5-4 9-9Z"/>',
star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M14.6 9.2c-.4-.9-1.3-1.4-2.6-1.4-1.6 0-2.6.7-2.6 1.8 0 2.6 5.2 1.2 5.2 3.8 0 1.1-1.1 1.8-2.6 1.8-1.3 0-2.2-.6-2.6-1.5"/>',
drop: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z"/>',
salt: '<path d="M5 6h4v4H5Z"/><path d="M14.5 5h4v4h-4Z"/><path d="M9.5 14h4v4h-4Z"/><path d="M17 14.5h2v2h-2Z"/>'
};
const ic = n => `<svg class="pl-i" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[n] || ""}</svg>`;
/* per-công next to per-ha money (same rule as Draft 3 fix 17, money only; the app's own pass skips text that already has it) */
const cN = x => { x = x.trim().replace(/[.,]$/, ""); return L() === "vi" ? +x.replace(/\./g, "").replace(",", ".") : +x.replace(/,/g, "") };
const cF = x => { const r = x >= 100 ? Math.round(x) : Math.round(x * 10) / 10; return r.toLocaleString(L() === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 1 }) };
const cNUM = "\\d[\\d.,]*(?:\\s*[–-]\\s*\\d[\\d.,]*)?";
const cPer = range => range.split(/\s*[–-]\s*/).map(cN).map(x => x / 10);
const cNOT = "(?!(?:\\/năm| a year)?\\s*\\((?:≈|,? ?khoảng|\\d|mỗi công|per công))";
const cMoney = new RegExp("(" + cNUM + ")\\s*(M ₫|triệu đồng|triệu đ|triệu)\\/ha((?:\\/năm)|(?: a year))?" + cNOT, "g");
const cong = txt => {
if (txt.indexOf("/ha") < 0 || /\/công|mỗi công|per công/.test(txt)) return txt;
const vi = L() === "vi", u = vi ? "triệu" : "M ₫";
return txt.replace(cMoney, (all, a) => all + (vi ? `, khoảng ${cPer(a).map(cF).join("–")} ${u}/công` : ` (≈ ${cPer(a).map(cF).join("–")} ${u}/công)`));
};
/* app state, read from window.App when it offers it, otherwise from the shell's own controls (Draft 3 ids) */
const KEYS = ["water", "income", "soil", "salt", "pests"];
const mode = () => { const a = A(); if (typeof a.mode === "function") return a.mode();
const b = document.querySelector('#modeSeg [data-mode][aria-pressed="true"], #modeSeg [data-mode].on, #year [data-mode][aria-pressed="true"]');
return b ? b.dataset.mode : "typical" };
const viewOf = () => mode() === "elnino" ? "elnino" : "typical";
const weights = () => { const a = A(); if (typeof a.weights === "function") return a.weights();
const w = {}; KEYS.forEach(k => { const el = document.getElementById("w_" + k); const v = el ? +el.value : 2; w[k] = isFinite(v) ? v : 2 }); return w };
const upCrop = () => { const a = A(); return typeof a.upCrop === "function" ? a.upCrop() : null };
const V = s => { const m = mode(); return m === "elnino" ? s.el : m === "latest" && EXTRA.latest[s.id] ? { ...s, rain: EXTRA.latest[s.id].rain, latest: true } : s };
const cardsOf = v => v.cards.map(c => {
if (!c.variants) return c;
const choices = Object.keys(c.variants), uc = upCrop();
const x = c.variants[choices.includes(uc) ? uc : c.crop_default] || c.variants[choices[0]];
return { ...x, id: c.id, choices };
});
function scoreOf(card) {
const w = weights(), ks = KEYS.filter(k => card.scores[k] != null), total = ks.reduce((a, k) => a + w[k], 0);
const avg = total ? ks.reduce((a, k) => a + w[k] * card.scores[k], 0) / total : ks.reduce((a, k) => a + card.scores[k], 0) / ks.length;
return avg - (card.upland ? labPen() : 0);
}
const shortName = s => { const m = L() === "vi" ? s.name.vi.match(/Khu vực (.+?) cũ/) : s.name.en.match(/Former (.+?) area/); return m ? m[1] : pick(s.name) };
const BRUSHES = [["R", "rice"], ["T", "shield"], ["S", "shrimp"], ["U", "upland"], ["-", "fallow"]];
const iconOf = c => (BRUSHES.find(b => b[0] === c[0]) || BRUSHES[4])[1];
const st = { site: null, view: "typical", months: Array(12).fill("-"), crop: B.upland_crops[0], brush: "R", undo: [], start: null, startId: "blank", shown: 0, flash: [] };
let root = null, lastApp = null, sugg = [];
const siteObj = id => DATA.sites.find(s => s.id === id);
const sites = () => DATA.sites.filter(s => B.sites[s.id]);
const toPlan = c => ({ months: normalize(c.months.map(x => x[0] === "R" && B.tolerant_ids.includes(c.id) ? "T" + x.slice(1) : x)), crop: c.crop || st.crop });  // as Score.ofCard
const noBr = () => !!(document.getElementById("noBrackish") || {}).checked;
function ranked(s) {  // the app's own ranking (renderCards): brackish filter, then not_here last, then scoreOf
let cs = cardsOf(V(s));
if (noBr()) cs = cs.filter(c => !c.needs_brackish);
return cs.map(c => ({ c, s: scoreOf(c) })).sort((a, b) => (a.c.not_here - b.c.not_here) || (b.s - a.s)).map(x => x.c);
}
const appSiteId = () => { const a = A(), s = a.site ? a.site() : null; return s && B.sites[s.id] ? s.id : null };
function sync() {  // pick the area (the app's, unless the user chose another one here) and the year view
const aid = appSiteId();
if (!st.site) chooseSite(aid || sites()[0].id, true);
else if (aid && aid !== lastApp) chooseSite(aid, true);
lastApp = aid; st.view = viewOf();
}
function chooseSite(id, quiet) {
st.site = id; st.undo = [];
const best = ranked(siteObj(id))[0];
const p = st.startId !== "blank" && cardsOf(V(siteObj(id))).find(c => c.id === st.startId);
const from = p ? toPlan(p) : { months: Array(12).fill("-"), crop: st.crop };
st.months = from.months; st.crop = from.crop; st.start = { ...from };
if (!quiet && root) renderAll();
return best;
}
function commit(months, crop, flash) {
if (months.join() === st.months.join() && crop === st.crop) return;
st.undo.push({ months: st.months, crop: st.crop }); if (st.undo.length > 50) st.undo.shift();
st.months = months; st.crop = crop; st.flash = flash || []; renderLive();
}
function skeleton() {
root.innerHTML = `<div class="pl-head"><span class="pl-eye">${ic("tools")}${esc(t("plEyebrow"))}</span><h2 id="plH">${esc(t("plH"))}</h2><p>${esc(t("plIntro"))}</p>${typeof A().guide === "function" ? `<button type="button" class="pl-guide-btn" id="plGuideBtn">${ic("guide")}<span>${esc(t("plGuideBtn"))}</span></button>` : ""}</div>
<div class="pl-grid"><div class="pl-main">
<div class="pl-card" id="plCard1"><h3><span class="pl-n">1</span>${esc(t("plStep1"))}</h3><div class="pl-chips" id="plSites" role="group" aria-label="${esc(t("plStep1"))}"></div><p class="pl-view" id="plViewNote"></p></div>
<div class="pl-card" id="plCard2"><h3><span class="pl-n">2</span>${esc(t("plStep2"))}</h3><div class="pl-start" id="plStart"></div></div>
<div class="pl-card pl-editor"><h3><span class="pl-n">3</span>${esc(t("plStep3"))}</h3><p class="pl-hint">${esc(t("plPaintHint"))}</p>
<div class="pl-brushes" id="plBrushes" role="radiogroup" aria-label="${esc(t("plBrushL"))}"></div>
<div class="pl-variant" id="plVariant"></div>
<div class="pl-months" id="plMonths"></div>
<div class="pl-legend"><span><i class="lg wet"></i>${esc(t("plLegRain"))}</span><span><i class="lg dry"></i>${esc(t("plLegDry"))}</span><span><i class="lg salt"></i>${esc(t("plLegSalt"))}</span></div>
<div class="pl-tools"><button type="button" class="pl-btn" id="plUndo">${esc(t("plUndo"))}</button><button type="button" class="pl-btn" id="plReset">${esc(t("plReset"))}</button>
<label class="pl-tog"><input type="checkbox" id="plNoBr"><span>${esc(t("c_brackish") || "")}</span></label></div>
<div class="pl-seasons" id="plSeasons"></div></div>
<div class="pl-card pl-warn" id="plWarn"></div>
<div class="pl-card pl-sugg" id="plSugg"></div>
</div><aside class="pl-side"><div class="pl-card pl-score" id="plScore"></div>
<details class="pl-card pl-how"><summary>${esc(t("plHowH"))}</summary>${t("plHow").map(p => `<p>${esc(p)}</p>`).join("")}</details></aside></div>
<div class="pl-mini" id="plMini" aria-live="polite"></div>`;
}
function renderAll() {
if (!root || !st.site) return;
skeleton();
const v = st.view;
$("#plSites").innerHTML = sites().map(s => `<button type="button" class="pl-chip" data-site="${s.id}" aria-pressed="${s.id === st.site}">
<b>${esc(shortName(s))}</b><small class="lvl-${B.sites[s.id][v].level}">${esc(t("plLevel")[B.sites[s.id][v].level])}</small></button>`).join("");
$("#plViewNote").textContent = t("plView")[v];
const cards = ranked(siteObj(st.site));
$("#plStart").innerHTML = `<button type="button" class="pl-opt" data-start="blank" aria-pressed="${st.startId === "blank"}">${ic("fallow")}<span>${esc(t("plBlank"))}</span></button>
<p class="pl-sub">${esc(t("plFromRec"))}</p>
<div class="pl-recs">${cards.map(c => `<button type="button" class="pl-opt" data-start="${c.id}" aria-pressed="${st.startId === c.id}">${ic(iconOf(c.months.find(x => x !== "-" && x[0] !== "R") || "R"))}<span>${esc(pick(c.name))}</span></button>`).join("")}</div>`;
$("#plBrushes").innerHTML = BRUSHES.map(([c, i]) => `<button type="button" class="pl-brush k-${c === "-" ? "F" : c}" role="radio" data-brush="${c}" aria-checked="${st.brush === c}">${ic(i)}<span>${esc(t("plB_" + c))}</span></button>`).join("");
$("#plNoBr").checked = noBr();
renderLive();
}
function renderVariant() {
$("#plVariant").innerHTML = `<span id="plVarL">${esc(t("plVariantL"))}</span><div class="seg" role="group" aria-labelledby="plVarL">${B.upland_crops.map(k => `<button type="button" data-crop="${k}" aria-pressed="${st.crop === k}">${esc(t("plCrop")[k])}</button>`).join("")}</div>`;
}
function renderTiles(ev) {
const v = B.sites[st.site][st.view], names = t("monthsLong");
const seasonNo = {}; ev.seasons.forEach((s, n) => seasonNo[s.code] = n + 1);
const shortSet = new Set(ev.seasons.filter(s => s.short).flatMap(s => s.idx));
$("#plMonths").innerHTML = st.months.map((c, i) => {
const salt = v.salt.includes(i + 1), wet = v.rain[i] >= v.et0[i], crop = c !== "-" && c !== "S";
const risky = (salt && crop) || shortSet.has(i);  // a crop in a usual salt month, or a season too short to harvest
const first = c !== "-" && st.months[(i + 11) % 12] !== c;
const k = c === "-" ? "F" : c[0];
const lab = `${names[i]}: ${t("plB_" + (c === "-" ? "-" : c[0]))}${salt ? ", " + t("plLegSalt") : ""}${shortSet.has(i) ? ", " + t("plNoHarvest") : ""}`;
return `<button type="button" class="pl-tile k-${k}${risky ? " risky" : ""}${first ? " first" : ""}${st.flash.includes(i) ? " pl-pop" : ""}" data-i="${i}" aria-label="${esc(lab)}">
<span class="pl-m">${esc(names[i])}</span>${c === "-" ? `<span class="pl-ic dim">${ic("fallow")}</span>` : `<span class="pl-ic">${ic(iconOf(c))}</span>`}
<span class="pl-c">${esc(t("plS_" + (c === "-" ? "-" : c[0])))}</span>${first && seasonNo[c] ? `<span class="pl-sn">${seasonNo[c]}</span>` : ""}
${risky ? `<span class="pl-w">${ic("warn")}</span>` : ""}<span class="pl-ul ${wet ? "wet" : "dry"}${salt ? " salt" : ""}" aria-hidden="true"></span></button>`;
}).join("");
st.flash = [];
}
const cropWord = (s, ev) => s.kind === "U" ? t("plCrop")[ev.crop] : s.kind === "S" ? t("plB_S") : seasonName(s.key, L());
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const profitTxt = v => cong(T("plProfit", v));
function renderSeasons(ev) {
$("#plSeasons").innerHTML = `<h4>${esc(t("plSeasons"))}</h4>` + (ev.seasons.length ? `<ol>${ev.seasons.map((s, n) => `<li class="${s.short ? "short" : ""}"><span class="pl-sn">${n + 1}</span>
<b>${esc(cap(cropWord(s, ev)))}</b><span>${esc(rangeText(s.idx, L()))} · ${esc(T("plMonthsN", s.idx.length))}</span>${s.short ? `<em>${esc(t("plNoHarvest"))}</em>` : s.profit ? `<span>${esc(profitTxt(num(pyRound(s.profit, 1))))}</span>` : ""}</li>`).join("")}</ol>` : `<p>${esc(t("plNoPlant"))}</p>`);
}
const dial = (p, cls, id, from = p) => { const r = 52, Lc = 2 * Math.PI * r;  // drawn at `from`, then animated to p
return `<svg class="pl-dial ${cls}" viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="${r}" class="track"/><circle cx="64" cy="64" r="${r}" class="arc g-${grade(p)}" ${id ? `id="${id}"` : ""} stroke-dasharray="${Lc.toFixed(1)}" stroke-dashoffset="${(Lc * (1 - from / 100)).toFixed(1)}" transform="rotate(-90 64 64)"/></svg>` };
function countUp(el, from, to) {
if (calm() || from === to) { el.textContent = to; return }
const t0 = performance.now(), dur = 650;
const step = now => { const k = Math.min((now - t0) / dur, 1), e = 1 - (1 - k) ** 3; el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step) };
requestAnimationFrame(step);
}
function renderScore(ev, p, best, bp, bestCard) {
const w = weights();
const bars = [["plBarProfit", "income"], ["plBarSalt", "salt"], ["plBarWater", "water"], ["plBarSoil", "soil"], ["plBarPests", "pests"]];
const bar = (x, cls) => x == null ? `<span class="pl-bar ${cls} na"><i style="width:0"></i><em>–</em></span>` : `<span class="pl-bar ${cls}"><i style="width:${(x / 5 * 100).toFixed(0)}%"></i><em>${num(x.toFixed(1))}</em></span>`;
const prio = KEYS.map(k => `${esc(t("plK")[k])} ${"●".repeat(Math.round(w[k]))}${"○".repeat(3 - Math.round(w[k]))}`).join(" · ");
$("#plScore").innerHTML = `<div class="pl-duo">
<div class="pl-you g-${grade(p)}"><div class="pl-lab">${esc(t("plYou"))}</div><div class="pl-dialbox">${dial(p, "big", "plArc", st.shown)}<div class="pl-num"><b id="plNum">${st.shown}</b><small>${esc(t("plOf100"))}</small></div></div>
<div class="pl-grade g-${grade(p)}"><span>${esc(t("plGrade"))}</span><b>${grade(p)}</b></div></div>
<div class="pl-best"><div class="pl-lab">${esc(t("plBest"))}</div><div class="pl-dialbox sm">${dial(bp, "small")}<div class="pl-num"><b>${bp}</b></div></div>
<div class="pl-bname">${esc(pick(bestCard.name))} <span class="pl-grade-s g-${grade(bp)}">${grade(bp)}</span></div>
<button type="button" class="pl-btn ghost" id="plLoadBest">${esc(t("plLoadBest"))}</button></div></div>
<div class="pl-cmp">${bars.map(([lab, k]) => `<div class="pl-row"><span class="pl-rl">${esc(t(lab))}</span><div class="pl-pair">${bar(ev.scores[k], "you")}${bar(best.scores[k], "best")}</div></div>`).join("")}
<div class="pl-key"><span><i class="you"></i>${esc(t("plYou"))}</span><span><i class="best"></i>${esc(t("plBest"))}</span></div>
<p class="pl-note">${esc(t("plBarNote"))}</p></div>
<ul class="pl-stats">
<li>${ic("coin")}<span>${ev.profit == null ? esc(T("plProfitNA", t("plCrop")[ev.missing] || ev.missing)) : esc(profitTxt(num(ev.profit)))}</span></li>
<li>${ic("drop")}<span>${esc(T("plWater", ev.water_mm))}</span></li>
<li>${ic("salt")}<span>${esc(T("plSaltMonths", ev.exposed.length))}</span></li></ul>
<p class="pl-prio">${esc(t("plPrio"))} ${prio}</p>`;
const Lc = 2 * Math.PI * 52, arc = $("#plArc");
requestAnimationFrame(() => { arc.style.strokeDashoffset = (Lc * (1 - p / 100)).toFixed(1) });
countUp($("#plNum"), st.shown, p); st.shown = p;
}
function renderWarn(ev) {
const v = B.sites[st.site][st.view], out = [];
for (const s of ev.seasons) {
const word = cap(cropWord(s, ev));
if (s.short) out.push(T("plWarnShort", word, rangeText(s.idx, L()), T("plMonthsN", s.idx.length), T("plMonthsN", B.min_months[s.kind])));
if ((isRice(s.code) || s.kind === "U") && s.salty.length) {
const r = rangeText(s.salty, L()), ppt = num(v.ppt);
out.push((v.max_ppt == null ? T("plWarnSaltLow", word, r, ppt) : T("plWarnSalt", word, r, ppt)) + (s.kind === "T" ? t("plWarnTol") : ""));
if (s.kind === "U" && v.level !== "low") out.push(T("plWarnUpland", r));
}
}
if (ev.notHere) out.push(t("plWarnShrimp"));
if (!ev.seasons.some(s => !s.short)) out.push(t("plWarnNoIncome"));
$("#plWarn").innerHTML = `<h3>${ic("warn")}${esc(t("plWarnH"))}</h3>` + (out.length ? `<ul>${out.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="pl-ok">${ic("check")}${esc(t("plWarnNone"))}</p>`);
}
function renderSugg() {
sugg = suggestions(st, weights(), noBr(), L());
$("#plSugg").innerHTML = `<h3>${ic("spark")}${esc(t("plSugH"))}</h3>` + (sugg.length ? `<div class="pl-sugs">${sugg.map((x, n) => `<div class="pl-sug"><p>${esc(x.text)}</p>
<button type="button" class="pl-btn primary" data-sug="${n}">${esc(T("plApply", x.gain))}</button></div>`).join("")}</div>` : `<p class="pl-ok">${ic("star")}${esc(t(evaluate(st.site, st.view, st.months, st.crop).seasons.some(s => !s.short) ? "plSugNone" : "plSugEmpty"))}</p>`);
}
function renderLive() {
if (!root || !st.site || !$("#plMonths")) return;
const w = weights();
const ev = evaluate(st.site, st.view, st.months, st.crop), p = planScore(ev, w);
const bc = ranked(siteObj(st.site))[0], bpPlan = toPlan(bc), best = evaluate(st.site, st.view, bpPlan.months, bpPlan.crop), bp = planScore(best, w);
renderVariant(); renderTiles(ev); renderSeasons(ev); renderScore(ev, p, best, bp, bc); renderWarn(ev); renderSugg();
$$("#plBrushes [data-brush]").forEach(b => b.setAttribute("aria-checked", b.dataset.brush === st.brush));
$("#plUndo").disabled = !st.undo.length;
const d = p - bp;
$("#plMini").innerHTML = `<span class="pl-ml">${esc(t("plMiniL"))}</span><b class="pl-mn">${p}</b><span class="pl-grade-s g-${grade(p)}">${grade(p)}</span><span class="pl-md ${d >= 0 ? "up" : "down"}">${esc(T("plDelta", d))}</span>`;
}
/* ---- events (delegated on the root; bound once per root element) ---- */
let drag = null, skipClick = false;
const tileAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest && el.closest("#plMonths .pl-tile") };
const refocusTile = (e, i) => { if (e.detail === 0) { const el = root.querySelector(`.pl-tile[data-i="${i}"]`); el && el.focus() } };  // keyboard users keep their place
function bind(el) {
el.addEventListener("pointerdown", e => {
const tile = e.target.closest(".pl-tile"); if (!tile || e.pointerType === "touch" || e.button !== 0) return;
e.preventDefault(); skipClick = true;  // mouse/pen: paint and drag; touch keeps normal scrolling and paints on tap
drag = { last: +tile.dataset.i, before: { months: st.months, crop: st.crop } };
st.months = paint(st.months, +tile.dataset.i, st.brush); renderLive();
});
el.addEventListener("pointermove", e => {
if (!drag) return; const tile = tileAt(e.clientX, e.clientY); if (!tile) return;
const i = +tile.dataset.i; if (i === drag.last) return;
const dir = i > drag.last ? 1 : -1;  // fast drags skip tiles between move events: paint every tile on the way
for (let k = drag.last + dir; k !== i + dir; k += dir) st.months = paint(st.months, k, st.brush);
drag.last = i; renderLive();
});
el.addEventListener("click", e => {
const g = sel => e.target.closest(sel);
let b;
if ((b = g(".pl-tile"))) { if (skipClick) { skipClick = false; return } const i = +b.dataset.i; commit(paint(st.months, i, st.brush), st.crop, [i]); refocusTile(e, i); return }
if ((b = g("[data-brush]"))) { st.brush = b.dataset.brush; $$("#plBrushes [data-brush]").forEach(x => x.setAttribute("aria-checked", x === b)); return }
if ((b = g("[data-crop]"))) { commit(st.months, b.dataset.crop, st.months.map((c, i) => c[0] === "U" ? i : -1).filter(i => i >= 0)); return }
if ((b = g("[data-site]"))) { chooseSite(b.dataset.site); return }
if ((b = g("[data-start]"))) { st.startId = b.dataset.start; chooseSite(st.site); return }
if ((b = g("[data-sug]"))) { const x = sugg[+b.dataset.sug]; if (x) commit(x.months, x.crop, x.changed); return }
if (g("#plUndo")) { const u = st.undo.pop(); if (u) { st.months = u.months; st.crop = u.crop; renderLive() } return }
if (g("#plReset")) { if (st.start) commit(st.start.months.slice(), st.start.crop); return }
if (g("#plLoadBest")) { const p = toPlan(ranked(siteObj(st.site))[0]); commit(p.months, p.crop, [...Array(12).keys()]); return }
if (g("#plGuideBtn")) { const a = A(); if (typeof a.guide === "function") a.guide(0) }
});
el.addEventListener("keydown", e => {  // arrow keys move between brushes (radio group)
const b = e.target.closest("[data-brush]"); if (!b || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
const all = $$("#plBrushes [data-brush]"), n = (all.indexOf(b) + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) + all.length) % all.length;
e.preventDefault(); all[n].focus(); all[n].click();
});
el.addEventListener("change", e => { if (e.target.id !== "plNoBr") return;
const o = document.getElementById("noBrackish"); if (o) { o.checked = e.target.checked; o.dispatchEvent(new Event("change", { bubbles: true })) } renderLive() });
}
const endDrag = () => { setTimeout(() => { skipClick = false }, 0); if (!drag) return;
if (drag.before.months.join() !== st.months.join()) { st.undo.push(drag.before); renderLive() } drag = null };
/* priorities, brackish/labour switches or the year mode changed elsewhere in the app: re-score */
let raf = 0, docBound = false;
const later = () => { if (!root || !root.isConnected || !st.site || raf) return; raf = requestAnimationFrame(() => { raf = 0; const v = viewOf(); if (v !== st.view) { st.view = v; renderAll() } else renderLive() }) };
function bindDoc() {
if (docBound) return; docBound = true;
addEventListener("pointerup", endDrag); addEventListener("pointercancel", endDrag);
document.addEventListener("input", e => { if (root && !root.contains(e.target)) later() });
document.addEventListener("change", e => { if (root && !root.contains(e.target)) later() });
document.addEventListener("click", e => { if (e.target.closest && e.target.closest("[data-mode]")) setTimeout(later, 0) });
}
const bound = new WeakSet();
const api = {
render(rootEl) {
if (rootEl) root = rootEl;
if (!root) return;
root.classList.add("pl");
if (!bound.has(root)) { bound.add(root); bind(root) }
bindDoc(); sync(); renderAll();
},
refresh() { if (!root) return; sync(); renderAll() },
has: id => !!B.sites[id],
score(siteId, card) { const p = toPlan(card), ev = evaluate(siteId, viewOf(), p.months, p.crop), s = planScore(ev, weights()); return { p: s, g: grade(s), ev, months: p.months, crop: p.crop } },
open(siteId, card) {  // preselect an area and a recommended plan, then show the lab
st.startId = card ? card.id : "blank"; st.view = viewOf(); chooseSite(siteId, true); lastApp = appSiteId();
if (typeof A().go === "function") A().go("lab");
if (root) renderAll();
},
};
return api;
})();
window.PlanLab = Lab;
