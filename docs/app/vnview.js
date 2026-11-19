/* vnview.js: the Vietnam map (vietnam.html, app/vn.js) inside the main app, full screen over the planner.
   Opened from the "Việt Nam" button in the top bar, the home page link (#hmVn) or the address index.html#vietnam.
   The page loads only on the first open (an iframe, so its map and styles never touch the planner's), and talks to the
   app with postMessage: language both ways, "close", and "area" (a Sóc Trăng area pin: close and open that area here).
   Globals used: App, AppReady, RX (language), MapView. */
const VnView = (() => {
  const $ = (s) => document.querySelector(s);
  const T = { btn: { vi: "Việt Nam", en: "Vietnam" }, title: { vi: "Bản đồ Việt Nam: 34 tỉnh", en: "Vietnam map: 34 provinces" } };
  const lang = () => (window.App && App.lang ? App.lang() : "vi");
  const L = (o) => o[lang()] || o.vi;
  let box = null, frame = null, back = null;
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14M15 6v14"/></svg>';

  function post(msg) { try { frame && frame.contentWindow && frame.contentWindow.postMessage(msg, location.origin); } catch (e) {} }
  function open(push = true) {
    if (!box) {
      document.body.insertAdjacentHTML("beforeend", `<div id="vnView" role="dialog" aria-modal="true" hidden><iframe id="vnFrame" title=""></iframe></div>`);
      box = $("#vnView"); frame = $("#vnFrame");
      frame.addEventListener("load", () => post({ type: "vn-lang", lang: lang() }));
      frame.src = "vietnam.html?embed=1";
    } else post({ type: "vn-lang", lang: lang() });
    frame.title = L(T.title);
    back = document.activeElement;
    box.hidden = false;
    document.body.classList.add("vn-on");
    if (push && location.hash !== "#vietnam") history.pushState({ vn: 1 }, "", "#vietnam");
    setTimeout(() => { try { frame.focus(); } catch (e) {} }, 50);
  }
  function close(fromHistory) {
    if (!box || box.hidden) return;
    box.hidden = true;
    document.body.classList.remove("vn-on");
    if (!fromHistory && location.hash === "#vietnam") { if (history.state && history.state.vn) history.back(); else history.replaceState(null, "", location.pathname + location.search); }
    if (back && back.focus) try { back.focus({ preventScroll: true }); } catch (e) {}
    try { if (window.MapView && MapView.resize) MapView.resize(); } catch (e) {}
  }
  /* a Sóc Trăng area pin in the Vietnam map: open that area in the planner, the way a tap on its map outline does */
  function area(id) {
    close();
    if (typeof Dash !== "undefined" && Dash.pickArea) { Dash.pickArea(id); return; }  // the dashboard first steps back to the map
    const ids = (window.DATA && DATA.sites || []).map((s) => s.id), i = ids.indexOf(id), p = document.querySelectorAll("path.sg-area")[i];
    if (p) setTimeout(() => p.dispatchEvent(new MouseEvent("click", { bubbles: true })), 250);
  }
  addEventListener("message", (e) => {
    if (e.origin !== location.origin || !frame || e.source !== frame.contentWindow || !e.data) return;
    const d = e.data;
    if (d.type === "vn-close") close();
    else if (d.type === "vn-area") area(d.id);
    else if (d.type === "vn-lang" && (d.lang === "en" || d.lang === "vi") && d.lang !== lang()) { const b = $(d.lang === "en" ? "#lEn" : "#lVi"); if (b) b.click(); }
  });
  addEventListener("popstate", () => { if (location.hash === "#vietnam") open(false); else close(true); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && box && !box.hidden) close(); });

  function labels() {
    const b = $("#vnBtn"); if (b) { b.querySelector("span").textContent = L(T.btn); b.setAttribute("aria-label", L(T.title)); }
    if (frame) { frame.title = L(T.title); post({ type: "vn-lang", lang: lang() }); }
  }
  function init() {
    if ($("#vnBtn")) return;
    const tools = $("#topbar .tools"), sw = tools && tools.querySelector(".set-wrap");
    const html = `<button id="vnBtn" type="button" class="icon-btn icon-btn-t" aria-haspopup="dialog">${ICON}<span></span></button>`;
    if (sw) sw.insertAdjacentHTML("beforebegin", html); else if (tools) tools.insertAdjacentHTML("beforeend", html);
    const b = $("#vnBtn"); if (b) b.addEventListener("click", () => open());
    // the home page link opens the map here instead of leaving the app
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("#hmVn"); if (a) { e.preventDefault(); open(); return; }
      if (e.target.closest && e.target.closest("#lEn, #lVi, [data-lang]")) setTimeout(labels, 0);  // the app's language buttons
    });
    if (window.RX && RX.Core && RX.Core.onLang) RX.Core.onLang(labels);
    labels();
    if (location.hash === "#vietnam") open(false);
  }
  if (typeof AppReady !== "undefined" && (document.readyState === "loading" || AppReady.waiting())) AppReady.on(init); else setTimeout(init, 0);
  return { open, close };
})();
