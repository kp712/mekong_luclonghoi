# Mekong Rotation Explorer
**Team Lục Long Hội · NASA Space Apps Challenge 2026**

Rice farmers in coastal Sóc Trăng, in Vietnam's Mekong Delta, grow two or three rice crops a year on land that is running short of fresh water and is reached by sea salt in the dry season. Mekong Rotation Explorer is a phone app that compares a farmer's current rotation with the local alternatives (rice–shrimp, rice plus a dry-season upland crop, salt-tolerant rice with a rest period), ranks them by what the farmer cares about using NASA Earth data for their area, and turns the chosen one into a day-by-day view of their field and a 12-month plan. It works in Vietnamese and English.

**Try it:** **https://kp712.github.io/luclonghoi_jsc/** (no login). Tap **Try a sample field** to see a field already planned, or **Create a field** to pick an area on the map. Methods, formulas and every source: **[Methods and data](#methods-and-data)** below.

| On a phone (Vietnamese) | On a computer (English) |
|---|---|
| <img src="media/phone.jpg" alt="The app on a phone in Vietnamese: today's date with a 1, 2 or 3-year preview strip, the sample field in Mỹ Xuyên on fresh water, its plan of 3 rice crops a year, a drawn rice field and the current crop at day 53 of 95 with 42 days to harvest, and the bottom bar: Today, Season, Plan, Data, Fields" width="300"> | <img src="media/desktop.jpg" alt="The app on a computer in English: the sample field's current rice crop with days to harvest and the next step, this month's rain (NASA GPM IMERG), crop water need (NASA POWER) and greenness (NASA MODIS NDVI), and this month's pest level for brown planthopper" width="500"> |

## What it does
1. **Pick your area and say what you grow.** Five areas of the former Sóc Trăng province, from the coast (Vĩnh Châu, Trần Đề) to inland (Ngã Năm). The farmer enters each field: its size and what is in it now.
2. **Compare rotations.** **Plan (+)** ranks the options for that area by five priorities: save water, more income, better soil, lower weather & salt risk, fewer pests. Each card shows its calendar, its scores, why it is suggested, its benefits and its risks, with numbered sources. The upland option lets the farmer choose watermelon, maize or mung bean. A typical year and an El Niño year can be compared; the app opens on El Niño while NOAA forecasts one.
3. **Follow the field day by day.** **Today** shows the crop in the field (a drawn field scene, days to harvest, the next job), this month's rain against what the crop needs, field greenness and this month's pest level, each with the NASA dataset it comes from. The date bar plays the coming 1, 2 or 3 years.
4. **See the season and the evidence.** **Season** is the 12-month calendar. **Data** shows salt in the field and over 12 months, the months a crop is safe from salt, estimated profit, the five scores, the El Niño outlook, sowing and harvest reminders, and a multi-year view.
5. **Several fields, one phone.** **Fields** keeps each field's area, crops, priorities and plan, saved on that phone only.

**Simple** (plain words, larger text) and **Advanced** (every number and score) show the same data. The app works offline-light: if the map library fails to load, the rotation cards and plan still appear.

## NASA data it uses
| Dataset | What it gives the app | Resolution, period |
|---|---|---|
| [NASA GPM IMERG Final monthly v07](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary) | Rain each month | ~10 km, Dec 2000 – Nov 2024 |
| [NASA POWER daily API](https://power.larc.nasa.gov/) (MERRA-2 based) | Temperature, humidity, wind and sunlight → crop water demand (FAO-56 Penman–Monteith ET₀); days at or above 35 °C; mean temperature for pest pressure | ~50 km, Dec 2000 – Nov 2024 |
| [NASA MODIS MOD13Q1 v6.1 NDVI](https://lpdaac.usgs.gov/products/mod13q1v061/) via [NASA AppEEARS](https://appeears.earthdatacloud.nasa.gov/) | Field greenness, crops per year, months fields are usually bare | 250 m, 16-day, 2000–2025 |

Other data, not NASA: SoilGrids 2.0 topsoil (a model, not a soil test); NOAA's El Niño index and monthly forecast; salinity from river and canal station records in published reports. **Salinity is never measured by satellite here: the app always labels it an estimate.** Every number in the app names its source, and every source is listed with a link. Full table, caveats and what we chose not to use: [below](#where-each-number-comes-from).

## How the scores work
Each rotation gets five scores from 1.0 to 5.0 (higher is better), computed for each area from the data above, not set by hand:

| Score | In one line |
|---|---|
| Water | Share of three rice crops' yearly canal water the rotation saves (FAO method, NASA POWER + GPM). |
| Income | Yearly profit against three rice crops, from the median of published profit figures for each crop. Not scored for mung bean, which has no checked figure. |
| Soil | Legume months, an optional cover crop and dry breaks help; brackish shrimp months leave salt. |
| Weather & salt | Crops in the field during the area's salt months, hot days and canal water needed when water is salty. |
| Pests | Monthly pest pressure on each crop (brown planthopper on rice from NASA POWER temperature), lowered by rest and non-rice months that break the pest cycle. |

The match is the average of the five, weighted by the farmer's priorities. Every card states **High, Medium or Low confidence**, worked out from the evidence behind it: thin profit figures, a salinity station with few recent readings, or a team estimate each lower it, and the reasons are listed on the card. Formulas, constants and the published profit table: [below](#how-the-scores-are-set).

## The challenge, point by point
| The brief asks for | Where it is |
|---|---|
| NASA Earth observations | NASA GPM rain, NASA POWER weather and NASA MODIS greenness on one common period, named next to each number |
| Local soil information | SoilGrids topsoil per area, used in the upland cards' drainage warning, with a note that a soil test on the field is more accurate |
| Crop characteristics | Crop calendars per rotation, water needs per crop from FAO guidance, a choice of upland crop with its own profit, pests and inputs |
| Farmer priorities and constraints | Five priorities; limits for no brackish water and little labour or equipment |
| Times when fields are bare; vulnerable seasons | Bare months from MODIS greenness; salt months, hot days and El Niño years on the cards and in **Data** |
| At least three rotations, with evidence, benefits, gaps and risks | Four or five ranked options with the current one kept visible; each card's reasons, benefits and risks carry numbered sources |
| Scientific terms explained; satellite vs ground | Short explanations of ET₀, NDVI and salinity estimates in the app; salinity labelled an estimate, soil a model, NASA POWER's grid described as regional |
| Uncertainty | Confidence level on every card with its reasons, year-to-year ranges, unchecked sources labelled |
| Scenarios | Typical year and El Niño year, opened on the one NOAA's forecast points to |
| Soil-building crops | A legume (mung bean), a cover crop in rest months and dry breaks credited in the Soil score |
| Easy for farmers | Phone-first, Vietnamese and English, Simple view, a sample field, the next job on the first screen |
| Turning a choice into action | A 12-month plan with sowing, harvest, rest and salt months, seed, fertiliser and key steps from checked extension guides, and reminders |
| Supports, does not replace, local expertise | The app says so, and its advice points the farmer to the local extension officer |

## How we know it holds up
- **Pins sit on rice.** Each area's pin was moved onto a rice-like MODIS pixel and checked on the last 10 seasons (1.9–3.0 crops a year).
- **NASA data finds the known droughts.** Ranked by dry-season water shortfall, 4 of the 5 driest seasons since 2000 at Trần Đề are El Niño seasons, including 2015–16 and 2019–20, the worst droughts in Vietnamese reports.
- **Two NASA rain sources agree.** GPM and POWER rain correlate at 0.93 month to month at every pin.
- **Methods reproduce their references.** Water demand matches FAO-56's worked example (3.88 vs 3.9 mm/day); canal water reproduces FAO Manual 3's rice example.
- **The ranking survives our guesses.** Moving each team-estimate constant (salt tolerance, heat reference, brackish soil loss, soil and weather weights, pest break) by ±20% never changes the best rotation at any of the 5 areas (`python pipeline/sensitivity.py`; income and water are held at their built values).
- **Every claim has a link,** and a source is marked checked only after the claim was found in it with a quote. 38 automated checks (`python pipeline/test_build.py`) cover the calculations and the data the app reads.

Details and numbers: [below](#how-we-checked-it).

## Limitations
- Five preset areas, not any field: weather describes a 10–50 km area and greenness one 250 m pixel. The method extends to the whole Delta ([how](#using-it-anywhere-in-the-delta)); salinity records and crop calendars are the local work.
- Typical and El Niño years are averages of 2000–2024, not forecasts.
- The data also covers Vietnam's 34 provinces since July 2025 and their 63 former provinces, on a separate map page (`docs/vietnam.html`, opened from the **Việt Nam** button in the app's top bar): NASA weather and rain for all, rotation scores only in the 5 Mekong Delta provinces, and there without a salinity estimate, so weather & salt is not scored and confidence is mostly Low ([details](#the-34-provinces)).
- Salinity comes from river and canal stations, not fields, and each level rests on 3–5 recent dry seasons.
- Scores are our rules from published sources, not calibrated against farm yields; profits are medians of published figures from other places and years. Some constants are team estimates, and each one lowers the card's confidence.
- Pest pressure for rice comes from a lab temperature curve and is nearly flat across months here; upland and shrimp pests follow the calendar.
- Fields are saved only in that phone's browser.

Full list: [below](#limitations-in-full).

## Run it yourself
The app is a static site with no build step. With Python 3.10 or newer, from the project folder:
```
python -m http.server 8000 -d docs
```
then open http://localhost:8000. Step-by-step Windows instructions, and how to refresh the NASA data: [below](#run-the-app-on-your-windows-computer).

## How it was built
Six AI agents (Claude, GPT and Gemini), each driven by a team member, built the app through issues, reviewed pull requests and written proposals. The data pipeline (`pipeline/`) is Python standard library only and writes `docs/data/sites.json`, the one file the app reads.

## Methods and data
The full working behind the sections above: where every number comes from, how each score is computed, the published figures, how we checked it, how to add an area, and how to run and update the app. Each part opens on a click.

### Where each number comes from
<details><summary>Show the full data table, sowing-window rule and what we chose not to use</summary>

| What you see | Source | Resolution and period | Caveat |
|---|---|---|---|
| Rain | **NASA GPM IMERG** Final monthly, v07 (GPM_3IMERGM), via NASA GES DISC | ~10 km, Dec 2000 – Nov 2024 | Satellite-based rain. NASA POWER rain is the cross-check (see **How we checked it**). |
| Temperature, humidity, wind, sunlight, days at or above 35 °C (heat part of the weather & salt score) | **NASA POWER** daily API (MERRA-2 based): `T2M_MAX`, `T2M_MIN`, `RH2M`, `WS2M`, `ALLSKY_SFC_SW_DWN` | ~50 km grid, Dec 2000 – Nov 2024 (1984–2025 downloaded for the drought check) | Describes the region. Nearby pins share a grid cell (see the table under **How we checked it**). |
| Water demand (ET₀) | Calculated from NASA POWER temperature, humidity, wind and sunlight with FAO-56 Penman–Monteith (equation 6) | Daily, summed by month | Water a grass field would lose. The temperature-only Hargreaves formula (equation 52) is kept as a cross-check; it reads low on this coast. |
| Canal water each rotation needs (water score, area summary) | Each rotation's month-by-month calendar (`pipeline/rotations.json`, typical Sóc Trăng timing from provincial reports), then FAO Manual 3 section 4.4 for each month: crop water use (FAO-56 Table 12 crop factor × ET₀) + for flooded rice 200 mm to soak the soil before sowing, a 100 mm water layer and 4 mm/day seepage − effective rain (FAO Manual 3 formula, GPM rain). Shrimp months use brackish water, so no canal water | Monthly, summed per year | Crop factors: rice 1.05 / 1.20 / 0.75 (first, middle, last month), upland crop as chosen on the card (FAO-56 Table 12): watermelon 0.40 / 1.00 / 0.75, maize 0.30 / 1.20 / 0.475, mung bean (green gram) 0.40 / 1.05 / 0.475. Seepage is FAO's heavy-clay value at every pin (SoilGrids gives 34.5–40.6% clay). Typical calendars, not this farmer's sowing dates. |
| Greenness, crops per year, bare months | **NASA MODIS** MOD13Q1 v6.1 NDVI, downloaded through NASA AppEEARS | 250 m, every 16 days, Feb 2000 – Dec 2025 downloaded | One pixel can mix several fields. Rainy-season clouds add noise, so we smooth with a 3-point median. The greenness line follows the typical / El Niño switch over Dec 2000 – Nov 2024. Crops per year and bare months use the last 10 seasons (Dec 2014 – Nov 2024), because farm calendars changed: Vĩnh Châu went from 2.3 crops a year in 2000–2014 to 3.0. They keep the 5 El Niño seasons in both views, because they describe what farmers plant, and farmers plant in El Niño years too. A month counts as bare when its NDVI is below 0.3 in more than half of those years, each year checked on its own, so a crop planted a few weeks earlier or later in some years doesn't hide the gap. |
| Driest-to-wettest and lowest-to-highest bands | NASA GPM IMERG rain and MODIS NDVI greenness: minimum and maximum of each month across the years in the selected view (typical or El Niño) | Monthly, Dec 2000 – Nov 2024 | Describes the past, not a forecast. |
| Typical year | NASA POWER, GPM and MODIS averaged month by month over the 15 Dec–Nov seasons from Dec 2000 to Nov 2024 without El Niño | Monthly | 9 of the 24 seasons are El Niño; including them would pull the typical year towards drought (e.g. Mỹ Xuyên winter–spring rice needs 948 mm of canal water with them, 925 mm without). |
| El Niño year | NASA POWER, GPM and MODIS greenness averaged month by month over the 9 El Niño seasons from Dec 2000 to Nov 2024: 2002–03, 2004–05, 2006–07, 2009–10, 2014–15, 2015–16, 2018–19, 2019–20, 2023–24. `build.py` reads them from NOAA's Oceanic Niño Index file (`data/raw/oni.txt`, Dec–Feb index 0.5 or more) | Monthly | Strength varies: index 0.62–0.73 in 2004–05, 2006–07, 2014–15 and 2019–20, 2.50 in 2015–16. |
| NOAA's El Niño forecast (line above the switch; which view the app opens on) | NOAA CPC's monthly ENSO Diagnostic Discussion: its alert status and synopsis, read by `pipeline/fetch_power.py` into `data/raw/enso_outlook.json`. The app opens on the El Niño view while the status is El Niño Advisory or El Niño Watch | Issued monthly (2nd Thursday); the app shows the issue date | A forecast of the Pacific, not of the Delta: the El Niño view shows past El Niño seasons here, not this season's numbers. |
| Rain cross-check (README only) | **NASA POWER** `PRECTOTCORR` | ~50 km, Dec 2000 – Nov 2024 | Used only to check GPM rain. |
| Topsoil clay, organic carbon, pH | SoilGrids 2.0 (ISRIC), not NASA | 250 m model, 0–15 cm | A map estimate, not a soil test. |
| Salinity level and months | Measured at river and canal stations of the former Sóc Trăng province: the highest reading of each dry season, 1999–2025, at 8 stations (Nguyễn Trọng Khanh et al. 2025, Table 4, from the provincial hydro-met station; `data/raw/salinity_stations.json`). Each pin uses its nearest station: Vĩnh Châu → Khánh Hòa, Trần Đề → Trần Đề, Mỹ Xuyên → Thạnh Phú, Long Phú → Long Phú, Ngã Năm → Ngã Năm. Level = that station's average highest reading over the last 10 dry seasons (2015–2024), typical and El Niño seasons separately: high = 15‰ or more (our cut-off), medium = 4–15‰ (4‰ = clear rice damage), low = under 4‰. Months = months named in public reports, plus any month that was the station's peak in at least 2 of those 10 seasons | Per pin | Always an estimate: satellites cannot measure salt in rice fields. River readings can be saltier than fields behind sluice gates. Each average rests on 3–5 seasons. Ngã Năm is rated low although its canal station averages about 10‰ (medium): salt sluices around Ngã Năm and Mỹ Tú protect the fields, and NASA MODIS sees nearly 3 rice crops a year there, a freshwater pattern. This is the one exception to the rule. |
| Seed I already have (step 5) | Checked crop durations in `pipeline/resources.json`, usual salt months from station records and public reports, and the FAO canal-water calculation above using NASA POWER ET₀ and GPM IMERG rain. Vietnam News (10 Jan 2024) reports early sowing in salt-prone areas. Harvesting before the usual salt months is our team’s rule. | By crop, pin and historical scenario. Harvest month and canal water (mm for one crop) refer to the latest safe start. | The checked 90–100 days apply to most direct-seeded OM rice varieties. Salt-tolerant rice is outside this check. Watermelon, maize and mung bean currently lack a verified duration through the last harvest. |
| Pest pressure (Pests score) | NASA POWER daily T2M_MAX and T2M_MIN (monthly mean temperature, days at or above 35 °C, nights 4.2 °C colder than the day before) turned into pressure by the brown planthopper temperature curve of Horgan et al. 2020 (PLoS ONE, a lab study of a Philippine colony); upland pests and the shrimp disease rule come from the sources in `pipeline/pests.json` | ~50 km grid, monthly | Flat for rice here (monthly means 25.8–30.1 °C in a typical year, 26.3–31.6 °C in an El Niño year), so it separates rotations, not pins. Upland and shrimp pest sources are not all checked yet; the app lists them as unverified. |
| Scores and ranking | Computed at each pin from the data above, each rotation's calendar and published profit figures (`pipeline/profits.json`); see **How the scores are set** | Per pin | A starting point for discussion, not a forecast. |

**How to read the sowing window.** The duration runs from sowing or transplanting into the field through the last harvest, excluding nursery time. Starting on the first of each month, the pipeline counts whole months using their actual lengths and a 28-day February until they cover the longest checked duration. For example, a January 1 start occupies January and February for 59 days and reaches March for 60. The app shows one continuous run of starts whose occupied months avoid the pin’s estimated salt months. A missing duration gives “no checked growing time”. If every start overlaps a salt month, the app gives a warning and links to the rotation cards.

The app uses today’s date to choose the next window, including across New Year. It shows “sow now” within the window up to day 1 of its final month. After that day it shows the next window. Where all months are safe, the harvest and water example uses a December start.

**Not used:** SMAP soil moisture (9 km pixels read flooded fields as open water), ECOSTRESS (too few cloud-free passes) and the Landsat soil-salinity maps of Wang et al. 2025 (they track water and greenness, not salt).

</details>

### The 34 provinces
<details><summary>Show how the 63 former provinces map to the 34, and what is computed for each</summary>

Since 1 July 2025 Vietnam has 34 provinces and centrally governed cities (National Assembly Resolution 202/2025/QH15), grouped in 6 socio-economic regions by Government Resolution 306/NQ-CP (5 Oct 2025): Northern Midlands and Mountains 9, Red River Delta 6, North Central Coast 5, South Central Coast and Central Highlands 6, Southeast 3, Mekong Delta 5. `pipeline/sites.py` lists each province with the former provinces it now covers, one data point per former province (its former capital; 63 in all, plus the 5 Sóc Trăng area pins = 68 points). `build.py` writes them to `docs/data/provinces.json` with its own source list; `sites.json` (the 5 areas the main app shows) is unchanged.

The model runs at all 68 points:

- **Each of the 63 province points** (`places` in `provinces.json`) gets the same engine as a Sóc Trăng pin: NASA POWER weather and FAO-56 water demand at its own latitude, its own NASA GPM rain, its own SoilGrids topsoil, MODIS greenness where `data/raw/ndvi_<id>.json` exists (the 34 provinces' own points for now), a rain cross-check (POWER against GPM) and the El Niño view.
- **Each of the 34 provinces** (`provinces`) is the month-by-month average of its points' climates, and the average topsoil of its points with soil.
- **Soil:** most points are town centres, where SoilGrids has no soil. `py pipeline/fetch_soil.py nearby` re-samples those at the nearest farmland pixel 3–15 km away, always inside the same former province (checked against the outlines), and the app says how far away it is. Today all 68 points have soil: 14 at the pin itself, 54 re-sampled (52 at 3 km, one at 5 km, one at 7 km).
- **Salinity:** no estimate (level `unknown`), labelled as such. Without salt months, weather & salt is not scored, salt-month profit losses are not counted, shrimp's brackish-water need is not checked and no safe sowing window is given; confidence drops one level.
- **Rotation cards:** only in the 5 Mekong Delta provinces and their 12 points, because the rotations and every published profit figure come from the Delta. The others get the weather, rain and soil evidence and a line saying why they are not scored. Cards are listed in a fixed order, not ranked.
- **MODIS greenness** exists for the 34 provinces' own points (39 files with the 5 areas; more can be added later). It is used only where the pixel looks like a field: a pixel never greener than 0.5 NDVI is a town or water, so it is shown as such and not used (29 of the 34 today, because the points are former provincial capitals). It is not used for the province averages. Either way, no usable MODIS costs one confidence level.

**The map** (`docs/vietnam.html`, `app/vn.js`; inside the app from the **Việt Nam** button in the top bar, or `index.html#vietnam`) looks like the Sóc Trăng map, and holds it: from zoom 8.5 the 5 Sóc Trăng areas appear inside Cần Thơ with their district outlines, the usual dry-season salt peak at the nearest station (estimate, never satellite) and MODIS crops a year, and tapping one opens it in the planner. It shows the same Esri satellite imagery (online, since the offline tiles only cover Sóc Trăng), the 34 provinces as white dashed outlines with the borders of their former provinces dotted inside, a see-through colour layer blended between the 63 points (yearly or monthly NASA GPM rain, or rain minus crop water need; typical or El Niño years) and gold pins with name plates. Tapping a province opens its average and each former province's own numbers, chart, cards and sources. Outlines: `py pipeline/make_outlines.py` joins geoBoundaries' 63 former provinces (OCHA ROAP + Government of Viet Nam 2020, CC BY 3.0 IGO, the same source as the district outlines) into the 34, keeps shared borders identical after simplifying, keeps the Hoàng Sa and Trường Sa archipelagos, and checks that every pin sits inside its own province.

Points: `pipeline/sites.py`; download: `py pipeline/fetch_power.py missing`, `py pipeline/fetch_gpm.py`, `py pipeline/fetch_soil.py` then `py pipeline/fetch_soil.py nearby`; outlines: `py pipeline/make_outlines.py`.
</details>

### How the scores are set
<details><summary>Show every formula, the score table and the published profit figures</summary>

Each rotation is rated on water, income, soil, pests and weather & salt from 1.0 to 5.0, where higher is better. The app omits income for mung bean. The match is the slider-weighted average of the available scores (equal weights if their sliders are all zero), with a 0.5-point deduction for an upland crop when labour or equipment is limited, and each card's "Why suggested" shows the numbers behind them.

| Score | Rubric |
|---|---|
| Water | Computed at each pin, not set by hand: the share of 3 rice crops' yearly canal water the rotation saves. Score = 1 + 4 × that share (0% = 1.0, 50% = 3.0, 100% = 5.0); no cut-offs. Dropping the autumn–winter crop saves little, because it grows in the rainy season; resting or growing an upland crop in the dry months saves much more. |
| Income | Computed at each pin: 3 + 2 × log2(P ÷ P3), kept between 1 and 5, so the same profit as 3 rice crops = 3.0, double = 5.0, half = 1.0. **P** = the rotation's yearly profit: for each crop in its calendar, the median of the published profit figures for that crop (table below; full figures only where there are at least 2) × (1 − loss share), added up. **P3** = the same for 3 rice crops at the same pin and view. **Loss:** in the typical view, shrimp loses 9.2% to disease (Nhân Dân 2021, Sóc Trăng rice–shrimp: damaged shrimp area 10%, then 8.4%). In the El Niño view the typical losses still apply, and ordinary rice and upland crops growing in the pin's salt months lose 10% of their estimated profit: the Delta's winter–spring harvest fell by 1.1 of 11.1 million tonnes in 2016 (General Statistics Office). Using the same 10% for the other rice crops and the upland crop, and 5% for ST rice (10% × the half count used for salt-tolerant rice), is **our team estimate**. Where brackish water is not normally available, shrimp counts 0. |
| Soil | Computed from each rotation's 12-month calendar: 1 + 4 × (0.45 × legume + 0.2 × cover + 0.2 × dry break + 0.15 × fewer rice months) − brackish, kept between 1 and 5, the same scale as Pests. **Legume** = min(legume months ÷ 2, 1) (mung bean; Rahman et al. 2014). **Cover crop** = min(rest months ÷ 2, 1), only for the salt-tolerant option, whose rest period may be a cover crop. **Dry break** = min((rest + upland months) ÷ 3, 1): months when the flooded soil drains and dries out between rice crops (shrimp months stay flooded and do not count). **Fewer rice months** = 1 − rice months ÷ 12. **Brackish** = 0.5 if the calendar has shrimp months, otherwise 0: salt from the brackish phase stays in the soil until rain flushes it (Ngoc et al. 2023, Heliyon, Bạc Liêu: "Putative exchange (exch.) Na+ hydrolysis occurs at the beginning of the rainy season when excess salts are leached."). No source gives these weights, the 3 dry months or the 0.5 as numbers, so they are **our team estimates** and cost one confidence level. The old formula (1 + legume + cover − brackish) could not go above 2.5 and gave 1.0 to most rotations; this one spreads them from 1.3 to 3.9. Same at every pin. |
| Pests | Computed at each pin: 1 + 4 × (1 − risk), kept between 1 and 5. Each calendar month has a pressure from 0 to 1. **Rice:** brown planthopper pressure at the month's mean NASA POWER temperature ((T2M_MAX + T2M_MIN) ÷ 2), read off Horgan et al. 2020 (PLoS ONE 15(6): e0235506): 0 at 20 °C or below ("did not develop to adults at 15 and 20°C"), 1 from 25 to 30 °C ("egg-laying peaked at 30°C"; 0.87 of nymphs reached adults at 25–30 °C), 0 at 35 °C ("failed to develop beyond the fourth instar at 35°C"), linear in between. **Upland crop:** 1 in every month it is in the field (maize: fall armyworm; watermelon: melon thrips; mung bean: whitefly and pod borer), because no Mekong Delta source gives their timing. **Shrimp:** 0.5 + 0.5 × the share of the month's days at or above 35 °C or with a night 4.2 °C colder than the day before (NASA POWER); white spot disease recurs, so shrimp months never fall below 0.5. **Rest:** 0. **Risk** = (rice pressure × (1 − 0.5 × break) + the other crops' pressure) ÷ 12, with break = 0.5 × min(rest months ÷ 2, 1) + 0.5 × min(non-rice months ÷ 2, 1) (PhilRice 2018; Oka, JARQ 26(2)). Three constants are **our team estimates** (no source gives a number): the 0.5 shrimp floor, the 4.2 °C cold-night drop (after the 4.2–4.5 °C pond swings in a Global Seafood Alliance review) and the 0.5 break credit. The 35 °C heat rule is the one used in Weather & salt (Kiên Giang report). Monthly mean temperatures at the pins are 25.8–30.1 °C in a typical year, so rice pressure is flat here (0.98 to 1; April at Mỹ Xuyên and Ngã Năm is 30.1 °C, 0.98); in an El Niño year they are 26.3–31.6 °C and April at those two pins (31.6 °C) falls to 0.68. The score separates rotations by their calendar, not by place. The cold-night rule (a day-to-day drop of 4.2 °C or more in NASA POWER minimum temperature) never occurs on this ~50 km grid at these pins, in either view, so shrimp months count the 0.5 floor plus hot days only. |
| Weather & salt | Computed at each pin: 0.6 × salt + 0.2 × heat + 0.2 × canal water (weights are our team's choice). Each part is 1 + 4 × (1 − risk), so no risk = 5.0 and full risk = 1.0. **Salt:** the share of this pin's salt months with a crop in the field (salt-tolerant rice counts half, our estimate; shrimp and rest count 0), times the station's average dry-season peak ÷ 15‰ (at most 1; 4 ÷ 15 at Ngã Năm, where sluices keep fields fresh). **Heat:** NASA POWER days at or above 35 °C in months with rice or an upland crop, ÷ 30 days (at most 1). **Canal water:** canal water the rotation needs in the salt months ÷ what 3 rice crops need then (at most 1). The El Niño view uses the El Niño seasons' station readings, heat and rain. Where there is no salinity estimate (the 34 provinces), weather & salt is not scored: its salt and canal parts need the salt months. |

| Rotation | Water (typical year, all pins) | Income score (estimated typical-year profit in M ₫/ha/year) | Soil | Pests (typical year) | Weather & salt (typical year, all pins) | Main evidence |
|---|---|---|---|---|---|---|
| 3 rice crops | 1.0 (baseline) | 3.0 (baseline, ≈ 95.4 M ₫/ha a year) | 1.3 | 1.8 | 2.3–3.3 | Baseline; no drop in income from years of triple cropping, only higher fertiliser costs (IDE 2023) |
| 2 rice crops | 1.3–1.4 (saves 8–11%) | 1.9 (≈ 65.4) | 2.0 | 3.0 | 2.3–3.3 | One rest period; the same profit per crop as 3 rice (31 vs 30 M ₫/ha, 60 farms, Hậu Giang, 2024) but one crop fewer, so less a year |
| Rice–shrimp | 4.2–4.4 (saves 80–86%) | 2.8 (≈ 89.1); 1.0 (≈ 36.2) at Ngã Năm, where only the rice contributes to profit | 1.4 | 3.2–3.3 | 5.0 | Brackish dry season; shrimp profit after a 9.2% disease loss, plus one rice crop |
| 2 rice + upland crop | 2.4–2.6 (saves 35–40%) | 4.4 with watermelon or maize (≈ 155.4); not scored with mung bean | 2.1; 3.9 with mung bean | 2.8 | 2.5–3.3 | Upland crop replaces winter–spring rice; the farmer picks watermelon, maize or mung bean; legume credit only with mung bean (profit notes below the tables) |
| 2 salt-tolerant rice + rest | 2.3–2.5 (saves 31–38%) | 3.0 (≈ 94.5) | 2.8 | 3.0 | 4.1–4.8 | Early sowing before peak salt; two ST25 crops earn about what 3 ordinary crops do; rest + cover crop |

**Published profit figures** (`pipeline/profits.json`; each figure's quote, and where it appears, is in its source note; all checked). Profit after costs in million ₫ per ha; a range is entered as its midpoint. Year is the harvest year when known. The 2020 Bạc Liêu shrimp fallback uses the publication year because its data year is unknown. Kind: government = a named department or official; news = a reporter's area figure with no named source. A figure counts fully only if it is from 2020–2025 and from a survey, government, university or cooperative source; the others (news, a single farmer, no stated year) are marked fallback. Each crop's median uses only its full figures when it has at least 2; autumn–winter rice, watermelon, maize, shrimp and rice in rice–shrimp have fewer, so their medians use all their figures, fallbacks included.

| Crop | Profit (M ₫/ha) | Unit | Where (range) | Year | Kind | Source |
|---|---|---|---|---|---|---|
| Winter–spring rice | 40 | per crop | Long Phú district, Sóc Trăng (30–50) | 2024 | government | [VietnamPlus (10 Jan 2024)](https://www.vietnamplus.vn/soc-trang-lua-dong-xuan-co-gia-ban-va-loi-nhuan-cao-ky-luc-post920243.vnp) |
| Winter–spring rice | 50 | per crop | Hưng Lợi cooperative, Long Phú, Sóc Trăng (Đài Thơm 8) | 2024 | cooperative | [VietnamPlus (10 Jan 2024)](https://www.vietnamplus.vn/soc-trang-lua-dong-xuan-co-gia-ban-va-loi-nhuan-cao-ky-luc-post920243.vnp) |
| Winter–spring rice | 40 | per crop | Thạnh Trị district, Sóc Trăng (over 40) | 2024 | government | [Báo Tin tức – TTXVN (21 Mar 2024)](https://baotintuc.vn/kinh-te/nong-dan-soc-trang-tang-loi-nhuan-vu-lua-dong-xuan-tu-2030-20240321173910010.htm) |
| Winter–spring rice | 36 | per crop | Sóc Trăng province average (over 36) | 2024 | news (fallback) | [VOV (12 Oct 2024)](https://vov.vn/kinh-te/soc-trang-xuat-khau-gao-dat-510-trieu-usd-post1127803.vov) |
| Winter–spring rice | 35 | per crop | Trần Văn Thời district, Cà Mau (30–40) | 2025 | government | [Tuổi Trẻ (20 Apr 2025)](https://tuoitre.vn/gia-vat-tu-tang-nong-dan-dbscl-lo-lang-buoc-vao-vu-he-thu-2025042008041922.htm) |
| Winter–spring rice | 25 | per crop | Border districts of Kiên Giang and An Giang (20–30) | 2023 | news (fallback) | [Sài Gòn Giải Phóng (6 Mar 2023)](https://www.sggp.org.vn/gia-lua-dong-xuan-tang-nong-dan-dbscl-lai-binh-quan-20-30-trieu-dongha-post681034.html) |
| Summer–autumn rice | 17 | per crop | Châu Thành district, Sóc Trăng (16–18) | 2020 | government | [Thanh Tra (18 Aug 2020)](https://thanhtra.com.vn/an-sinh-AFA9C5670/soc-trang-nong-dan-phan-khoi-vi-gia-lua-o-muc-cao-8045F604.html) |
| Summer–autumn rice | 30 | per crop | Đồng Tháp province | 2024 | government | [VnExpress (11 May 2024)](https://vnexpress.net/nong-dan-dong-thap-trung-dam-vu-lua-he-thu-4744751.html) |
| Summer–autumn rice | 25.4 | per crop | 10 model fields across the Mekong Delta (14.5–36.3) | 2025 | government | [Dân tộc & Phát triển (15 Sep 2025)](https://dantocphattrien.vietnamnet.vn/mo-hinh-lua-chuyen-canh-chat-luong-cao-o-dbscl-dat-loi-nhuan-tren-36-trieuha-1757931414277.htm) |
| Autumn–winter rice | 27.9 | per crop | An Giang, 68 farms in 9 districts | 2020 | university | [Nguyễn Thành Tâm et al. (2024), Cần Thơ Univ. journal, Table 5](https://doi.org/10.22144/ctujos.2024.476) |
| Autumn–winter rice | 30 | per crop | Đồng Tháp province (over 30) | 2023 | news (fallback) | [VietnamPlus (20 Nov 2023)](https://www.vietnamplus.vn/lua-thu-dong-o-dong-bang-song-cuu-long-duoc-mua-duoc-gia-post908660.vnp) |
| Autumn–winter rice | 40 | per crop | Tiền Giang | 2023 | news (fallback) | [VOV (27 Nov 2023)](https://vov.vn/kinh-te/gia-lua-vu-thu-dong-tang-ki-luc-nong-dan-tien-giang-lai-khoang-40-trieu-dongha-post1061766.vov) |
| Autumn–winter rice | 30 | per crop | Cầu Kè district, Trà Vinh (nearly 30) | 2024 | news (fallback) | [VOV (8 Dec 2024)](https://vov.vn/kinh-te/lua-thu-dong-som-duoc-ca-gia-lan-nang-suat-nong-dan-tra-vinh-phan-khoi-post1140522.vov) |
| ST rice, winter–spring | 60 | per crop | Hưng Lợi cooperative, Long Phú, Sóc Trăng (ST25) | 2024 | cooperative | [VietnamPlus (10 Jan 2024)](https://www.vietnamplus.vn/soc-trang-lua-dong-xuan-co-gia-ban-va-loi-nhuan-cao-ky-luc-post920243.vnp) |
| ST rice, winter–spring | 40 | per crop | Hưng Lợi cooperative, Long Phú, Sóc Trăng (ST25, 40 or more) | 2025 | cooperative | [Nhân Dân (24 Jan 2025)](https://nhandan.vn/no-luc-binh-on-gia-lua-bao-dam-loi-ich-cho-nha-nong-post857553.html) |
| ST rice, winter–spring | 45 | per crop | Phường 2, Ngã Năm, Sóc Trăng (over 95% specialty rice, 40–50) | 2024 | government | [Báo Tin tức – TTXVN (21 Mar 2024)](https://baotintuc.vn/kinh-te/nong-dan-soc-trang-tang-loi-nhuan-vu-lua-dong-xuan-tu-2030-20240321173910010.htm) |
| ST rice, summer–autumn | 49 | per crop | 50 ha ST25 demonstration, Sóc Trăng (nearly 49) | 2024 | government | [VOV (12 Oct 2024)](https://vov.vn/kinh-te/soc-trang-xuat-khau-gao-dat-510-trieu-usd-post1127803.vov) |
| ST rice, summer–autumn | 50 | per crop | Đông Đầy cooperative group, Trần Đề, Sóc Trăng (ST25, over 50) | 2024 | cooperative | [Báo Tin tức Dân tộc & Miền núi (8 Oct 2024)](https://dantocmiennui.baotintuc.vn/san-xuat-lua-tom-dac-san-cho-nong-dan-soc-trang-thu-nhap-bac-ty-post354705.html) |
| Other upland crop (not scored) | 16 | per crop | Phú Lộc, Thạnh Trị, Sóc Trăng (one farmer; soybean) | 2023 | farmer (fallback) | [Báo Sóc Trăng (7 Jan 2024)](https://baosoctrang.org.vn/huyen-thanh-tri/202401/mo-hinh-luan-canh-lua-au-nanh-giai-phap-san-xuat-hieu-qua-va-ben-vung-f9d1891/) |
| Watermelon | 82 | per crop | Gò Công project area, Tiền Giang (watermelon, over 82; department survey) | 2024 | government | [Báo Tin tức Dân tộc & Miền núi (3 Jun 2024)](https://dantocmiennui.baotintuc.vn/trong-rau-mau-cho-loi-nhuan-tren-100-trieu-dongha-post351672.html) |
| Maize | 100 | per crop | Gò Công project area, Tiền Giang (maize, over 100; department survey) | 2024 | government | [Báo Tin tức Dân tộc & Miền núi (3 Jun 2024)](https://dantocmiennui.baotintuc.vn/trong-rau-mau-cho-loi-nhuan-tren-100-trieu-dongha-post351672.html) |
| Other upland crops (not scored) | 63.5 | per crop | Đồng Tháp province, converted rice land (upland crops, 50–77) | 2024 | government | [VietnamPlus (12 Apr 2024)](https://www.vietnamplus.vn/dong-thap-chuyen-hon-10000ha-dat-lua-kem-hieu-qua-sang-cay-trong-gia-tri-cao-post939832.vnp) |
| Watermelon | 110 | per crop | Long An province, converted rice land (watermelon, 70–150) | 2023 | news (fallback) | [Báo Tin tức Dân tộc & Miền núi (15 Oct 2023)](https://dantocmiennui.baotintuc.vn/long-an-chuyen-doi-cay-trong-tren-dat-lua-giup-thu-lai-hang-tram-trieu-dongha-post342409.html) |
| Watermelon | 100 | per crop | Kế Thành, Kế Sách, Sóc Trăng (one farmer, watermelon on 3-crop rice land) | 2025 | farmer (fallback) | [Báo Sóc Trăng (1 Apr 2025)](https://baosoctrang.org.vn/nong-nghiep/202504/xa-ke-thanh-phat-trien-trong-dua-hau-duoi-ruong-lua-c825f0e/) |
| Watermelon | 130 | per crop | Mỹ Xuyên, Sóc Trăng (farmers, after winter–spring rice; 60–70 M from 5 công, công taken as 1,000 m²) | 2025 | news (fallback) | [VnBusiness (22 Jul 2025)](https://vnbusiness.vn/rau-mau-tren-chan-ruong-lua-giup-nong-dan-boi-thu.html) |
| Watermelon | 75 | per crop | Thạnh Phú, Mỹ Xuyên, Sóc Trăng (one farmer, 5–10 M per công, công taken as 1,000 m²) | 2020 | news (fallback) | [Thanh Tra (13 Mar 2020)](https://thanhtra.com.vn/tai-chinh-701717FFD/dam-bao-thu-nhap-cho-nong-dan-trong-mua-kho-han-541B6999.html) |
| Shrimp (rice–shrimp, dry season) | 79 | per year | Hòa Tú 1, Mỹ Xuyên, Sóc Trăng (extension pilot, 2022–2024) | 2024 | government | [Vietbao (21 Oct 2026)](https://vietbao.vn/tu-mo-hinh-cho-loi-nhuan-gap-ba-pho-giam-doc-trung-tam-khuyen-nong-quoc-gia-goi-mo-cach-canh-tac-thich-ung-voi-han-man-612326.html) |
| Shrimp (rice–shrimp, dry season) | 37.5 | per year | Bạc Liêu (35–40; year of the data not stated) | 2020 | news (fallback) | [Thủy sản Việt Nam (6 Jul 2020)](https://thuysanvietnam.com.vn/tom-lua-mo-hinh-canh-tac-cua-tuong-lai/) |
| Rice in rice–shrimp (rainy season) | 27.5 | per crop | Cần Thơ city incl. former Sóc Trăng, 1,874 ha (25–30) | 2025 | government | [Ministry of Agriculture and Environment bulletin (Mar 2026), p. 3](https://adaptation.dcc.mae.gov.vn/wp-content/uploads/2026/04/Ban-tin-TUBDKH-t3.2026_TN1.pdf) |
| Rice in rice–shrimp (rainy season) | 45 | per crop | Gia Hòa 2, Mỹ Xuyên, Sóc Trăng (one farmer, 90 M from 2 ha) | 2021 | farmer (fallback) | [Nhân Dân (10 Mar 2021)](https://nhandan.vn/post-637970.html) |

| Crop | Median used (M ₫/ha) | Range of figures used | Figures used | Full figures |
|---|---|---|---|---|
| Winter–spring rice | 40 per crop | 35–50 | 4 (full only) | 4 |
| Summer–autumn rice | 25.4 per crop | 17–30 | 3 (full only) | 3 |
| Autumn–winter rice | 30 per crop | 27.9–40 | 4 (all, fallbacks included) | 1 |
| ST rice, winter–spring | 45 per crop | 40–60 | 3 (full only) | 3 |
| ST rice, summer–autumn | 49.5 per crop | 49–50 | 2 (full only) | 2 |
| Watermelon | 100 per crop | 75–130 | 5 (all, fallbacks included) | 1 |
| Maize | 100 per crop | 100–100 | 1 (all) | 1 |
| Mung bean | none: income not scored | – | 0 | 0 |
| Shrimp (rice–shrimp, dry season) | 58.25 per year | 37.5–79 | 2 (all, fallbacks included) | 1 |
| Rice in rice–shrimp (rainy season) | 36.25 per crop | 27.5–45 | 2 (all, fallbacks included) | 1 |

The rice figures lean on 2023–24, a record-price season in Sóc Trăng; the 2020 and 2023 figures are lower. Model and pilot fields (summer–autumn 2025, the ST25 demonstration, the shrimp pilot) are better run than the usual farm. The watermelon and maize survey figures come from fresher provinces nearer big markets (lower bounds), and the Sóc Trăng watermelon figures are farmer reports, two with an unstated công size, so a salty coastal field may earn less. The soybean and mixed-upland figures are listed but not scored. We found no 2018–2025 profit figure for mung bean in the Delta, so its income is not scored. For shrimp and rice in rice–shrimp, most published figures cover the whole system and are listed below instead.

**Cross-checks** (not used in the score): 3 rice crops ≈ 95.4 M ₫/ha a year here, against 30.3 M per crop × 3 = 90.8 M on 60 Hậu Giang farms in 2024 (Tất Anh Thư et al. 2025, Cần Thơ Univ. journal, Table 7). 2 rice crops ≈ 65.4 M, against 63.0 M a year from one Cần Thơ farmer's 2 crops (Tạp chí Công Thương, 2022). Rice–shrimp ≈ 89.1 M a year, against whole-system figures of 40–60 M (Bạc Liêu, 2022, [Viet Nam News](https://vietnamnews.vn/society/1154533/mekong-delta-to-expand-shrimp-%E2%80%93-rice-farming-model.html)), 70–100 M (Thạnh Phú, Bến Tre, 2023, district agriculture office, [Nhân Dân](https://nhandan.vn/hieu-qua-kep-cua-mo-hinh-lua-tom-post755015.html)), 1.3× rice on the same land (Sóc Trăng, 2025, [Báo Sóc Trăng](https://baosoctrang.org.vn/nong-nghiep/202501/buoc-tien-cua-tinh-soc-trang-trong-qua-trinh-co-cau-lai-nganh-nong-nghiep-c3d2e62/)) and about 4× rice alone (WWF study, unpublished, The Fish Site 2024). These whole-system figures stay out of the crop table so that shrimp and rice are not counted twice.

**Site rules** (in `pipeline/build.py`, each covered by a test):
1. **Brackish water.** Where salinity is low, rice–shrimp counts no shrimp profit (income 1.0), loses 1 confidence level and is ranked last as "not usually possible here".
2. **Field calendar (NASA MODIS).** Where greenness shows fields usually bare (more than half the years) in at least one month of February–April, the upland and salt-tolerant options gain 1 confidence level, because the gap they need already exists. This is our team's rule.

</details>

### How we checked it
<details><summary>Show all checks and their numbers</summary>

- **Pins sit on rice.** We tested a 7×7 grid of MODIS pixels (~5 km) around each pin through the AppEEARS API and moved two pins onto rice-like pixels: Vĩnh Châu by 3.7 km and Mỹ Xuyên by 3.3 km. Re-checked on the last 10 seasons (Dec 2014 – Nov 2024), all five pins pass our rice test: 1.9–3.0 crops a year, yearly peak greenness 0.69–0.92 and dips to 0.15–0.28. In 2000–2014 the same pixels showed 2.0–2.7 crops a year; the biggest change is Vĩnh Châu, from 2.3 to 3.0.
- **NASA data finds the known droughts.** Ranking dry seasons by water shortfall (Dec–Apr, Penman–Monteith ET₀ minus all rain, at Trần Đề): over 1984–2024 with NASA POWER rain, the three driest are 1997–98, 1987–88 and 1986–87, all El Niño winters in NOAA's index; over 2000–2024 with NASA GPM rain, 4 of the 5 driest are El Niño seasons (2004–05, 2019–20, 2023–24, 2015–16). 2015–16 and 2019–20 are the years Vietnamese reports describe as the worst recent droughts and salt intrusion.
- **Two NASA rain sources move together.** NASA GPM rain (~10 km, used by the app) and NASA POWER rain (~50 km) correlate at 0.93 month to month at every pin over Dec 2000 – Nov 2024; GPM's yearly totals are 8–25% higher, which barely changes the dry-season canal-water need (numbers below).
- **Two ways to estimate water demand.** FAO-56 Penman–Monteith (used by the app) matches FAO-56's worked example (3.88 against 3.9 mm/day); the temperature-only Hargreaves formula reads low on this coast (numbers below).
- **The water method reproduces FAO's example.** `test_build.py` recomputes FAO Manual 3's worked rice example (April: ET crop 198 mm + seepage 150 + water layer 100 − effective rain 135 = 313 mm) with the app's own function.
- **Every claim has a link.** Each source in `pipeline/rotations.json`, `salinity.json`, `profits.json` and `resources.json` carries a URL and a note on what it supports. The app labels a source "(not yet checked against the source)" until the specific claim has been found in it; the source's note then gives a short quote and where it appears, and `verified` is set to `true`.
- **Water, heat and salinity in the scores.** Water and weather & salt are straight lines in the share of water saved, the station reading, hot days and canal water, so a small change in the data moves a score a little instead of flipping it. The salinity level (high from 15‰, medium from 4‰) labels the area in its summary; a low level triggers the brackish-water rule for shrimp. A high level adds an explanation on its card. Medium or high salinity also triggers the upland warning when crop and salt months overlap.
- **Confidence comes from the evidence, not from a hand-set label.** Each card starts at High and drops one level for each of: (1) income resting on fallback figures (fewer than 2 qualifying published figures for a crop), on figures that differ by more than 2× between lowest and highest, or on no figure at all (mung bean); (2) no NASA MODIS NDVI loaded for the pin, or a MODIS pixel never greener than 0.5 NDVI (a town or water, not a field; province points only); (3) a salinity station with fewer than 5 recent dry seasons or no reading after 2022; (4) rice–shrimp where brackish water is not normally available; (5) team estimates used by that card (salt-tolerant rice counted as half a rice month, salt left by the shrimp phase, the El Niño crop-loss share where it applies, the 0.5 break credit for pests, the soil-score weights and dry-break months, the pest timing for upland crops, the shrimp disease floor and cold-night rule), together one level. Fields usually bare in February–April raise the upland and salt-tolerant options one level (the field-calendar rule under "How the scores are set"). Drop (1) also caps the card at Medium, so this bonus cannot cancel thin income evidence. The reasons are listed on the card under its risks.
- **Salinity readings checked two ways.** Our typing of the station table reproduces the paper's own count, minimum, maximum and mean for all 8 stations. The national forecast centre's 10-day bulletins (NCHMF; the 20 found online for 2024–2026 are in `data/raw/salinity_bulletins.json`) are an independent record: their highest 2024 and 2025 readings equal the table's at 9 of 10 station-years. The 10th, Thạnh Phú in 2025, peaked in May, after the last bulletin we found.
- **El Niño seasons are saltier.** Over the last 10 dry seasons, the average highest reading was higher in El Niño seasons than in other seasons at every pin's station (e.g. Thạnh Phú 6.8‰ vs 11.1‰, Long Phú 16.3‰ vs 19.6‰). Over 2001–2024 the same holds at all 8 stations.
- **Self-checks.** `python pipeline/test_build.py` runs 33 checks on the calculations and on the data the app reads.

<details><summary>Rain and water-demand cross-check numbers</summary>

NASA GPM IMERG satellite rain (~10 km, used by the app) was compared with NASA POWER rain (~50 km) over the 288 months Dec 2000 – Nov 2024. The month-to-month correlation is 0.93 at every pin, but GPM's yearly totals are 8–25% higher, most at inland Ngã Năm. For the overlapping months from January 2015 through September 2025, the two totals were within 5% at four pins. At Ngã Năm, GPM was 14.9% higher. Pins in the same NASA POWER cell share the same POWER values:

| Pin | Shares its NASA POWER cell with | NASA POWER rain (mm/yr) | NASA GPM rain (mm/yr) | GPM vs POWER | Monthly r |
|---|---|---|---|---|---|
| Vĩnh Châu | Trần Đề, Long Phú | 1746 | 1993 | +14% | 0.93 |
| Trần Đề | Vĩnh Châu, Long Phú | 1746 | 1962 | +12% | 0.93 |
| Mỹ Xuyên | Ngã Năm | 1817 | 2158 | +19% | 0.93 |
| Long Phú | Vĩnh Châu, Trần Đề | 1746 | 1893 | +8% | 0.93 |
| Ngã Năm | Mỹ Xuyên | 1817 | 2275 | +25% | 0.93 |

The per-pin figures for the 288-month comparison are in `docs/data/sites.json` (`gpm_check`). The gap hardly moves the canal-water need, because little rain falls in December–April: with NASA POWER rain instead of GPM, winter–spring rice would need +1 to +47 mm (894–960 mm becomes 941–961 mm). Over a whole year the gap is larger (3 rice crops: 1,740–2,023 mm with GPM, 2,013–2,166 mm with POWER), and the 2-rice-crops water score would rise by 0.1 at every pin (for example 1.4 to 1.5 at Vĩnh Châu, 1.3 to 1.4 at Mỹ Xuyên). The other rotations' water scores would fall by 0.1–0.2.

FAO-56 Penman–Monteith (used by the app, from NASA POWER temperature, humidity, wind and sunlight) matches FAO-56's worked example (3.88 against 3.9 mm/day). In the typical dry season it gives 4.5–4.7 mm/day at every pin. The temperature-only Hargreaves formula gives 3.0 mm/day in the coastal NASA POWER cell (Vĩnh Châu, Trần Đề, Long Phú) and 4.3 in the inland one (Mỹ Xuyên, Ngã Năm). With Hargreaves, winter–spring rice would need 773–894 mm instead of 894–960 mm; the 2-rice-crops water score would fall from 1.4 to 1.3 at Vĩnh Châu, Trần Đề and Long Phú and stay 1.3 at Mỹ Xuyên and Ngã Năm, because the score compares rotations at the same pin. Hargreaves judges sunshine and drying from the day–night temperature range, which the sea keeps small on the coast, so it reads low there; the app uses Penman–Monteith.

</details>

</details>

### Using it anywhere in the Delta
<details><summary>Show what each input needs for a new area, and the steps</summary>

The five pins are a demonstration, not a limit of the method. Every NASA dataset the app uses covers the whole Mekong Delta, so most of the work for a new pin is running the same scripts. The local parts are salinity and the crop calendars.

| Input | Covers | For a new pin |
|---|---|---|
| NASA POWER weather → water demand (ET₀) | The whole globe, ~50 km | Automatic: `fetch_power.py` |
| NASA GPM IMERG rain | The whole globe, ~10 km | Run `python pipeline/fetch_gpm.py` for the new pin, then `python pipeline/build.py`. The build stops if any required GPM month is missing. NASA POWER rain serves as a cross-check. |
| NASA MODIS greenness, crops per year, bare months | The whole globe, 250 m | Automatic: `appeears.py ndvi`, then `appeears.py find <pin_id> --apply` moves the pin onto a rice-like pixel. AppEEARS can take hours |
| SoilGrids topsoil (not NASA) | The whole globe, 250 m | Automatic: `fetch_soil.py` |
| NOAA El Niño index and forecast | The Pacific; the same for every pin | Nothing to do |
| Salinity | River and canal stations | **Local work.** The pin needs its nearest station's highest reading of each dry season. The national forecast centre's bulletins already cover 28 stations in 9 provinces (pre-2025 names, from Ho Chi Minh City to Cà Mau and Kiên Giang; NCHMF bulletin of 20 Mar 2024, Table 1), but only as 10-day readings for recent seasons. A multi-year record like the one we use for Sóc Trăng has to come from a provincial report |
| Rotation calendars and scores | Typical Sóc Trăng timing | **Local check.** Sowing dates shift by weeks between provinces; adjust `months` in `pipeline/rotations.json` from that province's crop calendar |

To add a pin:
1. Add its id, latitude, longitude and English + Vietnamese name to `pipeline/sites.py`.
2. Add its nearest station to `sites` in `pipeline/salinity.json` (station, salt months, English + Vietnamese note), and that station's yearly highest readings, with their source, to `data/raw/salinity_stations.json`. `build.py` stops if a pin has no salinity entry, so salinity is never left out by mistake.
3. Run `fetch_power.py`, `fetch_gpm.py`, `fetch_soil.py`, `appeears.py ndvi` and `appeears.py find <pin_id> --apply` (see **For teammates: updating the data**).
4. Run `build.py` and `test_build.py`.

</details>

### Limitations in full
<details><summary>Show the full list</summary>

- Five preset pins, not any field. Weather describes a ~10–50 km area and greenness one 250 m pixel (see the data table).
- The typical and El Niño years are averages of Dec 2000 – Nov 2024, not forecasts. The 9 El Niño seasons range from weak (index 0.6) to very strong (2.5). NOAA's forecast only chooses which view the app opens on; a very strong El Niño such as the one forecast for 2026–27 may be harsher than the 9-season average.
- Salinity comes from river and canal stations, not from fields, and the station is sometimes several kilometres away. Each level averages only 3–5 dry seasons, and the Khánh Hòa station (Vĩnh Châu) has no readings after 2022.
- The rotation calendars are typical Sóc Trăng timing from provincial reports; real sowing dates move by weeks from year to year and field to field. Seepage uses one FAO value for every pin.
- Heat counts days at or above 35 °C on a ~50 km NASA POWER grid; the 30-day reference is our choice. Rice is most hurt by heat at flowering (Yoshida 1981, IRRI), but the score counts every month with a crop, because sowing dates vary.
- Pests: rice pressure comes from a lab curve (Horgan et al. 2020, Philippine colony), not from Delta field counts, and monthly means at the pins sit in its 25–30 °C plateau, so it is flat across months and places. The two POWER cells that hold the five pins give pins in one cell the same weather-driven pressure. Upland and shrimp pest pressures follow the calendar with team-estimate constants; real outbreaks follow weather, variety and local control.
- Soil values are a 250 m model. Acid-sulfate soils common in the Delta vary from field to field.
- Scores are our rules from published sources, not calibrated against farm yields or incomes, and the app has no market prices. Profits are medians of published figures from other places and years (see **Published profit figures**), not from your farm; the El Niño loss shares rest on one Delta-wide harvest drop (2016) and our estimates.
- Seed, fertiliser and steps in the plan come from extension guides (2015–2025) checked against each source. Mung bean and maize figures are national norms and their steps come from guides for central and northern Vietnam (we found no Mekong guide with numbers), so the app labels them. Rice fertiliser is for alluvial soil; acid-sulfate soils need different rates.
- Upland crops: where their months meet the salt months at a medium- or high-salinity pin, the card warns that river water is far saltier than FAO lists for maize (watermelon and mung bean have no FAO number); fields with stored fresh water may do better. Which crops are grown in each area rests on a few news reports, and we found none for Vĩnh Châu.
- Fields are saved only in the phone's browser (no account): clearing site data, a private window or another phone starts again from one field. The 12-month plan reuses the rotation's typical calendar, not this year's sowing dates.

</details>

### Run the app on your Windows computer
<details><summary>Show the step-by-step guide and how teammates update the data</summary>

No coding experience needed. The first time takes about 10 minutes, and after that about 1 minute. You need a Windows computer that is **connected to the internet** (the map and the chart load from the internet), plus the free program Python.

> **Why not just double-click `index.html`?** The app reads its data from a file, and web browsers block that when a page is opened straight from your disk. You'll get an empty page. Step 3 starts a tiny "web server" on your own computer, built into Python, so the browser is allowed to read the file. Nothing is sent anywhere.

#### Step 1: Install Python (one time only)
1. Go to **https://www.python.org/downloads/** and click the yellow **Download Python** button.
2. Open the file you downloaded (it is in your **Downloads** folder).
3. If the first screen shows a box called **Add python.exe to PATH**, tick it. Then click **Install Now** and wait until it says the setup was successful.
4. Check that it worked:
   - Click the **Start** button, type **PowerShell** and press **Enter**. A window with a blue or black background opens.
   - Type the line below and press **Enter**:
     ```
     py --version
     ```
   - You should see something like `Python 3.13.1`. Use Python 3.10 or newer to run both the app server and the data checks.
   - If you see **"py is not recognized"**, type `python --version` instead. If that shows a version, use `python` wherever this guide says `py`. If neither works, see **If something goes wrong** below.

#### Step 2: Download the app (one time only)
1. Open **https://github.com/kp712/luclonghoi_jsc** in your browser.
2. Click the green **Code** button, then **Download ZIP**.
3. Open your **Downloads** folder, right-click **luclonghoi_jsc-main.zip** and choose **Extract All…**, then **Extract**.
4. Open the new **luclonghoi_jsc-main** folder. If it only contains another **luclonghoi_jsc-main** folder, open that one too. You are in the right place when you can see the folders **docs**, **pipeline** and **data**, and the file **README.md**.

#### Step 3: Start the app (every time you want to use it)
1. In that folder, click once in the **address bar** at the top of the File Explorer window (where the folder path is shown), type `powershell` and press **Enter**. A PowerShell window opens, already "inside" the app folder. On Windows 11 you can also right-click an empty space in the folder and choose **Open in Terminal**.
2. Type this line exactly and press **Enter**:
   ```
   py -m http.server 8000 -d docs
   ```
3. You should see a message like `Serving HTTP on :: port 8000`. That means the app is running. **Leave this window open** while you use the app.
   - If Windows asks whether to allow Python through the firewall, you can click **Cancel**. The app still works on this computer.
4. Open your web browser (Edge or Chrome) and go to **http://localhost:8000**.

#### Step 4: Use it
Click **Try a sample field**, or **Create a field** to pick your area on the map and plan your own. **What it does** (above) explains each part. The **EN / VI** switch at the top right changes the whole app's language.

#### Step 5: Stop the app
Click on the PowerShell window and press **Ctrl** + **C**, then close the window. Next time, start again from **Step 3**. You don't need to repeat Steps 1 and 2.

#### If something goes wrong

| What you see | What to do |
|---|---|
| `py is not recognized…` and `python` doesn't work either | Python isn't installed for PowerShell yet. Restart the computer and try Step 1, point 4 again. If it still fails, run the installer again and make sure **Add python.exe to PATH** is ticked. |
| A message mentioning **docs** and "No such file or directory" | PowerShell is in the wrong folder. Close it, go back to Step 2, point 4 to find the folder that contains **docs**, and open PowerShell from there. |
| The browser says **"This site can't be reached"** | The PowerShell window from Step 3 was closed, or the command isn't running. Do Step 3 again and keep the window open. |
| `Only one usage of each socket address…` or "address already in use" | Another program is using that number. Use `py -m http.server 8001 -d docs` and go to **http://localhost:8001**. |
| The page is empty, or shows no map or chart | Check the internet connection, then press **Ctrl** + **F5** to reload. Make sure the address starts with **http://localhost**, not `file://`. |
| You downloaded a newer version but still see the old one | Press **Ctrl** + **F5** in the browser to reload without the old saved copy. |

#### Put it online (GitHub Pages)
To give everyone a normal web link instead of running it yourself, a person with admin rights to the GitHub project can:
1. Go to the project on GitHub, then **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, **Branch** to **release**, and the folder to **/docs**, then click **Save**.
3. After a few minutes the app is at **https://kp712.github.io/luclonghoi_jsc/**. Free GitHub accounts can only do this for public projects.

#### For teammates: updating the data
You don't need this to use the app. The data in the download is already complete. Run these from the project folder in PowerShell (Step 3, point 1), one line at a time:
```
py pipeline/fetch_power.py      # NASA POWER rain + temperature, NOAA El Niño index + forecast -> data/raw/ (no login)
py pipeline/appeears.py ndvi    # NASA MODIS greenness via AppEEARS (needs Earthdata login, see below; can take hours)
py pipeline/fetch_soil.py       # SoilGrids topsoil (slow website: if it stops, run it again to continue)
py pipeline/fetch_gpm.py        # NASA GPM rain, the rain the app shows (needs Earthdata login, see below)
py pipeline/build.py            # combines everything into docs/data/sites.json
py pipeline/test_build.py       # expect 33 ok lines, the unknown-ID fixture warning, a rebuild message and any unverified sources
```
**NASA Earthdata login** (free account at https://urs.earthdata.nasa.gov; for `fetch_gpm.py` also approve **NASA GESDISC DATA ARCHIVE** under Applications → Authorized Apps). Type these two lines in the same PowerShell window before running `appeears.py` or `fetch_gpm.py`, with your own details between the quotes. They only last until you close the window:
```
$env:EARTHDATA_USERNAME = "your-username"
$env:EARTHDATA_PASSWORD = "your-password"
```
NOAA publishes a new El Niño forecast on the 2nd Thursday of each month. To refresh only that, without downloading the NASA data again: `py pipeline/fetch_power.py enso`, then `build.py` and `test_build.py`.

**Fixing a pin that isn't on rice** (its crops per year are below about 1.8, or its greenness never passes 0.6):
1. `py pipeline/appeears.py find <pin_id> --apply` moves the pin to the nearest rice-like pixel in a 7×7 grid (~5 km).
2. If it reports "no clear rice", keep the pin and relabel it in `pipeline/sites.py` (English and Vietnamese) as a rice–shrimp or mixed-land area.
3. Run `py pipeline/ndvi_from_appeears.py`, then `py pipeline/build.py` and `py pipeline/test_build.py`.

**Getting MODIS greenness by hand** (if `appeears.py` doesn't work; about 10 minutes of clicks plus a wait):
1. Make the free Earthdata account above.
2. Run `py pipeline/ndvi_from_appeears.py`. This creates `data/appeears_points.csv`.
3. Go to https://appeears.earthdatacloud.nasa.gov → **Extract** → **Point** and upload that CSV file.
4. Dates **02-18-2000** to **12-31-2025**, product **MOD13Q1.061**, layer `_250m_16_days_NDVI`, then **Submit**.
5. When the "complete" email arrives, download the file ending in `MOD13Q1-061-results.csv`.
6. Run `py pipeline/ndvi_from_appeears.py "path\to\that-file.csv"`, then `py pipeline/build.py`, then `py pipeline/test_build.py`.

</details>

---

## Challenge brief

Farmers around the world navigate shifting temperatures, changing rainfall patterns, water shortages, extreme weather, and declining soil health. These pressures make it difficult to choose crop rotations that protect fields, conserve water, and support long‑term resilience. Your challenge is to create a decision‑support tool that uses NASA Earth observations along with local soil information, crop characteristics, and farmer priorities to help farmers explore rotation strategies that could strengthen soil health and adapt their farms to changing conditions.

BACKGROUND

Farmers face increasingly complex decisions as temperatures shift, rainfall becomes less predictable, and soil health declines across many regions. Water shortages, erosion, nutrient depletion, and extreme weather events add further uncertainty. Selecting new crops to add to a rotation can be difficult, because a crop that improves soil health in one place may consume too much water, introduce disease, conflict with local markets, or fall outside expected growing seasons somewhere else.

This challenge is inspired in part by multigenerational farming experience — many families have lived through seasons where better tools for tracking changing conditions could have helped identify healthier, more resilient rotation choices. Today, NASA’s long‑term environmental datasets offer new ways to understand local growing conditions, and SI techniques open opportunities to translate that data into practical, farmer‑friendly insights.

OBJECTIVES

You may consider combining NASA Earth observations with local agricultural information to create an app, model, interactive map, or other decision‑support tool. The goal is to help farmers explore crop‑rotation options that may improve soil health and strengthen resilience to changing weather and water conditions.

You may explore NASA datasets such as SMAP, ECOSTRESS, GPM, Landsat, MODIS, NASA POWER, GRACE and GRACE‑FO, and SRTM or other NASA elevation products. Using these datasets, you may analyze patterns in temperature, heat stress, rainfall, soil moisture, evaporation, frost risk, extreme precipitation, vegetation stress, and long‑term water trends. You may also consider local soil information, crop characteristics, and farmer priorities—such as water use, forage value, nitrogen‑fixing potential, erosion reduction, organic matter improvement, or market suitability.

Your tool may highlight times when fields are typically bare, seasons when current crops appear more vulnerable, or opportunities for rotations that could interrupt pest cycles, reduce water demand, improve infiltration, or add supplemental income. You may compare at least three rotation strategies, including the existing rotation. For each strategy, you may explain why it was suggested, what evidence supports it, what benefits it may offer, where information gaps exist, and any risks that would need local review by farmers or agricultural experts.

The intended outcome is a supportive tool — one that helps identify patterns and possibilities, but does not replace farmer judgment or local agricultural expertise.

POTENTIAL CONSIDERATIONS

You may (but are not required to) consider the following:

Understanding Conditions & Data

Explore how changes in temperature, soil moisture, rainfall, evaporation, and vegetation stress relate to crop vulnerability and soil health.
Consider explaining scientific terms such as evapotranspiration, soil moisture anomalies, vegetation indices (e.g., NDVI), frost risk, and water‑balance indicators.
Clarify how satellite observations differ from ground‑based measurements, and how combining both may improve accuracy.

SI, Modeling, and Data Fusion

You may compare different SI or statistical approaches for identifying patterns in historical climate and soil conditions.
Consider how SI could highlight seasonal transitions, bare‑field periods, or times when current crops show increased stress.
Explain how the model interprets uncertainty and where local expertise would be needed to validate results.
You may consider harmonizing datasets with different spatial and temporal resolutions by downsampling, aggregating, or resampling them to a common analysis grid. Harmonizing resolution can help the SI combine SMAP soil moisture, ECOSTRESS land‑surface temperature, GPM precipitation, Landsat/MODIS vegetation indices, GEDI biomass, and soil datasets into coherent features that support clear, explainable rotation‑strategy comparisons.

Rotation Strategy Exploration

Compare rotation scenarios by examining nutrient cycling, erosion risk, organic matter contributions, pest‑cycle disruption, water use, forage potential, or market considerations.
You may consider mapping which rotation ideas best align with farmer priorities—such as conserving water, generating supplemental income, or improving soil structure.
Include brief explanations of how nitrogen‑fixing crops, cover crops, deep‑rooting crops, or drought‑tolerant crops contribute to long‑term soil health.

Geospatial Mapping & Visualization

Consider whether interactive maps could help users explore trends over time such as long‑term soil moisture, heat waves, or water‑storage declines.
Explore ways to visualize field‑level vulnerabilities (e.g., zones of erosion risk, water stress hotspots, frost‑prone areas).
You may include optional add‑ons such as timelines, overlays comparing datasets, or scenario sliders that adjust rainfall or temperature patterns.

Farmer‑Centered Design

Consider how to make the tool easily interpretable for farmers who may have limited technical or geospatial experience.
Think about ways to allow farmers to input their own priorities or constraints, such as water availability, equipment limitations, or market preferences.
Share reminders that the tool is intended to support—not replace—local expertise, and highlight where human judgment is particularly important.

For data and resources related to this challenge, refer to the Resources tab at the top of the page. More resources may be added before the hackathon begins.
