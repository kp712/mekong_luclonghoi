# KTTV Salinity for Province Points: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every province point near a salinity station a salt estimate (level, salt months, typical and El Niño views) from the national KTTV bulletins. Extend Sóc Trăng's salinity to the 2026 dry season where that season's readings cover the usual peak months. Show the result in the province panel and cards, the "Salt this month" tile, the hover card and the country map's salt layer.

**Architecture:** `pipeline/fetch_salinity_vietnam.py` collects every KTTV 10-day bulletin, keyed by **station** (the province names in the bulletins changed after 1 July 2025 and are not used). A new station table, `data/raw/kttv_stations.json`, gives each station's coordinates. `pipeline/build.py` merges the Sóc Trăng yearly table with the KTTV seasons into one record per station. It gives salinity its own window (the last 10 dry seasons, 2017–2026) and assigns each province point its nearest station within 25 km. The app (`docs/app/vn.js`, `docs/app/rx.js`) reads the new `salinity` blocks that `provinces.json` already carries.

**Tech Stack:** Python 3.10+ standard library (pipeline), `pdfplumber` (fetch script only, already imported there), plain JS + Leaflet (app). Tests: `python pipeline/test_build.py` (plain `test_*` functions with asserts).

**Spec:** The decisions recorded in the session of 20–21 Nov 2026 (summarised in Global Constraints). There is no separate spec file.

## Global Constraints

- Ignore `data/raw/salinity_vietnam_summary.json`'s province → station mapping: it gives inland former provinces coastal readings. Match stations **by name** across all bulletins.
- Fix `pipeline/fetch_salinity_vietnam.py`. It imports a missing module (`vietnam_sites`; use `sites.points()` / `sites.PROVINCES`), and its output must be station-keyed, not province-keyed.
- Station coordinates: use a published source first (official or scientific). Otherwise place the station at its named town or commune on the named river with OpenStreetMap, marked `"approximate": true`. Every station records its `source`.
- Station rule: each province point uses its **nearest** station. If that station is **more than 25 km** away, the point keeps today's "no salinity estimate" (`UNKNOWN`).
- Salinity window: the **last 10 dry seasons with data, 2017–2026**, for Sóc Trăng pins and KTTV points alike. The NASA weather period (`PERIOD`, Dec 2000 – Nov 2024) does not change. A dry season is named by the year it ends in (Jan–May).
- El Niño split: a dry season `y` is El Niño when NOAA's Dec–Feb ONI for `y` is ≥ 0.5 (`data/raw/oni.txt`): 2024 is (1.84); 2025 (−0.46) and 2026 (−0.39) are not. The typical view uses non-El Niño seasons and the El Niño view uses El Niño seasons, as `station_salt()` does today. An El Niño view resting on one season says so.
- Missing months: first try to download every bulletin KTTV has online. A season whose bulletins have no reading in **February or in March** is "partial". Its card text says "highest in the bulletins found; may miss an earlier peak".
- Sóc Trăng 2026: append a station's 2026 peak to its record **only if** the 2026 bulletins have readings in both February and March. Otherwise leave it out, and say why in `salinity_stations.json`'s `_readme`.
- Salt months (KTTV points): months whose 10-day readings reached **4‰** (`SALT_MED`) in **at least 2** seasons. A bulletin's month is its issue date's month (issue dates are the 10th, 20th and last day of a month).
- Province average view: **no estimate**. Its salt line tells the farmer to pick a former province to see its salt.
- Confidence: the existing rule (`seasons < 5` or `last_year <= 2022` drops one level) applies unchanged.
- Country map salt layer: **blend between points with an estimate**, like the rain layer. Clip it to the outlines of provinces that have at least one estimated point. A point's monthly value comes from the same `profile(months, peak)` the Sóc Trăng areas use (`docs/app/rx.js`).
- All new user-facing text comes in English and Vietnamese, in the codebase's `line(en, vi)` / `[en, vi]` pattern.

## Review Focus

1. **An inland point next to a merged province name.** Former Đồng Tháp (Cao Lãnh), An Giang (Long Xuyên), Cần Thơ city and Vĩnh Long must not get coastal readings; they get their nearest station or "no estimate". Task 3 tests Cao Lãnh and Long Xuyên by name.
2. **A station printed with a blank or "-" reading.** A null reading is skipped, never counted as 0‰. Task 1 tests the parser on a blank cell.
3. **A season that has only April–May bulletins.** It is marked partial and must not lower a Sóc Trăng level. Task 3 tests the Feb+Mar rule for 2026.
4. **The same station under two province names** (e.g. Gò Quao under Kiên Giang in 2024 and under An Giang in 2026). It is one station with all its readings. Task 1 tests merging by name.
5. **A point exactly at the 25 km limit, and a station with no coordinates.** ≤ 25 km gets an estimate. A station missing from `kttv_stations.json` stops the build with its name, like the missing-GPM error. Task 2 tests that.

---

### Task 1: Station-keyed KTTV bulletins (fix and extend the fetch script)

**Files:**
- Modify: `pipeline/fetch_salinity_vietnam.py` (import at line 18, `discover_kttv_pdfs` at 61–84, summary at 170–223)
- Rewrite (generated): `data/raw/salinity_kttv_vietnam.json`, `data/raw/salinity_vietnam_summary.json`
- Test: `pipeline/test_build.py`

**Interfaces:**
- Produces `data/raw/salinity_kttv_vietnam.json`: `{"source": {...}, "bulletins": {"YYYY-MM-DD": {"url": str, "readings": {station_name: float}}}}`. Station names are exactly as printed, and null readings are dropped. The province names from the PDF are not stored.
- Produces `data/raw/salinity_vietnam_summary.json`: `{station_name: {"river": str, "readings": int, "max_ppt": float, "first": "YYYY-MM-DD", "last": "YYYY-MM-DD"}}`. It no longer has province keys or statuses.
- Produces `parse_float(val: str) -> float | None` (existing; must return `None` for `""`, `"-"`, `"—"`).

- [ ] **Step 1: Write the failing tests.** `test_kttv_bulletins_by_station()`: every bulletin has a `readings` dict; no bulletin entry has a `province` field; `"Gò Quao"` appears in bulletins from both 2024 and 2026; there are at least 23 bulletins. `test_kttv_parse_blank()`: `parse_float("")`, `parse_float("-")` and `parse_float("—")` are `None`, and `parse_float("10,4") == 10.4`.
- [ ] **Step 2: Run** `python pipeline/test_build.py`. Expected: the two new tests FAIL, on the old file shape and on the missing `vietnam_sites` import.
- [ ] **Step 3: Fix the import.** Replace `from vietnam_sites import VIETNAM_SITES` with `import sites` (the script runs from `pipeline/`) and drop the province summary loop.
- [ ] **Step 4: Page through the listing.** `discover_kttv_pdfs()` must follow the listing's pages until a page has no new posts. Open `https://kttv.gov.vn/kttv/vi-VN/1/xam-nhap-man-20-18.html`, find the paging request behind its `pageindex` / `_totalrecord` script (look in the browser network tab, or in the inline JS), and loop over it. Keep the existing `salinity_bulletins.json` URLs as seeds.
- [ ] **Step 5: Run the script.** Run `python pipeline/fetch_salinity_vietnam.py`, then print a coverage table: for each dry season 2024, 2025 and 2026, the months that have at least one bulletin. Expected: at least the 23 existing dates, plus any January–March 2024 and 2026 bulletins KTTV still serves. Record the table in the commit message.
- [ ] **Step 6: Run** `python pipeline/test_build.py`. Expected: the two new tests PASS, and the existing tests still pass.
- [ ] **Step 7: Commit** `git add pipeline/fetch_salinity_vietnam.py data/raw/salinity_kttv_vietnam.json data/raw/salinity_vietnam_summary.json pipeline/test_build.py && git commit -m "KTTV salinity: key bulletins by station, page through all bulletins"`

### Task 2: Station coordinates

**Files:**
- Create: `data/raw/kttv_stations.json`
- Test: `pipeline/test_build.py`

**Interfaces:**
- Produces `data/raw/kttv_stations.json`: `{"_readme": str, "stations": {station_name: {"lat": float, "lon": float, "river": str, "approximate": bool, "source": {"title": str, "url": str}}}}`. It covers every station name in `salinity_kttv_vietnam.json`.

- [ ] **Step 1: Write the failing test** `test_kttv_station_coords()`. Every station in any bulletin has an entry. Each entry has `8.3 <= lat <= 11.2` and `104.4 <= lon <= 107.1`, plus a `source` with a non-empty `url`, and a boolean `approximate`.
- [ ] **Step 2: Run** `python pipeline/test_build.py`. Expected: FAIL (the file is missing).
- [ ] **Step 3: Research and write the table.** For each station, look first for published coordinates: KTTV/NCHMF station lists, the Southern Institute of Water Resources Research (SIWRR), or the Nguyễn Trọng Khanh et al. 2025 paper already cited in `pipeline/salinity.json`. That gives `approximate: false` and the source URL. Otherwise use OpenStreetMap Nominatim for "<station> <river>" (the town or commune on that river), with `approximate: true` and source `{"title": "OpenStreetMap Nominatim, place '<query>'", "url": <the nominatim URL>}`. Send a generic User-Agent and wait 1 second between requests, per Nominatim's policy.
- [ ] **Step 4: Run** `python pipeline/test_build.py`. Expected: PASS.
- [ ] **Step 5: Commit** `git add data/raw/kttv_stations.json pipeline/test_build.py && git commit -m "KTTV salinity station coordinates (published first, else OSM, marked)"`

### Task 3: Salinity engine in build.py (window, merge, nearest station)

**Files:**
- Modify: `pipeline/build.py`: constants near line 62; `station_salt` 593–598; `peak_months` 601–605; `site_salinity` 608–618; `place()` 926–963; `province_place` (the average, ~905–923)
- Modify: `data/raw/salinity_stations.json` (`_readme`, plus 2026 rows only where the Feb+Mar rule allows)
- Test: `pipeline/test_build.py`

**Interfaces:**
- Consumes: Task 1's bulletins file and Task 2's station table.
- Produces:
  - `SALT_SEASONS = (2017, 2026)`: an inclusive range of dry-season end years. It replaces `RECENT` in `station_salt` and `peak_months` only.
  - `salt_elnino(y: int) -> bool`: Dec–Feb ONI of year `y` ≥ 0.5, read from `oni.txt` (no `PERIOD` filter).
  - `station_record(name: str) -> dict[int, tuple[float, int, bool]]`: `{season: (max_ppt, month, partial)}`. Sóc Trăng table rows come first (with `partial=False`); KTTV seasons fill only the seasons the table lacks.
  - `kttv_salinity(lat: float, lon: float) -> tuple[dict, dict] | None`: `(typical, elnino)` in the same dict shape `site_salinity` returns (`months, note, station_ppt, estimate, seasons, last_year, level, max_ppt`), plus `station: str`, `km: float` and `partial: bool`. It returns `None` when the nearest station is more than `SALT_KM = 25` km away.
  - In `provinces.json`, each place gets `salinity` (typical) and `elnino.salinity`. A province average keeps `UNKNOWN`, with a note pointing the farmer to the former provinces.

- [ ] **Step 1: Write the failing tests.**
  - `test_salt_window()`: `salt_elnino(2024)` is True; `salt_elnino(2025)` and `salt_elnino(2026)` are False. `station_salt("tran_de", False)` covers 2017 as its first season and 2025 or later as its last.
  - `test_station_record_merge()`: `station_record("Trần Đề")[2024][0] == 23.7` (the table value wins over KTTV's). If 2026 is partial for Trần Đề, 2026 is absent.
  - `test_kttv_nearest()`: the former Bến Tre point gets a level other than `UNKNOWN`. The Cao Lãnh (`dong_thap`) and Long Xuyên (`an_giang`) points get either `None` or a station other than "Vàm Kênh", "Gò Quao" and "An Ninh". A point placed 25.0 km from a station gets that station.
  - `test_kttv_salt_months()`: for a station whose readings reach ≥ 4‰ in March in 2 seasons, 3 is in `months`; a month that reaches 4‰ in only 1 season is not.
  - `test_kttv_partial_label()`: for a partial season, `partial` is True and the note's English text contains "may miss an earlier peak".
  - `test_province_average_salt()`: every `provinces[*].salinity.level == "unknown"`, and its note mentions the former provinces.
- [ ] **Step 2: Run** `python pipeline/test_build.py`. Expected: the six new tests FAIL.
- [ ] **Step 3: Implement** `SALT_SEASONS`, `salt_elnino`, `station_record`, `kttv_salinity` and the `station_salt` / `peak_months` window change. A missing station in `kttv_stations.json` raises `ValueError(f"no coordinates for KTTV station {name}")`. Distance: use the existing haversine pattern (km).
- [ ] **Step 4: Wire it in.** In `place()`: `sal, sal_e = kttv_salinity(f["lat"], f["lon"]) or (unknown_salinity(),) * 2`. Typical cards use `sal`, El Niño cards use `sal_e`, and the `elnino` dict gets `"salinity": sal_e`. In `province_place`, replace the note with one saying salt is shown per former province.
- [ ] **Step 5: Apply the Feb+Mar rule** for 2026 at the Sóc Trăng table stations. Append qualifying rows to `salinity_stations.json` with a `source` pointing at the KTTV bulletin URLs, and record the outcome in its `_readme` either way.
- [ ] **Step 6: Run** `python pipeline/build.py && python pipeline/test_build.py`. Expected: all tests PASS. Then compare the Sóc Trăng levels and the confidence reasons before and after in `docs/data/sites.json`, and list any changed level in the commit message.
- [ ] **Step 7: Commit** `git add pipeline/build.py pipeline/test_build.py data/raw/salinity_stations.json docs/data/sites.json docs/data/provinces.json && git commit -m "Salinity for province points from KTTV (nearest station within 25 km); salt window 2017–2026"`

### Task 4: Show it in the app (tile, hover card, country salt layer)

**Files:**
- Modify: `docs/app/rx.js:280`: add `profile` to `Model`'s returned object.
- Modify: `docs/app/vn.js`: `card()` (~line 328, the "Salt this month" tile), `cardHTML()` (~361, the hover-card salt line), `paint()` (~150, the salt branch), `layerHTML()` (~176, `saltH` / `saltNote` text)

**Interfaces:**
- Consumes: Task 3's `place.salinity` / `place.elnino.salinity` (`months`, `max_ppt`, `level`, `station`, `km`, `partial`).
- Produces: `RX.Model.profile(salt: number[], peak: number, fresh: boolean) -> number[12]` (the existing function, now exported).

- [ ] **Step 1: Export** `profile` from `RX.Model`.
- [ ] **Step 2: "Salt this month" tile.** For a point view with an estimate, show `profile(months, max_ppt, level === "low")[mon]` as "X‰", plus the station name and distance (e.g. "Trạm Bình Đại, 12 km"). The average view and `UNKNOWN` keep "Chưa có" / "No data".
- [ ] **Step 3: Hover-card salt line.** Replace the fixed `noSalt` text with the level word and this month's ‰ when the hovered point has an estimate.
- [ ] **Step 4: Country salt layer.** In `paint()`, salt mode now draws `clipImage` with `idw` over points that have an estimate. Each point's value is `profile(...)[mon]` for the current year view. Use the `SALT` ramp scaled 0.5–15‰, and clip to the rings of provinces with at least one estimated point. Update `saltH` to "Salt in the water (‰), at river stations" (English and Vietnamese), and `saltNote` to say the colour blends between stations and is an estimate.
- [ ] **Step 5: Verify in the browser.** Use the scratchpad Playwright scripts (`shot.js`, `flow.js`) at iPhone 13 and 1280×800 in Vietnamese:
  - Bến Tre's tile shows a ‰ value and its station.
  - Cao Lãnh shows "Chưa có".
  - The salt layer colours the coastal Delta, leaves the inland provinces outside the clip blank, and changes with the month slider.
  - There are no page errors.
- [ ] **Step 6: Commit** `git add docs/app/rx.js docs/app/vn.js && git commit -m "Country map: salt for province points (tile, hover card, salt layer)"`

### Task 5: README

**Files:**
- Modify: `README.md`:
  - the "Where each number comes from" salinity row (line ~110);
  - "The 34 provinces" Salinity bullet (~133);
  - the Limitations bullets (~73–74, ~284);
  - the test count (lines ~66, ~234, ~363).

- [ ] **Step 1: Update the text.** Cover the KTTV source and its station-name matching, the 25 km rule, the 2017–2026 salt window, the partial-season label, Sóc Trăng's 2026 outcome, and the new test count from `python pipeline/test_build.py`.
- [ ] **Step 2: Commit** `git add README.md && git commit -m "README: KTTV salinity for province points"`
