# Weather station test: POWER vs ERA5, ERA5-Land and CHIRTS-ERA5 against Mekong Delta stations

Researched 2026-11-22. This is the head-to-head test that `weather_et0.md` could not finish. "Measured here" marks numbers I computed in this session.

Scripts (all new, in `research/scripts/`):
- `weather_station_fetch.py`: GSOD, POWER, and the Open-Meteo API.
- `weather_station_era5_s3.py`: ERA5 and ERA5-Land read from Open-Meteo's public S3 copy.
- `weather_station_chirts.py`: CHIRTS-ERA5 by HTTP range reads of the yearly netCDF files.
- `weather_station_compare.py`: all the tables below.

Raw data are in the session scratchpad (`.../scratchpad/stations/`), not in the repo.

Setup:
- Stations, with GSOD ids and coordinates:
  - Cần Thơ: 48912599999, 10.083N 105.717E. GSOD has data from 2014-04-23.
  - Cà Mau: 48914099999, 9.183N 105.150E.
  - Rạch Giá: 48907099999, 10.000N 105.083E.
- Period: 2011-01-02 to 2025-08-24, the last GSOD day at all three stations. A day is compared only if every source has it.
- Day length: gridded hourly data are summed over the local day (UTC+7).
- Cold-snap night: Tmin at least 4.2 °C below the previous night's Tmin. This is the app's `PESTS["shrimp"]["cold_drop_c"]`.
- Heat day: Tmax ≥ 35 °C.
- ERA5 cell: the cell Open-Meteo's API picks (`cell_selection=land`). At Cần Thơ and Cà Mau it is the nearest cell, and the API and S3 series agree to within about 0.05 °C. At Rạch Giá the API picks 10.0N 105.25E, not the nearest cell (10.0N 105.0E, mostly sea). Both are reported below.

## Q1. Temperature: which source matches the stations for heat days, cold snaps and monthly mean temperature?

### Takeaway
All three ERA5-based sources beat NASA POWER clearly on every temperature measure.
- **Monthly mean temperature:** ERA5 (0.25°, via Open-Meteo) wins. Its RMSE of monthly means is 0.34–0.44 °C, against 0.77–1.21 °C for POWER, and it has no seasonal swing.
- **Heat days:** ERA5-Land comes closest at 2 of the 3 stations. All three ERA5 sources under-count Cần Thơ, an airport station, by about 2.7×. POWER over-counts 2.4× to 24×.
- **Cold snaps:** no gridded source produces a single night with a drop of 4.2 °C or more. Most station "cold snaps" are artefacts of sparse observations, so none of the sources can be called the winner, and the rule cannot be validated with GSOD.

### Cited Findings
**Daily Tmax and Tmin against GSOD, measured here.** Bias is source minus station, in °C. Sources:
- [GSOD](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/)
- [NASA POWER daily API](https://power.larc.nasa.gov/api/temporal/daily/point)
- [Open-Meteo archive API](https://open-meteo.com/en/docs/historical-weather-api)
- [Open-Meteo S3 (ERA5, ERA5-Land)](https://openmeteo.s3.amazonaws.com/data/copernicus_era5/static/meta.json)
- [CHIRTS-ERA5](https://data.chc.ucsb.edu/experimental/CHIRTS-ERA5/)

Cần Thơ (4,043 days, 2014-04 to 2025-08). The station's SD of Tmax is 1.94. It has 330 days ≥35 °C and 2 nights with a drop of 4.2 °C or more.

| Source (cell) | Tmax bias Feb–Apr | Tmax bias Jun–Nov | Tmax RMSE | Tmax r | SD Tmax | Days ≥35 | Tmin bias Feb–Apr | Tmin bias Jun–Nov | Tmin RMSE | Cold snaps |
|---|---|---|---|---|---|---|---|---|---|---|
| POWER (0.5×0.625°) | +2.96 | −1.56 | 2.52 | 0.63 | 3.22 | 790 | +0.03 | −0.10 | 1.18 | 0 |
| ERA5 (10.0, 105.75) | −0.70 | −0.56 | 1.16 | 0.86 | 1.81 | 124 | +0.87 | +0.75 | 1.21 | 0 |
| ERA5-Land (10.1, 105.7) | −0.43 | −1.48 | 1.69 | 0.78 | 1.88 | 120 | −0.01 | −0.22 | 1.03 | 0 |
| CHIRTS-ERA5 (10.075, 105.725) | +0.29 | −0.13 | 1.02 | 0.85 | 1.61 | 124 | +1.72 | +1.20 | 1.67 | 0 |

Cà Mau (5,292 days, 2011-01 to 2025-08). The station's SD of Tmax is 1.81. It has 110 days ≥35 °C and 3 cold-snap nights.

| Source (cell) | Tmax bias Feb–Apr | Tmax bias Jun–Nov | Tmax RMSE | Tmax r | SD Tmax | Days ≥35 | Tmin bias Feb–Apr | Tmin bias Jun–Nov | Tmin RMSE | Cold snaps |
|---|---|---|---|---|---|---|---|---|---|---|
| POWER | +1.46 | −1.85 | 2.09 | 0.52 | 2.20 | 318 | −0.05 | +0.44 | 1.08 | 0 |
| ERA5 (9.25, 105.25) | +0.57 | −0.33 | 1.14 | 0.80 | 1.74 | 133 | −0.60 | −0.36 | 0.91 | 0 |
| ERA5-Land (9.2, 105.1) | +0.36 | −1.41 | 1.74 | 0.64 | 1.82 | 109 | −1.36 | −0.97 | 1.52 | 0 |
| CHIRTS-ERA5 (9.175, 105.175) | −0.21 | +0.23 | 1.06 | 0.81 | 1.51 | 31 | −0.68 | +0.83 | 1.11 | 0 |

Rạch Giá (5,228 days, 2011-01 to 2025-08). The station's SD of Tmax is 1.76. It has 34 days ≥35 °C and 16 cold-snap nights.

| Source (cell) | Tmax bias Feb–Apr | Tmax bias Jun–Nov | Tmax RMSE | Tmax r | SD Tmax | Days ≥35 | Tmin bias Feb–Apr | Tmin bias Jun–Nov | Tmin RMSE | Cold snaps |
|---|---|---|---|---|---|---|---|---|---|---|
| POWER | +3.24 | −0.91 | 2.42 | 0.55 | 2.80 | 819 | −0.10 | −0.46 | 1.34 | 0 |
| ERA5, API land cell (10.0, 105.25) | +0.95 | +0.29 | 1.26 | 0.79 | 1.83 | 163 | −0.22 | −0.47 | 1.20 | 0 |
| ERA5, nearest cell (10.0, 105.0), mostly sea | −0.88 | −1.47 | 1.63 | 0.78 | 1.41 | 1 | +0.56 | +0.14 | 1.18 | 0 |
| ERA5-Land (10.0, 105.1) | +0.32 | −1.08 | 1.41 | 0.74 | 1.83 | 68 | −0.61 | −0.98 | 1.46 | 0 |
| CHIRTS-ERA5 (10.025, 105.075) | +1.17 | +0.95 | 1.47 | 0.80 | 1.48 | 77 | +1.59 | +1.68 | 1.99 | 0 |

**Heat days ≥35 °C per year (mean), measured here.**

| Station | Station | POWER | ERA5 | ERA5-Land | CHIRTS-ERA5 |
|---|---|---|---|---|---|
| Cần Thơ | 29.8 | 71.4 | 11.2 | 10.8 | 11.2 |
| Cà Mau | 7.6 | 21.9 | 9.2 | 7.5 | 2.1 |
| Rạch Giá | 2.4 | 57.2 | 11.4 | 4.8 | 5.4 |
| Mean absolute log-ratio to the station (lower is better) | — | 1.70 | 0.91 | **0.57** | 1.02 |

- **Robustness check on days with a reported station maximum.** GSOD flags a derived Tmax with `*`; I kept only days where MAX has no flag.
  - Cà Mau (2,894 such days): station 85 days ≥35 °C, POWER 167, ERA5 57, ERA5-Land 52, CHIRTS 10.
  - Rạch Giá (1,436 such days): station 29, POWER 234, ERA5 (land cell) 50, ERA5-Land 35, CHIRTS 35.
  - Cần Thơ has no unflagged days. All its Tmax values are derived from 24 hourly observations a day (median), whereas Cà Mau and Rạch Giá have only 8 observations a day.
  - — [GSOD](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/)

**Monthly mean temperature, (Tmax+Tmin)/2, measured here.** Bias is source minus station by calendar month, Jan to Dec. The last column is the RMSE over individual month-year means.

| Station / source | J | F | M | A | M | J | J | A | S | O | N | D | RMSE |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cần Thơ POWER | −0.1 | +1.0 | +1.9 | +1.5 | +0.5 | −0.6 | −0.6 | −0.9 | −0.8 | −1.1 | −1.2 | −0.8 | 1.21 |
| Cần Thơ ERA5 | −0.1 | −0.0 | +0.1 | +0.1 | +0.3 | +0.2 | +0.2 | +0.1 | +0.2 | −0.0 | −0.1 | +0.1 | **0.34** |
| Cần Thơ ERA5-Land | −0.5 | −0.2 | +0.0 | −0.4 | −0.6 | −0.7 | −0.6 | −0.8 | −0.7 | −1.0 | −1.1 | −0.6 | 0.79 |
| Cần Thơ CHIRTS-ERA5 | +1.1 | +1.0 | +1.0 | +1.0 | +0.5 | +0.9 | +0.7 | +1.0 | +0.6 | +0.1 | −0.1 | +0.4 | 0.85 |
| Cà Mau POWER | −0.2 | +0.6 | +1.0 | +0.5 | −0.0 | −0.5 | −0.6 | −0.8 | −0.6 | −0.8 | −0.9 | −0.7 | 0.77 |
| Cà Mau ERA5 | −0.3 | +0.1 | +0.2 | −0.3 | −0.3 | −0.2 | −0.3 | −0.3 | −0.3 | −0.5 | −0.5 | −0.4 | **0.44** |
| Cà Mau ERA5-Land | −0.8 | −0.2 | −0.2 | −1.1 | −1.2 | −1.0 | −1.0 | −1.2 | −1.1 | −1.4 | −1.4 | −1.1 | 1.12 |
| Cà Mau CHIRTS-ERA5 | −0.1 | −0.4 | −0.5 | −0.5 | −0.1 | +0.7 | +0.6 | +0.7 | +0.9 | +0.5 | −0.2 | −0.2 | 0.57 |
| Rạch Giá POWER | +0.5 | +1.6 | +2.0 | +1.1 | +0.2 | −0.6 | −0.5 | −0.7 | −0.5 | −0.8 | −1.0 | −0.4 | 1.11 |
| Rạch Giá ERA5 (land cell) | +0.1 | +0.3 | +0.6 | +0.1 | −0.1 | −0.2 | −0.1 | −0.1 | +0.1 | −0.0 | −0.1 | +0.1 | **0.39** |
| Rạch Giá ERA5-Land | −0.3 | +0.0 | +0.2 | −0.6 | −1.0 | −1.1 | −1.0 | −1.1 | −0.9 | −1.0 | −1.1 | −0.6 | 0.89 |
| Rạch Giá CHIRTS-ERA5 | +1.6 | +1.5 | +1.4 | +1.3 | +1.2 | +1.6 | +1.6 | +1.7 | +1.8 | +0.9 | +0.3 | +0.8 | 1.39 |

**Cold snaps, measured here.** No source has a single night with a drop of 4.2 °C or more over the common days, at any of the three stations. Night-to-night Tmin drops, given as largest drop / nights ≥3 °C / nights ≥2 °C:

| Station | Station | POWER | ERA5 | ERA5-Land | CHIRTS-ERA5 |
|---|---|---|---|---|---|
| Cần Thơ | 5.0 / 18 / 173 | 3.8 / 4 / 32 | 3.7 / 2 / 15 | 3.0 / 2 / 13 | 3.9 / 1 / 15 |
| Cà Mau | 4.7 / 23 / 108 | 3.4 / 1 / 10 | 3.2 / 1 / 18 | 2.9 / 0 / 15 | 3.5 / 4 / 17 |
| Rạch Giá | 8.8 / 77 / 236 | 3.2 / 3 / 24 | 3.1 / 2 / 27 | 3.0 / 0 / 18 | 3.2 / 1 / 23 |

- **Most station cold snaps look like artefacts.** I listed all 21 station events (≥4.2 °C).
  - In most of them, the "previous night" Tmin is 27–32 °C (for example 89.6 °F at Cần Thơ on 2020-04-22, or 86.9 °F at Rạch Giá). A night minimum that high is implausible in the delta.
  - Those days have only 4–8 observations (Rạch Giá 2012–2015 has 4 a day), or the drop follows a rainy evening.
  - Only Cần Thơ 2017-12-24 → 25 looks like a real cold surge. It has 24 observations a day, and Tmin fell from 24.0 to 19.0 °C on a day with rain.
  - The sources show the same night as a smaller drop: CHIRTS-ERA5 23.8 → 20.0 (3.8), ERA5 22.5 → 19.5 (3.0), ERA5-Land 21.7 → 19.6 (2.1), POWER 22.1 → 20.8 (1.3).
  - — [GSOD](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/) (TEMP_ATTRIBUTES = number of observations)
- **Day alignment check.** I compared Tmin correlation with the same day against the next day.
  - Cần Thơ correlates better with the next day in every ERA5 source, for example ERA5 0.78 same day against 0.82 next day. This fits a GSOD day that runs on UTC (07:00–06:59 local), so it catches the next dawn.
  - Cà Mau and Rạch Giá correlate best with the same day.
  - This shifts the Cần Thơ Tmin numbers a little but does not change any ranking.
- **CHIRTS-ERA5 method.** It rescales daily ERA5 Tmax to the 1983–2016 CHIRTS monthly mean and standard deviation. Tmin is that Tmax minus ERA5's daily temperature range. Any warm bias in the CHIRTS climatology therefore carries into Tmin, which matches the +1.2 to +1.7 °C Tmin bias seen here. — [CHIRTS-ERA5 readme](https://data.chc.ucsb.edu/experimental/CHIRTS-ERA5/aaa.readme.txt)
- **ERA5 bias globally.** CHC says "ERA5 shows significant cool bias globally, and most notably in Africa". The ERA5 cool bias here is small (−0.3 to −0.7 °C on Tmax, except the Rạch Giá sea cell). — [CHC CHIRTS-ERA5 page](https://www.chc.ucsb.edu/data/chirts-era5)

### Inferences
- **(a) Heat days.**
  - POWER should be replaced. It over-counts 2.4× (Cần Thơ), 2.9× (Cà Mau) and 24× (Rạch Giá).
  - ERA5-Land is the best of the three tested. It is within 1% at Cà Mau, 2× at Rạch Giá (1.2× on reported-max days), and 0.36× at Cần Thơ.
  - All three ERA5 sources under-count Cần Thơ by the same amount. That points to the station (an airport at the edge of a city, Tmax from hourly reports) being hotter than its surroundings, rather than to a source error. The app's pins are rice fields, which are more like the gridded cells.
  - ERA5 at 0.25° is close behind. It is good at Cà Mau but 4.8× at Rạch Giá, and **very sensitive to which cell is picked near the coast**: 163 against 1 heat day at Rạch Giá.
  - CHIRTS-ERA5 has the lowest Tmax RMSE at two stations, but its spread is too narrow (SD 1.5 against 1.8 at the stations), so it under-counts Cà Mau 3.5×.
  - Lean: ERA5-Land, with only modest confidence over ERA5.
- **(b) Cold snaps: no source clearly wins.**
  - No gridded product reaches the 4.2 °C threshold even once in 11–15 years. The only plausible real event is shown as a 2.1–3.8 °C drop.
  - The station counts are inflated by sparse observations, so GSOD cannot tell which source is right.
  - Switching sources will not make the shrimp cold-snap rule fire. The threshold or the rule needs rethinking, for example a drop over 2–3 days or a lower threshold for 0.1–0.25° data. That is a model decision, not a data-source decision.
- **(c) Monthly mean temperature.**
  - ERA5 (0.25°) wins at all three stations. The monthly bias stays within ±0.6 °C, and RMSE is 0.34–0.44 °C.
  - ERA5-Land runs about 1 °C cold in May–Dec at all three.
  - CHIRTS-ERA5 runs +1 to +1.7 °C warm at Cần Thơ and Rạch Giá.
  - POWER has a seasonal swing of +1 to +2 °C in Feb–Apr and −0.5 to −1.2 °C in Jun–Dec. That swing feeds straight into the rice pest rule, which uses monthly mean temperature.
- With two winners (ERA5-Land for heat days, ERA5 for mean temperature), one source is simpler. ERA5 through Open-Meteo is the safer single choice: second-best on heat days, best on means, and the only one with working ET0 (Q2). ERA5-Land is the choice only if heat days matter more than monthly means.

### Gaps
- Only three stations, all in the west and south of the delta. None is in Sóc Trăng or Tây Ninh. GSOD's Sóc Trăng station stops in 1997.
- GSOD Tmax and Tmin come from synoptic reports and are not instrument maxima. Station heat-day counts are themselves uncertain, by perhaps 0.5–1 °C at the tail.
- I did not test 2–3 day cooling events or other cold-snap definitions.

## Q2. ET0: Open-Meteo ERA5 FAO-56 against the app's POWER-based Penman–Monteith

### Takeaway
POWER-based ET0, using the app's own `et0_penman`, is about 9.5% higher per year than Open-Meteo's ERA5 `et0_fao_evapotranspiration` at all three stations. The gap is almost all in Jan–May, worst in March and April (+0.7 to +1.0 mm/day), and near zero in Aug–Dec. The excess comes from POWER's drier air, stronger wind and hotter Tmax in the dry season, not from sunshine. The station Hargreaves check sides with ERA5 in Feb–Apr. **ERA5 wins for ET0.** ERA5-Land has no ET0 on the Open-Meteo API: every value is null.

### Cited Findings
**Monthly ET0, mm/day**, as calendar-month means over months where every series has at least 25 days, measured here. "PM" is the app's `pipeline/build.py` `et0_penman`. "OM" is Open-Meteo `et0_fao_evapotranspiration` with `models=era5`. Sources: [POWER API](https://power.larc.nasa.gov/api/temporal/daily/point); [Open-Meteo API](https://open-meteo.com/en/docs/historical-weather-api)

| Station / series | J | F | M | A | M | J | J | A | S | O | N | D | Year (mm) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cần Thơ POWER PM | 3.95 | 5.14 | 6.11 | 5.94 | 4.81 | 3.96 | 3.60 | 3.72 | 3.55 | 3.45 | 3.40 | 3.43 | 1551 |
| Cần Thơ OM ERA5 | 3.79 | 4.55 | 5.08 | 4.99 | 4.15 | 3.66 | 3.42 | 3.68 | 3.34 | 3.20 | 3.33 | 3.43 | 1417 |
| Cần Thơ ERA5 inputs + app PM | 3.75 | 4.49 | 5.06 | 5.04 | 4.30 | 3.82 | 3.57 | 3.84 | 3.48 | 3.30 | 3.39 | 3.43 | 1443 |
| Cần Thơ station Hargreaves | 3.76 | 4.34 | 4.83 | 5.01 | 4.73 | 4.41 | 4.15 | 4.27 | 4.11 | 3.92 | 3.62 | 3.41 | 1538 |
| Cà Mau POWER PM | 4.31 | 5.44 | 6.19 | 5.76 | 4.69 | 3.94 | 3.71 | 3.87 | 3.65 | 3.60 | 3.48 | 3.56 | 1586 |
| Cà Mau OM ERA5 | 4.01 | 4.86 | 5.16 | 4.91 | 4.11 | 3.71 | 3.54 | 3.80 | 3.39 | 3.33 | 3.37 | 3.53 | 1450 |
| Cà Mau ERA5 inputs + app PM | 3.99 | 4.81 | 5.16 | 4.97 | 4.25 | 3.85 | 3.69 | 3.94 | 3.53 | 3.43 | 3.42 | 3.54 | 1477 |
| Cà Mau station Hargreaves | 3.31 | 3.68 | 4.11 | 4.40 | 4.25 | 3.96 | 3.85 | 3.97 | 3.81 | 3.62 | 3.28 | 3.12 | 1380 |
| Rạch Giá POWER PM | 4.14 | 5.29 | 5.96 | 5.58 | 4.74 | 4.05 | 3.78 | 3.87 | 3.63 | 3.56 | 3.48 | 3.61 | 1571 |
| Rạch Giá OM ERA5 | 3.86 | 4.66 | 5.09 | 4.87 | 4.12 | 3.66 | 3.47 | 3.71 | 3.36 | 3.33 | 3.43 | 3.61 | 1433 |
| Rạch Giá ERA5 inputs + app PM | 3.95 | 4.61 | 5.02 | 4.93 | 4.31 | 3.94 | 3.75 | 3.94 | 3.61 | 3.50 | 3.58 | 3.80 | 1487 |
| Rạch Giá station Hargreaves | 3.28 | 3.85 | 4.24 | 4.15 | 3.73 | 3.23 | 3.15 | 3.13 | 3.14 | 3.30 | 3.25 | 3.10 | 1263 |

**Monthly bias, POWER PM minus OM ERA5, mm/day**, measured here.

| Station | J | F | M | A | M | J | J | A | S | O | N | D | Year |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cần Thơ | +0.16 | +0.59 | +1.03 | +0.95 | +0.66 | +0.30 | +0.18 | +0.04 | +0.21 | +0.25 | +0.07 | 0.00 | +134 mm (+9.5%) |
| Cà Mau | +0.30 | +0.58 | +1.03 | +0.85 | +0.58 | +0.23 | +0.17 | +0.07 | +0.26 | +0.27 | +0.11 | +0.03 | +136 mm (+9.4%) |
| Rạch Giá | +0.28 | +0.63 | +0.87 | +0.71 | +0.62 | +0.39 | +0.31 | +0.16 | +0.27 | +0.23 | +0.05 | 0.00 | +138 mm (+9.6%) |

- **Same formula, different inputs.** The app's `et0_penman` fed with ERA5 daily inputs lands within 2–4% of Open-Meteo's own ET0 per year. So the POWER–ERA5 gap comes from the inputs, not the formula. Open-Meteo computes ET0 hourly; I aggregated hourly ERA5 to daily inputs. — measured here
- **Inputs in March, POWER against ERA5 (Cần Thơ):**
  - Relative humidity: 64% against 74%.
  - Wind at 2 m: 3.0 against 2.1 m/s. At Cà Mau, POWER wind is about twice ERA5's all year (4.2 against 2.3 m/s in March).
  - Sunshine (Rs): 20.8 against 21.4 MJ/m²/day, about equal.
  - Dry-season Tmax: +3 °C (Q1).
  - In the wet season POWER's Rs is 1–1.6 MJ higher, which cancels part of its cooler Tmax.
  - — measured here, from [POWER](https://power.larc.nasa.gov/api/temporal/daily/point) and [Open-Meteo S3 ERA5](https://openmeteo.s3.amazonaws.com/data/copernicus_era5/static/meta.json)
- **Station Hargreaves**, as a rough check. GSOD has Tmax, Tmin, dew point and wind but no radiation, so full PM at the station is not possible.
  - In March, station Hargreaves is 4.1–4.8 mm/day, ERA5 5.1–5.2 and POWER 6.0–6.2.
  - In the wet season, Hargreaves sits between or above both.
  - Hargreaves uses only temperature and is known to be off in humid climates, so it cannot rank sources month by month. It agrees with ERA5 on the dry-season peak, not with POWER.
  - — measured here
- **Published value.** A Cần Thơ University study gives monthly mean ET0 of 3.5–5.0 mm/day by Penman–Monteith at Mekong stations. ERA5's range is 3.2–5.2 mm/day; POWER's peak is 6.1–6.2. — [J. Climate Change (IOS Press)](https://content.iospress.com/articles/journal-of-climate-change/jcc220016)
- **ERA5-Land has no ET0 on the API.** Open-Meteo `models=era5_land` returned `et0_fao_evapotranspiration` = null on every day (5,805 of 5,805) at Cần Thơ and Rạch Giá. Open-Meteo's S3 copy of ERA5-Land holds only temperature, dew point, soil and snow variables, not radiation or wind. — [Open-Meteo S3 listing](https://openmeteo.s3.amazonaws.com/?list-type=2&delimiter=/&prefix=data/copernicus_era5_land/)

### Inferences
- **(d) ET0: ERA5 via Open-Meteo wins.** It removes a roughly +0.6 to +1.0 mm/day dry-season over-estimate, which is about 18–30 mm per dry-season month. That over-estimate inflates the app's canal-water need in exactly the salty months (Feb–Apr).
- The main ET0 numbers are POWER-based monthly means, which already use a seasonal ET0 that is too high in the dry season. Switching would cut dry-season irrigation need by about 15–20%, so the app's water figures would change.
- Using Open-Meteo's ET0 as-is is the simplest route. The alternative is to keep `et0_penman` and feed it ERA5 daily inputs, which gives the same answer within 2–4%.

### Gaps
- No station radiation or full station PM was available, so the ET0 ranking rests on consistency (formula, published range, Hargreaves direction), not on a direct station truth.
- The default Open-Meteo ERA5 cell at Rạch Giá (land cell) and the app's pins may differ. I did not check cell choice at the app's pins.

## Q3. Latency, access, keys and limits (as of 2026-11-22)

### Takeaway
Every candidate is about 5–6 days behind. POWER temperature is fresher (3 days), but POWER radiation, and so ET0, lags 6 days. That is the same as ERA5. None needs a key. The Open-Meteo API is the easiest route, but the sandbox's shared IP kept hitting its daily limit. The same ERA5 data can be read without limits from Open-Meteo's public S3 bucket, or from CHC for CHIRTS.

### Cited Findings
| Source | Latest day on 2026-11-22 | Lag | Access (no key for any) | Limits / licence |
|---|---|---|---|---|
| NASA POWER daily point | T2M to 2026-11-19; ALLSKY_SFC_SW_DWN to 2026-11-16 | 3 d (temperature), 6 d (radiation, so ET0) | `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=...&community=AG&latitude=..&longitude=..&start=YYYYMMDD&end=YYYYMMDD&format=JSON` | No limit stated; API lists HTTP 429 "Too Many Requests". Meteorology is MERRA-2 to "within several months", then GEOS "to within several days of real time"; native ½°×⅝° (met), 1°×1° (radiation). |
| ERA5 / ERA5-Land, Open-Meteo API | 2026-11-16 | 6 d | `https://archive-api.open-meteo.com/v1/archive?latitude=..&longitude=..&start_date=..&end_date=..&daily=temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&timezone=Asia/Bangkok&models=era5` | Free non-commercial: 600/min, 5,000/h, 10,000/day, 300,000/month, counted per IP. Data CC BY 4.0. |
| ERA5 / ERA5-Land, Open-Meteo S3 | 2026-11-16 local day (`data_end_time` 2026-11-17 00 UTC) | 6 d | `https://openmeteo.s3.amazonaws.com/data/copernicus_era5[_land]/<variable>/year_YYYY.om` (to 2021) and `chunk_N.om` (504 h each, N=904 is 2021-12-23); read with `pip install omfiles` and HTTP range requests | AWS open data, no quota seen. Hourly; daily aggregation is yours. |
| CHIRTS-ERA5 | 2026-11-17 | 5 d | Daily GeoTIFF `https://data.chc.ucsb.edu/experimental/CHIRTS-ERA5/{tmax,tmin}/tifs/daily/YYYY/CHIRTS-ERA5.daily_{Tmax,Tmin}.YYYY.MM.DD.tif` (about 27 MB each, global); yearly netCDF `.../{tmax,tmin}/netcdf/daily/CHIRTS-ERA5.daily_{Tmax,Tmin}.YYYY.nc` (about 7 GB, chunks 19 days × 137 × 379 cells, gzip; range reads with h5py work) | Server returns 429 when hurried; backoff works. CC BY 4.0. Cite doi 10.15780/G2F08J. Tmax/Tmin only, no ET0. |
| GSOD (validation only) | 2025-08-24 at all three stations; no 2026 files (404) | — | `https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/YYYY/<id>.csv` | — |

- Sources for the table:
  - Open-Meteo limits and licence. — [Open-Meteo terms](https://open-meteo.com/en/terms)
  - Open-Meteo API lag. — [Open-Meteo docs](https://open-meteo.com/en/docs/historical-weather-api)
  - POWER sources and resolution. — [POWER methodology](https://power.larc.nasa.gov/docs/methodology/)
  - POWER error codes. — [POWER API docs](https://power.larc.nasa.gov/docs/services/api/)
  - CHIRTS-ERA5 lag ("processed with a 5-day lag"), licence and DOI. — [CHC CHIRTS-ERA5](https://www.chc.ucsb.edu/data/chirts-era5)
  - S3 `meta.json` (chunk_time_length 504, data_end_time). — [Open-Meteo S3 meta](https://openmeteo.s3.amazonaws.com/data/copernicus_era5/static/meta.json)
- **Open-Meteo rate limit in practice, measured here.** Of about 25 requests over an hour (each one 16 years × 3 daily variables), most got HTTP 429 "Daily API request limit exceeded" or connection resets. Five of six eventually succeeded. Cà Mau ERA5-Land never came through, so that row uses the S3 copy, which matches the API wherever both exist.
- **Cell choice, measured here.** Open-Meteo's API moves a coastal point to a land cell. For Rạch Giá it chose ERA5 10.0N 105.25E (elevation 7 m) instead of the nearest 10.0N 105.0E, and ERA5-Land 10.0N 105.1E. At the three stations no ERA5-Land cell came back as sea or empty; the nearest 0.1° cell always had data.

### Inferences
- For the app's pipeline, the Open-Meteo API (one call per pin per model) is the simplest route, and it is the same ERA5 data as POWER would be replaced with. On a shared or cloud IP it needs retries or the S3 fallback.
- A switch costs no freshness for ET0: both POWER and ERA5 lag 6 days. It costs 3 days on temperature alone, which does not matter for monthly averages.

### Gaps
- I did not test ERA5-Land at a truly coastal pin (for example the Sóc Trăng coast) for empty cells; all three stations sit at least a few km inland.
- Copernicus CDS was not needed and not tried.

## Q4. Verdict

### Takeaway
| Use | Winner | Confidence |
|---|---|---|
| (a) Heat days ≥35 °C | **ERA5-Land**, narrowly over ERA5; POWER clearly worst | Moderate: 3 stations, station tails uncertain |
| (b) Cold-snap nights (≥4.2 °C drop) | **None.** No gridded source reaches the threshold; station counts are mostly artefacts | — |
| (c) Monthly mean temperature | **ERA5** (0.25°, Open-Meteo) | High: best at all 3 stations, RMSE 0.34–0.44 °C |
| (d) ET0 | **ERA5** via Open-Meteo `et0_fao_evapotranspiration` | Moderate-high: no station PM, but formula, published range and Hargreaves all point the same way |

### Cited Findings
- All numbers are from the tables in Q1–Q3, measured here from [GSOD](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/), [POWER](https://power.larc.nasa.gov/api/temporal/daily/point), [Open-Meteo](https://open-meteo.com/en/docs/historical-weather-api) and [CHIRTS-ERA5](https://data.chc.ucsb.edu/experimental/CHIRTS-ERA5/).

### Inferences
- **One-source recommendation: Open-Meteo `models=era5`** for daily Tmax, Tmin and ET0. It wins (c) and (d), comes a close second on (a), and is one key-free call per pin. Use only `era5`, not `best_match` or `era5_seamless`, to avoid model breaks.
- If heat days become the main concern, add ERA5-Land Tmax for that one count. It is the same API, but it has no ET0 and runs about 1 °C cold in the wet season.
- **Do not use CHIRTS-ERA5** for this app. It carries a +1 to +1.7 °C warm bias in monthly means and Tmin at two stations, is too smooth for heat days at Cà Mau, and is the hardest to access (7 GB files or 27 MB daily global tiles).
- **Cold-snap rule:** a source switch will not fix it. Decide separately whether to lower the threshold or use a multi-day drop, and say in the app that it is a model estimate.
- **Coastal pins:** ERA5 heat days swing from 1 to 163 between neighbouring 0.25° cells at Rạch Giá. Pin the cell with Open-Meteo's land selection (the default) and check coastal pins by hand.

### Gaps
- Inland or northern pins (Sóc Trăng interior, Tây Ninh) were not validated; no GSOD station there has recent data.
