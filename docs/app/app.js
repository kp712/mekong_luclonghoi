/* app.js: Mekong Explorer Draft 4 "Sigma". Draft 3 app logic (drafts/sigma/ref/draft3.html) ported into the dark map shell.
   Same scoring, wording (via t()) and numbers as Draft 3; only DOM targets, markup and class names changed. Illustrated scene code dropped. */
/* field first: the plan steps (3 and 4) need the farmer's own field */
Object.assign(STR.en, { needSizeMax: "That is too big for one field. Enter less than 1,000 ha (1 ha = 10 công).", needFieldB: "Enter my field", needSize: "Please write the size of your field in ha (for example 1,5)", fieldReady: f => `Your field: ${f}` });
Object.assign(STR.vi, { needSizeMax: "Số này quá lớn cho một ruộng. Hãy nhập dưới 1.000 ha (1 ha = 10 công).", needFieldB: "Nhập ruộng của tôi", needSize: "Hãy nhập diện tích ruộng, tính bằng ha (ví dụ 1,5)", fieldReady: f => `Ruộng của bạn: ${f}` });
/* ---- Draft 3 text from later parts, copied verbatim (part 10, 11, 12, 15, 17, app fixes, draft 3, copy note) ---- */
Object.assign(STR.en, {
bn_home: "At home mode is on. Everything moves smoothly again.", bn_wet: "In the field mode is on. Big buttons, just tap.", bn_one: "One hand mode is on. Your controls are at the bottom."
});
Object.assign(STR.vi, {
bn_home: "Đã bật chế độ Ở nhà. Mọi thứ lại chuyển động mượt mà.", bn_wet: "Đã bật chế độ Ngoài ruộng. Nút lớn, chỉ cần chạm.", bn_one: "Đã bật chế độ Một tay. Các nút nằm ở cuối màn hình."
});
Object.assign(STR.en, {
cfTitle: "Is this your area?", cfYes: "Yes, this is my area. Continue", cfNo: "Exit, back to the map",
ppEye: "Your 12-month plan", ppScore: "Plan score", ppOf: "out of 100", ppGrade: "Grade",
ppGradeA: "Very good fit for this area and what matters to you.", ppGradeB: "Good fit. A few months could be better.", ppGradeC: "It works, with clear risks. Try a change.", ppGradeD: "Risky here. Try changing the plan.",
ppKeep: "Keep this plan", ppChange: "Change this plan", ppHint: "Change the months yourself, and the score updates as you go.",
ppRev: "See my plan's score, or change it", ppNoScore: "No score for this area yet.",
ppK: { income: "Income", salt: "Weather & salt", water: "Water", soil: "Soil", pests: "Pests" }, ppLeg: { R: "Rice", T: "Salt-tolerant rice", S: "Shrimp", U: "Upland crop", "-": "Rest" },
plGuideBtn: "How to use this page", gdOf: (a, b) => `Step ${a} of ${b}`, gdNext: "Next", gdBack: "Back", gdDone: "Got it", gdSkip: "Skip",
gd: [["Pick your area", "Tap the area where your field is. The label under each name shows how salty it gets."],
["Choose how to start", "Start from an empty year, or from one of our plans for this area, then change it."],
["Pick what to plant", "Tap a crop button: rice, salt-tolerant rice, shrimp, upland crop, or rest."],
["Fill in the months", "Tap a month to put that crop there. Gold marks months when salty water comes in."],
["See your score", "Your plan gets a score out of 100 and a grade, next to the best plan for this area."],
["Check the warnings", "Warnings name the risky months, for example rice in salty months."],
["Try a better idea", "Tap a suggestion to change your plan in one step. Undo puts it back."]]
});
Object.assign(STR.vi, {
cfTitle: "Đây có phải khu vực của bạn?", cfYes: "Đúng, đây là khu vực của tôi. Tiếp tục", cfNo: "Thoát, quay lại bản đồ",
ppEye: "Kế hoạch 12 tháng của bạn", ppScore: "Điểm kế hoạch", ppOf: "trên 100", ppGrade: "Hạng",
ppGradeA: "Rất hợp với khu vực này và điều bạn quan tâm.", ppGradeB: "Khá hợp. Vài tháng có thể tốt hơn.", ppGradeC: "Làm được, nhưng có rủi ro rõ. Hãy thử thay đổi.", ppGradeD: "Rủi ro ở đây. Hãy thử đổi kế hoạch.",
ppKeep: "Giữ kế hoạch này", ppChange: "Thay đổi kế hoạch này", ppHint: "Tự đổi các tháng, điểm sẽ cập nhật ngay.",
ppRev: "Xem điểm kế hoạch, hoặc thay đổi", ppNoScore: "Chưa có điểm cho khu vực này.",
ppK: { income: "Thu nhập", salt: "Thời tiết & mặn", water: "Nước", soil: "Đất", pests: "Sâu bệnh" }, ppLeg: { R: "Lúa", T: "Lúa chịu mặn", S: "Tôm", U: "Cây màu", "-": "Nghỉ" },
plGuideBtn: "Cách dùng trang này", gdOf: (a, b) => `Bước ${a} / ${b}`, gdNext: "Tiếp", gdBack: "Quay lại", gdDone: "Đã hiểu", gdSkip: "Bỏ qua",
gd: [["Chọn khu vực", "Bấm vào khu vực có ruộng của bạn. Nhãn dưới mỗi tên cho biết mức mặn."],
["Chọn cách bắt đầu", "Bắt đầu từ một năm trống, hoặc từ một kế hoạch của chúng tôi cho khu vực này, rồi sửa lại."],
["Chọn cây trồng", "Bấm một nút: lúa, lúa chịu mặn, tôm, cây màu, hoặc nghỉ."],
["Điền các tháng", "Bấm vào một tháng để đặt cây đó vào. Màu vàng là tháng nước mặn vào."],
["Xem điểm", "Kế hoạch của bạn có điểm trên 100 và một hạng, bên cạnh kế hoạch tốt nhất cho khu vực này."],
["Xem cảnh báo", "Cảnh báo chỉ ra các tháng rủi ro, ví dụ trồng lúa trong tháng mặn."],
["Thử ý tốt hơn", "Bấm một gợi ý để đổi kế hoạch một bước. Nút Hoàn tác sẽ trả lại."]]
});
Object.assign(STR.en, {
st12: "Start", st12s: "Choose your area on the map", st12w: "3 short steps: your area, what matters to you, your plan",
nx1: a => `OK, ${a} is my area. Next`, nx1wait: "Tap your area on the map above first",
nx3: "OK, show my best plans", nx4: "OK, see my 12-month plan", nx5top: "Done. Back to the top", nx5lab: "Change it in the plan lab",
nxL1: "OK, next: how to start", nxL2: "OK, next: fill in the months", nxL3: "OK, see my score"
});
Object.assign(STR.vi, {
st12: "Bắt đầu", st12s: "Chọn khu vực của bạn trên bản đồ", st12w: "3 bước ngắn: khu vực, điều bạn quan tâm, kế hoạch",
nx1: a => `Đồng ý, ${a} là khu vực của tôi. Tiếp`, nx1wait: "Hãy bấm vào khu vực của bạn trên bản đồ trước",
nx3: "Đồng ý, xem phương án hợp nhất", nx4: "Đồng ý, xem kế hoạch 12 tháng", nx5top: "Xong. Về đầu trang", nx5lab: "Sửa trong trang tự lập kế hoạch",
nxL1: "Đồng ý, tiếp: cách bắt đầu", nxL2: "Đồng ý, tiếp: điền các tháng", nxL3: "Đồng ý, xem điểm"
});
Object.assign(STR.en, {
fmWet: "In the field", fmWetD: "Out in the field? Big buttons you just tap. No dragging, so wet or muddy fingers won't slip.",
bn_wet: "In the field mode is on. Big buttons, just tap.", h_fm: "At home, or in the field with big buttons you just tap.",
q15: "Quick choice", q15d: "Tap one, or set each one below.", lvTap: "Tap how much each one matters:"
});
Object.assign(STR.vi, {
fmWet: "Ngoài ruộng", fmWetD: "Đang ở ngoài ruộng? Nút lớn, chỉ cần chạm. Không cần kéo, ngón tay ướt hay dính bùn cũng không trượt.",
bn_wet: "Đã bật chế độ Ngoài ruộng. Nút lớn, chỉ cần chạm.", h_fm: "Ở nhà, hoặc ngoài ruộng với nút lớn chỉ cần chạm.",
q15: "Chọn nhanh", q15d: "Chạm một nút, hoặc chỉnh từng mục bên dưới.", lvTap: "Chạm để chọn mức quan trọng:"
});
Object.assign(STR.en, { howTap: "Tap how much each one matters. The options below re-order straight away, and the best match is shown at the end of this step.", sub3Tap: "Tell us what you grow, your workforce and what matters most. The options below re-rank as you go." });
Object.assign(STR.vi, { howTap: "Chạm để chọn mức quan trọng của từng mục. Các phương án bên dưới xếp lại ngay, và phương án hợp nhất hiện ở cuối bước này.", sub3Tap: "Cho biết bạn trồng gì, sức làm và điều bạn coi trọng. Các phương án bên dưới xếp lại ngay." });
Object.assign(STR.en, { fit4: "Very good", fit3: "Good", fit2: "Fair", fit1: "Poor", ppWA: "Very good fit", ppWB: "Good fit", ppWC: "Fair fit", ppWD: "Risky here" });
Object.assign(STR.vi, { fit4: "Rất hợp", fit3: "Hợp", fit2: "Tạm được", fit1: "Kém", ppWA: "Rất hợp", ppWB: "Hợp", ppWC: "Tạm được", ppWD: "Rủi ro ở đây" });
Object.assign(STR.en, { more15: n => `Show all ${n} options`, less15: "Show only the best 3" });
Object.assign(STR.vi, { more15: n => `Xem cả ${n} phương án`, less15: "Chỉ xem 3 phương án tốt nhất" });
Object.assign(STR.en, { sunL: "Sunlight: stronger contrast", ic15: { R: "Rice", T: "Rice", S: "Shrimp", U: "Upland crop", "-": "Rest" }, ic15salt: "Salt" });
Object.assign(STR.vi, { sunL: "Nắng: tăng độ tương phản", ic15: { R: "Lúa", T: "Lúa", S: "Tôm", U: "Cây màu", "-": "Nghỉ" }, ic15salt: "Mặn" });
Object.assign(STR.en, {
step1hintTap: "Tap an area on the map to see its typical year and open everything about it.",
planAuto: "Shown in the plan for now. Tap to choose it",
curDefault: "Guessed from satellite. Tap to change",
wDefault: "Starting point: all five count the same. Tap a goal or change a level to set your own.",
congNote: "1 công = 1,000 m² = 1/10 ha. Figures per công are the per-ha figures divided by 10."
});
Object.assign(STR.vi, {
step1hintTap: "Chạm vào một khu vực trên bản đồ để xem một năm điển hình và mở mọi thông tin của khu vực đó.",
planAuto: "Kế hoạch đang tạm theo phương án này. Chạm để chọn",
curDefault: "Tạm đoán theo ảnh vệ tinh. Chạm để đổi",
wDefault: "Đang để sẵn: năm mục quan trọng như nhau. Chạm một mục tiêu hoặc đổi mức để chọn theo ý bà con.",
congNote: "1 công = 1.000 m² = 1/10 ha. Số cho mỗi công là số mỗi ha chia 10."
});
Object.assign(STR.en, {
whKey3: "Thin line: least to most rain this month has had in any year (CHIRPS, every year since Dec 2000)",
whKeyEl3: "Thin line: least to most rain this month has had in the El Niño years (CHIRPS)",
whA3: (a, b) => `from ${a} to ${b} mm depending on the year`,
greenTyp3: "(typical year)",
scale3: "Rain is CHIRPS v3.0 (about 5 km, satellite and rain-gauge estimate). Heat days are ERA5-Land (about 10 km) and crop water need is ERA5 (about 25 km), so neighbouring areas can show the same values. Greenness is NASA MODIS (250 m, for each area).",
scale3s: "Crop water need comes from a coarse NASA grid (about 50 km), so nearby areas show the same value.",
ex3Btn: n => `Try an example: ${n}`,
ex3Ban: n => `Showing the ${n} example. Pick your own area on the map.`,
ex3Back: "Back to the map",
lab3: "Arrange your own calendar and see its score"
});
Object.assign(STR.vi, {
whKey3: "Vạch mảnh: tháng đó mưa ít nhất và nhiều nhất trong mọi năm từ tháng 12/2000 (CHIRPS)",
whKeyEl3: "Vạch mảnh: tháng đó mưa ít nhất và nhiều nhất trong các năm El Niño (CHIRPS)",
whA3: (a, b) => `tùy năm từ ${a} đến ${b} mm`,
greenTyp3: "(năm điển hình)",
scale3: "Mưa lấy từ CHIRPS v3.0 (ô khoảng 5 km, ước tính từ vệ tinh và trạm đo mưa). Số ngày nắng nóng lấy từ ERA5-Land (ô khoảng 10 km) và nhu cầu nước của cây từ ERA5 (ô khoảng 25 km), nên các khu vực gần nhau có thể có số giống nhau. Độ xanh của ruộng lấy từ NASA MODIS (250 m, riêng từng khu vực).",
scale3s: "Nhu cầu nước của cây tính theo ô lớn của NASA (khoảng 50 km), nên các khu vực gần nhau có số giống nhau.",
ex3Btn: n => `Xem thử ví dụ: ${n}`,
ex3Ban: n => `Đang xem ví dụ ${n}. Chọn khu vực của bạn trên bản đồ.`,
ex3Back: "Về bản đồ",
lab3: "Tự xếp lịch của bạn và xem điểm"
});
Object.assign(STR.en, { copy4: "© 2026 Mekong Rotation Explorer team · Free to use and share: code MIT, content CC BY 4.0. Questions: github.com/kp712/mekong_luclonghoi/issues" });
Object.assign(STR.vi, { copy4: "© 2026 Nhóm Mekong Rotation Explorer · Được dùng và chia sẻ tự do: mã nguồn MIT, nội dung CC BY 4.0. Hỏi đáp: github.com/kp712/mekong_luclonghoi/issues" });
/* ================= the app (Draft 3 logic, new DOM targets) ================= */
(() => {
"use strict";
const root = document.documentElement;
/* a missing shell element gives a detached dummy, so nothing throws while the shell is partial */
const $ = s => document.querySelector(s) || document.createElement("div");
const $$ = s => [...document.querySelectorAll(s)];
const has = s => !!document.querySelector(s);
const chk = s => !!(document.querySelector(s) || {}).checked;
const load = k => { try { return localStorage.getItem(k) } catch (e) { return null } };
const save = (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} };
const drop = k => { try { localStorage.removeItem(k) } catch (e) {} };
const MV = () => (typeof MapView !== "undefined" ? MapView : window.MapView) || null;
const mv = (fn, ...a) => { const m = MV(); if (m && typeof m[fn] === "function") { try { return m[fn](...a) } catch (e) { console.warn("MapView." + fn, e) } } };
const PL = () => (typeof Lab !== "undefined" ? Lab : null) || window.PlanLab || null;

/* ---------- state (same names and defaults as Draft 3) ---------- */
let lang = load("mre-lang") === "en" ? "en" : "vi", mode = "typical", site = null, cur = "rice3", planId = null, upCrop = null;
const KEYS = ["water", "income", "soil", "salt", "pests"];
const w = { water: 2, income: 2, soil: 2, salt: 2, pests: 2 };
let step = 1, exOn = false, exGo = false, curPicked = false, wPicked = false;
/* the farmer's fields: the shared list in load.js (Farm), without the dashboard's demo field */
const fields = () => Farm.st.fields.filter(f => !f.demo && DATA.sites.some(s => s.id === f.site));
let fieldId = null, editId = null, month = new Date().getMonth(), planText = [];
let pv = load("mre-pv") === "list" ? "list" : "cal";
let fm = "home";   /* one mode only: at home (field mode removed) */

const ymText = ym => { const [y, m] = ym.split("-"); return `${STR[lang].monthsLong[+m - 1]} ${y}` };
window.ymText = ymText;   // strings.js (yearEyebrowLt) calls it
const t = k => STR[lang][k];
const pick = o => o[lang];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const num = x => lang === "vi" ? String(x).replace(".", ",") : String(x);
const coarse = matchMedia("(hover: none)");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const calm = () => still || document.body.classList.contains("calm");
const V = s => mode === "elnino" ? s.el : mode === "latest" && EXTRA.latest[s.id] ? { ...s, rain: EXTRA.latest[s.id].rain, latest: true } : s;   // typical or El Niño view of a site
const shortName = s => { const m = lang === "vi" ? s.name.vi.match(/Khu vực (.+?) cũ/) : s.name.en.match(/Former (.+?) area/); return m ? m[1] : pick(s.name) };
const ranges = ids => { const n = [...new Set(ids.map(i => i + 1))].sort((a, b) => a - b), out = [];
n.forEach(x => { const r = out[out.length - 1]; if (r && x === r[1] + 1) r[1] = x; else out.push([x, x]) });
return out.map(([a, b]) => a === b ? a : b === a + 1 ? `${a},${b}` : `${a}–${b}`).join(",") };
const cite = ids => ids && ids.length ? `<a class="cite" href="#src-${ids[0] + 1}" data-src="${ids[0] + 1}">[${ranges(ids)}]</a>` : "";
const siteById = id => DATA.sites.find(s => s.id === id);

/* line icons (the illustrated Draft 3 sprites are dropped) */
const IC = {
rice: '<path d="M12 21V8"/><path d="M12 8c-2.4-.6-3.6-2.4-3.6-5 2.4.6 3.6 2.4 3.6 5Z"/><path d="M12 8c2.4-.6 3.6-2.4 3.6-5-2.4.6-3.6 2.4-3.6 5Z"/><path d="M12 14c-2.4-.6-3.6-2.4-3.6-5"/><path d="M12 14c2.4-.6 3.6-2.4 3.6-5"/>',
shrimp: '<path d="M4 16c.8-6 5.6-10 11.5-9.2 3.2.4 4 3.4 2 5.2-1.8 1.7-4.6 1-5.8 3.2L9 20"/><path d="M4 16l3 1"/><circle cx="16" cy="9.5" r=".6"/>',
upland: '<path d="M12 21v-8"/><path d="M12 13c-4.2 0-6.2-3-6.2-7 4.2 0 6.2 3 6.2 7Z"/><path d="M12 15c0-4 2-6 6-6 0 4-2 6-6 6Z"/>',
fallow: '<path d="M4 12h3"/><path d="M10.5 12h3"/><path d="M17 12h3"/>',
trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><path d="M6 14h12v7H6z"/>',
share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
listen: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
plus: '<path d="M12 5v14M5 12h14"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', check: '<path d="M5 12l5 5L20 7"/>',
tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
drop: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
sat: '<path d="M4 10l3-3 4 4-3 3zM13 19l3-3-4-4-3 3zM10 10l4 4M15 5a4 4 0 0 1 4 4M14 2a7 7 0 0 1 8 8"/>',
star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
guide: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.6a2.6 2.6 0 0 1 5 .6c0 1.6-2.5 2.1-2.5 3.7"/><path d="M12 17.2v.1"/>',
salt: '<path d="M12 3l3 3-3 3-3-3zM6 10l3 3-3 3-3-3zM18 10l3 3-3 3-3-3z"/>', pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'
};
const ico = (n, s = 16) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IC[n] || ""}</svg>`;
const ICON_SUN = ico("sun", 11), ICON_DROP = ico("drop", 11);
const nasaBadges = () => `<div class="nasa8" role="list" aria-label="${esc(t("nasaL"))}">
<span role="listitem" class="nb sat">${ico("sat", 12)}<b>CHIRPS</b> ${t("nbRain")}</span>
<span role="listitem" class="nb sat">${ico("sat", 12)}<b>ERA5</b> ${t("nbEt")}</span>
<span role="listitem" class="nb sat">${ico("sat", 12)}<b>NASA MODIS</b> ${t("nbNdvi")}</span>
<span role="listitem" class="nb est">${ico("salt", 12)}${t("nbSalt")}</span></div>`;
const runsText = idx => {   // part 8: month runs in words, wrapping Dec -> Jan
const on = new Array(12).fill(false); idx.forEach(i => on[i] = true);
if (on.every(Boolean)) return `${t("monthsLong")[0]}–${t("monthsLong")[11]}`;
let start = on.indexOf(false); const out = [];
for (let k = 1; k <= 12; k++) { const i = (start + k) % 12;
if (on[i] && !on[(i + 11) % 12]) out.push([i, i]); else if (on[i]) out[out.length - 1][1] = i }
return out.map(([a, b]) => a === b ? t("monthsLong")[a] : `${t("monthsLong")[a]}–${t("monthsLong")[b]}`).join(", ");
};

/* ---------- Draft 3 text kept outside STR (nature parts 2, 4, 5), verbatim ---------- */
const TT = {
en: { size: "Text size",
settings: "Settings", lang: "Language", text: "Text size", motion: "Motion", guide: "Guided tour", anim: "Animated", lite: "Lite", theme: "Colours", thLight: "Light", thDark: "Dark", thAuto: "Auto" },
vi: { size: "Cỡ chữ",
settings: "Cài đặt", lang: "Ngôn ngữ", text: "Cỡ chữ", motion: "Chuyển động", theme: "Màu nền", thLight: "Sáng", thDark: "Tối", thAuto: "Tự động", guide: "Hướng dẫn từng bước", anim: "Sinh động", lite: "Nhẹ" }
};
const tt = k => TT[lang][k];

/* ---------- part 15: plain words, merged into STR once ---------- */
const SIMPLE = {
en: {
wRain: (a, b) => a === b ? "All of its rice grows in the rainy months, so rain does most of the watering." : a * 2 >= b ? "Most of its rice grows in the rainy months." : "Most of its rice grows in the dry months, so it needs canal water.",
wWater: (mm, p) => p ? "It uses less canal water than three rice crops a year." : "It needs about as much canal water as rice usually does.",
wCrops: n => (n = parseFloat(String(n).replace(",", "."))) >= 2.5 ? "Fields here usually grow three crops a year." : n >= 1.5 ? "Fields here usually grow two crops a year." : "Fields here usually grow one crop a year.",
crops: n => (n = parseFloat(String(n).replace(",", "."))) >= 2.5 ? "Fields here usually grow three crops a year." : n >= 1.5 ? "Fields here usually grow two crops a year." : "Fields here usually grow one crop a year.",
recSalt: n => `Salty water often comes here in the dry season. If salt has hurt your crops before, raise "Lower weather & salt risk".`
},
vi: {
wRain: (a, b) => a === b ? "Toàn bộ vụ lúa nằm trong các tháng mưa, nên nước mưa tưới gần hết." : a * 2 >= b ? "Phần lớn vụ lúa nằm trong các tháng mưa." : "Phần lớn vụ lúa nằm trong các tháng khô, nên cần nước kênh.",
wWater: (mm, p) => p ? "Dùng ít nước kênh hơn ba vụ lúa mỗi năm." : "Cần lượng nước kênh tương đương trồng lúa.",
wCrops: n => (n = parseFloat(String(n).replace(",", "."))) >= 2.5 ? "Ruộng ở đây thường làm ba vụ mỗi năm." : n >= 1.5 ? "Ruộng ở đây thường làm hai vụ mỗi năm." : "Ruộng ở đây thường làm một vụ mỗi năm.",
crops: n => (n = parseFloat(String(n).replace(",", "."))) >= 2.5 ? "Ruộng ở đây thường làm ba vụ mỗi năm." : n >= 1.5 ? "Ruộng ở đây thường làm hai vụ mỗi năm." : "Ruộng ở đây thường làm một vụ mỗi năm.",
recSalt: n => `Nước mặn thường vào đây trong mùa khô. Nếu mặn từng làm hại cây trồng, hãy tăng mục "Giảm rủi ro thời tiết & mặn".`
}
};
["en", "vi"].forEach(l => Object.assign(STR[l], SIMPLE[l]));
const fitWord = s => t(s >= 4 ? "fit4" : s >= 3 ? "fit3" : s >= 2 ? "fit2" : "fit1");

/* ---------- part 18: Simple view key steps, short (verbatim) ---------- */
const SHORT = {
rice: { seed: ["70–80 kg/ha certified seed", "70–80 kg/ha giống xác nhận"],
fert: ["N 90–100 · P 30–40 · K 30–40 kg/ha; less N in summer–autumn and autumn–winter", "Đạm (N) 90–100 · lân (P2O5) 30–40 · kali (K2O) 30–40 kg/ha; giảm đạm ở vụ hè thu, thu đông"],
steps: [["Level the field; drain it before sowing.", "San phẳng ruộng; rút nước trước khi sạ."],
["Fertilise before sowing, then top-dress 3 times.", "Bón lót trước khi sạ, rồi bón thúc 3 lần."],
["Let the field dry out at least twice while it grows.", "Để ruộng khô ít nhất 2 lần khi lúa phát triển."],
["Drain 1–2 weeks before harvest; dry the paddy within a day.", "Rút nước 1–2 tuần trước gặt; phơi lúa trong 1 ngày."]] },
rice_st: { seed: ["About 70 kg/ha; sow sparsely", "Khoảng 70 kg/ha; sạ thưa"],
steps: [["Finish shrimp by the end of July; wash out the salt with rain.", "Thu hoạch xong tôm chậm nhất cuối tháng 7; dùng nước mưa rửa mặn."],
["Spread lime; sow only when field water salt is below 2‰.", "Rải vôi; chỉ sạ khi độ mặn nước ruộng dưới 2‰ (phần ngàn)."],
["Use salt-tolerant seed such as ST24 or ST25.", "Dùng giống chịu mặn như ST24, ST25."],
["Keep water in the field all season.", "Giữ nước trong ruộng suốt vụ."]] },
mungbean: { seed: ["30 kg/ha", "30 kg/ha"], fert: ["N 46 · P 66 · K 72 kg/ha", "Đạm (N) 46 · lân (P2O5) 66 · kali (K2O) 72 kg/ha"],
steps: [["Raise beds with drains: no standing water.", "Lên liếp có rãnh thoát: không để đọng nước."],
["Sow in rows, 2–3 seeds per hole.", "Gieo theo hàng, 2–3 hạt mỗi lỗ."],
["Top-dress twice, at about 2 and 4 weeks.", "Bón thúc 2 lần, khoảng 2 và 4 tuần sau gieo."],
["Weed at 2 weeks; water once before flowering.", "Làm cỏ lúc 2 tuần; tưới 1 lần trước khi ra hoa."]] },
watermelon: { seed: ["0.5–1 kg/ha", "0,5–1 kg/ha"],
steps: [["Make wide beds with drains; add lime and mulch film.", "Lên liếp rộng có rãnh; rải vôi, phủ màng."],
["Start seed in pots; transplant at 2 leaves.", "Ươm hạt trong bầu; trồng khi có 2 lá thật."],
["Top-dress 3 times; keep one fruit per vine.", "Bón thúc 3 lần; mỗi dây để 1 trái."],
["Water less 1 week before harvest; pick about 4 weeks after pollination.", "Giảm tưới 1 tuần trước thu; hái khoảng 4 tuần sau thụ phấn."]] },
maize: { seed: ["18 kg/ha hybrid seed", "18 kg/ha giống lai"], fert: ["N 160 · P 80 · K 85 kg/ha, plus organic", "Đạm (N) 160 · lân (P2O5) 80 · kali (K2O) 85 kg/ha, thêm phân hữu cơ"],
steps: [["Leave rice straw as mulch; dig drain furrows.", "Để rơm phủ đất; đào rãnh thoát nước."],
["Rows 60–65 cm apart, plants 22–24 cm apart.", "Hàng cách 60–65 cm, cây cách 22–24 cm."],
["Fertilise at planting, then at 5–6 and 10–11 leaves.", "Bón lót khi trồng, rồi bón ở 5–6 lá và 10–11 lá."],
["Never leave the field flooded for more than a day.", "Không để ruộng ngập quá 1 ngày."]] },
shrimp: { seed: ["About 5 young shrimp per m² a year, in 3 batches", "Khoảng 5 con giống/m² mỗi năm, thả 3 đợt"],
fert: ["Quicklime 600–800 kg/ha; no N-P-K", "Vôi nung 600–800 kg/ha; không bón phân NPK"],
steps: [["Dry the platform and clean out the canals.", "Phơi trảng, sên vét mương."],
["Lime, flush the canals, then fill through a net.", "Bón vôi, xả mương, rồi lấy nước qua lưới lọc."],
["Stock around Tết, when the water is clear.", "Thả giống khoảng Tết, khi nước trong."],
["Finish shrimp by the end of July, to wash out salt for the rice.", "Thu hoạch xong tôm chậm nhất cuối tháng 7, để kịp rửa mặn cho lúa."]] }
};

/* ---------- about this app ---------- */
const ABOUT = {
en: [["What it is", "A phone-first tool for rice farmers in coastal Sóc Trăng (Mekong Delta). It compares the farmer's current rotation with local alternatives (rice–shrimp, rice with a dry-season upland crop, salt-tolerant rice with a rest), ranks them by what the farmer cares about, and turns the chosen one into a 12-month plan. English and Vietnamese."],
["Data in the app", "Rain: CHIRPS v3.0 monthly (Climate Hazards Center, UC Santa Barbara; satellite and rain-gauge estimate, ~5 km; averages run from Dec 2000 to the latest whole Dec–Nov season). NASA GPM IMERG is used only to cross-check it. Water demand (ET₀): FAO-56 reference evapotranspiration computed by Open-Meteo from ERA5 (Copernicus / ECMWF). Field greenness and crops per year: NASA MODIS NDVI (MOD13Q1, 250 m) through NASA AppEEARS. Heat days: ERA5-Land daily maximum. The 7-day strip in the month panel reads Open-Meteo's forecast API (past 7 days) live."],
["Other data", "El Niño seasons and forecast: NOAA's Relative Oceanic Niño Index (RONI) and CPC outlook. Topsoil: SoilGrids 2.0 (ISRIC, not NASA). Salt: an estimate from provincial river-station records and public reports. Satellites cannot measure salt in rice fields. The 7-day rain forecast on the dashboard: Open-Meteo (not NASA)."],
["How the scores work", "Each option gets water, income, soil, pests and weather & salt scores from 1.0 to 5.0, computed at each area from the data above and published profit figures. Pests: rice pest pressure follows ERA5 mean temperature (brown planthopper, Horgan et al. 2020), upland crop months count in full, shrimp months rise with hot days, and rest months and other crops break the rice pest cycle. The sliders set the weights; the match is the weighted average. Full formulas are in the project README under \"How the scores are set\"."],
["Limits", "The data describe the area, not one field, and the past, not a forecast. The plan is a starting point to talk over with a local agricultural extension officer."]],
vi: [["Dự án là gì", "Công cụ ưu tiên điện thoại cho nông dân trồng lúa ven biển Sóc Trăng (Đồng bằng sông Cửu Long). Công cụ so sánh cách luân canh hiện tại với các lựa chọn tại chỗ (lúa – tôm, lúa luân canh với cây màu mùa khô, lúa chịu mặn có thời gian nghỉ), xếp hạng theo điều nông dân quan tâm và biến lựa chọn thành kế hoạch 12 tháng. Có tiếng Anh và tiếng Việt."],
["Dữ liệu trong ứng dụng", "Mưa: CHIRPS v3.0 theo tháng (Climate Hazards Center, Đại học California Santa Barbara; ước tính từ vệ tinh và trạm đo mưa, ~5 km; trung bình tính từ tháng 12/2000 đến mùa tháng 12–11 trọn vẹn gần nhất). NASA GPM IMERG chỉ dùng để đối chiếu. Nhu cầu nước (ET₀): phương pháp FAO-56 do Open-Meteo tính từ ERA5 (Copernicus / ECMWF). Độ xanh của ruộng và số vụ mỗi năm: NASA MODIS NDVI (MOD13Q1, 250 m) qua NASA AppEEARS. Số ngày nắng nóng: ERA5-Land. Dải 7 ngày trong phần từng tháng đọc trực tiếp API dự báo của Open-Meteo (7 ngày vừa qua)."],
["Dữ liệu khác", "Các mùa El Niño và dự báo: chỉ số Niño đại dương tương đối (RONI) và bản tin CPC của NOAA. Đất mặt: SoilGrids 2.0 (ISRIC, không phải NASA). Độ mặn: ước tính từ số liệu trạm đo trên sông của tỉnh và báo cáo công khai. Vệ tinh không đo được độ mặn trong ruộng lúa. Dự báo mưa 7 ngày trên trang chính: Open-Meteo (không phải NASA)."],
["Cách tính điểm", "Mỗi lựa chọn có điểm nước, thu nhập, đất, sâu bệnh và thời tiết & mặn từ 1,0 đến 5,0, tính cho từng khu vực từ dữ liệu trên và số liệu lợi nhuận đã công bố. Sâu bệnh: áp lực sâu hại lúa theo nhiệt độ trung bình của ERA5 (rầy nâu, Horgan và cộng sự 2020), tháng trồng màu tính đủ, tháng nuôi tôm tăng theo số ngày nắng nóng, còn tháng nghỉ và cây trồng khác cắt vòng đời sâu hại lúa. Thanh trượt đặt trọng số; mức hợp là trung bình có trọng số. Công thức đầy đủ có trong README của dự án, mục \"How the scores are set\"."],
["Giới hạn", "Dữ liệu mô tả cả khu vực, không phải một thửa ruộng, và mô tả quá khứ, không phải dự báo. Kế hoạch là điểm khởi đầu để trao đổi với cán bộ khuyến nông địa phương."]]
};

/* ---------- small DOM helpers for the shell ---------- */
/* give a shell button a label span with data-t, unless the shell already wrote one */
function label(sel, key, icon) {
$$(sel).forEach(el => { if (el.matches("[data-t]") || el.querySelector("[data-t]")) return; el.innerHTML = (icon ? ico(icon) : "") + `<span data-t="${key}"></span>` });
}
const setTxt = (el, text) => { if (!el) return; const sp = el.querySelector("span:not([aria-hidden])"); (sp || el).textContent = text };
const fillT = (scope = document) => scope.querySelectorAll("[data-t]").forEach(el => { const v = t(el.dataset.t); if (typeof v === "string") el.textContent = v });

/* missing pieces inside an existing view get Draft 3's own markup, so the steps work whatever the shell wrote */
function ensureSkeleton() {
/* the step views come complete in index.html; only "Your field" (step 2) is built here */
if (has("#v2") && !has("#myFields")) $("#v2").insertAdjacentHTML("afterbegin", `<div id="myFields" class="box my-fields"><h3 class="mf-h" id="mfH" data-t="myFieldH"></h3><p class="mf-why" data-t="myFieldWhy"></p>
<ul class="field-list" id="fieldList" aria-labelledby="mfH"></ul><button type="button" class="add-btn" id="addField" aria-expanded="false"></button></div>`);
}

/* the pieces Draft 3 built on top of its base markup (parts 8, 11, 12, 15, app fixes, draft 3) */
function buildExtras() {
/* step 2: what you grow now, quick goals, default note, sliders with tap buttons, limits */
if (has("#growNow")) $("#growNow").classList.add("sz-wrap");
if (has("#sliders") && !has("#howText")) $("#sliders").insertAdjacentHTML("beforebegin", `<p class="how" id="howText"></p>
<div class="goals15" role="group" aria-labelledby="q15T"><p class="q15-h"><b id="q15T" data-t="q15"></b> <span data-t="q15d"></span></p>
<div class="q15-row">${Object.keys(GOALS).map(g => `<button type="button" data-goal15="${g}" aria-pressed="false">${ico(GI[g], 18)}<span data-t="g${g[0].toUpperCase() + g.slice(1)}"></span></button>`).join("")}</div>
<p class="q15-tap" data-t="lvTap"></p></div><p class="def-note" id="wDef"></p>`);
/* example banner and "pick an area first" box on steps 2-4 */
["#v2", "#v3", "#v4"].forEach(id => { if (!has(id) || $(id).querySelector(".pick-first")) return;
$(id).insertAdjacentHTML("afterbegin", `<div class="pick-first"><p class="pf-t" data-t="lockedSub"></p><button type="button" class="go-btn" data-pickarea>${ico("pin")}<span data-t="heroCta"></span></button></div>
<div class="ex3-ban" role="status" hidden><span></span><button type="button" data-ex3back></button></div>`) });
/* step 3: show-all button (Simple) and the way into the builder */
if (has("#cards") && !has("#more15")) $("#cards").insertAdjacentHTML("afterend", `<button type="button" class="more15-btn" id="more15" aria-expanded="false"></button>`);
if (has("#more15") && !has("#lab3")) $("#more15").insertAdjacentHTML("afterend", `<button type="button" class="lab3" id="lab3" data-golab>${ico("tools")}<span data-t="lab3"></span></button>`);
/* step 4: tool labels, plan views, plan score link, per-công note, disclaimer */
label("#printPlan", "printPlan", "print"); label("#sharePlan", "sharePlan", "share");
if (has("#readPlan") && !has("#readL")) $("#readPlan").innerHTML = ico("listen") + `<span id="readL"></span>`;
if (has("#planView") && !$("#planView").querySelector("[data-pv]")) $("#planView").innerHTML = `<button type="button" data-pv="cal"></button><button type="button" data-pv="list"></button>`;
label("#planView [data-pv=cal]", "calView", "cal"); label("#planView [data-pv=list]", "listView", "list");
if (has("#planFor") && !has("#ppRev")) $("#planFor").insertAdjacentHTML("afterend", `<button type="button" class="pp-rev" id="ppRev">${ico("star")}<span data-t="ppRev"></span></button>`);
if (has("#needs") && !has("#congNote")) $("#needs").insertAdjacentHTML("beforebegin", `<p class="cong-note" id="congNote" data-t="congNote"></p>`);
if (has("#v4") && !$("#v4").querySelector(".disclaimer")) $("#v4").insertAdjacentHTML("beforeend", `<p class="disclaimer" data-t="disclaimer"></p><p class="copy4" data-t="copy4"></p>`);
/* step 1 modes, step 2 add-field button, hero picks */
if (has("#modeSeg") && !$("#modeSeg").querySelector("[data-mode]")) $("#modeSeg").innerHTML = `<button type="button" data-mode="typical"></button><button type="button" data-mode="latest"></button><button type="button" data-mode="elnino"></button>`;
label("#modeSeg [data-mode=typical]", "modeTypical"); label("#modeSeg [data-mode=latest]", "modeLatest"); label("#modeSeg [data-mode=elnino]", "modeElnino");
label("#addField", "addField", "plus");
if (has("#heroCta") && !has("#ex3Btn") && siteById(EX_ID)) $("#heroCta").insertAdjacentHTML("afterend", `<button type="button" class="ex3-btn" id="ex3Btn">${ico("arrow")}<span></span></button>`);
[["#heroEyebrow", "heroEyebrow"], ["#heroH", "heroH"], ["#heroP", "heroP"], ["#heroCta", "heroCta"], ["#aboutLink", "aboutLink"]].forEach(([s, k]) => { const el = document.querySelector(s); if (el && !el.matches("[data-t]") && !el.querySelector("[data-t]")) el.dataset.t = k });
/* live regions, as in Draft 3 */
["#year", "#bestNow", "#compare", "#areaMore", "#tkArea"].forEach(s => { const el = document.querySelector(s); if (el && !el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite") });
const dt = document.querySelector("#dTitle"); if (dt && !dt.hasAttribute("tabindex")) dt.setAttribute("tabindex", "-1");
["#dTitle", "#dNext [data-t]", "#dPrev [data-t]", "#readL", "#sourcesH", "#fieldForm h2", "#fieldForm [type=submit]"].forEach(s => $$(s).forEach(el => el.removeAttribute("data-t")));
const hc = document.querySelector("#hoverCard"); if (hc) { hc.style.margin = "0"; hc.classList.remove("show"); hc.innerHTML = "" }
}

/* ---------- the area's year (Draft 3 renderYear) ---------- */
function rainRange3(v) { const c = v && v.climate || {}, lo = c.rain_min_mm, hi = c.rain_max_mm;
return Array.isArray(lo) && Array.isArray(hi) && lo.length === 12 && hi.length === 12 ? [lo, hi] : null }
function renderYear(s) {
const v = V(s), rg3 = rainRange3(v), max = Math.max(...v.rain, ...v.et0, ...(rg3 ? rg3[1] : []));
/* latest 12 months: show the slots in time order (e.g. Oct 2024 .. Sep 2025), not on Jan..Dec */
const L3 = v.latest && EXTRA.latest[s.id], st3 = L3 ? +L3.from.split("-")[1] - 1 : 0, y3 = L3 ? +L3.from.split("-")[0] : 0;
const ord = [...Array(12)].map((_, k) => (st3 + k) % 12), yr3 = k => k < 12 - st3 ? y3 : y3 + 1;
const ML3 = k => t("monthsLong")[ord[k]] + (L3 ? (lang === "vi" ? "/" : " ") + yr3(k) : "");
const wetC = v.rain.map((r, i) => r >= v.et0[i]), wet = ord.map(i => wetC[i]);
const runs = []; wet.forEach((x, i) => { if (i && x === wet[i - 1]) runs[runs.length - 1].to = i; else runs.push({ x, from: i, to: i }) });
const seasons = runs.map(r => `<span class="${r.x ? "wet" : "dry"}" style="grid-column:${r.from + 1}/${r.to + 2}">${r.x ? ICON_DROP : ICON_SUN}${r.to - r.from >= 2 ? (r.x ? t("rainy") : t("dryS")) : ""}</span>`).join("");
const bars = ord.map((m, i) => { const r = v.rain[m], cls = v.salt.includes(m + 1) ? "salt" : wet[i] ? "wet" : "dry";
return `<div class="${cls}" style="height:${Math.max(6, r / max * 100)}%;animation-delay:${i * 30}ms" title="${ML3(i)}: ${r} mm${rg3 ? ` (${rg3[0][m]}–${rg3[1][m]} mm)` : ""}"></div>` }).join("")
+ (rg3 ? `<span class="wh3" aria-hidden="true">${ord.map(m => `<b><i style="bottom:${(rg3[0][m] / max * 100).toFixed(1)}%;height:${(Math.max(0, rg3[1][m] - rg3[0][m]) / max * 100).toFixed(1)}%"></i></b>`).join("")}</span>` : "");
const lines = (v.latest ? `<li><span>${esc(t("ltRain")(v.rain.reduce((a, b) => a + b, 0), s.rain.reduce((a, b) => a + b, 0)))}</span></li>` : "") + v.summary.filter(x => x.salt).map(x => `<li class="s"><span>${esc(pick(x))}</span></li>`).join("") + (v.crops ? `<li>${esc(t("crops")(v.crops))}</li>` : "");
$("#areaFull").innerHTML = (v.latest ? `<li><span>${esc(t("ltRain")(v.rain.reduce((a, b) => a + b, 0), s.rain.reduce((a, b) => a + b, 0)))}${cite(DATA.chart_src)}</span></li>` : "") + v.summary.filter(x => !v.latest || x.salt).map(x => `<li class="${x.salt ? "s" : ""}"><span>${esc(pick(x.full))}${cite(x.src)}</span></li>`).join("");
$("#year").innerHTML = `<div class="eyebrow">${mode === "latest" && EXTRA.latest[s.id] ? t("yearEyebrowLt")(EXTRA.latest[s.id]) : t(mode === "elnino" ? "yearEyebrowEl" : "yearEyebrow")}</div>
<div class="seasons" aria-hidden="true">${seasons}</div>
<div class="bars${rg3 ? " has-wh3" : ""}" role="img" aria-label="${esc(ord.map((m, i) => `${ML3(i)} ${v.rain[m]} mm${rg3 ? ` (${t("whA3")(rg3[0][m], rg3[1][m])})` : ""}`).join(", "))}">${bars}</div>
<div class="mlab${L3 ? " lt3" : ""}">${ord.map((m, i) => `<span${L3 && st3 && i === 12 - st3 ? ' class="ny3"' : ""}>${t("months")[m]}</span>`).join("")}</div>
${L3 ? `<div class="yr3" aria-hidden="true"><span style="grid-column:1/${st3 ? 13 - st3 : 13}">${y3}</span>${st3 ? `<span class="ny3" style="grid-column:${13 - st3}/13">${y3 + 1}</span>` : ""}</div>` : ""}
<div class="ykey"><span><i class="k-wet"></i>${t("wet")}</span><span><i class="k-dry"></i>${t("dry")}</span><span><i class="k-salt"></i>${t("salt")}</span>${rg3 ? `<span class="wk3"><i class="wh3k" aria-hidden="true"></i>${esc(t(mode === "elnino" ? "whKeyEl3" : "whKey3"))}</span>` : ""}</div>
<ul class="ylines">${lines}</ul>`;
}

/* ---------- step 1: the area panel (year, modes, outlook, fresh/salt strip, fit, months, confirm) ---------- */
function areaButtons(cls) { return `<div class="area-list ${cls || ""}" role="group" aria-label="${esc(t("step1"))}">${DATA.sites.map(s => `<button type="button" data-site="${s.id}" aria-pressed="${!!site && site.id === s.id}"><b>${esc(shortName(s))}</b><small>${t("salt")}: ${V(s).salt.length ? esc(runsText(V(s).salt.map(m => m - 1))) : "–"}</small></button>`).join("")}</div>` }
function renderArea() {
const o = DATA.outlook;
if (!site) {
$("#areaHead").innerHTML = `<p class="hint1">${esc(t(coarse.matches ? "step1hintTap" : "step1hint"))}</p>${areaButtons()}`;
$("#year").innerHTML = ""; $("#outlook").innerHTML = ""; $("#areaMore").innerHTML = ""; $("#areaFull").innerHTML = ""; $("#areaFold").hidden = true; $("#modeSeg").hidden = true; typeof D5 !== "undefined" && D5.area(); return }
const v = V(site);
$("#areaFold").hidden = false; $("#modeSeg").hidden = false;
$$("#modeSeg [data-mode]").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === mode));
$("#areaHead").innerHTML = `<span class="rg-badge">${t("chosenArea")}</span>`; $("#areaNasa").innerHTML = nasaBadges();   /* the area name is the drawer title */
renderYear(site);
$("#outlook").innerHTML = (mode === "elnino" ? `<div class="mode-note">${t("modeNote")}</div>` : mode === "latest" ? `<div class="mode-note">${t("modeNoteLt")}</div>` : "")
+ (o.elnino ? `<div class="outlook"><b>${t("forecast")}:</b> ${esc(pick(o.text))}</div>` : "")
+ ((sf) => sf ? `<div class="outlook">${esc(pick(sf))}</div>` : "")(Ahead.salt(site.id));
/* part 8: fresh water and salt, and how the area fits what matters to you */
const ML = t("monthsLong");
const cells = v.rain.map((r, i) => { const c = v.salt.includes(i + 1) ? "salt" : r >= v.et0[i] ? "wet" : "dry";
return `<div class="fs ${c}" title="${ML[i]}: ${t(c === "salt" ? "lgSalt" : c === "wet" ? "lgWet" : "lgDry")}"><i></i><span>${t("months")[i]}</span></div>` }).join("");
const pri = KEYS.map(k => `<span><b>${t("scoreNames")[k]}</b> ${t("levels")[Math.round(w[k])]}</span>`).join("");
const top = ranked().slice(0, 3);
$("#areaMore").innerHTML = `<section class="s8"><h4>${t("shFresh")}</h4>
<div class="fsbar" role="img" aria-label="${esc(v.rain.map((r, i) => `${ML[i]}: ${v.salt.includes(i + 1) ? t("lgSalt") : r >= v.et0[i] ? t("lgWet") : t("lgDry")}`).join(", "))}">${cells}</div>
<div class="fskey"><span><i class="wet"></i>${t("lgWet")}</span><span><i class="dry"></i>${t("lgDry")}</span><span><i class="salt"></i>${t("lgSalt")}</span></div></section>
<section class="s8"><h4>${t("shFit")}</h4><p class="pri"><span class="pri-l">${t("shPri")}</span>${pri}</p>
<ol class="fit8">${top.map(({ c, s }, i) => `<li${c.not_here ? ' class="nothere"' : ""}>${ring(Math.max(0, s), "sm")}
<span class="f8-t"><b>#${i + 1} ${esc(pick(c.name))}</b><small>${esc(pick(c.calendar))}</small></span>
<button type="button" class="go-btn" data-sheetplan="${c.id}">${t("shPlan")}</button></li>`).join("")}</ol>
<button type="button" class="ghost-btn" data-go="2">${t("shChange")}</button></section>
<section class="s8 season" id="season"></section>
<section class="s8 cf"><p class="cf-q">${t("cfTitle")}</p><div class="cf-row"><button type="button" class="ghost-btn" id="cfNo">${t("cfNo")}</button><button type="button" class="go-btn" id="cfYes">${ico("check")}<span>${t("cfYes")}</span></button></div></section>
<div class="src">${t("yearSrc")}${cite(DATA.salt_src)}${mode === "elnino" ? cite(DATA.elnino_src) : mode === "latest" ? cite(DATA.chart_src) : ""}${o.elnino ? cite(o.src) : ""}</div>`;
renderSeason();
typeof D5 !== "undefined" && D5.area();
}

/* ---------- month by month (Draft 3 renderSeason + weather + scale note) ---------- */
const CUR = { rice3: ["rice3"], rice2: ["rice2"], rice_shrimp: ["riceShrimp"], rice_upland: ["riceUpland"] };
/* ---- What you grow, one box per season (rice, shrimp, other crop, rest). The app's plans are whole-year
   rotations, so the boxes are matched to the nearest one (curFrom) and that match is said in words. ---- */
Object.assign(STR.en, {
  riceUpland: "Rice + other crop", seasH: "What do you grow? Tap one for each season",
  seasons: [["Winter–spring", "Nov–Feb"], ["Summer–autumn", "Apr–Jul"], ["Autumn–winter / rainy", "Aug–Oct"]],
  sCrop: { R: "Rice", S: "Shrimp", U: "Other crop", "-": "Nothing / rest" }, sCropS: { R: "Rice", S: "Shrimp", U: "Other", "-": "Rest" },
  sMatch: (n) => `The closest plan in this app: ${n}.`, sMatchOne: "Only one rice crop: the app compares it with 2 rice crops, the closest plan it has.",
  sGuess: "Filled in from satellite. Change any box that is wrong.",
  wfH: "Your workforce", wfSub: "Choose people and machines separately.",
  wfPL: "People who work the field", wfP: ["Few", "Enough", "Many"],
  wfML: "Machines (tractor, harvester, pump)", wfM: ["None", "Can hire", "Own machines"],
  wfFewMach: "Few people but machines: rice can be done by machine; melon and chilli still need picking by hand.",
  wfPen: (p) => p > 0 ? `Other crops (melon, maize, chilli) need much hand work, so their scores drop by ${p.toFixed(1)} point (team estimate).` : "Enough hands for other crops: no score is taken off.",
  fSeasons: "What you grow in each season", setT: "Settings", fcH: "Checking what you entered:", poEye: "Your plan is:", s4H: "Your season path", s4Need: "What to get ready",
  s4Rest: "Rest the field", s4Wait: "Wait for the next season (too late to sow)", s4Late: "sown late, short variety", s4Salt: "Salty water", s4SaltS: "Salt", sCropL: { R: "Rice", S: "Shrimp" }, s4Cost: "Money to put in", s4Profit: "Profit", s4Year: (h) => h ? `for ${h} ha, a year` : "for 1 ha, a year", s4Est: "Estimate from published figures.", poFit: "Fit with your priorities:", poWhy: "Why:", poOther: "Choose another option", poScore: "See the plan score", szHow: ["Each row is one crop season of the year.", "In each row, tap what you grow then.", "Nothing grown that season? Tap “Nothing / rest”."], szQuick: "Quick pick:", szYear: "Your year:", szEx: [["3 rice crops", ["R","R","R"]], ["2 rice crops", ["R","R","-"]], ["1 rice crop", ["R","-","-"]], ["Shrimp, then rice", ["S","S","R"]], ["Rice + other crop", ["R","U","R"]]], savedPlan: "Plan saved as a text file. Send it on Zalo or keep it.", savedPrint: "Plan saved. Open the file: it asks to print or save as PDF."
});
Object.assign(STR.vi, {
  riceUpland: "Lúa + cây màu", seasH: "Bạn đang trồng gì? Chạm chọn cho từng vụ",
  seasons: [["Vụ Đông Xuân", "T11–T2"], ["Vụ Hè Thu", "T4–T7"], ["Vụ Thu Đông / mùa mưa", "T8–T10"]],
  sCrop: { R: "Lúa", S: "Tôm", U: "Cây màu", "-": "Bỏ trống / nghỉ" }, sCropS: { R: "Lúa", S: "Tôm", U: "Màu", "-": "Nghỉ" },
  sMatch: (n) => `Phương án gần nhất trong ứng dụng: ${n}.`, sMatchOne: "Chỉ 1 vụ lúa: ứng dụng so với 2 vụ lúa, phương án gần nhất hiện có.",
  sGuess: "Đã điền sẵn theo ảnh vệ tinh. Ô nào sai thì chạm để đổi.",
  wfH: "Sức làm của nhà bạn", wfSub: "Chọn riêng số người và máy móc.",
  wfPL: "Người làm ruộng", wfP: ["Ít người", "Đủ người", "Nhiều người"],
  wfML: "Máy móc (máy cày, máy gặt, máy bơm)", wfM: ["Không có", "Thuê được", "Có máy"],
  wfFewMach: "Ít người nhưng có máy: lúa làm bằng máy được; dưa, ớt vẫn phải hái tay.",
  wfPen: (p) => p > 0 ? `Cây màu (dưa, bắp, ớt) cần nhiều công tay, nên điểm cây màu bị trừ ${p.toFixed(1).replace(".", ",")} điểm (ước tính của nhóm).` : "Đủ sức làm cây màu: không trừ điểm.",
  fSeasons: "Trồng gì trong từng vụ", setT: "Cài đặt", fcH: "Kiểm tra thông tin bạn nhập:", poEye: "Kế hoạch của bạn là:", s4H: "Đường mùa vụ của bạn", s4Need: "Cần chuẩn bị gì",
  s4Rest: "Cho ruộng nghỉ", s4Wait: "Chờ vụ sau (không kịp sạ)", s4Late: "sạ muộn, giống ngắn ngày", s4Salt: "Nước mặn", s4SaltS: "Mặn", sCropL: { R: "Lúa", S: "Tôm" }, s4Cost: "Vốn cần có", s4Profit: "Tiền lời", s4Year: (h) => h ? `cho ${h} ha, mỗi năm` : "cho 1 ha, mỗi năm", s4Est: "Ước tính từ số liệu đã công bố.", poFit: "Mức hợp với ưu tiên của bạn:", poWhy: "Vì sao:", poOther: "Chọn phương án khác", poScore: "Xem điểm kế hoạch", szHow: ["Mỗi hàng là một vụ trong năm.", "Ở mỗi hàng, chạm vào thứ bạn trồng vụ đó.", "Vụ nào không trồng gì thì chạm “Bỏ trống / nghỉ”."], szQuick: "Chọn nhanh:", szYear: "Năm của bạn:", szEx: [["3 vụ lúa", ["R","R","R"]], ["2 vụ lúa", ["R","R","-"]], ["1 vụ lúa", ["R","-","-"]], ["Tôm rồi lúa", ["S","S","R"]], ["Lúa + cây màu", ["R","U","R"]]], savedPlan: "Đã lưu kế hoạch thành tệp chữ. Gửi qua Zalo hoặc giữ lại.", savedPrint: "Đã lưu kế hoạch. Mở tệp ra: máy sẽ hỏi in hoặc lưu PDF."
});
const SEAS_OPTS = ["R", "S", "U", "-"];
const SEAS_OF = { rice3: ["R", "R", "R"], rice2: ["R", "R", "-"], rice_shrimp: ["S", "S", "R"], rice_upland: ["R", "U", "R"] };
let seasons = SEAS_OF.rice3.slice();
function curFrom(sz) {
  const n = (c) => sz.filter(x => x === c).length;
  if (n("S")) return "rice_shrimp";
  if (n("U") && n("R")) return "rice_upland";
  if (n("R") >= 3) return "rice3";
  return "rice2";
}
const curName = (k) => { const c = site && cardsOf(V(site)).find(x => x.id === k); return c ? pick(c.name) : t((CUR[k] || CUR.rice2)[0]) };
/* workforce: people (0-2) and machines (0-2) chosen apart; too few hands takes points off upland-crop cards */
let wfP = 1, wfM = 0;
try { const o = JSON.parse(load("mre-wf2") || "null"); if (o && o.p >= 0 && o.p <= 2 && o.m >= 0 && o.m <= 2) { wfP = o.p; wfM = o.m } } catch (e) {}
/* team estimate: machines cut field prep and rice harvest, but melon and chilli are still picked by hand */
const PEN = [[0.5, 0.4, 0.3], [0, 0, 0], [0, 0, 0]];
const labourPen = () => PEN[wfP][wfM];
window.labourPen = labourPen;
/* Checks on what the farmer entered: season vs the area's usual salt months (estimate from station reports),
   shrimp vs fresh-water months, and the crop count against what NASA MODIS sees. Each says why it is fine or not. */
const SZ_MONTHS = [[11, 12, 1, 2], [4, 5, 6, 7], [8, 9, 10]];
function seasonChecks(s, sz) {
  if (!s) return [];
  const vi = lang === "vi", S = t("seasons"), salt = (V(s).salt || s.salt || []), out = [], area = shortName(s);
  const mm = (a) => a.map(m => (vi ? "T" : "") + (vi ? m : t("months")[m - 1])).join(", ");
  const sluice = s.level === "low";
  sz.forEach((c, i) => {
    const hit = SZ_MONTHS[i].filter(m => salt.includes(m)), nm = S[i][0];
    if (c === "R" || c === "U") {
      const crop = c === "R" ? (vi ? "lúa" : "rice") : (vi ? "cây màu" : "the other crop");
      if (hit.length) out.push({ ok: false, t: vi ? `${nm}: trùng tháng mặn thường gặp ở ${area} (${mm(hit)}). ${crop[0].toUpperCase() + crop.slice(1)} cần nước dưới 1‰ khi bơm vào${sluice ? "; khu vực có cống nên thường ngọt hơn sông" : ""}. Chỉ trồng khi có nước ngọt dự trữ hoặc cống giữ ngọt.` : `${nm}: falls in ${area}'s usual salt months (${mm(hit)}). ${crop[0].toUpperCase() + crop.slice(1)} needs water under 1‰ when you pump it in${sluice ? "; sluices here keep fields fresher than the river" : ""}. Plant only with stored fresh water or a sluice.` });
      else out.push({ ok: true, t: vi ? `${nm}: không trùng mùa mặn ở ${area}. Tốt cho ${crop}.` : `${nm}: no usual salt months in ${area}. Good for ${crop}.` });
    } else if (c === "S") {
      if (hit.length) out.push({ ok: true, t: vi ? `${nm}: có nước lợ (${mm(hit)}). Tôm sú lớn tốt nhất ở 10–25‰.` : `${nm}: brackish water comes (${mm(hit)}). Tiger shrimp grow best at 10–25‰.` });
      else out.push({ ok: false, t: vi ? `${nm}: thường là nước ngọt ở ${area}. Tôm sú cần 10–25‰ để lớn tốt; vụ này dễ thiếu nước lợ.` : `${nm}: usually fresh water in ${area}. Tiger shrimp need 10–25‰ to grow well; this season may lack brackish water.` });
    }
  });
  const n = sz.filter(c => c === "R" || c === "U").length, seen = s.crops;
  if (typeof seen === "number") {
    const r = Math.round(seen), sv = num(seen.toFixed(1));
    if (n === r) out.push({ ok: true, t: vi ? `Khớp với vệ tinh NASA MODIS: khu vực này thấy khoảng ${sv} vụ/năm.` : `Matches NASA MODIS: about ${sv} crops a year are seen in this area.` });
    else out.push({ ok: null, t: vi ? `Vệ tinh NASA MODIS thấy khoảng ${sv} vụ/năm ở cả khu vực; bạn chọn ${n} vụ cây trồng. Ruộng của bạn có thể khác, nhưng hãy xem lại nếu bấm nhầm.` : `NASA MODIS sees about ${sv} crops a year across the area; you chose ${n}. Your field can differ, but check if you tapped by mistake.` });
  }
  return out;
}
const checksHTML = (xs) => xs.length ? `<ul class="sz-checks">${xs.map(x => `<li class="${x.ok === true ? "ok" : x.ok === false ? "no" : "mid"}"><i aria-hidden="true">${x.ok === true ? "✓" : x.ok === false ? "!" : "?"}</i><span>${esc(x.t)}</span></li>`).join("")}</ul>` : "";
function sizeCheck(ha) {
  const vi = lang === "vi";
  if (!(ha > 0)) return null;
  const cong = num(Math.round(ha * 100) / 10);
  if (ha > 50) return { ok: false, t: vi ? `${num(ha)} ha = ${cong} công: rất lớn cho một thửa ruộng. Xem lại đơn vị: 1 ha = 10 công.` : `${num(ha)} ha = ${cong} công: very large for one field. Check the unit: 1 ha = 10 công.` };
  if (ha < 0.05) return { ok: false, t: vi ? `${num(ha)} ha chưa tới nửa công (500 m²). Nếu bạn tính bằng công, chia cho 10 để ra ha.` : `${num(ha)} ha is under half a công (500 m²). If you counted in công, divide by 10 to get ha.` };
  return { ok: true, t: vi ? `${num(ha)} ha = ${cong} công. Ứng dụng dùng số này để tính nước và lợi nhuận cho ruộng của bạn.` : `${num(ha)} ha = ${cong} công. The app uses it for your field's water and profit.` };
}
const fchk = () => `<details class="fold"${Folds.attrs("checks")}><summary>${esc(t("foldField"))}</summary><div id="fChecks" class="f-checks" aria-live="polite"></div></details>`;
function formChecks() {
  const fa = document.querySelector("#fArea"), fn = document.querySelector("#fName"); if (fa && fn) fn.placeholder = defaultName(fa.value);
  const box = document.querySelector("#fChecks"); if (!box) return;
  const s = siteById((document.querySelector("#fArea") || {}).value), sz = [0, 1, 2].map(i => (document.querySelector("#fS" + i) || {}).value || "R");
  const ha = parseFloat(String((document.querySelector("#fSize") || {}).value || "").replace(",", ".")), sc = sizeCheck(ha);
  box.innerHTML = `<p class="fc-h">${esc(t("fcH"))}</p>` + checksHTML((sc ? [sc] : []).concat(seasonChecks(s, sz)));
  if (box.querySelector(".no")) box.closest("details").open = true;   /* a warning must not hide in a closed fold (this also saves "checks" as open) */
}
function renderSeasons() {
  const g = document.querySelector("#growNow"); if (!g) return;
  const S = t("seasons"), C = t("sCrop"), k = curFrom(seasons);
  const one = seasons.filter(x => x === "R").length === 1 && k === "rice2";
  const MON = [0, 0, -1, 1, 1, 1, 1, 2, 2, 2, 0, 0];   /* month -> season box (T3 is the usual gap) */
  const yr = MON.map((k, m) => { const c = k < 0 ? "-" : seasons[k]; return `<i class="sz-m sz-${c === "-" ? "rest" : c}" title="${esc(t("monthsLong")[m])}"><span>${m + 1}</span></i>` }).join("");
  const exs = t("szEx").map(([n, z]) => `<button type="button" class="sz-ex" data-szex="${z.join("")}" aria-pressed="${z.join("") === seasons.join("")}">${esc(n)}</button>`).join("");
  g.innerHTML = (typeof Dash !== "undefined" && Dash.nowBlock ? Dash.nowBlock() : "") + `<p class="sz-h" id="gnL">${esc(t("seasH"))}</p>
<ol class="sz-how">${t("szHow").map(x => `<li>${esc(x)}</li>`).join("")}</ol>
<div class="sz-quick"><span>${esc(t("szQuick"))}</span><div>${exs}</div></div>` + S.map(([nm, mo], i) => `<fieldset class="sz-box"><legend><b><span class="sz-n">${i + 1}</span>${esc(nm)}</b><span>${esc(mo)}</span></legend>
<div class="sz-opts">${SEAS_OPTS.map(o => `<button type="button" class="sz-o sz-${o === "-" ? "rest" : o}" data-season="${i}" data-sc="${o}" aria-pressed="${seasons[i] === o}" aria-label="${esc(C[o])}" title="${esc(C[o])}"><span class="sz-ic" aria-hidden="true">${ico({ R: "rice", S: "shrimp", U: "upland", "-": "fallow" }[o], 22)}</span><span class="sz-t" aria-hidden="true">${esc(t("sCropS")[o])}</span></button>`).join("")}</div></fieldset>`).join("") +
  `<div class="sz-year" aria-hidden="true"><span>${esc(t("szYear"))}</span><div class="sz-bar">${yr}</div></div><p class="sz-match" role="status">${esc(one ? t("sMatchOne") : t("sMatch")(curName(k)))}${!curPicked ? ` <span class="sz-guess">${esc(t("sGuess"))}</span>` : ""}</p>` +
  `<details class="fold sz-why"${Folds.attrs("checks")}><summary>${esc(t("foldChecks"))}</summary><p class="fc-h">${esc(t("fcH"))}</p>${checksHTML(seasonChecks(site, seasons))}</details>`;
}
function renderWorkforce() {
  const wrap = document.querySelector("#v2 .wf"); if (!wrap) return;
  const row = (k, lab, opts, v) => `<div class="wf-row" role="group" aria-label="${esc(lab)}"><span class="wf-l">${esc(lab)}</span><div class="wf-opts">${opts.map((o, i) => `<button type="button" data-wf="${k}" data-v="${i}" aria-pressed="${i === v}">${esc(o)}</button>`).join("")}</div></div>`;
  wrap.innerHTML = `<p class="wf-h">${esc(t("wfH"))}</p><p class="wf-sub">${esc(t("wfSub"))}</p>` + row("p", t("wfPL"), t("wfP"), wfP) + row("m", t("wfML"), t("wfM"), wfM) +
    (wfP === 0 && wfM > 0 ? `<p class="wf-note">${esc(t("wfFewMach"))}</p>` : "") + `<p class="wf-pen" aria-live="polite">${esc(t("wfPen")(labourPen()))}</p>`;
}

const harvestOf = (s, curId, m) => { const c = cardsOf(V(s)).find(x => x.id === curId); if (!c) return false; const k = c.months[m], n = c.months[(m + 1) % 12]; return !!k && k[0] === "R" && n !== k };
function monthChip(s, curId, m) {
const v = V(s), wet = v.rain[m] >= v.et0[m], salt = v.salt.includes(m + 1), hv = harvestOf(s, curId, m);
return `<span class="f-alert ${salt ? "salt" : wet ? "wet" : "dry"}">${t("monthsLong")[m]}: ${salt ? t("sSalt") : t(wet ? "sRainy" : "sDry")}${hv ? " · " + t("sHarvest") : ""}</span>` }
function renderSeason() {
const box = document.querySelector("#season"), s = site; if (!box) return;
if (!s) { box.innerHTML = `<h4>${t("seasonH0")}</h4><p class="s-empty">${t("seasonPick")}</p>`; return }
const v = V(s), r = v.rain[month], e = v.et0[month], wet = r >= e, salt = v.salt.includes(month + 1), g = v.ndvi ? v.ndvi[month] : null, hv = harvestOf(s, cur, month);
box.innerHTML = `<h4>${t("seasonH")(esc(pick(s.name)))}</h4>
<div class="months" role="group" aria-label="${t("monthPick")}">${t("months").map((m, i) => {
const sw = v.rain[i] >= v.et0[i], ss = v.salt.includes(i + 1);
return `<button type="button" data-month="${i}" aria-pressed="${i === month}" aria-label="${t("monthsLong")[i]}" class="${sw ? "w" : "d"}${ss ? " s" : ""}"><span>${m}</span><i style="height:${Math.max(10, Math.min(100, v.rain[i] / 3.5)).toFixed(0)}%"></i></button>` }).join("")}</div>
<div class="s-now"><b>${t("monthsLong")[month]}</b><span class="s-chip ${wet ? "wet" : "dry"}">${wet ? ICON_DROP : ICON_SUN} ${t(wet ? "sRainy" : "sDry")}</span>${salt ? `<span class="s-chip salt">${t("sSalt")}</span>` : ""}${hv ? `<span class="s-chip hv">${t("sHarvest")}</span>` : ""}</div>
<ul class="s-facts"><li>${t(wet ? "sWetP" : "sDryP")}</li>${salt ? `<li>${t("sSaltNote")}</li>` : ""}</ul>
<p class="scale3">${esc(t("scale3s"))}</p>
<details class="fold"${Folds.attrs("month")}><summary>${t("foldMonth")}</summary><ul class="s-facts"><li>${t("sRain")(r, e)}</li>${g != null ? `<li>${t("sGreen")(num(g))}</li>` : ""}</ul>
${v.ndvi ? `<div class="green" aria-hidden="true">${v.ndvi.map((x, i) => `<i style="opacity:${Math.max(.15, Math.min(1, (x - .2) / .5)).toFixed(2)}" title="NDVI ${x}"></i>`).join("")}</div><div class="glab">${t("green")}${cite(DATA.chart_src)}</div>` : ""}
<p class="s-src">${t(mode === "elnino" ? "modeElnino" : "modeTypical")} · ${t("srcWord")}${cite(DATA.chart_src)}${salt ? cite(DATA.salt_src) : ""}</p>
<div class="wk" id="wk"></div></details>
${fieldId ? "" : `<button type="button" class="ghost-btn" id="saveArea">${ico("plus")}<span>${t("saveArea")}</span></button>`}`;
loadWeather(s);
}
/* weather this week: Open-Meteo forecast API (its past 7 days), near real time */
const wkCache = {};
function loadWeather(s) {
if (!has("#wk")) return;
const paint = d => {
const el = document.querySelector("#wk"); if (!el || site !== s) return;
if (!d) { el.innerHTML = `<h4>${t("wkH")}</h4><p class="wk-off">${t("wkOff")}</p>`; return }
if (d === "load") { el.innerHTML = `<h4>${t("wkH")}</h4><p class="wk-off">${t("wkLoad")}</p>`; return }
const max = Math.max(10, ...d.map(x => x.rain));
el.innerHTML = `<h4>${t("wkH")}</h4><div class="wk-days">${d.map(x => `<div class="wk-day"><span class="wk-bar"><i style="height:${Math.max(4, x.rain / max * 100).toFixed(0)}%"></i></span>
<b>${num(x.rain.toFixed(1))}</b><small>${x.hot == null ? "–" : num(x.hot.toFixed(0)) + "°"}</small><span class="wk-d">${x.d.getDate()}/${x.d.getMonth() + 1}</span></div>`).join("")}</div>
<p class="wk-key"><i></i>${t("wkRain")} · ${t("wkHot")}</p><p class="s-src">${t("wkSrc")}</p>`;
};
if (s.id in wkCache) return paint(wkCache[s.id]);
paint("load");
const url = `https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&daily=precipitation_sum,temperature_2m_max&past_days=7&forecast_days=0&timezone=Asia%2FBangkok`;
const ac = typeof AbortController === "function" ? new AbortController() : null; if (ac) setTimeout(() => ac.abort(), 9000);
fetch(url, ac ? { signal: ac.signal } : {}).then(r => r.ok ? r.json() : Promise.reject()).then(j => {
const t0 = j.daily.time, rain = j.daily.precipitation_sum, hot = j.daily.temperature_2m_max;
const days = t0.map((k, i) => ({ d: new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)), rain: rain[i], hot: hot[i] })).filter(x => x.rain != null).slice(-7);
wkCache[s.id] = days.length ? days : null; paint(wkCache[s.id]);
}).catch(() => { wkCache[s.id] = null; paint(null) });
}

/* ---------- hover readout on the map (compact year box) ---------- */
function renderHover(s) {
const v = V(s), max = Math.max(...v.rain, ...v.et0), ML = t("monthsLong");
const bars = v.rain.map((r, i) => { const cls = v.salt.includes(i + 1) ? "salt" : r >= v.et0[i] ? "wet" : "dry";
return `<span class="hb ${cls}"><i class="r" style="height:${Math.max(4, r / max * 100).toFixed(1)}%"></i><i class="e" style="bottom:${(v.et0[i] / max * 100).toFixed(1)}%"></i></span>` }).join("");
const salt = v.salt.length ? runsText(v.salt.map(m => m - 1)) : "–";
return `<div class="hc-ey">${esc(mode === "latest" && EXTRA.latest[s.id] ? t("modeLatest") : t(mode === "elnino" ? "modeElnino" : "modeTypical"))}</div>
<b class="hc-name">${esc(pick(s.name))}</b>
<div class="hc-bars" role="img" aria-label="${esc(v.rain.map((r, i) => `${ML[i]} ${r} mm`).join(", "))}">${bars}</div>
<div class="hc-m" aria-hidden="true">${t("months").map(m => `<span>${m}</span>`).join("")}</div>
${v.ndvi ? `<div class="hc-green" aria-hidden="true">${v.ndvi.map(g => `<i style="opacity:${Math.max(.15, Math.min(1, (g - .2) / .5)).toFixed(2)}"></i>`).join("")}</div><div class="hc-gl">${t("green")}</div>` : ""}
<p class="hc-salt"><span class="k-salt"></span>${t("salt")}: <b>${esc(salt)}</b></p>
<p class="hc-key"><span><i class="k-wet"></i>${t("wet")}</span><span><i class="k-dry"></i>${t("dry")}</span><span><i class="k-e"></i>ET₀ ERA5</span></p>
<small class="hc-tip">${t(site && site.id === s.id ? "tipReopen" : "tipOpen")}</small>`;
}
function onHover(id, point) {
const hc = document.querySelector("#hoverCard"); if (!hc) return;
const s = id && siteById(id);
if (!s) { hc.classList.remove("show"); hc.setAttribute("aria-hidden", "true"); return }
hc.innerHTML = renderHover(s); hc.classList.add("show"); hc.removeAttribute("aria-hidden"); hc.hidden = false;
const p = point || { x: innerWidth / 2, y: innerHeight / 2 }, bw = hc.offsetWidth || 260, bh = hc.offsetHeight || 200;
let x = p.x + 18, y = p.y - bh / 2;
if (x + bw > innerWidth - 10) x = p.x - bw - 18;
x = Math.max(10, Math.min(innerWidth - bw - 10, x)); y = Math.max(10, Math.min(innerHeight - bh - 10, y));
hc.style.left = x + "px"; hc.style.top = y + "px";
}
function onSelect(id) { const s = id && siteById(id); if (!s) return; onHover(null); choose(s) }

/* ---------- choosing an area (Draft 3 choose, with the parts that wrapped it) ---------- */
function choose(s, quiet) {
if (fieldId && (fields().find(f => f.id === fieldId) || {}).site !== s.id) fieldId = null;
if (!exGo) exOn = false;
if (trySite !== s.id) trySite = null;
curPicked = false;
site = s; planId = null; upCrop = null;
cur = s.crops && s.crops < 2.5 ? "rice2" : "rice3"; seasons = SEAS_OF[cur].slice();
document.body.classList.add("has-site");
mv("select", s.id);
renderAll();
if (!quiet) { mv("focus", s.id); openPanel(innerWidth > 760 && document.body.classList.contains("has-side") ? 2 : 1) }
}
function openField(id, quiet) {
const f = fields().find(x => x.id === id); if (!f) return;
fieldId = id; save("mre-last", id);
choose(siteById(f.site), quiet);
fieldId = id; seasons = (f.seasons || SEAS_OF[f.cur] || SEAS_OF.rice3).slice(); cur = curFrom(seasons); planId = null; curPicked = true; renderAll();
}
function restoreField() { const id = load("mre-last"); if (id && fields().some(f => f.id === id)) openField(id, true) }

/* ---------- step 2: priorities (sliders, tap levels, quick goals, limits) ---------- */
const GOALS = { salt: { salt: 3, water: 2, income: 1, soil: 1, pests: 1 }, profit: { income: 3, salt: 1, water: 1, soil: 1, pests: 1 }, water: { water: 3, salt: 2, income: 1, soil: 1, pests: 1 } };
const GI = { salt: "salt", profit: "star", water: "drop" };
function initSliders() {
if (!has("#sliders")) return;
$("#sliders").innerHTML = KEYS.map(k => `<div class="sl" id="sl_${k}">
<div class="sl-top"><label for="w_${k}" data-t="w_${k}"></label><span class="lvl" id="lv_${k}"></span></div>
<p class="sl-why" data-t="why_${k}"></p>
<div class="track" style="--p:${w[k] / 3 * 100}%"><input type="range" id="w_${k}" min="0" max="3" step="0.01" value="${w[k]}"><span class="ticks" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>
<div class="tapset" role="group" aria-labelledby="lv_${k}">
<button type="button" class="tp-pm" data-tk="${k}" data-d="-1" aria-label="−">−</button>
${[0, 1, 2, 3].map(i => `<button type="button" class="tp-lv" data-tk="${k}" data-v="${i}"></button>`).join("")}
<button type="button" class="tp-pm" data-tk="${k}" data-d="1" aria-label="+">+</button></div></div>`).join("");
KEYS.forEach(k => {
const inp = $("#w_" + k), track = inp.parentElement;
const set = v => { w[k] = v; track.style.setProperty("--p", v / 3 * 100 + "%"); const l = Math.round(v); $("#lv_" + k).textContent = t("levels")[l]; $("#lv_" + k).dataset.l = l };
inp.addEventListener("input", () => { set(+inp.value); queueCards() });
const snap = () => { const r = Math.round(+inp.value); inp.value = r; set(r); queueCards(); syncTaps() };
inp.addEventListener("change", snap); inp.addEventListener("pointerup", snap);
set(w[k]);
});
syncTaps();
}
let q = 0;
function queueCards() { if (q) return; q = requestAnimationFrame(() => { q = 0; renderCards(false); if (step === 1) renderArea() }) }
const setW = (k, v) => { v = Math.max(0, Math.min(3, v)); const inp = document.querySelector("#w_" + k); if (!inp) { w[k] = v; return } inp.value = v;
inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true })); syncTaps() };
function syncTaps() {
KEYS.forEach(k => { const l = Math.round(w[k]);
$$(`[data-tk="${k}"][data-v]`).forEach(b => { b.setAttribute("aria-pressed", +b.dataset.v === l); b.textContent = t("levels")[+b.dataset.v] });
$$(`.tapset [data-tk="${k}"][data-d]`).forEach(b => b.disabled = (+b.dataset.d < 0 && l === 0) || (+b.dataset.d > 0 && l === 3)) });
}
function priTexts() {
const f = fm === "wet";
const how = document.querySelector("#howText"); if (how) how.textContent = t(f ? "howTap" : "howSliders");
KEYS.forEach(k => { const l = Math.round(w[k]), el = document.querySelector("#lv_" + k); if (el) el.textContent = t("levels")[l] });
renderSeasons(); renderWorkforce();
const n = document.querySelector("#wDef"); if (n) { n.hidden = wPicked; n.textContent = t("wDefault") }
syncTaps();
}

/* ---------- step 3: cards (same scoring and ranking as docs/app.js) ---------- */
const cardsOf = v => v.cards.map(c => {
if (!c.variants) return c;
const choices = Object.keys(c.variants);
const x = c.variants[choices.includes(upCrop) ? upCrop : c.crop_default] || c.variants[choices[0]];
return { ...x, id: c.id, choices };
});
function scoreOf(card) {
const ks = KEYS.filter(k => card.scores[k] != null), total = ks.reduce((a, k) => a + w[k], 0);
const avg = total ? ks.reduce((a, k) => a + w[k] * card.scores[k], 0) / total : ks.reduce((a, k) => a + card.scores[k], 0) / ks.length;
return avg - (card.upland ? labourPen() : 0);
}
function ranked() {
if (!site) return [];
let cs = cardsOf(V(site)).filter(c => c.kind === "alt" || c.id === cur || cur === "rice_shrimp");
if (chk("#noBrackish")) cs = cs.filter(c => !c.needs_brackish || c.id === cur);
return cs.map(c => ({ c, s: scoreOf(c) })).sort((a, b) => (a.c.not_here - b.c.not_here) || (b.s - a.s));
}
const dots = v => `<span class="dots">${num(v.toFixed(1))} ${[1, 2, 3, 4, 5].map(i => `<i class="${v >= i - .5 ? "on" : ""}"></i>`).join("")}</span>`;
/* score ring: the plain fit word and x/5 (part 15) */
const ring = (s, cls = "") => `<span class="ring ${cls}" style="--s:${(Math.max(0, s) / 5).toFixed(3)}"><b>${num(s.toFixed(1))}</b><small>${t("of5")}</small><em class="rw15">${esc(fitWord(s))} <span class="rw15n">${num(s.toFixed(1))}/5</span></em></span>`;
const waterOf = c => { const W = (EXTRA.water || {})[site.id] || {}; return W[c.id + ":" + c.crop] || W[c.id] || null };
function whyLines(c) {   // part 8
const v = mode === "latest" ? site : V(site), out = [];
const salt = v.salt.map(m => m - 1);
if (salt.length) {
out.push(t("wSalt")(runsText(salt)));
const by = { S: [], "-": [], R: [], U: [] };
salt.forEach(i => { const k = (c.months[i] || "-")[0]; (by[k] || by["-"]).push(i) });
if (by.S.length) out.push(t("wS")(runsText(by.S)));
if (by["-"].length) out.push(t("wRest")(runsText(by["-"])));
if (by.R.length) out.push(t("wR")(runsText(by.R)));
if (by.U.length) out.push(t("wU")(runsText(by.U)));
} else out.push(t("wNoSalt"));
const rice = c.months.map((m, i) => m[0] === "R" ? i : -1).filter(i => i >= 0);
if (rice.length) out.push(t("wRain")(rice.filter(i => v.rain[i] >= v.et0[i]).length, rice.length));
const wt = waterOf(c); if (wt) out.push(t("wWater")(wt[0].toLocaleString(lang === "vi" ? "vi-VN" : "en-US"), Math.round(wt[1] * 100)));
if (site.crops) out.push(t("wCrops")(num(site.crops)));
return out;
}
function fieldLine(c) {
const wt = waterOf(c); if (!wt) return "";
const f = fieldId ? fields().find(x => x.id === fieldId && x.site === site.id) : null;
const fmt = x => Math.round(x / 10) * 10 >= 1000 ? (Math.round(x / 100) * 100).toLocaleString(lang === "vi" ? "vi-VN" : "en-US") : String(Math.round(x));
const dh = f && f.size ? +f.size : parseFloat(load("mre-ha") || "");  /* draft5: the size typed above the cards counts too */
return dh > 0 ? t("fieldHa")(num(dh), fmt(wt[0] * 10 * dh)) : t("fieldPer")(fmt(wt[0] * 10));
}
/* each other card against what the farmer grows now: profit and cost for their hectares, and salt months with a crop that salt hurts */
function vsNow(c, list) {
const now = (list.find(x => x.c.id === cur) || {}).c;
if (!now || c.id === cur || typeof Cost === "undefined") return "";
const ha = Cost.ha(), k = ha || 1, a = Cost.calc(c), b = Cost.calc(now);
const amt = d => `${d > 0 ? "+" : "−"}${Cost.money(Math.abs(d))}${ha ? "" : "/ha"}`;
// under 10% of the current figure is within the spread of the published figures: say "about the same"
const diff = (x, y, key) => x == null || y == null ? t(key + "None") : Math.abs(x - y) < .1 * Math.abs(y) || !Math.round((x - y) * k) ? t(key + "Same") : t(key)(amt(Math.round((x - y) * k)));
const salt = V(site).salt, hurt = m => salt.filter(i => /[RU]/.test((m.months[i - 1] || "-")[0])).length, ds = hurt(now) - hurt(c);
const parts = [diff(a.profit, b.profit, "vsProfit"), diff(a.partial ? null : a.cost, b.partial ? null : b.cost, "vsCost")];
if (salt.length) parts.push(ds ? t(ds > 0 ? "vsSaltLess" : "vsSaltMore")(num(Math.abs(ds))) : t("vsSaltSame"));
const head = esc(t("vsH")(pick(now.name), !curPicked));
return `<p class="vs-now">${curPicked ? `<b>${head}</b>` : `<button type="button" class="vs-ask" data-go="2">${head}</button>`} ${esc(parts.join(" · "))} <small>${esc(t("vsSrc"))}</small></p>`;
}
/* part 17: the 12 months as numbered tiles, coloured by crop (both views).
   water (Advanced only): one "wet" / "dry" per month, drawn as a thin bar under that month's tile */
function strip15(months, water) {
const salt = V(site).salt, MS = t("months"), used = [...new Set(months.map(m => m[0] === "T" ? "R" : m[0]))];
return `<div class="ic15${water ? " has-w" : ""}" role="img" aria-label="${esc(months.map((m, i) => `${t("monthsLong")[i]}: ${t("ic15")[m[0]] || ""}${salt.includes(i + 1) ? ", " + t("ic15salt") : ""}${water ? ", " + t(water[i] === "wet" ? "kWet" : "kDry") : ""}`).join("; "))}">
${months.map((m, i) => `<div class="ic15-m k-${m[0] === "-" ? "F" : m[0] === "T" ? "R" : m[0]}${salt.includes(i + 1) ? " salt" : ""}"><span>${MS[i]}</span><i></i>${water ? `<b class="w-${water[i]}"></b>` : ""}</div>`).join("")}</div>
<div class="ic15-key" aria-hidden="true">${used.map(k => `<span><i class="k-${k === "-" ? "F" : k}"></i>${esc(t("ic15")[k] || "")}</span>`).join("")}${salt.length ? `<span><i class="ic15-s"></i>${esc(t("ic15salt"))}</span>` : ""}${water ? `<span class="sep"></span><span><i class="w-wet"></i>${t("kWet")}</span><span><i class="w-dry"></i>${t("kDry")}</span>` : ""}</div>`;
}
const prevScore = {}; let lastBest = null, speaking = null;
function countUp(el, a, b, d = 420) {
const t0 = performance.now();
const stepF = now => { const k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = num((a + (b - a) * e).toFixed(1)); if (k < 1) requestAnimationFrame(stepF) };
requestAnimationFrame(stepF);
}
function renderCards(fresh) {
if (!site) { $("#cards").innerHTML = ""; $("#common").hidden = true; $("#bestNow").innerHTML = ""; return }
const v = V(site), vw = mode === "latest" ? site : v;
const cards = ranked();
if (!cards.length) return;
const plan = (cards.find(x => x.c.id === planId) || cards[0]).c;
const all = ({ c }) => c.risks.concat(c.gaps).map(pick);
const common = cards.length > 1 ? all(cards[0]).filter(x => cards.every(k => all(k).includes(x))) : [];
$("#common").hidden = !common.length; $("#common").textContent = common.length ? `${t("allOptions")} ${common.join(" ")}` : "";
const before = {};
if (!fresh && !calm()) $$("#cards .card").forEach(el => before[el.dataset.id] = el.getBoundingClientRect());
const li = xs => xs.map(x => `<li>${esc(pick(x))}${cite(x.src)}</li>`).join("");
const labour = labourPen() > 0;
$("#cards").innerHTML = cards.map(({ c, s }, i) => {
const pickCrop = c.choices && c.choices.length > 1 ? `<div class="crop-pick" role="group" aria-label="${t("cropPick")}"><span>${t("cropPick")}</span>${c.choices.map(x => `<button type="button" data-crop="${x}" aria-pressed="${x === c.crop}">${esc(pick(DATA.resources[x].name))}</button>`).join("")}</div>` : "";
const risks = c.risks.concat(c.gaps).filter(x => !common.includes(pick(x)));
const fl = fieldLine(c), sc = Math.max(0, s);
const before = c.id === plan.id && risks.length;   // the plan card's risks and gaps show on its face, before its plan button
return `<article data-plan="${c.id}" class="card ${i === 0 && !c.not_here ? "best" : ""} ${c.id === plan.id ? "isplan" : ""} ${c.id === cur ? "isnow" : ""} ${c.not_here ? "nothere" : ""}" data-id="${c.id}">
<div class="c-top">${i === 0 && !c.not_here ? `<span class="ribbon">${t("best")}</span>` : ""}<span class="c-tags">${c.id === cur ? `<span class="tag now">${t("yourNow")}</span>` : ""}${c.not_here ? `<span class="tag warn">${t("notHere")}</span>` : ""}</span></div>
<h3>${esc(pick(c.name))}</h3>
${vsNow(c, cards)}
${strip15(c.months, null)}
${pickCrop}
<div class="match">${ring(sc)}<div class="match-txt"><span>${t("match")}</span></div></div>
<span class="conf">${t("confidence")}: ${t(c.confidence)}</span>
${labour && c.upland ? `<span class="tag warn">${t("labourWarn")}</span>` : ""}
<details class="why8"><summary>${t("why8")}</summary><ul>${whyLines(c).map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>
<details class="fold"${Folds.attrs("card")}><summary>${t("foldCard")}</summary>
<ul class="subs">${KEYS.map(x => `<li><span>${t("scoreNames")[x]}</span>${c.scores[x] == null ? `<span class="dots">${t("noScore")}</span>` : dots(c.scores[x])}</li>`).join("")}</ul>
${strip15(c.months, vw.rain.map((r, j) => r >= vw.et0[j] ? "wet" : "dry"))}
${fl ? `<p class="field8">${ico("drop", 14)} <span>${esc(fl)}</span></p>` : ""}
<b>${t("why")}</b><ul>${c.id === cur ? `<li>${t("isNow")}</li>` : ""}${li(c.why)}</ul>
<b>${t("benefits")}</b><ul>${li(c.benefits)}</ul>${risks.length ? `<b>${t("risks")}</b><ul>${li(risks)}</ul>` : ""}
<p class="c-src">${t("cardSrc")}${cite(c.src)}</p></details>
${before ? `<div class="before8"><b>${t("beforeChoose")}</b><ul>${li(risks)}</ul></div>` : ""}
<div class="c-actions"><button type="button" class="plan-btn" data-plan="${c.id}" aria-pressed="${c.id === plan.id && planId === plan.id}">${t(c.id === plan.id ? (planId === plan.id ? "planOn" : "planAuto") : "planBtn")}</button>
<button type="button" class="listen-btn" data-listen="${c.id}" aria-pressed="${speaking === c.id}">${ico("listen")}<span>${t(speaking === c.id ? "listenStop" : "listen")}</span></button></div>
</article>`;
}).join("");
/* moving cards glide to their new place; numbers tick (At home mode only) */
$$("#cards .card").forEach(el => {
const id = el.dataset.id, b = before[id], bx = el.querySelector(".ring b");
const target = bx ? parseFloat(bx.textContent.replace(",", ".")) : null, from = prevScore[id];
if (bx && fm === "home" && !calm() && from != null && Math.abs(from - target) >= .1) countUp(bx, from, target);
prevScore[id] = target;
if (!b) return; const a = el.getBoundingClientRect(); if (!a.width) return;
el.style.transition = "none"; el.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px)`;
requestAnimationFrame(() => { el.style.transition = ""; el.style.transform = "" });
});
if (!fresh && !calm()) { const c = $("#cards"); c.classList.remove("shimmer10"); void c.offsetWidth; c.classList.add("shimmer10") }
renderBest(cards);
renderPlan(plan);
/* part 15: show-all button and the label of which view is on */
const n = cards.length, open = document.body.classList.contains("more15"), b = document.querySelector("#more15");
if (b) { b.hidden = n <= 3; b.textContent = open ? t("less15") : t("more15")(n); b.setAttribute("aria-expanded", open) }
priTexts();
}
/* the best match now, in plain words */
function renderBest(list) {
const el = document.querySelector("#bestNow"); if (!el) return;
if (!site || !list.length) { el.innerHTML = ""; return }
const top = list.find(x => !x.c.not_here) || list[0], c = top.c;
const ks = KEYS.filter(k => c.scores[k] != null).sort((a, b) => (w[b] * c.scores[b] - w[a] * c.scores[a]) || (c.scores[b] - c.scores[a])).slice(0, 2);
const why = ks.map(k => `<b>${t("scoreNames")[k]}</b>`).join(` ${t("and")} `);
const n = V(site).salt.length, rec = [];
if (n >= 4 && w.salt < 2) rec.push(t("recSalt")(n));
if (c.id !== cur) rec.push(t("recTalk"));
el.innerHTML = `<div class="bn-head">${ring(Math.max(0, top.s), "lg")}
<div><span class="bn-badge">${t("bestNow")}</span><h3>${esc(pick(c.name))}</h3>${strip15(c.months)}</div></div>
<p class="bn-why">${t("bestWhy")(why)}</p>${rec.length ? `<ul class="bn-rec">${rec.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
<div class="bn-act"><button type="button" class="go-btn" data-best="${c.id}">${t("planBtn")}</button><button type="button" class="ghost-btn" data-go="3">${t("seeAll")}</button></div>`;
const bx = el.querySelector(".ring b"), v = Math.max(0, top.s);
if (bx && !calm() && lastBest != null && Math.abs(v - lastBest) >= .1) countUp(bx, lastBest, v, 520);
lastBest = v;
}
/* ---------- step 4: the 12-month plan (same month logic as docs/app.js) ---------- */
function renderPlan(c0) {
const now = new Date(), m0 = now.getMonth();
/* the plan starts this month, from the crop in the field now (asked in step 2; season.js) */
const c = typeof Season !== "undefined" ? Season.windowOf(c0, typeof Dash !== "undefined" && Dash.flowNow ? Dash.flowNow() : null, now) : c0;
const isWait = r => !!(c.cells && c.cells[r.from] && c.cells[r.from].src === "wait"), isLate = r => !!(c.cells && c.cells[r.from] && c.cells[r.from].late);
const lab = i => { const d = new Date(now.getFullYear(), m0 + i); return lang === "vi" ? `T${d.getMonth() + 1}/${d.getFullYear()}` : d.toLocaleString("en", { month: "short", year: "numeric" }) };
const span = (a, b) => a === b ? lab(a) : `${lab(a)} – ${lab(b)}`;
const code = i => c.cells ? (i < 0 ? c.before : i > 11 ? c.after : c.cells[i].code) : c.months[((m0 + i) % 12 + 12) % 12], salt = V(site).salt, isSalt = i => salt.includes((m0 + i) % 12 + 1);
$("#planFor").textContent = `${t("planFor")}: ${pick(c.name)} · ${pick(site.name)}`;
{ let ok = document.querySelector("#planOk"); if (!ok) { $("#planFor").insertAdjacentHTML("beforebegin", `<div id="planOk" class="plan-ok" role="status"></div>`); ok = document.querySelector("#planOk") }
const sc = (ranked().find(x => x.c.id === c.id) || {}).s, why = (c.why || [])[0];
ok.innerHTML = `<p class="po-eye">${ico("check", 16)}<span>${esc(t("poEye"))}</span></p><h3 class="po-name">${esc(pick(c.name))}</h3>
${sc != null ? `<p class="po-fit">${esc(t("poFit"))} <b>${esc(fitWord(sc))}</b> (${num(Math.max(0, sc).toFixed(1))}/5)</p>` : ""}${why ? `<p class="po-why"><b>${esc(t("poWhy"))}</b> ${esc(pick(why))}</p>` : ""}
<div class="po-act"><button type="button" class="ghost-btn" data-go="3">${esc(t("poOther"))}</button></div>` }
$("#planWarn").hidden = !DATA.outlook.elnino; $("#planWarn").innerHTML = DATA.outlook.elnino ? esc(t("planElnino")) : "";
$("#planSrc").hidden = !DATA.outlook.elnino; $("#planSrc").innerHTML = DATA.outlook.elnino ? t("srcWord") + cite(DATA.outlook.src) : "";
$("#strip").innerHTML = Array.from({ length: 12 }, (_, i) => { const m = code(i)[0], d = new Date(now.getFullYear(), m0 + i), yr = !i || !d.getMonth();
return `<div><i class="m-${m}${isSalt(i) ? " salt" : ""}"></i><span class="${yr ? "yr" : ""}">${t("monthsLong")[d.getMonth()]}${yr ? `<br>${d.getFullYear()}` : ""}</span></div>` }).join("");
$("#stripKey").innerHTML = t("stripKey").map((x, i) => `<span><i class="sk-${["R", "U", "S", "F", "salt"][i]}"></i>${esc(x)}</span>`).join("");
const runs = [];
for (let i = 0; i < 12; i++) { if (i && code(i) === code(i - 1)) runs[runs.length - 1].to = i; else runs.push({ code: code(i), from: i, to: i }) }
const items = runs.map((r, n) => {
const sm = []; for (let i = r.from; i <= r.to; i++) if (isSalt(i)) { if (sm.length && sm[sm.length - 1][1] === i - 1) sm[sm.length - 1][1] = i; else sm.push([i, i]) }
const saltLine = sm.length ? `<span class="salt-badge">${t("planSalt")}: ${sm.map(([a, b]) => span(a, b)).join(", ")}</span>` : "";
if (r.code === "-") return `<li class="rest"><b>${span(r.from, r.to)}</b>${t(isWait(r) ? "s4Wait" : "planRest")}<br>${saltLine}</li>`;
const p = c.plan[r.code], started = r.from === 0 && code(-1) === r.code, ends = code(r.to + 1) !== r.code;
const marks = [started ? t("planCont") : `${t(r.code === "S" ? "planStock" : "planSow")}: ${lab(r.from)}${isLate(r) ? ` (${t("s4Late")})` : ""}`, ends ? `${t("planHarvest")}: ${lab(r.to)}` : ""].filter(Boolean);
const name = pick(p.name);
return `<li class="${r.code[0]}"><b>${span(r.from, r.to)}</b>${esc(name[0].toUpperCase() + name.slice(1))}<div class="hint">${marks.join(" · ")}</div>${saltLine}</li>`;
});
planText = runs.map(r => {
  const sm = []; for (let i = r.from; i <= r.to; i++) if (isSalt(i)) { if (sm.length && sm[sm.length - 1][1] === i - 1) sm[sm.length - 1][1] = i; else sm.push([i, i]) }
  const salt = sm.length ? ` (${t("planSalt")}: ${sm.map(([a, b]) => span(a, b)).join(", ")})` : "";
  if (r.code === "-") return `${span(r.from, r.to)}: ${t(isWait(r) ? "s4Wait" : "planRest")}.${salt}`;
  const nm = pick(c.plan[r.code].name), started = r.from === 0 && code(-1) === r.code, ends = code(r.to + 1) !== r.code;
  const marks = [started ? t("planCont") : `${t(r.code === "S" ? "planStock" : "planSow")}: ${lab(r.from)}`, ends ? `${t("planHarvest")}: ${lab(r.to)}` : ""].filter(Boolean).join(", ");
  return `${span(r.from, r.to)}: ${nm[0].toUpperCase() + nm.slice(1)}. ${marks[0].toUpperCase() + marks.slice(1)}.${salt}`;
});
$("#timeline").innerHTML = items.join("");
$("#calendar").innerHTML = Array.from({ length: 12 }, (_, i) => {
const k = code(i), m = k[0], d = new Date(now.getFullYear(), m0 + i), r = runs.find(x => i >= x.from && i <= x.to);
let act, cls;
if (m === "-") { act = t("calRest"); cls = "rest" }
else { const started = r.from === 0 && code(-1) === r.code, ends = code(r.to + 1) !== r.code;
if (i === r.from && !started) { act = t(m === "S" ? "planStock" : "planSow"); cls = "sow" }
else if (i === r.to && ends) { act = t("planHarvest"); cls = "harvest" }
else { act = t("calGrow"); cls = "grow" } }
const crop = m === "-" ? "" : pick(c.plan[k].name);
return `<div class="cal-m m-${m} ${cls}${i === 0 ? " now" : ""}">
<div class="cal-top"><b>${t("monthsLong")[d.getMonth()]}</b><span>${d.getFullYear()}</span></div>
<div class="cal-act">${esc(act)}</div>${crop ? `<div class="cal-crop">${esc(crop[0].toUpperCase() + crop.slice(1))}</div>` : ""}
${isSalt(i) ? `<span class="cal-salt">${t("calSalt")}</span>` : ""}${i === 0 ? `<span class="cal-now">${t("calNow")}</span>` : ""}</div>` }).join("");
const res = [...new Set(runs.filter(r => r.code !== "-").flatMap(r => c.plan[r.code].res))];
$("#needs").innerHTML = res.map(k => { const r = DATA.resources[k]; return `<div class="need"><h4>${esc(pick(r.name))}</h4><dl>
${r.seed ? `<div><dt>${t("seed")}</dt><dd>${esc(pick(r.seed))}</dd></div>` : ""}${r.fertiliser ? `<div><dt>${t("fert")}</dt><dd>${esc(pick(r.fertiliser))}</dd></div>` : ""}
${r.steps && r.steps.length ? `<div><dt>${t("steps")}</dt><dd><ol>${r.steps.map(s => `<li>${esc(pick(s))}</li>`).join("")}</ol></dd></div>` : ""}</dl></div>` }).join("");
renderPath(c, runs, lab, span, isSalt, SHORT, code, c0, isWait, isLate);
typeof D5 !== "undefined" && D5.plan(c);
}
/* Simple view of step 4: one season path, a stop per crop (when, what to do, salt, what to get ready) and one money line.
   It stands in for the forecast, wheel, cost, calendar and needs boxes, which stay in Advanced. */
function renderPath(c, runs, lab, span, isSalt, SHORT, code0, c0, isWait, isLate) {
let el = document.getElementById("s4"); if (!el) { const a = document.getElementById("planOk"); if (!a) return; a.insertAdjacentHTML("afterend", `<section id="s4" class="s4" aria-labelledby="s4H"></section>`); el = document.getElementById("s4") }
const L = x => x[lang === "vi" ? 1 : 0], now = new Date(), m0 = now.getMonth(), code = code0 || (i => c.months[((m0 + i) % 12 + 12) % 12]);
/* short month labels: "T8" / "Aug"; a range is "T1–T6" */
const mo = i => { const m = (m0 + i) % 12; return lang === "vi" ? `T${m + 1}` : t("monthsLong")[m].slice(0, 3) };
const rg = (a, b) => a === b ? mo(a) : `${mo(a)}–${mo(b)}`;
const yr = i => new Date(now.getFullYear(), m0 + i).getFullYear();
const rows = runs.map((r, n) => {
  const sm = []; for (let i = r.from; i <= r.to; i++) if (isSalt(i)) { if (sm.length && sm[sm.length - 1][1] === i - 1) sm[sm.length - 1][1] = i; else sm.push([i, i]) }
  const k = r.code === "-" ? "F" : r.code[0], kind = { R: "rice", S: "shrimp", U: "upland" }[k] || "fallow";
  let what, act = "";
  if (r.code === "-") what = t(isWait && isWait(r) ? "s4Wait" : "s4Rest");
  else { const nm = pick(c.plan[r.code].name), started = r.from === 0 && code(-1) === r.code, ends = code(r.to + 1) !== r.code;
    what = r.code[1] === "0" || !(k !== "U" && t("sCropL")[k]) ? nm[0].toUpperCase() + nm.slice(1) : t("sCropL")[k];   /* today's crop keeps its "now in the field" name */   /* rice and shrimp: one short word; an upland crop keeps its own name */
    act = [started ? (ends ? "" : t("planCont")) : `${t(k === "S" ? "planStock" : "planSow")} ${mo(r.from)}${isLate && isLate(r) ? ` (${t("s4Late")})` : ""}`, ends ? `${t("planHarvest")} ${mo(r.to)}` : ""].filter(Boolean).join(" · ");
    act = act[0].toUpperCase() + act.slice(1) }
  const salt = sm.length ? `<span class="s4-salt" title="${esc(t("s4Salt"))}">${ico("drop", 12)}${esc(t("s4SaltS"))} ${sm.map(([a, b]) => rg(a, b)).join(", ")}</span>` : "";
  const y0 = yr(r.from), y1 = yr(r.to);
  return `<li class="s4-st s4k-${k}${n ? "" : " now"}"><span class="s4-ico" aria-hidden="true">${ico(kind, 18)}</span>
    <span class="s4-b"><span class="s4-l1"><b class="s4-what">${esc(what)}</b>${salt}</span>${act ? `<span class="s4-act">${esc(act)}</span>` : ""}</span>
    <span class="s4-when"><b>${rg(r.from, r.to)}</b><small>${n ? (y0 === y1 ? y0 : `${y0}–${y1}`) : esc(t("calNow"))}</small></span></li>`;
}).join("");
const keys = [...new Set(runs.filter(r => r.code !== "-").flatMap(r => c.plan[r.code].res || []))].filter(x => SHORT[x]);
const need = keys.map(x => `<li><b>${esc(pick(DATA.resources[x] ? DATA.resources[x].name : x))}</b>${SHORT[x].seed ? `<span>${esc(t("seed"))}: ${esc(L(SHORT[x].seed))}</span>` : ""}${SHORT[x].fert ? `<span>${esc(t("fert"))}: ${esc(L(SHORT[x].fert))}</span>` : ""}</li>`).join("");
let money = "";
if (typeof Cost !== "undefined" && Cost.calc) { const r = Cost.calc(c0 || c), h = Cost.ha ? Cost.ha() : null, k = h || 1;
  if (r.cost || r.profit != null) money = `<div class="s4-money">${r.cost ? `<div class="c"><span>${esc(t("s4Cost"))}</span><b>${esc(Cost.money(r.cost * k))}</b></div>` : ""}${r.profit != null ? `<div class="p"><span>${esc(t("s4Profit"))}</span><b>${esc(Cost.money(r.profit * k))}</b></div>` : ""}
    <p class="s4-est">${esc(t("s4Year")(h ? num(h) : null))} · ${esc(t("s4Est"))} ${esc(Cost.machNote ? Cost.machNote() : "")}</p></div>` }
el.innerHTML = `<h3 id="s4H" class="s4-h">${esc(t("s4H"))}</h3><ol class="s4-path">${rows}</ol>`;
/* money and "what to get ready" sit in their own block: under the path, or in the right column on a full screen (side.js) */
let m4 = document.getElementById("s4m");
if (!m4) { m4 = document.createElement("div"); m4.id = "s4m"; m4.className = "s4 s4m"; const r = document.querySelector("#v4 > .fc-r"); r ? r.prepend(m4) : el.insertAdjacentElement("afterend", m4) }
const open = m4.querySelector("details[open]");
m4.innerHTML = `${money}${need ? `<details class="s4-need"${open ? " open" : ""}><summary>${esc(t("s4Need"))}</summary><ul>${need}</ul></details>` : ""}`;
}
const setPv = v => { pv = v; $("#v4").dataset.pv = v; $$("#planView [data-pv]").forEach(b => b.setAttribute("aria-pressed", b.dataset.pv === v)); save("mre-pv", v) };
/* print, share and read the plan aloud */
function planLines() {
const lines = [t("shareTitle"), $("#planFor").textContent, ""];
planText.forEach(x => lines.push("• " + x));
lines.push("", t("talk")); return lines;
}
async function sharePlan() {
const text = planLines().join("\n"), msg = $("#shareMsg");
try { if (navigator.share) { await navigator.share({ title: t("shareTitle"), text }); return } await navigator.clipboard.writeText(text); msg.textContent = t("copied") }
catch (err) { if (err && err.name === "AbortError") return;
if (dlApi) { try { await dlApi.save({ filename: (lang === "vi" ? "ke-hoach-12-thang" : "12-month-plan") + ".txt", data: text }); msg.textContent = t("savedPlan") } catch (e2) { if (!e2 || e2.code !== "declined") window.prompt(t("shareTitle"), text) } setTimeout(() => msg.textContent = "", 5000); return }
window.prompt(t("shareTitle"), text); return }
setTimeout(() => msg.textContent = "", 4000);
}
const ss = window.speechSynthesis; try { ss && ss.getVoices(); ss && ss.addEventListener && ss.addEventListener("voiceschanged", () => ss.getVoices()) } catch (e) {}
let ttsApi = null, ttsOn = false;
if (window.claude && claude.use) { try { claude.use("tts").then(x => ttsApi = x).catch(() => {}) } catch (e) {} }
const setRead = on => { $("#readPlan").setAttribute("aria-pressed", on); $("#readL").textContent = t(on ? "readStop" : "readPlan") };
function readPlan() {
const msg = $("#shareMsg");
if (!ss && !ttsApi) { msg.textContent = t("noVoice"); return }
if (ttsOn) { ttsApi && ttsApi.stop(); ttsOn = false; setRead(false); return }
if (ss && ss.speaking) { ss.cancel(); setRead(false); return }
const v = ss ? ss.getVoices().find(x => x.lang.toLowerCase().startsWith(lang)) : null;
if (!v && lang === "vi" && ttsApi) {
const text = planLines().filter(Boolean).map(x => x.replace(/^• /, "")).join(". ").slice(0, 2000);
ttsOn = true; setRead(true);
ttsApi.speak(text, { language: "vi" }).catch(() => { msg.textContent = t("noVoice"); setTimeout(() => msg.textContent = "", 6000) }).finally(() => { ttsOn = false; setRead(false) });
return }
if (!ss || (!v && lang === "vi")) { msg.textContent = t("noVoice"); setTimeout(() => msg.textContent = "", 6000); return }
const u = new SpeechSynthesisUtterance(planLines().filter(Boolean).map(x => x.replace(/^• /, "")).join(". "));
u.lang = lang === "vi" ? "vi-VN" : "en-US"; if (v) u.voice = v; u.rate = .95;
u.onend = u.onerror = () => setRead(false); ss.speak(u); setRead(true);
}
/* listen aloud, card by card (part 8) */
const markListen = () => $$("[data-listen]").forEach(b => { const on = b.dataset.listen === speaking; b.setAttribute("aria-pressed", on); const sp = b.querySelector("span"); if (sp) sp.textContent = t(on ? "listenStop" : "listen") });
function stopSpeak() { try { ss && ss.cancel() } catch (e) {} try { ttsApi && ttsApi.stop() } catch (e) {} speaking = null; markListen() }
function listen(id) {
if (speaking === id) return stopSpeak();
stopSpeak();
const c = cardsOf(V(site)).find(x => x.id === id), sc = ranked().find(x => x.c.id === id); if (!c) return;
const text = [pick(c.name), pick(c.calendar), sc ? `${t("match")} ${num(Math.max(0, sc.s).toFixed(1))} ${t("of5")}` : "", ...whyLines(c)].filter(Boolean).join(". ");
const voice = ss && ss.getVoices().find(x => x.lang.toLowerCase().startsWith(lang));
speaking = id; markListen();
if (!voice && lang === "vi" && ttsApi) {
ttsApi.speak(text.slice(0, 2000), { language: "vi" }).catch(() => {}).finally(() => { if (speaking === id) { speaking = null; markListen() } }); return }
if (!ss || (!voice && lang === "vi")) { speaking = null; markListen(); $("#shareMsg").textContent = t("noVoice"); toast(t("noVoice")); return }
const u = new SpeechSynthesisUtterance(text); u.lang = lang === "vi" ? "vi-VN" : "en-US"; if (voice) u.voice = voice; u.rate = .95;
u.onend = u.onerror = () => { if (speaking === id) { speaking = null; markListen() } };
ss.speak(u);
}

/* ---------- the modal: plan popup with score, about, sources, field form ---------- */
let mFrom = null, mKind = null, ppCard = null;
const modal = () => document.querySelector("#modal");
const modalOpen = () => { const m = modal(); return !!m && (m.open || m.classList.contains("open")) };
const PARTS = ["#aboutBox", "#sourcesBox", "#fieldForm"];
/* the shell keeps about, sources and the field form as sections next to #mBody; the plan popup goes into #mBody */
function openModal(html, kind, labelId, part) {
const m = modal(); if (!m) return;
if (!modalOpen()) mFrom = document.activeElement;
mKind = kind; $("#mBody").innerHTML = part ? "" : html; m.dataset.kind = kind;
PARTS.forEach(sel => { const el = document.querySelector(sel); if (el && !document.querySelector("#mBody").contains(el)) el.hidden = sel !== part });
m.setAttribute("role", m.getAttribute("role") || "dialog"); m.setAttribute("aria-modal", "true");
if (labelId) m.setAttribute("aria-labelledby", labelId);
m.hidden = false; m.classList.add("open", "show");
if (typeof m.showModal === "function" && !m.open) { try { m.showModal() } catch (e) {} }
document.body.classList.add("modal-open");
const f = $("#mBody").querySelector("[autofocus]") || $("#mBody").querySelector("h2[tabindex]");
setTimeout(() => (f || m).focus && (f || m).focus({ preventScroll: true }), 20);
}
function closeModal(back = true) {
const m = modal(); if (!m || !modalOpen()) return;
m.classList.remove("open", "show"); if (typeof m.close === "function" && m.open) { try { m.close() } catch (e) {} } m.hidden = true;
document.body.classList.remove("modal-open"); mKind = null; if (has("#addField")) $("#addField").setAttribute("aria-expanded", "false");
if (back && mFrom && mFrom.focus && document.contains(mFrom)) mFrom.focus({ preventScroll: true });
}
/* 3. plan popup: the 12 months and the plan's score, with Keep or Change (part 11) */
function showPlan(id) {
const c = site && cardsOf(V(site)).find(x => x.id === id); if (!c) return;
ppCard = c;
const L = PL(), ok = !!(L && L.has && L.has(site.id)); let r = null;
if (ok) { try { r = L.score(site.id, c) } catch (e) { console.warn(e) } }
const months = r ? r.months : c.months, v = V(site), ML = t("monthsLong"), MS = t("months");
const used = [...new Set(months.map(m => m[0]))];
const bar = k => { const x = r && r.ev.scores[k]; return `<li><span>${esc(t("ppK")[k])}</span><span class="pp-bar"><i style="width:${x == null ? 0 : (x / 5 * 100).toFixed(0)}%"></i></span><b>${x == null ? "–" : num(x.toFixed(1))}</b></li>` };
openModal(`<div class="pp">
<span class="pp-eye">${ico("check", 14)}${esc(t("ppEye"))}</span>
<h2 id="ppH" tabindex="-1">${esc(pick(c.name))}</h2><p class="pp-where">${esc(pick(site.name))} · ${esc(pick(c.calendar))}</p>
<div class="pp-months" role="img" aria-label="${esc(months.map((m, i) => `${ML[i]}: ${t("ppLeg")[m[0]] || ""}`).join(", "))}">${months.map((m, i) =>
`<div class="pp-m k-${m[0] === "-" ? "F" : m[0]}${v.salt.includes(i + 1) ? " salt" : ""}"><i></i><span>${MS[i]}</span></div>`).join("")}</div>
<div class="pp-key">${used.map(k => `<span><i class="k-${k === "-" ? "F" : k}"></i>${esc(t("ppLeg")[k] || "")}</span>`).join("")}<span><i class="salt"></i>${esc(t("lgSalt"))}</span></div>
${r ? `<div class="pp-score g-${r.g}"><b class="pp-word">${esc(t("ppW" + r.g))}</b><p class="pp-say">${esc(t("ppGrade" + r.g))}</p>
<details class="fold"${Folds.attrs("score")}><summary>${esc(t("foldScore"))}</summary><div class="pp-nums"><div class="pp-num"><small>${esc(t("ppScore"))}</small><b>${r.p}</b><small>${esc(t("ppOf"))}</small></div>
<div class="pp-grade"><span>${esc(t("ppGrade"))}</span><b>${r.g}</b></div></div>
<ul class="pp-bars">${KEYS.map(bar).join("")}</ul></details></div>` : `<p class="pp-say">${esc(t("ppNoScore"))}</p>`}
<p class="pp-hint">${esc(t("ppHint"))}</p>
<div class="pp-act"><button type="button" class="go-btn" id="ppKeep">${esc(t("ppKeep"))}</button>${ok ? `<button type="button" class="ghost-btn" id="ppChange">${ico("tools")}<span>${esc(t("ppChange"))}</span></button>` : ""}</div></div>`, "plan", "ppH");
}
const aboutInner = () => `${nasaBadges()}${ABOUT[lang].map(([h, p]) => `<div class="about-item"><h3>${h}</h3><p>${p}</p></div>`).join("")}
<button type="button" class="ghost-btn" data-open="sources">${esc(t("sourcesTitle")(DATA.sources.length))}</button>
<p class="disclaimer">${esc(t("disclaimer"))}</p><p class="copy4">${esc(t("copy4"))}</p>`;
const sourceItems = () => DATA.sources.map((x, i) => `<li id="src-${i + 1}" tabindex="-1">${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title)} ${x.verified ? "" : `<span class="unv">${t("unverified")}</span>`}</li>`).join("");
const inShell = sel => has(sel) && !document.querySelector("#mBody").contains(document.querySelector(sel));
function openAbout() {
if (inShell("#aboutBox")) { $("#aboutBody").innerHTML = aboutInner(); $("#aboutH").textContent = t("aboutH"); $("#aboutH").setAttribute("tabindex", "-1"); openModal("", "about", "aboutH", "#aboutBox"); setTimeout(() => $("#aboutH").focus({ preventScroll: true }), 30); return }
openModal(`<div class="about"><h2 id="aboutH" tabindex="-1">${esc(t("aboutH"))}</h2>${nasaBadges()}<div class="about-grid" id="aboutBody">${ABOUT[lang].map(([h, p]) => `<div class="about-item"><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
<button type="button" class="ghost-btn" data-open="sources">${esc(t("sourcesTitle")(DATA.sources.length))}</button>
<p class="disclaimer">${esc(t("disclaimer"))}</p><p class="copy4">${esc(t("copy4"))}</p></div>`, "about", "aboutH");
}
function openSources(n) {
if (inShell("#sourcesBox")) { $("#sourceList").innerHTML = sourceItems(); $("#sourcesH").textContent = t("sourcesTitle")(DATA.sources.length); $("#sourcesH").setAttribute("tabindex", "-1"); openModal("", "sources", "sourcesH", "#sourcesBox"); setTimeout(() => $("#sourcesH").focus({ preventScroll: true }), 30) }
else openModal(`<div class="sources"><h2 id="sourcesH" tabindex="-1">${esc(t("sourcesTitle")(DATA.sources.length))}</h2>
<ol id="sourceList">${DATA.sources.map((x, i) => `<li id="src-${i + 1}" tabindex="-1">${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title)} ${x.verified ? "" : `<span class="unv">${t("unverified")}</span>`}</li>`).join("")}</ol>
<p class="disclaimer">${esc(t("disclaimer"))}</p></div>`, "sources", "sourcesH");
if (n) setTimeout(() => { const li = document.querySelector("#src-" + n); if (!li) return;
li.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "center" }); li.focus({ preventScroll: true });
li.classList.remove("flash"); void li.offsetWidth; li.classList.add("flash"); setTimeout(() => li.classList.remove("flash"), 2400) }, 60);
}
/* field form (add / edit), Draft 3's form in the modal */
function openFieldForm(preset, edit) {
editId = edit ? edit.id : null; pendingNext = false;
document.querySelectorAll("#fieldForm [aria-invalid]").forEach(x => x.removeAttribute("aria-invalid")); fErr("");
if (has("#addField")) $("#addField").setAttribute("aria-expanded", "true");
if (inShell("#fieldForm")) {
const fm0 = $("#fieldForm"); if (fm0.reset) fm0.reset();
const h = fm0.querySelector("h2"); if (h) { h.id = h.id || "fH"; h.removeAttribute("data-t"); h.setAttribute("tabindex", "-1"); h.textContent = t(edit ? "fEdit" : "addField") }
fm0.querySelectorAll("label > span[data-t]").forEach(x => x.textContent = t(x.dataset.t));
$("#fArea").innerHTML = DATA.sites.map(s => `<option value="${s.id}">${esc(pick(s.name))}</option>`).join("");
{ const fn = $("#fNow"), host = fn && fn.closest("label"); if (host) host.outerHTML = `<fieldset class="f-seasons"><legend>${esc(t("fSeasons"))}</legend>${t("seasons").map(([nm, mo], i) => `<label class="f-seas"><span>${esc(nm)} <small>${esc(mo)}</small></span><select id="fS${i}">${SEAS_OPTS.map(o => `<option value="${o}">${esc(t("sCrop")[o])}</option>`).join("")}</select></label>`).join("")}</fieldset>`;
const fl = fm0.querySelector(".f-seasons legend"); if (fl) fl.textContent = t("fSeasons");
fm0.querySelectorAll(".f-seas").forEach((lb, i) => { const sp = lb.querySelector("span"); sp.innerHTML = `${esc(t("seasons")[i][0])} <small>${esc(t("seasons")[i][1])}</small>`; lb.querySelector("select").innerHTML = SEAS_OPTS.map(o => `<option value="${o}">${esc(t("sCrop")[o])}</option>`).join("") }) }
if (!fm0.querySelector(".f-cong")) { const fa = fm0.querySelector(".f-actions"); if (fa) fa.insertAdjacentHTML("beforebegin", `<p class="f-cong"></p>`) }
const fc = fm0.querySelector(".f-cong"); if (fc) fc.textContent = t("congNote");
if (!fm0.querySelector("#fChecks")) { const fa = fm0.querySelector(".f-actions"); if (fa) fa.insertAdjacentHTML("beforebegin", fchk()) }
const sb = fm0.querySelector("[type=submit]"); if (sb) { sb.removeAttribute("data-t"); sb.textContent = t(edit ? "fUpdate" : "fSave") }
const ft = $("#fTry"); if (ft) { ft.hidden = true; ft.textContent = t("fTry") }   /* askField shows it: only the step 1 path offers "Xem thử" */
const fn = fm0.querySelector(".f-note"); if (fn) fn.textContent = t("fNote");
openModal("", "field", h ? h.id : null, "#fieldForm");
if (preset) $("#fArea").value = preset;
if (edit) { $("#fName").value = edit.name; $("#fArea").value = edit.site; $("#fSize").value = edit.size || "" }
[0, 1, 2].forEach(i => { const el = document.querySelector("#fS" + i); if (el) el.value = ((edit && (edit.seasons || SEAS_OF[edit.cur])) || seasons)[i] }); formChecks();
setTimeout(() => $("#fName").focus({ preventScroll: true }), 40);
return }
openModal(`<form class="f-form" id="fieldForm"><h2 id="fH" tabindex="-1">${esc(t(edit ? "fEdit" : "addField"))}</h2>
<label><span>${t("fName")}</span><input id="fName" maxlength="40" autocomplete="off" autofocus></label>
<label><span>${t("fArea")}</span><select id="fArea">${DATA.sites.map(s => `<option value="${s.id}">${esc(pick(s.name))}</option>`).join("")}</select></label>
<fieldset class="f-seasons"><legend>${esc(t("fSeasons"))}</legend>${t("seasons").map(([nm, mo], i) => `<label class="f-seas"><span>${esc(nm)} <small>${esc(mo)}</small></span><select id="fS${i}">${SEAS_OPTS.map(o => `<option value="${o}">${esc(t("sCrop")[o])}</option>`).join("")}</select></label>`).join("")}</fieldset>
<label><span>${t("fSize")}</span><input id="fSize" type="text" inputmode="decimal" autocomplete="off" placeholder="1,5"></label>
<p class="f-cong">${esc(t("congNote"))}</p>${fchk()}
<div class="f-actions"><button type="submit" class="go-btn">${t(edit ? "fUpdate" : "fSave")}</button><button type="button" class="ghost-btn" id="fTry" hidden>${t("fTry")}</button><button type="button" class="ghost-btn" id="fCancel">${t("fCancel")}</button></div>
<p class="f-note">${t("fNote")}</p></form>`, "field", "fH");
if (preset) $("#fArea").value = preset;
if (edit) { $("#fName").value = edit.name; $("#fArea").value = edit.site; $("#fSize").value = edit.size || "" }
[0, 1, 2].forEach(i => { const el = document.querySelector("#fS" + i); if (el) el.value = ((edit && (edit.seasons || SEAS_OF[edit.cur])) || seasons)[i] }); formChecks();
}
function submitField() {
const ha = parseFloat(String($("#fSize").value).replace(",", "."));
if (String($("#fSize").value).trim() && !(ha > 0)) { fErr(t("needSize")); $("#fSize").setAttribute("aria-invalid", "true"); $("#fSize").focus(); return }
if (ha >= MAX_HA) { fErr(t("needSizeMax")); $("#fSize").setAttribute("aria-invalid", "true"); $("#fSize").focus(); return }
$("#fName").removeAttribute("aria-invalid"); $("#fSize").removeAttribute("aria-invalid");
const old = editId && fields().find(x => x.id === editId);
const f = { id: old ? old.id : Date.now().toString(36), name: String($("#fName").value || "").trim() || (old ? old.name : defaultName($("#fArea").value)), site: $("#fArea").value, seasons: [0, 1, 2].map(i => (document.querySelector("#fS" + i) || {}).value || "R"), size: ha > 0 ? Math.round(ha * 10) / 10 : null };
f.cur = curFrom(f.seasons);
if (old) { if (old.site !== f.site) delete old.rot; Object.assign(old, f) } else Farm.st.fields.push(f);   /* in place: the dashboard's plan for this field stays */
try { typeof Dash !== "undefined" && Dash.syncField && Dash.syncField() } catch (e) {}
const goOn = pendingNext;
trySite = null; adding = false; saveFields(); closeModal(false); openField(f.id);
if (goOn) { pendingNext = false; setTimeout(() => { go(2); setTimeout(() => { if (typeof Side !== "undefined" && Side.sub) Side.sub("b") }, 30) }, 80) }
}
const saveFields = () => Farm.save();

/* ---------- ticker: outlook, your fields, selected area ---------- */
function renderTicker() {
const o = DATA.outlook;
if (has("#tkOutlook")) $("#tkOutlook").innerHTML = `<p class="tk-t${o.elnino ? " risk" : ""}">${esc(pick(o.text))}</p>`;
renderFields();
if (has("#tkArea")) {
if (!site) { $("#tkArea").innerHTML = `<p class="tk-t tk-empty">${esc(t("tbPick"))}</p>`; return }
const v = V(site), top = ranked().find(x => !x.c.not_here);
$("#tkArea").innerHTML = `<div class="tk-row"><b class="tk-name">${esc(shortName(site))}</b>${monthChip(site, cur, new Date().getMonth())}
${top ? `<span class="tk-best">${esc(t("tbBest")(pick(top.c.name), num(Math.max(0, top.s).toFixed(1))))}</span>` : ""}
<button type="button" class="tk-open" data-go="4">${esc(t("openPlan"))} ${ico("arrow", 14)}</button></div>`;
}
}
function renderFields() {
if (!has("#fieldList")) return;
$("#fieldList").innerHTML = fields().length ? fields().map(f => {
const s = siteById(f.site), [k] = CUR[f.cur] || CUR.rice3, sz = (f.seasons || SEAS_OF[f.cur] || []).map(x => t("sCropS")[x]).join(" → ");
return `<li class="field${f.id === fieldId ? " on" : ""}"><button type="button" class="f-open" data-field="${f.id}" aria-pressed="${f.id === fieldId}">
<b>${esc(f.name)}</b><small>${esc(shortName(s))}${f.size ? ` · ${num(f.size)} ha · ${num(Math.round(f.size * 100) / 10)} công` : ""} · ${esc(sz || t(k))}</small>${monthChip(s, f.cur, new Date().getMonth())}</button>
<span class="f-acts"><button type="button" class="f-edit" data-edit="${f.id}" aria-label="${t("fEdit")}: ${esc(f.name)}">${ico("edit", 16)}<span>${t("fEdit")}</span></button><button type="button" class="f-del" data-del="${f.id}" aria-label="${t("fRemove")}: ${esc(f.name)}">${ico("trash", 16)}<span>${t("fRemove")}</span></button></span></li>` }).join("")
: `<li class="f-empty">${t("mfEmpty")}</li>`;
}

/* ---------- drawer and steps ---------- */
const VIEW = { 1: "v1", 2: "v2", 3: "v3", 4: "v4", lab: "vLab" };
const NAV = { 1: "navArea", 2: "navPri", 3: "navCards", 4: "navPlan", lab: "navLab" };
const STEPS = [1, 2, 3, 4, "lab"];
function drawerOpen() { return document.body.classList.contains("drawer-open") }
function openPanel(s) { go(s == null ? step : s) }
function closePanel() {
if (!drawerOpen()) return;
if (gi >= 0) guide(-1);  // the Lab guide belongs to the drawer: close it too
document.body.classList.remove("drawer-open");
const d = document.querySelector("#drawer"); if (d) d.inert = true;
setTimeout(() => mv("resize"), 460);
const m = document.querySelector("#map"); if (document.querySelector("#drawer") && document.querySelector("#drawer").contains(document.activeElement) && m) { if (!m.hasAttribute("tabindex")) m.setAttribute("tabindex", "-1"); m.focus({ preventScroll: true }) }
}
function go(sv, opts = {}) {
sv = sv === "lab" ? "lab" : Math.max(1, Math.min(4, parseInt(sv, 10) || 1));
if ((sv === 3 || sv === 4) && site && !hasField()) { sv = 2; setTimeout(askField, 60) }
const wasOpen = drawerOpen(), changed = sv !== step;
if (sv !== "lab" && gi >= 0) guide(-1);
step = sv;
$$("section.view").forEach(v => { const on = v.id === VIEW[sv]; v.classList.toggle("on", on); v.toggleAttribute("inert", !on) });
const d = document.querySelector("#drawer"); if (d) { d.inert = false; d.hidden = false }
document.body.classList.add("drawer-open");
renderHead();
if (sv === "lab") {
try { history.replaceState(null, "", "#plan-lab") } catch (e) {}
const L = PL(); if (L && typeof L.render === "function") { try { L.render(document.querySelector("#planLab")) } catch (e) { console.warn("Lab.render", e) } }
setTimeout(() => { if (!load("mre-labguide") && gi < 0 && step === "lab") guide(0) }, 400);
} else if (location.hash === "#plan-lab") { try { history.replaceState(null, "", location.pathname + location.search) } catch (e) {} }
if (sv !== 1 && sv !== "lab" && !site) mv("home");
const view = document.querySelector("#" + VIEW[sv]);
if (view && changed) { view.scrollTop = 0; const sc = view.parentElement; if (sc && sc.scrollHeight > sc.clientHeight) sc.scrollTop = 0 }
if (!wasOpen) setTimeout(() => mv("resize"), 460);
if (!opts.noFocus) { const t1 = document.querySelector("#dTitle"); if (t1) setTimeout(() => t1.focus({ preventScroll: true }), wasOpen ? 0 : 60) }
}
function renderHead() {
const sv = step, need = sv !== 1 && sv !== "lab" && !site;
if (has("#dNum")) $("#dNum").textContent = "";  // draft5: no step numbers
$("#dTitle").textContent = sv === 1 ? (site ? pick(site.name) : t("step1")) : sv === 2 ? t("step3") : sv === 3 ? t("step4") : sv === 4 ? t("step5") : t("navLab");
$("#dSub").textContent = need ? t("lockedSub") : sv === 1 ? (site ? t(mode === "elnino" ? "yearEyebrowEl" : "yearEyebrow") : t(coarse.matches ? "step1hintTap" : "step1hint"))
: sv === 2 ? t(fm === "wet" ? "sub3Tap" : "openSub3") : sv === 3 ? t("openSub4") : sv === 4 ? t("openSub5") : t("lab3");
$$("[data-go]").forEach(b => { if (b.closest("#drawer section.view, #tkArea, #home")) return; const on = String(b.dataset.go) === String(sv); b.classList.toggle("active", on); if (on) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current") });
/* draft5: the side rail and its step numbers are gone */
["#v2", "#v3", "#v4"].forEach(id => { if (has(id)) $(id).classList.toggle("locked", !site) });
/* footer: Back, and the "OK, next" words of part 12 */
const prev = document.querySelector("#dPrev"), next = document.querySelector("#dNext");
if (prev) { prev.hidden = sv === 1; setTxt(prev, t("drawerPrev")) }
if (next) {
next.hidden = sv === "lab"; next.classList.toggle("wait", sv === 1 && (!site || exOn));
setTxt(next, sv === 1 ? (site && !exOn ? t("nx1")(shortName(site)) : t("nx1wait")) : need ? t("heroCta") : sv === 2 ? (hasField() ? t("nx3") : t("needFieldB")) : sv === 3 ? t("nx4") : t("nx5lab"));
}
const dc = document.querySelector("#dClose"); if (dc) { dc.setAttribute("aria-label", t("drawerClose")); if (!dc.textContent.trim() && !dc.querySelector("svg")) dc.innerHTML = ico("x", 18) }
}
/* a saved field on the chosen area (the example area needs none) */
function hasField() {
if (!site || exOn || trySite === site.id) return true;
if (fieldId && fields().some(f => f.id === fieldId && f.site === site.id)) return true;
const f = !adding && fields().find(x => x.site === site.id); if (f) { fieldId = f.id; save("mre-last", f.id); return true }
return false;
}
let pendingNext = false;
let trySite = null;
let adding = false;   /* dashboard "Thêm ruộng": a new field, so an area's existing field is not adopted (and not overwritten) */   /* "Xem thử": the area being looked at without a saved field (never stored) */
/* empty name: "Ruộng Trần Đề", then "Ruộng Trần Đề 2" for a second field in that area */
const defaultName = id => { const s0 = siteById(id), n = fields().filter(f => f.site === id).length + 1; return `${t("fDefault")} ${s0 ? shortName(s0) : ""}${n > 1 ? " " + n : ""}`.trim() };
const MAX_HA = 1000;   /* one field is under 1,000 ha; the dashboard uses the same limit */
/* inline message in the field form (a toast would sit under the modal dialog) */
function fErr(msg) {
const fm = document.querySelector("#fieldForm"); if (!fm) return;
let p = fm.querySelector(".f-err");
if (!p) { p = document.createElement("p"); p.className = "f-err"; p.setAttribute("role", "alert"); const fa = fm.querySelector(".f-actions"); fa ? fa.parentNode.insertBefore(p, fa) : fm.appendChild(p) }
p.textContent = msg || ""; p.hidden = !msg;
}
function askField() { openFieldForm(site && site.id); pendingNext = true; const ft = document.querySelector("#fTry"); if (ft) ft.hidden = false }
/* delete a field from the planner list; quiet = the dashboard asked, so don't call it back */
function removeField(id, quiet) {
const f = fields().find(x => x.id === id); if (!f) return;
Farm.st.fields = Farm.st.fields.filter(x => x.id !== id); if (fieldId === id) { fieldId = null; drop("mre-last") } saveFields(); renderAll();
if (!quiet) { try { typeof Dash !== "undefined" && Dash.unlink && Dash.unlink() } catch (e) {} }
}
function nextStep() {
if (step === 1) { if (site && !exOn) { if (!hasField()) return askField(); go(2) } else { closePanel(); pulsePins() } return }
if (!site) { closePanel(); pulsePins(); return }
if (step === 2) { if (!hasField()) return askField(); return go(3) }
if (step === 3) { const a = ranked(), p = (a.find(x => x.c.id === planId) || a[0]); if (p) { planId = p.c.id; renderCards(false); setTimeout(() => go(4), 120) } else go(4); return }
if (step === 4) return openLab();
}
function openLab() {
const L = PL(), c = site && cardsOf(V(site)).find(x => x.id === ((document.querySelector("#cards .card.isplan") || {}).dataset || {}).id);
if (L && site && typeof L.open === "function") { try { L.open(site.id, c); if (step !== "lab") go("lab"); return } catch (e) { console.warn(e) } }
go("lab");
}
function pulsePins() { mv("home"); const m = document.querySelector("#map"); if (m) m.classList.add("pulse-pins"); setTimeout(() => m && m.classList.remove("pulse-pins"), 2400) }

/* ---------- settings popover ---------- */
const setOpen = () => { const b = document.querySelector("#gearBtn"); return !!b && b.getAttribute("aria-expanded") === "true" };
function toggleSettings(on) {
const p = document.querySelector("#setPanel"), b = document.querySelector("#gearBtn"); if (!p) return;
p.classList.toggle("open", on); if (b) b.setAttribute("aria-expanded", on);
if (on) { renderSettings(); const f = p.querySelector("button"); f && f.focus({ preventScroll: true }) }
}
function renderSettings() {
if (!has("#setBody")) return;
const seg = (attr, items, pressed) => `<div class="seg" role="group">${items.map(([v, txt, id]) => `<button type="button" ${id ? `id="${id}" ` : ""}data-${attr}="${v}" aria-pressed="${pressed(v)}">${txt}</button>`).join("")}</div>`;
const size = root.classList.contains("big") ? "big" : root.classList.contains("small") ? "small" : "n", lite = document.body.classList.contains("calm");
const pe = document.querySelector("#setPanel > .eyebrow"); if (pe) pe.textContent = tt("settings");
$("#setBody").innerHTML = `<p class="set-note">${esc(t("setNote"))}</p>
<div class="set-row"><span class="set-cap">${esc(tt("text"))}</span><div class="seg textsize" role="group" aria-label="${esc(tt("size"))}">${[["big", "A+"], ["n", "A"], ["small", "A−"]].map(([v, x]) => `<button type="button" data-size="${v}" aria-label="${x}" aria-pressed="${v === size}">${x}</button>`).join("")}</div><small class="set-hint">${esc(t("h_text"))}</small></div>
<div class="set-row"><span class="set-cap">${esc(tt("theme"))}</span>${seg("thm", [["light", esc(tt("thLight"))], ["dark", esc(tt("thDark"))], ["auto", esc(tt("thAuto"))]], v => v === (root.dataset.theme || "auto"))}<small class="set-hint">${esc(t("h_theme"))}</small></div>
<div class="set-row"><span class="set-cap">${esc(tt("motion"))}</span>${seg("motion", [["anim", esc(tt("anim"))], ["lite", esc(tt("lite"))]], v => (v === "lite") === lite)}<small class="set-hint">${esc(t("h_motion"))}</small></div>
<button type="button" class="set-guide" id="tourBtn">${ico("guide", 20)}<span><b>${esc(t("guideB"))}</b><small>${esc(t("guideS"))}</small></span></button>
<div class="set-links"><button type="button" class="ghost-btn" data-open="about">${esc(t("about"))}</button><button type="button" class="ghost-btn" data-open="sources">${esc(t("sources"))}</button></div>
${dlApi && copyB64.length > 100 ? `<button type="button" class="ghost-btn" id="saveCopy">${esc(t("saveCopy"))}</button><span class="share-msg" id="saveMsg" role="status"></span>` : ""}
<p class="copy4">${esc(t("copy4"))}</p>`;
}
const setLang = l => { lang = l; save("mre-lang", l); applyAll() };
function setFm(m, banner) {
fm = m; save("mre-fm", m); document.body.classList.toggle("field-mode", m === "wet");
$$("[data-fm]").forEach(b => b.setAttribute("aria-pressed", b.dataset.fm === m));
const d = document.querySelector("#fmDesc"); if (d) d.textContent = t(m === "wet" ? "fmWetD" : "fmHomeD");
if (banner) toast(t("bn_" + m));
priTexts(); renderHead();
}
function setSize(z) {
root.classList.toggle("big", z === "big"); root.classList.toggle("small", z === "small"); save("mre-text", z);
$$("[data-size]").forEach(x => x.setAttribute("aria-pressed", x.dataset.size === z)); setTimeout(() => mv("resize"), 50);
}
function setCalm(lite, keep) {
document.body.classList.toggle("calm", lite); if (keep) save("mre-motion", lite ? "lite" : "anim");
$$("[data-motion]").forEach(b => b.setAttribute("aria-pressed", (b.dataset.motion === "lite") === lite));
}

/* ---------- plan lab guide: one step at a time (part 11) ---------- */
const GD = ["#plCard1", "#plCard2", "#plBrushes", "#plMonths", "#plScore", "#plWarn", "#plSugg"];
let gi = -1;
function guide(i) {
$$(".gd-on").forEach(x => x.classList.remove("gd-on"));
gi = i; let box = document.querySelector("#gd");
if (!box) { document.body.insertAdjacentHTML("beforeend", `<div class="gd" id="gd" role="dialog" aria-modal="false" aria-labelledby="gdH" hidden></div>`); box = $("#gd") }
document.body.classList.toggle("gd-open", i >= 0 && i < GD.length);
if (i < 0 || i >= GD.length) { box.hidden = true; gi = -1; save("mre-labguide", "1"); return }
const el = document.querySelector(GD[i]);
if (el) { el.classList.add("gd-on"); el.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" }) }
const [h, p] = t("gd")[i], last = i === GD.length - 1;
box.innerHTML = `<div class="gd-top"><span class="gd-n">${esc(t("gdOf")(i + 1, GD.length))}</span><button type="button" class="gd-skip" data-gd="x">${esc(t("gdSkip"))}</button></div>
<h3 id="gdH">${esc(h)}</h3><p>${esc(p)}</p>
<div class="gd-dots" aria-hidden="true">${GD.map((_, k) => `<i class="${k === i ? "on" : k < i ? "done" : ""}"></i>`).join("")}</div>
<div class="gd-act">${i ? `<button type="button" class="ghost-btn" data-gd="${i - 1}">${esc(t("gdBack"))}</button>` : ""}<button type="button" class="go-btn gd-next" data-gd="${last ? "x" : i + 1}">${esc(t(last ? "gdDone" : "gdNext"))}</button></div>`;
box.hidden = false; box.querySelector(".gd-next").focus({ preventScroll: true });
}

/* ---------- toast, offline note, save a copy ---------- */
let toastT = 0;
function toast(msg) {
const el = document.querySelector("#toast"); if (!el) return;
if (!el.hasAttribute("role")) el.setAttribute("role", "status");
el.textContent = msg; el.hidden = false; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2600);
}
const offChip = document.createElement("div"); offChip.className = "offline-chip"; offChip.setAttribute("role", "status");
const netState = () => { offChip.hidden = navigator.onLine; offChip.textContent = t("offline") };
let dlApi = null;
const copyB64 = (document.querySelector("#selfCopy") || {}).textContent || "";
if (window.claude && claude.use) { try { claude.use("downloads").then(d => { dlApi = d }).catch(() => {}) } catch (e) {} }
/* "Print or save as PDF": a clean copy of the plan as the farmer sees it (Simple or Advanced), light colours,
   one column, no buttons, printed from a hidden frame so the drawer's scroll boxes and columns never cut it. */
function planDocHTML() {
  const v = document.querySelector("#v4"); if (!v) return "";
  const shown = el => !!el && !el.hidden && (el.offsetHeight > 0 || !!el.closest("details.fold"));
  const order = ["#planOk", "#s4", "#s4m", "#d5Cost", "#d5W4", "#d5Pred", "#planWarn", v.dataset.pv === "list" ? "#v4 .pv-list, #stripKey" : "#calendar", "#v4 h3[data-t='planNeed']", "#congNote", "#needs", "#planSrc", "#v4 .disclaimer", "#v4 .copy4"];
  const parts = order.flatMap(q => [...document.querySelectorAll(q)]).filter(el => el && v.contains(el) && shown(el) && !el.closest(".plan-tools")).map(el => {
    const c = el.cloneNode(true);
    /* a folded part prints open, its summary as a plain title */
    c.querySelectorAll("details").forEach(d => { const box = document.createElement("div"); box.className = d.className; const sm = d.querySelector(":scope > summary");
      if (sm) { const h = document.createElement("p"); h.className = "pd-sub"; h.textContent = sm.textContent.trim(); box.appendChild(h); sm.remove() }
      while (d.firstChild) box.appendChild(d.firstChild); d.replaceWith(box) });
    c.querySelectorAll("button, .po-act, input, [data-cost-ha], .cs-ha").forEach(x => x.remove());
    return c.outerHTML; }).join("\n");
  const f = fieldId && !exOn ? fields().find(x => x.id === fieldId) : null;
  const sub = [site ? pick(site.name) : "", f ? f.name + (f.size ? ` · ${num(f.size)} ha` : "") : "", new Date().toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB")].filter(Boolean).map(esc).join(" · ");
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => `<link rel="stylesheet" href="${esc(l.href)}">`).join("");
  return `<!doctype html><html lang="${lang}" data-theme="light"><head><meta charset="utf-8"><title>${esc(t("step5"))}</title>${links}
<style>
@page { size: A4; margin: 14mm }
html, body { background: #fff !important; color: #15302A; height: auto; overflow: visible }
body { margin: 0; padding: 0; font-family: "Be Vietnam Pro", system-ui, sans-serif; font-size: 11pt; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.pd-head { border-bottom: 2px solid #15302A; padding-bottom: 8px; margin-bottom: 14px }
.pd-head h1 { margin: 0; font-size: 18pt; line-height: 1.2 } .pd-head p { margin: 4px 0 0; font-size: 10pt; color: #44564F }
.pd > * + * { margin-top: 12px }
.pd, .pd * { animation: none !important; transition: none !important }
.pd .s4-st { height: auto; min-height: 52px } .pd .s4-what, .pd .s4-act { white-space: normal }
.pd .plan-ok, .pd .s4-path, .pd .s4m, .pd .s4-money, .pd .s4-need, .pd .box, .pd .need, .pd .cal-m, .pd #planWarn { break-inside: avoid; page-break-inside: avoid }
.pd .s4-need { padding: 10px 12px } .pd .s4-need ul { margin: 0 }
.pd .calendar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px }
.pd #planWarn[hidden] { display: none }
.pd .pd-sub { margin: 8px 0 6px; font-weight: 700; font-size: 11pt }
.print-doc .pd .cite, .print-doc .pd .src, .print-doc .pd .s-src { display: revert !important }   /* sources show in the printed copy */
.pd .disclaimer, .pd .copy4 { font-size: 8.5pt; color: #44564F }
</style></head><body class="${document.body.className.split(" ").filter(c => /^lang-/.test(c)).join(" ")} print-doc">
<header class="pd-head"><h1>${esc(t("step5"))}</h1><p>${sub}</p></header><main id="v4" class="view on pd">${parts}</main></body></html>`;
}
function printPlanDoc() {
  const html = planDocHTML(); if (!html) { window.print(); return }
  const fr = document.createElement("iframe"); fr.setAttribute("aria-hidden", "true"); fr.tabIndex = -1;
  fr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(fr);
  fr.onload = () => { const w = fr.contentWindow; const go = () => { try { w.focus(); w.print() } catch (e) { window.print() } setTimeout(() => fr.remove(), 1500) };
    (w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve()).then(() => setTimeout(go, 150)) };
  fr.srcdoc = html;
}
/* Printable copy of the plan as its own page: opens in the browser and asks to print (save as PDF there). */
async function printFile() {
  const msg = $("#shareMsg"), L = planLines(), e = x => String(x).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const body = L.map((x, i) => i === 0 ? `<h1>${e(x)}</h1>` : x === "" ? "" : x.startsWith("•") ? `<li>${e(x.slice(1).trim())}</li>` : `<p>${e(x)}</p>`).join("\n").replace(/(<li>[\s\S]*?<\/li>)(?![\s\S]*<li>)/, "$1</ul>").replace(/<li>/, "<ul><li>");
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(L[0])}</title>
<style>body{font:16px/1.55 "Be Vietnam Pro",system-ui,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#15302A;background:#fff}h1{font-size:24px}li{margin:6px 0}</style></head>
<body>${body}<script>addEventListener("load",function(){setTimeout(function(){print()},300)})<\/script></body></html>`;
  try { await dlApi.save({ filename: (lang === "vi" ? "ke-hoach-12-thang" : "12-month-plan") + ".html", data: html }); msg.textContent = t("savedPrint") }
  catch (err) { if (err && err.code === "declined") return; try { window.print() } catch (e2) {} }
  setTimeout(() => msg.textContent = "", 6000);
}
async function saveCopy() {
const msg = $("#saveMsg");
try {
const bin = Uint8Array.from(atob(copyB64.trim()), c => c.charCodeAt(0));
const html = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
await dlApi.save({ filename: "mekong-rotation-explorer.html", data: html }); msg.textContent = t("saved");
} catch (err) { if (err && err.code === "declined") return; msg.textContent = t("saveNo") }
setTimeout(() => msg.textContent = "", 4000);
}

/* ---------- per-công next to every per-ha money, seed and fertiliser figure (app fixes 17) ---------- */
const N = x => { x = x.trim().replace(/[.,]$/, ""); return lang === "vi" ? +x.replace(/\./g, "").replace(",", ".") : +x.replace(/,/g, "") };
const F = x => { const r = x >= 100 ? Math.round(x) : Math.round(x * 10) / 10; const v = r.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 1 }); return v };
const NUMRE = "\\d[\\d.,]*(?:\\s*[–-]\\s*\\d[\\d.,]*)?";
const per = range => range.split(/\s*[–-]\s*/).map(N).map(x => x / 10);
const kgTxt = r => r.every(x => x < 1) ? r.map(x => F(x * 1000)).join("–") + " g" : r.map(F).join("–") + " kg";
const NOT_AFTER = "(?!(?:\\/năm| a year)?\\s*\\((?:≈|,? ?khoảng|\\d|mỗi công|per công))";
const reList = new RegExp("((?:(?:N|P2O5|K2O|P|K)\\s+" + NUMRE + "(?:,\\s*|\\s*·\\s*))+(?:N|P2O5|K2O|P|K)\\s+" + NUMRE + ")\\s*kg\\/ha" + NOT_AFTER, "g");
const reKg = new RegExp("(" + NUMRE + ")\\s*kg( hạt)?\\/ha" + NOT_AFTER, "g");
const reMoney = new RegExp("(" + NUMRE + ")(?:\\s+(vs|so với)\\s+(" + NUMRE + "))?\\s*(M ₫|triệu đồng|triệu đ|triệu)\\/ha((?:\\/năm)|(?: a year))?" + NOT_AFTER, "g");
function cong(txt) {
if (txt.indexOf("/ha") < 0 || /\/công|mỗi công|per công/.test(txt)) return txt;
const vi = lang === "vi";
txt = txt.replace(reList, (all, list) => all + ` (${vi ? "mỗi công" : "per công"}: ${list.replace(new RegExp("\\b(N|P2O5|K2O|P|K)(\\s+)(" + NUMRE + ")", "g"), (m, lab, sp, v) => { const tail = /[.,]$/.test(v) ? v.slice(-1) : ""; return lab + sp + per(tail ? v.slice(0, -1) : v).map(F).join("–") + tail })} kg/công)`);
txt = txt.replace(reKg, (all, a) => all + (vi ? `, khoảng ${kgTxt(per(a))}/công` : ` (≈ ${kgTxt(per(a))}/công)`));
txt = txt.replace(reMoney, (all, a, vs, b) => {
const u = vi ? "triệu" : "M ₫";
return all + (vs ? ` (${vi ? "mỗi công khoảng" : "per công ≈"} ${per(a).map(F).join("–")} ${vs} ${per(b).map(F).join("–")} ${u})` : (vi ? `, khoảng ${per(a).map(F).join("–")} ${u}/công` : ` (≈ ${per(a).map(F).join("–")} ${u}/công)`));
});
return txt;
}
const SKIP = "script, style, svg, #sourceList, .cite, a, q, blockquote, textarea, input, select, #map, #planLab .pl-cong";
function walk(n) {
if (!n) return;
if (n.nodeType === 3) { const p = n.parentElement; if (p && !p.closest(SKIP)) { const v = cong(n.data); if (v !== n.data) n.data = v } return }
if (n.nodeType !== 1 || n.tagName === "IMG" || n.closest(SKIP)) return;
const it = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, { acceptNode: x => x.data.indexOf("/ha") >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
const list = []; let x; while ((x = it.nextNode())) list.push(x);
list.forEach(walk);
}

/* ---------- language, detail level, everything at once ---------- */
function renderAll() {
renderArea(); renderCards(true); renderTicker(); renderHead();
if (step === "lab" && drawerOpen()) { const L = PL(); if (L && L.refresh) { try { L.refresh() } catch (e) { console.warn("Lab.refresh", e) } } }
$$("#heroAreas [data-site], #areaHead [data-site]").forEach(b => b.setAttribute("aria-pressed", !!site && site.id === b.dataset.site));
}
function applyAll() {
document.documentElement.lang = lang;
const b = document.body;
b.classList.toggle("lang-vi", lang === "vi");
fillT();
$("#lEn").setAttribute("aria-pressed", lang === "en"); $("#lVi").setAttribute("aria-pressed", lang === "vi");
if (has("#ex3Btn")) setTxt($("#ex3Btn"), t("ex3Btn")(exName()));
$$(".ex3-ban").forEach(x => { x.hidden = !exOn; x.querySelector("span").textContent = t("ex3Ban")(exName()); x.querySelector("button").textContent = t("ex3Back") });
{ let dock = document.querySelector("#areaDock");  // phones: one-tap area buttons above the bottom strip (map pins are small there)
  if (!dock) { dock = document.createElement("nav"); dock.id = "areaDock"; document.body.appendChild(dock) }
  dock.setAttribute("aria-label", t("step1"));
  dock.innerHTML = `<span class="ad-l">${esc(t("navArea"))}</span>` + DATA.sites.map(s => `<button type="button" data-site="${s.id}" aria-pressed="${!!site && site.id === s.id}">${esc(shortName(s))}</button>`).join("") }
if (has("#heroAreas")) $("#heroAreas").outerHTML = areaButtons("hero-areas").replace('class="area-list hero-areas"', 'class="area-list hero-areas" id="heroAreas"');
if (!site) $("#readL").textContent = t("readPlan"); else if (!(ss && ss.speaking) && !ttsOn) $("#readL").textContent = t("readPlan");
mv("labels", lang);
$("#gearBtn").setAttribute("aria-label", tt("settings")); $("#setPanel").setAttribute("aria-label", tt("settings"));
$("#mClose").setAttribute("aria-label", t("closeBig")); $("#dClose").setAttribute("aria-label", t("drawerClose"));
netState(); renderSettings(); if (setOpen()) { const f = document.querySelector("#setBody button"); f && f.focus({ preventScroll: true }) }
renderAll(); priTexts(); markListen();
if (mKind === "plan" && ppCard) showPlan(ppCard.id); else if (mKind === "about") openAbout(); else if (mKind === "sources") openSources();
if (gi >= 0) setTimeout(() => guide(gi), 60);
if (step === "lab") { const L = PL(); if (L && L.refresh) { try { L.refresh() } catch (e) {} } }
walk(document.querySelector("#drawer")); walk(document.querySelector("#ticker"));
}
const EX_ID = "tran_de", exName = () => { const x = siteById(EX_ID); return x ? shortName(x) : "" };

/* ---------- one click handler for the whole page ---------- */
document.addEventListener("click", e => {
const T = e.target; if (!T.closest) return;
const c = sel => T.closest(sel);
let b;
/* cite marks open the numbered sources */
if ((b = c(".cite"))) { e.preventDefault(); openSources(b.dataset.src); return }
if ((b = c("[data-open]"))) { e.preventDefault(); b.dataset.open === "about" ? openAbout() : openSources(); return }
if (c("#aboutLink") || c('a[href="#about"]')) { e.preventDefault(); openAbout(); return }
if (c('a[href="#sources"]')) { e.preventDefault(); openSources(); return }
/* modal */
if (c("#mClose")) return closeModal();
if (T === modal()) return closeModal();
if (c("#ppKeep")) { closeModal(false); go(4); return }
if (c("#ppChange")) { const pc = ppCard, s = site; closeModal(false); const L = PL(); if (L && L.open && s) L.open(s.id, pc); else go("lab"); return }
if (c("#fCancel")) { pendingNext = false; return closeModal() }
if (c("#fTry")) { trySite = site && site.id; pendingNext = false; closeModal(); setTimeout(() => { go(2); setTimeout(() => { if (typeof Side !== "undefined" && Side.sub) Side.sub("a") }, 30) }, 80); return }
/* settings */
if (c("#gearBtn")) { toggleSettings(!setOpen()); return }
if (setOpen() && !c("#setPanel")) toggleSettings(false);
if ((b = c("[data-fm]"))) { setFm(b.dataset.fm, true); return }
if ((b = c("[data-size]"))) { setSize(b.dataset.size); return }
if ((b = c("[data-motion]"))) { setCalm(b.dataset.motion === "lite", true); return }
if ((b = c("[data-thm]"))) { const v = b.dataset.thm;   /* not data-theme: <html> carries that one */ if (v === "auto") { delete root.dataset.theme; drop("mre-theme") } else { root.dataset.theme = v; save("mre-theme", v) } renderSettings(); return }
if (c("#saveCopy")) { saveCopy(); return }
if ((b = c("[data-gd]"))) { guide(b.dataset.gd === "x" ? -1 : +b.dataset.gd); return }
/* top bar */
if (c("#lEn")) return setLang("en"); if (c("#lVi")) return setLang("vi");
/* hero */
if (c("#heroCta") || c("[data-pickarea]")) { if (c("[data-pickarea]")) closePanel(); pulsePins(); const m = document.querySelector("#map"); if (m) { if (!m.hasAttribute("tabindex")) m.setAttribute("tabindex", "-1"); m.focus({ preventScroll: true }) } return }
if (c("#ex3Btn")) { exGo = true; try { choose(siteById(EX_ID), true) } finally { exGo = false } exOn = true; mv("focus", EX_ID); applyAll(); go(2); return }
if (c("[data-ex3back]")) { exOn = false; closePanel(); pulsePins(); applyAll(); return }
if ((b = c("[data-site]"))) { const s = siteById(b.dataset.site); if (s) choose(s); return }
/* drawer and steps */
if (c("#dClose")) return closePanel();
if (c("#dPrev")) return go(step === "lab" ? 4 : step - 1);
if (c("#dNext")) return nextStep();
if (c("[data-golab]")) return openLab();
if ((b = c("[data-go]"))) { const g = b.dataset.go; go(g === "lab" ? "lab" : +g); return }
/* step 1 */
if ((b = c("#modeSeg [data-mode], #year [data-mode]"))) { mode = b.dataset.mode; renderAll(); return }
if ((b = c("[data-month]"))) { month = +b.dataset.month; renderSeason(); const f = document.querySelector(`#season [data-month="${month}"]`); f && f.focus(); return }
if (c("#saveArea")) { openFieldForm(site && site.id); return }
if (c("#cfYes")) { if (exOn) exOn = false; go(2); return }
if (c("#cfNo")) { closePanel(); pulsePins(); return }
if ((b = c("[data-sheetplan]"))) { planId = b.dataset.sheetplan; renderCards(false); setTimeout(() => go(4), 120); return }
/* step 2 */
if ((b = c("[data-wf]"))) { if (b.dataset.wf === "p") wfP = +b.dataset.v; else wfM = +b.dataset.v; save("mre-wf2", JSON.stringify({ p: wfP, m: wfM }));
if (typeof RX !== "undefined" && RX.Model && RX.Model.set) RX.Model.set("labour", labourPen() >= 0.3 ? "short" : "enough"); renderAll(); renderWorkforce(); return }
if ((b = c("#growNow [data-szex]"))) { seasons = b.dataset.szex.split(""); cur = curFrom(seasons); curPicked = true; planId = null;
if (fieldId) { const f = fields().find(x => x.id === fieldId); if (f) { f.seasons = seasons.slice(); f.cur = cur; saveFields() } }
renderAll(); renderSeasons(); return }
if ((b = c("#growNow [data-season]"))) { seasons[+b.dataset.season] = b.dataset.sc; cur = curFrom(seasons); curPicked = true; planId = null;
if (fieldId) { const f = fields().find(x => x.id === fieldId); if (f) { f.seasons = seasons.slice(); f.cur = cur; saveFields() } }
renderAll(); return }
if ((b = c("[data-goal15]"))) { wPicked = true; Object.entries(GOALS[b.dataset.goal15]).forEach(([k, v]) => setW(k, v)); $$("[data-goal15]").forEach(x => x.setAttribute("aria-pressed", x === b)); priTexts(); return }
if ((b = c("[data-tk]"))) { wPicked = true; const k = b.dataset.tk; setW(k, b.dataset.v != null ? +b.dataset.v : Math.round(w[k]) + +b.dataset.d); $$("[data-goal15]").forEach(x => x.setAttribute("aria-pressed", "false")); priTexts(); return }
if ((b = c("[data-best]"))) { planId = b.dataset.best; renderCards(false); setTimeout(() => go(4), 120); return }
/* step 3 */
if ((b = c("[data-listen]"))) { e.preventDefault(); listen(b.dataset.listen); return }
if ((b = c("[data-crop]"))) { upCrop = b.dataset.crop; renderCards(false); return }
if (c("#more15")) { document.body.classList.toggle("more15"); renderCards(false); return }
if ((b = c("#cards .plan-btn"))) { planId = b.dataset.plan; renderCards(false); setTimeout(() => go(4), 120); return }
if (!c("details, a, .cite, button") && (b = c("#cards [data-plan]"))) { planId = b.dataset.plan; renderCards(false); setTimeout(() => go(4), 120); return }
/* step 4 */
if (c("#printPlan")) { if (dlApi) { printFile(); return } printPlanDoc(); return }
if (c("#sharePlan")) { sharePlan(); return }
if (c("#readPlan")) { readPlan(); return }
if ((b = c("#planView [data-pv]"))) { setPv(b.dataset.pv); return }
if (c("#ppRev")) { const a = document.querySelector("#cards .card.isplan"); if (a) showPlan(a.dataset.id); return }
/* step 2: your fields */
if (c("#addField")) { openFieldForm(site && site.id); return }
if ((b = c("[data-edit]"))) { openFieldForm(null, fields().find(f => f.id === b.dataset.edit)); return }
if ((b = c("[data-del]"))) { removeField(b.dataset.del); return }
if ((b = c("[data-field]"))) { exOn = false; const f = fields().find(x => x.id === b.dataset.field); openField(b.dataset.field); if (f) mv("focus", f.site); return }
});
document.addEventListener("change", e => {
if (e.target.matches && e.target.matches("#noBrackish")) renderAll();
if (e.target.closest && e.target.closest("#fieldForm")) formChecks();
});
document.addEventListener("input", e => {
if (e.target.closest && e.target.closest("#fieldForm")) { formChecks(); if (e.target.hasAttribute("aria-invalid")) { e.target.removeAttribute("aria-invalid"); fErr("") } }

});
document.addEventListener("submit", e => { if (e.target.id === "fieldForm") { e.preventDefault(); submitField() } });
document.addEventListener("keydown", e => {
if (e.key === "Escape") {
if (modalOpen()) { e.preventDefault(); return closeModal() }
if (setOpen()) { toggleSettings(false); const g = document.querySelector("#gearBtn"); g && g.focus(); return }
if (gi >= 0) return guide(-1);
if (drawerOpen()) return closePanel();
return;
}
if (e.key === "Tab" && modalOpen()) {   /* keep focus inside the modal (part 11) */
const f = $$("#modal button, #modal a[href], #modal input, #modal select, #modal [tabindex]:not([tabindex='-1'])").filter(x => x.offsetParent !== null);
if (!f.length) return; const a = f[0], z = f[f.length - 1];
if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
}
});

/* ---------- start ---------- */
window.App = { refresh: () => renderAll(), fieldId: () => fieldId, cur: () => cur, ranked, planId: () => planId, V, t, lang: () => lang, site: () => site, go, toast, mode: () => mode, weights: () => ({ ...w }), upCrop: () => upCrop, guide, openPanel, closePanel, hasField: () => hasField(), example: () => exOn, askField: () => askField(),
  fields: () => fields(), removeField, planDoc: () => planDocHTML(), openField: id => openField(id), openFieldForm: siteId => openFieldForm(siteId), startAdd: on => { adding = on; if (on) fieldId = null } };
function start() {
ensureSkeleton(); buildExtras();
(document.querySelector("#brand") || document.body).appendChild(offChip);
addEventListener("online", netState); addEventListener("offline", netState);
const m = modal(); if (m) { m.addEventListener("cancel", e => { e.preventDefault(); closeModal() }); if (!m.open && !m.classList.contains("open")) m.hidden = true }
const d = document.querySelector("#drawer"); if (d && !document.body.classList.contains("drawer-open")) d.inert = true;
if (coarse.addEventListener) coarse.addEventListener("change", () => { renderHead(); renderArea() });
initSliders();
let sz = load("mre-text"); setSize(sz === "big" || sz === "small" ? sz : "n");
const mo = load("mre-motion"); setCalm(mo ? mo === "lite" : still, false);
setFm(fm, false); setPv(pv);
/* the map; without Leaflet or MapView the hero offers plain area buttons so the app still works */
let mapOk = false;
if (MV() && window.L) { try { MV().init(document.querySelector("#map"), DATA.sites, { onHover, onSelect }); mapOk = true } catch (e) { console.warn("MapView.init", e) } }
if (mapOk) {  // re-fit once fonts and the phone area row have their real size, and after rotating the phone
  const refit = () => { if (!site && !document.body.classList.contains("drawer-open")) MV().home() };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(refit, 60));
  let rz = 0; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(refit, 250) });
}
if (!mapOk && has("#hero") && !has("#heroAreas")) { $("#hero").insertAdjacentHTML("beforeend", areaButtons("hero-areas").replace('class="area-list hero-areas"', 'class="area-list hero-areas" id="heroAreas"')); document.body.classList.add("no-map") }
applyAll(); restoreField();
new MutationObserver(ms => ms.forEach(x => x.addedNodes.forEach(walk))).observe(document.body, { childList: true, subtree: true });
const hash = () => { const h = location.hash; if (h === "#plan-lab") go("lab"); else if (h === "#about") openAbout(); else if (h === "#sources") openSources() };
addEventListener("hashchange", hash); hash();
let rt = 0; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { const hc = document.querySelector("#hoverCard"); if (hc) hc.classList.remove("show") }, 120) });
}
if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(start); else start();
})();

addEventListener("beforeprint", () => { document.querySelectorAll("#v4 details").forEach(d => { d.open = true }) });

/* Narrow phones (about 360px and less): the top bar wraps to two rows. --top-h then follows its real height,
   so the dashboard, drawer and map controls start below it instead of under it. */
(() => {
  const tb = document.getElementById("topbar"); if (!tb) return;
  const root = document.documentElement, phone = window.matchMedia ? matchMedia("(max-width: 760px)") : null;
  const set = () => { const h = Math.round(tb.getBoundingClientRect().height);
    if (phone && phone.matches && h > 57) root.style.setProperty("--top-h", h + "px"); else root.style.removeProperty("--top-h") };
  if (window.ResizeObserver) new ResizeObserver(set).observe(tb);
  addEventListener("resize", set); set();
})();
