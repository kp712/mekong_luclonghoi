# Phase 8: New-Province Outlines Only

**Goal (user, 24 Nov 2026):** remove the former provinces' outlines and keep only the new ones.

## Decisions (user)
1. The Delta map draws only the 6 new provinces, from the official OCHA COD-AB Viet Nam v02 on HDX (34 provinces valid from 1 July 2025, CC BY-IGO). The dotted former borders go.
2. The salt colour is clipped to the new outlines and to 25 km (`salinity.SALT_KM`, passed as `salt_km` in provinces.json) around each station with a reading in that view. This is the same rule that gives a point its estimate, so the former outlines are no longer needed for the clip.
3. The 14 former provinces stay as places: points, search and cards.

## Done in one inline change
- `make_outlines.py`: `load_2025()` caches the 6 provinces in `data/raw/adm1_vnm_2025.geojson.gz`. The join code is removed. `load()` (2020) stays for `fetch_soil.py`.
- `vn.js` / `vn.css`: no inner borders; `clipImage` takes station circles; key text and attribution updated (EN/VI).
- `test_outlines`, SOURCES, README, CLAUDE.md, `sw.js` → `mre-app-16`.
- Skipped: the official-area cross-check. The HDX polygons include coastal water differently from the official km² (e.g. Cà Mau 7,647 vs 6,310), so the check would test nothing useful.
