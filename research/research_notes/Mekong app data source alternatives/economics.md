# Economics data sources: crop profits, prices and production costs (Mekong Delta)

Searched 22 Nov 2026. "Checked live" means I called the URL or API from the sandbox and saw the data. Everything else comes from search results or a fetched page and is cited. Earlier work in this repo (`research/profit-shrimp-mungbean.md`) already covers news, extension and university profit figures for shrimp, rice on shrimp land and mung bean. These notes do not repeat it.

## Systematic cost/return surveys (GSO/NSO, MARD/MAE, IPSARD, CTU/IRRI datasets, Agricultural Census)

### Takeaway
I found no free, machine-readable, survey-based cost-and-return table for Mekong Delta crops by season for 2025–2026. NSO publishes agricultural producer price indices, and these are quarterly indices, not costs or profits. The best survey-based profit figures are still single papers, such as Cần Thơ University journal articles with household samples. A 2019 IRRI household survey with cost and return data is listed on Harvard Dataverse (225 observations, Mekong and Red River Deltas). The RWI Vietnam Rice Farmer Panel (about 3,000 households, 2024–2026) is the most promising new systematic source, but its public page does not show that it has cost data or open access.

### Cited Findings
- NSO's "Chỉ số giá sản xuất nông nghiệp, lâm nghiệp và thủy sản" tracks the prices that producers get when they sell their own products. It is a Laspeyres index weighted by production value. Its data come from NSO's agricultural, forestry and fisheries producer price survey, published quarterly and yearly, broken down by industry and by province. — [NSO, chỉ số giá sản xuất nông nghiệp (metadata)](https://www.nso.gov.vn/?p=16938); index pages under [nso.gov.vn/gia](https://www.nso.gov.vn/gia/)
- NSO's rice yield survey form records farmers' paddy sales revenue and the quantity sold at the field (dry weight). Farm-gate paddy prices are therefore collected at the household level, but I found no published table of them. — [Giải thích phiếu điều tra năng suất lúa (Đồng Nai/Bình Phước statistics office)](https://new.dongnai.gov.vn/uploads/binhphuoc/ctk/2019_06/nongnghiep/caylua/3giai-thich-phieu.pdf)
- According to AGRIS, Harvard Dataverse holds a 2019 IRRI-provided "Vietnam Household Survey" from a USAID low-emission rice project. It includes household-level cost and return data for rice, focuses on alternate wetting and drying, and has 225 observations across the Mekong and Red River Deltas. — [AGRIS record](https://agris.fao.org/search/en/records/6878f0445d9ad5f58d608b02)
- RWI Essen's Vietnam Rice Farmer Panel Survey covers about 3,000 rice-farming households in 200 villages in four inland Mekong Delta provinces, with waves in 2024, 2025 and 2026. It covers farm activities and yields. The page does not clearly say whether it has production-cost data. — [RWI VRFPS](https://www.rwi-essen.de/VRFPS)
- An example of a survey-based university figure: Cần Thơ University journal vol. 61 no. 5B (2025), Long Mỹ, Hậu Giang (Vĩnh Viễn A commune), random survey of 60 rice households on acid sulfate soil. The two-crop model averaged 6.22 t/ha and a profit of 31,026,375 đ/ha (ROI 2.03). The three-crop model averaged 5.70 t/ha and 30,252,147 đ/ha, with no significant difference. — [Tất Anh Thư et al., CTU J. Sci. 2025, DOI 10.22144/ctujos.2025.147](https://ctujsvn.ctu.edu.vn/index.php/ctujsvn/article/download/7025/5153/33034) (PDF read; numbers from the abstract and the results table)
- Cục Trồng trọt reported the 2025–26 Mekong Delta winter–spring crop as largely harvested: over 1.2 million ha at about 7.4 t/ha. The search did not find a per-hectare cost or profit figure from the department for that season. — search summary of [nongnghiepmoitruong.vn, "thị trường lúa gạo hồi phục"](https://nongnghiepmoitruong.vn/thi-truong-lua-gao-hoi-phuc-d802617.html) and related articles (Cloudflare blocks the site from the sandbox, so I could not read it directly)
- MAE summary for summer–autumn 2025 pilot low-emission rice models: profit of 14.5–36.3 M₫/ha. Cần Thơ low-emission model: about 30 M₫/ha. Kiên Giang pilot: 55.5 M₫/ha. — [Đại Đoàn Kết](https://daidoanket.vn/lam-lua-phat-thai-thap-vu-he-thu-nong-dan-loi-nhuan-len-den-36-3-trieu-dong-ha.html); [VOV, Kiên Giang 55.5 M₫/ha](https://vov.vn/kinh-te/kien-giang-thi-diem-canh-tac-lua-giam-phat-thai-loi-nhuan-555-trieu-dongha-post1188014.vov); [nongnghiepmoitruong.vn, Cần Thơ 30 M₫/ha](https://nongnghiepmoitruong.vn/lua-giam-phat-thai-vu-dong-xuan-o-can-tho-loi-nhuan-30-trieu-dong-ha-d421161.html) (search snippets only)

### Inferences
- MAE's seasonal "giá thành" (cost per kg) and profit statements for the Delta reach the public mostly as quotes in Báo Nông nghiệp & Môi trường. That site blocks the sandbox, so these figures cannot be scraped and would have to be added by hand.
- The 1-million-ha low-emission rice programme figures come from demonstration plots, not random household samples. They are likely biased upward compared with ordinary fields, so if they are added, they should be marked as a separate kind ("pilot").
- The NSO producer price index is quarterly, national or provincial, and an index (not đ/kg). It could at most scale a base-year price. It cannot give an absolute farm-gate price.

### Gaps
- I did not find whether GSO/NSO publishes a crop cost-of-production survey ("điều tra chi phí sản xuất") or VHLSS agricultural-module tables with cost per ha by crop. VHLSS microdata usually need a request, and I did not verify that.
- IPSARD farm budget data: not searched within the tool budget. No source found.
- AgroMonitor: not checked. It is understood to be a paid service, but that is unverified.
- 2016 Agricultural Census / 2025 mid-term census: not checked. Census data give areas and holdings, not profits.
- The IRRI Dataverse record's licence, variable list and DOI were not opened.

## Price series (FAO FPMA, VFA, World Bank Pink Sheet, VASEP, AGROINFO, provincial price bulletins)

### Takeaway
The best machine-readable, Delta-specific, current series is FAO FPMA. It has wholesale milled-rice prices in VND/kg for Bạc Liêu, An Giang and Đồng Tháp (5% and 25% broken), weekly and monthly, through 12 Nov 2026, from a free JSON API (checked live), with the Vietnam Food Association as the source. No FPMA series is paddy (lúa) or farm-gate. VFA's own website gives weekly national paddy prices ("lúa thường", "lúa thơm", đ/kg, highest and average), but only as HTML and with no province breakdown. The World Bank Pink Sheet gives monthly export FOB "Rice, Viet Namese 5%" in $/t, plus urea, DAP and KCl (checked live). VASEP posts occasional Cà Mau tôm sú pond prices by size, which are not a regular, machine-readable series.

### Cited Findings
- **FAO FPMA API (checked live, 22 Nov 2026):** `https://fpma.fao.org/giews/v4/global/price_module/api/v1/FpmaSerieDomestic/?iso3_country_code=VNM&format=json` (the old path `/giews/v4/price_module/...` returns a 307 redirect to this one). It lists 8 Viet Nam series, all WHOLESALE, in VND per kg:
  - Rice (5% broken): Bạc Liêu, An Giang, Đồng Tháp. Weekly from 26 Oct 2018 to 12 Nov 2026, with monthly averages calculated by FPMA.
  - Rice (25% broken): Bạc Liêu (from Oct 2018), An Giang and Đồng Tháp (from Jan 2008). All run to 12 Nov 2026.
  - Rice (20% broken): An Giang and Đồng Tháp, both discontinued (2019 and 2018).
  - Prices are fetched per series at `.../FpmaSeriePrice/<uuid>/?format=json`. Each datapoint has `price_value`, `price_value_real`, `price_value_dollar`, `date` and `periodicity`, newest first.
  - Example: the Bạc Liêu 5% broken series (uuid 756c8234-…) shows monthly values of 12,000 (Nov 2026), 10,970 (Oct) and 10,550 (Sep) VND/kg, and 12,650 VND/kg in the week of 12 Nov 2026.
  - Series metadata: `source_name` "Vietnam Food Association", `source_url` https://vietfood.org.vn/thi-truong/gia-noi-dia/, `market_type` "Retail". — [FPMA API](https://fpma.fao.org/giews/v4/global/price_module/api/v1/FpmaSerieDomestic/?iso3_country_code=VNM&format=json)
- **FAO GIEWS country brief for Viet Nam:** the latest brief in the results has a reference date of 26 Feb 2026 and points to FPMA for prices. An October 2025 brief said domestic wholesale rice prices fell from Aug 2024 to Sep 2025. — [GIEWS country brief VNM](https://www.fao.org/giews/countrybrief/country.jsp?code=VNM&lang=en); [archive PDF](https://cb.apps.fao.org/country/VNM/pdf_archive/VNM_Archive.pdf)
- **VFA domestic prices:** an HTML table, weekly, national only, in đ/kg, with highest price, average price and change from the previous week. Bulletin of 05–12 Nov 2026: lúa thơm highest 8,000, average 7,793 (+500); lúa thường highest 7,250, average 6,879 (+343). The table also covers brown rice, white rice, broken rice and bran. No province rows. — [VFA giá nội địa](https://vietfood.org.vn/thi-truong/gia-noi-dia/) (read with WebFetch; the direct curl failed at the proxy)
- **World Bank Pink Sheet monthly workbook (checked live):** CMO-Historical-Data-Monthly.xlsx, sheet "Monthly Prices", has the columns "Rice, Viet Namese 5%" ($/mt), "Rice, Thai 5%", "Maize", "Urea", "DAP", "Potassium chloride" and "Shrimps, Mexican". The copy I downloaded ends at 2025M12, when Viet 5% was 351.91 $/mt, urea 392.5, DAP 627.5 and KCl 358.33. The file URL contains a release-specific hash (`thedocs.worldbank.org/en/doc/18675f1d…-0050012025/related/CMO-Historical-Data-Monthly.xlsx`), so a pipeline should take the current link from the Pink Sheet page. — [World Bank Commodity Markets](https://www.worldbank.org/en/research/commodity-markets)
- Third-party mirrors report Viet 5% at 391.3 $/t (Jun 2026) and 396.1 $/t (Jul 2026). One mirror describes the price as an FOB Hanoi indicative price. — [Cbonds index 154100](https://cbonds.com/indexes/154100/); [Wikifarmer](https://wikifarmer.com/library/en/article/thai-vietnamese-rice-price-gap)
- **VASEP raw shrimp prices:** an article dated 26 Nov 2025 gives late-Oct 2025 Cà Mau prices: tôm sú 20 con/kg 275,000 đ/kg; tôm sú 30 con/kg 152,000 (−8,000); whiteleg 20 con/kg 250,000. It names no data source, and there are no Sóc Trăng or Bạc Liêu prices. — [VASEP seafood](https://seafood.vasep.com.vn/amp/raw-shrimp-prices-remain-stable-slight-declines-in-some-sizes-at-the-end-of-october-2025-35326.html)
- A news report (4 Aug 2026) said whiteleg shrimp pond prices in the Mekong Delta had fallen 10–25% since the start of the year. — [Tuổi Trẻ, nuôi tôm](https://tuoitre.vn/nuoi-tom.html) (search snippet)
- Tridge lists Đồng Tháp among its rice price regions, but it is a third-party aggregator and its latest dated entry was Jan 2025. — [Tridge](https://dir.tridge.com/prices/product-country/rice-vietnam)
- USDA FAS publishes "Vietnam: Rice Weekly Update" reports (PDF narrative with prices). — [USDA FAS](https://www.fas.usda.gov/data/vietnam-rice-weekly-update-4)

### Inferences
- No source found gives a monthly, machine-readable, farm-gate paddy price for a Mekong Delta province. The closest usable option is the FPMA Bạc Liêu 25% broken wholesale series, a neighbour of Sóc Trăng, available monthly since Oct 2018 and free as JSON. It could be turned into an approximate paddy price with a milling ratio. That conversion would be a model, and the app would have to label it as such.
- The VFA weekly national paddy average (lúa thường/lúa thơm) is the closest to farm-gate. Its archive pages could be scraped into a weekly series, and it is the same upstream source that FPMA uses.
- The Pink Sheet export price moves with world markets. It is too far from farm-gate to drive farmers' profits directly, but it is stable, free and monthly, and works as a market indicator.
- For shrimp, I found no regular machine-readable farm-gate series for tôm sú or tôm càng xanh in Sóc Trăng.

### Gaps
- MARD/MAE AGROINFO daily prices (agro.gov.vn) and the provincial Department of Industry and Trade price bulletins for Cần Thơ and Sóc Trăng were not reached within the tool budget. `*.soctrang.gov.vn` is unreachable from the sandbox (per CLAUDE.md).
- I did not check whether VFA provides an archive download or older bulletins by URL pattern.
- The FPMA licence was not checked. FAO data are generally free to reuse with attribution, but I did not confirm the terms for this series.

## Mung bean, watermelon and maize profit per ha (Mekong Delta, 2020–2026)

### Takeaway
I found no new survey or extension figure for mung bean. For maize, one 2026 farmer quote from Đồng Tháp's Gò Công area gives more than 80 M₫/ha per crop. For watermelon, one 2025 farmer quote from Trà Vinh gives 60–90 M₫/ha per crop, on sandy ridge land rather than rice land. Both are farmer-reported news figures and would count as fallback.

### Cited Findings
- **Maize:** Đồng Sơn commune, Gò Công freshwater area, Đồng Tháp province (13 Mar 2026). A farmer (Trần Thị Bé) reported about 7.2 t/ha per crop and a profit after costs of "hơn 80 triệu đồng/ha", "cao gấp 4 lần so với cây lúa". The price was 3,000–3,500 đ per cob, so this is sweet or fresh corn, not grain maize. Some households grow corn year-round, five crops a year. — [SGGP](https://www.sggp.org.vn/cay-bap-thay-lua-o-vung-ron-man-thu-nhap-cao-gap-4-lan-post842554.html)
- **Watermelon:** Long Sơn commune, Cầu Ngang, Trà Vinh (4 Feb 2025). A farmer household grows four watermelon crops a year on sandy ridge land (đất giồng cát), with a profit of 60–80 M₫/ha per crop. Another crop yielded about 20–25 t/ha, sold at 8,800 đ/kg, for a profit of 80–90 M₫/ha. — [Báo Trà Vinh](https://www.baotravinh.vn/nong-nghiep/mo-rong-vung-san-xuat-nang-cao-gia-tri-san-pham-tiem-nang-42829.html) (search snippet)
- Báo NN&MT has an article titled "Chuyển đất lúa kém hiệu quả sang trồng dưa thu 10–15 triệu đồng/sào". It could not be read because the site blocks the sandbox. — [nongnghiepmoitruong.vn d753467](https://nongnghiepmoitruong.vn/chuyen-dat-lua-kem-hieu-qua-sang-trong-dua-thu-10-15-trieu-dong-sao-d753467.html)
- Cục Trồng trọt reports that Mekong Delta localities (excluding An Giang) registered demand to convert nearly 40,000 ha of rice land in 2026. — [nongnghiepmoitruong.vn d802627](https://nongnghiepmoitruong.vn/nhu-cau-chuyen-doi-dat-trong-lua-sang-cay-trong-khac-tai-dbscl-gan-40000-ha-d802627.html) (search snippet)
- **Mung bean:** the only Mekong Delta profit study found is a 2008 Cần Thơ University paper, which found mung bean profit 1.2–2 M₫/ha higher than rice. It is outside the time window. A Cà Mau farmer quote (3 t/ha, close to 80 M₫ sales) is revenue with no year given. — [CTU journal 2008 via DOAJ](https://doaj.org/article/cd981ddbb4074b508ee32fe4e34a7fac); [VnExpress](https://vnexpress.net/han-man-nong-dan-mien-tay-bo-lua-trong-dau-3385172.html)

### Inferences
- The maize figure is for fresh corn sold by the cob on a water-scarce field. If the app's maize means grain maize, this figure overstates it.
- Mung bean remains without a usable figure. One option is to compute it from parts: yield × the VFA- or market-reported price, minus a cost figure from an extension technical sheet. That would be a model, and the app would have to label it so.

### Gaps
- No 2020–2026 survey (university or extension) of profit per ha in the Mekong Delta was found for mung bean, watermelon on rice land, or grain maize on rice land.
- Provincial extension centre ("Trung tâm Khuyến nông") model reports for Sóc Trăng and Trà Vinh were not reached.

## Input cost series (fertiliser, seed, labour) for the Delta

### Takeaway
The only machine-readable input price series found are the World Bank Pink Sheet's world fertiliser prices (urea, DAP, potassium chloride; monthly $/mt). I found no Delta-specific monthly series for fertiliser, seed or labour costs.

### Cited Findings
- The Pink Sheet monthly workbook has Urea, DAP and Potassium chloride columns ($/mt). In 2025M12 they were 392.5, 627.5 and 358.33. — [World Bank Commodity Markets](https://www.worldbank.org/en/research/commodity-markets) (workbook checked live)
- News describes cost pressure on Delta farmers in 2026: rising fuel prices and falling rice prices. — [Tuổi Trẻ, 30 Mar 2026](https://tuoitre.vn/nong-dan-mien-tay-xoay-xo-voi-chi-phi-tang-20260330234812227.htm); [vnbusiness](https://vnbusiness.vn/nong-dan-dbscl-ket-giua-gia-xang-tang-va-gia-lua-giam.html) (search snippets, no figures read)
- The CTU Long Mỹ paper itemises costs per ha (seed over 120 kg/ha, excess N, P and K, more than 8.58 pesticide sprays per crop). It is an example of the kind of breakdown university surveys provide. — [CTU J. Sci. 2025](https://ctujsvn.ctu.edu.vn/index.php/ctujsvn/article/download/7025/5153/33034)

### Inferences
- The NSO input price index for agricultural production ("chỉ số giá nguyên, nhiên vật liệu dùng cho sản xuất") probably exists alongside the producer price index, but I did not verify it.
- World fertiliser prices pass through to Delta retail prices with a lag. Using them directly for farm costs would be an assumption, and the app would have to label it.

### Gaps
- No Delta-specific fertiliser retail price series (for example from provincial Departments of Industry and Trade or AGROINFO) was found.
- No seed or labour (hired-labour day rate) series was found.

## Recommendation: what to add or switch to, and how to combine price with yield and cost

### Takeaway
Keep the published-profit medians as the base. Add the FPMA Bạc Liêu 25%/5% broken wholesale rice series (free JSON API, monthly, through Nov 2026) as a price indicator. Use it to show how this season's rice price compares with the average over the years the profit figures come from, without overwriting the profits. If profits are to move with price, use this rule: profit_now = median profit + yield × (price_now − price_ref) × milling factor. Here price_ref is the price in the same months as the source figures, and the app must label the result as a model.

### Cited Findings
- FPMA provides monthly VND/kg wholesale rice prices for Bạc Liêu, An Giang and Đồng Tháp to Nov 2026 through an open JSON API. — [FPMA API](https://fpma.fao.org/giews/v4/global/price_module/api/v1/FpmaSerieDomestic/?iso3_country_code=VNM&format=json)
- VFA gives a weekly national paddy average (lúa thường 6,879 đ/kg, 5–12 Nov 2026). — [VFA](https://vietfood.org.vn/thi-truong/gia-noi-dia/)
- Surveyed yields exist per paper, for example 6.22 t/ha in the CTU Long Mỹ survey, and Cục Trồng trọt gives a Delta-wide figure of about 7.4 t/ha for winter–spring 2025–26. — [CTU J. Sci. 2025](https://ctujsvn.ctu.edu.vn/index.php/ctujsvn/article/download/7025/5153/33034); [nongnghiepmoitruong.vn](https://nongnghiepmoitruong.vn/thi-truong-lua-gao-hoi-phuc-d802617.html)

### Inferences
- Simplest, lowest-risk change: a pipeline fetcher, `fetch_prices.py`, that stores the FPMA Bạc Liêu monthly series in `data/raw/` in the same pattern as the salinity fetcher, which writes nothing if a fetch fails. `build.py` would compute "price now vs 2020–2026 median" for rice. The app would then show a line such as "Rice price (Bạc Liêu wholesale, FAO/VFA) is X% above/below the 2020–26 median". This is a source-named number, not a model.
- Moving profits with price needs a paddy-to-milled ratio and a reference price for each published figure, which most news figures do not state. Price changes therefore add error to the published figures unless a figure states its own price. A sensitivity line would avoid this: "each 1,000 đ/kg change in paddy price changes rice profit by about 6–7 M₫/ha per crop". That is yield × 1,000 đ, using the about 6.2–7.4 t/ha yields above.
- Shrimp, mung bean, watermelon and maize have no usable price series. For these crops, stay with the published-figure medians and keep fallback labelling.
- Optional additions to `profits.json`: the CTU Long Mỹ survey (2025, n = 60, 31.0 M₫/ha, kind university) as a rice figure; and the Đồng Tháp corn (80 M₫/ha, 2026, farmer, fallback) and Trà Vinh watermelon (60–90 M₫/ha, 2025, farmer, fallback; sandy land) figures, if the crop definitions match.

### Gaps
- Whether FPMA's "Retail" market_type tag means the prices are retail (the price_type says WHOLESALE) is unclear from the metadata.
- No milling ratio or paddy-to-5%-broken price spread was sourced for the conversion.
- The Pink Sheet's current release URL was not found, only the Dec 2025 release.
