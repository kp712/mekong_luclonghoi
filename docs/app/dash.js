/* dash.js: "Ruộng của tôi" — the dashboard of saved fields, drawn as a glass panel over the satellite map
   (same look as the area panel, side.js). "Thêm ruộng" opens the map flow (app.js steps 1–4); the plan chosen
   there is saved back here with "Lưu vào Ruộng của tôi". Reads DATA, RX.Model, MapView, window.App. */
const Dash = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const KEY = "mre-farm";
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} };
  const lang = () => (window.App && App.lang && App.lang()) || "vi";
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang()] || o.vi || o.en || "");
  const nf = (x, d = 0) => { const s = (+x).toFixed(d); return lang() === "vi" ? s.replace(".", ",") : s };
  let CM = Season.now().getMonth();   /* the month on show: today, or the month being played in the year simulation */
  /* whole numbers with a thousands mark (1.335 / 1,335); a size keeps up to 2 decimals (0,05 ha) */
  const big = (x) => Math.round(+x).toLocaleString(lang() === "vi" ? "vi-VN" : "en-US");
  const haS = (x) => nf(+x, 2).replace(/[.,]?0+$/, "");

  /* ---------------- words ---------------- */
  const W = {
    vi: {
      viewing: "Đang xem", nowTag: "(tháng này)", resetM: "Về tháng này", pickM: "Chọn tháng để xem", tapTile: "Chạm vào một ô để mở to và xem chi tiết. Chạm vào một tháng để xem tháng đó.", open: "Mở",
      saltA: "Độ mặn trong ruộng", rainMo: "Mưa tháng này", needMo: "Cây cần nước", cropH: "Trồng", needH: "Cây cần nước",
      mOk: (m) => `${m}: cây trồng an toàn`, mBad: (m) => `${m}: cây gặp nước mặn`, mRest: (m) => `${m}: không trồng lúa hay cây màu`,
      rangeK: "thấp nhất · giữa · cao nhất (triệu/công)", figs: "số liệu", cmpH: "So với các cách trồng khác", safeWhy: "Các tháng có lúa hoặc cây màu, tháng nào nước trong ruộng không mặn (dưới 2‰) là an toàn.",
      zOk: "An toàn", zBad: "Gặp mặn", whyScores: "Vì sao có điểm này", rainNeed: "Mưa và nước cây cần, từng tháng", ndviH: "Độ xanh của ruộng (NDVI, NASA MODIS)",
      kWhy: (n) => `(hiệu chỉnh bằng NASA MODIS: vệ tinh thấy ${n} vụ/năm, nên các vụ đó không mất mùa vì mặn năm thường).`,
      peakH: "Mặn cao nhất ở trạm", saltMs: "Tháng mặn", rainCmp: "Mưa từng tháng: năm thường và năm El Niño",
      delThis: "Xoá ruộng này", delH: (n) => `Xoá "${n}"?`, delP: "Kế hoạch của ruộng này sẽ bị xoá khỏi máy. Không lấy lại được.", delYes: "Xoá ruộng", cancel: "Không xoá", deleted: "Đã xoá ruộng",
      modeH: "Giao diện", modeS: "Đơn giản: ít chữ, chỉ điều cần làm", modeA: "Nâng cao: thêm số liệu, thanh kéo và nguồn",
      sNow: "Nước tháng này", sMoney: "Tiền lời", sTodo: "Việc tháng này",
      modeL: "Chế độ", addShort: "Thêm ruộng", welcome: "Chào mừng! Hãy tạo ruộng đầu tiên", welcomeP: "Bạn chưa có ruộng nào. Tạo ruộng để xem lịch làm, nước mặn và tiền lời của ruộng mình.",
      wsteps: ["Chọn khu vực của bạn trên bản đồ", "Trả lời vài câu về ruộng", "Chọn cách trồng và lưu lại"], create: "Tạo ruộng",
      waterNow: "Nước trong ruộng tháng này", perCong: "triệu đồng mỗi công mỗi năm", perCongS: "tr/công", tapPlanS: "Kế hoạch 12 tháng", ninoShort: "Năm nay có thể hạn mặn (El Niño). Mặn có thể đến sớm hơn.",
      saltNowA: "Độ mặn trong ruộng, tháng này", chartH: "Mặn và mưa trong 12 tháng", chartL: "Biểu đồ độ mặn và lượng mưa theo tháng", rainM: "Mưa", safeH: "Tháng có cây trồng an toàn mặn", safeL: "tháng",
      nums: "Số liệu khu vực", cropsY: "Vụ/năm thấy từ vệ tinh", rainY: "Mưa cả năm", needY: "Cây cần nước cả năm", kL: "hệ số sông → ruộng", rankH: "Cách trồng hợp nhất", rankSrc: "Điểm 1–5 theo câu trả lời của bạn", ninoH: "El Niño năm nay",
      eyebrow: "Bờ biển Sóc Trăng · dữ liệu NASA", brand: "Ruộng của tôi", lead: "Các ruộng bạn đã lập kế hoạch. Chạm vào một ruộng để xem lại kế hoạch đã chọn.",
      add: "Thêm ruộng trên bản đồ", emptyP: "Chọn khu vực trên bản đồ, trả lời vài câu, rồi chọn cách luân canh. Kế hoạch sẽ được lưu ở đây.",
      simple: "Đơn giản", adv: "Nâng cao", monthOn: (m) => `Tháng ${m} trên ruộng của bạn`, nextM: (m) => `Tháng ${m}`,
      saltIn: (a, b) => `Nước mặn từ tháng ${a} đến khoảng tháng ${b}`, saltNow: (lv, m) => `Nước đang ${lv}, đến khoảng tháng ${m}`, saltNone: "Ruộng không bị mặn trong năm (có cống ngăn mặn)",
      est: "Độ mặn là ước tính từ báo cáo trạm đo, không đo bằng vệ tinh", ribbonH: "Lịch 12 tháng", tapPlan: "Xem bảng kế hoạch 12 tháng",
      lv: { ngot: "Ngọt", lo: "Hơi mặn", man: "Mặn" }, lvL: { ngot: "ngọt", lo: "hơi mặn", man: "mặn" },
      lvD: { ngot: "dưới 1‰: lúa an toàn", lo: "1–2‰: lúa bắt đầu yếu", man: "trên 2‰: lúa giảm năng suất (FAO)" },
      clash: (xs) => `Chú ý: lúa gặp nước mặn ở ${xs.join(", ")}. Đo độ mặn trước khi sạ, nước còn mặn thì chờ mưa.`, noClash: "Tốt: lịch này tránh được tháng nước mặn",
      ninoNote: "Năm nay nhiều khả năng là năm hạn mặn (El Niño, NOAA dự báo trên 83%). Mặn có thể đến sớm hơn và mặn hơn.", thisYr: "Năm nay", years: { typical: "Năm thường", elnino: "Năm El Niño" },
      moneyYr: "Năm nay, có thể hạn mặn.", moneyTyp: (a) => `Năm bình thường: ${a} triệu/công.`, moneySrcS: "Lấy số giữa của các số liệu lợi nhuận đã công bố · 1 công = 1.000 m²",
      rbKey: "Số = tháng · Thanh màu = nước trong kênh", rbNow: "Tháng này", rbKeyA: "T1–T12 = tháng 1–12 · Thanh màu = nước trong kênh", usedT: (n) => `Đã đổi sang: ${n}`, editField: "Sửa ruộng", langH: "Ngôn ngữ · Language",
      moneyH: "Tiền lời ước tính", money: (a, b) => `Năm nay khoảng <b>${b}</b> triệu/công. Năm bình thường: ${a} triệu/công.`, money1: (a) => `Khoảng <b>${a}</b> triệu/công mỗi năm.`,
      tot: (h, v) => `Cả ruộng ${h} ha: khoảng ${v} triệu.`, noMoney: "Chưa đủ số liệu lợi nhuận cho cách trồng này", moneySrc: "Trung vị lợi nhuận đã công bố · 1 công = 1.000 m²",
      whyH: "Vì sao chọn cách này", riskH: "Cần lưu ý", scoreH: "Điểm của cách trồng (1–5)", sc: { salt: "An toàn mặn", water: "Tiết kiệm nước", soil: "Tốt cho đất", income: "Thu nhập", pests: "Ít sâu bệnh" },
      print: "In / lưu file", change: "Đổi cách trồng", editMap: "Sửa trên bản đồ", sources: "Nguồn dữ liệu NASA", back: "Quay lại", close: "Đóng",
      crop: { R: "Lúa", S: "Tôm", U: "Cây màu", "-": "Nghỉ" },
      job: { restA: "Cho ruộng nghỉ, dọn rơm rạ", rest: "Ruộng nghỉ, chuẩn bị vụ sau", R0: (n) => `Làm đất, gieo sạ ${n}`, R1: (n) => `Thu hoạch ${n}`, R: (n) => `Chăm ${n}: bón phân, giữ nước`,
        S0: "Cải tạo ao, thả giống tôm", S1: "Thu hoạch tôm", S: "Chăm tôm: giữ mực nước, đo độ mặn", U0: (n) => `Làm luống, gieo ${n}`, U1: (n) => `Thu hoạch ${n}`, U: (n) => `Chăm ${n}: tưới, bón phân` },
      sowWait: (n) => `Đo độ mặn trước khi sạ ${n}. Nước còn mặn thì chờ mưa rửa mặn.`,
      tMonth: "Tháng", tJob: "Việc chính", tSalt: "Nước", seed: "Giống", fert: "Phân bón", steps: "Các bước chính", tapMonth: "Chạm vào một tháng để xem giống, phân bón và các bước.",
      preview: "Bản in", save: "Lưu file", doPrint: "In", printHint: "Bản in khổ A4. Lưu file rồi mở để in hoặc lưu PDF.", saved: "Đã lưu",
      ask: "Hỏi cán bộ khuyến nông trước khi đổi cách canh tác.", chooseH: "Đổi cách trồng", chooseP: "Các cách trồng xếp theo độ hợp với ruộng của bạn:", bestFor: (n) => `Hợp nhất với ruộng bạn: ${n}`,
      use: "Dùng cách này", current: "Đang dùng", fit: "Hợp", optsH: "Câu trả lời về ruộng", editAns: "Sửa câu trả lời", sizeErr: "Hãy nhập diện tích lớn hơn 0 và dưới 1.000 ha (1 ha = 10 công).", notHere: "Không làm được ở ruộng này", planNo: "Ruộng bạn không lấy được nước lợ, nên cách trồng này không làm được ở đây. Hãy chọn cách trồng khác.",
      yrsH: "Kế hoạch nhiều năm", yrsN: (n) => `${n} năm`, yrsP: "Mỗi năm chọn một cách trồng và năm thường hay năm El Niño. Năm 1 theo dự báo NOAA; các năm sau là giả định để so sánh.",
      yrN: (i) => `Năm ${i}`, yrPick: (i) => `Cách trồng năm ${i}`, yrType: (i) => `Loại năm ${i}`, yrProfit: "Lời", yrCost: "Vốn", yrNoFig: "chưa có số liệu",
      yrClash: (n) => `${n} tháng cây gặp mặn`, yrSafe: "Cây không gặp mặn", yrSum: (n) => `Cộng ${n} năm`, yrSumP: "Tổng lời", yrSumC: "Tổng vốn",
      yrField: (h) => `cho cả ruộng ${h} ha`, yrCong: "cho 1 công", yrNoSize: "Nhập diện tích ruộng (Sửa câu trả lời) để xem số cho cả ruộng.",
      yrSwitch: "Đổi cách trồng giữa hai năm: ruộng cần thời gian rửa mặn hoặc làm lại bờ, nên tháng đầu năm mới có thể trễ hơn.",
      yrWho: (p, m) => `Câu trả lời của bạn: người làm trong nhà: ${p} · máy móc: ${m}.`, yrHow: "Tổng lời = lời giữa các số liệu đã công bố × số năm (năm El Niño dùng số năm El Niño). Giá thay đổi mỗi năm; đây là ước tính, không phải dự báo giá.",
      seasons: "Ba vụ trong năm", sz: ["Vụ Đông Xuân (T11–T2)", "Vụ Hè Thu (T4–T7)", "Vụ Thu Đông (T8–T10)"],
      people: "Người làm trong nhà", machines: "Máy móc", pv: ["Ít", "Vừa", "Nhiều"], mv: ["Không có", "Thuê được", "Có sẵn"], brack: "Ruộng không lấy được nước lợ",
      goal: "Điều quan trọng nhất", goals: { salt: "Tránh mặn", profit: "Lãi nhiều", water: "Ít nước" }, year: "Tính theo", size: "Diện tích (ha)", name: "Tên ruộng",
      better: (n) => `Với câu trả lời mới, cách trồng hợp hơn: ${n}`, del: "Xoá ruộng", delQ: "Xoá ruộng này?", fieldN: (i) => `Ruộng ${i}`,
      saveField: "Lưu vào Ruộng của tôi", updField: "Cập nhật ruộng này", savedT: "Đã lưu vào Ruộng của tôi", toDash: "Ruộng của tôi", mapHint: "Chạm vào khu vực có ruộng của bạn", mapEdit: "Đang sửa: {n}",
      tabs: { salt: "Mặn", money: "Tiền", soil: "Đất & nước" }, river: "Sông (trạm đo)", field: "Trong ruộng (ước tính)",
      seen: (n) => `Vệ tinh NASA MODIS thấy khoảng ${n} vụ/năm`, rain: (n) => `Mưa cả năm khoảng ${n} mm (NASA GPM IMERG)`, clay: "Đất sét", range: (a, b, c) => `${a}–${c} triệu/công (giữa ${b})`,
      areaSalt: { high: "Mặn cao", medium: "Mặn vừa", low: "Mặn thấp" }, conf: "Độ tin cậy", confL: { high: "cao", medium: "vừa", low: "thấp" },
      scSrc: "Nước: NASA POWER + GPM IMERG · Mặn: trạm đo + NASA POWER · Thu nhập: lợi nhuận đã công bố · Sâu bệnh: nhiệt độ NASA POWER (đường cong rầy nâu, Horgan và cộng sự 2020)", why: "Vì sao"
    },
    en: {
      viewing: "Viewing", nowTag: "(this month)", resetM: "Back to this month", pickM: "Pick a month to view", tapTile: "Tap a tile to open it large with details. Tap a month to view that month.", open: "Open",
      saltA: "Salt in the field", rainMo: "Rain this month", needMo: "Crop water need", cropH: "Growing", needH: "Crop water need",
      mOk: (m) => `${m}: crops are safe`, mBad: (m) => `${m}: crops meet salty water`, mRest: (m) => `${m}: no rice or upland crop`,
      rangeK: "lowest · middle · highest (M₫/công)", figs: "figures", cmpH: "Compared with other plans", safeWhy: "Months with rice or an upland crop; a month is safe when the field water is not salty (under 2‰).",
      zOk: "Safe", zBad: "Salty", whyScores: "Why these scores", rainNeed: "Rain and crop water need, month by month", ndviH: "Field greenness (NDVI, NASA MODIS)",
      kWhy: (n) => `(NASA MODIS calibration: the satellite sees ${n} crops a year, so those crops lose nothing to salt in a typical year).`,
      peakH: "Highest salt at the station", saltMs: "Salty months", rainCmp: "Rain by month: typical and El Niño years",
      delThis: "Delete this field", delH: (n) => `Delete "${n}"?`, delP: "This field's plan will be removed from this device. It cannot be undone.", delYes: "Delete field", cancel: "Keep it", deleted: "Field deleted",
      modeH: "View", modeS: "Simple: few words, just what to do", modeA: "Advanced: more numbers, sliders and sources",
      sNow: "Water this month", sMoney: "Profit", sTodo: "This month's job",
      modeL: "Mode", addShort: "Add field", welcome: "Welcome! Please create your first field", welcomeP: "You have no fields yet. Create one to see your jobs, salty water and profit for your field.",
      wsteps: ["Pick your area on the map", "Answer a few questions about the field", "Choose a plan and save it"], create: "Create a field",
      waterNow: "Water in your field this month", perCong: "million ₫ per công per year", perCongS: "M₫/công", tapPlanS: "12-month plan", ninoShort: "This may be a drought-and-salt year (El Niño). Salt may come earlier.",
      saltNowA: "Salt in the field, this month", chartH: "Salt and rain over 12 months", chartL: "Chart of salt and rain by month", rainM: "Rain", safeH: "Crop months safe from salt", safeL: "months",
      nums: "Area numbers", cropsY: "Crops/year seen by satellite", rainY: "Rain in a year", needY: "Crop water need in a year", kL: "river → field factor", rankH: "Best-fitting plans", rankSrc: "Scores 1–5 from your answers", ninoH: "El Niño this year",
      eyebrow: "Sóc Trăng coast · NASA data", brand: "My fields", lead: "Fields you have planned. Tap one to see the plan you chose.",
      add: "Add a field on the map", emptyP: "Pick your area on the map, answer a few questions, then choose a rotation. The plan is saved here.",
      simple: "Simple", adv: "Advanced", monthOn: (m) => `Month ${m} on your field`, nextM: (m) => `Month ${m}`,
      saltIn: (a, b) => `Salty water from month ${a} to about month ${b}`, saltNow: (lv, m) => `Water is ${lv} now, until about month ${m}`, saltNone: "No salt in this field all year (sluice protected)",
      est: "Salt is an estimate from station reports, not measured by satellite", ribbonH: "12-month calendar", tapPlan: "See the 12-month plan table",
      lv: { ngot: "Fresh", lo: "Brackish", man: "Salty" }, lvL: { ngot: "fresh", lo: "brackish", man: "salty" },
      lvD: { ngot: "under 1‰: rice is safe", lo: "1–2‰: rice starts to suffer", man: "over 2‰: rice loses yield (FAO)" },
      clash: (xs) => `Careful: crops meet salty water in ${xs.join(", ")}. Measure salt before sowing; wait for rain if it is still salty.`, noClash: "Good: this plan avoids the salty months",
      ninoNote: "This is likely a drought-and-salt year (El Niño, NOAA: over 83%). Salt may come earlier and stronger.", thisYr: "This year", years: { typical: "Typical year", elnino: "El Niño year" },
      moneyYr: "This year, a possible drought-and-salt year.", moneyTyp: (a) => `Typical year: ${a} M₫/công.`, moneySrcS: "Middle value of the published profit figures · 1 công = 1,000 m²",
      rbKey: "Coloured bar = canal water", rbNow: "This month", rbKeyA: "Coloured bar = canal water", usedT: (n) => `Changed to: ${n}`, editField: "Edit field", langH: "Language · Ngôn ngữ",
      moneyH: "Estimated profit", money: (a, b) => `This year about <b>${b}</b> M₫/công. Typical year: ${a} M₫/công.`, money1: (a) => `About <b>${a}</b> M₫/công a year.`,
      tot: (h, v) => `Whole field ${h} ha: about ${v} M₫.`, noMoney: "Not enough profit data for this plan yet", moneySrc: "Median of published profit figures · 1 công = 1,000 m²",
      whyH: "Why this plan", riskH: "Watch out for", scoreH: "Plan scores (1–5)", sc: { salt: "Salt safety", water: "Saves water", soil: "Better soil", income: "Income", pests: "Fewer pests" },
      print: "Print / save file", change: "Change plan", editMap: "Edit on the map", sources: "NASA data sources", back: "Back", close: "Close",
      crop: { R: "Rice", S: "Shrimp", U: "Upland crop", "-": "Rest" },
      job: { restA: "Rest the field, clear the straw", rest: "Field rests, prepare the next crop", R0: (n) => `Prepare the field, sow ${n}`, R1: (n) => `Harvest ${n}`, R: (n) => `Tend ${n}: fertilise, keep water`,
        S0: "Clean the pond, stock shrimp", S1: "Harvest shrimp", S: "Tend shrimp: keep water level, check salt", U0: (n) => `Make beds, sow ${n}`, U1: (n) => `Harvest ${n}`, U: (n) => `Tend ${n}: water, fertilise` },
      sowWait: (n) => `Measure salt before sowing ${n}. If the water is still salty, wait for rain.`,
      tMonth: "Month", tJob: "Main job", tSalt: "Water", seed: "Seed", fert: "Fertiliser", steps: "Key steps", tapMonth: "Tap a month to see seed, fertiliser and steps.",
      preview: "Print view", save: "Save file", doPrint: "Print", printHint: "A4 print view. Save the file, then open it to print or save as PDF.", saved: "Saved",
      ask: "Talk to your extension officer before you change how you farm.", chooseH: "Change plan", chooseP: "Plans ranked by how well they fit your field:", bestFor: (n) => `Best fit for your field: ${n}`,
      use: "Use this plan", current: "In use", fit: "Fit", optsH: "About your field", editAns: "Change my answers", sizeErr: "Enter a size above 0 and under 1,000 ha (1 ha = 10 công).", notHere: "Not possible on this field", planNo: "No brackish water reaches your field, so this plan cannot work here. Please pick another plan.",
      yrsH: "Plan over several years", yrsN: (n) => (n === 1 ? "1 year" : `${n} years`), yrsP: "Pick a plan for each year, and a typical or El Niño year. Year 1 follows the NOAA forecast; later years are what-ifs to compare.",
      yrN: (i) => `Year ${i}`, yrPick: (i) => `Plan for year ${i}`, yrType: (i) => `Kind of year ${i}`, yrProfit: "Profit", yrCost: "Cost", yrNoFig: "no figure yet",
      yrClash: (n) => (n === 1 ? "1 crop month meets salt" : `${n} crop months meet salt`), yrSafe: "Crops stay clear of salt", yrSum: (n) => (n === 1 ? "1 year" : `${n} years together`), yrSumP: "Total profit", yrSumC: "Total cost",
      yrField: (h) => `for the whole field, ${h} ha`, yrCong: "for 1 công", yrNoSize: "Enter your field size (Change my answers) to see whole-field money.",
      yrSwitch: "Changing plan between two years: the field needs time to flush salt or rebuild banks, so the first month of the new year may start later.",
      yrWho: (p, m) => `Your answers: people at home: ${p} · machines: ${m}.`, yrHow: "Total profit = middle of the published profit figures, year by year (El Niño years use the El Niño figure). Prices change every year; this is an estimate, not a price forecast.",
      seasons: "Three seasons", sz: ["Winter–spring (Nov–Feb)", "Summer–autumn (Apr–Jul)", "Autumn–winter (Aug–Oct)"],
      people: "People at home", machines: "Machines", pv: ["Few", "Some", "Many"], mv: ["None", "Can hire", "Own"], brack: "No brackish water reaches the field",
      goal: "What matters most", goals: { salt: "Avoid salt", profit: "More profit", water: "Less water" }, year: "Based on", size: "Size (ha)", name: "Field name",
      better: (n) => `With your new answers, a better fit: ${n}`, del: "Delete field", delQ: "Delete this field?", fieldN: (i) => `Field ${i}`,
      saveField: "Save to My fields", updField: "Update this field", savedT: "Saved to My fields", toDash: "My fields", mapHint: "Tap the area where your field is", mapEdit: "Editing: {n}",
      tabs: { salt: "Salt", money: "Money", soil: "Soil & water" }, river: "River (station)", field: "In the field (estimate)",
      seen: (n) => `NASA MODIS sees about ${n} crops a year`, rain: (n) => `Rain about ${n} mm a year (NASA GPM IMERG)`, clay: "Clay", range: (a, b, c) => `${a}–${c} M₫/công (middle ${b})`,
      areaSalt: { high: "High salt", medium: "Medium salt", low: "Low salt" }, conf: "Confidence", confL: { high: "high", medium: "medium", low: "low" },
      scSrc: "Water: NASA POWER + GPM IMERG · Salt: stations + NASA POWER · Income: published profit · Pests: NASA POWER temperature (brown planthopper curve, Horgan et al. 2020)", why: "Why"
    }
  };
  const T = (k) => W[lang()][k];

  /* line icons, same set and stroke as the Plan Lab */
  const ICON = {
    bug: '<ellipse cx="12" cy="14" rx="4.6" ry="5.8"/><path d="M12 8.2V20"/><path d="M9.4 6.4 8 4.5M14.6 6.4 16 4.5"/><path d="M7.4 11.5 4.5 10M7.4 15H4M7.8 18.2 5 20M16.6 11.5l2.9-1.5M16.6 15H20M16.2 18.2 19 20"/><circle cx="12" cy="7.6" r="2.2"/>',
    rice: '<path d="M12 21V8"/><path d="M12 8c-2.4-.6-3.6-2.4-3.6-5 2.4.6 3.6 2.4 3.6 5Z"/><path d="M12 8c2.4-.6 3.6-2.4 3.6-5-2.4.6-3.6 2.4-3.6 5Z"/><path d="M12 14c-2.4-.6-3.6-2.4-3.6-5"/><path d="M12 14c2.4-.6 3.6-2.4 3.6-5"/>',
    shrimp: '<path d="M4 16c.8-6 5.6-10 11.5-9.2 3.2.4 4 3.4 2 5.2-1.8 1.7-4.6 1-5.8 3.2L9 20"/><path d="M4 16l3 1"/><circle cx="16" cy="9.5" r=".6"/>',
    upland: '<path d="M12 21v-8"/><path d="M12 13c-4.2 0-6.2-3-6.2-7 4.2 0 6.2 3 6.2 7Z"/><path d="M12 15c0-4 2-6 6-6 0 4-2 6-6 6Z"/>',
    fallow: '<path d="M4 12h3"/><path d="M10.5 12h3"/><path d="M17 12h3"/>',
    warn: '<path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 10v4.5"/><path d="M12 17.4v.1"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>', basket: '<path d="M3.5 10h17l-2 9.5h-13L3.5 10Z"/><path d="M8 10l3-6M16 10l-3-6M9 14v2.5M12 14v2.5M15 14v2.5"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M14.6 9.2c-.4-.9-1.3-1.4-2.6-1.4-1.6 0-2.6.7-2.6 1.8 0 2.6 5.2 1.2 5.2 3.8 0 1.1-1.1 1.8-2.6 1.8-1.3 0-2.2-.6-2.6-1.5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><path d="M6 14h12v7H6z"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>', map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>', chev: '<path d="M9 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    seed: '<path d="M12 20c-4 0-7-3-7-8 4 0 7 3 7 8Z"/><path d="M12 20c0-6 3-10 8-11 0 6-3 10-8 11Z"/>', drop: '<path d="M12 3.5c3.5 4.2 6 7.6 6 10.5a6 6 0 0 1-12 0c0-2.9 2.5-6.3 6-10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    edit: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4Z"/><path d="M14 7l3 3"/>',
    home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
    chart: '<path d="M4 20h16"/><path d="M7 20v-7"/><path d="M12 20V6"/><path d="M17 20v-10"/>'
  };
  const ic = (n, s = 18) => `<svg class="dv-i" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[n] || ""}</svg>`;

  /* ---------------- model helpers ---------------- */
  const sites = () => DATA.sites;
  const siteOf = (id) => sites().find((s) => s.id === id) || sites()[0];
  const short = (s) => { const m = lang() === "vi" ? L(s.name).match(/Khu vực (.+?) cũ/) : L(s.name).match(/Former (.+?) area/); return m ? m[1] : L(s.name).split(" (")[0] };
  const areaLv = (id) => { try { return (RX.DATA.sites.find((x) => x.id === id) || {}).level || "medium" } catch (e) { return "medium" } };
  const SK = ["salt", "water", "soil", "pests", "income"];   /* the five card scores, in the order the bars show them */
  const GOALS = { salt: { salt: 3, water: 2, income: 1, soil: 1, pests: 1 }, profit: { income: 3, salt: 1, water: 1, soil: 1, pests: 1 }, water: { water: 3, salt: 2, income: 1, soil: 1, pests: 1 } };
  const PEN = [[0.5, 0.4, 0.3], [0, 0, 0], [0, 0, 0]];
  const SEAS_OF = { rice3: ["R", "R", "R"], rice2: ["R", "R", "-"], rice_shrimp: ["S", "S", "R"], rice_upland: ["U", "R", "R"] };
  const resolve = (c, crop) => { if (!c.variants) return c; const ks = Object.keys(c.variants); return { ...(c.variants[ks.includes(crop) ? crop : c.crop_default] || c.variants[ks[0]]), id: c.id } };
  const cardsFor = (s, year, crop) => ((year === "elnino" && s.el && s.el.cards) ? s.el.cards : s.cards).map((c) => resolve(c, crop));
  const isNino = (f) => (Season.yearOf() >= 1 ? false : f.year ? f.year === "elnino" : true);   /* default: this season, NOAA >83% El Niño; plan years 2–3 of the preview use the typical year (the outlook covers one season) */
  const yr = (f) => (isNino(f) ? "elnino" : "typical");
  const cardOf = (f, year) => { const cs = cardsFor(siteOf(f.site), year || yr(f), f.crop); return cs.find((c) => c.id === f.rot) || cs[0] };
  /* the field's 12-month plan from this month: today's crop first, then the rotation (season.js) */
  const planOf = (f, year) => { const a0 = Season.absOf(Season.real()); return Season.windowOf(cardOf(f, year), f.now, Season.mStart(a0 + 12 * Season.yearOf())) };
  const PV = (c, m) => (c.pv ? c.pv[m] : c.months[(m + 11) % 12]), NX = (c, m) => (c.nx ? c.nx[m] : c.months[(m + 1) % 12]);
  const W0 = (c) => (c.m0 != null ? c.m0 : CM);   /* first month of the plan window */
  const weightsOf = (f) => { const w = f.weights || GOALS[f.goal || "salt"]; return { ...w, pests: w.pests ?? 2 } };   /* fields saved before the Pests score have no pests weight */
  function scoreOf(c, f) {
    const w = weightsOf(f), ks = SK.filter((k) => c.scores[k] != null), tot = ks.reduce((a, k) => a + w[k], 0);
    let s = tot ? ks.reduce((a, k) => a + w[k] * c.scores[k], 0) / tot : ks.reduce((a, k) => a + c.scores[k], 0) / ks.length;
    if (c.upland) s -= PEN[f.wfP ?? 1][f.wfM ?? 0];
    return Math.max(1, s);
  }
  const rank = (f) => cardsFor(siteOf(f.site), yr(f), f.crop).map((c) => ({ c, s: scoreOf(c, f), no: !!(c.not_here || (c.needs_brackish && f.noBrackish)) })).sort((a, b) => (a.no - b.no) || (b.s - a.s));
  const fieldSalt = (id, m, nino) => { try { return RX.Model.saltAt(id, m, nino, true) || 0 } catch (e) { return 0 } };
  const riverSalt = (id, m, nino) => { try { return RX.Model.saltAt(id, m, nino, false) || 0 } catch (e) { return 0 } };
  const level = (g) => (g < 1 ? "ngot" : g < 2 ? "lo" : "man");
  const LVC = { ngot: "low", lo: "medium", man: "high" };
  const resKey = (c, code) => { const p = c.plan && c.plan[code]; if (p && p.res && p.res[0]) return p.res[0]; return code[0] === "S" ? "shrimp" : code[0] === "U" ? (c.crop || "watermelon") : c.id === "salt_tolerant" ? "rice_st" : "rice" };
  const cropName = (c, code) => { if (code === "-") return T("crop")["-"]; const p = c.plan && c.plan[code]; if (p && p.name) return L(p.name); const r = DATA.resources[resKey(c, code)]; return r ? L(r.name) : T("crop")[code[0]] };
  const iconOf = (code) => ic({ R: "rice", S: "shrimp", U: "upland" }[code[0]] || "fallow", 16);
  let curSite = null, curNino = true;
  function jobAt(c, m) {
    const code = c.months[m], prev = PV(c, m), next = NX(c, m), J = T("job");
    const cl = c.cells && c.cells.find((y) => y.m === m);
    if (code === "-") return cl && cl.src === "wait" ? T("waitJob") : prev !== "-" && prev[0] !== "S" ? J.restA : J.rest;
    const k = code[0], n = cropName(c, code), st0 = prev !== code, en = next !== code, f = (x) => (typeof x === "function" ? x(n) : x);
    if (st0 && k !== "S" && curSite && level(fieldSalt(curSite, m, curNino)) === "man") return T("sowWait")(n);
    if (st0 && cl && cl.late) return T("lateSow")(n);
    return st0 ? f(J[k + "0"]) : en ? f(J[k + "1"]) : f(J[k]);
  }
  const clashOf = (f, c) => { const nino = isNino(f), out = []; c.months.forEach((code, m) => { if ((code[0] === "R" || code[0] === "U") && level(fieldSalt(f.site, m, nino)) === "man") out.push((lang() === "vi" ? "T" : "M") + (m + 1)) }); return out };
  function saltLine(f) {
    const nino = isNino(f), lvs = [...Array(12)].map((_, m) => level(fieldSalt(f.site, m, nino)));
    if (lvs.every((x) => x === "ngot")) return { txt: T("saltNone"), lv: "ngot" };
    if (lvs[CM] !== "ngot") { let e = CM; for (let i = 1; i < 12; i++) { const m = (CM + i) % 12; if (lvs[m] === "ngot") break; e = m } return { txt: T("saltNow")(T("lvL")[lvs[CM]], e + 1), lv: lvs[CM] } }
    for (let i = 1; i < 12; i++) { const m = (CM + i) % 12; if (lvs[m] !== "ngot") { let e = m; for (let j = 1; j < 12; j++) { const k = (m + j) % 12; if (lvs[k] === "ngot") break; e = k } return { txt: T("saltIn")(m + 1, e + 1), lv: lvs.includes("man") ? "man" : lvs[m] } } }
    return { txt: T("saltNone"), lv: "ngot" };
  }
  const profit = (c) => (c && c.profit_range && c.profit_range.mid ? c.profit_range : null);
  const cong = (m) => nf(m / 10, 1);

  /* ---------------- state ---------------- */
  const st = get(KEY, null) || { fields: [], sel: null, ui: "simple" };
  const save = () => put(KEY, st);
  const fieldSel = () => st.fields.find((f) => f.id === st.sel) || st.fields[0] || null;
  const adv = () => st.ui === "advanced";
  let view = "dash", tab = "salt", editing = null, on = false, sizeErr = "";

  /* ---------------- panel ---------------- */
  function shell() {
    if ($("#dv")) return;
    const d = document.createElement("div"); d.id = "dv";
    d.innerHTML = `<section id="dvClock" class="dv-clock" aria-labelledby="ckDate"><h1 class="sr">Mekong Rotation Explorer</h1><div class="ck-in">
        <div class="ck-row"><button type="button" id="ckPlay" class="ck-play"></button>
          <div class="ck-d"><b id="ckDate"></b><small id="ckSub" class="ck-sub"></small></div>
          <div id="ckHz" class="ck-hz" role="group"><button type="button" data-hz="1"></button><button type="button" data-hz="2"></button><button type="button" data-hz="3"></button></div></div>
        <div class="ck-row2"><div class="ck-track"><div id="ckMap" class="ck-map" aria-hidden="true"></div><div id="ckYrs" class="ck-yrs" aria-hidden="true"></div><input id="ckRange" class="ck-range" type="range" min="0" max="52" step="1" value="0"></div>
          <button type="button" id="ckReset" class="ck-reset" hidden>${ic("back", 16)}<span></span></button></div>
        <p id="ckNote" class="ck-note" hidden></p></div><p id="ckFlash" class="ck-flash" role="status" aria-live="polite"></p></section>
      <main id="dvPanel" class="dv-page" aria-labelledby="dvH"></main>
      <nav id="dvNav" class="dv-nav"></nav>
      <div id="dvSheet" class="dv-sheet" hidden><div class="dv-scrim" data-dv="close"></div><div class="dv-sh" role="dialog" aria-modal="true"><div class="dv-grab" aria-hidden="true"></div><div id="dvShBody"></div></div></div>
      <div id="dvZoom" class="dv-zoom" hidden><div class="z-scrim" data-dvz="close"></div><div id="dvZP" class="z-panel" role="dialog" aria-modal="true" aria-labelledby="dvZT"></div></div>`;
    document.body.appendChild(d);
    const b = document.createElement("button"); b.type = "button"; b.id = "dvBack"; b.className = "dv-backmap"; b.hidden = true; document.body.appendChild(b);
  }
  /* ---------------- dashboard page: tiles ---------------- */
  const MS = () => (lang() === "vi" ? ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
  function ribbon(f, c, small) {
    const nino = isNino(f), order = [...Array(12)].map((_, i) => (W0(c) + i) % 12), lvs = order.map((m) => level(fieldSalt(f.site, m, nino)));
    const crops = ["R", "S", "U", "-"].filter((k) => c.months.some((x) => x[0] === k));
    /* the big strip (Simple, zoom) shows plain month numbers in Vietnamese, names the bar and marks this month in words */
    const mo = (m) => (!small && lang() === "vi" ? String(m + 1) : MS()[m]);
    return `<ol class="rb${small ? " sm" : ""}">${order.map((m, i) => { const code = c.months[m]; return `<li class="${code[0] === "-" ? "rest" : code[0]}${m === CM ? " now" : ""}" title="${esc(cropName(c, code))}">${iconOf(code)}<span class="mo">${mo(m)}</span><i class="sb ${lvs[i]}"></i></li>` }).join("")}</ol>
      <span class="rb-now">${esc(T("rbNow"))}</span>
      <span class="rb-key"><span class="rb-kh">${esc(T(small ? "rbKeyA" : "rbKey"))}</span>${crops.map((k) => `<span>${iconOf(k)}${esc(T("crop")[k])}</span>`).join("")}${["ngot", "lo", "man"].filter((k) => lvs.includes(k)).map((k) => `<span><i class="sb ${k}"></i>${esc(T("lv")[k])}</span>`).join("")}</span>`;
  }
  function fieldTabs() {
    const f0 = fieldSel(); if (!adv() && st.fields.length < 2) return "";
    return `<div class="dv-ftabs" role="tablist" aria-label="${esc(T("brand"))}">${st.fields.map((f) => { const sel = !!(f0 && f.id === f0.id), lv = areaLv(f.site);
      return `<button type="button" role="tab" data-dvf="${f.id}" aria-selected="${sel}"><i class="sd-dot lv-${lv}" aria-hidden="true"></i><b>${esc(f.name)}</b><small>${esc(short(siteOf(f.site)))}</small></button>` }).join("")}</div>`;
  }
  /* the page title is the chosen field's own name, big, so a farmer sees at once which field this is */
  function pageHead() {
    const f = fieldSel(), eb = f ? T("brand") : T("eyebrow");
    const nm = f ? `<span class="dv-nm">${esc(f.name)}</span><small class="dv-area">${ic("pin", 16)}${esc(short(siteOf(f.site)))}</small>` : esc(T("brand"));
    return `<header class="dv-top${f ? " has-f" : ""}"><div class="dv-tt"><p class="sd-eyebrow">${esc(eb)}</p><h2 id="dvH" class="dv-name" data-k="${f ? esc(f.id) : ""}">${nm}</h2></div>
      <div class="dv-tr"><button type="button" class="btn${f ? "" : " gold"} dv-addtop" data-dv="add">${ic("plus", 18)}<span>${esc(T("addShort"))}</span></button></div></header>`;
  }
  function welcome() {
    return `<section class="dv-welcome"><div class="dv-wi">${ic("rice", 40)}</div><h3>${esc(T("welcome"))}</h3><p>${esc(T("welcomeP"))}</p>
      <div class="dv-wbtns"><button type="button" class="btn gold dv-addbig" data-dv="add">${ic("plus", 20)}<span>${esc(T("create"))}</span></button>
      <button type="button" class="btn dv-addbig dv-demo" data-dv="demo">${ic("rice", 20)}<span>${esc(T("demoB"))}</span></button></div>
      <p class="sd-note dv-demop">${esc(T("demoP"))}</p>
      <ol class="dv-wsteps">${T("wsteps").map((x, i) => `<li><b>${i + 1}</b><span>${esc(x)}</span></li>`).join("")}</ol>
      <p class="sd-note"><button type="button" class="dv-link" data-open="sources">${esc(T("sources"))}</button></p></section>`;
  }
  function facts(f) {
    const c = planOf(f), s = siteOf(f.site), nino = isNino(f); curSite = f.site; curNino = nino;
    const job = jobAt(c, CM); let nk = 1; while (nk < 12 && jobAt(c, (CM + nk) % 12) === job) nk++;
    const p = profit(c), pe = profit(cardOf(f, "elnino")), pt = profit(cardOf(f, "typical")), shown = pe || p;
    const g = fieldSalt(f.site, CM, nino);
    return { c, s, nino, job, nm: (CM + nk) % 12, p, pe, pt, shown, g, lv: level(g), sl: saltLine(f), clash: clashOf(f, c) };
  }

  const planNo = (f) => { const id = cardOf(f).id, r = rank(f).find((y) => y.c.id === id); return r && r.no ? `<div class="s-card s-warn dv-planno" role="alert">${ic("warn", 30)}<div><b>${esc(T("planNo"))}</b></div><button type="button" class="btn gold" data-dv="choose">${ic("swap", 18)}<span>${esc(T("change"))}</span></button></div>` : "" };
  /* this year and a normal year side by side, so the figure agrees with the one shown when the plan was chosen */
  function moneyYears(f, x) {
    if (!(x.shown && x.pe && x.pt) || nf(x.pe.mid / 10, 1) === nf(x.pt.mid / 10, 1)) return null;
    const totOf = (m) => (f.size ? " " + T("tot")(haS(f.size), big(m.mid * f.size)) : "");
    return [T("moneyYr") + totOf(x.shown), T("moneyTyp")(nf(x.pt.mid / 10, 1)) + totOf(x.pt)];
  }
  function shownMoney(f, x) {
    const m = x.shown; if (!m) return null;
    return { per: nf(m.mid / 10, 1), tot: f.size ? T("tot")(haS(f.size), big(m.mid * f.size)) : "" };
  }

  /* ADVANCED: dark data tiles. One month is "in view" (default: this month); every tile follows it.
     Tap a month on the chart or the strip to look at it, "Back to this month" to reset; tap a tile to open it large. */
  let selM = null, zoomKey = null;
  const mv = () => (selM == null ? CM : selM);
  const MLONG = (m) => (lang() === "vi" ? "Tháng " + (m + 1) : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m]);
  const tile = (key, cls, head, body, src) => `<section class="a-t ${cls}" data-zoom="${key}">
    <h3 class="a-h">${head}<button type="button" class="a-exp" data-zoomb="${key}" aria-label="${esc(T("open"))}: ${esc(head.replace(/<[^>]+>/g, ""))}">${ic("expand", 14)}</button></h3>${body}${src ? `<p class="a-src">${esc(src)}</p>` : ""}</section>`;
  function gauge(g, big) {
    const max = 4, v = Math.min(g, max), ang = (a) => Math.PI * (1 - a / max), pt = (a, r) => `${(60 + r * Math.cos(ang(a))).toFixed(2)} ${(60 - r * Math.sin(ang(a))).toFixed(2)}`;
    const arc = (a, b, cls) => `<path class="${cls}" d="M${pt(a, 48)} A48 48 0 0 1 ${pt(b, 48)}"/>`;
    return `<svg class="a-gauge${big ? " big" : ""}" viewBox="0 -4 120 76" role="img" aria-label="${nf(g, 1)}‰">${arc(0, 1, "z ngot")}${arc(1, 2, "z lo")}${arc(2, 4, "z man")}
      <line class="ndl" x1="60" y1="60" x2="${(60 + 40 * Math.cos(ang(v))).toFixed(2)}" y2="${(60 - 40 * Math.sin(ang(v))).toFixed(2)}"/><circle class="hub" cx="60" cy="60" r="4"/>
      <text x="8" y="71">0</text><text x="56" y="4">2</text><text x="104" y="71">4‰</text></svg>`;
  }
  /* salt (river and field) as lines, rain as bars; each month column is a button that puts that month in view */
  function lineChart(f, big) {
    const nino = isNino(f), s = siteOf(f.site), rain = (nino && s.el && s.el.rain) || s.rain || [], W0 = 320, H0 = big ? 170 : 150, pl = 30, pr = 34, pt = 12, pb = 20, m0 = mv();
    const rv = [...Array(12)].map((_, m) => riverSalt(f.site, m, nino)), fv = [...Array(12)].map((_, m) => fieldSalt(f.site, m, nino));
    const mx = Math.max(2, ...rv) * 1.1, rmx = Math.max(100, ...rain) * 1.1, X = (m) => pl + m * (W0 - pl - pr) / 11, Y = (v) => pt + (H0 - pt - pb) * (1 - v / mx), YR = (v) => H0 - pb - (H0 - pt - pb) * v / rmx;
    const line = (a) => a.map((v, m) => `${m ? "L" : "M"}${X(m).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const cw = (W0 - pl - pr) / 11, bw = cw * .55;
    return `<svg class="a-line" viewBox="0 0 ${W0} ${H0}" role="group" aria-label="${esc(T("chartL"))}">
      ${[0, .5, 1].map((k) => `<line class="gr" x1="${pl}" x2="${W0 - pr}" y1="${(pt + (H0 - pt - pb) * k).toFixed(1)}" y2="${(pt + (H0 - pt - pb) * k).toFixed(1)}"/><text class="ax" x="${pl - 4}" y="${(pt + (H0 - pt - pb) * k + 3).toFixed(1)}" text-anchor="end">${nf(mx * (1 - k), 0)}</text><text class="ax r" x="${W0 - pr + 4}" y="${(pt + (H0 - pt - pb) * k + 3).toFixed(1)}">${Math.round(rmx * (1 - k))}</text>`).join("")}
      <rect class="selb" x="${(X(m0) - cw / 2).toFixed(1)}" y="${pt - 6}" width="${cw.toFixed(1)}" height="${H0 - pb - pt + 6}" rx="4"/>
      ${rain.map((v, m) => `<rect class="rn${m === m0 ? " on" : ""}" x="${(X(m) - bw / 2).toFixed(1)}" y="${YR(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H0 - pb - YR(v)).toFixed(1)}"/>`).join("")}
      <line class="th" x1="${pl}" x2="${W0 - pr}" y1="${Y(2).toFixed(1)}" y2="${Y(2).toFixed(1)}"/>
      <path class="lr" d="${line(rv)}"/><path class="lf" d="${line(fv)}"/>
      ${fv.map((v, m) => `<circle class="pf ${level(v)}" cx="${X(m).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${m === m0 ? 4.5 : 2.4}"/>`).join("")}
      <line class="nowl" x1="${X(CM).toFixed(1)}" x2="${X(CM).toFixed(1)}" y1="${pt}" y2="${H0 - pb}"/>
      ${MS().map((t, m) => `<text class="ax${m === m0 ? " on" : ""}${m % 2 ? " alt" : ""}" x="${X(m).toFixed(1)}" y="${H0 - 6}" text-anchor="middle">${t}</text>`).join("")}
      ${[...Array(12)].map((_, m) => `<rect class="hit" data-dvsel="${m}" aria-hidden="true" data-l="${esc(MLONG(m))}" x="${(X(m) - cw / 2).toFixed(1)}" y="0" width="${cw.toFixed(1)}" height="${H0}"/>`).join("")}</svg>
      <p class="a-key"><span><i class="k lf"></i>${esc(T("field"))} ‰</span><span><i class="k lr"></i>${esc(T("river"))} ‰</span><span><i class="k rn"></i>${esc(T("rainM"))} mm</span><span><i class="k th"></i>2‰</span></p>`;
  }
  function donut(n, of, lab) {
    const r = 34, C0 = 2 * Math.PI * r, k = of ? n / of : 0;
    return `<div class="a-donut"><svg viewBox="0 0 90 90" aria-hidden="true"><circle class="bg" cx="45" cy="45" r="${r}"/><circle class="fg" cx="45" cy="45" r="${r}" stroke-dasharray="${(C0 * k).toFixed(1)} ${C0.toFixed(1)}" transform="rotate(-90 45 45)"/></svg>
      <div class="a-dv"><b>${n}<small>/${of}</small></b><span>${esc(lab)}</span></div></div>`;
  }
  /* the month strip: 12 buttons coloured by the field's water level, crop icon on top; the one in view is raised */
  function monthStrip(f, c) {
    const nino = isNino(f), m0 = mv();
    return `<div class="a-months"><div class="a-mhead"><span class="a-mut">${esc(T("viewing"))}</span><b>${esc(MLONG(m0))}${m0 === CM ? ` <em>${esc(T("nowTag"))}</em>` : ""}</b>
        ${m0 !== CM ? `<button type="button" class="a-reset" data-dvsel="now">${ic("back", 14)}<span>${esc(T("resetM"))}</span></button>` : ""}</div>
      <div class="a-mstrip" role="group" aria-label="${esc(T("pickM"))}">${[...Array(12)].map((_, m) => { const lv = level(fieldSalt(f.site, m, nino)), code = c.months[m];
        return `<button type="button" class="lv-${lv}${m === m0 ? " on" : ""}${m === CM ? " now" : ""}" data-dvsel="${m}" aria-pressed="${m === m0}" aria-label="${esc(MLONG(m))}: ${esc(T("lv")[lv])}, ${esc(cropName(c, code))}">${iconOf(code)}<span>${MS()[m]}</span><i></i></button>` }).join("")}</div>
      <p class="rb-key a-mkey"><span class="rb-kh">${esc(T("rbKeyA"))}</span>${["ngot", "lo", "man"].filter((k) => [...Array(12)].some((_, m) => level(fieldSalt(f.site, m, nino)) === k)).map((k) => `<span><i class="sb ${k}"></i>${esc(T("lv")[k])}</span>`).join("")}<span><i class="a-nowdot"></i>${esc(T("rbNow"))}</span></p></div>`;
  }
  function advData(f) {
    const x = facts(f), { c, s, nino } = x, m = mv(), g = fieldSalt(f.site, m, nino), lv = level(g);
    const crop = c.months.map((code, i) => code[0] === "R" || code[0] === "U" ? i : -1).filter((i) => i >= 0);
    const safe = crop.filter((i) => level(fieldSalt(f.site, i, nino)) !== "man").length;
    const t = (() => { try { return RX.DATA.sites.find((y) => y.id === f.site) } catch (e) { return null } })(), k = t ? RX.Model.kFor(t).k : null;
    const rainA = (nino && s.el && s.el.rain) || s.rain || [], et0A = (nino && s.el && s.el.et0) || s.et0 || [];
    curSite = f.site; curNino = nino;
    const job = jobAt(c, m); let nk = 1; while (nk < 12 && jobAt(c, (m + nk) % 12) === job) nk++;
    return { ...x, m, g, lv, crop, safe, t, k, rainA, et0A, job, nm: (m + nk) % 12, mon: shownMoney(f, x), r: rank(f) };
  }
  function advPage(f) {
    const d = advData(f), { c, s, nino, m } = d, best = d.r.find((y) => !y.no), cur = d.r.find((y) => y.c.id === f.rot), two = d.mon && moneyYears(f, d);
    const rain = d.rainA.reduce((a, b) => a + b, 0), et0 = d.et0A.reduce((a, b) => a + b, 0), cropM = c.months[m][0] === "R" || c.months[m][0] === "U";
    return `<div class="dv-a">
      <div class="a-bar"><div><span class="a-mut">${esc(T("yourPlan"))}</span><b>${esc(L(c.name))}</b></div><span class="a-bar-r"><span class="a-pill${nino ? " hot" : ""}">${esc(nino ? T("years").elnino : T("years").typical)}</span><button type="button" class="dv-deltop" data-dv="delask" aria-label="${esc(T("delThis"))}: ${esc(f.name)}" title="${esc(T("delThis"))}">${ic("trash", 20)}</button></span></div>
      ${planNo(f)}
      ${monthStrip(f, c)}
      ${d.clash.length ? `<div class="s-card s-warn a-warn">${ic("warn", 26)}<div><b>${esc(T("clash")(d.clash))}</b></div></div>` : ""}
      <p class="a-tip">${ic("expand", 14)}${esc(T("tapTile"))}</p>
      <div class="a-grid">
        ${tile("job", "a-g5", esc(T("monthOn")(m + 1)), `<p class="a-job">${iconOf(c.months[m])}<b>${esc(d.job)}</b></p><p class="a-mut">${esc(T("nextM")(d.nm + 1))}: ${esc(jobAt(c, d.nm))}</p>`, "")}
        ${tile("salt", "a-g1", `${esc(T("saltA"))} · ${esc(MS()[m])}`, `${gauge(d.g)}<p class="a-num">${nf(d.g, 1)}<small>‰</small></p><p class="a-mut lv-${d.lv}">${esc(T("lv")[d.lv])} · ${esc(T("lvD")[d.lv])}</p>`, T("est"))}
        ${tile("chart", "a-g2", esc(T("chartH")), lineChart(f), lang() === "vi" ? "Mặn: trạm đo + NASA POWER (ước tính) · Mưa: NASA GPM IMERG · chạm một tháng để xem" : "Salt: stations + NASA POWER (estimate) · Rain: NASA GPM IMERG · tap a month to view it")}
        ${tile("safe", "a-g3", esc(T("safeH")), `${donut(d.safe, d.crop.length, T("safeL"))}<p class="a-mut">${cropM ? esc((level(fieldSalt(f.site, m, nino)) === "man" ? T("mBad") : T("mOk"))(MS()[m])) : esc(T("mRest")(MS()[m]))}</p>`, T("est"))}
        ${tile("money", "a-g4", esc(T("moneyH")), d.mon ? `<p class="a-num big">${d.mon.per}<small> ${esc(T("perCongS"))}</small></p>${d.shown ? rangeBar(d.shown) : ""}${two ? two.map((t) => `<p class="a-mut">${esc(t)}</p>`).join("") : d.mon.tot ? `<p class="a-mut">${esc(d.mon.tot)}</p>` : ""}` : `<p class="a-mut">${esc(T("noMoney"))}</p>`, T("moneySrc"))}
        ${tile("scores", "a-g6", esc(T("scoreH")), `<div class="a-bars">${SK.map((q) => { const v = c.scores[q]; return `<div><span>${esc(T("sc")[q])}</span><i><b style="width:${v == null ? 0 : (v - 1) / 4 * 100}%"></b></i><em>${v == null ? "–" : nf(v, 1)}</em></div>` }).join("")}</div>${c.confidence ? `<p class="a-mut">${esc(T("conf"))}: ${esc(T("confL")[c.confidence] || c.confidence)}</p>` : ""}`, T("scSrc"))}
        ${tile("nums", "a-g7", `${esc(T("nums"))} · ${esc(MS()[m])}`, `<dl class="a-kpi"><div><dt>${esc(T("rainMo"))}</dt><dd>${nf(Math.round(d.rainA[m] || 0), 0)}<small> mm</small><small class="a-kn">NASA GPM IMERG</small></dd></div>
          <div><dt>${esc(T("needMo"))}</dt><dd>${nf(Math.round(d.et0A[m] || 0), 0)}<small> mm</small><small class="a-kn">NASA POWER</small></dd></div>
          <div><dt>${esc(T("cropsY"))}</dt><dd>${typeof s.crops === "number" ? nf(s.crops, 1) : "–"}<small class="a-kn">NASA MODIS NDVI</small></dd></div>
          <div><dt>${esc(T("rainY"))}</dt><dd>${nf(Math.round(rain), 0)}<small> mm</small><small class="a-kn">${esc(T("needY"))}: ${nf(Math.round(et0), 0)} mm</small></dd></div></dl>`, "")}
        ${tile("rank", "a-g8", esc(T("rankH")), `<ol class="a-rank">${d.r.slice(0, 5).map(({ c: y, s: sc, no }) => `<li class="${y.id === f.rot ? "cur" : ""}${no ? " no" : ""}"><span>${esc(L(y.name))}${no ? `<small class="a-no">${esc(T("notHere"))}</small>` : ""}</span><i><b style="width:${((sc - 1) / 4 * 100).toFixed(0)}%"></b></i><em>${nf(sc, 1)}</em></li>`).join("")}</ol>${best && best.c.id !== f.rot && (!cur || nf(best.s, 1) !== nf(cur.s, 1)) ? `<p class="a-mut">${esc(T("bestFor")(L(best.c.name)))}</p>` : ""}`, T("rankSrc"))}
        ${tile("rib", "a-g9", `${ic("cal", 14)}${esc(T("ribbonH"))}`, `<div class="a-rib">${ribbon(f, c, true)}</div>`, T("est"))}
        ${nino ? tile("nino", "a-g10 hot", esc(T("ninoH")), `<p class="a-num">&gt;83<small>%</small></p><p class="a-mut">${esc(T("ninoNote"))}</p>`, "NOAA CPC") : ""}
      </div>
      ${remindCard(f)}
      <div class="a-duo">${progressCard(f)}${suggestions(f)}</div>
      ${yearsBlock(f)}
      <div class="dv-acts a-acts"><button type="button" class="btn gold" data-dv="choose">${ic("swap", 16)}<span>${esc(T("change"))}</span></button><button type="button" class="btn" data-dv="plan">${ic("cal", 16)}<span>${esc(T("tapPlanS"))}</span></button><button type="button" class="btn" data-dv="paper">${ic("print", 16)}<span>${esc(T("print"))}</span></button>
        <button type="button" class="btn" data-dv="editmap">${ic("map", 16)}<span>${esc(T("editMap"))}</span></button><button type="button" class="btn" data-dv="opts">${ic("edit", 16)}<span>${esc(T("editAns"))}</span></button><button type="button" class="btn" data-open="sources"><span>${esc(T("sources"))}</span></button></div>
      <p class="a-src">${esc(T("ask"))}</p></div>`;
  }
  /* ---------- advanced: plan over several years (each year its own plan and kind of year) ---------- */
  function yearsOf(f) {
    const m = f.multi || {}, n = [1, 3, 5].includes(m.n) ? m.n : 3, ys = Array.isArray(m.yrs) ? m.yrs : [];
    return { n, yrs: [...Array(n)].map((_, i) => ({ rot: (ys[i] && ys[i].rot) || f.rot, yr: (ys[i] && ys[i].yr) || (i === 0 ? yr(f) : "typical") })) };
  }
  function yearCard(f, y) { const cs = cardsFor(siteOf(f.site), y.yr, f.crop); return cs.find((c) => c.id === y.rot) || cs.find((c) => c.id === f.rot) || cs[0] }
  function yearRibbon(f, c, nino, m0) {
    return `<ol class="rb sm y-rb">${[...Array(12)].map((_, i) => { const m = (m0 + i) % 12, code = c.months[m]; return `<li class="${code[0] === "-" ? "rest" : code[0]}" title="${esc(cropName(c, code))}">${iconOf(code)}<span class="mo">${MS()[m]}</span><i class="sb ${level(fieldSalt(f.site, m, nino))}"></i></li>` }).join("")}</ol>`;
  }
  function yearsBlock(f) {
    const Y = yearsOf(f), s0 = startOf(f), size = +f.size || 0, k = size ? size * 10 : 1;
    const mo = (v) => (v == null ? "–" : size ? big(v * size) : nf(v / 10, 1)), u = size ? (lang() === "vi" ? "triệu ₫" : "M₫") : T("perCongS");
    let sp = 0, slo = 0, shi = 0, sc = 0, missP = false, missC = false;
    const cols = Y.yrs.map((y, i) => {
      const c = yearCard(f, y), nino = y.yr === "elnino", p = profit(c), cc = typeof Cost !== "undefined" && Cost.calc ? Cost.calc(c) : null;
      const clash = c.months.filter((code, m) => (code[0] === "R" || code[0] === "U") && level(fieldSalt(f.site, m, nino)) === "man").length;
      if (p) { sp += p.mid; slo += p.lo; shi += p.hi } else missP = true;
      if (cc && cc.cost) sc += cc.cost; else missC = true;
      const a = s0.y + i, prev = i ? yearCard(f, Y.yrs[i - 1]) : null;
      const opts = cardsFor(siteOf(f.site), y.yr, f.crop).map((o) => { const no = !!(o.not_here || (o.needs_brackish && f.noBrackish)); return `<option value="${esc(o.id)}"${o.id === c.id ? " selected" : ""}${no && o.id !== c.id ? " disabled" : ""}>${esc(L(o.name))}</option>` }).join("");
      return `<div class="y-col${nino ? " hot" : ""}"><div class="y-h"><b>${esc(T("yrN")(i + 1))}</b><small>${esc(MNUM(s0.m))} ${a} – ${esc(MNUM((s0.m + 11) % 12))} ${a + (s0.m ? 1 : 0)}</small></div>
        <label class="y-sel"><span class="sr">${esc(T("yrPick")(i + 1))}</span><select data-dvyr="${i}" aria-label="${esc(T("yrPick")(i + 1))}">${opts}</select></label>
        <div class="seg y-seg" role="group" aria-label="${esc(T("yrType")(i + 1))}">${["typical", "elnino"].map((t) => `<button type="button" data-dvyt="${i}:${t}" aria-pressed="${y.yr === t}">${esc(T("years")[t])}</button>`).join("")}</div>
        ${yearRibbon(f, c, nino, s0.m)}
        <dl class="y-kpi"><div><dt>${esc(T("yrProfit"))}</dt><dd class="p">${p ? `${mo(p.mid)}<small> ${esc(u)}</small>` : esc(T("yrNoFig"))}</dd></div><div><dt>${esc(T("yrCost"))}</dt><dd class="c">${cc && cc.cost ? `${mo(cc.cost)}${cc.partial ? "*" : ""}<small> ${esc(u)}</small>` : esc(T("yrNoFig"))}</dd></div></dl>
        <p class="y-salt lv-${clash ? "man" : "ngot"}">${ic(clash ? "warn" : "check", 14)}${esc(clash ? T("yrClash")(clash) : T("yrSafe"))}</p>
        ${prev && prev.id !== c.id ? `<p class="y-sw">${ic("swap", 14)}${esc(T("yrSwitch"))}</p>` : ""}</div>`;
    }).join("");
    const unit = size ? T("yrField")(haS(size)) : T("yrCong"), seg = [1, 3, 5].map((n) => `<button type="button" data-dvyn="${n}" aria-pressed="${Y.n === n}">${esc(T("yrsN")(n))}</button>`).join("");
    const P = T("pv"), M = T("mv");
    return `<section class="a-yrs" aria-labelledby="dvYrsH"><header class="y-top"><div><h3 id="dvYrsH">${ic("cal", 16)}${esc(T("yrsH"))}</h3><p class="a-mut">${esc(T("yrsP"))}</p></div><div class="seg" role="group" aria-label="${esc(T("yrsH"))}">${seg}</div></header>
      <div class="y-track n${Y.n}">${cols}</div>
      <div class="y-sum"><p class="y-sum-h">${esc(T("yrSum")(Y.n))} · <span>${esc(unit)}</span></p>
        <dl class="y-kpi big"><div><dt>${esc(T("yrSumP"))}</dt><dd class="p">${missP ? "–" : mo(sp)}<small>${missP ? "" : ` ${esc(lang() === "vi" ? "triệu ₫" : "M₫")} · ${mo(slo)}–${mo(shi)}`}</small></dd></div>
        <div><dt>${esc(T("yrSumC"))}</dt><dd class="c">${sc ? mo(sc) + (missC ? "*" : "") : "–"}<small>${sc ? ` ${esc(lang() === "vi" ? "triệu ₫" : "M₫")}` : ""}</small></dd></div></dl>
        <p class="y-mach">${ic("warn", 14)}<span>${esc(typeof Cost !== "undefined" && Cost.machNo ? Cost.machNo() : "")} ${esc(T("yrWho")(P[f.wfP ?? 1], M[f.wfM ?? 0]))}</span></p>
        ${size ? "" : `<p class="a-mut">${esc(T("yrNoSize"))}</p>`}<p class="a-src">${esc(T("yrHow"))} ${esc(T("moneySrc"))}</p></div></section>`;
  }
  function rangeBar(p) {
    const lo = p.lo, hi = Math.max(p.hi, lo + .1), at = (v) => ((v - lo) / (hi - lo) * 100).toFixed(1);
    return `<div class="a-range" aria-label="${esc(T("range")(cong(p.lo), cong(p.mid), cong(p.hi)))}"><i><b style="left:${at(p.mid)}%"></b></i><span><em>${cong(p.lo)}</em><em>${cong(p.mid)}</em><em>${cong(p.hi)}</em></span><small>${esc(T("rangeK"))}${p.n ? ` · ${p.n} ${esc(T("figs"))}` : ""}</small></div>`;
  }

  /* ---------- a tile opened large ---------- */
  function zoomTitle(key, d) {
    return { salt: T("saltA"), chart: T("chartH"), safe: T("safeH"), money: T("moneyH"), job: T("monthOn")(d.m + 1), scores: T("scoreH"), nums: T("nums"), rank: T("rankH"), rib: T("ribbonH"), nino: T("ninoH") }[key] || "";
  }
  function monthTable(f, d, cols) {
    return `<div class="z-tw"><table class="z-t"><thead><tr><th>${esc(T("tMonth"))}</th>${cols.map((x) => `<th>${esc(x.h)}</th>`).join("")}</tr></thead><tbody>${[...Array(12)].map((_, i) =>
      `<tr class="${i === d.m ? "on" : ""}${i === CM ? " now" : ""}" data-dvsel="${i}" tabindex="0"><th scope="row">${MS()[i]}</th>${cols.map((x) => `<td>${x.v(i)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function zoomBody(key, f) {
    const d = advData(f), { c, s, nino, m } = d, lvCell = (i) => { const lv = level(fieldSalt(f.site, i, nino)); return `<span class="z-lv lv-${lv}">${esc(T("lv")[lv])}</span>` };
    const cropCell = (i) => `<span class="z-crop">${iconOf(c.months[i])}${esc(cropName(c, c.months[i]))}</span>`;
    switch (key) {
      case "salt": return `<div class="z-hero">${gauge(d.g, true)}<div><p class="a-num big">${nf(d.g, 1)}<small>‰</small></p><p class="z-lvw lv-${d.lv}">${esc(T("lv")[d.lv])}</p><p class="a-mut">${esc(T("lvD")[d.lv])}</p></div></div>
        <ul class="z-scale">${["ngot", "lo", "man"].map((x) => `<li class="lv-${x}"><i></i><b>${esc(T("lv")[x])}</b><span>${esc(T("lvD")[x])}</span></li>`).join("")}</ul>
        ${monthTable(f, d, [{ h: T("river"), v: (i) => nf(riverSalt(f.site, i, nino), 1) + "‰" }, { h: T("field"), v: (i) => nf(fieldSalt(f.site, i, nino), 1) + "‰" }, { h: T("tSalt"), v: lvCell }, { h: T("cropH"), v: cropCell }])}
        <p class="a-mut">${lang() === "vi" ? "Trong ruộng = sông × " : "Field = river × "}<b>${d.k == null ? "–" : nf(d.k, 2)}</b> ${esc(T("kWhy")(nf(s.crops, 1)))}</p><p class="a-src">${esc(T("est"))}</p>`;
      case "chart": return `${lineChart(f, true)}${monthTable(f, d, [{ h: T("rainM") + " mm", v: (i) => nf(Math.round(d.rainA[i] || 0), 0) }, { h: T("needH") + " mm", v: (i) => nf(Math.round(d.et0A[i] || 0), 0) }, { h: T("river"), v: (i) => nf(riverSalt(f.site, i, nino), 1) + "‰" }, { h: T("field"), v: (i) => nf(fieldSalt(f.site, i, nino), 1) + "‰" }])}
        <p class="a-src">${lang() === "vi" ? "Mưa: NASA GPM IMERG · Cây cần nước: NASA POWER (phương pháp FAO) · Mặn: ước tính từ báo cáo trạm đo, không đo bằng vệ tinh" : "Rain: NASA GPM IMERG · Crop water need: NASA POWER (FAO method) · Salt: estimate from station reports, not satellite"}</p>`;
      case "safe": return `<div class="z-hero">${donut(d.safe, d.crop.length, T("safeL"))}<p class="a-mut">${esc(T("safeWhy"))}</p></div>
        <ol class="z-cal">${[...Array(12)].map((_, i) => { const code = c.months[i], grow = code[0] === "R" || code[0] === "U", lv = level(fieldSalt(f.site, i, nino)), bad = grow && lv === "man";
          return `<li class="${bad ? "bad" : grow ? "ok" : "rest"}${i === m ? " on" : ""}" data-dvsel="${i}"><b>${MS()[i]}</b>${iconOf(code)}<span>${esc(cropName(c, code))}</span><em>${grow ? esc(bad ? T("zBad") : T("zOk")) : esc(T("crop")[code[0] === "S" ? "S" : "-"])}</em></li>` }).join("")}</ol>
        <p class="a-mut">${esc(d.clash.length ? T("clash")(d.clash) : T("noClash"))}</p><p class="a-src">${esc(T("est"))}</p>`;
      case "money": { const top = d.r.slice(0, 5).map(({ c: y }) => ({ y, p: profit(y) })).filter((x) => x.p), mx = Math.max(1, ...top.map((x) => x.p.hi));
        return `${d.mon ? `<div class="z-hero"><p class="a-num big">${d.mon.per}<small> ${esc(T("perCongS"))}</small></p><div>${rangeBar(d.shown)}${d.mon.tot ? `<p class="a-mut">${esc(d.mon.tot)}</p>` : ""}</div></div>` : `<p class="a-mut">${esc(T("noMoney"))}</p>`}
        ${d.p && d.pe && d.p.mid !== d.pe.mid ? `<p class="a-mut">${esc(T("years").typical)}: <b>${cong(d.p.mid)}</b> · ${esc(T("years").elnino)}: <b>${cong(d.pe.mid)}</b> ${esc(T("perCongS"))}</p>` : ""}
        <h5 class="z-h">${esc(T("cmpH"))}</h5><ul class="z-bars">${top.map(({ y, p }) => `<li class="${y.id === f.rot ? "cur" : ""}"><span>${esc(L(y.name))}</span><i><b style="left:${(p.lo / mx * 100).toFixed(1)}%;width:${((p.hi - p.lo) / mx * 100).toFixed(1)}%"></b><u style="left:${(p.mid / mx * 100).toFixed(1)}%"></u></i><em>${cong(p.mid)}</em></li>`).join("")}</ul>
        <p class="a-src">${esc(T("moneySrc"))}</p>`; }
      case "job": { const code = c.months[m], r = code === "-" ? null : DATA.resources[resKey(c, code)];
        return `<div class="z-hero"><span class="z-big">${ic({ R: "rice", S: "shrimp", U: "upland" }[code[0]] || "fallow", 44)}</span><div><p class="a-job"><b>${esc(d.job)}</b></p><p class="a-mut">${esc(cropName(c, code))}</p></div></div>
        ${r ? `<dl class="z-dl"><div><dt>${ic("seed", 18)}${esc(T("seed"))}</dt><dd>${esc(L(r.seed))}</dd></div>${r.fertiliser && L(r.fertiliser) ? `<div><dt>${ic("drop", 18)}${esc(T("fert"))}</dt><dd>${esc(L(r.fertiliser))}</dd></div>` : ""}</dl>
          <h5 class="z-h">${esc(T("steps"))}</h5><ol class="z-steps">${(r.steps || []).map((x) => `<li>${esc(L(x))}</li>`).join("")}</ol>` : ""}
        <h5 class="z-h">${esc(T("nextM")(d.nm + 1))}</h5><p class="a-job sm">${iconOf(c.months[d.nm])}<span>${esc(jobAt(c, d.nm))}</span></p><p class="a-src">${esc(T("ask"))}</p>`; }
      case "scores": return `<div class="a-bars z-sc">${SK.map((q) => { const v = c.scores[q]; return `<div><span>${esc(T("sc")[q])}</span><i><b style="width:${v == null ? 0 : (v - 1) / 4 * 100}%"></b></i><em>${v == null ? "–" : nf(v, 1)}</em></div>` }).join("")}</div>
        <h5 class="z-h">${esc(T("whyScores"))}</h5><ul class="z-why">${(c.why || []).map((x) => `<li>${esc(L(x))}</li>`).join("")}</ul>${whyFit(c, f)}<p class="a-src">${esc(T("scSrc"))}</p>`;
      case "nums": { const nd = (nino && s.el && s.el.ndvi) || s.ndvi || [], mr = Math.max(1, ...d.rainA, ...d.et0A);
        return `<h5 class="z-h">${esc(T("rainNeed"))}</h5><div class="z-rn">${[...Array(12)].map((_, i) => `<button type="button" class="${i === m ? "on" : ""}" data-dvsel="${i}" aria-label="${esc(MLONG(i))}"><i class="r" style="height:${(d.rainA[i] / mr * 100).toFixed(0)}%"></i><i class="n" style="bottom:${(d.et0A[i] / mr * 100).toFixed(0)}%"></i><span>${MS()[i]}</span></button>`).join("")}</div>
        <p class="a-key"><span><i class="k rn"></i>${esc(T("rainM"))} (NASA GPM IMERG)</span><span><i class="k lf"></i>${esc(T("needH"))} (NASA POWER)</span></p>
        ${nd.length ? `<h5 class="z-h">${esc(T("ndviH"))}</h5><div class="z-nd">${nd.map((v, i) => `<i class="${i === m ? "on" : ""}" style="height:${(Math.max(0, v) * 100).toFixed(0)}%" title="${MS()[i]}: ${nf(v, 2)}"></i>`).join("")}</div><p class="a-mut">${esc(T("seen")(nf(s.crops, 1)))}</p>` : ""}`; }
      case "rank": return `<div class="dv-opts-list">${d.r.map(({ c: y, s: sc, no }) => `<div class="dv-optc${y.id === f.rot ? " cur" : ""}${no ? " no" : ""}"><div class="dv-optt"><b>${esc(L(y.name))}</b>${no ? `<small class="a-no">${esc(T("notHere"))}</small>` : ""}<small>${esc(L(y.calendar))}</small><span class="sd-chip">${esc(T("fit"))} ${nf(sc, 1)}/5</span>${whyFit(y, f)}</div>
        ${y.id === f.rot ? `<span class="sd-chip lv-low">${esc(T("current"))}</span>` : `<button type="button" class="btn gold" data-use="${y.id}">${esc(T("use"))}</button>`}</div>`).join("")}</div><p class="a-src">${esc(T("rankSrc"))}</p>`;
      case "rib": return `${ribbon(f, c)}<p class="sd-note">${esc(T("tapMonth"))}</p>${planTable(f, c)}<p class="a-src">${esc(T("est"))}</p>`;
      case "nino": { const ty = d.t, tr = s.rain || [], er = (s.el && s.el.rain) || [], mr = Math.max(1, ...tr, ...er);
        return `<p class="a-num">&gt;83<small>%</small></p><p class="a-mut">${esc(L(DATA.outlook && DATA.outlook.text))}</p>
        ${ty && ty.nino ? `<dl class="a-kpi z-kpi"><div><dt>${esc(T("peakH"))} · ${esc(T("years").typical)}</dt><dd>${nf(ty.peak, 1)}<small>‰</small></dd></div><div><dt>${esc(T("peakH"))} · El Niño</dt><dd>${nf(ty.nino.peak, 1)}<small>‰</small></dd></div>
          <div><dt>${esc(T("saltMs"))} · ${esc(T("years").typical)}</dt><dd class="sm">${(ty.salt || []).map((x) => "T" + x).join(", ") || "–"}</dd></div><div><dt>${esc(T("saltMs"))} · El Niño</dt><dd class="sm">${(ty.nino.salt || []).map((x) => "T" + x).join(", ") || "–"}</dd></div></dl>` : ""}
        <h5 class="z-h">${esc(T("rainCmp"))}</h5><div class="z-cmp">${MS().map((t, i) => `<div><i class="a" style="height:${((tr[i] || 0) / mr * 100).toFixed(0)}%"></i><i class="b" style="height:${((er[i] || 0) / mr * 100).toFixed(0)}%"></i><span>${t}</span></div>`).join("")}</div>
        <p class="a-key"><span><i class="k lr"></i>${esc(T("years").typical)}</span><span><i class="k th"></i>${esc(T("years").elnino)}</span></p><p class="a-src">NOAA CPC · NASA GPM IMERG · ${esc(T("est"))}</p>`; }
    }
    return "";
  }
  function zoomHTML(f) {
    const d = advData(f);
    return `<div class="z-head"><div><p class="a-mut">${esc(f.name)} · ${esc(short(d.s))} · ${esc(T("viewing"))} ${esc(MLONG(d.m))}</p><h3 id="dvZT">${esc(zoomTitle(zoomKey, d))}</h3></div>
      <button type="button" class="icon-btn z-x" data-dvz="close" aria-label="${esc(T("close"))}">${ic("x", 20)}</button></div>
      ${zoomKey === "rank" || zoomKey === "scores" || zoomKey === "money" ? "" : monthStrip(f, d.c)}
      <div class="z-body">${zoomBody(zoomKey, f)}</div>`;
  }
  /* open: the panel grows out of the tile it came from (FLIP), close: it shrinks back into it */
  function zoomOpen(key, fromEl) {
    const f = fieldSel(); if (!f) return;
    zoomKey = key;
    const z = $("#dvZoom"), p = $("#dvZP");
    p.innerHTML = zoomHTML(f); z.hidden = false; document.body.classList.add("dv-zoomed");
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fromEl && !reduce && p.animate) {
      const a = fromEl.getBoundingClientRect(), b = p.getBoundingClientRect();
      p.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, opacity: .4, borderRadius: "14px" },
        { transform: "none", opacity: 1, borderRadius: "20px" }], { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" });
      z.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }
    zoomFrom = fromEl ? fromEl.dataset.zoom : null;
    setTimeout(() => { const x = p.querySelector(".z-x"); x && x.focus({ preventScroll: true }) }, 30);
  }
  let zoomFrom = null;
  function zoomClose() {
    const z = $("#dvZoom"); if (!z || z.hidden) return;
    const p = $("#dvZP"), t = zoomFrom && document.querySelector(`#dvPanel [data-zoom="${zoomFrom}"]`), reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let fin = false;
    const done = () => { if (fin) return; fin = true; z.hidden = true; zoomKey = null; document.body.classList.remove("dv-zoomed"); t && t.focus({ preventScroll: true }) };
    if (t && !reduce && p.animate) {
      const a = t.getBoundingClientRect(), b = p.getBoundingClientRect();
      p.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, opacity: .2 }], { duration: 220, easing: "cubic-bezier(.4,0,1,1)" }).onfinish = done;
      setTimeout(done, 260);   /* never left half-closed if the animation is paused (background tab) */
      z.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 });
    } else done();
  }
  function setSel(m) {
    selM = m === "now" ? null : +m;
    render();
    const f = fieldSel(), p = $("#dvZP");
    if (zoomKey && f && p) { const y = p.scrollTop; p.innerHTML = zoomHTML(f); p.scrollTop = y }
  }
  /* ---------------- suggestions, month check-off, feedback after the 12 months ---------------- */
  Object.assign(W.vi, {
    sgH: "Gợi ý cho bạn", sgJob: (m, j) => `Tháng ${m}: ${j}`,
    sgSaltNow: "Nước đang mặn: đo độ mặn trước khi bơm nước vào ruộng. Lúa cần nước dưới 1‰.",
    sgSaltSoon: (m) => `Mặn có thể về từ tháng ${m}: trữ đủ nước ngọt dùng khoảng 15 ngày trong ao, kênh, bồn.`,
    sgSow: "Chỉ gieo sạ khi có nước ngọt ổn định, theo lịch xuống giống của địa phương.",
    sgClash: (ms) => `Cây trồng gặp nước mặn vào ${ms}. Xem cách trồng chịu mặn hơn.`, sgBetter: (n) => `Cách trồng hợp hơn với ưu tiên của bạn: ${n}`,
    sgNino: "Năm El Niño: mặn có thể về sớm và sâu hơn. Theo dõi bản tin độ mặn của tỉnh trên Zalo, đài và loa xã.",
    sgSize: "Nhập diện tích ruộng để xem tiền vốn và tiền lời cho cả ruộng.", sgSrc: "Theo khuyến cáo của ngành nông nghiệp Sóc Trăng (báo Nhân Dân 20/5/2024; Nông nghiệp và Môi trường 23/2/2024). Độ mặn là ước tính.",
    sgGo: "Xem", sgOpen: "Đổi cách trồng", sgEdit: "Sửa ruộng", sgPrev: "Gợi ý trước", sgNext: "Gợi ý sau",
    pgH: "Tiến độ 12 tháng", pgOf: (n) => `${n}/12 tháng xong`, pgD: "Tháng đã qua được đánh dấu tự động. Chạm một tháng để đánh dấu hoặc bỏ đánh dấu.",
    pgTick: (m) => `Xong việc tháng ${m}`, pgDone: (m) => `Đã xong tháng ${m}`, pgAuto: "tự động", pgFuture: "chưa tới",
    pgStart: (m, y) => `Bắt đầu: tháng ${m}/${y}`, pgAt: (k) => `Tháng ${k}/12`,
    yourPlan: "Kế hoạch của bạn", pgLeft: (n) => (n ? `Còn ${n} tháng nữa` : "Đã đi hết 12 tháng"), pgToday: "Hôm nay", pgDoneL: "Đã qua", pgNextL: "Sắp tới",
    rmH: "Nhắc việc gieo và thu hoạch", rmSow: "Gieo sạ", rmStock: "Thả giống", rmHar: "Thu hoạch",
    rmNow: "Ngay tháng này!", rmNext: "Tháng sau", rmIn: (n) => `Còn ${n} tháng`, rmNone: "Không có vụ gieo hay thu hoạch trong 12 tháng tới.",
    rmSalt: "Lúc đó nước có thể mặn: đo độ mặn trước khi lấy nước vào ruộng.",
    rmCal: "Thêm nhắc nhở vào lịch điện thoại", rmCalD: "Điện thoại sẽ báo trước 3 ngày. Tháng là gần đúng, hãy theo lịch xuống giống của địa phương.",
    rmCalOk: "Đã tải tệp lịch. Mở tệp để thêm vào lịch điện thoại.", rmFile: "nhac-gieo-thu-hoach.ics",
    fbAsk: "Đã hết 12 tháng! Kế hoạch có giúp được bạn không? Cho chúng tôi biết nhé.", fbBtn: "Góp ý về kế hoạch", fbEarly: "Góp ý sớm",
    fbH: "Góp ý về kế hoạch 12 tháng", fbRate: "Kế hoạch giúp bạn thế nào?", fbRates: ["Không giúp", "Ít", "Tạm được", "Tốt", "Rất tốt"],
    fbCrop: "Mùa vụ năm nay", fbCrops: { good: "Được mùa", ok: "Bình thường", bad: "Mất mùa" },
    fbSalt: "Mặn có làm hại cây trồng không?", fbYes: "Có", fbNo: "Không", fbNote: "Bạn muốn nói thêm gì? (không bắt buộc)",
    fbSave: "Gửi góp ý", fbThanks: "Cảm ơn bạn đã góp ý!", fbLocal: "Góp ý được lưu trên máy này. Bạn có thể gửi cho cán bộ khuyến nông.",
    fbShare: "Chia sẻ góp ý", fbEdit: "Sửa góp ý", fbNew: "Bắt đầu 12 tháng mới", fbNeed: "Hãy chọn mức giúp đỡ (1 đến 5 sao)", fbCopied: "Đã chép góp ý", fbLater: "Để sau", fbNewP: "Dấu tích các tháng và góp ý hiện tại sẽ được cất vào lịch sử, rồi bắt đầu đếm lại từ tháng này.",
    fbShareT: (n, r, c, sl, note) => `Góp ý kế hoạch 12 tháng (${n}): ${r}/5 sao. Mùa vụ: ${c}. Mặn hại cây: ${sl}.${note ? " " + note : ""}`
  });
  Object.assign(W.en, {
    sgH: "Suggestions for you", sgJob: (m, j) => `Month ${m}: ${j}`,
    sgSaltNow: "The water is salty: measure salt before pumping water in. Rice needs water under 1‰.",
    sgSaltSoon: (m) => `Salt may come from month ${m}: store enough fresh water for about 15 days in ponds, canals or tanks.`,
    sgSow: "Sow only when fresh water is steady, on your local sowing calendar.",
    sgClash: (ms) => `Your crops meet salty water in ${ms}. Look at a more salt-tolerant plan.`, sgBetter: (n) => `A better fit for your priorities: ${n}`,
    sgNino: "El Niño year: salt may come earlier and go further inland. Follow the province's salt bulletins on Zalo, radio and commune speakers.",
    sgSize: "Enter your field size to see cost and profit for the whole field.", sgSrc: "From Sóc Trăng farm-sector advice (Nhân Dân 20 May 2024; Nông nghiệp và Môi trường 23 Feb 2024). Salt is an estimate.",
    sgGo: "See", sgOpen: "Change plan", sgEdit: "Edit field", sgPrev: "Previous tip", sgNext: "Next tip",
    pgH: "12-month progress", pgOf: (n) => `${n} of 12 months done`, pgD: "Months that have passed are ticked for you. Tap a month to tick or untick it.",
    pgTick: (m) => `Month ${m} done`, pgDone: (m) => `Month ${m} is done`, pgAuto: "auto", pgFuture: "not yet",
    pgStart: (m, y) => `Started: ${m}/${y}`, pgAt: (k) => `Month ${k} of 12`,
    yourPlan: "Your plan", pgLeft: (n) => (n ? `${n} months to go` : "All 12 months done"), pgToday: "Today", pgDoneL: "Passed", pgNextL: "Coming",
    rmH: "Sowing and harvest reminders", rmSow: "Sow", rmStock: "Stock", rmHar: "Harvest",
    rmNow: "This month!", rmNext: "Next month", rmIn: (n) => `In ${n} months`, rmNone: "No sowing or harvest in the next 12 months.",
    rmSalt: "The water may be salty then: measure salt before letting water in.",
    rmCal: "Add reminders to my phone calendar", rmCalD: "Your phone will remind you 3 days before. Months are approximate: follow your local sowing calendar.",
    rmCalOk: "Calendar file downloaded. Open it to add it to your phone calendar.", rmFile: "sow-harvest-reminders.ics",
    fbAsk: "Your 12 months are over! Did the plan help? Please tell us.", fbBtn: "Give feedback on the plan", fbEarly: "Give feedback now",
    fbH: "Feedback on your 12-month plan", fbRate: "How much did the plan help?", fbRates: ["Not at all", "A little", "Okay", "Good", "Very good"],
    fbCrop: "This year's harvest", fbCrops: { good: "Good", ok: "Normal", bad: "Lost" },
    fbSalt: "Did salt harm your crops?", fbYes: "Yes", fbNo: "No", fbNote: "Anything else? (optional)",
    fbSave: "Send feedback", fbThanks: "Thank you for your feedback!", fbLocal: "Your feedback is saved on this device. You can send it to your extension officer.",
    fbShare: "Share feedback", fbEdit: "Edit feedback", fbNew: "Start a new 12 months", fbNeed: "Please pick how much it helped (1 to 5 stars)", fbCopied: "Feedback copied", fbLater: "Later", fbNewP: "This year's ticks and feedback are kept in the history, and counting starts again from this month.",
    fbShareT: (n, r, c, sl, note) => `12-month plan feedback (${n}): ${r}/5 stars. Harvest: ${c}. Salt harmed crops: ${sl}.${note ? " " + note : ""}`
  });
  const MNUM = (m) => (lang() === "vi" ? "T" + (m + 1) : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m]);
  const startOf = (f) => { const d = new Date(f.startAt || f.savedAt || Date.now()); return { y: d.getFullYear(), m: d.getMonth() } };
  function months12(f, now = Season.now()) {
    const s0 = startOf(f), ni = now.getFullYear() * 12 + now.getMonth(), d = f.done || {};
    return [...Array(12)].map((_, i) => { const idx = s0.y * 12 + s0.m + i, y = Math.floor(idx / 12), m = idx % 12, key = `${y}-${m + 1}`, v = d[key];
      return { i, y, m, key, past: idx < ni, cur: idx === ni, future: idx > ni, done: v === true || v === "auto", auto: v === "auto" } });
  }
  /* a month that is over counts as done unless the farmer unticked it (false) */
  function autoTick(f) { f.done = f.done || {}; let ch = false; months12(f, Season.real()).forEach((x) => { if (x.past && f.done[x.key] === undefined) { f.done[x.key] = "auto"; ch = true } }); if (ch) save() }
  /* sow / harvest moments in the plan: a crop starts (sow or stock) and ends (harvest) */
  function moments(c) {
    if (c.cells) { const cur = Season.absOf(Season.now()), out = [];
      c.cells.forEach((x) => { if (x.code === "-" || x.idx < cur) return; const i = x.idx - cur;
        if (PV(c, x.m) !== x.code) out.push({ k: "sow", m: x.m, i, y: x.y, code: x.code, late: !!x.late });
        if (NX(c, x.m) !== x.code) out.push({ k: "har", m: x.m, i, y: x.y, code: x.code, date: x.src === "now" && c.end ? c.end.date : null }) });
      return out }
    const out = [], y0 = new Date().getFullYear();
    for (let i = 0; i < 12; i++) { const m = (CM + i) % 12, code = c.months[m]; if (code === "-") continue;
      const y = y0 + Math.floor((CM + i) / 12);
      if (c.months[(m + 11) % 12] !== code) out.push({ k: "sow", m, i, y, code });
      if (c.months[(m + 1) % 12] !== code) out.push({ k: "har", m, i, y, code }) }
    return out;
  }
  const momLabel = (x) => (x.k === "har" ? T("rmHar") : x.code[0] === "S" ? T("rmStock") : T("rmSow"));
  const momWhen = (i) => (i === 0 ? T("rmNow") : i === 1 ? T("rmNext") : T("rmIn")(i));
  /* "notification" card at the top: the next sowing and the next harvest, with a countdown and a phone-calendar reminder */
  function remindCard(f) {
    const c = planOf(f), ms = moments(c), nino = isNino(f), pick = ["sow", "har"].map((k) => ms.find((x) => x.k === k)).filter(Boolean).sort((a, b) => a.i - b.i);
    if (!pick.length) return `<section class="dv-rm" aria-labelledby="dvRmH"><h3 id="dvRmH">${ic("bell", 18)}${esc(T("rmH"))}</h3><p class="rm-none">${esc(T("rmNone"))}</p></section>`;
    return `<section class="dv-rm${pick.some((x) => x.i === 0) ? " hot" : ""}" aria-labelledby="dvRmH"><h3 id="dvRmH">${ic("bell", 18)}${esc(T("rmH"))}</h3>
      <ul class="rm-list">${pick.map((x) => { const salty = x.k === "sow" && x.code[0] !== "S" && level(fieldSalt(f.site, x.m, nino)) === "man";
        return `<li class="rm-it k-${x.k}${x.i === 0 ? " now" : ""}"><span class="rm-ic" aria-hidden="true">${ic(x.k === "har" ? "basket" : "seed", 26)}</span>
        <div class="rm-tx"><span class="rm-k">${esc(momLabel(x))}<em class="rm-when">${esc(momWhen(x.i))}</em></span><b>${esc(cropName(c, x.code))}</b><span class="rm-d">${esc(MLONG(x.m))} ${x.y}</span>${salty ? `<span class="rm-salt">${ic("warn", 14)}${esc(T("rmSalt"))}</span>` : ""}</div></li>` }).join("")}</ul>
      <button type="button" class="btn rm-cal" data-dvrm="ics">${ic("cal", 18)}<span>${esc(T("rmCal"))}</span></button><p class="rm-note">${esc(T("rmCalD"))} ${esc(T("est"))}</p></section>`;
  }
  /* a .ics file with every sowing and harvest of the next 12 months; the phone's own calendar does the reminding */
  function icsDownload() {
    const f = fieldSel(); if (!f) return; Sim.reset(); const c = planOf(f), p2 = (n) => String(n).padStart(2, "0"), now = new Date();
    const stamp = `${now.getUTCFullYear()}${p2(now.getUTCMonth() + 1)}${p2(now.getUTCDate())}T${p2(now.getUTCHours())}${p2(now.getUTCMinutes())}00Z`;
    const escI = (t) => String(t).replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const ev = moments(c).map((x, n) => { const dd = x.date || new Date(x.y, x.m, 1), d0 = `${dd.getFullYear()}${p2(dd.getMonth() + 1)}${p2(dd.getDate())}`, nx = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate() + 1), d1 = `${nx.getFullYear()}${p2(nx.getMonth() + 1)}${p2(nx.getDate())}`, ttl = `${momLabel(x)}: ${cropName(c, x.code)} (${f.name})`;
      return ["BEGIN:VEVENT", `UID:${f.id}-${x.y}-${x.m}-${x.k}-${n}@mekong-rotation`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d0}`, `DTEND;VALUE=DATE:${d1}`, `SUMMARY:${escI(ttl)}`,
        `DESCRIPTION:${escI(`${jobAt(c, x.m)}. ${T("sgSow")} ${T("est")}.`)}`, "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escI(ttl)}`, "TRIGGER:-P3D", "END:VALARM", "END:VEVENT"].join("\r\n") });
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mekong Rotation Explorer//EN", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" })), a = document.createElement("a");
    a.href = url; a.download = T("rmFile"); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    try { window.App && App.toast && App.toast(T("rmCalOk")) } catch (e) {}
  }
  function progressCard(f) {
    /* the season path: 12 months as a road coloured by crop; a marker walks along it to today; seed flags = sowing, basket flags = harvest */
    const ms = months12(f), past = ms.filter((x) => x.past).length, now = ms.find((x) => x.cur), over = ms[11].past, s0 = startOf(f), c = planOf(f);
    const d = Season.now(), part = now ? (d.getDate() - 1) / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() : 0, frac = over ? 1 : Math.min(1, (past + part) / 12);
    const k = over ? 12 : now ? past + 1 : 0, code0 = now ? c.months[now.m] : "-", deg = (frac * 360).toFixed(1);
    curSite = f.site; curNino = isNino(f);
    const fbDone = !!f.feedback;
    const seg = ms.map((x) => { const code = c.months[x.m], kk = code === "-" ? "rest" : code[0], sow = code !== "-" && PV(c, x.m) !== code, har = code !== "-" && NX(c, x.m) !== code;
      return `<li class="pg-s pk-${kk}${x.past ? " done" : ""}${x.cur ? " cur" : ""}"${x.cur ? ` style="--p:${Math.max(8, Math.round(part * 100))}%"` : ""} aria-label="${esc(MLONG(x.m))}: ${esc(cropName(c, code))}${sow ? ", " + esc(momLabel({ k: "sow", code })) : ""}${har ? ", " + esc(T("rmHar")) : ""}">
        <span class="pg-fl" aria-hidden="true">${sow ? `<i class="fl sow">${ic("seed", 13)}</i>` : ""}${har ? `<i class="fl har">${ic("basket", 13)}</i>` : ""}</span><i class="pg-bk"></i><span class="pg-l">${esc(MNUM(x.m))}</span></li>` }).join("");
    const kinds = ["R", "S", "U", "-"].filter((q) => c.months.some((x) => x[0] === q));
    return `<section class="dv-prog${over ? " over" : ""}" aria-labelledby="dvPgH">
      <div class="pg-hd"><div class="pg-ring" style="--deg:${deg}deg" aria-hidden="true"><span><b>${k}</b><small>/12</small></span></div>
        <div class="pg-ht"><h3 id="dvPgH">${esc(T("pgH"))}</h3><b class="pg-n">${esc(T("pgAt")(k))}</b><span class="pg-left">${esc(T("pgLeft")(12 - k))}</span></div></div>
      <div class="pg-path" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(frac * 100)}" aria-label="${esc(T("pgH"))}: ${esc(T("pgAt")(k))}">
        <ol class="pg-segs">${seg}</ol>
        ${over ? "" : `<span class="pg-walk" style="left:${Math.min(96, Math.max(4, frac * 100)).toFixed(2)}%" aria-hidden="true"><em>${esc(T("pgToday"))}</em><span class="pg-tok">${iconOf(code0)}</span></span>`}
      </div>
      <p class="pg-key">${kinds.map((q) => `<span><i class="sw pk-${q === "-" ? "rest" : q}"></i>${esc(T("crop")[q])}</span>`).join("")}<span>${ic("seed", 13)}${esc(T("rmSow"))}</span><span>${ic("basket", 13)}${esc(T("rmHar"))}</span></p>
      <p class="pg-d">${esc(T("pgStart")(s0.m + 1, s0.y))}${now ? ` · <b>${esc(jobAt(c, now.m))}</b>` : ""}</p>
      ${over && !fbDone ? `<div class="pg-fb"><p>${esc(T("fbAsk"))}</p><button type="button" class="btn gold" data-dvfb="open">${ic("star", 18)}<span>${esc(T("fbBtn"))}</span></button></div>` : ""}
      ${fbDone ? `<div class="pg-fb ok"><p><b>${esc(T("fbThanks"))}</b> <span class="pg-stars" aria-label="${f.feedback.rate}/5">${"★".repeat(f.feedback.rate)}${"☆".repeat(5 - f.feedback.rate)}</span></p><div class="pg-fba"><button type="button" class="btn" data-dvfb="open">${esc(T("fbEdit"))}</button>${over ? `<button type="button" class="btn gold" data-dvfb="newask">${esc(T("fbNew"))}</button>` : ""}</div></div>` : ""}
      ${!over && !fbDone ? `<button type="button" class="dv-link pg-early" data-dvfb="open">${esc(T("fbEarly"))}</button>` : ""}</section>`;
  }
  function fbSheet() {
    const f = fieldSel(); if (!f) return; const fb = f.feedback || {};
    sheet(`<div class="dv-fbf"><h2>${ic("star", 22)}${esc(T("fbH"))}</h2><p class="sd-note">${esc(f.name)} · ${esc(L(cardOf(f).name))}</p>
      <fieldset class="fb-q"><legend>${esc(T("fbRate"))}</legend><div class="fb-stars">${[1, 2, 3, 4, 5].map((r) => `<label><input type="radio" name="fbRate" value="${r}" ${fb.rate === r ? "checked" : ""}><span aria-hidden="true">★</span><small>${esc(T("fbRates")[r - 1])}</small></label>`).join("")}</div></fieldset>
      <fieldset class="fb-q"><legend>${esc(T("fbCrop"))}</legend><div class="fb-chips">${Object.entries(T("fbCrops")).map(([k, v]) => `<label><input type="radio" name="fbCrop" value="${k}" ${fb.crop === k ? "checked" : ""}><span>${esc(v)}</span></label>`).join("")}</div></fieldset>
      <fieldset class="fb-q"><legend>${esc(T("fbSalt"))}</legend><div class="fb-chips">${[["yes", T("fbYes")], ["no", T("fbNo")]].map(([k, v]) => `<label><input type="radio" name="fbSalt" value="${k}" ${fb.salt === k ? "checked" : ""}><span>${esc(v)}</span></label>`).join("")}</div></fieldset>
      <label class="fb-note"><span>${esc(T("fbNote"))}</span><textarea id="fbNote" rows="3" maxlength="500">${esc(fb.note || "")}</textarea></label>
      <p class="fb-err" id="fbErr" role="alert"></p>
      <div class="dv-acts"><button type="button" class="btn gold" data-dvfb="save">${ic("check", 16)}<span>${esc(T("fbSave"))}</span></button><button type="button" class="btn" data-dv="close"><span>${esc(T("fbLater"))}</span></button></div>
      <p class="sd-note">${esc(T("fbLocal"))}</p></div>`);
  }
  function fbText(f) { const fb = f.feedback; return T("fbShareT")(f.name, fb.rate, fb.crop ? T("fbCrops")[fb.crop] : "–", fb.salt ? (fb.salt === "yes" ? T("fbYes") : T("fbNo")) : "–", fb.note || "") }
  function fbAction(a) {
    const f = fieldSel(); if (!f) return;
    if (a === "open") return fbSheet();
    if (a === "save") {
      const v = (n) => { const x = document.querySelector(`#dvShBody input[name="${n}"]:checked`); return x ? x.value : null };
      const rate = +v("fbRate"); if (!rate) { const e = $("#fbErr"); if (e) e.textContent = T("fbNeed"); return }
      f.feedback = { rate, crop: v("fbCrop"), salt: v("fbSalt"), note: String(($("#fbNote") || {}).value || "").trim().slice(0, 500), at: Date.now(), rot: f.rot };
      save(); closeSheet(); render();
      sheet(`<div class="dv-fbf"><h2>${ic("check", 22)}${esc(T("fbThanks"))}</h2><p class="sd-note">${esc(T("fbLocal"))}</p><div class="dv-acts"><button type="button" class="btn gold" data-dvfb="share">${esc(T("fbShare"))}</button><button type="button" class="btn" data-dv="close">${esc(T("close"))}</button></div></div>`);
      return;
    }
    if (a === "share") { const txt = fbText(f), tst = (m) => { try { window.App && App.toast && App.toast(m) } catch (e) {} };
      if (navigator.share) { navigator.share({ text: txt }).catch(() => {}) } else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(() => tst(T("fbCopied"))).catch(() => tst(txt)) } else tst(txt); return }
    if (a === "newask") { sheet(`<div class="dv-fbf"><h2>${ic("cal", 22)}${esc(T("fbNew"))}?</h2><p class="sd-note">${esc(T("fbNewP"))}</p><div class="dv-acts"><button type="button" class="btn gold" data-dvfb="new">${esc(T("fbNew"))}</button><button type="button" class="btn" data-dv="close">${esc(T("fbLater"))}</button></div></div>`); return }
    if (a === "new") { closeSheet(); (f.history = f.history || []).push({ startAt: f.startAt || f.savedAt, done: f.done, feedback: f.feedback }); f.startAt = Date.now(); f.done = {}; f.feedback = null; save(); render() }
  }
  function tickMonth(key) { const f = fieldSel(); if (!f || Season.simOn()) return; f.done = f.done || {}; const x = months12(f, Season.real()).find((y) => y.key === key); if (!x || x.future) return; f.done[key] = x.done ? false : true; save(); render() }
  let sgOpen = 0;   /* the tip deck always shows one tip; warnings come first */
  function suggestions(f) {
    const x = facts(f), { c } = x, out = [], nino = x.nino;
    out.push({ i: "cal", t: T("sgJob")(CM + 1, x.job) });
    if (x.lv !== "ngot") out.push({ i: "drop", t: T("sgSaltNow"), w: 1 });
    else { for (let k = 1; k <= 2; k++) { const m = (CM + k) % 12; if (level(fieldSalt(f.site, m, nino)) !== "ngot") { out.push({ i: "drop", t: T("sgSaltSoon")(m + 1), w: 1 }); break } } }
    const k0 = NX(c, CM)[0]; if ((k0 === "R" || k0 === "U") && c.months[CM][0] !== k0) out.push({ i: "seed", t: T("sgSow") });
    const best = rank(f).find((y) => !y.no);
    if (x.clash.length) out.push({ i: "warn", t: T("sgClash")(x.clash.join(", ")), a: "choose", al: T("sgOpen"), w: 1 });
    else if (best && best.c.id !== c.id) out.push({ i: "star", t: T("sgBetter")(L(best.c.name)), a: "choose", al: T("sgOpen") });
    if (nino) out.push({ i: "sun", t: T("sgNino") });
    if (!f.size) out.push({ i: "coin", t: T("sgSize"), a: "editmap", al: T("sgEdit") });
    const xs = out.slice(0, 5).map((y, i) => ({ ...y, o: i })).sort((p, q) => (q.w || 0) - (p.w || 0) || p.o - q.o); if (sgOpen >= xs.length || sgOpen < 0) sgOpen = 0;
    const n = xs.length, prev = (sgOpen + n - 1) % n, next = (sgOpen + 1) % n;
    /* a deck of tip cards: one tip open as a big card, the rest peek out behind it; icons are tabs, arrows flip */
    return `<section class="dv-sug deck" aria-labelledby="dvSgH" style="--left:${Math.min(2, n - 1)}"><h3 id="dvSgH">${ic("star", 18)}${esc(T("sgH"))}<span class="sg-n">${sgOpen + 1} / ${n}</span></h3>
      <div class="sg-stack">${xs.map((y, i) => `<div class="sg-p${y.w ? " warn" : ""}" id="dvSgP${i}" role="tabpanel" aria-live="polite" ${i === sgOpen ? "" : "hidden"}><span class="sg-big" aria-hidden="true">${ic(y.i, 30)}</span><p class="sg-t">${esc(y.t)}</p>${y.a ? `<button type="button" class="btn sg-a" data-dv="${y.a}">${esc(y.al)}${ic("chev", 14)}</button>` : ""}<p class="a-src">${esc(T("sgSrc"))}</p></div>`).join("")}</div>
      <div class="sg-nav">${n > 1 ? `<button type="button" class="sg-arr" data-dvsg="${prev}" aria-label="${esc(T("sgPrev"))}">${ic("back", 18)}</button>` : ""}
        <div class="sg-row" role="tablist" aria-labelledby="dvSgH">${xs.map((y, i) => `<button type="button" role="tab" class="sg-c${y.w ? " warn" : ""}${i === sgOpen ? " on" : ""}" data-dvsg="${i}" aria-selected="${i === sgOpen}" aria-controls="dvSgP${i}" aria-label="${esc(y.t)}" title="${esc(y.t)}">${ic(y.i, 18)}</button>`).join("")}</div>
        ${n > 1 ? `<button type="button" class="sg-arr nx" data-dvsg="${next}" aria-label="${esc(T("sgNext"))}">${ic("chev", 18)}</button>` : ""}</div></section>`;
  }
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#dv")) return;
    const t = e.target.closest("[data-dvtick]"); if (t) { e.stopPropagation(); return tickMonth(t.dataset.dvtick) }
    const g = e.target.closest("[data-dvsg]"); if (g) { e.stopPropagation(); const box = g.closest(".dv-sug"), fwd = g.classList.contains("nx") || +g.dataset.dvsg > sgOpen; sgOpen = +g.dataset.dvsg;
      const ref = document.createElement("div"); ref.innerHTML = suggestions(fieldSel()); const nb = ref.firstElementChild; nb.classList.add(fwd ? "flip-f" : "flip-b"); box.replaceWith(nb);
      const fc = nb.querySelector(g.classList.contains("sg-arr") ? (g.classList.contains("nx") ? ".sg-arr.nx" : ".sg-arr:not(.nx)") : ".sg-c.on"); fc && fc.focus({ preventScroll: true }); return }
    const b = e.target.closest("[data-dvfb]"); if (b) { e.stopPropagation(); return fbAction(b.dataset.dvfb) }
    if (e.target.closest("[data-dvrm]")) { e.stopPropagation(); return icsDownload() }
  }, true);

  /* ================= app shell: Today, Season, Fields, the crop in the field now, and the year simulation =================
     Bottom bar: Hôm nay · Mùa vụ · (Kế hoạch: the create-plan flow) · Số liệu · Ruộng. Top date bar: play the 12 months week by week.
     The simulation only changes the date on show; it never saves, ticks months or writes files (Season.real() is used for those). */
  Object.assign(W.vi, {
    demoB: "Xem thử với ruộng mẫu", demoP: "Ruộng mẫu ở khu vực Mỹ Xuyên, đang có lúa còn 6 tuần nữa gặt. Xoá được bất cứ lúc nào.", demoN: "Ruộng mẫu",
    navLabel: "Các trang", waterW: (w) => `Nước ${w.toLowerCase()}`, navToday: "Hôm nay", navSeason: "Mùa vụ", navPlan: "Kế hoạch", navData: "Số liệu", navFields: "Ruộng",
    clkToday: "Bây giờ", clkNow: "Bây giờ", clkSim: (y) => `Xem thử năm ${y}`, clkPlay: (y) => `Chạy thử ${y} năm tới`, clkPause: "Tạm dừng", clkReset: "Về hôm nay", clkSlider: (y) => `Kéo để xem thử một ngày trong ${y} năm tới`,
    hzH: "Xem thử bao xa", hzL: (y) => `${y} năm`,
    clkNote: (y2) => `Đang xem thử: không lưu gì. Mưa, nước và độ mặn là trung bình nhiều năm, không phải dự báo.${y2 ? " Năm 2–3 dùng năm điển hình (dự báo El Niño chỉ cho mùa này)." : ""}`,
    heroRest: "Ruộng đang nghỉ", dayOf: (a, b) => `ngày ${a}/${b}`, daysTo: { R: "ngày nữa gặt", S: "ngày nữa thu tôm", U: "ngày nữa thu hoạch" }, daysSow: (k, n) => `ngày nữa ${k === "S" ? "thả" : "sạ"} ${n}`,
    enteredA: (d) => `nhập ngày ${d}`, sowA: (d) => `sạ ≈ ${d}`, stockA: (d) => `thả ≈ ${d}`, harA: (d) => `thu ≈ ${d}`, restEnd: "Nghỉ đến hết 12 tháng", nextMark: "Việc sắp tới",
    afterL: (n, d) => `Sau đó: ${n}, bắt đầu ≈ ${d}`, afterRest: (r) => `nghỉ ${r}`, afterNone: "Sau đó: cho ruộng nghỉ", restFrom: (d) => `nghỉ từ ${d}`,
    heroSrc: "Ngày là ước tính từ lịch vụ và số tuần bạn nhập. Lúa 90–100 ngày; bón thúc 7–10, 18–22, 38–42 ngày sau sạ; rút nước 7–15 ngày trước gặt (hướng dẫn kỹ thuật).",
    mk: { top1: "Bón thúc lần 1", top2: "Bón thúc lần 2", top3: "Bón thúc lần 3", drain: "Rút nước trước khi gặt" },
    todoH: "Việc cần làm", todoNow: (m) => `Tháng ${m}`, todoNext: (m) => `Tháng ${m}`, planL: "Kế hoạch",
    pestH: "Sâu bệnh tháng này", pestLv: { lo: "Thấp", mid: "Vừa", hi: "Cao" }, pestWord: (l) => `Áp lực sâu bệnh: ${l}`,
    pestWho: { R: "Rầy nâu trên lúa", S: "Bệnh tôm khi trời nóng hoặc lạnh", U: "Sâu hại cây màu", "-": "Ruộng nghỉ" },
    pestWhy: { R: (t) => `Nhiệt độ trung bình ${t} °C. Rầy nâu phát triển đủ ở 25–30 °C, không lớn được ở 20 °C và 35 °C.`, S: (h, c) => `${h} ngày từ 35 °C trở lên, ${c} ngày lạnh đột ngột trong tháng. Không có ngày nào thì vẫn tính mức nền (ước tính của nhóm).`, U: "Chưa có số liệu sâu cây màu theo nhiệt độ, nên tính ở mức cao.", "-": "Không có lúa trong ruộng: vòng đời rầy nâu bị cắt." },
    pestYr: "12 tháng tới", pestScore: (x) => `Điểm ít sâu bệnh của kế hoạch: ${x}/5`, pestBreak: (n) => `${n} tháng nghỉ hoặc cây khác cắt vòng đời rầy.`,
    pestSrc: "Nhiệt độ: NASA POWER · đường cong rầy nâu: Horgan và cộng sự 2020 · trung bình nhiều năm, không phải dự báo.", pestSrcN: "Nhiệt độ: NASA POWER · đường cong rầy nâu: Horgan và cộng sự 2020 · năm El Niño.",
    tilesH: "Nước và cây tháng này", tRain: "Mưa", tNeed: "Cây cần", tGreen: "Độ xanh", tShort: (n) => `thiếu ${n} mm`, tOk: "mưa đủ", tNd: "0 đến 1, cao là xanh",
    tAvg: (y) => `Trung bình nhiều năm${y ? " · năm El Niño" : ""}. Không phải dự báo.`,
    nowQ: "Ruộng đang có gì bây giờ?", nowWhy: "Kế hoạch 12 tháng bắt đầu từ hôm nay và từ vụ đang có trên ruộng.",
    nowK: { R: "Lúa", S: "Tôm", U: "Cây màu", "-": "Đang trống" }, nowLeft: "Còn bao lâu nữa thì thu hoạch?",
    wk: (n) => `${n} tuần`, wkAbout: (n) => (n === 0 ? "thu hoạch tuần này" : n < 3 ? "dưới 1 tháng" : `khoảng ${nf(Math.max(1, Math.round((n / 4.35) * 2) / 2), 1).replace(/,0$/, "")} tháng`), wkLess: "Bớt 1 tuần", wkMore: "Thêm 1 tuần",
    harvH: "Thu hoạch thế nào?", keep: { R: "Để lúa chín rồi gặt", S: "Nuôi đủ ngày rồi thu", U: "Để chín rồi thu" },
    keepS: { R: "Gặt khi lúa chín 85–90%", S: "Tôm đủ cỡ, giá tốt hơn", U: "Thu đúng lúc" },
    early: { R: "Gặt sớm", S: "Thu tôm sớm", U: "Thu sớm" },
    earlyS: { R: "Sớm khoảng 2 tuần: hạt có thể chưa chắc, hao một ít (ước tính của nhóm)", S: "Thu trong tuần tới: tôm nhỏ hơn, bán giá thấp hơn", U: "Sớm khoảng 2 tuần: trái nhỏ hơn (ước tính của nhóm)" },
    earlyNo: (n) => `Chỉ gặt sớm được khi còn ${n} tuần trở xuống: lúa cần chín 85–90%.`,
    hitsL: (n) => (n ? `Cây gặp nước mặn ${n} tháng trong 12 tháng (ước tính)` : "Không tháng nào cây gặp nước mặn (ước tính)"), hDate: (d) => `Thu ≈ ${d}`, waterAt: (w) => `nước lúc đó: ${w}`, rec: "Nên chọn",
    nextOk: (n, mo) => `Vụ sau: ${n}, ${mo}`, nextLate: (n, mo) => `Vụ sau: ${n} sạ muộn ${mo}`, nextWait: (mo, n) => `Vụ sau: chờ đến ${mo} (${n})`, nextNone: "Vụ sau: cho ruộng nghỉ",
    nowSrc: "Lúa thường 90–100 ngày (hướng dẫn kỹ thuật). Ngày thu là ước tính.", nowSrc2: "Ngày thu là ước tính từ số tuần bạn nhập.", nowFree: "Kế hoạch bắt đầu ngay tháng này.",
    nowSave: "Lưu", nowLater: "Để sau", nowSaved: "Đã lưu. Kế hoạch bắt đầu từ hôm nay.", nowEdit: "Sửa vụ đang trồng",
    nowAskH: "Ruộng đang có gì?", nowAskP: "Trả lời 2 câu để kế hoạch bắt đầu đúng từ hôm nay: đang trồng gì, còn bao lâu nữa thu hoạch.", nowAskB: "Trả lời",
    nowFlow: "Chưa trả lời thì kế hoạch giả định ruộng đang theo đúng lịch vụ.",
    waitJob: "Chờ vụ sau: không kịp sạ vụ này", lateSow: (n) => `Sạ muộn ${n}: dùng giống ngắn ngày (90–100 ngày)`,
    seasH: "Mùa vụ 12 tháng", stDone: "Xong", stNow: "Đang ở đây", stNext: "Sắp tới", stRest: "Cho ruộng nghỉ", stWait: "Chờ vụ sau",
    lateTag: "sạ muộn", saltTag: (ms) => `gặp mặn ${ms}`, waitWhy: (n) => `Không kịp ${n}: ruộng còn bận vụ trước.`, tableB: "Bảng việc từng tháng", seasTap: "Chạm vào một vụ để xem giống, phân bón và các bước.",
    fieldsH: "Ruộng của tôi", setH: "Cài đặt", langH2: "Ngôn ngữ", srcL: "Nguồn số liệu",
    evSow: (n) => `Sạ ${n}`, evStock: (n) => `Thả ${n}`, evHar: (n) => `Thu hoạch ${n}`, evSaltIn: "Nước bắt đầu mặn (ước tính)", evSaltOut: "Hết mặn, nước ngọt trở lại (ước tính)", evSaltHit: (n) => `Mặn vào khi ${n} còn trên ruộng: đo mặn, giữ nước ngọt`, evSowSalt: (n) => `Đến lúc sạ ${n} nhưng nước còn mặn: đo mặn, chờ mưa rửa mặn`
  });
  Object.assign(W.en, {
    demoB: "Try a sample field", demoP: "A sample field in the Mỹ Xuyên area, with rice 6 weeks from harvest. You can delete it any time.", demoN: "Sample field",
    navLabel: "Pages", waterW: (w) => `${w} water`, navToday: "Today", navSeason: "Season", navPlan: "Plan", navData: "Data", navFields: "Fields",
    clkToday: "Now", clkNow: "Now", clkSim: (y) => `Preview · year ${y}`, clkPlay: (y) => `Play the next ${y} year${y > 1 ? "s" : ""}`, clkPause: "Pause", clkReset: "Back to today", clkSlider: (y) => `Drag to preview a day in the next ${y} year${y > 1 ? "s" : ""}`,
    hzH: "How far to preview", hzL: (y) => `${y} yr`,
    clkNote: (y2) => `Preview only: nothing is saved. Rain, water and salt are long-term averages, not a forecast.${y2 ? " Years 2–3 use the typical year (the El Niño outlook covers this season only)." : ""}`,
    heroRest: "Field is resting", dayOf: (a, b) => `day ${a}/${b}`, daysTo: { R: "days to harvest", S: "days to shrimp harvest", U: "days to harvest" }, daysSow: (k, n) => `days to ${k === "S" ? "stock" : "sow"} ${n}`,
    enteredA: (d) => `entered ${d}`, sowA: (d) => `sow ≈ ${d}`, stockA: (d) => `stock ≈ ${d}`, harA: (d) => `harvest ≈ ${d}`, restEnd: "Rests to the end of the 12 months", nextMark: "Next step",
    afterL: (n, d) => `Then: ${n}, starting ≈ ${d}`, afterRest: (r) => `rest ${r}`, afterNone: "Then: the field rests", restFrom: (d) => `rest from ${d}`,
    heroSrc: "Dates are estimates from the crop calendar and the weeks you entered. Rice takes 90–100 days; top-dress at 7–10, 18–22 and 38–42 days after sowing; drain 7–15 days before harvest (technical guide).",
    mk: { top1: "First top-dressing", top2: "Second top-dressing", top3: "Third top-dressing", drain: "Drain before harvest" },
    todoH: "What to do", todoNow: (m) => MLONG(m - 1), todoNext: (m) => MLONG(m - 1), planL: "Plan",
    pestH: "Pests this month", pestLv: { lo: "Low", mid: "Medium", hi: "High" }, pestWord: (l) => `Pest pressure: ${l}`,
    pestWho: { R: "Brown planthopper on rice", S: "Shrimp disease in hot or cold spells", U: "Upland crop pests", "-": "Field resting" },
    pestWhy: { R: (t) => `Mean temperature ${t} °C. Brown planthoppers develop fully at 25–30 °C and fail to grow at 20 °C and 35 °C.`, S: (h, c) => `${h} days at or above 35 °C and ${c} sudden cold days this month. With none, a base level still counts (team estimate).`, U: "No temperature data for upland pests yet, so it counts as high.", "-": "No rice in the field: the brown planthopper cycle is broken." },
    pestYr: "Next 12 months", pestScore: (x) => `Plan's fewer-pests score: ${x}/5`, pestBreak: (n) => `${n} rest or other-crop months break the planthopper cycle.`,
    pestSrc: "Temperature: NASA POWER · planthopper curve: Horgan et al. 2020 · long-term average, not a forecast.", pestSrcN: "Temperature: NASA POWER · planthopper curve: Horgan et al. 2020 · El Niño year.",
    tilesH: "Water and crops this month", tRain: "Rain", tNeed: "Crops need", tGreen: "Greenness", tShort: (n) => `${n} mm short`, tOk: "rain is enough", tNd: "0 to 1, high is green",
    tAvg: (y) => `Long-term average${y ? " · El Niño year" : ""}. Not a forecast.`,
    nowQ: "What is in the field now?", nowWhy: "The 12-month plan starts today, from the crop in your field now.",
    nowK: { R: "Rice", S: "Shrimp", U: "Upland crop", "-": "Empty" }, nowLeft: "How long until harvest?",
    wk: (n) => `${n} week${n === 1 ? "" : "s"}`, wkAbout: (n) => { const x = Math.max(1, Math.round((n / 4.35) * 2) / 2); return n === 0 ? "harvest this week" : n < 3 ? "under a month" : `about ${String(x)} month${x === 1 ? "" : "s"}` }, wkLess: "One week less", wkMore: "One week more",
    harvH: "How will you harvest?", keep: { R: "Let it ripen, then harvest", S: "Grow to full size", U: "Let it ripen" },
    keepS: { R: "Harvest when 85–90% of grains are ripe", S: "Bigger shrimp, better price", U: "Harvest on time" },
    early: { R: "Harvest early", S: "Harvest shrimp early", U: "Harvest early" },
    earlyS: { R: "About 2 weeks early: some grains not full, a small loss (team estimate)", S: "Within a week: smaller shrimp, lower price", U: "About 2 weeks early: smaller fruit (team estimate)" },
    earlyNo: (n) => `Early harvest only when ${n} weeks or less are left: rice must be 85–90% ripe.`,
    hitsL: (n) => (n ? `Crops in salty water ${n} month${n > 1 ? "s" : ""} of 12 (estimate)` : "No crop month in salty water (estimate)"), hDate: (d) => `Harvest ≈ ${d}`, waterAt: (w) => `water then: ${w}`, rec: "Best choice",
    nextOk: (n, mo) => `Next: ${n}, ${mo}`, nextLate: (n, mo) => `Next: ${n} sown late, ${mo}`, nextWait: (mo, n) => `Next: wait until ${mo} (${n})`, nextNone: "Next: the field rests",
    nowSrc: "Rice usually takes 90–100 days (technical guide). Harvest dates are estimates.", nowSrc2: "Harvest date is an estimate from the weeks you entered.", nowFree: "The plan starts this month.",
    nowSave: "Save", nowLater: "Later", nowSaved: "Saved. The plan now starts today.", nowEdit: "Edit the crop in the field",
    nowAskH: "What is in your field?", nowAskP: "Answer 2 questions so the plan starts from today: what grows now, and how long until harvest.", nowAskB: "Answer",
    nowFlow: "If you skip this, the plan assumes the field follows the usual crop calendar.",
    waitJob: "Wait for the next season: too late to sow this one", lateSow: (n) => `Sow ${n} late: use a short variety (90–100 days)`,
    seasH: "Your 12 months", stDone: "Done", stNow: "You are here", stNext: "Coming", stRest: "Rest the field", stWait: "Wait for the next season",
    lateTag: "sown late", saltTag: (ms) => `salt in ${ms}`, waitWhy: (n) => `Too late for ${n}: the field is still busy.`, tableB: "Month-by-month table", seasTap: "Tap a season to see seed, fertiliser and steps.",
    fieldsH: "My fields", setH: "Settings", langH2: "Language", srcL: "Data sources",
    evSow: (n) => `Sow ${n}`, evStock: (n) => `Stock ${n}`, evHar: (n) => `Harvest ${n}`, evSaltIn: "Water turns salty (estimate)", evSaltOut: "Salt has gone, fresh water is back (estimate)", evSaltHit: (n) => `Salt arrives while ${n} is in the field: measure salt, keep fresh water`, evSowSalt: (n) => `Time to sow ${n}, but the water is still salty: measure salt, wait for rain`
  });
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const KI = { R: "rice", S: "shrimp", U: "upland", "-": "fallow" };
  const fD = (d) => (lang() === "vi" ? `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }));
  const fDs = (d) => (lang() === "vi" ? `${d.getDate()}/${d.getMonth() + 1}` : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
  const fMY = (idx) => `${MNUM(((idx % 12) + 12) % 12)}${lang() === "vi" ? "/" : " "}${Math.floor(idx / 12)}`;
  const fRg = (a, b) => (a === b ? fMY(a) : Math.floor(a / 12) === Math.floor(b / 12) ? `${MNUM(a % 12)}–${fMY(b)}` : `${fMY(a)} – ${fMY(b)}`);
  const runName = (c, code) => cap(cropName(c, code));

  /* ---------- the crop in the field now: one form for the dashboard sheet and the create-plan flow ---------- */
  let flowNow = null, shNow = null;
  const WK = { R: [2, 4, 6, 8, 10, 12], U: [2, 4, 6, 8, 10, 12], S: [2, 4, 8, 12, 16, 20] }, WMAX = { R: 15, U: 16, S: 26 };
  function nowForm(nw, ctx, flow) {
    const d = nw || {}, k = d.k, P = flow ? "nf" : "ns", H = flow ? "h3" : "h2";
    const kinds = ["R", "S", "U", "-"].map((x) => `<button type="button" class="nw-k nk-${x === "-" ? "rest" : x}" id="${P}K${x === "-" ? "F" : x}" data-nw="k" data-v="${x}" aria-pressed="${k === x}"><span class="nw-ki" aria-hidden="true">${ic(KI[x], 26)}</span><span class="nw-kl">${esc(T("nowK")[x])}</span></button>`).join("");
    let body = "";
    if (k && k !== "-") {
      const wk = d.weeks == null ? 6 : d.weeks, base = { k, weeks: wk, at: Date.now() }, eOk = Season.earlyOk(base);
      const hk = Season.harvestOf(base, "keep"), he = eOk ? Season.harvestOf(base, "early") : null, ch = d.choice === "early" && eOk ? "early" : "keep";
      const lvAt = (dt) => level(fieldSalt(ctx.site, dt.getMonth(), ctx.nino));
      const nextOf = (choice) => { if (!ctx.card) return ""; const w = Season.windowOf(ctx.card, { ...base, choice }, Season.real()), r = w.runs.find((x) => !x.cur);
        if (!r) return T("nextNone"); const mo = fMY(w.a0 + r.from), n = runName(w, r.code), gap = w.cells.slice(0, r.from).some((x) => x.src === "wait");
        return r.late ? T("nextLate")(n, mo) : gap ? T("nextWait")(mo, n) : T("nextOk")(n, mo) };
      /* best choice: the option whose 12 months put fewer crop months in salty water (estimate); a tie keeps the crop to ripeness */
      const hits = (choice) => { if (!ctx.site) return 0; const w = ctx.card ? Season.windowOf(ctx.card, { ...base, choice }, Season.real()) : null;
        return w ? w.cells.filter((x) => (x.code[0] === "R" || x.code[0] === "U") && level(fieldSalt(ctx.site, x.m, ctx.nino)) === "man").length : lvAt(choice === "early" ? he : hk) === "man" ? 1 : 0 };
      const rec = ctx.site && he && hits("early") < hits("keep") ? "early" : "keep";
      const opt = (v, dt, dis) => `<button type="button" class="nw-o" id="${P}C${v}" data-nw="ch" data-v="${v}" aria-pressed="${ch === v}"${dis ? " disabled" : ""}>
        <span class="nw-ot"><span class="nw-rd" aria-hidden="true"></span><b>${esc(T(v)[k])}</b>${!dis && rec === v ? `<em>${esc(T("rec"))}</em>` : ""}</span>
        <span class="nw-os">${esc(dis ? T("earlyNo")(Season.RIPE_WEEKS) : T(v === "keep" ? "keepS" : "earlyS")[k])}</span>
        ${dt ? `<span class="nw-od">${ic("basket", 16)}<span>${esc(T("hDate")(fD(dt)))}${ctx.site ? ` · ${esc(T("waterAt")(T("lv")[lvAt(dt)]))}` : ""}</span></span>${ctx.card ? `<span class="nw-od">${ic("seed", 16)}<span>${esc(nextOf(v))}</span></span>` : ""}${ctx.card && ctx.site ? (() => { const h = hits(v); return `<span class="nw-od${h ? " bad" : " good"}">${ic(h ? "warn" : "check", 16)}<span>${esc(T("hitsL")(h))}</span></span>` })() : ""}` : ""}</button>`;
      body = `<p class="nw-q" id="${P}LQ">${esc(T("nowLeft"))}</p>
        <div class="nw-step" role="group" aria-labelledby="${P}LQ"><button type="button" class="nw-pm" id="${P}M" data-nw="wk" data-v="-1" aria-label="${esc(T("wkLess"))}"${wk <= 0 ? " disabled" : ""}><span aria-hidden="true">−</span></button>
          <output class="nw-wk" aria-live="polite"><b>${esc(T("wk")(wk))}</b><small>${esc(T("wkAbout")(wk))}</small></output>
          <button type="button" class="nw-pm" id="${P}P" data-nw="wk" data-v="1" aria-label="${esc(T("wkMore"))}"${wk >= WMAX[k] ? " disabled" : ""}><span aria-hidden="true">+</span></button></div>
        <div class="nw-chips" role="group" aria-labelledby="${P}LQ">${WK[k].map((n) => `<button type="button" id="${P}W${n}" data-nw="w" data-v="${n}" aria-pressed="${wk === n}">${esc(T("wk")(n))}</button>`).join("")}</div>
        <p class="nw-q">${esc(T("harvH"))}</p>
        <div class="nw-opts">${opt("keep", hk, false)}${opt("early", he, !eOk)}</div>
        <p class="nw-src">${esc(T(k === "R" ? "nowSrc" : "nowSrc2"))}</p>`;
    } else if (k === "-") body = `<p class="nw-free">${ic("check", 18)}<span>${esc(T("nowFree"))}</span></p>`;
    else if (flow) body = `<p class="nw-src">${esc(T("nowFlow"))}</p>`;
    return `<${H} class="nw-h" id="${P}H">${esc(T("nowQ"))}</${H}><p class="nw-why">${esc(T("nowWhy"))}</p><div class="nw-kinds" role="group" aria-labelledby="${P}H">${kinds}</div>${body}`;
  }
  function nwApply(d0, b) {
    const v = b.dataset.v, t = b.dataset.nw, d = { ...(d0 || {}) };
    if (t === "k") { d.k = v; if (v !== "-") { d.weeks = Math.min(d.weeks == null ? (v === "S" ? 8 : 6) : d.weeks, WMAX[v]); d.choice = d.choice || "keep" } }
    if (t === "wk") d.weeks = Math.max(0, Math.min(WMAX[d.k] || 26, (d.weeks == null ? 6 : d.weeks) + +v));
    if (t === "w") d.weeks = +v;
    if (t === "ch") d.choice = v;
    d.at = Date.now(); if (d.choice === "early" && !Season.earlyOk(d)) d.choice = "keep";
    return d;
  }
  const flowCtx = () => { const A = window.App, s = A && A.site && A.site(); return { site: s ? s.id : null, nino: !!(A && A.mode && A.mode() === "elnino"), card: null } };
  function nowSheet(open) {
    const f = fieldSel(); if (!f) return;
    if (open) shNow = Season.valid(f.now) ? { ...f.now, weeks: Season.growing(f.now) ? Season.weeksLeft(f.now) : 0 } : null;
    sheet(`<div class="nw nw-sheet">${nowForm(shNow, { site: f.site, nino: isNino(f), card: cardOf(f) }, false)}
      <div class="dv-acts"><button type="button" class="btn gold" id="nsSave" data-dv="nwsave"${shNow && shNow.k ? "" : " disabled"}>${ic("check", 16)}<span>${esc(T("nowSave"))}</span></button><button type="button" class="btn" data-dv="close"><span>${esc(T("nowLater"))}</span></button></div></div>`);
  }
  function paintFlowNow(focusId) {
    if (!document.getElementById("nowCrop")) return;
    /* the plan of step 4 is built from this answer: re-draw it too */
    try { window.App && App.refresh && App.refresh() } catch (e) {}
    const el2 = document.getElementById("nowCrop"); if (el2) el2.innerHTML = nowForm(flowNow, flowCtx(), true);
    const b = focusId && document.getElementById(focusId); if (b) b.focus({ preventScroll: true });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-nw]"); if (!b || b.disabled) return;
    if (b.closest("#dvShBody")) { shNow = nwApply(shNow, b); return nowSheet(false) }
    if (b.closest("#nowCrop")) { flowNow = nwApply(flowNow, b); paintFlowNow(b.id) }
  });

  /* ---------- Today ---------- */
  /* a small drawn paddy at the top of the crop card: the sky follows this month's rain (GPM) against crop need (POWER),
     the water turns amber in salty months (estimate), and the plants grow with the season (seedling → tillers → panicle → ripe) */
  function scene(k, frac, wet, salty) {
    const W = 640, G = 84, n = 18, out = [], fx = (v) => v.toFixed(1);
    const sky = wet ? `<g class="sc-cloud"><path d="M422 30a12 12 0 0 1 23-4 9 9 0 0 1 15 7h1a7 7 0 0 1 0 14h-38a9 9 0 0 1-1-17z"/>${[0, 1, 2, 3].map((i) => `<path class="sc-drop" style="--d:${i * .35}s" d="M${430 + i * 9} 52l-2 6"/>`).join("")}</g>`
      : `<g class="sc-sun"><circle cx="440" cy="30" r="11"/>${[...Array(8)].map((_, i) => { const a = (i * Math.PI) / 4; return `<path d="M${fx(440 + 15 * Math.cos(a))} ${fx(30 + 15 * Math.sin(a))}L${fx(440 + 20 * Math.cos(a))} ${fx(30 + 20 * Math.sin(a))}"/>` }).join("")}</g>`;
    for (let i = 0; i < n; i++) {
      const x = 14 + i * ((W - 28) / (n - 1)), d = `style="--d:${(i % 4) * .4}s"`, j = (i % 3) - 1;
      if (k === "R") {
        /* a rice clump: blades arch outward and droop at the tips; panicles bend over as the grain fills */
        const g = Math.min(1, frac), h = (10 + g * 40) * (.9 + .1 * ((i * 7) % 3)), ripe = frac >= .8, nb = g < .25 ? 3 : 5, sp = 5 + g * 9, cls = ripe ? "sc-pl ripe" : "sc-pl";
        let p = ""; for (let b = 0; b < nb; b++) { const t = (b - (nb - 1) / 2) / ((nb - 1) / 2 || 1), dx = t * sp, tip = h * (1 - .28 * Math.abs(t));
          p += `<path d="M${fx(x)} ${G}C${fx(x + dx * .15)} ${fx(G - h * .55)} ${fx(x + dx * .55)} ${fx(G - h * .95)} ${fx(x + dx)} ${fx(G - tip)}"/>` }
        if (frac >= .55) { const bend = ripe ? 9 : 5, top = G - h * 1.02; p += `<path class="sc-pan" d="M${fx(x)} ${fx(G - h * .45)}C${fx(x)} ${fx(top)} ${fx(x + bend * .6)} ${fx(top - 3)} ${fx(x + bend)} ${fx(top + (ripe ? 9 : 4))}"/>` }
        out.push(`<g class="${cls}" ${d}>${p}</g>`);
      } else if (k === "U") { const r = 3 + Math.min(1, frac) * 9;
        out.push(`<g class="sc-pl" ${d}><path d="M${fx(x)} ${G}v${fx(-r)}"/><circle class="sc-bush" cx="${fx(x)}" cy="${fx(G - r - r * .6)}" r="${fx(r)}"/>${frac > .7 ? `<circle class="sc-fruit" cx="${fx(x + r * .4)}" cy="${fx(G - r - r * .3)}" r="2.2"/>` : ""}</g>`);
      } else if (k === "S") { if (i % 2) out.push(`<path class="sc-shrimp" ${d} d="M${fx(x - 6)} ${G - 4 + j * 2}q6 -7 12 0q-4 4 -9 2"/>`) }
      else out.push(`<path class="sc-stub" d="M${fx(x - 3)} ${G}l1 -5M${fx(x)} ${G}v-6M${fx(x + 3)} ${G}l-1 -5"/>`);
    }
    const back = k === "R" ? [...Array(24)].map((_, i) => { const x = 6 + i * 27 + (i % 2) * 6, h = (6 + Math.min(1, frac) * 22) * (.85 + .15 * (i % 3)), sp = 3 + Math.min(1, frac) * 5;
      return `<path d="M${fx(x)} ${G - 7}c${fx(-sp * .2)} ${fx(-h * .6)} ${fx(-sp * .6)} ${fx(-h * .9)} ${fx(-sp)} ${fx(-h * .85)}M${fx(x)} ${G - 7}c0 ${fx(-h * .6)} 0 ${fx(-h * .9)} 1 ${fx(-h)}M${fx(x)} ${G - 7}c${fx(sp * .2)} ${fx(-h * .6)} ${fx(sp * .6)} ${fx(-h * .9)} ${fx(sp)} ${fx(-h * .85)}"/>` }).join("") : "";
    const water = k === "R" || k === "S" ? `<path class="sc-water${salty ? " salty" : ""}" d="M0 ${G - (k === "S" ? 16 : 6)}q20 -3 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0V${G + 4}H0z"/>` : "";
    return `<svg class="hx-scene${wet ? " wet" : " dry"}" viewBox="0 0 ${W} 104" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <rect class="sc-sky" width="${W}" height="104"/>${sky}<path class="sc-hill" d="M0 70q130 -18 270 -6t370 -10V104H0z"/>${back ? `<g class="sc-back${frac >= .8 ? " ripe" : ""}">${back}</g>` : ""}${water}${k === "S" ? out.join("") : ""}
      <path class="sc-soil" d="M0 ${G}q160 -3 320 0t320 0V104H0z"/>${k === "S" ? "" : out.join("")}</svg>`;
  }
  const sceneFor = (f, c, k, frac) => { const s = siteOf(f.site), nino = isNino(f), m = CM, ra = (nino && s.el && s.el.rain) || s.rain || [], ea = (nino && s.el && s.el.et0) || s.et0 || [];
    return scene(k, frac, ra[m] != null && ea[m] != null ? ra[m] >= ea[m] : true, level(fieldSalt(f.site, m, nino)) === "man") };
  function hero(f, c) {
    const d = Season.now(), a = Season.at(c, d);
    if (a.run) {
      const r = a.run, k = r.k, n = runName(c, r.code), mk = Season.marks(r), nx = mk.find((x) => +x.date >= +d), pct = (x) => Math.min(100, Math.max(0, x * 100)).toFixed(1);
      const ticks = mk.map((x) => `<i class="hx-tk${+x.date <= +d ? " past" : ""}" style="left:${pct((x.date - r.sow) / (r.har - r.sow))}%"></i>`).join("");
      const after = c.runs.find((x) => +x.sow > +r.har), gapA = r.to + 1, gapB = after ? after.from - 1 : 11;
      const rest = gapB >= gapA ? T("afterRest")(fRg(c.a0 + gapA, c.a0 + gapB)) : "";
      const then = after ? T("afterL")((rest ? rest + " → " : "") + runName(c, after.code) + (after.late ? ` (${T("lateTag")})` : ""), fDs(after.sow)) : T("afterNone");
      const known = !(r.cur && k !== "R");   /* shrimp or an upland crop already in the field: we know when it ends, not when it began */
      return `<section class="hx hk-${k}" aria-labelledby="hxH">${sceneFor(f, c, k, a.frac)}
        <div class="hx-hd"><h3 id="hxH"><span class="hx-ic" aria-hidden="true">${ic(KI[k], 20)}</span><span>${esc(n)}</span></h3>${known ? `<span class="hx-pill">${esc(T("dayOf")(Math.min(a.day, r.len), r.len))}</span>` : ""}</div>
        <p class="hx-big"><b>${a.left}</b><span>${esc(T("daysTo")[k])}</span></p>
        <div class="hx-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${r.len}" aria-valuenow="${Math.min(a.day, r.len)}" aria-label="${esc(n)}: ${a.left} ${esc(T("daysTo")[k])}"><span class="hx-fill" style="width:${pct(a.frac)}%"></span>${ticks}<span class="hx-dot" style="left:${pct(a.frac)}%"></span></div>
        <p class="hx-ends"><span>${esc(known ? T(k === "S" ? "stockA" : "sowA")(fDs(r.sow)) : T("enteredA")(fDs(r.sow)))}</span><span>${esc(T("harA")(fDs(r.har)))}</span></p>
        ${nx ? `<p class="hx-row">${ic("cal", 18)}<span><small>${esc(T("nextMark"))}</small><b>${esc(T("mk")[nx.k])} · ${esc(fDs(nx.date))}</b></span></p>` : ""}
        <p class="hx-row">${ic("chev", 18)}<span><b>${esc(then)}</b></span></p>
        ${r.cur ? `<button type="button" class="btn hx-edit" data-dv="nownow">${ic("edit", 16)}<span>${esc(T("nowEdit"))}</span></button>` : ""}
        <p class="hx-src">${esc(T("heroSrc"))}</p></section>`;
    }
    const nx = a.next, prev = [...c.runs].reverse().find((x) => +x.har < +d), from = prev ? prev.har : Season.mStart(c.a0), to = nx ? nx.sow : Season.mEnd(c.a0 + 11);
    const frac = Math.min(1, Math.max(0, (d - from) / (to - from || 1))), pct = (frac * 100).toFixed(1);
    return `<section class="hx hk-rest" aria-labelledby="hxH">${sceneFor(f, c, "-", 0)}
      <div class="hx-hd"><h3 id="hxH"><span class="hx-ic" aria-hidden="true">${ic("fallow", 20)}</span><span>${esc(T("heroRest"))}</span></h3></div>
      ${nx ? `<p class="hx-big"><b>${a.wait}</b><span>${esc(T("daysSow")(nx.k, cropName(c, nx.code)))}</span></p>` : `<p class="hx-big sm"><span>${esc(T("restEnd"))}</span></p>`}
      <div class="hx-bar" aria-hidden="true"><span class="hx-fill" style="width:${pct}%"></span><span class="hx-dot" style="left:${pct}%"></span></div>
      <p class="hx-ends"><span>${esc(T("restFrom")(fDs(from)))}</span><span>${nx ? esc(T(nx.k === "S" ? "stockA" : "sowA")(fDs(nx.sow))) : ""}</span></p>
      ${nx && nx.late ? `<p class="hx-row">${ic("seed", 18)}<span><b>${esc(T("lateSow")(runName(c, nx.code)))}</b></span></p>` : ""}
      <p class="hx-src">${esc(T("heroSrc"))}</p></section>`;
  }
  function todo(f, x) {
    const { c } = x, it = [], nino = x.nino, k0 = c.months[CM][0], k1 = c.months[x.nm][0];
    it.push({ i: KI[k0 === "-" ? "-" : k0], when: T("todoNow")(CM + 1), t: x.job, on: 1 });
    it.push({ i: KI[k1 === "-" ? "-" : k1], when: T("todoNext")(x.nm + 1), t: jobAt(c, x.nm) });
    if (x.lv !== "ngot") it.push({ i: "drop", t: T("sgSaltNow"), w: 1 });
    else for (let k = 1; k <= 2; k++) { const m = (CM + k) % 12; if (level(fieldSalt(f.site, m, nino)) !== "ngot") { it.push({ i: "drop", t: T("sgSaltSoon")(m + 1), w: 1 }); break } }
    if (x.clash.length) it.push({ i: "warn", t: T("clash")(x.clash), w: 1, a: "choose", al: T("sgOpen") });
    return `<section class="t-card t-todo" aria-labelledby="tTdH"><h3 class="t-k" id="tTdH">${ic("check", 18)}<span>${esc(T("todoH"))}</span></h3>
      <ul class="t-list">${it.map((y) => `<li class="${y.w ? "w" : ""}${y.on ? " on" : ""}"><span class="t-ti" aria-hidden="true">${ic(y.i, 20)}</span><span class="t-tx">${y.when ? `<small>${esc(y.when)}</small>` : ""}<b>${esc(y.t)}</b>${y.a ? `<button type="button" class="dv-link" data-dv="${y.a}">${esc(y.al)}${ic("chev", 14)}</button>` : ""}</span></li>`).join("")}</ul></section>`;
  }
  function tiles(f, x) {
    const { s, nino } = x, m = CM, rainA = (nino && s.el && s.el.rain) || s.rain || [], et0A = (nino && s.el && s.el.et0) || s.et0 || [], nd = (nino && s.el && s.el.ndvi) || s.ndvi || [];
    const r = rainA[m], e = et0A[m], g = nd[m], short = e != null && r != null ? Math.round(e - r) : null;
    const meter = (p, cls) => `<span class="t-meter ${cls}" aria-hidden="true"><i style="width:${Math.round(Math.min(1, Math.max(0, p)) * 100)}%"></i></span>`;
    const tl = (ico, h, v, u, sub, src, cls, mt) => `<div class="t-tile ${cls || ""}"><span class="t-th"><span class="t-tic" aria-hidden="true">${ic(ico, 14)}</span>${esc(h)}</span><b class="t-tv">${v}<small>${esc(u)}</small></b>${mt || ""}<span class="t-ts">${esc(sub)}</span><span class="t-src">${esc(src)}</span></div>`;
    return `<section class="t-card t-tiles" aria-labelledby="tTlH"><h3 class="t-k" id="tTlH">${ic("drop", 18)}<span>${esc(T("tilesH"))} · ${esc(MLONG(m))}</span></h3>
      <div class="t-grid">${r != null ? tl("drop", T("tRain"), big(r), "mm", short > 0 ? T("tShort")(short) : T("tOk"), "NASA GPM IMERG", short > 0 ? "tc-dry" : "tc-wet", meter(e ? r / e : 1, "m-rain")) : ""}
        ${e != null ? tl("sun", T("tNeed"), big(e), "mm", "ET₀", "NASA POWER", "tc-need", meter(1, "m-sun")) : ""}
        ${g != null ? tl("rice", T("tGreen"), nf(g, 2), "", T("tNd"), "NASA MODIS NDVI", "tc-green", meter(g, "m-green")) : ""}</div>
      <p class="t-note">${esc(T("tAvg")(nino))}</p></section>`;
  }
  /* pests: the same rule as build.py pest_pressure (pest_rule in sites.json, NASA POWER monthly climate), month by month on the plan window */
  function pestAt(f, k, m) {
    const J = typeof SITES_JSON !== "undefined" ? SITES_JSON : null, R = J && J.pest_rule, raw = J && J.sites.find((y) => y.id === f.site);
    if (!R || !raw) return null;
    const cl = (isNino(f) && raw.elnino && raw.elnino.climate) || raw.climate, t = cl.tmean_c[m], pts = R.rice_points;
    if (k === "R" || k === "T") { let p = 0; if (pts[0][0] <= t && t <= pts[pts.length - 1][0]) for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, p0] = pts[i - 1], [t1, p1] = pts[i]; p = p0 + (p1 - p0) * (t - t0) / (t1 - t0); break }
      return { p, t, k: "R" } }
    if (k === "S") { const h = cl.hot_days[m] || 0, c = cl.cold_days[m] || 0; return { p: R.shrimp_floor + (1 - R.shrimp_floor) * Math.min((h + c) / new Date(2001, m + 1, 0).getDate(), 1), h, c, k: "S" } }
    if (k === "U") return { p: R.upland_pressure, k: "U" };
    return { p: 0, k: "-" };
  }
  const pestLv = (p) => (p >= 0.67 ? "hi" : p >= 0.34 ? "mid" : "lo");
  function pestCard(f, x) {
    const { c } = x, cells = c.cells || [], k0 = (c.months[CM] || "-")[0], now = pestAt(f, k0, CM);
    if (!now) return "";
    const lv = pestLv(now.p), why = T("pestWhy")[now.k], whyT = typeof why === "function" ? (now.k === "R" ? why(nf(now.t, 1)) : why(nf(now.h), nf(now.c))) : why;
    const bars = cells.map((cl, i) => { const q = pestAt(f, cl.code[0], cl.m) || { p: 0 }, l = pestLv(q.p);
      return `<span class="pb pl-${cl.code === "-" ? "rest" : l}${i === 0 ? " now" : ""}" title="${esc(MS()[cl.m])}: ${esc(T("pestLv")[l])}"><i style="height:${Math.max(6, Math.round(q.p * 100))}%"></i><small>${esc(MS()[cl.m])}</small></span>` }).join("");
    const brk = cells.filter((cl) => cl.code === "-" || "SU".includes(cl.code[0])).length, sc = c.scores && c.scores.pests;
    return `<section class="t-card t-pest pl-${lv}" aria-labelledby="tPsH"><h3 class="t-k" id="tPsH">${ic("bug", 18)}<span>${esc(T("pestH"))} · ${esc(MLONG(CM))}</span></h3>
      <div class="ps-now"><span class="ps-ic" aria-hidden="true">${ic(KI[now.k] || "bug", 30)}</span><div><b class="ps-lv">${esc(T("pestLv")[lv])}</b><span class="ps-who">${esc(T("pestWho")[now.k])}</span></div>
        <span class="ps-gauge" role="img" aria-label="${esc(T("pestWord")(T("pestLv")[lv]))}"><i class="g-lo"></i><i class="g-mid"></i><i class="g-hi"></i></span></div>
      <p class="ps-why">${esc(whyT)}</p>
      <div class="ps-yr"><span class="ps-yh">${esc(T("pestYr"))}</span><div class="ps-bars" aria-hidden="true">${bars}</div></div>
      ${sc != null || brk ? `<p class="ps-sc">${sc != null ? `<b>${esc(T("pestScore")(nf(sc, 1)))}</b>` : ""}${brk ? `<span>${esc(T("pestBreak")(brk))}</span>` : ""}</p>` : ""}
      <p class="t-note">${esc(T(isNino(f) ? "pestSrcN" : "pestSrc"))}</p></section>`;
  }
  function moneyCard(f, x) {
    const mon = shownMoney(f, x), two = mon && moneyYears(f, x);
    return `<div class="s-card s-money"><span class="s-k">${ic("coin", 18)}${esc(T("moneyH"))}</span>
      ${mon ? `<div class="s-row"><span class="s-coin" aria-hidden="true">${ic("coin", 46)}</span><div><b class="s-num">${mon.per}</b><span class="s-unit">${esc(T("perCong"))}</span></div></div>${two ? two.map((t) => `<span class="s-sub s-yr">${esc(t)}</span>`).join("") : mon.tot ? `<span class="s-sub">${esc(mon.tot)}</span>` : ""}` : `<span class="s-sub">${esc(T("noMoney"))}</span>`}
      <small>${esc(T("moneySrcS"))}</small></div>`;
  }
  function todayPage(f) {
    const x = facts(f), { c } = x;
    const ask = Season.valid(f.now) ? "" : `<section class="t-card t-ask" aria-labelledby="tAkH"><span class="t-aki" aria-hidden="true">${ic("rice", 28)}</span><div><h3 id="tAkH">${esc(T("nowAskH"))}</h3><p>${esc(T("nowAskP"))}</p></div>
      <button type="button" class="btn gold" data-dv="nownow"><span>${esc(T("nowAskB"))}</span>${ic("chev", 16)}</button></section>`;
    return `<div class="t-page"><h2 id="dvH" class="sr">${esc(f.name)} · ${esc(T("navToday"))}</h2>
      <div class="t-chips"><button type="button" class="t-field" data-dv="fields"><span class="t-fi" aria-hidden="true">${ic("pin", 16)}</span><b>${esc(f.name)}</b><span class="t-fs">${esc(f.size ? haS(f.size) + " ha" : short(x.s))}</span>${ic("chev", 14)}</button>
        <span class="t-stat lv-${x.lv}"><i aria-hidden="true"></i>${esc(T("waterW")(T("lv")[x.lv]))}</span></div>
      <p class="t-plan"><span>${esc(T("planL"))}:</span> <b>${esc(L(c.name))}</b></p>
      ${planNo(f)}${ask}<div class="t-cols">${hero(f, c)}${todo(f, x)}
      <div class="s-card s-salt lv-${x.lv}"><span class="s-k">${ic("drop", 18)}${esc(T("waterNow"))}</span>
        <div class="s-row"><span class="s-drop" aria-hidden="true">${ic("drop", 46)}</span><div><b class="s-word">${esc(T("lv")[x.lv])}${adv() ? ` <small>${nf(x.g, 1)}‰</small>` : ""}</b>
        <span class="s-light" aria-hidden="true"><i class="ngot"></i><i class="lo"></i><i class="man"></i></span></div></div>
        <span class="s-sub">${esc(x.sl.txt)}</span><small>${esc(T("est"))}</small></div>
      ${tiles(f, x)}${pestCard(f, x)}${remindCard(f)}${moneyCard(f, x)}</div>
      <button type="button" class="s-card s-cal" data-dv="season"><span class="s-k">${ic("cal", 18)}${esc(T("ribbonH"))}</span>${ribbon(f, c)}<span class="dv-more">${esc(T("tapPlan"))} ${ic("chev", 14)}</span></button>
      <p class="sd-note s-ask">${esc(T("ask"))}</p></div>`;
  }

  /* ---------- Season: the 12 months as a path, done / you are here / coming ---------- */
  function seasonPage(f) {
    const c = planOf(f), d = Season.now(), ni = Season.absOf(d), nino = isNino(f), segs = [];
    c.cells.forEach((x) => { const l = segs[segs.length - 1]; if (l && l.code === x.code && l.src === x.src) l.to = x.i; else segs.push({ code: x.code, src: x.src, from: x.i, to: x.i, miss: x.miss }) });
    const rows = segs.map((g) => {
      const a = c.a0 + g.from, b = c.a0 + g.to, stt = b < ni ? "done" : a <= ni ? "now" : "next", k = g.code === "-" ? "rest" : g.code[0];
      const r = g.code !== "-" && c.runs.find((y) => y.from === g.from), name = g.code === "-" ? T(g.src === "wait" ? "stWait" : "stRest") : runName(c, g.code);
      const sm = []; for (let i = g.from; i <= g.to; i++) { const m = c.cells[i].m; if ((k === "R" || k === "U") && level(fieldSalt(f.site, m, nino)) === "man") sm.push(MNUM(m)) }
      const det = r ? `${esc(T(k === "S" ? "stockA" : "sowA")(fDs(r.sow)))} · ${esc(T("harA")(fDs(r.har)))}` : g.src === "wait" && g.miss ? esc(T("waitWhy")(cropName(c, g.miss))) : "";
      return `<li class="ss-st st-${stt} ssk-${k}"><span class="ss-dot" aria-hidden="true">${stt === "done" ? ic("check", 16) : ic(KI[g.code === "-" ? "-" : g.code[0]], 16)}</span>
        <button type="button" class="ss-card" data-dvm="${c.cells[g.from].m}"><span class="ss-l1"><b>${esc(name)}</b><span class="ss-tag">${esc(T(stt === "done" ? "stDone" : stt === "now" ? "stNow" : "stNext"))}</span></span>
          <span class="ss-when">${esc(fRg(a, b))}</span>${det ? `<span class="ss-det">${det}</span>` : ""}
          ${(r && r.late) || sm.length ? `<span class="ss-tags">${r && r.late ? `<em class="late">${esc(T("lateTag"))}</em>` : ""}${sm.length ? `<em class="salt">${ic("warn", 12)}${esc(T("saltTag")(sm.join(", ")))}</em>` : ""}</span>` : ""}</button></li>`;
    }).join("");
    return `<div class="t-page">
      <header class="ss-hd"><p class="sd-eyebrow">${esc(f.name)} · ${esc(short(siteOf(f.site)))}</p><h2 id="dvH" class="ss-h">${esc(T("seasH"))}</h2><p class="ss-sub"><b>${esc(L(c.name))}</b> · ${esc(fRg(c.a0, c.a0 + 11))}</p></header>
      <p class="sd-note">${esc(T("seasTap"))}</p>
      <ol class="ss-tl">${rows}</ol>
      ${Season.valid(f.now) ? "" : `<button type="button" class="btn gold t-wide" data-dv="nownow">${ic("rice", 18)}<span>${esc(T("nowAskH"))}</span></button>`}
      <div class="t-acts"><button type="button" class="btn" data-dv="plan">${ic("cal", 18)}<span>${esc(T("tableB"))}</span></button>
        <button type="button" class="btn" data-dv="choose">${ic("swap", 18)}<span>${esc(T("change"))}</span></button>
        <button type="button" class="btn" data-dv="paper">${ic("print", 18)}<span>${esc(T("print"))}</span></button></div>
      <p class="sd-src">${esc(T("est"))}</p></div>`;
  }

  /* ---------- Fields: the list, actions and settings ---------- */
  function fieldsPage() {
    const f0 = fieldSel();
    const list = st.fields.map((f) => { const sel = !!(f0 && f.id === f0.id), c = cardOf(f), lv = areaLv(f.site);
      return `<li><button type="button" class="fl-it${sel ? " on" : ""}" data-dvf="${f.id}" aria-pressed="${sel}"><i class="sd-dot lv-${lv}" aria-hidden="true"></i><span class="fl-tx"><b>${esc(f.name)}</b><small>${esc(short(siteOf(f.site)))}${f.size ? " · " + esc(haS(f.size)) + " ha" : ""}</small><small>${esc(L(c.name))}</small></span>${sel ? ic("check", 18) : ic("chev", 16)}</button></li>` }).join("");
    const lang2 = `<div class="dv-setlang"><p class="dv-ml">${esc(T("langH2"))}</p><div class="seg" role="group" aria-label="${esc(T("langH2"))}"><button type="button" data-dvlang="vi" lang="vi" aria-pressed="${lang() === "vi"}">Tiếng Việt</button><button type="button" data-dvlang="en" lang="en" aria-pressed="${lang() === "en"}">English</button></div></div>`;
    return `<div class="t-page">
      <header class="ss-hd"><h2 id="dvH" class="ss-h">${esc(T("fieldsH"))}</h2></header>
      ${st.fields.length ? `<ul class="fl-list">${list}</ul>` : ""}
      <button type="button" class="btn gold t-wide" data-dv="add">${ic("plus", 18)}<span>${esc(T("addShort"))}</span></button>
      ${f0 ? `<section class="t-card" aria-labelledby="flAH"><h3 class="t-k" id="flAH">${ic("pin", 18)}<span>${esc(f0.name)}</span></h3>
        <div class="t-acts g2"><button type="button" class="btn" data-dv="nownow">${ic("rice", 18)}<span>${esc(T("nowEdit"))}</span></button>
          <button type="button" class="btn" data-dv="choose">${ic("swap", 18)}<span>${esc(T("change"))}</span></button>
          <button type="button" class="btn" data-dv="editmap">${ic("edit", 18)}<span>${esc(T("editField"))}</span></button>
          <button type="button" class="btn" data-dv="paper">${ic("print", 18)}<span>${esc(T("print"))}</span></button></div>
        <button type="button" class="btn dv-delrow" data-dv="delask">${ic("trash", 18)}<span>${esc(T("delThis"))}</span></button></section>` : ""}
      <section class="t-card t-set" aria-labelledby="flSH"><h3 class="t-k" id="flSH">${ic("star", 18)}<span>${esc(T("setH"))}</span></h3>${modeSeg("dv-setmode")}${lang2}
        <p class="sd-note"><button type="button" class="dv-link" data-open="sources">${esc(T("srcL"))}</button></p></section></div>`;
  }

  /* ---------- top date bar + bottom bar (made once; only their text and state change) ---------- */
  const NAV = [["dash", "navToday", "home"], ["season", "navSeason", "cal"], ["plan+", "navPlan", "plus"], ["data", "navData", "chart"], ["fields", "navFields", "pin"]];
  const navOf = (v) => (v === "plan" ? "season" : v);
  function paintNav() {
    const nv = $("#dvNav"); if (!nv) return; nv.setAttribute("aria-label", T("navLabel"));
    if (!nv.firstChild) nv.innerHTML = NAV.map(([v, , i]) => v === "plan+" ? `<button type="button" class="nv-b nv-plan" data-dvnav="${v}"><span class="nv-fab" aria-hidden="true">${ic(i, 26)}</span><span class="nv-l"></span></button>` : `<button type="button" class="nv-b" data-dvnav="${v}"><span class="nv-i" aria-hidden="true">${ic(i, 22)}</span><span class="nv-l"></span></button>`).join("");
    const cur = navOf(view), has = !!fieldSel();
    NAV.forEach(([v, k]) => { const b = nv.querySelector(`[data-dvnav="${v}"]`); b.querySelector(".nv-l").textContent = T(k); if (v === cur) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); b.disabled = !has && (v === "season" || v === "data") });
  }
  const PLAY = '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>', PAUSE = '<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="3"/>';
  const hz = () => ([1, 2, 3].includes(st.hz) ? st.hz : 1);
  const hhmm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const wday = (d) => (lang() === "vi" ? ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"][d.getDay()] : d.toLocaleDateString("en-GB", { weekday: "long" }));
  /* the slider track is the season map itself: one block per month for the chosen 1–3 years, coloured by crop, salt marked */
  let mapKey = "";
  function paintMap(f) {
    const box = $("#ckMap"); if (!box) return; const a0 = Season.absOf(Season.real()), n = 12 * hz(), key = `${f.id}|${f.rot}|${JSON.stringify(f.now || null)}|${n}|${lang()}|${a0}|${f.year}|${f.crop}`;
    if (key === mapKey) return; mapKey = key;
    const nino0 = f.year ? f.year === "elnino" : true;
    const ws = [...Array(hz())].map((_, y) => Season.windowOf(cardOf(f, y || !nino0 ? "typical" : "elnino"), f.now, Season.mStart(a0 + 12 * y)));
    const sp = Season.span(hz()), t0 = +sp.from, t1 = +sp.to;
    const pos = (d) => Math.min(100, Math.max(0, ((+d - t0) / (t1 - t0)) * 100));
    box.innerHTML = [...Array(n)].map((_, i) => { const y = Math.floor(i / 12), x = ws[y].cells[i % 12], k = x.code === "-" ? "rest" : x.code[0];
      const s0 = Math.max(t0, +Season.mStart(a0 + i)), s1 = Math.min(t1, +Season.mEnd(a0 + i) + Season.DAY), lv = level(fieldSalt(f.site, x.m, y ? false : nino0));
      return s1 <= s0 ? "" : `<i class="k-${k} s-${lv}${x.m === 0 ? " yr" : ""}" style="left:${pos(s0).toFixed(2)}%;width:${(pos(s1) - pos(s0)).toFixed(2)}%"></i>` }).join("");
    /* year labels under the strip: the start year at the left, then each 1 January */
    const yl = [[t0, new Date(t0).getFullYear()]]; for (let i = 1; i < n; i++) if ((a0 + i) % 12 === 0) yl.push([+Season.mStart(a0 + i), Math.floor((a0 + i) / 12)]);
    if (yl.length > 1 && pos(yl[1][0]) < 16) yl.shift();   /* the start label would touch the next one */
    const yb = $("#ckYrs"); if (yb) yb.innerHTML = yl.map(([t, y]) => `<b style="left:${pos(t).toFixed(2)}%"${pos(t) < 4 ? ' class="first"' : ""}>${y}</b>`).join("");
  }
  function paintClock() {
    const ck = $("#dvClock"); if (!ck) return; const f = fieldSel(); document.body.classList.toggle("dv-noclock", !f); if (!f) return;
    const sp = Season.span(hz()), d = Season.now(), rl = Season.real(), on2 = Season.simOn(), pl = Sim.playing();
    const pb = $("#ckPlay"); pb.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true">${pl ? PAUSE : PLAY}</svg>`; pb.setAttribute("aria-label", pl ? T("clkPause") : T("clkPlay")(hz())); pb.classList.toggle("on", pl);
    $("#ckDate").textContent = fD(on2 ? d : rl);
    $("#ckSub").innerHTML = on2 ? `<span class="ck-tag">${esc(T("clkSim")(Season.yearOf() + 1))}</span><span class="ck-now">${esc(T("clkNow"))} ${hhmm(rl)}</span>` : `<span class="ck-live" aria-hidden="true"></span><span class="ck-nw">${esc(wday(rl))} · ${hhmm(rl)}</span>`;
    const rg = $("#ckRange"); rg.max = sp.weeks; rg.value = Sim.week(); rg.setAttribute("aria-label", T("clkSlider")(hz())); rg.setAttribute("aria-valuetext", fD(d)); ck.style.setProperty("--p", `${((Sim.week() / sp.weeks) * 100).toFixed(2)}%`);
    const rs = $("#ckReset"); rs.hidden = !on2; rs.querySelector("span").textContent = T("clkReset");
    $$("#ckHz [data-hz]").forEach((b) => { b.setAttribute("aria-pressed", +b.dataset.hz === hz()); b.textContent = T("hzL")(+b.dataset.hz) }); $("#ckHz").setAttribute("aria-label", T("hzH"));
    $("#ckNote").textContent = on2 ? T("clkNote")(Season.yearOf() >= 1) : ""; $("#ckNote").hidden = !on2;
    ck.classList.toggle("sim", on2); document.body.classList.toggle("dv-sim", on2); paintMap(f);
  }
  /* the real clock keeps running: the minutes update, and a new day or month re-draws the page */
  let lastDay = Season.real().toDateString();
  setInterval(() => { if (!on) return; try { const r = Season.real(); if (r.toDateString() !== lastDay) { lastDay = r.toDateString(); if (!Season.simOn()) { CM = r.getMonth(); render() } } paintClock() } catch (e) {} }, 15000);
  /* what happens between two dates of the preview: sow, harvest, rice steps, salt coming and going */
  function eventsIn(f, w, a, b) {
    const out = [], inR = (x) => +x > +a && +x <= +b, nino = isNino(f);
    w.runs.forEach((r) => { const n = runName(w, r.code);
      if (!r.cur && !r.ongoing && inR(r.sow)) { if (r.k !== "S" && level(fieldSalt(f.site, r.sow.getMonth(), nino)) === "man") out.push({ t: T("evSowSalt")(n), i: "warn", p: 3, warn: 1 });
        else out.push({ t: T(r.k === "S" ? "evStock" : "evSow")(n) + (r.late ? ` (${T("lateTag")})` : ""), i: "seed", p: 2 }) }
      Season.marks(r).forEach((x) => { if (inR(x.date)) out.push({ t: `${T("mk")[x.k]}: ${n}`, i: "drop", p: 1 }) });
      if (inR(r.har)) out.push({ t: T("evHar")(n), i: "basket", p: 2 }) });
    for (let idx = Season.absOf(a) + 1; idx <= Season.absOf(b); idx++) {
      const m = idx % 12, l0 = level(fieldSalt(f.site, (m + 11) % 12, nino)), l1 = level(fieldSalt(f.site, m, nino)), code = w.months[m];
      if (l1 === "man" && l0 !== "man" && (code[0] === "R" || code[0] === "U")) out.push({ t: T("evSaltHit")(runName(w, code)), i: "warn", p: 3, warn: 1 });
      else if (l1 !== "ngot" && l0 === "ngot") out.push({ t: T("evSaltIn"), i: "drop", p: 2 });
      else if (l1 === "ngot" && l0 !== "ngot") out.push({ t: T("evSaltOut"), i: "drop", p: 1 });
    }
    return out.sort((x, y) => y.p - x.p);
  }
  let flT = 0;
  function flash(ev) {
    const el = $("#ckFlash"); if (!el || !ev.length) return; clearTimeout(flT);
    el.innerHTML = `${ic(ev[0].i, 16)}<span>${esc(ev[0].t)}${ev.length > 1 ? ` <em>+${ev.length - 1}</em>` : ""}</span>`; el.className = `ck-flash on${ev[0].warn ? " warn" : ""}`;
    flT = setTimeout(() => el.classList.remove("on"), ev[0].warn ? 5200 : 2600);
  }
  const Sim = (() => {
    let tm = 0, wk = 0;
    const slow = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches } catch (e) { return false } };
    const win = () => { const f = fieldSel(); return f ? planOf(f) : null };
    function to(k, quiet) {
      const f = fieldSel(), w = win(); if (!w) return null; const sp = Season.span(hz());
      k = Math.max(0, Math.min(sp.weeks, Math.round(k))); const a = Season.now(); wk = k;
      Season.set(k ? new Date(+sp.from + k * Season.WEEK) : null);
      if (quiet) return [];
      /* across a plan-year line both years' seasons count; the same event is said once */
      const w2 = win(), seen = new Set(), ev = eventsIn(f, w, a, Season.now()).concat(w2 && w2.a0 !== w.a0 ? eventsIn(f, w2, a, Season.now()) : []).filter((x) => !seen.has(x.t) && seen.add(x.t)).sort((x, y) => y.p - x.p);
      flash(ev); return ev;
    }
    function tick() { if (!win() || wk >= Season.span(hz()).weeks) return stop(); const ev = to(wk + 1); if (ev && ev.some((x) => x.warn)) stop() }
    /* one week a step; longer previews step a little faster so 3 years still play in about a minute and a half */
    function play() { if (!win()) return; if (wk >= Season.span(hz()).weeks) to(0, true); clearInterval(tm); tm = setInterval(tick, slow() ? 1500 : [0, 650, 500, 420][hz()]); paintClock() }
    function stop() { if (tm) { clearInterval(tm); tm = 0 } paintClock() }
    function reset() { stop(); if (Season.simOn() || wk) { wk = 0; Season.set(null) } const el = $("#ckFlash"); if (el) el.classList.remove("on") }
    return { to, play, stop, reset, playing: () => !!tm, week: () => wk };
  })();
  Season.on((d) => { CM = d.getMonth(); selM = null; if (on) render(); paintClock() });
  document.addEventListener("click", (e) => {
    if (!e.target.closest) return;
    const nb = e.target.closest("[data-dvnav]"); if (nb) { const v = nb.dataset.dvnav; Sim.stop(); if (v === "plan+") return toMap(fieldSel()); return go(v) }
    if (e.target.closest("#ckPlay")) return Sim.playing() ? Sim.stop() : Sim.play();
    if (e.target.closest("#ckReset")) { Sim.reset(); const p = $("#ckPlay"); p && p.focus(); return }
    const hb = e.target.closest("#ckHz [data-hz]"); if (hb) { st.hz = +hb.dataset.hz; save(); const w = Sim.week(), mx = Season.span(hz()).weeks; Sim.stop(); if (w > mx) Sim.to(mx, true); paintClock(); return }
  });
  document.addEventListener("input", (e) => { if (e.target.id === "ckRange") { if (Sim.playing()) Sim.stop(); Sim.to(+e.target.value, false) } });
  /* touching the page pauses the preview, so nothing moves under the farmer's finger */
  ["pointerdown", "wheel", "keydown"].forEach((t) => document.addEventListener(t, (e) => { if (Sim.playing() && e.target.closest && e.target.closest("#dvPanel, #dvNav, #dvSheet")) Sim.stop() }, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", () => { if (document.hidden) Sim.stop() });

  function panelDash() {
    const f = fieldSel();
    if (!f) return `${pageHead()}${welcome()}`;
    return todayPage(f);
  }

  /* ---------------- plan table (in the panel) ---------------- */
  function planTable(f, c) {
    const nino = isNino(f), ML = (i) => (lang() === "vi" ? "Tháng " + (i + 1) : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i]);
    curSite = f.site; curNino = nino;
    return `<table class="dv-table"><thead><tr><th>${esc(T("tMonth"))}</th><th>${esc(T("tJob"))}</th><th>${esc(T("tSalt"))}</th></tr></thead><tbody>${[...Array(12)].map((_, k) => { const m = (W0(c) + k) % 12, code = c.months[m], g = fieldSalt(f.site, m, nino), lv = level(g);
      return `<tr class="${m === CM ? "now" : ""}" data-dvm="${m}" tabindex="0"><th scope="row">${esc(ML(m))}</th><td><span class="dv-tc">${iconOf(code)}${esc(cropName(c, code))}</span>${esc(jobAt(c, m))}</td><td><span class="sd-dot lv-${LVC[lv]}"></span> ${esc(T("lv")[lv])}${adv() ? `<small> ${nf(g, 1)}‰</small>` : ""}</td></tr>` }).join("")}</tbody></table>`;
  }
  function panelPlan() {
    const f = fieldSel(), c = planOf(f), s = siteOf(f.site);
    return `<button type="button" class="dv-link back" data-dv="season">${ic("back", 16)}${esc(T("back"))}</button>
      <p class="sd-eyebrow">${esc(f.name)} · ${esc(short(s))}</p><h2 class="sd-h">${esc(L(c.name))}</h2><p class="sd-lead">${esc(L(c.calendar))}</p>
      <p class="sd-note">${esc(T("tapMonth"))}</p>${planTable(f, c)}<p class="sd-src">${esc(T("est"))}</p>
      <div class="dv-acts"><button type="button" class="btn gold" data-dv="paper">${ic("print", 16)}<span>${esc(T("print"))}</span></button><button type="button" class="btn" data-dv="home">${ic("back", 16)}<span>${esc(T("back"))}</span></button></div>`;
  }
  function monthSheet(m) {
    const f = fieldSel(), c = planOf(f), code = c.months[m], r = code === "-" ? null : DATA.resources[resKey(c, code)], g = fieldSalt(f.site, m, isNino(f)), lv = level(g);
    curSite = f.site; curNino = isNino(f);
    sheet(`<h2>${esc(lang() === "vi" ? "Tháng " + (m + 1) : "Month " + (m + 1))}: ${esc(cropName(c, code))}</h2><p class="dv-job sm">${iconOf(code)}<span>${esc(jobAt(c, m))}</span></p>
      ${r ? `<dl class="dv-dl"><dt>${esc(T("seed"))}</dt><dd>${esc(L(r.seed))}</dd>${r.fertiliser && L(r.fertiliser) ? `<dt>${esc(T("fert"))}</dt><dd>${esc(L(r.fertiliser))}</dd>` : ""}</dl><p class="sd-k">${esc(T("steps"))}</p><ol class="dv-steps">${(r.steps || []).map((x) => `<li>${esc(L(x))}</li>`).join("")}</ol>` : ""}
      <div class="dv-salt"><span class="sd-dot lv-${LVC[lv]}"></span><div><b>${esc(T("lv")[lv])}${code[0] === "R" || code[0] === "U" ? `: ${esc(T("lvD")[lv])}` : ""}</b><small>${esc(T("est"))}</small></div></div>
      <button type="button" class="btn gold dv-full" data-dv="close">${esc(T("close"))}</button>`);
  }

  /* ---------------- print: a 12-month farm calendar on paper, one box per month, icons for every job ---------------- */
  const PW = {
    vi: { title: "Lịch làm ruộng 12 tháng", year: "Cả năm nhìn nhanh", legend: "Ký hiệu", water: "Nước", job: "Việc chính", seed: "Giống", fert: "Phân bón", steps: "Các bước", done: "Đã làm", note: "Ghi chú",
      k: { sow: "Gieo / thả giống", tend: "Chăm sóc", harvest: "Thu hoạch", rest: "Nghỉ đất", wait: "Đo mặn, chờ mưa" }, size: "Diện tích", made: "In ngày", start: "Bắt đầu vụ", tip: "Mỗi tháng làm xong, đánh dấu vào ô ☐. Mang tờ này khi gặp cán bộ khuyến nông.",
      money: "Tiền lời ước tính", fresh: "Nước ngọt", brack: "Hơi mặn", salty: "Mặn" },
    en: { title: "12-month farm calendar", year: "The year at a glance", legend: "Key", water: "Water", job: "Main job", seed: "Seed", fert: "Fertiliser", steps: "Steps", done: "Done", note: "Notes",
      k: { sow: "Sow / stock", tend: "Look after", harvest: "Harvest", rest: "Rest the field", wait: "Measure salt, wait for rain" }, size: "Size", made: "Printed", start: "Season starts", tip: "Tick the box ☐ when a month's work is done. Bring this sheet to your extension officer.",
      money: "Estimated profit", fresh: "Fresh", brack: "Brackish", salty: "Salty" }
  };
  const PI = {
    sow: '<path d="M12 21v-7"/><path d="M12 14c-3 0-5-2-5-5 3 0 5 2 5 5Z"/><path d="M12 14c0-3 2-5 5-5 0 3-2 5-5 5Z"/><path d="M5 21h14"/>',
    tend: '<path d="M7 4v6a5 5 0 0 0 10 0V4"/><path d="M12 15v6M8 21h8"/><path d="M4 8h3M17 8h3"/>',
    harvest: '<path d="M4 11h16l-2 9H6l-2-9Z"/><path d="M8 11 12 4l4 7"/>',
    rest: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    wait: '<path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 10v4.5"/><path d="M12 17.4v.1"/>'
  };
  const pic = (k, n = 22) => `<svg class="pi" viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PI[k] || ICON[k] || ""}</svg>`;
  const pcrop = (code, n = 22) => `<svg class="pi" viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[{ R: "rice", S: "shrimp", U: "upland" }[code[0]] || "fallow"]}</svg>`;
  function jobKind(c, m, site, nino) {
    const code = c.months[m], prev = PV(c, m), next = NX(c, m);
    if (code === "-") return "rest";
    const st0 = prev !== code;
    if (st0 && code[0] !== "S" && level(fieldSalt(site, m, nino)) === "man") return "wait";
    return st0 ? "sow" : next !== code ? "harvest" : "tend";
  }
  function paperHTML() {
    const f = fieldSel(), c = planOf(f), s = siteOf(f.site), nino = isNino(f), P = PW[lang()], d = new Date().toLocaleDateString(lang() === "vi" ? "vi-VN" : "en-GB");
    curSite = f.site; curNino = nino;
    const order = [...Array(12)].map((_, i) => (W0(c) + i) % 12), mon = shownMoney(f, facts(f));
    const lvw = { ngot: P.fresh, lo: P.brack, man: P.salty };
    const strip = order.map((m) => { const code = c.months[m], lv = level(fieldSalt(f.site, m, nino)), k = jobKind(c, m, f.site, nino);
      return `<td class="c-${code[0] === "-" ? "rest" : code[0]}"><b>${MS()[m]}</b>${pcrop(code, 18)}<span class="w ${lv}">${pic("drop", 12)}</span>${pic(k, 14)}</td>` }).join("");
    const boxes = order.map((m) => {
      const code = c.months[m], lv = level(fieldSalt(f.site, m, nino)), k = jobKind(c, m, f.site, nino), start = PV(c, m) !== code && code !== "-";
      const r = start ? DATA.resources[resKey(c, code)] : null;
      return `<section class="mb c-${code[0] === "-" ? "rest" : code[0]}${m === CM ? " now" : ""}">
        <header><span class="mn">${lang() === "vi" ? "Tháng" : "Month"} ${m + 1}</span><span class="cr">${pcrop(code, 20)}${esc(cropName(c, code))}</span><span class="tick">☐ ${esc(P.done)}</span></header>
        <p class="job k-${k}">${pic(k, 26)}<span><small>${esc(P.k[k])}</small><b>${esc(jobAt(c, m))}</b></span></p>
        <p class="wat ${lv}">${pic("drop", 16)}<span>${esc(P.water)}: <b>${esc(lvw[lv])}</b>${code[0] === "R" || code[0] === "U" ? ` · ${esc(T("lvD")[lv])}` : ""}</span></p>
        ${r ? `<div class="res"><p class="st">${pic("sow", 14)}${esc(P.start)}</p><p>${pic("seed", 14)}<b>${esc(P.seed)}:</b> ${esc(L(r.seed))}</p>${r.fertiliser && L(r.fertiliser) ? `<p>${pic("drop", 14)}<b>${esc(P.fert)}:</b> ${esc(L(r.fertiliser))}</p>` : ""}
          ${(r.steps || []).length ? `<ol>${r.steps.map((x) => `<li>${esc(L(x))}</li>`).join("")}</ol>` : ""}</div>` : ""}
        <p class="nt">${esc(P.note)}: ________________________________</p></section>`;
    }).join("");
    return `<div class="paper"><header class="ph"><div><p class="pp-k">${esc(T("brand"))} · Mekong Rotation Explorer</p><h1>${esc(P.title)}</h1>
        <p class="who"><b>${esc(f.name)}</b> · ${esc(L(c.name))}<br>${esc(L(s.name))}${f.size ? ` · ${esc(P.size)} ${nf(f.size, 1)} ha` : ""} · ${esc(P.made)} ${esc(d)}</p></div>
        ${mon ? `<div class="pm">${pic("coin", 22)}<span><small>${esc(P.money)}</small><b>${mon.per}</b> ${esc(T("perCongS"))}${mon.tot ? `<small>${esc(mon.tot)}</small>` : ""}</span></div>` : ""}</header>
      <h2>${esc(P.year)}</h2><table class="strip"><tr>${strip}</tr></table>
      <p class="legend"><b>${esc(P.legend)}:</b> ${["sow", "tend", "harvest", "rest", "wait"].map((k) => `<span>${pic(k, 14)}${esc(P.k[k])}</span>`).join("")}
        <span class="w ngot">${pic("drop", 12)}${esc(P.fresh)}</span><span class="w lo">${pic("drop", 12)}${esc(P.brack)}</span><span class="w man">${pic("drop", 12)}${esc(P.salty)}</span></p>
      <p class="tip">${esc(P.tip)}</p>
      <div class="boxes">${boxes}</div>
      <footer><p>${lang() === "vi" ? "Dữ liệu: NASA GPM IMERG (mưa), NASA POWER (nhiệt độ, nhu cầu nước), NASA MODIS NDVI (số vụ), NOAA (El Niño), SoilGrids (đất). Độ mặn: ước tính từ báo cáo trạm đo công khai, không đo bằng vệ tinh. Giống, phân bón và các bước: tài liệu khuyến nông đã công bố." : "Data: NASA GPM IMERG (rain), NASA POWER (heat, water need), NASA MODIS NDVI (crop count), NOAA (El Niño), SoilGrids (soil). Salinity: estimate from public station reports, not satellite. Seed, fertiliser and steps: published extension guides."}</p><p><b>${esc(T("ask"))}</b></p></footer></div>`;
  }
  const PAPER_CSS = `*{box-sizing:border-box}body{margin:0;background:#fff;color:#1a1a1a;font:13px/1.45 "Be Vietnam Pro",Arial,sans-serif}
.paper{max-width:820px;margin:0 auto;padding:22px}.pi{display:inline-block;vertical-align:-.2em;flex:none}
.ph{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:3px solid #1a1a1a;padding-bottom:10px}
.pp-k{margin:0;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#666}h1{margin:2px 0;font-size:24px}.who{margin:0;color:#333}
.pm{display:flex;gap:8px;align-items:center;padding:8px 12px;border:2px solid #b8860b;border-radius:10px;color:#7a5a00}.pm small{display:block;font-size:10px;color:#666}.pm b{font-size:20px}
h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:14px 0 6px;color:#444}
.strip{width:100%;border-collapse:separate;border-spacing:3px;table-layout:fixed}.strip td{text-align:center;padding:5px 2px;border-radius:6px;border:1px solid #ccc;vertical-align:top}
.strip td b{display:block;font-size:11px}.strip td .pi{display:block;margin:2px auto}
.c-R{background:#eef6e8}.c-S{background:#e8f1f7}.c-U{background:#fbf3e0}.c-rest{background:#f3f3f3}
.w{display:inline-flex;align-items:center;gap:2px}.w.ngot{color:#1f8a4c}.w.lo{color:#b8860b}.w.man{color:#c0392b}
.legend{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;margin:6px 0}.legend span{display:inline-flex;align-items:center;gap:3px}
.tip{margin:4px 0 10px;padding:6px 10px;background:#fff8e1;border-left:4px solid #b8860b;font-size:12px}
.boxes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mb{border:1.5px solid #999;border-radius:10px;padding:8px 10px;break-inside:avoid;page-break-inside:avoid}.mb.now{border:2.5px solid #b8860b}
.mb header{display:flex;align-items:center;gap:8px;border-bottom:1px dashed #bbb;padding-bottom:4px;margin-bottom:6px}
.mn{font-weight:800;font-size:15px}.cr{display:inline-flex;align-items:center;gap:4px;font-weight:600}.tick{margin-left:auto;font-size:12px;color:#444;white-space:nowrap}
.job{display:flex;gap:8px;align-items:flex-start;margin:0 0 4px}.job small{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666}.job b{font-size:13.5px}
.k-wait{color:#c0392b}.k-wait b{color:#c0392b}.k-sow .pi{color:#1f8a4c}.k-harvest .pi{color:#b8860b}.k-rest .pi{color:#777}.k-tend .pi{color:#2c6e9b}
.wat{display:flex;gap:6px;align-items:flex-start;margin:0 0 4px;font-size:12px}.wat.ngot{color:#1f6e3c}.wat.lo{color:#7a5a00}.wat.man{color:#c0392b}
.res{margin:4px 0;padding:6px 8px;background:#f7f7f2;border-radius:8px;font-size:11.5px}.res p{margin:0 0 3px;display:flex;gap:5px;align-items:flex-start}.res .st{font-weight:700;color:#1f8a4c}
.res ol{margin:2px 0 0;padding-left:18px}.res li{margin:1px 0}
.nt{margin:6px 0 0;font-size:11px;color:#888;white-space:nowrap;overflow:hidden}
footer{margin-top:12px;font-size:10.5px;color:#444;border-top:1px solid #999;padding-top:6px}
@media (max-width:600px){.boxes{grid-template-columns:1fr}.paper{padding:12px}.ph{flex-direction:column}}
@media print{.paper{padding:0;max-width:none}@page{size:A4;margin:12mm}.mb.now{border-width:1.5px}}`;
  function paperSheet() {
    Sim.reset();   /* the printed plan is always from today, never from a preview date */
    const doc = `<!doctype html><html><head><meta charset="utf-8"><style>${PAPER_CSS}</style></head><body>${paperHTML()}</body></html>`;
    sheet(`<h2>${esc(T("preview"))}</h2><p class="sd-note">${esc(T("printHint"))}</p><iframe class="paper-frame" title="${esc(T("preview"))}" srcdoc="${esc(doc)}"></iframe>
      <div class="dv-acts"><button type="button" class="btn gold" data-dv="doprint">${ic("print", 16)}<span>${esc(T("doPrint"))}</span></button><button type="button" class="btn" data-dv="savefile"><span>${esc(T("save"))}</span></button></div><p class="sd-note" id="dvSaveMsg" role="status"></p>`, true);
  }
  let dl = null; try { if (window.claude && claude.use) claude.use("downloads").then((x) => (dl = x)).catch(() => {}) } catch (e) {}
  async function saveFile() {
    const f = fieldSel(), name = (f.name || "ruong").replace(/[^\p{L}\p{N}]+/gu, "-") + "-ke-hoach.html";
    const html = `<!doctype html><html lang="${lang()}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(f.name)}</title><style>${PAPER_CSS}</style></head><body>${paperHTML()}<script>setTimeout(function(){try{print()}catch(e){}},700)<\/script></body></html>`;
    const msg = $("#dvSaveMsg");
    if (dl) { try { await dl.save({ filename: name, data: html }); if (msg) msg.textContent = T("saved"); return } catch (e) { if (e && e.code === "declined") return } }
    try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); if (msg) msg.textContent = T("saved") } catch (e) {}
  }

  /* ---------------- change plan / answers ---------------- */
  function whyFit(c, f) {
    const w = weightsOf(f), ks = SK.filter((k) => c.scores[k] != null), tw = ks.reduce((a, k) => a + w[k], 0), pen = c.upland ? PEN[f.wfP ?? 1][f.wfM ?? 0] : 0;
    return `<details class="dv-whyfit"><summary>${esc(T("why"))} ${nf(scoreOf(c, f), 1)}?</summary><pre class="dv-math">${esc(ks.map((k) => `${T("sc")[k].padEnd(15)} ${nf(c.scores[k], 1)} × ${w[k]}`).join("\n") + `\n= ${nf(ks.reduce((a, k) => a + w[k] * c.scores[k], 0), 1)} ÷ ${tw}${pen ? " − " + nf(pen, 1) : ""} = ${nf(scoreOf(c, f), 2)}`)}</pre></details>`;
  }
  function chooseSheet() {
    const f = fieldSel(), r = rank(f), best = r.find((x) => !x.no), cur = r.find((x) => x.c.id === f.rot);
    sheet(`<div class="dv-sheethead"><h2>${esc(T("chooseH"))}</h2><button type="button" class="dv-shx" data-dv="close" aria-label="${esc(T("close"))}">${ic("x", 22)}</button></div><p class="sd-note dv-askline">${esc(T("ask"))}</p>${best && best.c.id !== f.rot && (!cur || nf(best.s, 1) !== nf(cur.s, 1)) ? `<p class="dv-best">${esc(T("bestFor")(L(best.c.name)))}</p>` : ""}<p class="sd-note">${esc(T("chooseP"))}</p>
      <div class="dv-opts-list">${r.map(({ c, s, no }) => `<div class="dv-optc${c.id === f.rot ? " cur" : ""}${no ? " no" : ""}"><div class="dv-optt"><b>${esc(L(c.name))}</b>${no ? `<small class="a-no">${esc(T("notHere"))}</small>` : ""}<small>${esc(L(c.calendar))}</small><span class="sd-chip">${esc(T("fit"))} ${nf(s, 1)}/5</span>${adv() ? whyFit(c, f) : ""}</div>
        ${c.id === f.rot ? `<span class="sd-chip lv-low">${esc(T("current"))}</span>` : `<button type="button" class="btn gold" data-use="${c.id}">${esc(T("use"))}</button>`}</div>`).join("")}</div>`);
  }
  function optsSheet() {
    const f = fieldSel(); if (!f) return;
    const opt = (k, v, cur, txt) => `<button type="button" data-opt="${k}" data-v="${v}" aria-pressed="${cur === v}">${esc(txt)}</button>`, top = rank(f)[0];
    sheet(`<div class="dv-sheethead"><h2>${esc(T("optsH"))}</h2><button type="button" class="dv-deltop" data-dv="delask" aria-label="${esc(T("del"))}: ${esc(f.name)}" title="${esc(T("del"))}">${ic("trash", 20)}</button></div><div class="dv-opts">
      <div class="o-g"><span>${esc(T("seasons"))}</span>${[0, 1, 2].map((i) => `<small>${esc(T("sz")[i])}</small><div class="seg o-seg">${["R", "S", "U", "-"].map((v) => opt("sz" + i, v, (f.seasons || [])[i], T("crop")[v])).join("")}</div>`).join("")}</div>
      <div class="o-g"><span>${esc(T("goal"))}</span><div class="seg o-seg">${Object.keys(GOALS).map((g) => opt("goal", g, f.weights ? "" : f.goal, T("goals")[g])).join("")}</div></div>
      <div class="o-g"><span>${esc(T("people"))}</span><div class="seg o-seg">${[0, 1, 2].map((v) => opt("wfP", String(v), String(f.wfP ?? 1), T("pv")[v])).join("")}</div></div>
      <div class="o-g"><span>${esc(T("machines"))}</span><div class="seg o-seg">${[0, 1, 2].map((v) => opt("wfM", String(v), String(f.wfM ?? 0), T("mv")[v])).join("")}</div></div>
      <label class="o-chk"><input type="checkbox" data-opt="noBrackish" ${f.noBrackish ? "checked" : ""}> ${esc(T("brack"))}</label>
      <div class="o-g"><span>${esc(T("year"))}</span><div class="seg o-seg">${["typical", "elnino"].map((y) => opt("year", y, yr(f), T("years")[y])).join("")}</div></div>
      <label class="o-g"><span>${esc(T("size"))}</span><input type="text" inputmode="decimal" data-opt="size" value="${f.size ? nf(f.size, 2).replace(/[,.]?0+$/, "") : ""}" placeholder="1,5"${sizeErr ? ' aria-invalid="true" aria-describedby="dvSizeErr"' : ""}>${sizeErr ? `<small id="dvSizeErr" class="o-err" role="alert">${esc(sizeErr)}</small>` : ""}</label>
      <label class="o-g"><span>${esc(T("name"))}</span><input type="text" data-opt="name" maxlength="30" value="${esc(f.name)}"></label>
      ${top && top.c.id !== f.rot && !top.no ? `<div class="dv-better"><p>${esc(T("better")(L(top.c.name)))}</p><button type="button" class="btn gold" data-use="${top.c.id}">${esc(T("use"))}</button></div>` : ""}</div>`);
  }
  /* the planner (app.js, "mre-fields", ha) keeps its own copy of the size, read by cost.js: keep the two equal */
  /* the planner's copy of a field: by the saved link, or (older fields) by area and name */
  const appFieldOf = (f, fs) => fs.find((x) => x.id === f.appId) || (!f.appId && fs.find((x) => x.site === f.site && x.name === f.name)) || null;
  function syncSize(f) {
    try { const fs = window.App && App.fields ? App.fields() : [], af = appFieldOf(f, fs);
      if (!af) return; af.ha = f.size || null; localStorage.setItem("mre-fields", JSON.stringify(fs)); if (typeof Cost !== "undefined") Cost.refresh() } catch (e) {}
  }
  function setOpt(k, v) {
    const f = fieldSel(); if (!f) return;
    if (k.startsWith("sz")) { f.seasons = f.seasons || ["R", "R", "R"]; f.seasons[+k.slice(2)] = v }
    else if (k === "goal") { f.goal = v; f.weights = null }
    else if (k === "wfP" || k === "wfM") f[k] = +v;
    else if (k === "year") f.year = v;
    else if (k === "noBrackish") f.noBrackish = !!v;
    else if (k === "size") { const raw = String(v).trim(), n = parseFloat(raw.replace(",", "."));
      if (!raw) { f.size = null; sizeErr = "" } else if (n > 0 && n < 1000) { f.size = n; sizeErr = "" } else { sizeErr = T("sizeErr"); save(); return }   /* keep the old size and say why */
      syncSize(f) }
    else if (k === "name") f.name = String(v).trim() || f.name;
    save();
  }

  /* ---------------- map flow: add / edit a field, save the chosen plan back ---------------- */
  /* phone: a strip under the top bar that says where you are going back to and what to do on the map */
  const backLabel = () => { const b = $("#dvBack"); if (!b) return; const f = editing && st.fields.find((x) => x.id === editing);
    const hint = f ? T("mapEdit").replace("{n}", f.name) : T("mapHint");
    b.innerHTML = `<span class="bm-ic">${ic("back", 18)}</span><span class="bm-tx"><span class="bm-t">${esc(T("toDash"))}</span> <span class="bm-h"><i class="bm-dot" aria-hidden="true"></i><span>${esc(hint)}</span></span></span>` };
  function toMap(field) {
    try { zoomClose() } catch (e) {}
    Sim.reset(); editing = field ? field.id : null; on = false;
    flowNow = field && Season.valid(field.now) ? { ...field.now, weeks: Season.growing(field.now) ? Season.weeksLeft(field.now) : 0, at: Date.now() } : null;
    closeSheet(); document.body.classList.remove("dv-on"); document.body.classList.add("dv-off"); lastSite = null;
    $("#dvBack").hidden = false; backLabel();
    try { if (typeof MapView !== "undefined" && MapView.resize) setTimeout(() => MapView.resize(), 60) } catch (e) {}
    if (field) { const i = sites().findIndex((s) => s.id === field.site), p = $$("path.sg-area")[i]; if (p) setTimeout(() => p.dispatchEvent(new MouseEvent("click", { bubbles: true })), 200) }
    else { try { MapView.select(null); MapView.home() } catch (e) {} }
  }
  function backToDash() {
    on = true; editing = null; lastSite = null; $("#dvBack").hidden = true; document.body.classList.add("dv-on"); document.body.classList.remove("dv-off");
    try { if (window.App && App.closePanel) App.closePanel() } catch (e) {} view = "dash"; mapKey = "";
    if (location.hash) { try { history.replaceState(null, "", location.pathname + location.search) } catch (e) {} }
    render();
  }
  function saveFromMap() {
    const A = window.App; if (!A || !A.site || !A.site()) return;
    const s = A.site(), cur = A.cur ? A.cur() : "rice3", w = A.weights ? A.weights() : null, m = A.mode ? A.mode() : "typical";
    let wf = { p: 1, m: 0 }; try { wf = JSON.parse(localStorage.getItem("mre-wf2") || "null") || wf } catch (e) {}
    const base = editing && st.fields.find((f) => f.id === editing);
    const f = base || { id: "f" + Date.now(), name: T("fieldN")(st.fields.length + 1), size: null };
    /* the name and size the farmer typed in the planner's field form (app.js) */
    try { const af = A.fields && A.fieldId && A.fields().find((x) => x.id === A.fieldId()); if (af) { f.appId = af.id; f.name = af.name || f.name; if (af.ha > 0) f.size = af.ha } } catch (e) {}
    Object.assign(f, { site: s.id, rot: A.planId ? A.planId() : null, weights: w, goal: null, year: m === "elnino" ? "elnino" : null, crop: A.upCrop ? A.upCrop() : null, seasons: SEAS_OF[cur] || ["R", "R", "R"], wfP: wf.p, wfM: wf.m, savedAt: Date.now() });
    if (!f.startAt) f.startAt = Date.now();
    if (flowNow && flowNow.k) f.now = { k: flowNow.k, weeks: flowNow.k === "-" ? 0 : flowNow.weeks, choice: flowNow.choice || "keep", at: Date.now() };
    const nb = document.getElementById("noBrackish"); f.noBrackish = !!(nb && nb.checked);
    if (!f.rot) f.rot = rank(f)[0].c.id;
    if (!base) st.fields.push(f); st.sel = f.id; save();
    try { A.toast && A.toast(T("savedT")) } catch (e) {}
    backToDash();
  }
  /* add the save button to the plan confirmation box of the map flow (#planOk, app.js renderPlan) */
  function hookPlanOk() {
    /* the "about your field" questions come right after the plan box, before the 12-month ring */
    const pr = document.getElementById("d5Pred"), ring = document.getElementById("d5W4");
    if (pr && ring && pr.parentNode === ring.parentNode && (ring.compareDocumentPosition(pr) & Node.DOCUMENT_POSITION_FOLLOWING)) ring.parentNode.insertBefore(pr, ring);
    const foot = document.querySelector("#drawer .d-foot"); if (!foot) return;
    let b = foot.querySelector(".dv-savefield");
    if (!b) { b = document.createElement("button"); b.type = "button"; b.className = "btn gold dv-savefield"; foot.appendChild(b) }
    const lab = editing ? T("updField") : T("saveField"), h = `${ic("plus", 16)}<span>${esc(lab)}</span>`;
    if (b.dataset.l !== lab) { b.innerHTML = h; b.dataset.l = lab }
    const v4 = document.getElementById("v4"), show = !on && !!(v4 && v4.classList.contains("on")) && !!(window.App && App.site && App.site());
    if (b.hidden === show) b.hidden = !show;
    foot.classList.toggle("has-save", show);
    const nx = document.getElementById("dNext"); if (nx) nx.classList.toggle("gold", !show);
  }
  /* ---------------- sheet + render ---------------- */
  let shT = 0;   /* a sheet opened right after another one closed must not be hidden by the old close timer */
  /* a sheet is a real dialog: named by its heading, focus moves in and stays in, and goes back to the opener on close.
     A sheet re-drawn while open (an answer changed) keeps focus on the same control. */
  let shOpener = null;
  const shFocusables = (root) => [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((e) => !e.disabled && e.offsetParent !== null);
  function sheet(html, wide) {
    if (Sim.playing()) Sim.stop(); clearTimeout(shT); const sh = $("#dvSheet"), box = sh.querySelector(".dv-sh"), body = $("#dvShBody"), wasOpen = !sh.hidden && sh.classList.contains("on");
    const a = document.activeElement, inside = !!(a && body.contains(a)), key = inside ? (a.dataset.opt ? `[data-opt="${a.dataset.opt}"]${a.dataset.v != null ? `[data-v="${a.dataset.v}"]` : ""}` : a.id ? `#${a.id}` : a.dataset.dv ? `[data-dv="${a.dataset.dv}"]` : null) : null;
    if (!wasOpen && !inside && a && a !== document.body && !sh.contains(a)) shOpener = a;
    body.innerHTML = html; sh.classList.toggle("wide", !!wide); sh.hidden = false;
    const h = body.querySelector("h2, h3");
    if (h) { h.id = h.id || "dvShH"; h.setAttribute("tabindex", "-1"); box.setAttribute("aria-labelledby", h.id); box.removeAttribute("aria-label") } else { box.removeAttribute("aria-labelledby"); box.setAttribute("aria-label", T("brand")) }
    requestAnimationFrame(() => sh.classList.add("on"));
    setTimeout(() => { const back = key && body.querySelector(key); (back || h || shFocusables(body)[0] || box).focus({ preventScroll: !!back }) }, 0);
  }
  function closeSheet() { const sh = $("#dvSheet"); if (!sh) return; const had = !sh.hidden; sh.classList.remove("on"); clearTimeout(shT); shT = setTimeout(() => (sh.hidden = true), 220);
    if (had && shOpener && document.contains(shOpener) && sh.contains(document.activeElement)) { try { shOpener.focus({ preventScroll: true }) } catch (e) {} } shOpener = null }
  /* Tab stays inside an open sheet */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return; const sh = $("#dvSheet"); if (!sh || sh.hidden) return; const box = sh.querySelector(".dv-sh"), fs = shFocusables(box); if (!fs.length) return;
    const first = fs[0], last = fs[fs.length - 1], a = document.activeElement;
    if (!box.contains(a)) { e.preventDefault(); first.focus(); return }
    if (e.shiftKey && (a === first || a === box.querySelector("#dvShH"))) { e.preventDefault(); last.focus() } else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus() }
  });
  let lastSite = null, lastName = null;
  /* patch: update the panel in place, touching only what changed. Unchanged nodes stay (focus, scroll, typed values and
     running animations such as the swaying rice keep going); changed attributes are set on the same node, so CSS
     transitions (progress bars, colours) glide instead of jumping; a different structure is replaced outright. */
  function patch(live, next, depth) {
    const A = [...live.childNodes], B = [...next.childNodes];
    if (A.length !== B.length || depth > 8) { live.replaceChildren(...B); return }
    for (let i = 0; i < A.length; i++) {
      const x = A[i], y = B[i];
      if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) { live.replaceChild(y, x); continue }
      if (x.nodeType === 3 || x.nodeType === 8) { if (x.data !== y.data) x.data = y.data; continue }
      if (x.nodeType !== 1 || x.isEqualNode(y)) continue;
      for (const at of [...x.attributes]) if (!y.hasAttribute(at.name)) x.removeAttribute(at.name);
      for (const at of [...y.attributes]) if (x.getAttribute(at.name) !== at.value) x.setAttribute(at.name, at.value);
      patch(x, y, depth + 1);
    }
  }
  const tpl = document.createElement("template");
  function setPanel(p, html) {
    if (!p.firstChild) { p.innerHTML = html; return }
    tpl.innerHTML = html; patch(p, tpl.content, 0); tpl.innerHTML = "";
  }
  function render() {
    if (!$("#dv")) return;
    const p = $("#dvPanel"), y = p.scrollTop;
    const f = fieldSel();
    if (!f && view !== "fields") view = "dash";
    setPanel(p, view === "plan" ? panelPlan() : view === "season" ? seasonPage(f) : view === "data" ? `${pageHead()}${fieldTabs()}${advPage(f)}` : view === "fields" ? fieldsPage() : panelDash());
    p.scrollTop = view === "plan" ? 0 : y;
    paintNav(); paintClock();
    document.body.classList.toggle("dv-simple", !adv()); document.body.classList.toggle("dv-nofield", !fieldSel());
    p.classList.toggle("is-adv", view === "data" && !!fieldSel()); p.classList.toggle("is-simple", view !== "data" || !fieldSel()); p.dataset.view = view; document.body.dataset.dvView = view;
    const hn = p.querySelector("#dvH.dv-name"); if (hn) { if (lastName !== null && hn.dataset.k !== lastName) hn.classList.add("in"); lastName = hn.dataset.k }
    const tb = p.querySelector('.dv-ftabs [aria-selected="true"]'); if (tb) { const bar = tb.parentNode; bar.scrollLeft = Math.max(0, tb.offsetLeft - (bar.clientWidth - tb.offsetWidth) / 2) }
  }
  document.addEventListener("change", (e) => { if (e.target.closest && e.target.closest(".dv-fbf")) { const er = document.getElementById("fbErr"); if (er) er.textContent = "" } });
  /* page changes crossfade (View Transitions, where the browser has it and motion is not reduced); otherwise instant */
  function go(v) {
    const changed = v !== view; view = v; closeSheet();   /* the latest tap always wins, even while a crossfade is running */
    const run = () => { render(); $("#dvPanel").scrollTop = 0 };
    if (changed && document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) { const vt = document.startViewTransition(run); [vt.ready, vt.finished, vt.updateCallbackDone].forEach((p) => p && p.catch(() => {})) } else run();   /* a crossfade cut short (window resized) is harmless */
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#dvBack")) return backToDash();
    if (e.target.closest(".dv-savefield")) return saveFromMap();
    if (!e.target.closest("#dv")) return;
    const sel = e.target.closest("[data-dvsel]"); if (sel) return setSel(sel.dataset.dvsel);
    const zc = e.target.closest("[data-dvz]"); if (zc) return zoomClose();
    const zb = e.target.closest("[data-zoomb]"); if (zb) return zoomOpen(zb.dataset.zoomb, zb.closest("[data-zoom]"));
    const zt = e.target.closest("[data-zoom]"); if (zt && !e.target.closest("button, a, input, [data-dvm], [data-use], details")) return zoomOpen(zt.dataset.zoom, zt);
    const a = e.target.closest("[data-dv],[data-dvf],[data-dvui],[data-use],[data-tab],[data-opt],[data-dvm]"); if (!a || a.matches("input")) return;
    const d = a.dataset;
    if (d.dvui) { st.ui = d.dvui; save(); paintModes(); render(); return refocus(`[data-dvui="${d.dvui}"]`) }
    if (d.dvf) { Sim.reset(); st.sel = d.dvf; save(); view = "dash"; selM = null; render(); $("#dvPanel").scrollTop = 0; return refocus(`[data-dvf="${d.dvf}"]`) }
    if (d.use) { const f = fieldSel(); f.rot = d.use; f.savedAt = Date.now(); save(); closeSheet(); render(); if (!zoomKey) $("#dvPanel").scrollTop = 0;
      try { window.App && App.toast && App.toast(T("usedT")(L(cardOf(f).name))) } catch (e) {} if (zoomKey) { const p = $("#dvZP"); p.innerHTML = zoomHTML(f) } return }
    if (d.tab) { tab = d.tab; return render() }
    if (d.opt) { setOpt(d.opt, d.v); render(); return optsSheet() }
    if (d.dvm != null) return monthSheet(+d.dvm);
    switch (d.dv) {
      case "home": return go("dash");
      case "season": return go("season");
      case "fields": return go("fields");
      case "data": return go("data");
      case "nownow": return nowSheet(true);
      case "demo": { if (!st.fields.some((x) => x.demo)) st.fields.push({ id: "fdemo", demo: true, name: T("demoN"), site: "my_xuyen", size: 1.5, seasons: ["R", "R", "R"], rot: "rice3", now: { k: "R", weeks: 6, choice: "keep", at: Date.now() }, startAt: Date.now(), savedAt: Date.now() });
        st.sel = (st.fields.find((x) => x.demo) || st.fields[0]).id; save(); mapKey = ""; go("dash"); return }
      case "nwsave": { const f = fieldSel(); if (!f || !shNow || !shNow.k) return; f.now = { k: shNow.k, weeks: shNow.k === "-" ? 0 : shNow.weeks, choice: shNow.choice || "keep", at: Date.now() }; save(); closeSheet(); mapKey = ""; render(); try { window.App && App.toast && App.toast(T("nowSaved")) } catch (e) {} return }
      case "plan": return go("plan");
      case "add": return toMap(null);
      case "editmap": return toMap(fieldSel());
      case "paper": return paperSheet();
      case "choose": return chooseSheet();
      case "opts": return optsSheet();
      case "close": return closeSheet();
      case "savefile": return saveFile();
      case "doprint": { Sim.reset(); const w = document.createElement("iframe"); w.style.cssText = "position:fixed;width:0;height:0;border:0"; document.body.appendChild(w); w.srcdoc = `<html><head><meta charset="utf-8"><style>${PAPER_CSS}</style></head><body>${paperHTML()}</body></html>`; w.onload = () => { try { w.contentWindow.print() } catch (er) { saveFile() } setTimeout(() => w.remove(), 4000) }; return }
      case "delask": { const f = fieldSel(); if (!f) return; sheet(`<div class="dv-delq"><span class="dv-delico">${ic("trash", 30)}</span><h2>${esc(T("delH")(f.name))}</h2><p class="sd-note">${esc(T("delP"))}</p>
        <div class="dv-acts"><button type="button" class="btn dv-delyes" data-dv="del">${ic("trash", 16)}<span>${esc(T("delYes"))}</span></button><button type="button" class="btn gold" data-dv="close"><span>${esc(T("cancel"))}</span></button></div></div>`); return }
      case "del": { const f = fieldSel(); if (f) { st.fields = st.fields.filter((x) => x.id !== f.id);
        try { const af = window.App && App.fields && appFieldOf(f, App.fields()); if (af && App.removeField) App.removeField(af.id, true) } catch (e) {}   /* the planner list too */ st.sel = st.fields[0] ? st.fields[0].id : null; selM = null; save(); closeSheet(); try { zoomClose() } catch (e) {} render(); refocus("#dvH"); try { window.App && App.toast && App.toast(T("deleted")) } catch (e) {} } return }
    }
  });
  const multiOf = (f) => { const Y = yearsOf(f); f.multi = { n: Y.n, yrs: Y.yrs }; return f.multi };
  document.addEventListener("change", (e) => { const s = e.target.closest && e.target.closest("#dv [data-dvyr]"); if (!s) return; const f = fieldSel(); if (!f) return; multiOf(f).yrs[+s.dataset.dvyr].rot = s.value; save(); render(); const n = $(`#dv [data-dvyr="${s.dataset.dvyr}"]`); if (n) n.focus({ preventScroll: true }) });
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("#dv [data-dvyn], #dv [data-dvyt]"); if (!b) return; const f = fieldSel(); if (!f) return; const m = multiOf(f);
    if (b.dataset.dvyn) { m.n = +b.dataset.dvyn; const Y = yearsOf(f); m.yrs = Y.yrs } else { const [i, t] = b.dataset.dvyt.split(":"); m.yrs[+i].yr = t }
    save(); render(); const q = b.dataset.dvyn ? `[data-dvyn="${b.dataset.dvyn}"]` : `[data-dvyt="${b.dataset.dvyt}"]`, n = $(`#dv ${q}`); if (n) n.focus({ preventScroll: true }) });
  document.addEventListener("change", (e) => { const i = e.target.closest("#dv [data-opt]"); if (!i) return; setOpt(i.dataset.opt, i.type === "checkbox" ? i.checked : i.value); render(); optsSheet() });
  document.addEventListener("keydown", (e) => {
    const sh = $("#dvSheet"); if (e.key === "Escape" && sh && !sh.hidden) return closeSheet();
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("#dv [data-zoom], #dv tr[data-dvsel]")) { e.preventDefault(); if (e.target.dataset.zoom) zoomOpen(e.target.dataset.zoom, e.target); else setSel(e.target.dataset.dvsel); return }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("#dv .dv-hero, #dv tr[data-dvm]")) { e.preventDefault(); e.target.click() }
  });
  /* top-bar language buttons re-draw the panel; the brand (MEKONG) goes back to the dashboard */
  document.addEventListener("click", (e) => { if (e.target.closest("#lEn, #lVi")) setTimeout(() => { render(); backLabel() }, 30) });
  document.addEventListener("click", (e) => { if (e.target.closest("#brand") && $("#dv")) { e.preventDefault(); e.stopPropagation(); backToDash() } }, true);

  /* one Simple / Advanced switch for the whole app: dashboard, Settings and the planner drawer */
  const modeSeg = (cls) => `<div class="${cls}"><p class="dv-ml">${esc(T("modeH"))}</p><div class="seg" role="group" aria-label="${esc(T("modeH"))}"><button type="button" data-dvmode="simple" aria-pressed="${!adv()}">${esc(T("simple"))}</button><button type="button" data-dvmode="advanced" aria-pressed="${adv()}">${esc(T("adv"))}</button></div><p class="dv-mh">${esc(adv() ? T("modeA") : T("modeS"))}</p></div>`;
  function paintModes() {
    /* the switches below are rebuilt (also by the watcher further down): keep keyboard focus on the one in use */
    const af = document.activeElement, box = af && af.closest && af.closest("#uiSw, #uiSeg, .dv-setmode");
    const back = !box ? null : af.id ? "#" + af.id : `${box.id ? "#" + box.id : ".dv-setmode"} [data-dvmode="${af.dataset.dvmode}"]`;
    const sb = document.getElementById("setBody");
    if (sb) { let x = sb.querySelector(".dv-setmode"); const h = modeSeg("dv-setmode"); if (!x) sb.insertAdjacentHTML("afterbegin", h); else x.outerHTML = h;
      const lg = sb.querySelector(".dv-setlang"), lh = `<div class="dv-setlang"><p class="dv-ml">${esc(T("langH"))}</p><div class="seg" role="group" aria-label="${esc(T("langH"))}"><button type="button" data-dvlang="vi" lang="vi" aria-pressed="${lang() === "vi"}">Tiếng Việt</button><button type="button" data-dvlang="en" lang="en" aria-pressed="${lang() === "en"}">English</button></div></div>`;
      if (lg) lg.outerHTML = lh; else sb.querySelector(".dv-setmode").insertAdjacentHTML("afterend", lh) }
    /* the switch lives in the top bar, next to EN / VI; the old copy inside the planner drawer is removed */
    const db = document.querySelector("#drawer .d-body"), old = db && db.querySelector(":scope > .dv-modebar"); if (old) old.remove();
    const tools = document.querySelector("#topbar .tools, .tools"), ls = document.getElementById("langSeg");
    if (tools && ls) { const h = `<div class="seg" id="uiSeg" role="group" aria-label="${esc(T("modeH"))}"><button type="button" data-dvmode="simple" aria-pressed="${!adv()}">${esc(T("simple"))}</button><button type="button" data-dvmode="advanced" aria-pressed="${adv()}">${esc(T("adv"))}</button></div><button type="button" id="uiSw" role="switch" aria-checked="${adv()}" data-dvmode="${adv() ? "simple" : "advanced"}"><span>${esc(T("adv"))}</span><i aria-hidden="true"></i></button>`;
      const sw = document.getElementById("uiSw"); if (sw) sw.remove();
      const x = document.getElementById("uiSeg"); if (x) x.outerHTML = h; else ls.insertAdjacentHTML("afterend", h) }
    document.body.classList.toggle("dv-simple", !adv()); document.body.classList.toggle("dv-adv", adv());
    /* the planner (app.js) has its own detail switch: keep it the same, so Simple really shows less in the rotation cards */
    try { if (window.App && App.setUi) App.setUi(adv() ? "advanced" : "simple"); if (typeof Cost !== "undefined") Cost.cards() } catch (e) {}
    if (back) refocus(back);
  }
  /* render() and paintModes() rebuild the clicked control: put keyboard focus back on its new copy (or a heading) */
  function refocus(sel) { const n = $(sel); if (!n) return; if (n.matches("h1,h2,h3")) n.tabIndex = -1; try { n.focus({ preventScroll: true }) } catch (e) {} }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-dvmode]"); if (!b) return; st.ui = b.dataset.dvmode; save(); paintModes(); render() });
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-dvlang]"); if (!b) return; const t = document.getElementById(b.dataset.dvlang === "en" ? "lEn" : "lVi"); if (t) t.click() });
  window.addEventListener("keydown", (e) => { const zz = $("#dvZoom"), sh = $("#dvSheet"); if (e.key === "Escape" && zz && !zz.hidden && (!sh || sh.hidden)) { e.preventDefault(); e.stopPropagation(); zoomClose() } }, true);
  function init() {
    shell();
    setTimeout(paintModes, 0); document.addEventListener("click", (e) => { if (e.target.closest("#lEn, #lVi, #gearBtn")) setTimeout(paintModes, 40) });
    /* Settings and the drawer are re-drawn by app.js: put the switch back whenever it goes missing */
    let mq = 0; new MutationObserver(() => { if (mq) return; mq = setTimeout(() => { mq = 0; const sb = document.getElementById("setBody"), db = document.querySelector("#drawer .d-body");
      if ((sb && !sb.querySelector(".dv-setmode")) || (db && db.querySelector(":scope > .dv-modebar")) || !document.getElementById("uiSeg")) paintModes() }, 50) }).observe(document.body, { childList: true, subtree: true });
    let hq = 0; new MutationObserver(() => { if (!hq) hq = setTimeout(() => { hq = 0; hookPlanOk() }, 30) }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    document.body.classList.toggle("dv-simple", !adv());
    if (location.hash === "#plan-lab") { document.body.classList.remove("dv-on"); document.body.classList.add("dv-off"); $("#dvBack").hidden = false; backLabel(); return }
    importPlanner(); on = true; document.body.classList.add("dv-on"); render();
    const ck = $("#dvClock"), setH = () => document.documentElement.style.setProperty("--ck-h", `${ck && !document.body.classList.contains("dv-noclock") ? ck.offsetHeight : 0}px`);
    try { new ResizeObserver(setH).observe(ck) } catch (e) {} setH(); new MutationObserver(setH).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
  /* fields saved only in the planner list (app.js "mre-fields") also appear here, so the dashboard is never empty by mistake;
     their plan is the rotation they grow now (the planner's season boxes) until the farmer picks another */
  function importPlanner() {
    let afs = []; try { afs = (window.App && App.fields && App.fields()) || [] } catch (e) {}
    let n = 0;
    afs.forEach((a) => {
      if (!a || !a.site || !sites().some((x) => x.id === a.site) || st.fields.some((f) => f.appId === a.id || (!f.appId && f.site === a.site && f.name === a.name))) return;
      const f = { id: "f" + a.id, appId: a.id, name: a.name || T("fieldN")(st.fields.length + 1), size: a.ha > 0 ? a.ha : null, site: a.site, seasons: Array.isArray(a.seasons) ? a.seasons : SEAS_OF[a.cur] || ["R", "R", "R"], startAt: Date.now(), savedAt: Date.now() };
      const cs = cardsFor(siteOf(a.site), "typical", null); f.rot = cs.some((c) => c.id === a.cur) ? a.cur : rank(f)[0].c.id;
      st.fields.push(f); n++;
    });
    if (n) { if (!st.fields.some((f) => f.id === st.sel)) st.sel = st.fields[0].id; save() }
  }
  /* a field deleted in the planner list leaves the dashboard too */
  function unlink(id, site, name) {
    const n = st.fields.length; st.fields = st.fields.filter((f) => !(f.appId === id || (!f.appId && f.site === site && f.name === name)));
    if (st.fields.length === n) return; if (!st.fields.some((f) => f.id === st.sel)) st.sel = st.fields[0] ? st.fields[0].id : null; selM = null; save(); render();
  }
  /* a field edited in the planner form: same name, area and size here */
  function syncField(af, old) {
    let ch = false;
    st.fields.forEach((f) => { if (f.appId === af.id || (!f.appId && f.site === old.site && f.name === old.name)) { f.appId = af.id; f.name = af.name; f.site = af.site; f.size = af.ha || null; ch = true } });
    if (ch) { save(); render() }
  }
  /* the create-plan flow (app.js) asks the same "what is in the field now" question and builds its plan from the answer */
  const nowBlock = () => `<section id="nowCrop" class="nw nw-flow" aria-labelledby="nfH">${nowForm(flowNow, flowCtx(), true)}</section>`;
  /* the map lies under the dashboard: while the dashboard is on, it is inert, so keyboard and screen-reader focus never
     lands on pins and zoom buttons nobody can see (home.js uses its own marker, so the two never undo each other) */
  function syncInert() {
    const on = document.body.classList.contains("dv-on");
    ["map", "fx", "mapKey", "d5Month"].forEach((id) => { const n = document.getElementById(id); if (!n) return;
      if (on) { if (!n.inert) { n.inert = true; n.dataset.dvInert = "1" } } else if (n.dataset.dvInert) { n.inert = false; delete n.dataset.dvInert } });
  }
  new MutationObserver(syncInert).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  syncInert();
  /* step out of the dashboard to the map, like "add" (the Việt Nam button, vnbtn.js / vn.js) */
  function showMap() { if (on) toMap(null); }
  return { init, render, unlink, syncField, nowBlock, showMap, flowNow: () => flowNow, get state() { return st } };
})();
if (document.readyState === "loading" || AppReady.waiting()) AppReady.on(() => setTimeout(Dash.init, 0)); else setTimeout(Dash.init, 0);
