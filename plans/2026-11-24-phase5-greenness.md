# Phase 5: Greenness From HLS-VI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The greenness chart at the 5 Sóc Trăng pins comes from NASA HLS-VI (30 m, Dec 2015 – latest). The bare months MODIS finds are labelled "dry" or "flooded". MODIS keeps the crop counts. Two newer rice maps are recorded as notes.

**Architecture:**
- A new fetcher, `pipeline/fetch_hlsvi.py`, is ported from `research/scripts/hlsvi_points.py`, the prototype that ran without failures. It writes `data/raw/hlsvi_<pin>.json`.
- `build.py` uses it for the pins' greenness chart (`ndvi.monthly_mean` / `monthly_range` over HLS-VI dates) and for the dry/flooded labels of `bare_months`.
- Province points keep MODIS. MODIS still gives `crops_per_year` and `bare_months` everywhere.

**Tech Stack:** Python 3 + `rasterio` (installed, 1.5.2) + numpy; plain JS; `python3 pipeline/test_build.py`; `node tools/ui_check.js`.

**Spec:**
- The user's choices, 2026-11-23/24: Sentinel-1 is dropped (it failed the agreed gate, `research/s1-hlsvi-prototype.md`). The HLS-VI chart and the NDWI dry/flooded labels are in; MODIS keeps the counts. Zhao ESSD 2026 and Open-SEA-Rice-10 go in SOURCES as notes (`research/rice-calendar-maps.md`).
- Access recipe: `research/s1-hlsvi-prototype.md` §5 and its "access recipes" section.

## Decisions (spec)
1. **The chart.** At the 5 pins, the monthly greenness (mean, min, max per calendar month) comes from HLS-VI NDVI on clear dates. It uses only Dec–Nov seasons inside `PERIOD` that HLS-VI covers (Dec 2015 → `PERIOD` end), split typical / El Niño by RONI as today.
   - **Ruling (controller):** the chart is HLS-VI only, never spliced with MODIS years. That follows the overhaul's global "never splice two products into one series".
   - The chart text says "NASA HLS-VI NDVI, 30 m, Dec 2015 – {PERIOD end}", and says so when the El Niño chart rests on few seasons.
   - A calendar month with fewer than 3 clear dates in the view keeps a gap: it is not filled from MODIS.
2. **Dry or flooded.** For each MODIS `bare_months` month at a pin, look at the HLS-VI clear dates in that calendar month over the HLS years.
   - It is **flooded** when most dates meet the Xiao et al. (2005) flooding signal `LSWI + 0.05 ≥ EVI`. LSWI = HLS-VI `NDMI` (NIR−SWIR1)/(NIR+SWIR1).
   - Otherwise it is **dry**.
   - With fewer than 3 clear dates it stays unlabelled.
   - Shown in the area text and card evidence as "bare (dry)" / "bare (flooded)", EN and VI, with the source.
   - Find and cite the paper: Xiao, X. et al. (2005), Remote Sensing of Environment 95:480–492.
3. **Crop counts unchanged:** MODIS `crops_per_year` and `bare_months` over `RECENT`.
4. **Notes, no code:**
   - In SOURCES.md, Zhao et al. ESSD 2026 (30 m, Zenodo 10.5281/zenodo.21349862, CC BY 4.0): pin crop counts 1995/2005/2015/2024, with 3 crops at 3 of 5 pins in 2024 where MODIS gives 2.
   - Open-SEA-Rice-10 (Zenodo 14627003, CC BY 4.0): class 2 at all 5 pins in 2021.
   - Neither has field truth.
5. **Province points** keep the MODIS chart, and say so.

## Global Constraints
- Every user-facing string gets EN and VI. Say where every number comes from. Never show a map or model value as a measurement.
- Never splice two products into one series.
- The fetcher sends the Earthdata login up front (a bearer token from `urs.earthdata.nasa.gov`, cached; the login host drops connections from the sandbox, so retry). It saves per pin, skips saved dates, exits non-zero on failure and writes nothing partial. Its parser is tested on a small saved fixture, never the network.
- Any diff in `docs/data/` after a build is a real change, so commit it. Never hand-edit `docs/app/builder.js`.
- Bump `docs/sw.js` to `mre-app-15`.
- `python3 pipeline/test_build.py` all ok and `node tools/ui_check.js` 16 ok (exit 0).
- Commits end with the session attribution lines; no model names.

## Review Focus
1. **Wet-season thinness:** 0.5–1.6 clear dates a month in Jun–Oct. The gap rule (fewer than 3 dates) must keep thin months from showing a fake low or high value.
2. **Bare-month labels where HLS disagrees with MODIS:** a month MODIS calls bare may have HLS-VI dates that are green. The label rule applies only to dates with NDVI < `ndvi.BARE`. If none remain, the month is unlabelled.
3. **The pin-rice check** (`hls_check`, AppEEARS `hls_<pin>.json`) stays as it is. Do not break `test_build`'s "pins must be rice at 30 m".

---

### Task 1: HLS-VI fetcher and the pins' greenness chart
**Files:**
- Create `pipeline/fetch_hlsvi.py`, writing `data/raw/hlsvi_<pin>.json` = `{"source": {...}, "dates": {"YYYY-MM-DD": {"ndvi": x, "ndmi": x, "evi": x, "ndwi": x, "sensor": "S30|L30"}}}`, clear dates only (Fmask bits 1–3 clear over the 3×3 window, as in the prototype). Add `NDMI` and `EVI` to the assets the prototype read.
- Create the test fixture `pipeline/fixtures/hlsvi_*.json`.
- Modify `build.py`, the pins' `nd` chart fields (`monthly`, `monthly_min`, `monthly_max` for both views), via `ndvi.monthly_mean` / `monthly_range` on the HLS-VI NDVI series, with the gap rule from Decision 1.
- Modify `HLS_VI_SRC` and the chart text and citations (grep the "NASA MODIS NDVI" labels in dash.js, app.js and strings.js: the chart labels at the pins become HLS-VI, and the crops-per-year labels stay MODIS).
- Modify `test_build.py`: `test_hlsvi_parse` (fixture) and `test_pin_chart_hlsvi` (the chart months use only HLS dates, and a gap appears under 3 dates).
- [ ] Failing tests → implement → fetch (`python3 pipeline/fetch_hlsvi.py`; the prototype run took about 30 min for 5 pins) → build → test → commit.

### Task 2: Dry or flooded bare months, notes, ship
**Files:**
- Modify `build.py`: `bare_kind` per pin, `{month: "dry"|"flooded"}`, by Decision 2, used in the area summary line (~550) and the card evidence (~735). EN and VI.
- Modify `test_build.py` with `test_bare_kind` (fixture dates: a flooded case, a dry case, and an unlabelled case with fewer than 3 dates).
- Modify SOURCES.md: the HLS-VI row, the Xiao 2005 rule, the notes from Decision 4, and the province points still on MODIS.
- Modify README (VI then EN) and CLAUDE.md (the fetcher in Commands; the files in the map).
- Modify `docs/sw.js` → `mre-app-15`, and the handoff line.
- [ ] Failing test → implement → build → test → phone check → commit.
