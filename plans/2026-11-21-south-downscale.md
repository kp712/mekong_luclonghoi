# Downscale to the Mekong Delta + Tây Ninh: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the app from all of Vietnam (34 provinces / 63 former provinces) to the Mekong Delta + Tây Ninh (6 provinces / 14 former provinces), so the team can refine one region before expanding.

**Architecture:** `pipeline/sites.py` is the single list of places. Trimming it trims the fetchers, `build.py` outputs, outlines and tests. The app (`docs/app/vn.js`) reads whatever `provinces.json` and `vn_geo.js` contain; only its fixed home-view box and its wording assume the whole country. The fetch scripts stay unchanged, so adding provinces back later means adding them to `sites.py` and running the fetchers.

**Tech Stack:** Python 3 standard library (pipeline, tests), vanilla JS + Leaflet (app), Playwright via `tools/shot.js` (screenshots).

**Spec:** the decisions below (grilling session, 21 Nov 2026). There is no separate spec file.

## Decisions (the spec)
- **Scope:** new provinces Đồng Tháp, An Giang, Vĩnh Long, Cần Thơ, Cà Mau (`mekong_delta`) and Tây Ninh (`southeast`); 14 former provinces.
- **Out-of-scope places:** remove them from the app, the data and `data/raw/`. Keep the fetchers as they are.
- **Map:** shows only the new area, named "Mekong Delta map" / "Bản đồ Đồng bằng sông Cửu Long". `#vietnam` and `vietnam.html` keep working.
- **Former Long An:** gets rotation cards like the Delta former provinces, with no special note.
- **Former Tây Ninh:** weather only, with the existing "not scored" note. New Tây Ninh's province average is not scored.
- **Cát Lái** (TP. HCM) salinity station: dropped.
- **Offline satellite tiles:** trimmed to the new area.
- **Delivery:** one branch and one PR (`claude/south-downscale`), one commit per task, merged after all tests and screenshots pass.
- **Not in this plan:** refinement work such as new area pins (it gets its own plan), and the `vn-mode` key that lacks the `mre-` prefix.

## Global Constraints
- Every user-facing string has EN and VI. The README is Vietnamese first; `SOURCES.md` is English.
- `docs/app/builder.js` and `docs/app/vn_geo.js` are generated files: change them only by running `pipeline/build.py` and `pipeline/make_outlines.py`.
- Edits to Vietnamese text: read and write with `encoding="utf-8"`. For multi-line edits, use a Python string replace with an assert.
- Tests: `python3 pipeline/test_build.py` (expect only `ok` lines plus the known warnings). Screenshots: `node tools/shot.js` must exit 0.
- Commit trailers come from the session reminder. No model names.

## Review Focus
1. **Old link `index.html#vietnam`:** must open the new map, centred on the new area, with no page error. Checked by Task 4 step 4.
2. **Searching for a removed province** (for example "Hà Nội" in the map's search box): must show no results, with no error and no stray marker. Checked by Task 4 step 4.
3. **Phones holding the old app:** after the update, the map must not mix old outlines with new data. The `CACHE` bump in Task 4 makes `sw.js` fetch everything again.
4. **Country salt count on the dashboard** ("{n} of {t} points with an estimate reach 4‰"): must count the 14 points, not 63. Checked by Task 4 step 4.
5. **Former Long An's salinity:** must come from its own nearest station (Tân An, within 25 km), never from Cát Lái. Checked by the test in Task 2.

---

### Task 1: Trim the place list and score Long An

**Files:**
- Modify: `pipeline/sites.py` (`PROVINCES`, `REGIONS`, the region name table near line 124, new `SCORED_PLACES`)
- Modify: `pipeline/build.py:1178` (scoring of former-province points)
- Test: `pipeline/test_build.py` (counts near lines 750–875)

**Interfaces:**
- Produces:
  - `sites.PROVINCES`: the 6 in-scope entries, in their current order and with their current fields.
  - `sites.REGIONS`: only `southeast` and `mekong_delta`.
  - `sites.SCORED_PLACES = ("long_an",)`.
  - `build.py`: a former-province point is scored when `pr["region"] in SCORED_REGIONS or f["id"] in SCORED_PLACES`. The province average keeps `pr["region"] in SCORED_REGIONS`, so new Tây Ninh's average stays unscored.

- [ ] **Step 1: Update the tests**

  Change the count assertions:
  - `len(ids) == 6` and `len(former) == 14` (line 753).
  - `len(pts) == 5 + 14` (line 763).
  - `len(places) == 14` (line 836).
  - `sum(x["own"] for x in places) == 6` and `sum(x["scored"] for x in places) == 13`, with the comment "Mekong Delta 12 + Long An" (line 864).
  - `len(g["former"]) == 14` (line 875).
  - Update the comment on line 750.

  Add:
  ```python
  long_an = next(x for x in places if x["id"] == "long_an")
  tay_ninh = next(x for x in places if x["id"] == "tay_ninh")
  assert long_an["scored"] and long_an["cards"] and not tay_ninh["scored"] and not tay_ninh["cards"]
  ```

- [ ] **Step 2: Run the tests and confirm they fail**

  Run `python3 pipeline/test_build.py`. Expected: an AssertionError on the 34/63 counts.

- [ ] **Step 3: Trim `PROVINCES`, `REGIONS` and the name table in `sites.py`, add `SCORED_PLACES`, and change the scoring line in `build.py`**

  Fix any docstring in `sites.py`, `make_outlines.py` or `build.py` that says "34" or "63".

- [ ] **Step 4: Rebuild**

  Run `python3 pipeline/build.py`. Expected: "wrote … 6 provinces, 14 province points".

  `make_outlines.py` will still fail at this point; Task 3 fixes it. The outline test stays red until Task 3, so run only the other tests in Step 5.

- [ ] **Step 5: Run the tests**

  Expected: all pass except the outline test (`test_outlines` or its equivalent near line 868).

- [ ] **Step 6: Commit**

  Commit `sites.py`, `build.py`, `test_build.py` and `docs/data/` with the message "Scope: Mekong Delta + Tây Ninh; score former Long An".

### Task 2: Drop Cát Lái

**Files:**
- Modify: `pipeline/sites.py` (new `OUT_OF_SCOPE_STATIONS`)
- Modify: `pipeline/build.py` (`kttv_stations()` near line 735, `kttv_salinity()` near line 783)
- Test: `pipeline/test_build.py`

**Interfaces:**
- Consumes: `sites.PROVINCES` from Task 1.
- Produces: `sites.OUT_OF_SCOPE_STATIONS = ("Cát Lái",)`. `kttv_stations()` and `kttv_salinity()` skip these names. `data/raw/kttv_stations.json` and the bulletin file stay unchanged, so the fetchers are untouched.

- [ ] **Step 1: Write the failing test**
  ```python
  def test_out_of_scope_station():
      prov = json.loads((build.HERE.parent / "docs" / "data" / "provinces.json").read_text(encoding="utf-8"))
      assert "Cát Lái" not in {s["name"] for s in prov["stations"]}
      la = next(x for x in prov["places"] if x["id"] == "long_an")
      assert "Tân An" in json.dumps(la["salinity"], ensure_ascii=False)   # its own nearest station, never Cát Lái
  ```
  Match the field names to `provinces.json` (`stations[].name` and the salinity station field). The rule is fixed: no Cát Lái anywhere, and Long An uses Tân An.

- [ ] **Step 2: Run the test and confirm it fails**

  Expected: an AssertionError, because Cát Lái is still in `stations`.

- [ ] **Step 3: Implement the skip, rebuild, and run all tests**

  Expected: everything passes except the outline test.

- [ ] **Step 4: Commit**

  Message: "Drop Cát Lái station (outside the new area)".

### Task 3: Outlines for the new area only

**Files:**
- Modify: `pipeline/make_outlines.py:191-192`
- Regenerate: `docs/app/vn_geo.js`
- Test: `pipeline/test_build.py` (outline test near line 868; update its docstring to "14 former + 6 joined provinces")

**Interfaces:**
- Consumes: `sites.PROVINCES`.
- Produces: `vn_geo.js` holding only the 14 former and 6 joined outlines.

- [ ] **Step 1: Change the equality assert into a filter**

  Keep only the in-scope geometry: `geo = {k: v for k, v in geo.items() if k in former_ids}`, then `assert set(geo) == former_ids`. This keeps the existing name check for in-scope provinces.

- [ ] **Step 2: Regenerate the outlines**

  Run `python3 pipeline/make_outlines.py`. Expected: the printed size is much smaller than today's 294 KB.

- [ ] **Step 3: Run all tests**

  Expected: all pass.

- [ ] **Step 4: Commit**

  Message: "Outlines: Mekong Delta + Tây Ninh only".

### Task 4: The map shows the new area

**Files:**
- Modify: `docs/app/vn.js`:
  - `MAIN` at line 92;
  - the title string at line 16;
  - `keyNote` at line 24;
  - the comments at lines 1–3, 108, 123 and 631.
- Modify: `docs/index.html:40` (footer link text) and any string in `docs/app/strings.js`, `app.js` or `onboard.js` that says the whole country, 34 provinces or 63 points. Find them with `grep -n "34\|63\|cả nước\|Vietnam map\|Bản đồ Việt Nam\|Bản đồ 34"`.
- Modify: `docs/sw.js:8`, `CACHE = "mre-app-4"`.
- Test: `pipeline/test_build.py`, new `test_map_box`.

**Interfaces:**
- Consumes: `vn_geo.js` from Task 3 and `provinces.json` from Task 1.
- Produces: `MAIN` is the new area's bounding box, plus a 0.1° margin, rounded outward to 0.1°. Use the outline extent printed by the test below (expected roughly w 103.8, e 107.1, s 8.4, n 11.9).

- [ ] **Step 1: Write the failing test**

  Add `test_map_box`. It reads `vn.js`, takes `MAIN = { w: …, e: …, s: …, n: … }` with a regex, and takes every coordinate pair from `vn_geo.js` the same way the outline test does. Then assert:
  - every outline point lies inside `MAIN`;
  - `MAIN` is at most 0.3° wider than the outline extent on each side.

  Print the extent, so the step 3 values come from the data.

- [ ] **Step 2: Run the test and confirm it fails**

  Expected: it fails on the "at most 0.3° wider" check, because `MAIN` is still the whole country.

- [ ] **Step 3: Implement the map changes**
  - Set `MAIN` from the printed extent.
  - Title: `["Mekong Delta map", "Bản đồ Đồng bằng sông Cửu Long"]`.
  - `keyNote`: read the point count from the data (`D.places.length`) instead of the hard-coded 63, in both EN and VI.
  - Footer link text: "Bản đồ ĐBSCL" / "Mekong Delta map".
  - Bump `CACHE`.
  - Fix the stale comments.
  - Leave the `#vietnam` handling at line 639 as it is.

- [ ] **Step 4: Verify in the browser**
  - Run `node tools/shot.js` (the default page is `index.html#vietnam`). Expected: exit 0, and both screenshots show only the six provinces, filling the view.
  - Run a short Playwright check, written to the scratchpad and modelled on `tools/shot.js`. It types "Hà Nội" into the map search box, then reads the country salt line. Expected:
    - no page errors;
    - the search shows no results;
    - the salt line reads "… of 14 points …" / "… trên 14 điểm …".

- [ ] **Step 5: Commit**

  Message: "Map: Mekong Delta + Tây Ninh view and wording".

### Task 5: Remove out-of-scope data and tiles

**Files:**
- Delete from `data/raw/`: `power_<id>.json.gz`, `soil_<id>.json` and `ndvi_<id>.json` for the 49 removed former-province ids. Also delete their entries in `gpm.json`.
- Delete from `docs/app/tiles/sat/`: every tile whose box misses `MAIN`.
- Regenerate the `sat` list in `docs/app/tiles.js` from the files left on disk.
- Test: `pipeline/test_build.py`, new `test_no_orphans`.

**Interfaces:**
- Consumes: `sites.points()` (Task 1) and `MAIN` (Task 4).

- [ ] **Step 1: Write the failing test**

  Add `test_no_orphans`:
  - every `data/raw/{power,soil,ndvi,hls}_<id>.*` file has an id in `{p["id"] for p in sites.points()}`;
  - `set(json.load(gpm.json)) == that id set`;
  - the `sat` list in `tiles.js` equals the tile files on disk, and every listed tile's box intersects `MAIN`.

- [ ] **Step 2: Run the test and confirm it fails**

  Expected: it lists the orphan ids.

- [ ] **Step 3: Delete the orphans and the tiles outside `MAIN`, and rewrite the `sat` list**

  Use a scratchpad script that prints what it deletes; check the list before running it with deletion on.

- [ ] **Step 4: Rebuild and run all tests**

  Run `python3 pipeline/build.py` then the tests. Expected: everything passes, and `git status` shows no change in `docs/data/`.

- [ ] **Step 5: Commit**

  Message: "Remove data and offline tiles outside the new area".

### Task 6: Words everywhere else, then PR

**Files:**
- Modify: `README.md` (Vietnamese first, then English): the scope sentences, "Bản đồ cả nước…", "8 trên 63 điểm có ước tính mặn", and the English equivalents.
- Modify: `SOURCES.md`: retitle "## The 34 provinces" to "## The 6 provinces" and update its counts; fix every other "34" or "63" that means scope.
- Modify: `CLAUDE.md`: the data rule "The 34 new-province averages…" becomes 6, the description line says "Mekong Delta + Tây Ninh", and `make_outlines.py` is described as in scope only.
- Modify: `plans/2026-11-21-refinement.md`: no change. The new plan file gets its boxes ticked.

- [ ] **Step 1: Find every remaining scope claim**

  Run `grep -rn "34 \|63 \|cả nước\|whole country\|all of Vietnam\|nationwide" README.md SOURCES.md CLAUDE.md docs/app/*.js docs/index.html` (skip `vn_geo.js`), and fix each hit that is about scope.

- [ ] **Step 2: Run all tests and `node tools/shot.js` once more**

  Expected: all pass and exit 0.

- [ ] **Step 3: Commit, then open the PR**

  Message: "Docs: Mekong Delta + Tây Ninh scope".

  Open the PR as a draft, mark it ready, and merge with the full head SHA.
