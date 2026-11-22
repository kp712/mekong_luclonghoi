# Rain data: alternatives to NASA GPM IMERG Final monthly for the Mekong Delta

Research date: 22 Nov 2026. Scope: monthly rain at 5 Sóc Trăng pins (about 9.3–9.8°N, 105.7–106.2°E) and 14 province points. Uses: typical-year and El Niño-year charts, FAO-56 water need, and a "latest 12 months" view.

## Is IMERG V07 Final delayed or discontinued, and is there an official statement?

### Takeaway
It is paused, not discontinued. NASA's GPM team has said officially that the V07 Final record stops at September 2025. The V08 Final Run was due in summer 2026; the latest notice (6 Aug 2026) moved it to "more likely" fall 2026, and I found no sign that it had been released by 22 Nov 2026. The V08 reprocessing starts in 1998, so a later IMERG Final would add the 1997–98 El Niño partly (from Jan 1998 only).

### Cited Findings
- 28 Apr 2026 notice "IMERG V08 Transition Schedule": the V07 Final record ends in September 2025 because its parent products (CORRA and GPROF) are moving to V08. Running V07 past September 2025 would have needed V08 inputs and risked discontinuities. The V08 Final Run was "planned for release in the summer of 2026". — [GPM: IMERG V08 Transition Schedule](https://gpm.nasa.gov/data/news/imerg-v08-transition-schedule); listed on [GPM data news](https://gpm.nasa.gov/data/news)
- 6 Aug 2026 notice: the team is still waiting for a V08 parent product to be finalized, and "it seems more likely that IMERG V08 Final Run will be released in the fall of 2026". It cannot yet assess the full impact or begin reprocessing the record "starting 1998". — [GPM: Update to the IMERG V08 Transition Schedule, Aug. 2026](https://gpm.nasa.gov/data/news/update-imerg-v08-transition-schedule-aug-2026)
- The same notice says IMERG V07 Late and Early are running in "hybrid" mode (V07 algorithm with GPROF V08 inputs). Their switch to V08 "will take place no sooner than winter of 2026", after the V08 Final release, and retrospective Late/Early records will begin in 1998. — [GPM Aug 2026 update](https://gpm.nasa.gov/data/news/update-imerg-v08-transition-schedule-aug-2026)
- Earthdata has posted an alert, "Transition of GPM IMERG Products to V08" (dated 22 May 2026 in search results), and the GES DISC forum says the V07 products for 1998 to 30 Sep 2025 stay available until V08 is released. — [Earthdata alert](https://www.earthdata.nasa.gov/data/alerts-outages/transition-gpm-imerg-products-v08); [Earthdata forum](https://forum.earthdata.nasa.gov/viewtopic.php?p=25931)
- Normal Final Run latency is about 3.5 months after the near-real-time runs, and the daily Final follows the monthly batch (for example, the January dailies appear no earlier than 2 April). — [GPM: V07 Final retrospective processing completed](https://gpm.nasa.gov/data/news/imerg-v07-final-run-retrospective-processing-completed); [AWS Registry GPM_3IMERGDF](https://registry.opendata.aws/nasa-gpm3imergdf/)
- Other 2025–26 IMERG risks: DoD will keep sharing DMSP SSMIS data until the sensor fails or the programme ends, which is planned for September 2026 (notice of 30 Jul 2025). The near-real-time system was shut for about 14 hours on 20 Jan 2026 for storage migration. — [GPM data news](https://gpm.nasa.gov/data/news)

### Inferences
- Even once V08 Final appears, it will be a new version. Mixing V07 (to Sep 2025) with V08 (after it) would break consistency, so the app would need to refetch the whole V08 record.
- With its normal 3.5-month lag, IMERG Final can never give a fresh "latest 12 months" view. At best it is about 3–4 months behind.
- V08 starting in 1998 gives only Jan–Feb 1998 of the 1997–98 El Niño season, not a whole Dec–Nov season. The first whole season would be Dec 1998 – Nov 1999 (a La Niña season).

### Gaps
- I did not find a notice dated after 6 Aug 2026, so I cannot confirm whether V08 Final was released between Aug and Nov 2026. The listing I read showed page 1 only.
- I did not check whether GES DISC offers a monthly Late-run product. I know of only the daily Late product, GPM_3IMERGDL ([AWS registry](https://registry.opendata.aws/nasa-gpm3imergdl/)).

## Candidates: resolution, start, latency, 2026 status, gauge correction, access, licence

### Takeaway
CHIRPS is the only candidate that is both station-blended with a long record from 1981 and updated monthly in 2026, at the finest resolution (0.05°), with no login. Its v2.0 and v3.0 monthly files both run to October 2026: the v3 October file was posted 13 Nov 2026. ERA5/ERA5-Land through Open-Meteo is the simplest freshest option (5-day lag, no key), but it is model output, not gauge-corrected. Most other candidates fail on freshness (VnGP, APHRODITE), licence or login (MSWEP, GSMaP), or a Vietnam record (GHCN).

### Cited Findings
**CHIRPS v3.0 (Climate Hazards Center, UCSB)**
- 0.05°, land only, 60°N–60°S. Products are pentad, dekad, monthly and annual; daily values are downscaled from pentads ("use with caution"). — [NCAR Climate Data Guide: CHIRPS v3](https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3)
- Latency: the preliminary product is updated 2 days after each pentad ends. The final monthly is "typically released during the third week" of the next month. — [Climate Data Guide](https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3)
- Verified on the server 22 Nov 2026: `https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/` holds `chirps-v3.0.1981.01.tif` to `chirps-v3.0.2026.10.tif`. The October 2026 file is 22.7 MiB and was posted 2026-Nov-13. The same folder level has `cogs/` (Cloud-Optimized GeoTIFF, to 2026.10) and `netcdf/chirps-v3.0.monthly.nc` (one file) plus `netcdf/by_year/`. — [CHC data server](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/)
- Changes from v2: "over 90 sources of station data" (about 4× v2), a gauge-undercatch correction applied to all station data (raising totals relative to v2), a new climatology CHPclim2 using about 80,000 GPCC undercatch-corrected normals, and CHIRP3 changes to fix CHIRP2's underestimated variance and extremes. The satellite part is still geostationary thermal infrared. — [Climate Data Guide](https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3)
- The station sources named are Mexico, Costa Rica, Colombia, Korea, South America, Guatemala, Chile, Germany and Kenya. Vietnam and Southeast Asia are not mentioned. — [Climate Data Guide](https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3)
- Paper: "The Climate Hazards Center Infrared Precipitation with Stations, version 3", *Scientific Data*, 2026 (publication date 11 Apr 2026, DOI 10.1038/s41597-026-07096-4). — [USGS publication record](https://pubs.usgs.gov/publication/70275364); [UCSB News, 2026](https://news.ucsb.edu/2026/022614/new-rainfall-dataset-enhances-global-monitoring-extreme-weather); [CHC announcement](https://www.chc.ucsb.edu/news/announcement/534)
- Licence: CHC has waived all copyright and related rights to CHIRPS3 (search summary of CHC pages). The Climate Data Guide lists "Usage Restrictions: None". — [CHC CHIRPS page](https://chc.ucsb.edu/node/497); [Climate Data Guide](https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3)
- Weaknesses the Climate Data Guide names: a satellite-derived climatology that may be biased where warm low-level rain is missed; non-stationary errors from changing station networks. — [Climate Data Guide](https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3)

**CHIRPS v2.0**
- Production of v2 continues in parallel "through 2026" during the move to v3 (search summary of CHC pages). — [CHC CHIRPS page](https://chc.ucsb.edu/node/497)
- Verified 22 Nov 2026: `https://data.chc.ucsb.edu/products/CHIRPS/v2.0/global_monthly/tifs/` ends at `chirps-v2.0.2026.10.tif.gz` (13.9 MiB). The old path `/products/CHIRPS-2.0/global_monthly/tifs/` now returns 404. — [CHC data server](https://data.chc.ucsb.edu/products/CHIRPS/v2.0/global_monthly/tifs/)

**ERA5 / ERA5-Land (ECMWF), through the Open-Meteo Historical Weather API**
- ERA5 is 0.25° from 1940 and ERA5-Land is 0.1° from 1950. Both are updated daily with a 5-day lag. Daily `precipitation_sum` is offered. No API key for non-commercial use (the key is "only required to commercial use"). — [Open-Meteo historical weather API docs](https://open-meteo.com/en/docs/historical-weather-api)
- Model reanalysis, no gauge correction of rain. In the 2020 Vietnam typhoon validation (1,200+ gauges, hourly), ERA5-Land had the highest probability of detection (0.83) because it overestimates how often it rains, had no estimates above 30 mm/h, and had a lower hourly CC (0.29) than IMERG Early (0.38) and Final (0.42). — [Roversi et al. 2024, Remote Sensing 16:805](https://doi.org/10.3390/rs16050805)

**GSMaP (JAXA)**
- The standard GSMaP_MVK is 0.1°, hourly, with a 3-day latency. A gauge-adjusted version exists, and JAXA's format document lists a 0.1° monthly product. — [JMA workshop slides](https://www.jma.go.jp/jma/jma-eng/jma-center/rwc/event/RWCws_2019/Presentation/2/2.2.pdf); [GSMaP NRT8 data format description](https://sharaku.eorc.jaxa.jp/GSMaP/document/new/DataFormatDescription_NRT8.pdf)
- The gauge adjustment uses NOAA CPC daily gauge analysis. — [Earth Engine: GSMaP v9 operational](https://developers.google.com/earth-engine/datasets/catalog/JAXA_GPM_L3_GSMaP_v9_operational)
- Access needs registration under JAXA's "Terms of Use of Research Data"; JAXA keeps the copyright and requires credit. — [JAXA SWCEM registration page](https://sharaku.eorc.jaxa.jp/SWCEM/registration.html); [GSMaP guide](https://sharaku.eorc.jaxa.jp/GSMaP/guide.html)
- Record starts in 2000 (the CHIRPS/GSMaP northwest Vietnam study notes "GSMaP since 2000"). — [search summary of a 2026 Hoa Binh/Son La study](https://apcz.umk.pl/BOGPGS/article/download/59127/42911/194296)

**MSWEP (GloH2O)**
- Licence CC BY-NC 4.0 (non-commercial). Access is by application form, then a shared Google Drive link. — [ICDC Hamburg: MSWEP](https://www.cen.uni-hamburg.de/en/icdc/data/atmosphere/mswep-precipitation-amount.html); [third-party summary](https://pgtec-vrain.github.io/data_sources/metadata_datasources/mswep_datasource)
- The V2 near-real-time extension has about 3 h latency but "does not include daily gauge corrections". MSWEP V3 (preprint, 2026) claims 0.1°, hourly, 1979–present, latency about 2 h. — [Climate Data Guide: MSWEP](https://climatedataguide.ucar.edu/climate-data/global-high-resolution-precipitation-mswep); [MSWEP V3 preprint, arXiv 2602.01436](https://arxiv.org/html/2602.01436v1)

**VnGP (Vietnam Gridded Precipitation)**
- Built from 481 Vietnamese rain gauges for 1980–2010, daily. The SOLA paper says 0.25°, while DIAS lists a 0.10° version. Download from DIAS is "currently unavailable". — [Nguyen-Xuan et al. 2016, SOLA 12:291](https://www.jstage.jst.go.jp/article/sola/12/0/12_2016-057/_article); [DIAS record VnGP_010](https://search.diasjp.net/en/dataset/VnGP_010)
- A successor, VnHGC, covers 1961–1980 at 10 km daily. — [AFD working paper pr395 (2025)](https://www.afd.fr/sites/default/files/2025-12/pr395_va.pdf)

**GHCN-Daily stations (NOAA)** — checked in the station list and inventory files on 22 Nov 2026
- Southern Vietnam PRCP records: Cà Mau VMM00048914 (1957–2024), Phú Quốc VMM00048917 (1961–2025), Phan Thiết VMM00048887 (1956–2024), Tân Sơn Hòa VMM000048900 (1951–2013). The "SOC TRANG" (VMW00040001), "VINH LONG", "BINH THUY" (Cần Thơ) and other VMW stations hold only 1963–1967. — [ghcnd-stations.txt](https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt); [ghcnd-inventory.txt](https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-inventory.txt)

**PERSIANN-CDR, CMORPH, CPC** (only from the validation studies below): PERSIANN-CDR "severely underestimates" in the Indochina Peninsula in DJF; CMORPH and CPC have larger Mekong Delta biases than CHIRPS (see the next section). — [Southeast Asia monthly study, PLOS ONE 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11936298/); [Vietnam maize study, Sci Rep 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8752618/)

### Inferences
- GHCN-Daily has no current Sóc Trăng or Cần Thơ record. Cà Mau (about 50–70 km from the pins) is the nearest live station with an end year of 2024, but whether it is complete was not checked. It could serve as a spot check, not as the app's source.
- CHIRPS is small enough to use: one 0.05° pixel per pin, and the COG folder allows HTTP range reads. Reading pixels would add a GeoTIFF reader to the pipeline (rasterio/GDAL are not installed in this sandbox). The single NetCDF file is another route; its size was not checked.
- CHIRPS v3 starts in 1981, which covers the 1982–83, 1991–92 and 1997–98 El Niño seasons and many more. IMERG V08 Final will start only in 1998.

### Gaps
- APHRODITE: not checked in this session (end year, access). It is known as a gauge-only Asian product, but I have no citation for its current end year.
- Exact CHIRPS v3 Vietnam station inputs: not found. Vietnam is not named among the v3 station sources, so in the Delta CHIRPS may lean on GTS/GHCN-type stations and its climatology. This matters for criterion 1.
- KTTV (Vietnam) station data access: not researched here. The project already notes that `*.gov.vn` sites are unreachable from the sandbox.
- GSMaP gauge-adjusted monthly latency, and whether V8 or V9 is current at JAXA FTP: not confirmed. Earth Engine lists a "v9 operational" collection.
- PERSIANN-CCS-CDR and CMORPH 2026 update status: not checked.

## Published validation in Vietnam / Mekong Delta: which product ranks best for monthly totals?

### Takeaway
No study I found validates IMERG V07 or CHIRPS v3 against Mekong Delta gauges at monthly scale. The closest Delta evidence (Vietnam-wide VnGP study with a Mekong Delta region, 1981–2010) favours CHIRPS: about +4% annual bias, against −21% for GSMaP and +16% for CMORPH; IMERG was not tested. Vietnam-wide basin studies (none in the Delta) rank IMERG Final V06 first, with CHIRPS v2 well behind on correlation but second-lowest bias. So the evidence does not show that CHIRPS is more accurate than IMERG in the Delta; it shows that CHIRPS is good for monthly-to-annual totals there, and it is the only fresh station-blended option.

### Cited Findings
**Mekong Delta region (R7), Vietnam maize study (Sci Rep 2022)**: reference VnGP (481 gauges); CHIRP/CHIRPS 1981–2010, CMORPH 2003–2010, GSMaP 2001–2010. IMERG not included. — [Sci Rep 2022, "Evaluation of multiple satellite precipitation products for rainfed maize production systems over Vietnam"](https://pmc.ncbi.nlm.nih.gov/articles/PMC8752618/)
- R7 annual totals against VnGP 1728.9 mm: CHIRPS 1803.1 mm (+4.3%), CHIRP 1842.7 (+6.5%), CMORPH 2006.3 (+16%), GSMaP 1368.0 and CPC 1357.8 (both about −21%).
- R7 dekadal errors (MAE / RMSE mm per dekad / NSCE): CHIRP 28.54 / 51.66 / 0.71; CHIRPS 29.45 / 51.46 / 0.70; CMORPH 36.44 / 70.68 / 0.71; CPC 36.93 / 60.47 / 0.58; GSMaP 50.87 / 90.43 / 0.61.
- National dekadal correlation: CMORPH 0.77, CHIRP 0.74, CHIRPS 0.73, CPC 0.53, GSMaP 0.36. The paper ranks CHIRPS first overall. No monthly correlation or KGE values are given.
- Authors were not recorded in this session; cite by title and URL.

**Lower Mekong Basin (Dandridge et al. 2019, Remote Sensing 11:2709)**: 477 MRC stations, 2000–2014, TMPA and CHIRPS v2 (no IMERG). CHIRPS had a much higher average spatial correlation than TMPA, correlated better at low elevation and for monthly totals under 500 mm, and had its highest correlation in northern/central areas "and the Vietnam delta". Both products had wet biases in high-rain months. — [Dandridge et al. 2019](https://dx.doi.org/10.3390/rs11222709); [NASA NTRS copy](https://ntrs.nasa.gov/api/citations/20200002270/downloads/20200002270.pdf)

**Eleven Vietnam basins (Tran et al. 2023, Atmospheric Research 293:106923)**: 2007–2015, IMERG Final V6, MSWEP V2.2, SM2RAIN-ASCAT, APHRODITE V1901, CHIRPS V2.0, PERSIANN-CDR V1.0. The basins span seven climate zones from North West to South East (Đồng Nai, "CD" basin); none is in the Mekong Delta. Median CC: IMERGF 0.703, MSWEP 0.547, SM2RAIN 0.540, APHRODITE 0.520, PERSIANN-CDR 0.449, CHIRPS 0.436. Median relative bias: IMERGF −0.006, CHIRPS −0.029, MSWEP −0.047. Monthly streamflow PBIAS was best with IMERGF (0.26%). Overall MCDM ranking: IMERGF > MSWEP > SM2RAIN-ASCAT > APHRODITE > CHIRPS > PERSIANN-CDR. — [Tran et al. 2023, NASA NTRS accepted manuscript](https://ntrs.nasa.gov/api/citations/20240007009/downloads/Robustness%20of%20SPPs%20for%20VN%20basins_manuscript_final.pdf)
- The CC figures appear to be daily (the section describes "temporal dynamic metrics" alongside POD/FAR/CSI), so they are not monthly CCs. This is my reading of the manuscript; it is not stated explicitly in the lines read.

**Vietnam basins, eight products (Le et al. 2020, J. Hydrology 586:124820)**: IMERG Final V06B "exhibited the best overall performances among SPE products" for streamflow simulation. — [ScienceDirect abstract](https://www.sciencedirect.com/science/article/abs/pii/S0022169420302808); summarised in [Roversi et al. 2024](https://doi.org/10.3390/rs16050805)

**Southeast Asia, monthly, 2001–2017 (PLOS ONE 2025)**: reference SA-OBS v2 (0.5°); CPC, CHIRPS (v2, 0.25°), ERA5, IMERG Final V06B and PERSIANN-CDR. CPC was best (CC 0.80, RMSE 1.70 mm/day), and all except PERSIANN had CC above 0.74. Regression bias ratios: CHIRPS 1.03, ERA5 1.06, IMERG 1.06, CPC 0.97, PERSIANN 0.93. The CPC lead was not significant (t-test, p = 0.05). There are no country or Delta results; SA-OBS has no data for Cambodia or Laos. — [PLOS ONE 2025, PMC11936298](https://pmc.ncbi.nlm.nih.gov/articles/PMC11936298/)

**Vietnam 2020 typhoon season (Roversi et al. 2024)**: hourly, 1,200+ gauges. Hourly CC: IMERG Final 0.42, Early 0.38, ERA5-Land 0.29. Going from the Early to the Final run brought only slight improvements. — [Roversi et al. 2024](https://doi.org/10.3390/rs16050805)

**Whole Mekong Basin, 175 gauges (Remote Sensing 12:1858, 2020)**: GSMaP had the largest daily error; TRMM 3B42 was best at annual, seasonal and monthly scales. CHIRPS and IMERG were not in this test (search summary; the full text returned HTTP 403). — [Remote Sensing 12:1858](https://dx.doi.org/10.3390/rs12111858)

### Inferences
- For monthly totals in the Delta, the available evidence puts CHIRPS and IMERG Final close, both well ahead of GSMaP (about −21% bias in the Delta) and PERSIANN-CDR. IMERG Final leads on daily correlation in upland Vietnam basins. That advantage matters less for monthly sums on the flat Delta, where CHIRPS showed about 4% annual bias and its best correlations ("Vietnam delta").
- The VnGP evidence is for CHIRPS v2. v3 adds an undercatch correction that raises totals, so its bias against Vietnamese gauges (which are not undercatch-corrected) may be higher than v2's. This is untested.
- No evidence was found that CHIRPS is *more accurate* than IMERG Final in the Delta. The case for switching rests on freshness, the record length (1981) and simplicity, with Delta accuracy shown to be good, not better.

### Gaps
- No published monthly CC, bias or KGE for IMERG (any version) against Mekong Delta gauges was found.
- No published validation of CHIRPS v3 in Vietnam was found (v3 came out in 2026).
- Le et al. 2020 per-product numbers were not retrieved (paywalled).
- A cheap local check is possible: compare CHIRPS v2, v3 and IMERG monthly at the 5 pins for 2001–2024 against each other, and against Cà Mau GHCN-Daily monthly sums. Not done here.

## Recommendation: which product(s), for which purpose, and from which start year?

### Takeaway
Use CHIRPS (v3.0 monthly, with v2.0 as the drop-in fallback through 2026) for both the long-term averages and the latest 12 months. This gives one consistent product from the Dec 1981 – Nov 1982 season (it covers the 1982–83, 1997–98 and 2015–16 El Niño seasons), with the October 2026 month already out and no login. Keep IMERG V07 Final (to Sep 2025) only as a cross-check until V08 Final is out. Do not mix products inside one series.

### Cited Findings
- CHIRPS v3 monthly runs Jan 1981 – Oct 2026 on the CHC server, and the final month usually appears in the third week of the next month. — [CHC data server](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/); [Climate Data Guide](https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3)
- IMERG V07 Final stops at Sep 2025, and V08 Final has slipped to "more likely" fall 2026, starting 1998. — [GPM Aug 2026 update](https://gpm.nasa.gov/data/news/update-imerg-v08-transition-schedule-aug-2026)
- CHIRPS has about +4% annual bias in the Mekong Delta against VnGP gauges (v2). — [Sci Rep 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8752618/)
- CHIRPS correlates best with gauges in the Vietnam delta within the Lower Mekong Basin (v2). — [Dandridge et al. 2019](https://dx.doi.org/10.3390/rs11222709)
- Open-Meteo ERA5/ERA5-Land: 5-day lag, no key, from 1940/1950, but ungauged model rain that overestimates rain occurrence in Vietnam. — [Open-Meteo docs](https://open-meteo.com/en/docs/historical-weather-api); [Roversi et al. 2024](https://doi.org/10.3390/rs16050805)

### Inferences
- **Long-term averages:** CHIRPS v3, seasons Dec 1981 – Nov 2025 (44 whole seasons). The first whole Dec–Nov season is Dec 1981 – Nov 1982 because the record starts in Jan 1981. If the user prefers the record that was validated in Vietnam, use CHIRPS v2.0 over the same period. v2 is promised only "through 2026", so v3 is the safer long-term choice.
- **Latest 12 months:** the same CHIRPS v3 monthly (final), lagging about 2–3 weeks. If a fresher view is wanted, the CHIRPS v3 preliminary pentads (2-day lag) could fill the current month, labelled "preliminary". ERA5-Land via Open-Meteo is a no-key fallback for the newest weeks only, labelled as model estimate. Do not use it in the averages.
- **Pipeline:** CHIRPS replaces the Earthdata login, the OPeNDAP retries and the 4-month batching in `fetch_gpm.py` with plain HTTPS from `data.chc.ucsb.edu`. The cost is a GeoTIFF/COG pixel read (one 0.05° cell per point) or one NetCDF download.
- **Resolution:** 0.05° (about 5.5 km) is finer than IMERG's 0.1°. In the flat Delta that helps more with coastal and land-mask edges than with terrain.
- **Licence:** CHIRPS (waived rights / no restrictions) fits the CC BY 4.0 content licence. MSWEP (CC BY-NC) and GSMaP (JAXA terms, registration) fit less well.
- **Consistency:** splicing IMERG (2000–2025) onto CHIRPS, or IMERG V07 onto V08, would create a break. Pick one product per series.
- **Before switching:** compare CHIRPS v3 with the current IMERG monthly at the 5 pins over Dec 2000 – Sep 2025, as a sanity check on bias. v3's undercatch correction may raise totals.

### Gaps
- The magnitude of the CHIRPS v3 vs v2 change in the Delta is unknown. A quick pixel comparison would answer it.
- Whether NASA will publish V08 Final before the app's next data refresh is unknown.
