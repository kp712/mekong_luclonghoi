# New data layers for the Mekong Rotation Explorer (researched 2026-11-22)

Scope: candidate layers beyond what the app already has (rain/ET0 averages, KTTV river salinity, soil, greenness, NOAA ENSO outlook, 7-day Open-Meteo forecast, profit figures). Search budget was about 16 tool calls, so several questions are only partly answered; the Gaps sections say where.

## Overall ranking (most useful first)

### Takeaway
Three layers are worth adding. In order: (1) the 10-day salinity forecast already inside the KTTV PDFs the app fetches; (2) the official season planting calendar (lịch thời vụ) for each province; (3) an ECMWF seasonal rain/temperature anomaly for the next 1–6 months via Open-Meteo. Mekong flow, subsidence, SPEI, floods, sea level and land-use change are low value for a farmer's season decision, or not available as clean free data.

### Cited Findings
- KTTV's national salinity bulletins (`dbqg_xman_YYYYMMDD_1500.pdf`) come out every 10 days in the dry season. Each one forecasts the next 10 days: the 30 Apr 2026 bulletin forecast salinity for 1–10 May, and the 31 May 2026 bulletin was the season's last, forecasting 1–10 June with a level-1 salinity disaster-risk warning — [KTTV 2026-04-30](https://kttv.gov.vn//upload/thuyvan1/2026/4/30/dbqg_xman_20260430_1500.pdf); [KTTV 2026-05-31](https://kttv.gov.vn//upload/thuyvan1/2026/5/31/dbqg_xman_20260531_1500.pdf)
- The repo's `pipeline/fetch_salinity_vietnam.py` already downloads these same PDFs (URL pattern `kttv.gov.vn/upload/{folder}/{y}/{m}/{d}/dbqg_xman_..._1500.pdf`). So the forecast text is already in hand; only the parsing is missing — local file `pipeline/fetch_salinity_vietnam.py` line 57
- The Department of Crop Production and Plant Protection (Cục Trồng trọt và BVTV) issued Đông Xuân 2026–27 guidance for the Delta: early sowing 10–30 Oct 2026 in coastal areas at risk of late-season drought; wave 2 from 1–31 Dec 2026 (~200,000 ha, ~16% of the plan); late areas must finish by 10 Jan 2027; plant paddy only where irrigation works allow. Timing is set from forecasts of water supply, floods, spring tides, drought and salinity — [Cà Mau copy of the Cục document](https://storage-vnportal.vnpt.vn/cmu-khdn/5342/Vanban/2026.6.19-cv-chi-dao-sx-trong-trot-ung-pho-elnino-2026_-_nqmanh_19062026180253__19062026180725_signed.pdf); [24hmoney summary](https://24hmoney.vn/news/chu-dong-ung-pho-el-nio-2026-san-xuat-trong-trot-phia-nam-chuyen-minh-tu-som-tu-xa-c30a2797997.html) (gives a different early-wave figure, 350,000 ha / 28%: the sources conflict)
- The Open-Meteo Seasonal API gives ECMWF SEAS5 (7 months, monthly update on the 5th) and EC46 (46 days, daily update) at 36 km with 51 members, including monthly precipitation/temperature anomalies against the model's own hindcast climatology. It warns the data are "not bias-corrected" — [Open-Meteo seasonal docs](https://open-meteo.com/en/docs/seasonal-forecast-api)

### Inferences
- Ranking (usefulness / accuracy / freshness / resolution / access):
  1. **KTTV 10-day salinity forecast**: high / official, station-based / every 10 days, Dec–Jun / about 20+ stations / already fetched. Farmer use: "Salt at Đại Ngãi is expected above 4‰ next week: fill the pond or canal with fresh water now."
  2. **Official lịch thời vụ (planting windows)**: high / authoritative but not a measurement / once per season / province or sub-region / PDF or news only. Farmer use: "My district sows Đông Xuân between 1 and 31 Dec. Plan the rotation to fit."
  3. **SEAS5 seasonal rain and temperature anomaly (Open-Meteo)**: medium / moderate skill, best in month 1 and in ENSO years / monthly / 36 km / free JSON API. Farmer use: "The next 3 months look drier than normal: lean toward 2 crops or salt-tolerant rice."
  4. **Mekong upstream flow (Tân Châu / Châu Đốc / Kratie)**: low to medium for farmers. It mostly duplicates the salinity forecast, which already accounts for it; skip it unless KTTV forecasts lapse.
  5. **Light-trap planthopper bulletins**: high value but not machine-readable; link to them, don't ingest.
  6. **SPEI / soil moisture**: low; it duplicates the rain/ET0 the app already has.
  7. **Floods (GloFAS)**: low for Sóc Trăng (coastal, flooding is tidal); medium for upper-delta An Giang/Đồng Tháp.
  8. **Subsidence (InSAR)**: low for a season decision; long-term context only.
  9. **Rice-to-shrimp conversion maps**: low; no public up-to-date layer was found.
  10. **Sea level / tide gauges**: low; no free real-time feed was found (see Gaps).

### Gaps
- Each layer's skill was not tested against Sóc Trăng observations in this pass; the rankings are judgements from the cited evidence.

## Seasonal forecasts (1–6 months): C3S/SEAS5, IRI, NMME, Open-Meteo

### Takeaway
SEAS5 is the easiest to use: free JSON at a point through Open-Meteo, with monthly anomalies. Skill over mainland Southeast Asia is real but mostly limited to the first month and to ENSO-driven years. Its onset skill (telling early from late monsoon onset about 3 months ahead) concerns the regional South China Sea monsoon, not Delta rice onset. Show it as "wetter/drier than normal" terciles, never as mm of rain.

### Cited Findings
- Open-Meteo Seasonal API: endpoint `https://seasonal-api.open-meteo.com/v1/seasonal`; models ECMWF Seasonal Seamless (EC46 for the first 46 days, then SEAS5), SEAS5, EC46; 36 km (O320), 6-hourly native; default 6 months, up to 7; SEAS5 updates monthly on the 5th, EC46 daily around 20:30 UTC; 51 members or the ensemble mean. Variables include precipitation, ET0, soil moisture, and monthly/weekly Mean and Anomaly (anomaly = forecast minus the model's hindcast climatology, 20–30+ years), plus EFI and Shift-of-Tails indices. Members are kept for 1 month, the ensemble mean longer. Not bias-corrected. Licence choices listed: Non-Commercial, Commercial, Self-Hosted (terms not shown on the page) — [Open-Meteo seasonal docs](https://open-meteo.com/en/docs/seasonal-forecast-api); [Open-Meteo blog](https://openmeteo.substack.com/p/seasonal-weather-forecasts)
- A hindcast evaluation over Mainland Southeast Asia (HESS preprint 2023) found precipitation and streamflow forecast skill "limited to the first month", with considerable skill in eastern Thailand, Cambodia, Vietnam and Malaysia; year-to-year skill is tied to ENSO-driven anomalies — [HESS preprint hess-2023-56](https://hess.copernicus.org/preprints/hess-2023-56/hess-2023-56.pdf) (finding as reported in the search summary; the full text was not read)
- A 2026 study on South China Sea summer monsoon onset found SEAS5 can tell early from late onset years up to about 3 months ahead, with a late-onset bias and weaker skill at longer leads; a circulation-regime onset definition improves skill — [WCD 7, 1219, 2026](https://wcd.copernicus.org/articles/7/1219/2026/)
- A study of rainy-season onset for Vietnamese subregions, including the Southern Plain, tested whether raw S2S forecasts can support onset forecasts; its results were not seen — [EGUsphere 2026-358](https://egusphere.copernicus.org/preprints/2026/egusphere-2026-358/egusphere-2026-358.pdf)
- ECMWF documents SEAS5 at [ecmwf.int seasonal](https://www.ecmwf.int/en/forecasts/documentation-and-support/seasonal) and in the [SEAS5 user guide](https://www.ecmwf.int/sites/default/files/elibrary/2021/81237-seas5-user-guide_0.pdf). An ECMWF forum post says quarterly 13-month SEAS5 runs are planned — [ECMWF forum](https://forum.ecmwf.int/t/seasonal-forecast-seas-model-extension/14477)
- Current context: a VietnamNet report says southern Vietnam rain this year is forecast below average and the rainy season may end nearly a month early — [VietnamNet](https://vietnamnet.vn/en/rainy-season-may-end-nearly-a-month-early-in-southern-vietnam-2538731.html)

### Inferences
- For the Dec–Apr dry season, rain is near zero in Sóc Trăng anyway, so a dry-season rain forecast adds little. The useful moment is Apr–Jun, before Hè Thu sowing (rainy-season onset). Even then, show only a tercile ("earlier/later/normal"), with a skill caveat.
- C3S multi-model, NMME and IRI would add little over SEAS5 alone, at the cost of a CDS login (C3S) or coarse 1° grids (NMME/IRI). With Open-Meteo already in the app, SEAS5 via Open-Meteo is the lowest-effort choice.
- The app's existing NOAA ENSO outlook already captures most of the predictable signal (skill is ENSO-driven), so SEAS5 is an incremental addition, not a must-have.

### Gaps
- No Mekong Delta-specific verification of SEAS5 onset or dry-season rain was found or read in full (EGUsphere 2026-358 is the best lead).
- Open-Meteo licence terms for the seasonal API were not confirmed (its main API is CC BY 4.0, free for non-commercial use; this was not verified for the seasonal endpoint).
- IRI and NMME access details and skill were not researched in this pass.

## Salinity forecasts (KTTV, SIWRR): machine-readable?

### Takeaway
KTTV's 10-day bulletins are PDFs, not an API, but the app already scrapes them, so parsing their forecast section is the cheapest high-value addition. No SIWRR bulletin was found online in this pass.

### Cited Findings
- Bulletin naming and cadence: files dated the 10th, 20th and last day of each month (e.g. 2026-03-10, 03-20, 03-31, 04-20, 04-30, 05-10, 05-31) at `kttv.gov.vn/upload/thuyvan1|thuyvan2/...` — [KTTV 2026-03-10](https://kttv.gov.vn//upload/thuyvan1/2026/3/10/dbqg_xman_20260310_1500.pdf); [KTTV 2026-03-20](https://kttv.gov.vn//upload/thuyvan2/2026/3/20/dbqg_xman_20260320_1500.pdf); [KTTV 2026-05-10](https://kttv.gov.vn//upload/thuyvan1/2026/5/10/dbqg_xman_20260510_1500.pdf)
- 2025–26 season: salinity was lower than 2024–25 and the long-term mean; the largest event came in the 14–19 Feb 2026 spring tide; the bulletins advise storing fresh water at low tide — [Nhân Dân](https://nhandan.vn/dieu-hanh-linh-hoat-nguon-nuoc-chu-dong-kiem-soat-xam-nhap-man-o-dong-bang-song-cuu-long-post944498.html); [Tuổi Trẻ](https://tuoitre.vn/xam-nhap-man-gia-tang-o-mien-tay-dau-thang-2-va-tet-nguyen-dan-20260201093932215.htm)
- The 31 May bulletin points users to daily hydrology bulletins on nchmf.gov.vn — [KTTV 2026-05-31](https://kttv.gov.vn//upload/thuyvan1/2026/5/31/dbqg_xman_20260531_1500.pdf)

### Inferences
- Parsing the forecast table or text (forecast max salinity per station for the next 10 days, plus the risk level) needs only a small change to `fetch_salinity_vietnam.py` and a card in `dash.js`. Label it "KTTV forecast, issued <date>"; it is not a measurement.
- For the 2026–27 season, a strong El Niño is expected (see the lịch thời vụ section), so the forecast card would matter most in Feb–Apr 2027.

### Gaps
- SIWRR (Southern Institute of Water Resources Research) outlooks were not found online; their format is unknown.
- The exact layout of the forecast table inside the PDFs was not inspected in this pass (check a PDF with pdfplumber).
- Weekly/daily nchmf.gov.vn hydrology bulletins were not checked for machine readability.

## Mekong flow (Tân Châu, Châu Đốc, Kratie, MRC) as a salinity lead indicator

### Takeaway
The literature agrees that lower discharge at the delta raises salinity, and that the estuary is unusually sensitive to discharge. But riverbed incision (sand mining), subsidence and dam operation change the relation, and KTTV's forecast already uses upstream flow. No documented public MRC API was found. Not worth adding as a farmer layer.

### Cited Findings
- Lower discharge at Cần Thơ and Mỹ Thuận raises salinity on the Cổ Chiên and Hậu more than sea-level rise does (modelling study, *Climate*, March 2023) — [DOAJ: Climate 2023](https://doaj.org/article/d0c01446c0684c8c809326a057ca550f)
- Dry-season Tiền River discharge rose by up to 23% after dams, yet the dry-season water level fell, likely because of riverbed incision. The salinity relation "may depend not only on upstream discharge and tidal regimes, but also on riverbed incision" — [Earth Surface Dynamics 9, 953, 2021](https://esurf.copernicus.org/articles/9/953/2021/)
- The relative roles of sand mining, subsidence, upstream reservoirs and sea-level rise remain unclear — [NTU NIE, 22 Nov 2025](https://www.ntu.edu.sg/nie/news-events/news/detail/salinity-intrusion-threatens-vietnam-s-rice-bowl); [IIASA EGU25 abstract](https://pure.iiasa.ac.at/id/eprint/20541/1/EGU25-20779-print.pdf)
- In 2022 a Vietnamese institute said dry-season flow depended heavily on upstream hydropower operation — [RFA 2022](https://www.rfa.org/english/news/vietnam/mekong-03022022180931.html)
- The MRC Data and Information Service (portal.mrcmekong.org) offers time series and over 10,000 datasets, including hydro-met time series — [World Bank water data listing](https://wbwaterdata.org/dataset/mekong-river-commission-data-portal/resource/fdaaea95-ccd3-4c77-aade-d4ff23f8615c); [ODM announcement](https://opendevelopmentmekong.net/announcements/mekong-river-commission-launches-interactive-and-easy-to-use-mekong-data-portal/)
- MRC's flood centre issues 1–5-day river height forecasts for 22 locations, but only in the wet season (June–October); Kratie is where the river's hydraulics change — [HESS 18, 2645, 2014](https://hess.copernicus.org/articles/18/2645/2014/hess-18-2645-2014.pdf)
- Static records: hourly discharge and sediment at Châu Đốc, Tân Châu, Cần Thơ and Mỹ Thuận for 2005–2015 (BGS/NERC) — [data.gov.uk record](https://www.data.gov.uk/api/2/rest/harvestobject/1f8a195e-68de-4e86-b28a-6a19358cf8cb/html)
- August 2026: the MRC expected Kratie to pass caution level (22.6 m forecast vs 22 m) — [Cambodianess](https://cambodianess.com/article/flood-warning-remains-for-stung-treng-but-lifted-for-kratie-kg-cham-1). A delta "flood shortage" was predicted for 2026 because of El Niño and reservoir filling — [FishBio](https://fishbio.com/news/the-mekong-delta-is-starving-for-floods/)

### Inferences
- A low end-of-wet-season (Oct–Nov) flood peak at Tân Châu is a plausible early warning for a salty dry season, but the app gets the same signal more directly from KTTV salinity forecasts and the ENSO outlook. Adding raw discharge would confuse farmers.
- MRC's wet-season-only forecasts do not cover the dry season, which is when salinity matters.

### Gaps
- No public, documented MRC API endpoint was confirmed; access may need registration.
- No quantitative study of the lead time from upstream flow to Sóc Trăng salinity was read.

## Floods (GloFAS, Sentinel-1 flood maps, Global Flood Database)

### Takeaway
GloFAS is free (with registration) at 0.05°, with forecasts and seasonal outlooks, but no Delta validation was found, and Sóc Trăng's risk is tidal, not riverine. Low priority; consider it only for upper-delta provinces.

### Cited Findings
- GloFAS historical: LISFLOOD forced by ERA5, daily from 1 Jan 1979; the current operational version is v5.0 (released 2026-07-15); forecast, reforecast, seasonal and seasonal-reforecast datasets are on the Copernicus EWDS — [EWDS GloFAS historical](https://ewds.climate.copernicus.eu/datasets/cems-glofas-historical); [GloFAS seasonal](https://ewds.climate.copernicus.eu/datasets/cems-glofas-seasonal)
- The v4.0 reanalysis is daily discharge at 0.05° (~5 km); access is open but needs registration. v2.1 was validated against 1,801 stations worldwide — [JRC Data Catalogue](https://data.jrc.ec.europa.eu/dataset/f96b7a19-0133-4105-a879-0536991ca9c5); [ESSD 12, 2043, 2020](https://essd.copernicus.org/articles/12/2043/2020/)

### Inferences
- In a tidal delta, a 1-D routing model like LISFLOOD is unlikely to represent water levels at Sóc Trăng well; trust GloFAS only upstream of Tân Châu.

### Gaps
- No GloFAS validation at Cần Thơ or Tân Châu was found.
- Sentinel-1 flood maps (e.g. the Global Flood Monitoring service) and the Global Flood Database (MODIS, 2000–2018) were not researched in this pass.

## Land subsidence and groundwater

### Takeaway
New InSAR work (2015–2023 Sentinel-1) shows mean subsidence of about 3.3–3.6 cm/yr, up to about 9.5 cm/yr, and the supporting data are listed on the WUR portal. It is useful long-term context ("your land sinks about X cm per decade") but does not change this season's rotation. Low priority.

### Cited Findings
- Guzy et al. (2026) used 708 descending Sentinel-1 images, PS and SBAS InSAR, 2015–2023, with ~1.2 million coherent SBAS points; a supporting-data record exists (AGH/WUR, 2026) — [WUR record](https://research.wur.nl/en/publications/challenges-in-estimating-long-term-insar-derived-land-subsidence-/)
- EGU26 abstract (Walczak, Guzy, ... Minderhoud): maximum vertical land motion about −9.5 cm/yr; mean −3.3 cm/yr (descending) and −3.6 cm/yr (ascending) — [EGU26-20136](https://meetingorganizer.copernicus.org/EGU26/EGU26-20136.html)
- Earlier PSI subsidence datasets for the delta came from Copernicus Emergency Management Service activations — [PIAHS 382, 327, 2020](https://piahs.copernicus.org/articles/382/327/2020/)

### Inferences
- Rates are mostly driven by groundwater pumping in urban areas, so farm-level relevance is mostly a long-term salinisation and flooding risk. Not a season-decision layer.

### Gaps
- The licence and format of the Guzy et al. supporting data were not checked.
- Groundwater level and salinity monitoring data (the national groundwater monitoring network) were not researched; no open feed is known.

## Drought indices (SPEI, SPI) and soil moisture

### Takeaway
SPEIbase (0.5°, Penman-Monteith) and the 5 km ESSD SPEI are available, but they tell a farmer little beyond the app's own rain minus ET0. No Delta validation was found. Not worth adding. Soil moisture is meaningless for flooded paddies, though it may help upland rotations.

### Cited Findings
- SPEIbase is 0.5°; a 2023 ESSD paper gives four 0.05° global SPEI datasets for 1981–2022, which agree with root-zone soil moisture and vegetation indices — [ESSD 15, 5449, 2023](https://essd.copernicus.org/articles/15/5449/2023/)
- Google Earth Engine notes SPEIbase uses FAO-56 Penman-Monteith PET, while the Global SPEI Drought Monitor uses Thornthwaite, and recommends SPEIbase — [GEE CSIC SPEI 2.11](https://developers.google.com/earth-engine/datasets/catalog/CSIC_SPEI_2_11?hl=vi)

### Inferences
- In the coastal Delta, "drought" for rice means salinity in the canals, not rain deficit; SPEI misses the real constraint.
- Open-Meteo seasonal soil moisture (see the seasonal section) covers any forward-looking need without a new source.

### Gaps
- ERA5-Land and SMAP soil-moisture validation in the Delta was not researched.
- Whether SPEIbase is updated to 2025/2026 was not confirmed.

## Sea level and tides (Vũng Tàu, Mỹ Thanh; SLR projections)

### Takeaway
Not researched in depth in this pass. No free, machine-readable real-time feed for Vũng Tàu or Mỹ Thanh was found. KTTV salinity bulletins already name the spring-tide (triều cường) periods that drive salt peaks, which is the farmer-relevant part.

### Cited Findings
- The largest salinity event of 2025–26 occurred during the 14–19 Feb 2026 spring tide, i.e. tides are already reflected in KTTV bulletins — [Tuổi Trẻ](https://tuoitre.vn/xam-nhap-man-gia-tang-o-mien-tay-dau-thang-2-va-tet-nguyen-dan-20260201093932215.htm)

### Inferences
- A simple spring-tide calendar (computed from the lunar phase, since spring tides follow new and full moon) could flag high-salt-risk days without any data source. This needs validation before use.

### Gaps
- UHSLC/IOC/PSMSL availability for Vũng Tàu, and any Mỹ Thanh gauge, were not checked. IPCC AR6 sea-level projections (NASA Sea Level Projection Tool) were not checked.

## Land-use change (rice-to-shrimp conversion)

### Takeaway
There are studies, not a maintained public layer. Sóc Trăng 2010–2020 change is documented (3 rice crops to 2; rice–shrimp to brackish aquaculture). Not worth adding.

### Cited Findings
- Sóc Trăng 2010–2020: the main transitions were 3 rice crops to 2, rice–shrimp to brackish aquaculture, and growth of perennial plantations; rice–shrimp declined in popularity — [MDPI Land 14(5) 1063](https://www.mdpi.com/2073-445X/14/5/1063)
- A CTU/IRRI 2024 report mapped 2022 Delta land use from Sentinel-1/2 in Earth Engine — [CTU/IRRI report](https://canng.github.io/assets/Article_archive/report/2024_IRRI_Report_Landuseanalysis_CTU.pdf)
- Sentinel-1 pond-aquaculture mapping across the delta — [Clauss et al., EGU2018](https://meetingorganizer.copernicus.org/EGU2018/EGU2018-7929-1.pdf); [Remote Sensing 10(7), 1076](https://api.crossref.org/works/10.3390%2FRS10071076); Sóc Trăng aquaculture paper — [canng archive](https://canng.github.io/assets/Article_archive/2022_EMA_ess_aquaculture_soc_trang.pdf)

### Inferences
- The app's own greenness and crops-per-year layer already shows a field dropping from 3 to 2 crops; a separate conversion map adds little for a single farmer.

### Gaps
- No downloadable, current (2024+) conversion layer was confirmed.

## Pest and disease (brown planthopper light traps, BVTV bulletins)

### Takeaway
Sóc Trăng runs 7 smart light-trap systems, and their counts set the "sow to dodge planthoppers" (né rầy) dates. This is high value, but the data are not published as an open feed. Best approach: link to or quote the province's né rầy sowing window each season, not raw counts.

### Cited Findings
- Sóc Trăng maintains seven smart light-trap systems (including at Long Phú town); catches are tracked by solar and lunar date to forecast migration peaks and set sowing dates — [Sóc Trăng Plant Protection Sub-department workshop paper, 2022](https://sokhcn.soctrang.gov.vn/SiteFolders/sokhcn/Nam%202022/HoiThao_KH_2022/Bai_7_Chi_cuc_BVTV.pdf) (on a soctrang.gov.vn host, which the cloud sandbox cannot reach; content as reported in the search summary)
- Light-trap-guided sowing reduces planthopper and grassy/ragged stunt infection; short-term forecasts are off by about 3–5 days — [VJOL study](https://vjol.info.vn/DHMHCM-XH/article/download/53076/43694/) (as reported in the search summary)
- Regional planthopper forecasts for the Delta appear as news articles — [Nông nghiệp Môi trường, Hè Thu 2024](https://nongnghiepmoitruong.vn/du-bao-tinh-hinh-ray-nau-vu-he-thu-2024-o-dong-bang-song-cuu-long-d376960.html); Cửu Long Rice Research Institute notices — [CLRRI](https://www.clrri.org/ver2/uploads/TB%20BCD%2002.03-08.pdf)

### Inferences
- The app's `score.js` already has `monthPest`; a seasonal "né rầy window" text per province would fit there.

### Gaps
- No machine-readable light-trap data source was found; 2026 Sóc Trăng bulletins were not found online.

## Vietnam agro-advisory feeds (lịch thời vụ, MARD/MAE)

### Takeaway
Official planting calendars exist each season at national (Cục Trồng trọt và BVTV) and province level, but only as signed PDFs and news articles. They are not machine-readable. Entering them by hand twice a year (Đông Xuân, Hè Thu/Thu Đông) is practical and high value, especially in El Niño years.

### Cited Findings
- National Đông Xuân 2026–27 windows: see the overall ranking above — [Cục document copy](https://storage-vnportal.vnpt.vn/cmu-khdn/5342/Vanban/2026.6.19-cv-chi-dao-sx-trong-trot-ung-pho-elnino-2026_-_nqmanh_19062026180253__19062026180725_signed.pdf)
- An Giang Đông Xuân 2026–27: two waves, 1–30 Nov and 1–31 Dec 2026 — [VietnamPlus](https://www.vietnamplus.vn/an-giang-lu-dau-nguon-song-mekong-giam-dan-thuan-loi-san-xuat-vu-dong-xuan-post1143213.vnp)
- Đồng Tháp plans >220,000 ha, ~100,000 ha already sown, the rest Nov 2026–Jan 2027 — [Nhân Dân](https://nhandan.vn/nong-dan-xuong-giong-som-vu-lua-dong-xuan-post1000242.html)
- Advice to finish sowing in Dec 2026, by mid-Jan 2027 at the latest, because of expected harsh drought and salinity — [Tiền Phong](https://tienphong.vn/khuyen-cao-mien-tay-ung-pho-han-man-gay-gat-mua-kho-sap-toi-post1882122.tpo)
- Province plans exist as signed PDFs (e.g. Cà Mau's rice–shrimp 2026 plan and Thu Đông planting-calendar notice) — [Cà Mau lúa–tôm 2026](https://storage-vnportal.vnpt.vn/cmu-khdn/5342/Vanban/kh-san-xuat-lua-tom-2026-10.7.signed.pdf); [Cà Mau Thu Đông notice](https://storage-vnportal.vnpt.vn/cmu-khdn/5342/Vanban/thong-bao-huong-dan-lich-thoi-vu-thu-dong-17.7.2025-.signed.pdf); An Giang notice — [An Giang 4516/SNNMT-CCTTBVTV](https://tracuu-tanan.angiang.gov.vn/sites/default/files/2026-05/4516-snnmt-ccttbvtv.pdf)
- The ministry site (mae.gov.vn) reports province calendars in news form — [MAE: Vĩnh Long Thu Đông](https://mae.gov.vn/vinh-long-len-ke-hoach-xuong-giong-hon-98300-ha-lua-thu-dong-22268.htm); [MAE: sub-region sowing in 57 days](https://mae.gov.vn/xuong-giong-lua-thu-dong-dut-diem-tung-tieu-vung-trong-57-ngay-22441.htm); topic tag — [nongnghiepmoitruong.vn lịch thời vụ](https://nongnghiepmoitruong.vn/lich-thoi-vu-tag130182/)
- Sóc Trăng has advised early sowing and dropping the late Đông Xuân crop to avoid drought and salinity in past El Niño years — [Lao Động](https://news.laodong.vn/moi-truong/soc-trang-khuyen-cao-bo-vu-lua-dong-xuan-muon-de-ne-han-man-1445305.ldo); [Lao Động](https://news.laodong.vn/xa-hoi/soc-trang-ap-dung-gieo-sa-som-bo-vu-muon-de-ne-han-man-1458381.ldo)

### Inferences
- A small hand-maintained `data/raw/lich_thoi_vu.json` (province, season, window, source URL, issue date), shown with a "Source: <agency>, <date>" line, fits the app's "say where every number comes from" rule.
- Since July 2025 Sóc Trăng is part of the new Cần Thơ, so the relevant calendar issuer is Cần Thơ city's agriculture department (Sở NN&MT). Search for it there.

### Gaps
- No 2026–27 calendar specific to former Sóc Trăng / new Cần Thơ was found in this pass.
- No open API or RSS for these notices was found.
