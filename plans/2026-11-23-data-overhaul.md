# Data Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's data sources with better ones where the research shows a gain, and add the new layers worth having. There are nine PRs, merged in order.

**Architecture:**
- Each source switch is a new fetcher in `pipeline/` that writes a raw file in `data/raw/`, plus a change where `build.py` reads it. `build.py` stays the single place that turns raw data into `docs/data/sites.json`, `provinces.json` and `docs/app/builder.js`.
- PRs 1–4 change the core numbers and are planned here in full.
- PRs 5–9 depend on prototypes and on each other's results. Each of them gets its own detailed plan (superpowers:writing-plans) when it starts, from the phase outline below.

**Tech Stack:** Python 3 (stdlib plus `tifffile` and `imagecodecs` for CHIRPS GeoTIFFs); plain-JS PWA; `python3 pipeline/test_build.py`; `node tools/ui_check.js`.

**Spec:** the "Decisions (spec)" section below (agreed with the user, 2026-11-22/23). Evidence: `research/reports/Mekong app data source alternatives.md` and `research/research_notes/Mekong app data source alternatives/*.md`.

## Decisions (spec)

1. **Rain → CHIRPS v3.0 monthly** (0.05°, CHC UCSB, no login) for both the long-term averages and the latest 12 months. NASA GPM IMERG stays only as a stated cross-check: its file and fetcher are kept, and no score uses it. CHIRPS v2.0 may stand in only as a whole series, never spliced month by month.
2. **Weather and ET₀ → ERA5 via the Open-Meteo archive API**: `models=era5` for Tmax, Tmin, mean temperature and FAO-56 ET₀ (`et0_fao_evapotranspiration`), and `models=era5_land` Tmax for days ≥ 35 °C only. NASA POWER is removed: its files, its fetcher, and the app's own Penman–Monteith code. Its ONI and outlook fetch moves to a new `fetch_enso.py`.
3. **Cold-snap rule (shrimp).** Research a threshold that fits daily gridded temperatures and is backed by shrimp-disease evidence. If a sourced one exists, apply it. Otherwise remove the rule everywhere.
4. **El Niño index → NOAA RONI** (official since 1 Feb 2026): a season counts as El Niño when its Dec–Feb RONI is ≥ 0.5, for both the climate views and the salt views. The CPC outlook text stays as it is.
5. **Rolling period:** the averages run from Dec 2000 to the newest whole Dec–Nov season that every point has in both CHIRPS and ERA5. `PERIOD` is computed from the data, not typed.
6. **Soil:** remove SoilGrids pH. No score uses it; it is only shown in the map popup, and it is wrong for acid-sulfate soils. Keep clay and organic carbon.
7. **Greenness (PR 5):**
   - Sentinel-1 radar is the main crop counter from 2015: crops per year, and flooded or bare months.
   - MODIS covers 2000–2014.
   - NASA HLS-VI (30 m NDVI + NDWI) feeds the greenness chart, and its water index tells flooded fields from bare ones.
   - A one-off check of each pin against Open-SEA-Rice-10 and the ESSD 30 m rice map (Zenodo).
8. **Salinity (PR 6):** add the weekly provincial hydro-met bulletins (e.g. Vĩnh Long `XMAN/VILO`, which cover the February peak) for the province points. Add the older open series: Mendeley `10.17632/fm996rrfyz.1` (Trà Vinh, Cầu Quan 1990–2016) and GFZ `10.5880/GFZ.4.4.2024.004` (Sơn Đốc 1996–2016).
9. **New layers (PR 7)**, on the dashboard and in the planner:
   - **KTTV 10-day salt forecast**, parsed from the bulletin PDFs already fetched, labelled as a KTTV forecast.
   - **Official planting windows (lịch thời vụ):** a hand-kept JSON with source and date.
   - **Seasonal outlook:** ECMWF SEAS5 via Open-Meteo, shown only as wetter / drier / normal, never in mm.
   - **FAO FPMA Bạc Liêu wholesale rice price** against its 2020–26 median, shown beside the fixed profit figures (profits are not rescaled).

   Placement:
   - The dashboard Today card shows the salt forecast, the outlook and the planting window.
   - The price sits beside profit on the cards and in the cash plan.
   - Step 1's area panel shows the outlook and the planting window.
10. **34-province outlines (PR 8):** the official HDX COD-AB Vietnam (CC BY-IGO), or the 2020 outlines merged by a 63→34 table. The 63 former provinces stay.
11. **Monthly GitHub Action (PR 9):** run the no-login fetchers and `build.py` once a month. Open a PR with the new data only when tests pass.
12. **One PR per family**, subagent-driven, each merged before the next starts (house rule: draft → ready → merge with the full SHA).

## Global Constraints

- Every user-facing string gets EN and VI. Say where every number comes from. Never show model or map values as measured readings.
- Source titles name the provider exactly: "CHIRPS v3.0 (Climate Hazards Center, UC Santa Barbara)", "ERA5 / ERA5-Land (Copernicus Climate Change Service, ECMWF) via Open-Meteo", "NOAA CPC Relative Oceanic Niño Index (RONI)". Licences go in `SOURCES.md`.
- Never splice two products into one series (no IMERG months inside CHIRPS, no v2 months inside v3).
- Any diff in `docs/data/` after a build is a real change, so commit it. Never hand-edit `docs/app/builder.js`.
- Each PR bumps the `docs/sw.js` cache name when app files or `docs/data` change (`mre-app-9`, then 10, …).
- `python3 pipeline/test_build.py` all ok and `node tools/ui_check.js` 15 ok (exit 0) before each merge.
- Python edits to Vietnamese text: `encoding="utf-8"`, and a Python string replace with an assert, not sed.
- Each PR records the before → after numbers that farmers see (per pin: yearly rain, Dec–Apr rain, dry-season ET₀, heat days, top card) in its PR body and in `SOURCES.md` where the method changes.
- No model names in commits, code or PRs. Commits end with the session attribution lines.

## Review Focus

1. **Coastal and edge cells.** Four pins sit exactly on CHIRPS 0.05° cell edges, and ERA5's nearest 0.25° cell can be mostly sea (Rạch Giá gave 1 hot day in 14 years versus 163 on the land cell). Task 1 fixes the CHIRPS cell rule with a test. Task 2 uses Open-Meteo's default land-cell choice and asserts that every point gets a non-empty series.
2. **A partial season inside the averages.** The rolling `PERIOD` must end on a 30 Nov that every point has complete in both sources. Task 3 tests this with a fixture missing one month.
3. **Rate limits.** CHC (HTTP 429) and Open-Meteo (10,000 requests/day per IP) both throttle. Fetchers save as they go, skip what is saved, and back off. Each task's fetcher test runs on a tiny fixture, never the network.
4. **Removed inputs still read somewhere.** For each removed field (POWER files, `ph`, possibly `cold_days`, `gpm_check`), grep `docs/app/*.js` and `pipeline/*.py` before deleting. `score.js` must stay in parity with `build.py` (`test_score_parity`).
5. **El Niño membership drift.** Moving to RONI drops 2019–20 from El Niño. The salt and climate El Niño counts in text and tests must follow the data, not stay hard-coded.

---

### Task 1 (PR 1): Rain from CHIRPS v3.0

**Files:**
- Create: `pipeline/fetch_chirps.py` (from `research/scripts/chirps_points.py`, which already does HTTP range reads of the COGs)
- Modify: `pipeline/build.py`:
  - `GPM_SRC` → keep, as the cross-check source; add `CHIRPS_SRC`.
  - `climate()`: its `gpm` argument becomes `rain`.
  - `build()`, `point_rain`, `province`, `place`, `write_builder`: read `data/raw/chirps.json`.
  - `gpm_check` → `rain_check`.
- Modify: `pipeline/test_build.py`: `test_gpm_covers_period` → `test_rain_covers_period`; `test_gpm_cross_check` → `test_rain_cross_check`; add `test_chirps_cell`.
- Modify text: every "GPM" rain mention in `docs/app/*.js`, `docs/index.html`, `README.md`, `SOURCES.md` and `CLAUDE.md` (grep `GPM`, `IMERG`) → CHIRPS, except where it describes the cross-check.
- Data: `data/raw/chirps.json`. Rebuild `docs/data/*` and `docs/app/builder.js`. `docs/sw.js` → `mre-app-9`.

**Interfaces:**
- Produces:
  - `data/raw/chirps.json` shaped `{point_id: {"YYYY-MM": mm}}`, Jan 1981 to the latest CHIRPS v3 month, for every point in `sites.points()`.
  - `fetch_chirps.cell(lon, lat, geo) -> (col, row)`.
  - `build.rain_check(chirps_months, imerg_months) -> {"chirps_mm_yr", "imerg_mm_yr", "diff_pct", "monthly_r", "months"} | None`.
  - The `sites.json` key `gpm_check` is renamed `rain_check`; update any app reader found by grep.

- [ ] **Step 1: Write the failing tests**
```python
def test_chirps_cell():
    geo = (-180.0, 0.05, 50.0, 0.05)   # x0, dx, y0 (north edge), dy as read from the file's geotransform
    assert fetch_chirps.cell(105.95, 9.55, geo) == (5719, 809)   # half-open: a point on an edge belongs to the cell east / south of it
    assert fetch_chirps.cell(105.9499, 9.5501, geo) == (5718, 808)
def test_rain_covers_period():   # replaces test_gpm_covers_period, reading chirps.json
def test_rain_cross_check():     # rain_check on two small dicts: r, % apart, months; None under 24 shared months
```
Use the real geotransform of `chirps-v3.0.YYYY.MM.cog`, read from its tags. Fix the expected numbers in the first test from that geotransform: one edge point and one point just inside.

- [ ] **Step 2: Run them, see them fail** (`python3 pipeline/test_build.py`). They should fail because `fetch_chirps` and `rain_check` are missing.

- [ ] **Step 3: Implement `fetch_chirps.py`**.
  - Use the URL pattern `https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/cogs/chirps-v3.0.{y}.{m:02d}.cog`.
  - Fetch one tile for all points. Skip months already saved, and save after each month.
  - Back off on 429. A 404 on the newest month means it is not published yet, so skip it.
  - Exit non-zero if any older month fails.
  - Add `tifffile` and `imagecodecs` to the CLAUDE.md commands line (`pip install pdfplumber tifffile imagecodecs`).

- [ ] **Step 4: Switch `build.py`.**
  - Rain comes from `chirps.json`, with the same error message pattern ("run pipeline/fetch_chirps.py").
  - `rain_check` compares CHIRPS with IMERG over the overlapping months inside `PERIOD`.
  - The chart source becomes `cite(POWER_SRC, CHIRPS_SRC, …)`. `GPM_SRC` is cited only by the cross-check line.

- [ ] **Step 5: Fetch, build, test.**
  - Run `python3 pipeline/fetch_chirps.py` (rerun until done), then `python3 pipeline/build.py && python3 pipeline/test_build.py`.
  - Pinned numbers that move: check each against `research/research_notes/…/rain_pin_test.md` (pins yearly within −6% to +1% of IMERG; Dec–Apr lower) before updating.
  - Record per pin: yearly and Dec–Apr rain before → after, and any card score or rank change.

- [ ] **Step 6: Update the text** (grep `GPM`/`IMERG` in the listed files).
  - The cross-check paragraph in `SOURCES.md` and `README.md` becomes CHIRPS vs IMERG, with the new numbers from `rain_check`.
  - Add the Cà Mau gauge comparison from `rain_pin_test.md`, saying it is not independent of CHIRPS.

- [ ] **Step 7: Phone check, cache bump, commit, PR** (draft → ready → merge). Run `node tools/ui_check.js` (15 ok) and bump `mre-app-9`.

---

### Task 2 (PR 2): Weather and ET₀ from ERA5; cold-snap rule

**Files:**
- Research first: `research/cold-snap-shrimp.md`, with quotes in `research/data/`. A web-research subagent is allowed here.
- Create:
  - `pipeline/fetch_era5.py`;
  - `pipeline/fetch_enso.py`: the ONI and CPC outlook fetch moved out of `fetch_power.py`, unchanged in this task.
- Delete:
  - `pipeline/fetch_power.py`;
  - `data/raw/power_*.json.gz`;
  - in `build.py`: `ra`, `e0`, `et0_penman`, `read_power` and `POWER_SRC`;
  - `test_et0_penman_monteith`.
- Modify:
  - `pipeline/build.py`: `climate()`, `gpm_check`/`rain_check` (no POWER rain any more), `build()`, `province()`, `place()`;
  - `pipeline/sensitivity.py`: read ERA5 or drop what used POWER, whichever is smaller; grep `read_power`;
  - `pipeline/test_build.py`: `test_climate_pest_inputs` and anything that reads POWER.
- If the cold-snap rule is removed: `pipeline/pests.json` (`cold_drop_c`), `build.py` (`cold_days`, `pest_rule`), `docs/app/score.js:70`, `docs/app/dash.js:749,932`, and the texts that say "cold" (grep `cold`).
- Modify text: every "POWER" mention (grep `POWER` in `docs/app/*.js`, `docs/index.html`, `README.md`, `SOURCES.md`, `CLAUDE.md`).
- Rebuild. `docs/sw.js` → `mre-app-10`.

**Interfaces:**
- Consumes: Task 1's `chirps.json` (rain).
- Produces:
  - `data/raw/era5_<id>.json.gz` = `{"source": {...}, "daily": {"time": ["YYYY-MM-DD", ...], "tmax": [...], "tmin": [...], "et0": [...], "tmax_land": [...]}}`. Nulls stay null.
  - `build.read_weather(pid) -> dict` (that file).
  - `build.climate(weather, keep=None, rain=None) -> dict`, with the same output keys as today minus `cold_days` if the rule is removed. `et0_mm` is the monthly sum of the daily `et0`. `hot_days` counts days with `tmax_land` ≥ 35 °C. `tmax_c` and `tmean_c` come from the ERA5 `tmax`/`tmin`.

- [ ] **Step 1: Cold-snap research.** Find a shrimp-disease threshold or drop rule (one night, or over 2–3 days) that can be counted on daily gridded Tmin, from a source that gives the number. Write `research/cold-snap-shrimp.md`.
  - Ruling rule: adopt only a sourced number; otherwise the rule is removed (spec 3).

- [ ] **Step 2: Write the failing tests**
```python
def test_era5_climate():   # a 2-season fixture weather dict -> climate(): et0_mm = summed et0, hot_days from tmax_land >= 35, tmean from (tmax+tmin)/2
def test_weather_files_complete():   # every point has era5_<id>.json.gz with no all-null tmax / et0 / tmax_land series (Review Focus 1)
```
Plus the cold-snap test for whichever rule Step 1 chose: the new rule on a fixture, or `"cold_days" not in climate(...)`.

- [ ] **Step 3: Implement `fetch_era5.py`.**
  - Endpoint: `https://archive-api.open-meteo.com/v1/archive`, one request per point and model.
    - `models=era5&daily=temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration`;
    - `models=era5_land&daily=temperature_2m_max`.
  - `start_date=2000-12-01`, `end_date` = today − 1, `timezone=Asia/Bangkok`.
  - Back off on 429 and skip points already saved this month.
  - The research fallback, if the API quota blocks the sandbox, is the S3 copy read with `omfiles` (`research/scripts/weather_station_era5_s3.py`). Use it only for the fetch, never as a second source.

- [ ] **Step 4: Switch `build.py`.** Make `climate()` read the ERA5 dict and delete the Penman–Monteith code. `rain_check` stays CHIRPS vs IMERG. Move the ONI/outlook fetch to `fetch_enso.py`, then delete `fetch_power.py` and the POWER files.

- [ ] **Step 5: Fetch, build, test.**
  - Run `python3 pipeline/fetch_era5.py`, `python3 pipeline/fetch_enso.py`, then build and the tests. Check `test_score_parity` and `score.js`.
  - Record per pin: heat days, dry-season (Dec–Apr) ET₀, the canal-water need of each rotation, and every card score and rank, before → after.
  - Check the direction against `weather_station_test.md`: heat days far lower, and Dec–Apr ET₀ about 15–20% lower.

- [ ] **Step 6: Update the text and `SOURCES.md`.** The method rows for ET₀ (Open-Meteo's FAO-56), heat days (ERA5-Land) and the station test. The pest rule and the cold-snap outcome.

- [ ] **Step 7: Phone check, cache bump, commit, PR.**

---

### Task 3 (PR 3): RONI and the rolling period

**Files:**
- Modify:
  - `pipeline/fetch_enso.py`: fetch `https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt` into `data/raw/roni.txt`, and stop fetching `oni.txt`. Delete `data/raw/oni.txt`.
  - `pipeline/build.py`:
    - `elnino_seasons()` reads `roni.txt`, which has 3 columns (`SEAS YR RONI`; check the header);
    - `ONI_SRC` → `RONI_SRC`;
    - `PERIOD` is computed by `whole_period(rain, weather)`.
  - `pipeline/salinity.py:26-31`: `SALT_ELNINO` from `roni.txt`.
  - Texts that say "ONI" or "Oceanic Niño Index" (grep).
- Modify: `pipeline/test_build.py`:
  - `test_elnino_year`;
  - `test_salt_window`: the El Niño seasons drop 2020, so the asserts become `(2016, 2024, 3)`; check against data;
  - the Ngã Năm and "El Niño saltier at all 5" asserts: recheck against the data and adjust the claim, not the rule;
  - add `test_whole_period`.
- Rebuild. `docs/sw.js` → `mre-app-11`.

**Interfaces:**
- Consumes: `chirps.json` and the `era5_*` files.
- Produces:
  - `build.whole_period(rain: dict, weather: dict) -> (date(2000, 12, 1), date(Y, 11, 30))`, where Y is the latest year in which every point has all 12 CHIRPS months Dec(Y−1)–Nov(Y) and ERA5 daily values through 30 Nov Y.
  - `build.PERIOD = whole_period(...)`, computed once at import.

- [ ] **Step 1: Failing tests**
```python
def test_whole_period():
    rain = {"a": {f"{y}-{m:02d}": 1 for y in range(2000, 2026) for m in range(1, 13)}}
    weather = {"a": {"daily": {"time": [...through "2025-11-30"...]}}}
    assert build.whole_period(rain, weather)[1] == date(2025, 11, 30)
    del rain["a"]["2025-10"]
    assert build.whole_period(rain, weather)[1] == date(2024, 11, 30)   # Review Focus 2
```
In `test_elnino_year`: 2020 is not El Niño under RONI, while 2016 and 2024 are.

- [ ] **Step 2: See them fail; implement; fetch RONI; rebuild; run the tests.** Record the El Niño season list before → after and the move in each pin's El Niño salt average.
- [ ] **Step 3: Update the text** for RONI and the period. The text describing the period ("Dec 2000 – Nov {Y}") comes from `PERIOD`, never typed. Update CLAUDE.md data rules ("RONI", the period rule).
- [ ] **Step 4: Phone check, cache bump, commit, PR.**

---

### Task 4 (PR 4): Soil without pH

**Files:**
- Modify:
  - `pipeline/build.py:221-229` (`topsoil` returns `clay_pct` and `soc_g_kg` only), `:839` (`mean_soil` keys) and `:126` (`SOIL_SRC` title: "clay and organic carbon");
  - `pipeline/fetch_soil.py`: stop requesting `phh2o` if that is a separate request; keep the raw files;
  - `docs/app/vn.js:581`: the popup shows clay only;
  - `pipeline/test_build.py` `test_soilgrids_topsoil`;
  - `SOURCES.md` and `README.md` soil lines: why pH is not shown, citing the six-point SoilGrids check in `soil_enso_boundaries.md`.
- Rebuild. `docs/sw.js` → `mre-app-12`.

- [ ] **Step 1:** Make the test assert that `topsoil(...)` has no `"ph"` key, and see it fail.
- [ ] **Step 2:** Implement, rebuild, and run the tests and the phone check. Then commit and open the PR.

---

## Phases 5–9: detailed plan at phase start

Each phase starts with superpowers:writing-plans on its outline, saved as `plans/<date>-<phase>.md`, then runs subagent-driven.

**Phase 5 (PR 5): Greenness.**
- Goal: Sentinel-1 crop count from 2015, MODIS for 2000–2014, HLS-VI for the chart and NDWI, and a Zenodo pin check.
- **Gate:** a prototype at the 5 pins, 2016–2025, from Sentinel-1 RTC (Microsoft Planetary Computer `sentinel-1-rtc`, anonymous SAS token) VH time series.
  - It must count crops per year within ±0.5 of the MODIS `RECENT` count.
  - It must agree with Open-SEA-Rice-10 at ≥ 4 of 5 pins, before any switch.
  - HLS-VI comes via LP DAAC CMR-STAC with the Earthdata login already in the environment.
- Outputs: crops per year, flooded / bare months (S1 + NDWI), and the monthly greenness chart (HLS-VI from 2015, MODIS before).

**Phase 6 (PR 6): Salinity sources.**
- Goal: a fetcher for the weekly provincial bulletins: Vĩnh Long, plus whichever others are public (Cần Thơ, An Giang daily); probe the URL patterns first. Also import the Mendeley and GFZ series into `salinity_stations.json`-style records with `source` per row.
- Gate: each station row names the station, its km from the mouth, the date and ‰; partial seasons are flagged under the existing rule.

**Phase 7 (PR 7): New layers.**
- The parts, each with its own task:
  - the KTTV 10-day forecast parser (inside `fetch_salinity_vietnam.py`'s PDFs);
  - `pipeline/planting_windows.json` (hand-kept);
  - the Open-Meteo seasonal fetch (`seasonal-api.open-meteo.com/v1/seasonal`, terciles → wetter/drier/normal);
  - the FAO FPMA price fetch (`fpma.fao.org/giews/v4/global/price_module/api/v1/FpmaSeriePrice/<uuid>/?format=json`, Bạc Liêu 5% broken);
  - the UI placement from spec 9, EN/VI.

**Phase 8 (PR 8): 34-province outlines.**
- Fetch HDX COD-AB Vietnam v02 (34 provinces). Simplify it the way `make_outlines.py` does, and add it as a second layer. Keep the 63 former outlines.
- Cross-check: Cần Thơ city ≈ old Cần Thơ + Hậu Giang + Sóc Trăng (6,361 vs 6,396 km²).

**Phase 9 (PR 9): Monthly GitHub Action.**
- `.github/workflows/data.yml`, a monthly cron, does the following:
  - installs the pip dependencies;
  - runs the no-login fetchers: CHIRPS, ERA5, ENSO/RONI, KTTV salinity, provincial bulletins, seasonal, prices;
  - runs `build.py` and the tests;
  - opens a PR only on a data diff with green tests.
- Login-based sources (HLS, IMERG cross-check, Sentinel-1 if it needs one) stay manual unless a repository secret is added by the user.
