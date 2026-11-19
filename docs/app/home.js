/* home.js (Draft 5): the welcome page shown on every load before the map dashboard.
   Reads the app through window.App (lang, fields, openField, openFieldForm) and MapView.resize.
   Reads RX.DATA.sites (rx.js) for salt months, salt level and rain; DATA.outlook for the El Niño text.
   app.js calls Home.render() from applyAll; the page also re-renders on #lEn / #lVi clicks.
   Home shows on every load, except with the #plan-lab hash. Only the "before the salt" ticks are
   kept, in localStorage, per viewer.
   Sections: hero (#hmArt, #hmTitle, #hmLead, #hmStart, #hmFields, #hmSteps),
   #hmAlert (El Niño), #hmNow (this month on the coast + salt countdown), #hmPrep (before the salt
   comes), #hmData (where the numbers come from), #hmSources. */
const Home = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const T = {
    hello: { m: { vi: "Chào buổi sáng, bà con", en: "Good morning" }, n: { vi: "Chào buổi trưa, bà con", en: "Good afternoon" },
             a: { vi: "Chào buổi chiều, bà con", en: "Good afternoon" }, e: { vi: "Chào buổi tối, bà con", en: "Good evening" } },
    season: { wet: { vi: "mùa mưa", en: "rainy season" }, dry: { vi: "mùa khô", en: "dry season" } },
    sign: { vi: "Làm cho bà con ven biển Sóc Trăng, từ số liệu Trái Đất của NASA.", en: "Made for farmers on the Sóc Trăng coast, from NASA Earth data." },
    title: { vi: "Lịch luân canh cho ruộng của bạn", en: "A crop calendar for your field" },
    titleA: { vi: "ruộng của bạn", en: "your field" },
    lead: {
      vi: "Lúa, tôm hay hoa màu, tháng nào trồng gì để tránh mùa nước mặn.",
      en: "Rice, shrimp or upland crops: what to grow each month to avoid the salt season."
    },
    howH: { vi: "Cách dùng", en: "How it works" },
    s1: { vi: "Chọn vùng của bạn", en: "Pick your area" },
    s2: { vi: "Cho biết về ruộng", en: "Tell us about your field" },
    s3: { vi: "Nhận lịch 12 tháng", en: "Get a 12-month plan" },
    start: { vi: "Bắt đầu", en: "Start" },
    alert: { vi: "Cảnh báo El Niño", en: "El Niño alert" },
    outlook: {
      vi: "Dự báo của NOAA (8/10/2026): khả năng có El Niño mạnh đến rất mạnh kéo dài đến tháng 1–3/2027 là trên 83%.",
      en: "NOAA forecast (8 Oct 2026): over 83% chance of a strong-to-very strong El Niño through Jan–Mar 2027."
    },
    alertTip: { vi: "Năm El Niño thường mặn sớm hơn và mặn hơn. Nên chuẩn bị sớm.", en: "El Niño years often bring salt earlier and stronger. Prepare early." },
    fields: { vi: "Ruộng của bạn", en: "Your fields" },
    cont: { vi: "Tiếp tục", en: "Continue" },
    add: { vi: "Thêm ruộng", en: "Add a field" },
    sources: { vi: "Nguồn dữ liệu NASA", en: "NASA data sources" },
    vn: { vi: "Bản đồ 34 tỉnh", en: "Map of the 34 provinces" },
    brand: { vi: "Mekong · Lịch luân canh", en: "Mekong Rotation Explorer" },
    langL: { vi: "Ngôn ngữ", en: "Language" },
    /* this month on the coast */
    nowH: { vi: "Tháng này ở ven biển", en: "This month on the coast" },
    soonIn: { vi: (n) => `Mặn thường về sau khoảng ${n} tháng`, en: (n) => `Salt usually arrives in about ${n} month${n === 1 ? "" : "s"}` },
    nowIn: { vi: (n) => `Đang mùa mặn ở ${n}/5 vùng`, en: (n) => `Salt season in ${n} of 5 areas` },
    first: { vi: (a, m) => `Đến sớm nhất ở ${a}, từ ${m}.`, en: (a, m) => `Earliest at ${a}, from ${m}.` },
    allFresh: { vi: "Đến mùa mưa, nước thường ngọt ở cả 5 vùng.", en: "Rainy season: water is usually fresh in all 5 areas." },
    rainL: { vi: (a, b, ma, mb) => `Mưa ${ma}: khoảng ${a} mm, ${mb}: khoảng ${b} mm`, en: (a, b, ma, mb) => `Rain in ${ma}: about ${a} mm, in ${mb}: about ${b} mm` },
    rainSrc: { vi: "Trung bình 5 vùng, năm điển hình 2000–2024, NASA GPM IMERG", en: "Average of 5 areas, typical year 2000–2024, NASA GPM IMERG" },
    stNow: { vi: "Thường có mặn", en: "Usually salty" },
    stSoon: { vi: (m) => `Mặn sắp về · ${m}`, en: (m) => `Salt soon · ${m}` },
    stFresh: { vi: "Thường ngọt", en: "Usually fresh" },
    lvl: { high: { vi: "mặn cao", en: "high salt" }, medium: { vi: "mặn vừa", en: "medium salt" }, low: { vi: "mặn thấp", en: "low salt" } },
    open: { vi: "Mở vùng", en: "Open area" },
    saltSrc: { vi: "Tháng mặn: ước tính từ báo cáo trạm đo, không phải vệ tinh.", en: "Salt months: estimate from station reports, not satellite." },
    tapHint: { vi: "Chạm vào một vùng để xem lịch.", en: "Tap an area to see its plan." },
    legSalt: { vi: "Tháng thường có mặn", en: "Month usually salty" },
    legNow: { vi: "Tháng này", en: "This month" },
    /* before the salt comes */
    prepH: { vi: "Trước khi mặn về", en: "Before the salt comes" },
    prepD: { vi: "Đánh dấu việc bạn đã làm.", en: "Tick what you have done." },
    tips: [
      { ico: "drop", vi: "Trữ đủ nước ngọt dùng khoảng 15 ngày trong ao, kênh, bồn.", en: "Store enough fresh water for about 15 days in ponds, canals or tanks.",
        src: { vi: "Ngành nông nghiệp Sóc Trăng, báo Nông nghiệp và Môi trường, 23/2/2024", en: "Sóc Trăng farm sector, Nông nghiệp và Môi trường news, 23 Feb 2024" } },
      { ico: "meter", vi: "Đo độ mặn trước khi bơm nước vào ruộng. Lúa cần nước dưới 1‰.", en: "Measure salt before pumping water in. Rice needs water under 1‰.",
        src: { vi: "Khuyến cáo vụ Hè Thu Sóc Trăng, báo Nhân Dân, 20/5/2024", en: "Sóc Trăng summer–autumn advice, Nhân Dân news, 20 May 2024" } },
      { ico: "sprout", vi: "Chỉ gieo sạ khi có nước ngọt ổn định, theo lịch xuống giống của địa phương.", en: "Sow only when fresh water is steady, on your local sowing calendar.",
        src: { vi: "Báo Nhân Dân, 20/5/2024", en: "Nhân Dân news, 20 May 2024" } },
      { ico: "phone", vi: "Theo dõi bản tin độ mặn của tỉnh trên Zalo, đài và loa xã.", en: "Follow the province's salt bulletins on Zalo, radio and commune speakers.",
        src: { vi: "Báo Nông nghiệp và Môi trường, 23/2/2024", en: "Nông nghiệp và Môi trường news, 23 Feb 2024" } }
    ],
    done: { vi: "Đã làm", en: "Done" },
    /* data strip */
    dataH: { vi: "Số liệu lấy từ đâu", en: "Where the numbers come from" },
    d: [
      { k: "rain", n: "NASA GPM IMERG", vi: "Lượng mưa từng tháng", en: "Monthly rain" },
      { k: "sun", n: "NASA POWER", vi: "Nắng nóng và nhu cầu nước", en: "Heat and crop water need" },
      { k: "leaf", n: "NASA MODIS", vi: "Độ xanh ruộng, số vụ mỗi năm", en: "Field greenness, crops a year" },
      { k: "salt", n: { vi: "Báo cáo trạm đo", en: "Station reports" }, vi: "Độ mặn: ước tính, không phải vệ tinh", en: "Salt: an estimate, not satellite" }
    ]
  };
  const MON = { vi: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
  const MONL = { vi: ["tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6", "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"],
                 en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
  const sw = 'viewBox="0 0 24 24" aria-hidden="true"';
  const ICO = {
    pin: `<svg ${sw}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>`,
    field: `<svg ${sw}><path d="M3 18l4-11h10l4 11z"/><path d="M9.5 7L8 18M14.5 7L16 18M4.8 13h14.4"/></svg>`,
    cal: `<svg ${sw}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/></svg>`,
    arr: `<svg ${sw}><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    chev: `<svg ${sw}><path d="M9 6l6 6-6 6"/></svg>`,
    warn: `<svg ${sw}><path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.3v.2"/></svg>`,
    plus: `<svg ${sw}><path d="M12 5v14M5 12h14"/></svg>`,
    book: `<svg ${sw}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20"/></svg>`,
    drop: `<svg ${sw}><path d="M12 3.5s6 6.4 6 10.7a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/><path d="M9 15a3 3 0 0 0 3 3"/></svg>`,
    meter: `<svg ${sw}><rect x="8" y="2.5" width="8" height="19" rx="2"/><path d="M10.5 6h3M10.5 9h3M12 13v5"/><circle cx="12" cy="17.5" r="1"/></svg>`,
    sprout: `<svg ${sw}><path d="M12 21v-9"/><path d="M12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5zM12 14c0-3.4-2.6-5.5-6-5.5 0 3.4 2.6 5.5 6 5.5z"/><path d="M6 21h12"/></svg>`,
    phone: `<svg ${sw}><rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/><path d="M10.5 18.5h3"/><path d="M9.5 9.5a3.5 3.5 0 0 1 5 0M8 7.5a5.7 5.7 0 0 1 8 0"/></svg>`,
    check: `<svg ${sw}><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
    rain: `<svg ${sw}><path d="M7 15a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8a3.5 3.5 0 0 1 0 7z"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5"/></svg>`,
    sun: `<svg ${sw}><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>`,
    leaf: `<svg ${sw}><path d="M5 19c0-8 5-13.5 14-14 0 9-5.5 14-14 14z"/><path d="M5 19l7-7"/></svg>`,
    salt: `<svg ${sw}><path d="M3 15c2 0 2-1.5 4.5-1.5S9.5 15 12 15s2-1.5 4.5-1.5S18.5 15 21 15M3 19c2 0 2-1.5 4.5-1.5S9.5 19 12 19s2-1.5 4.5-1.5S18.5 19 21 19"/><path d="M12 3.5s3.5 3.8 3.5 6.2a3.5 3.5 0 0 1-7 0c0-2.4 3.5-6.2 3.5-6.2z"/></svg>`
  };
  /* calm hero picture: sun, sea on the horizon, paddy plots and a river; colours come from the theme tokens */
  const ART = `<svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs><clipPath id="hmLand"><path d="M0 97 C90 93 220 96 360 92 V150 H0z"/></clipPath></defs>
    <rect class="a-sky" width="360" height="150"/>
    <circle class="a-halo" cx="276" cy="44" r="32"/><circle class="a-sun" cx="276" cy="44" r="18"/>
    <path class="a-cloud" d="M58 46h52a10 10 0 0 0-10-10 14 14 0 0 0-26-3 9 9 0 0 0-16 13z"/>
    <rect class="a-sea" y="82" width="360" height="18"/>
    <path class="a-wave" d="M24 89h22M88 92h30M170 88h24M236 91h34M300 88h22"/>
    <g clip-path="url(#hmLand)">
      <rect class="a-p1" y="90" width="360" height="60"/>
      <rect class="a-p2" y="104" width="360" height="13"/>
      <rect class="a-p2" y="130" width="360" height="20"/>
      <path class="a-bund" d="M0 104H360M0 117H360M0 130H360"/>
      <path class="a-bund" d="M180 60L-180 150M180 60L-20 150M180 60L120 150M180 60L250 150M180 60L380 150M180 60L540 150"/>
    </g>
    <path class="a-river" d="M206 95 C200 106 176 114 146 124 C112 135 84 142 52 150 H112 C136 142 170 130 196 116 C210 108 216 100 214 95z"/>
    <path class="a-glint" d="M150 130l16-5M98 144l18-5"/>
    <g class="a-stalk"><path d="M300 150c0-12-4-20-10-26M306 150c0-14 2-22 8-28M312 150c0-10 5-16 12-19M318 150c0-9-3-14-8-17"/>
      <path d="M22 150c0-10 3-16 8-20M28 150c0-12-3-18-8-22M34 150c0-8 3-12 7-14"/></g>
  </svg>`;

  const app = () => (typeof App !== "undefined" ? App : window.App) || null;
  const lang = () => { const a = app(); const l = a && typeof a.lang === "function" ? a.lang() : document.documentElement.lang; return l === "en" ? "en" : "vi" };
  const L = (k) => T[k][lang()];
  const P = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang()] || o.en || "");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const D = () => (typeof DATA !== "undefined" ? DATA : null);
  const RS = () => { try { return typeof RX !== "undefined" && RX && RX.DATA && Array.isArray(RX.DATA.sites) ? RX.DATA.sites : [] } catch (e) { return [] } };
  const short = (s) => P(s.name).split(" (")[0].replace(/^(Former |Khu vực )/, "").replace(/( area| cũ)$/, "");
  const PREP_KEY = "d5-prep";
  function prepGet() { try { const v = JSON.parse(localStorage.getItem(PREP_KEY) || "[]"); return Array.isArray(v) ? v : [] } catch (e) { return [] } }
  function prepSet(v) { try { localStorage.setItem(PREP_KEY, JSON.stringify(v)) } catch (e) {} }

  function outlookText() {
    const d = D(), o = d && d.outlook;
    if (o && o.text) return typeof o.text === "string" ? o.text : (o.text[lang()] || o.text.en || L("outlook"));
    return L("outlook");
  }
  function siteName(id) {
    const d = D(); const s = d && d.sites && d.sites.find((x) => x.id === id);
    if (!s || !s.name) return "";
    const n = s.name[lang()] || s.name.en || "";
    const m = lang() === "vi" ? n.match(/Khu vực (.+?) cũ/) : n.match(/Former (.+?) area/);
    return m ? m[1] : n;
  }
  function fields() {
    const a = app();
    if (!a || typeof a.fields !== "function") return [];
    try { const f = a.fields(); return Array.isArray(f) ? f : [] } catch (e) { return [] }
  }
  /* months from month m (1–12) until the next salt month of a site; 0 = salt now, null = no salt months */
  function until(site, m) {
    const s = site.salt || []; if (!s.length) return null;
    for (let k = 0; k < 12; k++) if (s.includes(((m - 1 + k) % 12) + 1)) return k;
    return null;
  }

  function nowCard() {
    const sites = RS(), l = lang(), m = new Date().getMonth() + 1;
    if (!sites.length) return "";
    const info = sites.map((s) => ({ s, k: until(s, m) }));
    const nNow = info.filter((x) => x.k === 0).length;
    const next = info.filter((x) => x.k > 0).sort((a, b) => a.k - b.k)[0];
    let big, sub;
    if (nNow) { big = T.nowIn[l](nNow); sub = "" }
    else if (next) { big = T.soonIn[l](next.k); const fm = ((m - 1 + next.k) % 12) + 1; sub = T.first[l](short(next.s), MONL[l][fm - 1]) }
    else { big = T.allFresh[l]; sub = "" }
    /* rain now vs the first salt month (or two months on when salt is already here) */
    const later = next && !nNow ? ((m - 1 + next.k) % 12) + 1 : ((m + 1) % 12) + 1;
    const avg = (i) => Math.round(sites.reduce((t, s) => t + ((s.rain && s.rain[i - 1]) || 0), 0) / sites.length / 10) * 10;
    const rainOk = sites.every((s) => Array.isArray(s.rain) && s.rain.length === 12);
    const rain = rainOk ? `<p class="hm-rain">${ICO.rain}<span>${esc(T.rainL[l](avg(m), avg(later), MONL[l][m - 1], MONL[l][later - 1]))}<small>${esc(L("rainSrc"))}</small></span></p>` : "";
    const order = info.slice().sort((a, b) => (a.k == null ? 99 : a.k) - (b.k == null ? 99 : b.k));
    const rows = order.map(({ s, k }) => {
      let st, cls;
      if (k === 0) { st = L("stNow"); cls = "now" }
      else if (k != null && k <= 2) { st = T.stSoon[l](MON[l][((m - 1 + k) % 12)]); cls = "soon" }
      else { st = L("stFresh"); cls = "fresh" }
      const lvl = T.lvl[s.level] ? P(T.lvl[s.level]) : "";
      const cells = MON[l].map((mn, i) => `<i class="${(s.salt || []).includes(i + 1) ? "s " + esc(s.level || "") : ""}${i + 1 === m ? " c" : ""}"></i>`).join("");
      const lab = `${L("open")}: ${short(s)}. ${st}${lvl && cls !== "fresh" ? ", " + lvl : ""}.`;
      return `<li><button type="button" class="hm-area st-${cls}" data-harea="${esc(s.id)}" aria-label="${esc(lab)}">
        <span class="hm-area-top"><b>${esc(short(s))}</b><span class="hm-st"><i aria-hidden="true"></i>${esc(st)}</span>${ICO.chev}</span>
        <span class="hm-strip" aria-hidden="true">${cells}</span></button></li>`;
    }).join("");
    const axis = MON[l].map((mn, i) => `<span${i + 1 === m ? ' class="c"' : ""}>${esc(l === "vi" ? String(i + 1) : mn.charAt(0))}</span>`).join("");
    return `<h2 class="hm-h" id="hmNowH">${esc(L("nowH"))} · ${esc(MONL[l][m - 1])}</h2>
      <p class="hm-big">${esc(big)}</p>${sub ? `<p class="hm-sub">${esc(sub)}</p>` : ""}
      ${rain}
      <ul class="hm-areas">${rows}</ul>
      <div class="hm-axis" aria-hidden="true"><span class="hm-axis-m">${axis}</span></div>
      <p class="hm-leg"><span><i class="k-s"></i>${esc(L("legSalt"))}</span><span><i class="k-c"></i>${esc(L("legNow"))}</span></p>
      <p class="hm-note">${esc(L("saltSrc"))} ${esc(L("tapHint"))}</p>`;
  }

  function prepCard() {
    const l = lang(), on = prepGet();
    return `<h2 class="hm-h" id="hmPrepH">${esc(L("prepH"))}</h2><p class="hm-sub">${esc(L("prepD"))}</p>
      <ul class="hm-tips">${T.tips.map((t, i) => {
        const d = on.includes(i);
        return `<li><button type="button" class="hm-tip" data-htip="${i}" aria-pressed="${d}">
          <span class="hm-tip-ico">${ICO[t.ico]}</span>
          <span class="hm-tip-t"><span>${esc(t[l])}</span><small>${esc(P(t.src))}</small></span>
          <span class="hm-box" aria-hidden="true">${ICO.check}</span></button></li>`;
      }).join("")}</ul>`;
  }

  function dataCard() {
    return `<h2 class="hm-h" id="hmDataH">${esc(L("dataH"))}</h2>
      <ul class="hm-data">${T.d.map((x) => `<li class="k-${x.k}"><span class="hm-d-ico">${ICO[x.k]}</span><span><b>${esc(P(x.n))}</b><small>${esc(x[lang()])}</small></span></li>`).join("")}</ul>`;
  }

  function render() {
    const h = $("#home"); if (!h) return;
    const l = lang();
    h.setAttribute("lang", l);
    $(".hm-brand", h).textContent = L("brand");
    const lg = $(".hm-lang", h); lg.setAttribute("aria-label", L("langL"));
    lg.querySelectorAll("[data-hlang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.hlang === l)));
    const art = $("#hmArt"); if (art && !art.firstChild) art.innerHTML = typeof HomeScene !== "undefined" ? HomeScene.svg() : ART;
    const hr = new Date().getHours(), mo = new Date().getMonth() + 1, dry = mo === 12 || mo <= 4;
    const hello = hr >= 5 && hr < 11 ? T.hello.m : hr >= 11 && hr < 13 ? T.hello.n : hr >= 13 && hr < 18 ? T.hello.a : T.hello.e;
    const hh = $("#hmHello"); if (hh) hh.innerHTML = `<span>${esc(hello[l])}</span><i aria-hidden="true">·</i><span>${esc(MONL[l][mo - 1].charAt(0).toUpperCase() + MONL[l][mo - 1].slice(1))} · ${esc((dry ? T.season.dry : T.season.wet)[l])}</span>`;
    const sg = $("#hmSign"); if (sg) sg.textContent = T.sign[l];
    { const tt = L("title"), ta = L("titleA"), k = tt.lastIndexOf(ta); $("#hmTitle").innerHTML = k > 0 ? `${esc(tt.slice(0, k))}<em>${esc(ta)}</em>${esc(tt.slice(k + ta.length))}` : esc(tt) }
    $("#hmLead").textContent = L("lead");
    $("#hmStart").innerHTML = `<span>${esc(L("start"))}</span>${ICO.arr}`;
    const how = $("#hmHow"); if (how) how.textContent = L("howH");
    $("#hmSteps").innerHTML = [["pin", "s1"], ["field", "s2"], ["cal", "s3"]].map(([i, k]) =>
      `<li><span class="hm-ico">${ICO[i]}</span><span class="hm-step-t">${esc(L(k))}</span></li>`).join("");
    $("#hmAlert").innerHTML = `<h2>${ICO.warn}<span>${esc(L("alert"))}</span></h2><p>${esc(outlookText())}</p><p class="hm-alert-tip">${esc(L("alertTip"))}</p>`;
    const fl = fields(), a = app(), box = $("#hmFields");
    const canAdd = !!(a && typeof a.openFieldForm === "function");
    if (fl.length) {
      box.hidden = false;
      box.innerHTML = `<h2 class="hm-h">${esc(L("fields"))}</h2>` + fl.map((f) => {
        const sn = siteName(f.site);
        return `<button type="button" class="hm-field" data-hfield="${esc(f.id)}"><span><b>${esc(L("cont"))}: ${esc(f.name || sn)}</b>${sn && sn !== f.name ? `<small>${esc(sn)}</small>` : ""}</span>${ICO.arr}</button>`;
      }).join("") + (canAdd ? `<div><button type="button" class="hm-link" id="hmAdd">${ICO.plus}<span>${esc(L("add"))}</span></button></div>` : "");
    } else { box.hidden = true; box.innerHTML = "" }
    const now = $("#hmNow"); if (now) { const html = nowCard(); now.hidden = !html; now.innerHTML = html }
    const prep = $("#hmPrep"); if (prep) prep.innerHTML = prepCard();
    const dat = $("#hmData"); if (dat) dat.innerHTML = dataCard();
    $("#hmSources").innerHTML = `${ICO.book}<span>${esc(L("sources"))}</span>`;
    const vn = $("#hmVn"); if (vn) vn.innerHTML = `${ICO.pin}<span>${esc(L("vn"))}</span>`;
  }

  /* everything that is not the home page, the dialog or the toast */
  const chrome = () => Array.from(document.body.children).filter((n) => n.id !== "home" && n.id !== "modal" && n.id !== "toast" && n.tagName !== "SCRIPT");
  function setInert(on) { chrome().forEach((n) => { if (on) { if (!n.inert) { n.inert = true; n.dataset.homeInert = "1" } } else if (n.dataset.homeInert) { n.inert = false; delete n.dataset.homeInert } }) }
  let shown = false;
  /* Fraunces (the home page's display face) is fetched only when the home page opens; the dashboard never needs it */
  function displayFont() {
    if (document.getElementById("hmFont")) return;
    const l = document.createElement("link"); l.id = "hmFont"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&display=swap";
    document.head.appendChild(l);
  }
  function show() {
    displayFont();
    const b = document.body;
    shown = true; b.classList.add("home-on"); b.classList.remove("home-off"); setInert(true);
    render();
    const h = $("#home"); if (h) h.scrollTop = 0;
    setTimeout(() => { const t = $("#hmTitle"); if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }) } }, 30);
  }
  function hide() {
    const b = document.body;
    shown = false; b.classList.remove("home-on"); b.classList.add("home-off"); setInert(false);
    if (typeof MapView !== "undefined" && MapView && typeof MapView.resize === "function") {
      requestAnimationFrame(() => {
        try { MapView.resize() } catch (e) {}
        const a = app();
        if (!(a && typeof a.site === "function" && a.site()) && !b.classList.contains("drawer-open") && typeof MapView.home === "function") { try { MapView.home() } catch (e) {} }
      });
    }
  }
  /* open one area: app.js has no public "choose site" call, but its document click handler selects
     an area for any [data-site] button, so a short-lived one is clicked after home closes */
  function openArea(id) {
    hide();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const b = document.createElement("button");
      b.type = "button"; b.dataset.site = id; b.hidden = true;
      document.body.appendChild(b);
      try { b.click() } finally { b.remove() }
    }));
  }

  document.addEventListener("click", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    let el;
    if (t.closest("#hmStart")) { hide(); const c = $("#heroCta"); setTimeout(() => c && c.focus({ preventScroll: true }), 40); return }
    if ((el = t.closest("[data-harea]"))) { openArea(el.dataset.harea); return }
    if ((el = t.closest("[data-htip]"))) {
      const i = +el.dataset.htip, v = prepGet(), on = !v.includes(i);
      prepSet(on ? v.concat(i) : v.filter((x) => x !== i));
      el.setAttribute("aria-pressed", String(on)); return
    }
    if ((el = t.closest("[data-hfield]"))) { const id = el.dataset.hfield, a = app(); hide(); if (a && typeof a.openField === "function") a.openField(id); return }
    if (t.closest("#hmAdd")) { const a = app(); hide(); if (a && typeof a.openFieldForm === "function") a.openFieldForm(); return }
    if ((el = t.closest("[data-hlang]"))) { const btn = document.getElementById(el.dataset.hlang === "en" ? "lEn" : "lVi");
      if (btn) { const box = btn.closest("[data-home-inert]"); if (box) box.inert = false; btn.click(); if (box && shown) box.inert = true }  /* app.js owns the language switch */
      setTimeout(render, 0); return }
    if (t.closest("#brand")) { e.preventDefault(); show(); return }
    if (t.closest("#lEn, #lVi")) setTimeout(render, 0);
  });
  /* app chrome added later (e.g. #areaDock, #d5Month) stays inert while home shows */
  new MutationObserver(() => { if (shown) setInert(true) }).observe(document.body, { childList: true });

  /* "Ruộng của tôi" (dash.js) is the first screen now; the landing page shows only when that module is absent */
  function init() { if (location.hash === "#plan-lab" || typeof Dash !== "undefined") hide(); else show() }
  if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(init); else init();
  return { render, show, hide, isOn: () => shown };
})();
