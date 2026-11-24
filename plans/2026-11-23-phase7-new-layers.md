# Phase 7: New Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four farmer-facing layers: the KTTV 10-day salt forecast, official planting windows, a seasonal rain outlook, and the FAO rice price. They appear on the dashboard and in the planner.

**Architecture:**
- Each layer is a raw file in `data/raw/` (fetched, or hand-kept in `pipeline/`).
- `build.py` copies a small, sourced summary into `docs/data/sites.json` (and `provinces.json` where a province point needs it).
- The app renders it with the existing tile and line patterns.
- One task per layer, all in one PR.

**Tech Stack:** Python 3 stdlib + `pdfplumber` (already used); plain-JS PWA; `python3 pipeline/test_build.py`; `node tools/ui_check.js`.

**Spec:** data overhaul spec 9 (`plans/2026-11-23-data-overhaul.md`). Evidence: `research/research_notes/Mekong app data source alternatives/new_layers.md` and `economics.md`.

## Decisions (spec)
1. **KTTV 10-day salt forecast.** Parse the forecast part of the newest national bulletin PDF (`dbqg_xman_*.pdf`, already fetched by `pipeline/fetch_salinity_vietnam.py`). Keep, per station, the forecast maximum ‰ and the forecast period, plus the bulletin's risk level if it states one.
   - Each pin and province point uses its nearest KTTV station, by the existing 25 km rule.
   - Shown as "KTTV forecast, {from}–{to}: up to X‰ at {station}", always with the issue date. The app hides it when the forecast period ended more than 14 days ago.
2. **Planting windows (lịch thời vụ).** A hand-kept `pipeline/planting_windows.json`: per region or province and season, the windows (from and to dates, with an EN/VI note), a finish-by date, and the source (title, URL, date).
   - The first entry is the Cục Trồng trọt và BVTV Đông Xuân 2026–27 guidance for the Delta: early sowing 10–30 Oct 2026 in coastal areas; wave 2 on 1–31 Dec 2026; late areas finish by 10 Jan 2027. Source: the Cà Mau copy, URL in `new_layers.md`.
   - The note says the sources disagree on the size of the early wave.
   - Shown until its finish-by date passes.
3. **Seasonal outlook.** ECMWF SEAS5 monthly precipitation via the Open-Meteo Seasonal API (`seasonal-api.open-meteo.com/v1/seasonal`) for the next 3 months at each pin.
   - The label is wetter / drier / normal, never mm.
   - The rule is a **team choice**, labelled as such: compare the ensemble-mean monthly anomaly with the model's own climatology, and call it wetter or drier beyond ±20% of that month's climatological mean.
   - Say "not bias-corrected; ECMWF SEAS5 via Open-Meteo", and the issue date.
4. **Rice price.** FAO FPMA Bạc Liêu wholesale rice (5% broken), monthly, VND/kg, from the Vietnam Food Association.
   - Show "Rice price (Bạc Liêu wholesale, FAO/VFA, {month}): X ₫/kg, Y% above/below its 2020–26 median".
   - Profits are not rescaled. Say that the profit figures are fixed published medians.
5. **Placement:**
   - The dashboard Today view gets one new tile with the salt forecast, the outlook and the planting window, following the existing `tile(...)` pattern and the `nino` tile.
   - The price line sits under the money tile on the dashboard and next to profit on the planner cards (under `vsNow`) and in the cash plan.
   - Step 1's area panel (`#outlook`) adds the outlook and planting-window lines after the NOAA line.
   - Each layer hides itself when its data is missing or stale, and the page still works offline.

## Global Constraints
- Every user-facing string gets EN and VI. Say where every number comes from. A forecast is labelled a forecast; never show a model value as a measurement.
- Any diff in `docs/data/` after a build is a real change, so commit it. Never hand-edit `docs/app/builder.js`.
- Fetchers save as they go, exit non-zero on failure, write nothing partial, and are tested on small fixtures (never the network in tests).
- Bump `docs/sw.js` to `mre-app-14`.
- `python3 pipeline/test_build.py` all ok and `node tools/ui_check.js` 15 ok (exit 0). Add a phone check `layers` that sees the new tile on the dashboard and the price line on a card, at 320 px with no sideways scroll.
- Python edits to Vietnamese text: `encoding="utf-8"`, and a string replace with an assert, not sed.
- Commits end with the session attribution lines; no model names.

## Review Focus
1. **Staleness:** a 2025 forecast or a past planting window must not show as current. Pin this with a date in a test or in the phone check.
2. **The PDF layout:** the forecast table may change between bulletins. The parser fails loudly, and keeps the last good forecast, rather than guessing.
3. **Offline:** with `sites.json` cached but no network, every layer renders from the build data. Nothing fetches at runtime except what already does.

---

### Task 1: KTTV 10-day salt forecast
**Files:**
- Modify `pipeline/fetch_salinity_vietnam.py`: parse the forecast table into `data/raw/salinity_kttv_vietnam.json` → `"forecast": {"issued", "from", "to", "url", "risk", "stations": {name: ppt}}`.
- Modify `build.py`: add `salt_forecast` per point (nearest station within 25 km, or none).
- Modify `dash.js` and `app.js` (the new tile and the `#outlook` line), `strings.js`, and `test_build.py` (`test_salt_forecast_parse` on a saved fixture PDF text, plus a build test).
- [ ] Failing tests → implement → fetch → build → test → commit.

### Task 2: Planting windows
**Files:**
- Create `pipeline/planting_windows.json` (Decision 2).
- Modify `build.py`: add `planting` to the site and province data where the region matches; for now that is the whole Delta.
- Modify `dash.js` and `app.js` (shown until `finish_by` passes), `strings.js`, and `test_build.py`.
- [ ] Failing test → implement → build → test → commit.

### Task 3: Seasonal outlook
**Files:**
- Create `pipeline/fetch_seasonal.py` → `data/raw/seasonal.json` (`{"issued", "model", "points": {id: [{"month": "YYYY-MM", "anom_pct": x, "label": "wetter|drier|normal"}…3]}}`).
- Modify `build.py` (`outlook3` per point), `dash.js`, `app.js`, `strings.js`, and `test_build.py` (the label rule at ±20% on a fixture).
- First, probe the API for its monthly anomaly variable names and its licence. If the API has no anomaly field, compute the anomaly from the ensemble mean against its hindcast climatology, and say which.
- [ ] Probe → failing tests → implement → fetch → build → test → commit.

### Task 4: Rice price
**Files:**
- Create `pipeline/fetch_prices.py` → `data/raw/rice_price.json` (the FPMA Bạc Liêu 5% monthly series: `[{"month", "vnd_kg"}]`, the series uuid, the source).
- Modify `build.py` (a `rice_price` summary with the latest month, value, 2020–26 median and % difference), `dash.js` (money tile), `app.js` (cards and cash plan), `strings.js`, and `test_build.py`.
- [ ] Failing tests → implement → fetch → build → test → commit.

### Task 5: Phone check and ship
- Add the `layers` check to `tools/ui_check.js`. Bump `sw.js` to `mre-app-14`. Update SOURCES.md (four new source rows), README and CLAUDE.md (the fetchers in Commands, the files in the map), and the handoff.
- [ ] Run everything; commit. The controller opens and merges the PR.
