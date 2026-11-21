/* srcextra.js (Draft 5): every source the Draft 5 additions use, listed in the Sources tab
   under the project's own list (DATA.sources). Groups: production costs (costs.json),
   the home page tips, and the crop-loss forecast. */
const SrcExtra = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => (typeof App !== "undefined" && App.lang ? App.lang() : "vi");
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang()] || o.en || "");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const T = {
    h: { vi: "Nguồn thêm trong bản nháp này", en: "More sources used in this draft" },
    cost: { vi: "Chi phí sản xuất (tiền vốn mỗi ha)", en: "Production costs (money put in per ha)" },
    home: { vi: "Lời khuyên trên trang chủ", en: "Tips on the home page" },
    model: { vi: "Dự báo thiệt hại do mặn", en: "Salt-loss forecast" },
    perHa: { vi: "triệu ₫/ha", en: "million ₫/ha" }, perYear: { vi: "mỗi năm", en: "a year" }, perCrop: { vi: "mỗi vụ", en: "a crop" },
    calc: { vi: "Cách tính", en: "Worked out as" }, none: { vi: "Chưa có số liệu.", en: "No figures yet." }
  };
  const HOME = [
    { title: "Nông nghiệp và Môi trường (23/2/2024): Xâm nhập mặn ở Sóc Trăng diễn biến phức tạp trong những ngày tới",
      url: "https://nongnghiepmoitruong.vn/xam-nhap-man-o-soc-trang-dien-bien-phuc-tap-trong-nhung-ngay-toi-d376951.html",
      quote: "tích trữ nguồn nước ngọt phục vụ sản xuất trong khoảng 15 ngày",
      use: { vi: "Trữ nước ngọt khoảng 15 ngày; đo nước trước khi bơm; theo dõi bản tin mặn.", en: "Store fresh water for about 15 days; check water before pumping; follow salt bulletins." } },
    { title: "Nhân Dân (20/5/2024): Chủ động canh tác vụ lúa Hè Thu hiệu quả",
      url: "https://nhandan.vn/chu-dong-canh-tac-vu-lua-he-thu-hieu-qua-post810147.html",
      quote: "Tiến hành đo độ mặn dưới 1‰",
      use: { vi: "Lúa cần nước dưới 1‰; gieo sạ theo lịch xuống giống.", en: "Rice needs water under 1‰; sow on the sowing calendar." } }
  ];
  const MODEL = [
    { title: "FAO Irrigation and Drainage Paper 61 (Tanji & Kielen 2002), Annex 1: crop salt tolerance data, after Maas & Grattan (1999)",
      use: { vi: "Ngưỡng chịu mặn: lúa bắt đầu giảm năng suất ở 3,0 dS/m, mất 12% cho mỗi dS/m vượt ngưỡng; bắp 1,7 dS/m (dùng thay cho cây màu).", en: "Salt tolerance: rice starts to lose yield at 3.0 dS/m and loses 12% per dS/m above it; maize 1.7 dS/m (stand-in for upland crops)." } },
    { title: "NOAA Climate Prediction Center, ENSO diagnostic discussion (latest issue)",
      use: { vi: "Khả năng El Niño trong bản dự báo mới nhất, dùng để cân giữa năm thường và năm El Niño.", en: "The El Niño chance in the latest issue, used to weigh typical and El Niño years." } }
  ];
  const item = (x) => `<li>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title)}${x.quote ? ` <q lang="vi">${esc(x.quote)}</q>` : ""}${x.use ? `<br><small>${esc(L(x.use))}</small>` : ""}</li>`;
  function costItems() {
    const fs = typeof COSTS !== "undefined" && COSTS && Array.isArray(COSTS.figures) ? COSTS.figures : [];
    if (!fs.length) return `<li>${esc(L(T.none))}</li>`;
    const w = (k) => (typeof BUILDER !== "undefined" && BUILDER.crop_words && BUILDER.crop_words[k] ? L(BUILDER.crop_words[k]) : k);
    return fs.map((f) => item({
      title: f.source.title, url: f.source.url, quote: f.source.quote,
      use: { vi: `${w(f.key)}: ${String(f.cost).replace(".", ",")} ${L(T.perHa)} ${f.unit === "year" ? L(T.perYear) : L(T.perCrop)} · ${f.place || ""} ${f.year || ""}${f.calc ? " · " + L(T.calc) + ": " + f.calc : ""}${f.use === false && f.why_not ? " · " + f.why_not.vi : ""}`,
             en: `${w(f.key)}: ${f.cost} ${L(T.perHa)} ${f.unit === "year" ? L(T.perYear) : L(T.perCrop)} · ${f.place || ""} ${f.year || ""}${f.calc ? " · " + L(T.calc) + ": " + f.calc : ""}${f.use === false && f.why_not ? " · " + f.why_not.en : ""}` }
    })).join("");
  }
  function html() {
    return `<section id="xSources" class="x-src"><h3>${esc(L(T.h))}</h3>
      <h4>${esc(L(T.cost))}</h4><ol>${costItems()}</ol>
      <h4>${esc(L(T.home))}</h4><ol>${HOME.map(item).join("")}</ol>
      <h4>${esc(L(T.model))}</h4><ol>${MODEL.map(item).join("")}</ol></section>`;
  }
  function inject() {
    const m = $("#modal"); if (!m || !m.open) return;
    const list = $("#sourceList", m) && !$("#sourcesBox", m).hidden ? $("#sourceList", m) : $(".sources ol", m);
    if (!list) return;
    const old = $("#xSources", m), h = html();
    if (old) { if (old.dataset.lang !== lang()) { old.outerHTML = h; $("#xSources", m).dataset.lang = lang() } return }
    list.insertAdjacentHTML("afterend", h); $("#xSources", m).dataset.lang = lang();
  }
  function start() {
    const m = $("#modal"); if (!m) return;
    new MutationObserver(() => inject()).observe(m, { attributes: true, childList: true, subtree: true });
  }
  if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(start); else start();
  return { inject };
})();
