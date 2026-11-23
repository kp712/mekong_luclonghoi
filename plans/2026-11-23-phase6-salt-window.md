# Phase 6: Salt Window From 1999 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every station's salt averages use the dry seasons 1999–2026, instead of 2016–2026. Two open older series are added for Trà Vinh, Cầu Quan and Sơn Đốc.

**Architecture:**
- One constant (`salinity.SALT_SEASONS`) widens the window.
- A new raw file `data/raw/salinity_open_series.json` holds the older open-data seasons, written by a small fetcher. `salinity.station_record()` merges it into the KTTV station records by station name, the same way `lower_bound` seasons are merged into table stations.
- Everything downstream (levels, months, El Niño split, text) already follows the window.

**Tech Stack:** Python 3 stdlib + `openpyxl` (for the Mendeley xlsx; install if missing) + csv; `python3 pipeline/test_build.py`; `node tools/ui_check.js`.

**Spec:**
- Data overhaul spec 8, changed by the user on 2026-11-23: widen the salt window to 1999 for all stations, rather than add provincial bulletins. The Vĩnh Long bulletins hold only 4 issues, all in Apr–May 2026, and the other provinces are unreachable.
- Evidence: `research/provincial-salinity-bulletins.md`, and `research/scripts/salt_probe_datasets.py`, which already downloads and reads both datasets.

## Decisions (spec)
1. `SALT_SEASONS = (1999, 2026)` for every station: Sóc Trăng table stations and KTTV province stations alike. El Niño follows RONI as today.
2. **Mendeley `10.17632/fm996rrfyz.1`** (CC BY 4.0), sheet "Max. salinity": one annual maximum per year (g/l, treated as ‰) for Trà Vinh and Cầu Quan.
   - Seasons 1999–2016 go in. Each is a full-season peak with **no month**: it counts toward the level average but never toward salt months.
   - Map stations by name to the KTTV stations "Trà Vinh" and "Cầu Quan".
3. **GFZ `10.5880/GFZ.4.4.2024.004`** (CC BY 4.0): Sơn Đốc readings every 2 hours in the dry season, 1996–2016.
   - Each season 1999–2016 takes its maximum and the month of that maximum.
   - A season with no February or no March reading is partial under the existing rule, and is handled exactly as partial seasons are today.
4. Where an open-series season and a KTTV bulletin season cover the same station and year (none expected before 2024), the KTTV value wins. Note it in the file's `_readme`.
5. Every text that says the salt seasons are 2016–2026, or gives a season count, says 1999–2026 and the counts from the data. That includes the CLAUDE.md data rule, README, SOURCES and app strings (grep `2016–2026`, `2016-2026`, `11 dry seasons`).

## Global Constraints
- Every user-facing string gets EN and VI. Say where every number comes from (cite both datasets in `SOURCES.md`, with DOI and licence). Never show model values as measured readings.
- Any diff in `docs/data/` after a build is a real change, so commit it. Never hand-edit `docs/app/builder.js`.
- Bump `docs/sw.js` to `mre-app-13`.
- `python3 pipeline/test_build.py` all ok and `node tools/ui_check.js` 15 ok (exit 0).
- Python edits to Vietnamese text: `encoding="utf-8"`, and a string replace with an assert, not sed.
- Record, per Sóc Trăng pin and per province point with a station: the typical and El Niño averages, levels, salt months and season counts, before → after; plus card rank changes.
- Commits end with the session attribution lines; no model names.

## Review Focus
1. **Seasons without a month** (Mendeley) must not enter `station_months`, and must not make a season count as partial or full by mistake. A test pins this.
2. **Name mapping.** "Trà Vinh" in Mendeley must map to the KTTV "Trà Vinh" station, and the fetcher must fail if a name does not match. The research notes leave the identity unconfirmed, so `SOURCES.md` says it is assumed.
3. **Pins whose level or months change** must change because of the data. Each changed pinned test number gets a one-line reason in the report.

---

### Task 1: Window 1999–2026 and the open series

**Files:**
- Create: `pipeline/fetch_salinity_open.py`, writing `data/raw/salinity_open_series.json` = `{"_readme": …, "sources": {...}, "stations": {"Trà Vinh": {"1999": {"ppt": x, "month": null, "src": "mendeley"}, …}, "Cầu Quan": {...}, "Sơn Đốc": {"1999": {"ppt": x, "month": m, "partial": bool, "src": "gfz"}, …}}}`.
- Modify:
  - `pipeline/salinity.py`: `SALT_SEASONS`; `station_record()` merges the open series (KTTV wins on overlap); `station_months()` skips seasons whose month is null; `SOURCES` cites both datasets.
  - `pipeline/test_build.py`: `test_salt_window` (the new window and El Niño counts from the data); add `test_open_series`.
  - The texts listed in Decision 5.
- Data: `data/raw/salinity_open_series.json`. Rebuild `docs/data/*` and `docs/app/builder.js`. `docs/sw.js` → `mre-app-13`.

**Interfaces:**
- Produces: `fetch_salinity_open.main()` writes the file, exits 1 on any download or name-mapping failure, and keeps seasons 1999–2016 only.

- [ ] **Step 1: Failing tests**
```python
def test_open_series():
    o = json.loads((build.RAW / "salinity_open_series.json").read_text(encoding="utf-8"))["stations"]
    assert set(o) == {"Trà Vinh", "Cầu Quan", "Sơn Đốc"} and all("1999" <= y <= "2016" for s in o.values() for y in s)
    assert all(v["month"] is None for v in o["Trà Vinh"].values())          # annual maxima: no month
    rec = salinity.station_record(salinity.DATA, "Trà Vinh")
    # a no-month season counts toward the level but never toward salt months (Review Focus 1)
```
In `test_salt_window`: `salinity.SALT_SEASONS == (1999, 2026)`. Pin the Trần Đề typical and El Niño first/last/count from `station_salt` to the values the data gives; check them by hand against `data/raw/salinity_stations.json` and `data/raw/roni.txt`.

- [ ] **Step 2: Run, see them fail. Implement. Run `python3 pipeline/fetch_salinity_open.py`, then build and test.**
- [ ] **Step 3: Update the texts** (Decision 5) **and SOURCES.md**: method row, both datasets, the station-name assumption, and the before → after numbers.
- [ ] **Step 4: Phone check, cache bump, commit.** The controller opens and merges the PR.
