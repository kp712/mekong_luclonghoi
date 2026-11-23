# Domain glossary

The project's own words. Use them in code, docs and reviews.

- **Area (pin):** one of the 5 preset places in former Sóc Trăng that the planner shows (`sites.SITES`, `docs/data/sites.json`). Each sits on rice at 30 m.
- **Province:** one of the new provinces since July 2025 that the map covers (`sites.PROVINCES`). Its numbers are averages of its province points; its salt is always "unknown".
- **Former province / province point:** a pre-2025 province inside a Province, with one data point at its former capital (`places` in `provinces.json`).
- **Scored:** a point that gets rotation cards (the Mekong Delta's former provinces and former Long An). The others show weather only.
- **Rotation:** one of the 5 cropping patterns in `pipeline/rotations.json` (3 rice crops, 2 rice crops, rice–shrimp, rice + upland crop, salt-tolerant rice).
- **Card:** a rotation scored for one place and one view: five scores, confidence, profit, water and the evidence behind them.
- **Plan:** a 12-month calendar of crop codes: `R` rice, `T` salt-tolerant rice, `S` shrimp, `U` upland crop, `-` rest. A card's plan is its `months`; the Plan Lab lets users paint their own.
- **Scores:** water, weather & salt (`salt`), soil, pests and income, each 1–5 (higher is better). `build.py` is the source of record; `docs/app/score.js` gives the same results in the browser (`test_score_parity`).
- **Confidence:** High / Medium / Low for a card, from the evidence behind it (`build.confidence`).
- **View:** typical year or El Niño year (Dec–Feb RONI of 0.5 or more (NOAA's Relative Oceanic Niño Index)).
- **Station:** a KTTV river or canal salinity station. A point's salinity comes from its nearest station within 25 km.
- **Salt months:** months that reached 4‰ or more in at least 2 dry seasons at the station.
- **Bare months / field calendar:** months when the fields are usually bare (MODIS or HLS greenness below 0.3); bare February–April raises the upland and salt-tolerant cards one confidence level.
