/* cost.js (Draft 5): money for each rotation on the farmer's own area.
   - Cost: published production costs per crop (COSTS, from src/costs.json; each figure has its source and quote).
     Per crop key the median of the figures is used, with the lowest and highest as a range.
   - Profit: the card's published profit range per ha per year (profit_range, from pipeline/profits.json via sites.json).
   - Money in = cost + profit (an estimate, not a price forecast).
   Everything is multiplied by the field's hectares: the active saved field for this area, or the number typed here.
   Shown on each rotation card (step 3) and as a cash plan by crop in step 4. Advice wording needs claude-pro2's check. */
const Cost = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (typeof App !== "undefined" && App.lang ? App.lang() : "vi");
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang()] || o.en || "");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = (n, d = 0) => (n == null || isNaN(n) ? "–" : n.toLocaleString(lang() === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 }));
  const money = (m) => { /* m in million ₫ */
    if (m == null || isNaN(m)) return "–";
    const r = m >= 100 ? Math.round(m) : Math.round(m * 10) / 10;
    return lang() === "vi" ? `${num(r, 1)}\u00a0triệu\u00a0₫` : `₫${num(r, 1)}\u00a0million`;
  };
  const T = {
    h: { vi: "Tiền vốn và tiền lời", en: "Costs and profit" },
    forHa: { vi: (ha) => `cho ${ha} ha, mỗi năm`, en: (ha) => `for ${ha} ha, per year` },
    perHa: { vi: "cho 1 ha, mỗi năm", en: "for 1 ha, per year" },
    haL: { vi: "Diện tích ruộng (ha)", en: "Field size (ha)" },
    haHint: { vi: "1 công = 0,1 ha", en: "1 công = 0.1 ha" },
    fromField: { vi: (n) => `Theo ruộng đã lưu: ${n}`, en: (n) => `From your saved field: ${n}` },
    cost: { vi: "Tiền vốn (chi phí sản xuất)", en: "Money to put in (production cost)" },
    profit: { vi: "Tiền lời", en: "Profit" },
    gross: { vi: "Tiền bán được (ước tính)", en: "Money from the harvest (estimate)" },
    byCrop: { vi: "Vốn từng vụ", en: "Cost per crop" },
    noCost: { vi: "chưa có số liệu", en: "no figure yet" },
    partial: { vi: "Thiếu số liệu chi phí cho một vụ, nên tổng vốn thấp hơn thực tế.", en: "One crop has no cost figure, so the total cost is too low." },
    range: { vi: (a, b) => `khoảng ${a} – ${b}`, en: (a, b) => `about ${a} – ${b}` },
    note: { vi: "Vốn: số giữa các số liệu chi phí đã công bố (2019–2025). Lời: số liệu lợi nhuận đã công bố. Giá lúa, tôm thay đổi theo năm; đây là ước tính, không phải giá dự báo.",
            en: "Cost: the middle of published cost figures (2019–2025). Profit: published profit figures. Rice and shrimp prices change every year; this is an estimate, not a price forecast." },
    src: { vi: "Nguồn số liệu chi phí", en: "Cost sources" },
    plan: { vi: "Tiền cần chuẩn bị theo vụ", en: "Money to have ready, crop by crop" },
    planD: { vi: "Vốn cần có trước khi bắt đầu mỗi vụ.", en: "The cost to have ready before each crop starts." },
    before: { vi: (m) => `Trước ${m}`, en: (m) => `Before ${m}` },
    total: { vi: "Cả năm", en: "Whole year" },
    perYear: { vi: "mỗi năm", en: "a year" },
    /* what a cost figure counts: machine hire and labour (from each figure's "covers" note in costs.json) */
    machS: { vi: "Phần lớn số liệu không ghi rõ có tính tiền thuê máy (cày, gặt) và tiền công hay không.",
             en: "Most cost figures do not say whether machine hire (ploughing, harvest) or labour is counted." },
    machH: { vi: "Số vốn này tính máy và công thế nào", en: "What this cost counts: machines and labour" },
    machL: { vi: "Máy", en: "Machines" }, labL: { vi: "Công", en: "Labour" },
    mach: { excluded: { vi: "không tính thuê máy", en: "machine hire left out" }, not_stated: { vi: "không ghi rõ", en: "not stated" } },
    lab: { family: { vi: "chỉ tính công nhà", en: "family labour only" }, included: { vi: "có tính tiền công", en: "labour counted" }, not_stated: { vi: "không ghi rõ", en: "not stated" } },
    of: { vi: (a, b) => `${a}/${b} số liệu`, en: (a, b) => `${a} of ${b} figures` },
    machNo: { vi: "Chưa có số liệu nào ghi là đã tính tiền thuê máy. Nếu bạn thuê máy cày, máy gặt, tiền vốn thật có thể cao hơn.",
              en: "No figure says it includes machine hire. If you hire a tractor or harvester, your real cost can be higher." }
  };
  const MON = { vi: ["tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6", "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"],
                en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };

  /* ---------- data ---------- */
  const figs = () => (typeof COSTS !== "undefined" && COSTS && Array.isArray(COSTS.figures) ? COSTS.figures : []);
  const med = (a) => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null };
  function costOf(key) {
    const fs = figs().filter((f) => f.key === key && typeof f.cost === "number" && f.use !== false);
    if (!fs.length) return null;
    const lo = Math.min(...fs.map((f) => (f.range ? f.range[0] : f.cost))), hi = Math.max(...fs.map((f) => (f.range ? f.range[1] : f.cost)));
    return { mid: med(fs.map((f) => f.cost)), lo, hi, n: fs.length, figs: fs };
  }
  const B = () => (typeof BUILDER !== "undefined" ? BUILDER : null);
  const words = (key) => { const b = B(); return b && b.crop_words && b.crop_words[key] ? L(b.crop_words[key]) : key };
  /* the crops of a rotation: one entry per crop code (R1, R2, R3, S, U) with its profit key and first month */
  function cropsOf(c) {
    const b = B(), rp = b && b.rot_profit && b.rot_profit[c.id];
    const map = Object.assign({}, rp ? rp.profit : {});
    if (map.U && c.crop) map.U = c.crop;                    /* upland variant chosen in the card */
    const out = [], seen = {};
    const ms = c.months || (rp && rp.months) || [];
    ms.forEach((m, i) => {
      if (m === "-" || seen[m]) return;
      const key = map[m] || map[m[0]]; if (!key) return;
      /* the first month of this crop's block, going back over a Dec→Jan wrap */
      let s = i; while (ms[(s + 11) % 12] === m && (s + 11) % 12 !== i) s = (s + 11) % 12;
      seen[m] = 1; out.push({ code: m, key, start: s, cost: costOf(key) });
    });
    return out;
  }
  /* field size: the active saved field for this area, else the number typed here (saved per browser) */
  function getHa() {
    const a = typeof App !== "undefined" ? App : null, s = a && a.site && a.site(), ex = !!(a && a.example && a.example());
    if (a && s && !ex && typeof a.fields === "function") {
      const fid = typeof a.fieldId === "function" ? a.fieldId() : null;
      const fs = a.fields().filter((f) => f.site === s.id && f.size > 0);
      const f = fs.find((x) => x.id === fid) || fs[0];
      if (f) return { ha: +f.size, field: f };
    }
    try { const v = parseFloat(localStorage.getItem("mre-ha")); if (v > 0) return { ha: v, field: null } } catch (e) {}
    return { ha: null, field: null };
  }
  function calc(c) {
    const crops = cropsOf(c), have = crops.filter((x) => x.cost);
    const cost = have.reduce((t, x) => t + x.cost.mid, 0), lo = have.reduce((t, x) => t + x.cost.lo, 0), hi = have.reduce((t, x) => t + x.cost.hi, 0);
    const pr = c.profit_range || null;
    return { crops, cost, lo, hi, partial: have.length < crops.length, profit: pr ? pr.mid : null, plo: pr ? pr.lo : null, phi: pr ? pr.hi : null };
  }

  /* machine and labour coverage of one crop's figures: "machine hire left out 1/3 · not stated 2/3" */
  function covers(cost) {
    const fs = cost ? cost.figs : [], n = fs.length, line = (fld, dict) => Object.keys(dict).map((k) => [k, fs.filter((f) => (f[fld] || "not_stated") === k).length]).filter((x) => x[1])
      .map(([k, c]) => `${L(dict[k])} (${L(T.of)(c, n)})`).join(" · ");
    return n ? { m: line("machines", T.mach), l: line("labour", T.lab) } : null;
  }
  function machBlock(crops) {
    const rows = crops.filter((x) => x.cost).map((x) => { const v = covers(x.cost); return `<li><b>${esc(words(x.key))}</b><span>${esc(L(T.machL))}: ${esc(v.m)}</span><span>${esc(L(T.labL))}: ${esc(v.l)}</span></li>` }).join("");
    return rows ? `<div class="cs-mach"><p class="cs-mach-h">${esc(L(T.machH))}</p><ul>${rows}</ul><p class="cs-note">${esc(L(T.machNo))}</p></div>` : "";
  }

  /* ---------- step 3: one box per card ---------- */
  function haInput() {
    const { ha, field } = getHa();
    if (field) return `<p class="cs-from">${esc(L(T.fromField)(field.name || ""))}</p>`;
    return `<label class="cs-ha"><span>${esc(L(T.haL))}</span><input type="number" inputmode="decimal" min="0" step="0.1" placeholder="1" value="${ha ? ha : ""}" data-cost-ha><small>${esc(L(T.haHint))}</small></label>`;
  }
  /* one tile, four numbers side by side (2 x 2): cost, profit, harvest money, cost per crop. Nothing to scroll or open.
     Simple view keeps only cost and profit, without ranges; sources and notes stay in Advanced. */
  function box(c) {
    const r = calc(c), { ha } = getHa(), k = ha || 1, simple = document.body.classList.contains("ui-simple");
    const head = ha ? L(T.forHa)(num(ha, 2)) : L(T.perHa);
    const cell = (lab, v, lo, hi, cls) => `<div class="cs-cell ${cls}"><span>${esc(lab)}</span><b>${esc(money(v * k))}</b>${!simple && lo != null && hi != null && hi > lo ? `<small>${esc(L(T.range)(money(lo * k), money(hi * k)))}</small>` : ""}</div>`;
    const crops = r.crops.map((x) => `<li><span>${esc(words(x.key))}</span><b>${x.cost ? esc(money(x.cost.mid * k)) : `<em>${esc(L(T.noCost))}</em>`}</b></li>`).join("");
    const cells = [cell(L(T.cost), r.cost, r.lo, r.hi, "c")];
    if (r.profit != null) cells.push(cell(L(T.profit), r.profit, r.plo, r.phi, "p"));
    if (!simple && r.profit != null) cells.push(cell(L(T.gross), r.cost + r.profit, null, null, "g"));
    if (!simple) cells.push(`<div class="cs-cell k"><span>${esc(L(T.byCrop))}</span><ul class="cs-crops">${crops}</ul></div>`);
    return `<div class="cs-box${simple ? " is-simple" : ""}" data-cost-for="${esc(c.id)}">
      <p class="cs-h">${esc(L(T.h))} <span>· ${esc(head)}</span></p>
      <div class="cs-grid">${cells.join("")}</div>
      ${r.partial ? `<p class="cs-warn">${esc(L(T.partial))}</p>` : ""}
      ${simple ? `<p class="cs-note">${esc(L(T.machS))}</p>` : machBlock(r.crops)}
      ${simple ? "" : `<details class="cs-more"><summary>${esc(L(T.src))}</summary><p class="cs-note">${esc(L(T.note))}</p>${srcList(r.crops)}</details>`}
    </div>`;
  }
  function srcList(crops) {
    const fs = []; crops.forEach((x) => x.cost && x.cost.figs.forEach((f) => { if (!fs.includes(f)) fs.push(f) }));
    if (!fs.length) return "";
    return `<p class="cs-src-h">${esc(L(T.src))}</p><ol class="cs-src">${fs.map((f) => `<li>${esc(words(f.key))}: ${esc(money(f.cost))}/ha${f.unit === "year" ? "/" + esc(L(T.perYear)) : ""} · ${esc(f.place || "")} ${f.year || ""} · ${esc(L(T.machL))}: ${esc(L(T.mach[f.machines || "not_stated"]))}, ${esc(L(T.labL))}: ${esc(L(T.lab[f.labour || "not_stated"]))}. <a href="${esc(f.source.url)}" target="_blank" rel="noopener">${esc(f.source.title)}</a>${f.source.quote ? ` <q lang="vi">${esc(f.source.quote)}</q>` : ""}</li>`).join("")}</ol>`;
  }
  function cards() {
    const host = $("#cards"); if (!host || typeof App === "undefined" || !App.ranked) return;
    const list = App.ranked(); if (!list || !list.length) return;
    const top = $("#csTop") || (() => { const d = document.createElement("div"); d.id = "csTop"; d.className = "cs-top"; host.parentNode.insertBefore(d, host); return d })();
    top.innerHTML = haInput();
    host.querySelectorAll("article.card[data-id]").forEach((el) => {
      const it = list.find((x) => x.c.id === el.dataset.id); if (!it) return;
      const old = el.querySelector(".cs-box"); const html = box(it.c);
      if (old) { if (old.outerHTML !== html) { const open = old.querySelector("details[open]"); old.outerHTML = html; if (open) { const n = el.querySelector(".cs-box details"); if (n) n.open = true } } return }
      const anchor = el.querySelector(".ic15-key") || el.querySelector(".mini") || el.querySelector(".cal");
      if (anchor) anchor.insertAdjacentHTML("afterend", html); else el.insertAdjacentHTML("beforeend", html);
    });
  }

  /* ---------- step 4: money crop by crop ---------- */
  function plan(c) {
    if (!c || typeof App === "undefined" || !App.site || !App.site()) return;
    const anchor = $("#d5Pred") || $("#d5W4") || $("#planFor"); if (!anchor) return;
    let el = $("#d5Cost"); if (!el) { el = document.createElement("div"); el.id = "d5Cost"; el.className = "box d5-box"; anchor.insertAdjacentElement("afterend", el) }
    const card = (App.ranked().find((x) => x.c.id === c.id) || { c }).c, r = calc(card), { ha } = getHa(), k = ha || 1;
    const now = new Date().getMonth();
    const rows = r.crops.slice().sort((a, b) => ((a.start - now + 12) % 12) - ((b.start - now + 12) % 12)).map((x) => `<li>
        <span class="cs-when">${esc(L(T.before)(MON[lang()][x.start]))}</span><span class="cs-what">${esc(words(x.key))}</span>
        <b>${x.cost ? esc(money(x.cost.mid * k)) : `<em>${esc(L(T.noCost))}</em>`}</b></li>`).join("");
    el.innerHTML = `<p class="eyebrow">${esc(L(T.plan))} · ${esc(ha ? L(T.forHa)(num(ha, 2)) : L(T.perHa))}</p>
      ${haInput()}<p class="cs-note">${esc(L(T.planD))}</p><ol class="cs-plan">${rows}</ol>
      <div class="cs-row c"><span>${esc(L(T.total))}</span><b>${esc(money(r.cost * k))}</b></div>
      ${r.profit != null ? `<div class="cs-row p"><span>${esc(L(T.profit))}</span><b>${esc(money(r.profit * k))}</b></div>` : ""}
      ${r.partial ? `<p class="cs-warn">${esc(L(T.partial))}</p>` : ""}<p class="cs-note">${esc(L(T.note))}</p>
      ${document.body.classList.contains("ui-simple") ? `<p class="cs-note">${esc(L(T.machS))}</p>` : machBlock(r.crops)}`;
  }

  /* ---------- wiring ---------- */
  let lastPlan = null;
  document.addEventListener("input", (e) => {
    const i = e.target.closest && e.target.closest("[data-cost-ha]"); if (!i) return;
    const v = parseFloat(String(i.value).replace(",", "."));
    try { if (v > 0) localStorage.setItem("mre-ha", String(v)); else localStorage.removeItem("mre-ha") } catch (er) {}
    clearTimeout(i._t); i._t = setTimeout(() => {
      const pos = i.selectionStart, sel = i.closest("#d5Cost") ? "#d5Cost [data-cost-ha]" : "#csTop [data-cost-ha]";
      refresh();
      const n = $(sel); if (n) { n.focus({ preventScroll: true }); try { n.setSelectionRange(pos, pos) } catch (er) {} }
    }, 350);
  });
  function refresh() { if (typeof App !== "undefined" && App.refresh) App.refresh(); cards(); if (lastPlan) plan(lastPlan) }
  function start() {
    const host = $("#cards"); if (!host) return;
    new MutationObserver(() => { if (!host.querySelector(".card:not(:has(.cs-box))")) return; cards() }).observe(host, { childList: true });
  }
  if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(start); else start();
  return { cards, plan: (c) => { lastPlan = c; plan(c) }, refresh, calc, covers, money, ha: () => getHa().ha, machNote: () => L(T.machS), machNo: () => L(T.machNo) };
})();
