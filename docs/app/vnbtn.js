/* vnbtn.js: the "Việt Nam" button in the top bar. It zooms the planner's own map out to the whole country (VnMap,
   vn.js), so there is one map: Sóc Trăng areas and the 34 provinces together. The home page link (#hmVn) and the
   address index.html#vietnam do the same. Globals used: App, AppReady, RX (language), Home, VnMap. */
(() => {
  const $ = (s) => document.querySelector(s);
  const T = { btn: { vi: "Việt Nam", en: "Vietnam" }, title: { vi: "Xem cả nước: 34 tỉnh trên cùng bản đồ", en: "See the whole country: 34 provinces on the same map" } };
  const lang = () => (window.App && App.lang ? App.lang() : "vi");
  const L = (o) => o[lang()] || o.vi;
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14M15 6v14"/></svg>';
  function go() {
    if (typeof VnMap !== "undefined") VnMap.country();
  }
  function labels() {
    const b = $("#vnBtn"); if (!b) return;
    b.querySelector("span").textContent = L(T.btn);
    b.setAttribute("aria-label", L(T.title)); b.title = L(T.title);
  }
  function init() {
    if ($("#vnBtn")) return;
    const tools = $("#topbar .tools"), sw = tools && tools.querySelector(".set-wrap");
    const html = `<button id="vnBtn" type="button" class="icon-btn icon-btn-t">${ICON}<span></span></button>`;
    if (sw) sw.insertAdjacentHTML("beforebegin", html); else if (tools) tools.insertAdjacentHTML("beforeend", html);
    const b = $("#vnBtn"); if (b) b.addEventListener("click", go);
    document.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest("#hmVn")) { e.preventDefault(); go(); return; }
      if (e.target.closest && e.target.closest("#lEn, #lVi")) setTimeout(labels, 0);
    });
    if (window.RX && RX.Core && RX.Core.onLang) RX.Core.onLang(() => setTimeout(labels, 0));
    labels();
    if (location.hash === "#vietnam") go();
  }
  if (typeof AppReady !== "undefined" && (document.readyState === "loading" || AppReady.waiting())) AppReady.on(init); else setTimeout(init, 0);
})();
