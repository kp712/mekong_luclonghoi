# Mekong Rotation Explorer: notes for Claude

A static PWA for Mekong Delta rice farmers and extension officers (NASA Space Apps 2026). Sóc Trăng farmers first. This repo replaces `luclonghoi_jsc`.

## Commands
- Tests: `python3 pipeline/test_build.py` (plain `test_*` functions, no pytest). Run them after any change to `pipeline/` or `docs/data/`.
- Rebuild data: `python3 pipeline/build.py` writes `docs/data/sites.json` and `docs/data/provinces.json`. It keeps the old `generated` date when nothing else changed, so any diff in `docs/data/` after a build is a real change: commit it.
- Salinity bulletins: `python3 pipeline/fetch_salinity_vietnam.py` writes `data/raw/salinity_kttv_vietnam.json`. It writes nothing if any fetch fails.
- Screenshots: `node tools/shot.js [page] [outdir]`. The default page is `index.html#vietnam`. It takes desktop and phone shots and exits 1 on page errors.
- Serve by hand: `python3 -m http.server 8000 -d docs`.

## File map
- `docs/index.html` is the app. `vietnam.html` redirects to it, and `classic.html` plus `docs/app.js` and `i18n.js` are the old version.
- `docs/app/`:
  - `map.js`: the Sóc Trăng planner map.
  - `vn.js`: the country map (salt layer, station blend, year buttons).
  - `vn_geo.js`: province outlines, written by `pipeline/make_outlines.py`.
  - `rx.js`: the salt model, `RX.Model.profile`.
  - `dash.js`: the dashboard cards.
  - `app.js`: the planner.
  - `builder.js`: plan-builder data. It must match `sites.json`; `test_builder_salt_sync` checks this.
  - `strings.js`: EN/VI text.
  - `extra.js`: layout glue.
  - `load.js`: loads data and registers `sw.js`.
- `docs/sw.js` is the offline cache. When you add a file the app needs offline, add it to `PRECACHE`; `test_offline_precache` checks this.
- `pipeline/build.py` merges everything. The salinity rules are in `station_*`, `kttv_*`, `site_salinity`, `table_rows`, `full_last_year`.
- `data/raw/` holds the fetched inputs. `salinity_stations.json` is the Sóc Trăng paper table plus `lower_bound` seasons. `kttv_stations.json` has the approximate OpenStreetMap coordinates of the stations.
- `research/` holds findings that did not become data (sources, values, dead ends). Read the relevant note before searching the web.
- `plans/` holds plan files. `SOURCES.md` has the full methods and data detail.

## Reading big files
`README.md` (26 KB), `SOURCES.md` (52 KB), `build.py`, `test_build.py`, `dash.js`, `app.js` and `vn_geo.js` are large. Find what you need with grep, then read only those lines. Never read `vn_geo.js`.

## Data rules (full detail in SOURCES.md)
- Salinity at a point comes from the nearest KTTV station within 25 km. Beyond that there is no estimate, and the text names the station and its distance (past 100 km: "outside the area covered by KTTV").
- The seasons used are 2017–2026. A season counts as El Niño when its Dec–Feb ONI is at least 0.5. A season is partial when it has no February or no March reading.
- Salt months are months that reached 4‰ or more in at least 2 seasons. If there are none, use any season's contiguous range. Months outside them show "< 4‰", never 0‰.
- The 34 new-province averages are always "unknown": they tell the user to pick a former province.
- A reading taken while salt is still rising (Khánh Hòa, April 2026) goes in `lower_bound`. It counts toward the typical value but never raises confidence.
- Kiên Giang has no estimate. Soil maps were checked and rejected; see `research/soil-salinity-maps.md`.
- Never show model or map values to farmers as measured readings. Say where every number comes from.

## House rules
- Ask the user with multiple-choice question boxes (AskUserQuestion), as often as useful. Give a recommended option first.
- Work on a `claude/*` branch with one PR per finished task; batch small notes and fixes into it. Create the PR as a draft, mark it ready, then merge it into `main` right away (the user's standing rule). Merge needs the full 40-character head SHA (`git rev-parse HEAD`).
- End commit messages with the attribution lines from the session reminder. Never put model names in commits, code or PRs.
- Use subagents only for long web research. Make code changes and reviews inline.
- Store research findings in `research/<topic>.md`, with raw quotes in `research/data/`.
- Keep the app bilingual: every user-facing string gets EN and VI.

## Gotchas
- Cloud sessions block background servers. Start the server inside the test script, as `tools/shot.js` does.
- To skip onboarding in a browser test, set localStorage `d5-onb1` and `d5-onb2` to `"1"`.
- Python edits to Vietnamese text: read and write with `encoding="utf-8"`. For multi-line edits, use a Python string replace with an assert, not sed.
- Vietnamese government sites (`*.soctrang.gov.vn`) and `web.archive.org` are unreachable from the cloud sandbox.
