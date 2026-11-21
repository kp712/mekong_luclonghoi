/* onboard.js (Draft 5): a short first-visit tutorial.
   Part 1 runs the first time the farmer leaves the home page (Start): area list, salt by month, settings.
   Part 2 runs the first time the area panel opens: steps, next button, full screen.
   Shown once each (localStorage d5-onb1 / d5-onb2); Settings > Guided tour replays it. */
const Onboard = (() => {
  const $ = (s) => document.querySelector(s);
  const lang = () => (typeof App !== "undefined" && App.lang ? App.lang() : "vi");
  const L = (o) => o[lang()] || o.en;
  const get = (k) => { try { return localStorage.getItem(k) } catch (e) { return "1" } };
  const put = (k) => { try { localStorage.setItem(k, "1") } catch (e) {} };
  const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden" };
  const first = (sels) => { for (const s of sels) { const el = $(s); if (vis(el)) return el } return null };
  const ICON = {
    hi: '<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4.3 14a1.6 1.6 0 0 1 2.6-1.8L7 12.5"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    steps: '<path d="M4 18h4v-4h4v-4h4V6h4"/>',
    next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'
  };
  const P1 = [
    { t: { vi: "Chào bà con!", en: "Welcome!" }, d: { vi: "Chỉ 3 bước: chọn khu vực, cho biết về ruộng, rồi xem lịch 12 tháng. Hướng dẫn này mất chưa đến 1 phút.", en: "Just 3 steps: pick your area, tell us about your field, then see a 12-month plan. This guide takes under a minute." }, i: "hi" },
    { sel: ["#side .sd-list", "#side", "#areaDock", "#map"], t: { vi: "Chọn khu vực của bạn", en: "Pick your area" }, d: { vi: "Chạm vào tên khu vực gần ruộng của bạn, ở đây hoặc trên bản đồ. Chấm màu cho biết mức mặn.", en: "Tap the area nearest your field, here or on the map. The coloured dot shows how salty it gets." }, i: "pin" },
    { sel: ["#d5Month"], t: { vi: "Mặn theo tháng", en: "Salt by month" }, d: { vi: "Kéo thanh này để xem tháng nào khu vực nào thường bị mặn. Đây là ước tính từ báo cáo trạm đo, không phải vệ tinh.", en: "Drag this to see which areas are usually salty each month. It is an estimate from station reports, not satellite." }, i: "cal" },
    { sel: ["#gearBtn"], t: { vi: "Cài đặt", en: "Settings" }, d: { vi: "Đổi cỡ chữ, nền sáng hoặc tối, và xem lại hướng dẫn này bất cứ lúc nào.", en: "Change text size, light or dark, and replay this guide at any time." }, i: "gear" }
  ];
  const P2 = [
    { sel: [".d-head"], t: { vi: "Đi từng bước", en: "One step at a time" }, d: { vi: "Thanh màu cho biết bạn đang ở bước nào: khu vực, điều bạn cần, các cách luân canh, rồi lịch 12 tháng.", en: "The bars show which step you are on: area, priorities, rotations, then your 12-month plan." }, i: "steps" },
    { sel: ["#dFull"], t: { vi: "Xem to hơn", en: "See it bigger" }, d: { vi: "Chạm vào đây để mở toàn màn hình cho dễ đọc. Chạm lại để thu nhỏ.", en: "Tap here to fill the screen so it is easier to read. Tap again to go back." }, i: "full" },
    { sel: ["#dNext", ".d-foot"], t: { vi: "Bước tiếp theo", en: "Next step" }, d: { vi: "Khi xong mỗi bước, chạm nút này để đi tiếp.", en: "When a step is done, tap this button to go on." }, i: "next" }
  ];
  let list = [], i = 0, key = null, root = null, lastFocus = null;

  function build() {
    root = document.createElement("div"); root.id = "ob"; root.hidden = true;
    root.innerHTML = '<div class="ob-shade"></div><div class="ob-ring" hidden></div><div class="ob-card" role="dialog" aria-modal="true" aria-labelledby="obH" tabindex="-1"></div>';
    document.body.appendChild(root);
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.ob === "skip") { put("mre-onb1"); put("mre-onb2"); end(); }   /* skip = the whole guide, not just this part */
      else if (b.dataset.ob === "back") show(i - 1);
      else if (b.dataset.ob === "next") (i >= list.length - 1 ? end() : show(i + 1));
    });
    addEventListener("keydown", (e) => {
      if (root.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); end(); }
      else if (e.key === "ArrowRight") show(Math.min(list.length - 1, i + 1));
      else if (e.key === "ArrowLeft") show(Math.max(0, i - 1));
    }, true);
    addEventListener("resize", () => { if (!root.hidden) place() });
  }
  function start(steps, k) {
    if (!root) build();
    list = steps.filter((s) => !s.sel || first(s.sel)); if (!list.length) return;
    key = k; i = 0; lastFocus = document.activeElement; root.hidden = false; show(0);
  }
  function show(n) {
    i = Math.max(0, Math.min(list.length - 1, n)); const s = list[i], card = root.querySelector(".ob-card");
    card.innerHTML = `<div class="ob-art" aria-hidden="true"><svg viewBox="0 0 24 24">${ICON[s.i] || ""}</svg></div>
      <p class="ob-step">${L({ vi: "Hướng dẫn", en: "Guide" })} · ${i + 1}/${list.length}</p>
      <h2 id="obH">${L(s.t)}</h2><p>${L(s.d)}</p>
      <div class="ob-dots" aria-hidden="true">${list.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="ob-acts"><button type="button" class="ob-skip" data-ob="skip">${L({ vi: "Bỏ qua", en: "Skip" })}</button>
        ${i ? `<button type="button" class="ob-b" data-ob="back">${L({ vi: "Quay lại", en: "Back" })}</button>` : ""}
        <button type="button" class="ob-b ob-next" data-ob="next">${i >= list.length - 1 ? L({ vi: "Đã hiểu", en: "Got it" }) : L({ vi: "Tiếp", en: "Next" })}</button></div>`;
    place(); card.focus({ preventScroll: true });
  }
  function place() {
    const s = list[i], card = root.querySelector(".ob-card"), ring = root.querySelector(".ob-ring");
    const el = s.sel ? first(s.sel) : null;
    if (!el) { card.classList.remove("ob-top"); ring.hidden = true; root.classList.remove("has-ring"); card.style.left = `calc(50% - ${card.offsetWidth / 2}px)`; card.style.top = `calc(50% - ${card.offsetHeight / 2}px)`; return; }
    if (el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    const r = el.getBoundingClientRect(), pad = 6;
    ring.hidden = false; root.classList.add("has-ring");
    Object.assign(ring.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
    const cw = card.offsetWidth, ch = card.offsetHeight, W = innerWidth, H = innerHeight;
    card.classList.toggle("ob-top", W <= 760 && r.top + r.height / 2 > H / 2);   /* phones: keep the card off the target */
    let x, y;
    if (r.right + 16 + cw < W) { x = r.right + 16; y = Math.min(Math.max(16, r.top), H - ch - 16); }          /* right of it */
    else if (r.left - 16 - cw > 0) { x = r.left - 16 - cw; y = Math.min(Math.max(16, r.top), H - ch - 16); }  /* left of it */
    else { x = Math.min(Math.max(16, r.left), W - cw - 16); y = r.bottom + 16 + ch < H ? r.bottom + 16 : Math.max(16, r.top - 16 - ch); }
    card.style.left = x + "px"; card.style.top = y + "px";
  }
  function end() {
    if (key) put(key);
    root.hidden = true; list = [];
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }) } catch (e) {}
  }
  const running = () => root && !root.hidden;

  /* triggers */
  function watch() {
    const b = document.body;
    new MutationObserver(() => {
      if (running()) return;
      if (!b.classList.contains("drawer-open") && !get("mre-onb1")) setTimeout(() => { if (!running() && !b.classList.contains("drawer-open")) start(P1, "mre-onb1") }, 120);
      else if (b.classList.contains("drawer-open") && !get("mre-onb2")) setTimeout(() => { if (!running() && b.classList.contains("drawer-open")) start(P2, "mre-onb2") }, 700);
    }).observe(b, { attributes: true, attributeFilter: ["class"] });
    /* Settings > Guided tour: replay this tutorial instead of the old tour */
    addEventListener("click", (e) => {
      if (!e.target.closest || !e.target.closest("#tourBtn")) return;
      e.preventDefault(); e.stopPropagation();
      const g = $("#gearBtn"); if (g && g.getAttribute("aria-expanded") === "true") g.click();
      setTimeout(() => start(document.body.classList.contains("drawer-open") ? P2 : P1, null), 150);
    }, true);
  }
  if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(watch); else watch();
  return { start: (part) => start(part === 2 ? P2 : P1, null), running };
})();
