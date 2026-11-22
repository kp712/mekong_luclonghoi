# Weather and ET0 sources for the Mekong Delta: is anything better than NASA POWER?

Researched 2026-11-22. "Checked here" marks numbers I measured in this session; the script is `research/scripts/gsod_vs_power_tmax.py`.

## Q1. Candidate sources: resolution, period, latency, ET0, access, licence

### Takeaway
Two options give daily ET0 with no key: Open-Meteo, which computes FAO-56 ET0 from ERA5 or ERA5-Land, and AgERA5 (0.1°, but its support ended on 31 Dec 2025). ERA5-Land (0.1°, from 1950) and CHIRTS-ERA5 (0.05° Tmax/Tmin, from 1980s) are finer than POWER, and their lag is about 5–7 days, which is similar to POWER's radiation lag. GSOD stations in the delta stop at 2025-08-24, so they work for validation but not as an operational feed.

### Cited Findings
- **NASA POWER (current source).** Checked here on 2026-11-22: for the Sóc Trăng pin (9.6N 105.97E), the daily API returned T2M_MAX up to 2026-11-19, a 3-day lag. ALLSKY_SFC_SW_DWN ran only to 2026-11-16, a 6-day lag, and 2026-11-06 was missing (-999). The ET0 inputs are therefore complete only to about 6 days ago. — [POWER daily point API](https://power.larc.nasa.gov/api/temporal/daily/point)
- **Open-Meteo Historical Weather API.**
  - Models and lags: ERA5 is 0.25°, from 1940, updated daily with a 5-day delay. ERA5-Land is 0.1°, from 1950, also 5-day delay. ECMWF IFS is 9 km, from 2017, with no delay. — [Open-Meteo docs](https://open-meteo.com/en/docs/historical-weather-api)
  - ET0: `et0_fao_evapotranspiration` is a daily sum in mm, computed with FAO-56 Penman-Monteith from temperature, wind, humidity and radiation. — [Open-Meteo docs](https://open-meteo.com/en/docs/historical-weather-api)
  - Model mixing: the default "best match" blends IFS HRES, ERA5 and ERA5-Land. "ERA5-Seamless" takes temperature and humidity from ERA5-Land, and wind and radiation from ERA5. The docs advise using only ERA5 or only ERA5-Land for multi-decade studies, to avoid model-upgrade breaks. — [Open-Meteo docs](https://open-meteo.com/en/docs/historical-weather-api)
  - Key: non-commercial use needs no API key; only commercial use does. — [Open-Meteo docs](https://open-meteo.com/en/docs/historical-weather-api)
  - Checked here on 2026-11-22: `models=era5_land` at 9.6N 106.0E returned Tmax up to 2026-11-16, a 6-day lag. **`et0_fao_evapotranspiration` came back null for every day with `era5_land`.** A second query (ERA5, best_match, era5_seamless) failed with "Daily API request limit exceeded", because the sandbox IP is shared. The ERA5 ET0 path is therefore untested. A pipeline that makes many requests needs to throttle them.
- **AgERA5 (Copernicus agro-meteorological indicators).**
  - Version 2.0 was published on the CDS on 15 May 2025. — [ECMWF forum](https://forum.ecmwf.int/t/new-agera5-version-2-now-available-on-the-cds/13088)
  - Status: an ECMWF forum topic is titled "Scientific and technical support for AgERA5 ending from 31-12-2025". Another topic, active in June 2026, says v1.1 is being deprecated in favour of v2. — [ECMWF forum, agera5 tag](https://forum.ecmwf.int/tag/agera5/37)
  - Updates: the CDS lists the update frequency as daily. — [CDS AgERA5](https://cds.climate.copernicus.eu/datasets/sis-agrometeorological-indicators)
  - Lag: the GEE community catalogue and an older ECMWF reply give a 7-day lag. — [GEE community catalog](https://gee-community-catalog.org/projects/agera5_datasets/); [ECMWF forum](https://forum.ecmwf.int/t/agera-5-frequency-update/1118)
- **CHIRTS-ERA5.**
  - Coverage: daily Tmax and Tmin at 0.05°, quasi-global (60S–70N), 1980 to near-present. — [CHC data](https://www.chc.ucsb.edu/data); [CHC CHIRTS-ERA5](https://chc.ucsb.edu/node/499)
  - Method: Tmax is ERA5 Tmax adjusted by a correction to a 1983–2016 monthly climatology. Tmin comes from ERA5's diurnal temperature range. — [CHC CHIRTS-ERA5](https://chc.ucsb.edu/node/499)
  - Lag: CHC pages give 5 days on one and 6 days on another. — [CHC data](https://www.chc.ucsb.edu/data); [CHC](https://chc.ucsb.edu/node/499)
  - Older CHIRTS-daily is in Google Earth Engine. — [GEE](https://developers.google.com/earth-engine/datasets/catalog/UCSB-CHG_CHIRTS_DAILY)
- **MSWX.**
  - Data: 3-hourly at 0.1°, from 1979, with "near real-time updates". The page states no lag figure. — [GloH2O MSWX](https://www.gloh2o.org/mswx/)
  - Licence and access: CC BY-NC 4.0, and data come via a request form and a Google Drive link. — [GloH2O MSWX](https://www.gloh2o.org/mswx/)
- **GSOD/ISD stations.** These are from the ISD station list, checked here.
  - Can Thơ (489125, VVCT, 10.083N 105.717E), Cà Mau (489140), Rạch Giá (489070), Phú Quốc (489170) and Côn Sơn (489180) all end on **2025-08-24**. No 2026 GSOD files exist for Can Thơ, Cà Mau or Rạch Giá (HTTP 404).
  - Sóc Trăng (489130, "BA-XUYEN/SOC TRANG") ends in 1997, and Vĩnh Long (489100) also ends in 1997.
  - Every GSOD Tmax at Can Thơ in 2019 has the `*` attribute (365 of 365 days). That marks it as derived from the synoptic or hourly reports rather than a reported maximum.
  - — [ISD history](https://www.ncei.noaa.gov/pub/data/noaa/isd-history.csv); [GSOD access](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/)
- **Vietnamese research access to station data.** A Mekong Delta dengue study used ERA5-Land daily temperature alongside 18 VNMHA stations, so researchers do get station data. — [arXiv 2412.15645](https://arxiv.org/pdf/2412.15645)

### Inferences
- If Open-Meteo is used for ET0, the call should probably use `models=era5`, since the ERA5-Land query returned null ET0. This needs one more test once the quota resets.
- Open-Meteo's lag (about 5–6 days) matches POWER's radiation lag (6 days), so a switch would not cost freshness.
- MSWX's NC licence sits awkwardly with the app's CC BY 4.0 content licence. The request-form access is also harder to automate than POWER or Open-Meteo.

### Gaps
- I did not check FAO WaPOR reference ET (coverage of Vietnam, resolution, lag) or GLEAM. GLEAM is known to give actual ET and potential evaporation rather than FAO-56 grass ET0, but I did not verify that this session.
- I did not verify the exact Copernicus or ERA5 licence text or Open-Meteo's data licence.
- KTTV station data access (cost, formats) was not checked. Earlier notes say `*.gov.vn` sites are unreachable from the sandbox.

## Q2. Validation evidence for Vietnam and Southeast Asia (Tmax, heat days, ET0, coastal cells)

### Takeaway
I found no published study that compares NASA POWER, ERA5-Land or AgERA5 with Mekong Delta stations. My own check at three delta stations (GSOD, 2011–2025) shows NASA POWER Tmax with a seasonal bias: about +2.5 to +3.9 °C in Feb–Apr and about −1.5 to −2 °C in Jun–Nov. It raises the count of days ≥35 °C by 2–3× at Can Thơ and Cà Mau and about 24× at Rạch Giá. At the first two, part of that gap may be station under-reading. POWER also produces zero "cold snap" nights. Across Vietnam, ERA5 is the best long reanalysis, but no study shows ERA5-Land beating POWER in the delta.

### Cited Findings
- **My check: POWER vs GSOD at the station coordinates.** Data are POWER (community=AG) and GSOD at the same point, 2011–2025. Can Thơ has GSOD data only for 2014–2025. — [GSOD](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/); [POWER API](https://power.larc.nasa.gov/api/temporal/daily/point)

  | Station | Days | Tmax bias | Tmax RMSE | Tmax r | Days ≥35 °C, station | Days ≥35 °C, POWER | p95 Tmax, station / POWER | Tmin bias / RMSE / r |
  |---|---|---|---|---|---|---|---|---|
  | Can Thơ | 4044 | −0.04 | 2.52 | 0.63 | 330 | 790 | 35.0 / 38.4 | −0.13 / 1.18 / 0.73 |
  | Cà Mau | 5293 | −0.66 | 2.09 | 0.52 | 110 | 318 | 34.3 / 35.2 | +0.16 / 1.08 / 0.71 |
  | Rạch Giá | 5229 | +0.58 | 2.42 | 0.55 | 34 | 819 | 33.7 / 37.0 | −0.40 / 1.34 / 0.74 |

  - Bias by month (POWER − station Tmax, °C):
    - Can Thơ: Jan +0.5, Feb +2.5, Mar +3.7, Apr +2.7, May +0.4, Jun–Nov −1.4 to −1.7, Dec −0.5.
    - Cà Mau: Feb +1.7, Mar +2.0, Jun–Nov −1.6 to −2.1.
    - Rạch Giá: Jan +1.9, Feb +3.4, Mar +3.9, Apr +2.4, Jun–Nov −0.8 to −1.1.
  - Spread: the standard deviation of POWER Tmax is 3.22 °C at Can Thơ against 1.94 °C at the station, and 2.80 against 1.76 at Rạch Giá. POWER's highest Tmax is 43.7 °C at Can Thơ, where the station's highest is 37.0 °C.
  - Cold-snap nights (Tmin at least 4.2 °C below the previous night): Can Thơ has 2 at the station and 0 in POWER, Cà Mau 3 and 0, Rạch Giá 16 and 0.
  - Caveat: GSOD Tmax and Tmin are derived from synoptic reports (`*` flag), which can miss the true daily peak, probably by well under 1 °C. If every station Tmax were 1 °C too low, the stations' count of days ≥34 °C (843 / 431 / 207) would roughly match POWER's count of days ≥35 °C at Can Thơ (790) and Cà Mau (318). So at those two stations, part of the heat-day gap could be station under-reading. At Rạch Giá (207 against 819) the gap remains. The +2.5 to +3.9 °C Feb–Apr bias, matched by a −1.5 to −2 °C wet-season bias, is a seasonal pattern that a sampling effect cannot explain.
- **AFD Research Paper 396** (Nguyen Ngoc-Minh and Ngo Duc, Jan 2026). It evaluates 20CR, ERA5, ERA-20C and CERA-20C against Vietnamese stations for 1961–2010. All four capture temperature climatology reasonably, and ERA5 does best. It includes neither POWER/MERRA-2 nor ERA5-Land. — [AFD RP 396](https://www.afd.fr/en/resources/evaluating-performance-selected-reanalysis-datasets-over-vietnam)
- **AFD Research Paper 395** (Nguyen-Xuan et al., Dec 2025, the VnHGC gridded dataset), on ERA5-Land vs stations for 1961–1980:
  - Bias direction: "ERA5-LAND tends to fall below the diagonal, indicating a general cold bias relative to observations … underestimates temperatures by 1–3 °C in most cases and by up to ~10 °C in some extreme cases".
  - Lowlands: the same paper also says "ERA5-LAND tends to overestimate temperature values in lowland areas and underestimate them in mountainous regions".
  - Southern Vietnam: south of 17N the station correction barely changed ERA5-Land, because the southern stations had little data in that period.
  - Cities: it cites Nguyen-Xuan et al. (2025), who found ERA5 and VnGC have cold biases in cities and warm biases in mountains, "with the biases in ERA5 being more pronounced", for Hanoi and Ho Chi Minh City.
  - — [AFD RP 395](https://www.afd.fr/sites/default/files/2025-12/pr395_va.pdf)
- **Jewitt, Uijlenhoet and Mul (2026, Hydrological Sciences Journal).** They compare ERA5, AgERA5 and GEOS5 with 174 in situ sites in Africa and Southwest Asia. GEOS5, the NASA GEOS family that MERRA-2 belongs to, is less accurate than ERA5 and AgERA5. Propagating ERA5's uncertainty through the FAO-56 equation gives "particularly high uncertainty in the tropics". — [WUR eDepot](https://edepot.wur.nl/709304); [TU Delft record](https://repository.tudelft.nl/record/uuid:075e96c4-3984-456c-b345-9935c1d52c84)
- **Thailand.** A study tested ERA5-Land and GLEAM PET against station Penman-Monteith. A new RPET model did better than both (r = 0.80, RMSE = 1.06 mm/day). The bias of ERA5-Land itself was not in the snippet I saw. — [ANRES (Thai journal)](https://li01.tci-thaijo.org/index.php/anres/article/download/243750/166372/837222)
- **NASA POWER for ET0 elsewhere.** A study of 21 stations in several climates found POWER incident solar radiation overestimated in all climates except BSh. — [Pesq. Agropec. Bras. 2023](https://doaj.org/article/fd33ee8754a249f08525fc405f9447d9)
- **Mekong Delta station ET0 values.** A Cần Thơ University study gives daily ET0 of 1.8–7.5 mm and monthly means of 3.5–5.0 mm/day by Penman-Monteith. — [J. Climate Change (IOS Press)](https://content.iospress.com/articles/journal-of-climate-change/jcc220016)
- **ERA5-Land coastal cells.**
  - ERA5-Land is land-only. Cells with a land fraction under 0.5 are not treated as land, and the mask counts sea and fresh water together. — [ECMWF forum](https://forum.ecmwf.int/t/merge-era5-land-and-era5-coastal-cells/846); [ECMWF forum](https://forum.ecmwf.int/t/era5-land-the-land-sea-mask-is-now-available-invariant-parameters/1294)
  - Users report cells whose mask value disagrees with whether data exist, and Inf values in coastal cells. — [ECMWF forum](https://forum.ecmwf.int/t/era5-land-land-mask-vs-what-is-actually-land/13114); [ECMWF forum](https://forum.ecmwf.int/t/inf-values-in-era5-land-hourly-dataset/14702)

### Inferences
- POWER's annual mean Tmax bias is near zero, so monthly means look fine. Its dry-season warm bias of +2.5 to +3.9 °C falls in the months the app counts heat days (Feb–Apr), so **the app's "days ≥35 °C" is very likely inflated, by 2–3× at Can Thơ and Cà Mau and about 24× at Rạch Giá**. Its "cold snap" count is likely zero for reasons of method: a 50 km MERRA-2 cell smooths out day-to-day Tmin drops.
- The pest-pressure rule (BPH from temperature) uses monthly temperature. The ±2–4 °C seasonal swing in bias matters there too: it overstates the dry-season peak and understates the wet season.
- The evidence that ERA5-Land would do better here is indirect. ERA5 leads the long reanalyses in Vietnam, and GEOS5 trails ERA5 for ET0 inputs in another tropical and dry region. ERA5-Land itself shows a 1–3 °C cold bias against Vietnamese stations in 1961–80, which may go the other way in lowlands. **Nobody, including me this session, has tested ERA5-Land or CHIRTS-ERA5 against delta stations.** The GSOD script can do that once ERA5-Land series are fetched; Open-Meteo hit its daily quota here.
- ERA5-Land should handle the coast at the 0.1° pins better than a 0.5° × 0.625° POWER cell, but this is not demonstrated for the delta. Pins on a coastal cell with land fraction under 0.5 return no ERA5-Land data, so a pipeline needs a fallback to the nearest land cell or to ERA5.

### Gaps
- No peer-reviewed Mekong Delta comparison of any gridded product with stations for Tmax, heat days or ET0 was found.
- I did not obtain the full text of the 2026 HSJ ET0 paper (site-level tropical results) or of AFD RP 396 (the PDF download was broken).
- A search snippet said ERA5 underestimates Tmax and overestimates Tmin in Southeast Asia (GHCN-Daily, 1979–2018). I could not pin it to a source, so it is not cited.
- No validation of the station-derived ET0 was possible: GSOD has no radiation, and its humidity comes from dewpoint.

## Q3. Recommendation: which source for ET0, which for temperatures and heat days, and the longest consistent start

### Takeaway
The evidence is strong enough to say POWER is **not** fit for heat days or cold snaps in the delta. It does not yet prove which replacement is better. The cheapest strong next step is to fetch ERA5-Land and ERA5 daily series from Open-Meteo, plus CHIRTS-ERA5, for the three GSOD stations, rerun `research/scripts/gsod_vs_power_tmax.py`, and switch to whichever wins.

### Cited Findings
- Open-Meteo serves ERA5 from 1940 and ERA5-Land from 1950, with about a 5-day lag, FAO-56 ET0 and no key. It recommends using a single model, not "best match", for multi-decade consistency. — [Open-Meteo docs](https://open-meteo.com/en/docs/historical-weather-api)
- CHIRTS-ERA5 gives 0.05° Tmax/Tmin from 1980, with a 5–6 day lag. — [CHC](https://chc.ucsb.edu/node/499)
- ERA5 is the best of the long reanalyses tested against Vietnamese stations. — [AFD RP 396](https://www.afd.fr/en/resources/evaluating-performance-selected-reanalysis-datasets-over-vietnam)
- GSOD at Can Thơ, Cà Mau and Rạch Giá has daily data to 2025-08-24 (Can Thơ only from 2014), which is enough to validate the 2011–2025 seasons. — [ISD history](https://www.ncei.noaa.gov/pub/data/noaa/isd-history.csv)

### Inferences
- **ET0, tentative:** Open-Meteo `models=era5` `et0_fao_evapotranspiration`, from a single model, starting Dec 2000 to match `build.PERIOD`. It could go back to 1940. It is the simplest pipeline: one JSON call per pin, no key, and the same FAO-56 method the app already uses. The ERA5-Land model returned no ET0. Validate before switching: compare its monthly ET0 with POWER-based ET0 and with Mekong values (3.5–5.0 mm/day monthly).
- **Tmax, heat days, cold snaps, mean temperature, tentative:** ERA5-Land (0.1°) via Open-Meteo, or CHIRTS-ERA5 (0.05°). Pick by the GSOD test. CHIRTS is station-anchored to a climatology and finer. ERA5-Land is simpler, since it is the same API as ET0. Either way, the GSOD numbers above argue against keeping POWER for heat days.
- **AgERA5:** its scientific support ended on 31 Dec 2025, and access needs a CDS account. That is not simpler than Open-Meteo, so do not adopt it.
- **Start year:** ERA5 is consistent from 1940 and ERA5-Land from 1950. CHIRTS starts in 1980 (1983 for CHIRTS-daily per CHC), and POWER's MERRA-2 meteorology starts in 1981. Keeping Dec 2000 as the start costs nothing and keeps the current seasons comparable. A longer baseline only matters if El Niño samples are too few.
- Whatever source is chosen, the app text should keep saying the numbers are model estimates, not readings.

### Gaps
- The head-to-head numbers for ERA5-Land, ERA5 and CHIRTS against GSOD are missing; that is the one test needed before deciding.
- Inland pins (Sóc Trăng interior, Tây Ninh) were not checked. All three GSOD stations are in the west or south of the delta, and Can Thơ is an airport site.
