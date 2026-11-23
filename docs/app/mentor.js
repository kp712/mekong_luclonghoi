/* mentor.js (Draft 7): the mentor's feedback in one "Tools" hub (dialog #hub), so the Draft 5 flow stays untouched.
   Tabs: My field (field details, crew and money, one simple answer) · Rice varieties (names and salt tolerance, with
   the varieties documented per area) · Check sources (every data part, with link, quote, verified flag) ·
   What colours mean · Feedback (farmer reports + the on-device learner, see learn.js) · Live data (calls from the browser,
   falls back to the shipped snapshot with its date).
   Data: RESEARCH (research/varieties.json, research/live-data.json, inlined by build.py), COSTS, RX.DATA, Learn, Cost.
   Salinity is never satellite-measured: it is always labelled an estimate from public reports. */
const Hub = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lang = () => (typeof App !== "undefined" && App.lang ? App.lang() : "vi");
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang()] || o.en || "");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const R = () => (typeof RESEARCH !== "undefined" ? RESEARCH : {});
  const VAR = () => R().varieties || { areas: [], varieties: [], gaps: [] };
  const LIVE = () => R().live || { feeds: [], snapshot: {}, bulletins: [], gaps: [] };
  const D = () => (typeof RX !== "undefined" ? RX.DATA : null);
  const nf = (n, d = 0) => (n == null || isNaN(n) ? "–" : (+n).toLocaleString(lang() === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: d }));
  const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; };
  const T = {
    btn: { vi: "Công cụ", en: "Tools" }, close: { vi: "Đóng", en: "Close" },
    tabs: { field: { vi: "Ruộng của tôi", en: "My field" }, var: { vi: "Giống lúa", en: "Rice varieties" }, src: { vi: "Kiểm tra nguồn", en: "Check sources" },
            col: { vi: "Ý nghĩa màu", en: "Colours" }, fb: { vi: "Phản hồi", en: "Feedback" }, live: { vi: "Dữ liệu mới", en: "Live data" } },
    area: { vi: "Khu vực", en: "Area" }, rot: { vi: "Luân canh bạn đang làm hoặc muốn làm", en: "Rotation you do or want" },
    variety: { vi: "Giống lúa", en: "Rice variety" }, anyVar: { vi: "Chưa chọn", en: "Not chosen" },
    ha: { vi: "Diện tích (ha)", en: "Field size (ha)" }, salt: { vi: "Độ mặn nước bạn đo được (‰, nếu có)", en: "Salt you measured in your water (‰, if any)" },
    crew: { vi: "Số người làm", en: "People working" }, budget: { vi: "Vốn có (triệu ₫)", en: "Money you have (million ₫)" },
    labour: { vi: "Công làm cho 1 ha mỗi vụ (hỏi hợp tác xã)", en: "Work-days for 1 ha per crop (ask your cooperative)" },
    ansH: { vi: "Kết quả cho ruộng bạn", en: "Result for your field" },
    loss: { vi: "Thiệt hại do mặn có thể xảy ra", en: "Possible salt loss" },
    measured: { vi: "Tính từ độ mặn bạn đo (công thức FAO)", en: "From the salt you measured (FAO formula)" },
    forecast: { vi: "Dự báo của ứng dụng (ước tính, không phải vệ tinh đo)", en: "App forecast (an estimate, not measured by satellite)" },
    learned: { vi: (n) => `Đã chỉnh theo ${n} phản hồi của nông dân`, en: (n) => `Adjusted by ${n} farmer reports` },
    notLearned: { vi: (n, m) => `Mới có ${n}/${m} phản hồi, chưa đủ để chỉnh dự báo`, en: (n, m) => `${n}/${m} reports so far, not enough to adjust the forecast yet` },
    range: { vi: "khoảng", en: "range" },
    money: { vi: "Tiền vốn cần (công bố)", en: "Money needed (published)" },
    cover: { vi: (h) => `Vốn của bạn đủ cho khoảng ${h} ha`, en: (h) => `Your money covers about ${h} ha` },
    short: { vi: (h) => `Vốn chưa đủ cho ${h} ha, thiếu khoảng`, en: (h) => `Not enough money for ${h} ha, short by about` },
    mil: { vi: "triệu ₫", en: "million ₫" },
    days: { vi: (d, p) => `Cần khoảng ${d} công, ${p} người làm trong khoảng ${Math.ceil(d / Math.max(1, p))} ngày`, en: (d, p) => `About ${d} work-days: ${p} people need about ${Math.ceil(d / Math.max(1, p))} days` },
    labNote: { vi: "Công lao động do bạn nhập, ứng dụng không có số công bố.", en: "Work-days come from you; the app has no published figure." },
    noPlan: { vi: "Chọn khu vực trước.", en: "Choose an area first." },
    varNote: { vi: "Biết giống nào được trồng ở khu vực không cho biết nước tưới mặn tới đâu thì lúa vẫn ổn. Chỉ số mặn nêu dưới đây là số công bố, kèm giai đoạn sinh trưởng.", en: "Knowing which variety is grown in an area does not tell you how salty the water may be while the rice grows. Salt figures below are published ones, with growth stage." },
    grown: { vi: "Được trồng ở", en: "Grown in" }, tol: { vi: "Chịu mặn (số công bố)", en: "Salt tolerance (published)" }, noFig: { vi: "chưa có số công bố", en: "no published figure" },
    verified: { vi: "đã kiểm tra", en: "checked" }, unverified: { vi: "chưa kiểm tra", en: "not checked" },
    quote: { vi: "Trích", en: "Quote" }, open: { vi: "Mở nguồn", en: "Open source" },
    srcLead: { vi: "Mỗi phần dữ liệu có nguồn riêng. Chạm vào để mở trang gốc và đọc đúng câu trích.", en: "Every data part has its own sources. Open the page and read the quoted line yourself." },
    conf: { low: { vi: "Mức chắc chắn: thấp", en: "Confidence: low" }, medium: { vi: "Mức chắc chắn: trung bình", en: "Confidence: medium" }, high: { vi: "Mức chắc chắn: cao", en: "Confidence: high" } },
    colLead: { vi: "Mỗi màu trong ứng dụng có một nghĩa.", en: "Each colour in the app has one meaning." },
    fbLead: { vi: "Bạn đã thử kế hoạch? Cho chúng tôi biết kết quả để dự báo gần ruộng bạn hơn. Dữ liệu ở lại trên máy bạn.", en: "Tried the plan? Tell us what happened so the forecast fits fields like yours. Your data stays on this device." },
    q1: { vi: "Vụ này ruộng bạn bị thiệt hại do mặn bao nhiêu?", en: "How much did salt cost you this crop?" },
    loss0: { vi: "Không", en: "None" }, loss1: { vi: "Ít (khoảng 10%)", en: "A little (about 10%)" }, loss2: { vi: "Vừa (khoảng 30%)", en: "Some (about 30%)" }, loss3: { vi: "Nhiều (khoảng 60%)", en: "A lot (about 60%)" },
    q2: { vi: "Kế hoạch này có hợp với ruộng bạn không?", en: "Did this plan suit your field?" }, yes: { vi: "Hợp", en: "Yes" }, no: { vi: "Không hợp", en: "No" }, yes2: { vi: "Có", en: "Yes" }, no2: { vi: "Không", en: "No" },
    q3: { vi: "Bạn có phải đổi cách làm không?", en: "Did you have to change what you did?" },
    note: { vi: "Ghi chú (không nhập tên hay số điện thoại)", en: "Note (no names or phone numbers)" },
    send: { vi: "Lưu phản hồi", en: "Save feedback" }, saved: { vi: "Đã lưu. Cảm ơn bạn!", en: "Saved. Thank you!" },
    learnH: { vi: "Ứng dụng đang học gì", en: "What the app has learned" },
    learnP: { vi: "Mô hình đối chiếu dự báo mặn với kết quả thật bạn báo và chỉnh dần. Ít phản hồi thì gần như giữ nguyên dự báo. Chạy ngay trên máy bạn.", en: "The model compares the salt forecast with the results you report and shifts slowly. With few reports it keeps the forecast. It runs on your device." },
    nothing: { vi: "Chưa có phản hồi nào.", en: "No reports yet." },
    shift: { vi: (a, d) => `${a}: dự báo ${d > 0 ? "thấp hơn" : "cao hơn"} thực tế khoảng ${Math.abs(d)} điểm %`, en: (a, d) => `${a}: the forecast runs ${Math.abs(d)} points ${d > 0 ? "low" : "high"}` },
    shiftOk: { vi: (a) => `${a}: dự báo đang khớp`, en: (a) => `${a}: forecast fits so far` },
    worked: { vi: "Tỉ lệ \"hợp\" theo khu vực", en: "\"Suited\" rate by area" },
    pool: { vi: "Gộp phản hồi của nhiều người", en: "Pool reports from several people" },
    poolP: { vi: "Không có máy chủ: sao chép mã bên dưới gửi qua Zalo cho nhóm, hoặc dán mã nhận được rồi bấm Gộp.", en: "No server: copy the code below and send it by Zalo, or paste a code you received and press Merge." },
    copy: { vi: "Sao chép", en: "Copy" }, merge: { vi: "Gộp", en: "Merge" }, copied: { vi: "Đã sao chép", en: "Copied" }, merged: { vi: (n) => `Đã thêm ${n} phản hồi`, en: (n) => `Added ${n} reports` },
    del: { vi: "Xóa", en: "Delete" },
    liveLead: { vi: "Dữ liệu tải trực tiếp từ nguồn công khai khi có mạng. Khi mất mạng, ứng dụng dùng số liệu lưu sẵn và ghi rõ ngày.", en: "Data is fetched from public sources when online. Offline, the app uses the saved snapshot and shows its date." },
    liveRain: { vi: "Dự báo mưa 7 ngày (Open-Meteo)", en: "7-day rain forecast (Open-Meteo)" }, mm: { vi: "mm", en: "mm" },
    asOf: { vi: "tính đến", en: "as of" }, fetching: { vi: "Đang tải…", en: "Loading…" }, offline: { vi: "Không tải được, dùng số liệu lưu sẵn", en: "Could not load; showing the saved snapshot" },
    bull: { vi: "Bản tin mặn mới nhất", en: "Latest salt bulletins" },
    saltNote: { vi: "Độ mặn luôn là ước tính từ báo cáo công khai, không phải vệ tinh đo.", en: "Salinity is always an estimate from public reports, not measured by satellite." }
  };
  const LEG = [
    ["--rice", { vi: "Lúa", en: "Rice" }, { vi: "Tháng trồng lúa", en: "Months with a rice crop" }],
    ["--upland", { vi: "Cây màu", en: "Upland crop" }, { vi: "Tháng trồng màu (bắp, dưa…)", en: "Months with maize, melon or another upland crop" }],
    ["--shrimp", { vi: "Tôm", en: "Shrimp" }, { vi: "Tháng nuôi tôm", en: "Months with shrimp" }],
    ["--rest", { vi: "Nghỉ", en: "Rest" }, { vi: "Đất nghỉ, không trồng", en: "Land rests, no crop" }],
    ["--salt", { vi: "Mặn / rủi ro", en: "Salt / risk" }, { vi: "Mặn cao hoặc thiệt hại có thể xảy ra", en: "High salt or possible loss" }],
    ["--rain", { vi: "Mưa", en: "Rain" }, { vi: "Lượng mưa tháng (CHIRPS)", en: "Monthly rain (CHIRPS)" }],
    ["--gold", { vi: "Vàng", en: "Gold" }, { vi: "Điểm nhấn: chọn hoặc chú ý", en: "Highlight: selected or look here" }],
    ["--ok", { vi: "Ổn", en: "OK" }, { vi: "Điều kiện đạt", en: "Check passed" }]
  ];
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#999";

  /* ----- shared selection ----- */
  const sel = Object.assign({ area: null, rot: null, variety: "" }, store("mre-sel") || {});
  const sites = () => (D() ? D().sites : []);
  const site = () => sites().find((s) => s.id === sel.area) || (window.App && App.site && App.site()) || sites()[0];
  const cardsOf = (s) => (s && s.cards) || [];
  const nameOf = (s) => { try { return RX.Core.short(RX.Core.site(s.id)); } catch (e) { return s.id; } };
  const cardName = (c) => L(c.name) || c.id;

  /* ----- tab: my field ----- */
  const FAO = (ppt) => { const ec = ppt <= 3.2 ? ppt / 0.64 : ppt / 0.8; return Math.min(100, Math.max(0, 12 * (ec - 3))); };
  function fieldHTML() {
    const s = site(); if (!s) return `<p class="ph">${L(T.noPlan)}</p>`;
    const cs = cardsOf(s); if (!cs.find((c) => c.id === sel.rot)) sel.rot = (cs[0] || {}).id;
    const f = store("mre-household") || {};
    const opt = (v, t, cur) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(t)}</option>`;
    const vars = VAR().varieties.map((v) => opt(v.id, v.name, sel.variety)).join("");
    return `<div class="hb-form">
      <label>${L(T.area)}<select id="hbArea">${sites().map((x) => opt(x.id, nameOf(x), s.id)).join("")}</select></label>
      <label>${L(T.rot)}<select id="hbRot">${cs.map((c) => opt(c.id, cardName(c), sel.rot)).join("")}</select></label>
      <label>${L(T.variety)}<select id="hbVar">${opt("", L(T.anyVar), sel.variety)}${vars}</select></label>
      <div class="hb-row">
        <label>${L(T.ha)}<input id="hbHa" type="number" inputmode="decimal" min="0" step="0.1" value="${f.ha ?? ""}"></label>
        <label>${L(T.salt)}<input id="hbSalt" type="number" inputmode="decimal" min="0" step="0.1" value="${f.salt ?? ""}"></label>
      </div>
      <div class="hb-row">
        <label>${L(T.crew)}<input id="hbCrew" type="number" inputmode="numeric" min="1" step="1" value="${f.crew ?? ""}"></label>
        <label>${L(T.budget)}<input id="hbBud" type="number" inputmode="decimal" min="0" step="1" value="${f.bud ?? ""}"></label>
      </div>
      <label>${L(T.labour)}<input id="hbLab" type="number" inputmode="decimal" min="0" step="1" value="${f.lab ?? ""}"></label>
    </div><div id="hbAns" class="hb-ans"></div>`;
  }
  function paintAnswer() {
    const host = $("#hbAns"); if (!host) return;
    const s = site(), c = cardsOf(s).find((x) => x.id === sel.rot), f = store("mre-household") || {};
    if (!s || !c) { host.innerHTML = ""; return; }
    let out = "";
    const P = RX.Model.predict(c, s.id), fc = Math.round(P.blend);
    const salt = f.salt != null && f.salt !== "" ? +f.salt : null;
    const rice = c.months.some((m) => m[0] === "R");
    let base = fc, src = L(T.forecast);
    if (salt != null && rice) { base = Math.round(FAO(salt)); src = L(T.measured); }
    const A = Learn.adjust(base, s.id), mid = A.ready ? A.adj : base;
    const lvl = mid < 10 ? "ok" : mid < 30 ? "mid" : "bad";
    out += `<div class="hb-big ${lvl}"><span>${L(T.loss)}</span><b>${mid}%</b>${A.ready ? `<em>${L(T.range)} ${A.lo}–${A.hi}%</em>` : ""}</div>
      <p class="hb-sub">${src}${A.ready ? `<br>${L(T.learned)(A.n)}` : `<br>${L(T.notLearned)(A.n, Learn.MIN_N)}`}</p>`;
    if (typeof Cost !== "undefined") {
      const k = Cost.calc(c), ha = +f.ha || 0;
      if (k && k.cost) {
        out += `<div class="hb-line"><span>${L(T.money)}</span><b>${nf(k.cost, 1)} ${L(T.mil)} / ha</b></div>`;
        if (ha) out += `<div class="hb-line"><span>× ${nf(ha, 1)} ha</span><b>${nf(k.cost * ha, 1)} ${L(T.mil)}</b></div>`;
        if (f.bud) { const cov = f.bud / k.cost; out += cov >= ha && ha ? `<p class="hb-ok">${L(T.cover)(nf(cov, 1))}</p>` : ha ? `<p class="hb-bad">${L(T.short)(nf(ha, 1))} ${nf(k.cost * ha - f.bud, 1)} ${L(T.mil)}</p>` : `<p class="hb-ok">${L(T.cover)(nf(cov, 1))}</p>`; }
      }
    }
    if (f.lab && f.ha) { const d = Math.round(f.lab * f.ha); out += `<p class="hb-sub">${L(T.days)(d, +f.crew || 1)}<br><small>${L(T.labNote)}</small></p>`; }
    out += `<p class="hb-note">${L(T.saltNote)}</p>`;
    host.innerHTML = out;
  }
  function wireField() {
    const upd = () => {
      sel.area = $("#hbArea").value; sel.rot = $("#hbRot").value; sel.variety = $("#hbVar").value; store("mre-sel", sel);
      store("mre-household", { ha: $("#hbHa").value, salt: $("#hbSalt").value, crew: $("#hbCrew").value, bud: $("#hbBud").value, lab: $("#hbLab").value });
      paintAnswer();
    };
    $$("#hbBody input, #hbBody select").forEach((e) => e.addEventListener("input", upd));
    $("#hbArea").addEventListener("change", () => { sel.area = $("#hbArea").value; sel.rot = null; show("field"); });
    paintAnswer();
  }

  /* ----- tab: varieties ----- */
  function varietyHTML() {
    const V = VAR(), vs = V.varieties || [];
    const areaOf = (id) => (V.areas || []).filter((a) => (a.varieties || []).some((x) => String(x).toLowerCase().replace(/\s/g, "") === String(id).toLowerCase().replace(/\s/g, "")));
    const row = (v) => {
      const where = areaOf(v.id).map((a) => L({ vi: a.area_vi, en: a.area_en })).join(", ");
      const tol = (v.tolerance || []).length
        ? v.tolerance.map((t) => `<li><b>${esc(t.stage || "")}</b> ${esc(t.salt_ppt_or_note || "")}${t.effect ? ` · ${esc(t.effect)}` : ""} ${t.source_url ? `<a href="${esc(t.source_url)}" target="_blank" rel="noopener">${L(T.open)}</a>` : ""}${badge(t.verified)}</li>`).join("")
        : `<li class="ph">${L(T.noFig)}</li>`;
      return `<details class="hb-card"><summary><b>${esc(v.name)}</b>${v.duration_days ? `<small>${esc(v.duration_days)} ${lang() === "vi" ? "ngày" : "days"}</small>` : ""}${v.yield_t_ha ? `<small>${esc(v.yield_t_ha)} t/ha</small>` : ""}</summary>
        ${where ? `<p><span class="hb-k">${L(T.grown)}</span> ${esc(where)}</p>` : ""}
        <p class="hb-k">${L(T.tol)}</p><ul>${tol}</ul>${v["notes_" + lang()] ? `<p>${esc(v["notes_" + lang()])}</p>` : ""}</details>`;
    };
    const areaCards = (V.areas || []).map((a) => `<details class="hb-card"><summary><b>${esc(L({ vi: a.area_vi, en: a.area_en }))}</b><small>${esc((a.varieties || []).join(", ") || L(T.anyVar))}</small>${a.confidence ? `<small class="cf-${esc(a.confidence)}">${T.conf[a.confidence] ? L(T.conf[a.confidence]) : esc(a.confidence)}</small>` : ""}</summary>
      <p>${esc(L({ vi: a.summary_vi, en: a.summary_en }))}</p>${srcList(a.sources)}</details>`).join("");
    return `<p class="hb-lead">${L(T.varNote)}</p>${vs.length ? vs.map(row).join("") : `<p class="ph">${L(T.noFig)}</p>`}<h3>${L({ vi: "Theo khu vực", en: "By area" })}</h3>${areaCards}`;
  }
  const badge = (v) => ` <span class="hb-b ${v ? "ok" : "no"}">${L(v ? T.verified : T.unverified)}</span>`;
  const srcList = (arr) => (arr && arr.length ? `<ul class="hb-src">${arr.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.publisher || s.url)}</a>${badge(s.verified)}<small>${esc([s.publisher, s.date].filter(Boolean).join(" · "))}</small>${s.quote ? `<q>${esc(s.quote)}</q>` : ""}</li>`).join("")}</ul>` : "");

  /* ----- tab: check sources ----- */
  function sourcesHTML() {
    const groups = [];
    const d = D();
    if (d && d.sources) groups.push({ h: { vi: "Dữ liệu NASA và hướng dẫn FAO", en: "NASA data and FAO guidance" }, items: d.sources.map((s) => ({ title: L(s.title), url: s.url, verified: s.verified })) });
    if (typeof COSTS !== "undefined" && COSTS.figures) groups.push({ h: { vi: "Chi phí và lợi nhuận", en: "Costs and profit" }, items: COSTS.figures.map((f) => ({ title: `${f.key} · ${f.place} (${f.year})`, url: f.source && f.source.url, publisher: f.source && f.source.publisher, quote: f.source && f.source.quote, verified: !!(f.source && f.source.url) })) });
    (VAR().areas || []).forEach((a) => groups.push({ h: { vi: "Giống lúa: " + a.area_vi, en: "Varieties: " + a.area_en }, items: a.sources }));
    if ((LIVE().bulletins || []).length) groups.push({ h: T.bull, items: LIVE().bulletins });
    return `<p class="hb-lead">${L(T.srcLead)}</p>` + groups.map((g) => `<details class="hb-card"><summary><b>${esc(L(g.h))}</b><small>${(g.items || []).length}</small></summary>${srcList(g.items)}</details>`).join("");
  }

  /* ----- tab: colours ----- */
  const colourHTML = () => `<p class="hb-lead">${L(T.colLead)}</p><ul class="hb-leg">${LEG.map((l) => `<li><i style="background:${css(l[0])}"></i><div><b>${L(l[1])}</b><span>${L(l[2])}</span></div></li>`).join("")}</ul><p class="hb-note">${L(T.saltNote)}</p>`;

  /* ----- tab: feedback + learning ----- */
  let picked = { loss: null, ok: null, changed: null };
  function feedbackHTML() {
    const s = site(), cs = cardsOf(s), seg = (k, items) => `<div class="hb-seg" data-k="${k}">${items.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${String(picked[k]) === String(v)}">${L(t)}</button>`).join("")}</div>`;
    return `<p class="hb-lead">${L(T.fbLead)}</p>
      <label>${L(T.area)}<select id="hbArea">${sites().map((x) => `<option value="${esc(x.id)}"${x.id === (s && s.id) ? " selected" : ""}>${esc(nameOf(x))}</option>`).join("")}</select></label>
      <label>${L(T.rot)}<select id="hbRot">${cs.map((c) => `<option value="${esc(c.id)}"${c.id === sel.rot ? " selected" : ""}>${esc(cardName(c))}</option>`).join("")}</select></label>
      <p class="hb-q">${L(T.q1)}</p>${seg("loss", [["none", T.loss0], ["little", T.loss1], ["some", T.loss2], ["most", T.loss3]])}
      <p class="hb-q">${L(T.q2)}</p>${seg("ok", [["true", T.yes], ["false", T.no]])}
      <p class="hb-q">${L(T.q3)}</p>${seg("changed", [["true", T.yes2], ["false", T.no2]])}
      <label>${L(T.note)}<textarea id="hbNote" rows="2" maxlength="280"></textarea></label>
      <button class="btn gold" id="hbSend" type="button">${L(T.send)}</button><p id="hbMsg" class="hb-msg" role="status"></p>
      <div id="hbLearn"></div>`;
  }
  function paintLearn() {
    const host = $("#hbLearn"); if (!host) return;
    const rs = Learn.all(), m = Learn.fit(), lines = [];
    sites().forEach((s) => {
      const n = rs.filter((r) => r.area === s.id).length; if (!n) return;
      const a = Learn.adjust(50, s.id, m), d = a.adj - 50;
      lines.push(`<li>${Math.abs(d) < 4 || !a.ready ? L(T.shiftOk)(nameOf(s)) : L(T.shift)(nameOf(s), d)} <small>(${n})</small></li>`);
    });
    const rate = sites().map((s) => { const w = Learn.worked(s.id, sel.rot, rs); return w.n ? `<li>${esc(nameOf(s))}: ${Math.round(w.rate * 100)}% <small>(${w.n})</small></li>` : ""; }).join("");
    host.innerHTML = `<h3>${L(T.learnH)}</h3><p class="hb-lead">${L(T.learnP)}</p>
      ${rs.length ? `<ul class="hb-gap">${lines.join("") || ""}</ul>${rate ? `<p class="hb-k">${L(T.worked)}</p><ul class="hb-gap">${rate}</ul>` : ""}
      <p class="hb-k">${rs.length} ${lang() === "vi" ? "phản hồi" : "reports"}</p>` : `<p class="ph">${L(T.nothing)}</p>`}
      <h3>${L(T.pool)}</h3><p class="hb-lead">${L(T.poolP)}</p>
      <textarea id="hbCode" rows="3" readonly>${esc(Learn.exportText())}</textarea>
      <div class="hb-row"><button class="btn sm" id="hbCopy" type="button">${L(T.copy)}</button><button class="btn sm" id="hbMerge" type="button">${L(T.merge)}</button></div>`;
    $("#hbCopy").onclick = () => { const t = $("#hbCode"); t.select(); try { navigator.clipboard.writeText(t.value); } catch (e) { document.execCommand("copy"); } $("#hbMsg").textContent = L(T.copied); };
    $("#hbMerge").onclick = () => { const t = $("#hbCode"); t.readOnly = false; if (t.dataset.armed === "1") { const r = Learn.importText(t.value); $("#hbMsg").textContent = L(T.merged)(r.added || 0); show("fb"); } else { t.value = ""; t.dataset.armed = "1"; t.placeholder = "{…}"; t.focus(); } };
  }
  function wireFeedback() {
    $$(".hb-seg").forEach((g) => g.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; picked[g.dataset.k] = b.dataset.v; $$("button", g).forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
    $("#hbArea").addEventListener("change", () => { sel.area = $("#hbArea").value; sel.rot = null; store("mre-sel", sel); show("fb"); });
    $("#hbRot").addEventListener("change", () => { sel.rot = $("#hbRot").value; store("mre-sel", sel); paintLearn(); });
    $("#hbSend").onclick = () => {
      const s = site(), c = cardsOf(s).find((x) => x.id === sel.rot), msg = $("#hbMsg");
      if (!c || picked.loss == null) { msg.textContent = L(T.q1); return; }
      const f = store("mre-household") || {}, P = RX.Model.predict(c, s.id);
      Learn.add({ area: s.id, rot: c.id, variety: sel.variety || null, pred: Math.round(P.blend), lossKey: picked.loss,
                  ok: picked.ok == null ? undefined : picked.ok === "true", changed: picked.changed == null ? undefined : picked.changed === "true",
                  note: ($("#hbNote").value || "").slice(0, 280) });
      picked = { loss: null, ok: null, changed: null }; msg.textContent = L(T.saved); show("fb"); $("#hbMsg").textContent = L(T.saved);
    };
    paintLearn();
  }

  /* ----- tab: live data ----- */
  const LIVEKEY = "mre-live";
  async function loadRain(s) {
    const lat = s.lat ?? (s.coords && s.coords[0]), lon = s.lon ?? s.lng ?? (s.coords && s.coords[1]);
    if (lat == null || lon == null) throw new Error("no coords");
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&forecast_days=7&timezone=Asia%2FBangkok`;
    const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error(r.status);
    const j = await r.json(), out = { at: new Date().toISOString().slice(0, 10), days: j.daily.time, mm: j.daily.precipitation_sum };
    const all = store(LIVEKEY) || {}; all[s.id] = out; store(LIVEKEY, all); return out;
  }
  function liveHTML() {
    const snap = LIVE().snapshot || {};
    return `<p class="hb-lead">${L(T.liveLead)}</p><div id="hbLive" class="hb-card open"><p class="ph">${L(T.fetching)}</p></div>
      ${(LIVE().bulletins || []).length ? `<h3>${L(T.bull)}</h3>${srcList(LIVE().bulletins)}` : ""}
      ${snap.fetched_at ? `<p class="hb-note">${L({ vi: "Số liệu lưu sẵn:", en: "Saved snapshot:" })} ${esc(snap.fetched_at)}</p>` : ""}
      <p class="hb-note">${L(T.saltNote)}</p>`;
  }
  async function wireLive() {
    const s = site(), host = $("#hbLive"); if (!s || !host) return;
    const paint = (o, off) => { host.innerHTML = `<b>${L(T.liveRain)} · ${esc(nameOf(s))}</b>${off ? `<p class="hb-bad">${L(T.offline)}</p>` : ""}<div class="hb-rain">${o.mm.map((v, i) => `<div title="${esc(o.days[i])}: ${v} mm"><i style="height:${Math.max(3, Math.min(100, v * 3))}%"></i><span>${nf(v, 0)}</span></div>`).join("")}</div><small>${L(T.mm)} · ${L(T.asOf)} ${esc(o.at)} · <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></small>`; };
    try { paint(await loadRain(s), false); } catch (e) { const c = (store(LIVEKEY) || {})[s.id]; if (c) paint(c, true); else host.innerHTML = `<p class="hb-bad">${L(T.offline)}</p>`; }
  }

  /* ----- dialog ----- */
  const TABS = [["field", fieldHTML, wireField], ["var", varietyHTML], ["src", sourcesHTML], ["col", colourHTML], ["fb", feedbackHTML, wireFeedback], ["live", liveHTML, wireLive]];
  let cur = "field";
  function show(tab) {
    cur = tab || cur; const dlg = $("#hub"); if (!dlg) return;
    $("#hbTabs").innerHTML = TABS.map(([k]) => `<button type="button" role="tab" data-t="${k}" aria-selected="${k === cur}">${L(T.tabs[k])}</button>`).join("");
    const t = TABS.find((x) => x[0] === cur);
    $("#hbBody").innerHTML = t[1](); if (t[2]) t[2]();
    $("#hbClose").textContent = L(T.close); $("#hubBtn span").textContent = L(T.btn); $("#hubBtn").setAttribute("aria-label", L(T.btn));
  }
  function open(tab) { const dlg = $("#hub"); show(tab); if (!dlg.open) dlg.showModal(); }
  function init() {
    if ($("#hub")) return;
    /* the Tools button sits in the top bar, next to Settings, so it never covers the page */
    const tools = $("#topbar .tools"), sw = tools && $(".set-wrap", tools);
    const tb = `<button id="hubBtn" type="button" class="icon-btn icon-btn-t" aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg><span></span></button>`;
    if (sw) sw.insertAdjacentHTML("beforebegin", tb); else document.body.insertAdjacentHTML("beforeend", tb);
    document.body.insertAdjacentHTML("beforeend", `<dialog id="hub" aria-label="Tools"><div class="hb-head"><div id="hbTabs" role="tablist"></div><button id="hbClose" class="btn sm" type="button"></button></div><div id="hbBody"></div></dialog>`);
    $("#hubBtn").onclick = () => open();
    $("#hbClose").onclick = () => $("#hub").close();
    $("#hbTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(b.dataset.t); });
    $("#hub").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    if (window.RX && RX.Core.onLang) RX.Core.onLang(() => $("#hub").open ? show() : show());
    show();
  }
  if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(init); else setTimeout(init, 0);
  return { open, show };
})();
