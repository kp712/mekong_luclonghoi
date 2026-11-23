/* score.js: the card rules of pipeline/build.py, in JS, for plans the user paints (Plan Lab) and the dashboard's pest card.
   build.py is the source of record; test_build.py (test_score_parity) runs this file in Node and checks every card's
   scores against docs/data/sites.json. Globals used: BUILDER (builder.js), SITES_JSON (load.js).
   Score.evaluate(siteId, view, months, crop) -> { scores: { water, income, soil, salt, pests }, profit, water_mm, seasons, ... }
   Score.ofCard(siteId, view, card, crop) -> evaluate() of a card's own calendar (salt-tolerant cards paint T months)
   Score.monthPest(kind, climate, month) -> one month's pest pressure 0..1. Calendar helpers: runs, normalize, isRice, pyRound. */
const Score = (() => {
"use strict";
const B = BUILDER, C = B.const;
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const pyRound = (x, d = 0) => { const k = 10 ** d, y = x * k, f = Math.floor(y);
if (Math.abs(y - f - 0.5) < 1e-9) return (f % 2 === 0 ? f : f + 1) / k;
return d ? Number(x.toFixed(d)) : Math.round(x) };
const isRice = c => c[0] === "R" || c[0] === "T";  // T = salt-tolerant rice: same water and season rules as rice
const effRain = p => p > 75 ? 0.8 * p - 25 : Math.max(0.6 * p - 10, 0);                       // build.py effective_rain
const monthNeed = (et0, kc, rain, sat, perc, wl) => Math.max(kc * et0 + sat + perc + wl - effRain(rain), 0);  // month_need
function runs(m) {  // build.py crops(): runs of the same code, wrapping Dec -> Jan
let start = 0; for (let i = 0; i < 12; i++) if (m[i] !== m[(i + 11) % 12]) { start = i; break }
const out = [];
for (let k = 0; k < 12; k++) { const i = (start + k) % 12, r = out[out.length - 1];
if (r && r[0] === m[i]) r[1].push(i); else out.push([m[i], [i]]) }
return out;
}
function waterNeed(m, v, kcU) {  // build.py water_need
const kc = Array(12).fill(0), sat = Array(12).fill(0), perc = Array(12).fill(0), wl = Array(12).fill(0);
for (const [code, idx] of runs(m)) {
const k = isRice(code) ? "R" : code[0];
if (!C.KC[k]) continue;
const [ini, mid, end] = k === "U" && kcU ? kcU : C.KC[k];
idx.forEach((i, n) => kc[i] = n === 0 ? ini : n === idx.length - 1 ? end : mid);
if (k === "R") { wl[idx[0]] = C.WL; idx.forEach(i => perc[i] = C.PERC * C.DAYS[i]);
const prev = (idx[0] + 11) % 12; if (!isRice(m[prev])) sat[prev] = C.SAT }
}
return m.map((_, i) => kc[i] || sat[i] ? pyRound(monthNeed(v.et0[i], kc[i], v.rain[i], sat[i], perc[i], wl[i])) : 0);
}
const SEASON = m => [10, 11, 12, 1].includes(m) ? "ws" : m <= 6 ? "sa" : "aw";
function profitKey(code, start, hasS, crop) {
const k = code[0];
if (k === "S") return "shrimp";
if (k === "U") return crop;
if (k === "T") return SEASON(start) === "ws" ? "st_ws" : "st_sa";
return hasS ? "rice_rs" : "rice_" + SEASON(start);
}
const minMonths = code => B.min_months[code[0]] || 1;  // rice: duration_days; shrimp/upland: shortest run in rotations.json
function profitOf(seasons, salt, view, notHere) {  // build.py yearly_profit, one entry per season (shrimp: one per year)
const views = view === "elnino" ? ["typical", "elnino"] : ["typical"];
let total = 0, missing = null, shrimp = false;
for (const s of seasons) {
s.profit = 0;
if (s.short) continue;  // no harvest
if (s.key === "shrimp") { if (notHere || shrimp) continue; shrimp = true }
const salty = s.key === "shrimp" ? s.allS.some(i => salt.includes(i + 1)) : s.idx.some(i => salt.includes(i + 1));
const loss = B.loss.filter(l => l.key === s.key && views.includes(l.view) && (l.applies === "all" || salty)).reduce((a, l) => a + l.share, 0);
const med = B.median[s.key];
if (med == null) { missing = missing || s.key; s.profit = null; continue }
s.profit = med * (1 - loss); total += s.profit;
}
return { p: missing ? null : pyRound(total, 1), missing };
}
/* build.py rice_pressure / pest_pressure / score_pests, read live from sites.json (pest_rule and the site's climate) */
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function ricePressure(t, pts) {
if (!(pts[0][0] <= t && t <= pts[pts.length - 1][0])) return 0;
for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, p0] = pts[i - 1], [t1, p1] = pts[i]; return p0 + (p1 - p0) * (t - t0) / (t1 - t0) }
}
function monthPest(kind, cl, i) {  // one month's pest pressure 0..1 for a crop code (R/T rice, U upland, S shrimp)
const R = SITES_JSON.pest_rule, k = kind[0];
if (isRice(k)) return ricePressure(cl.tmean_c[i], R.rice_points);  // T (salt-tolerant rice) is rice here too
if (k === "U") return R.upland_pressure;
if (k === "S") return R.shrimp_floor + (1 - R.shrimp_floor) * Math.min((cl.hot_days[i] || 0) / MONTH_DAYS[i], 1);
return 0;
}
function pestScore(siteId, view, months, rest, nonrice) {
const s = SITES_JSON.sites.find(x => x.id === siteId), cl = view === "elnino" ? s.elnino.climate : s.climate;
let rice = 0, other = 0;
months.forEach((c, i) => { const p = monthPest(c, cl, i); if (isRice(c)) rice += p; else other += p });
const brk = 0.5 * Math.min(rest / 2, 1) + 0.5 * Math.min(nonrice / 2, 1);
return pyRound(clamp(1 + 4 * (1 - (rice * (1 - SITES_JSON.pest_rule.break_weight * brk) + other) / 12), 1, 5), 1);
}
function evaluate(siteId, view, months, crop) {
const v = B.sites[siteId][view], salt = v.salt, saltIdx = salt.map(m => m - 1);
const hasS = months.includes("S"), notHere = v.level === "low" && hasS;  // build.py make_card not_here
const allS = months.map((c, i) => c === "S" ? i : -1).filter(i => i >= 0);
const seasons = runs(months).filter(([c]) => c !== "-").map(([code, idx]) => ({ code, kind: code[0], idx, start: idx[0] + 1,
key: profitKey(code, idx[0] + 1, hasS, crop), short: idx.length < minMonths(code), allS, salty: idx.filter(i => salt.includes(i + 1)) }));
const kcU = C.KC_U[crop];
const needM = waterNeed(months, v, kcU), baseM = waterNeed(B.base, v, null);
const need = needM.reduce((a, b) => a + b, 0), base = baseM.reduce((a, b) => a + b, 0);
const saved = base ? Math.max(1 - need / base, 0) : 0;
const water = pyRound(clamp(1 + 4 * saved, 1, 5), 1);
const cls = months.map(c => c[0] === "T" ? C.TOL : c[0] === "R" || c[0] === "U" ? 1 : 0);
const severity = v.max_ppt == null ? C.OVERRIDE_SEVERITY : Math.min(v.ppt / C.SALT_FULL, 1);
const hot = months.reduce((a, c, i) => a + (cls[i] > 0 ? v.hot[i] : 0), 0);
const canal = saltIdx.reduce((a, i) => a + needM[i], 0), baseSalty = saltIdx.reduce((a, i) => a + baseM[i], 0);
const risk = [saltIdx.length ? saltIdx.reduce((a, i) => a + cls[i], 0) / saltIdx.length * severity : 0,
Math.min(hot / C.HEAT_REF, 1), baseSalty ? Math.min(canal / baseSalty, 1) : 0];
const parts = risk.map(r => 1 + 4 * (1 - r));
const saltScore = pyRound(parts.reduce((a, p, i) => a + C.WS_W[i] * p, 0), 1);
const rest = months.filter(c => c === "-").length, nonrice = months.filter(c => c[0] === "U" || c[0] === "S").length;
const legume = B.legume.includes(crop) ? months.filter(c => c[0] === "U").length : 0, cover = months.some(c => c[0] === "T");
const up = months.filter(c => c[0] === "U").length, riceM = months.filter(isRice).length, SW = C.SOIL_W;  // build.py score_soil
const soilGain = SW.legume * Math.min(legume / 2, 1) + SW.cover * (cover ? Math.min(rest / 2, 1) : 0) + SW.dry * Math.min((rest + up) / C.SOIL_DRY_MONTHS, 1) + SW.rice * (1 - riceM / 12);
const soil = Math.floor(clamp(1 + 4 * soilGain - (hasS ? C.BRACKISH_SOIL : 0), 1, 5) * 10 + 0.5 + 1e-9) / 10;  // halves round up, as in build.py
const pests = pestScore(siteId, view, months, rest, nonrice);
const P = profitOf(seasons, salt, view, notHere);
const baseSeasons = runs(B.base).map(([code, idx]) => ({ code, idx, key: B.base_profit[code], short: false, allS: [] }));
const P3 = profitOf(baseSeasons, salt, view, false).p;
const income = P.p == null ? null : P.p <= 0 ? 1.0 : pyRound(clamp(3 + 2 * Math.log2(P.p / P3), 1, 5), 1);
const exposed = saltIdx.filter(i => cls[i] > 0);
return { scores: { water, income, soil, salt: saltScore, pests }, profit: P.p, missing: P.missing, p3: P3, water_mm: need, needM,
exposed, seasons, notHere, hasU: months.some(c => c[0] === "U"), view, siteId, months: months.slice(), crop };
}
/* calendar editing: rice seasons keep their own code (R1, R2...) so adjacent seasons stay apart; upland and shrimp merge */
function normalize(m) {
const flat = m.map(c => c[0] === "U" ? "U" : c[0] === "S" ? "S" : c);
const n = { R: 0, T: 0, U: 0 }, out = Array(12).fill("-");
for (const [code, idx] of runs(flat)) { const k = code[0]; const c = k in n ? k + (++n[k]) : k === "S" ? "S" : "-"; idx.forEach(i => out[i] = c) }
return out;
}
function ofCard(siteId, view, card, crop) {
const months = normalize(card.months.map(x => x[0] === "R" && B.tolerant_ids.includes(card.id) ? "T" + x.slice(1) : x));
return evaluate(siteId, view, months, card.crop || crop);
}
return { evaluate, ofCard, monthPest, runs, normalize, isRice, pyRound };
})();
if (typeof module !== "undefined") module.exports = Score;  // Node: test_build.py's parity check
