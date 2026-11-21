# Mekong Rotation Explorer
**Team Lục Long Hội · NASA Space Apps Challenge 2026**

Rice farmers in coastal Sóc Trăng, in Vietnam's Mekong Delta, grow two or three rice crops a year on land that is running short of fresh water and is reached by sea salt in the dry season. Mekong Rotation Explorer is a phone app that compares a farmer's current rotation with the local alternatives (rice–shrimp, rice plus a dry-season upland crop, salt-tolerant rice with a rest period), ranks them by what the farmer cares about using NASA Earth data for their area, and turns the chosen one into a day-by-day view of their field and a 12-month plan. It works in Vietnamese and English.

**Try it:** **https://kp712.github.io/mekong_luclonghoi/** (no login). Tap **Try a sample field** to see a field already planned, or **Create a field** to pick an area on the map. Methods, formulas and every source: **[Methods and data](#methods-and-data)** below.

| On a phone (Vietnamese) | On a computer (English) |
|---|---|
| <img src="media/phone.jpg" alt="The app on a phone in Vietnamese: today's date with a 1, 2 or 3-year preview strip, the sample field in Mỹ Xuyên on fresh water, its plan of 3 rice crops a year, a drawn rice field and the current crop at day 53 of 95 with 42 days to harvest, and the bottom bar: Today, Season, Plan, Data, Fields" width="300"> | <img src="media/desktop.jpg" alt="The app on a computer in English: the sample field's current rice crop with days to harvest and the next step, this month's rain (NASA GPM IMERG), crop water need (NASA POWER) and greenness (NASA MODIS NDVI), and this month's pest level for brown planthopper" width="500"> |

## What it does
1. **Pick your area and say what you grow.** Five areas of the former Sóc Trăng province, from the coast (Vĩnh Châu, Trần Đề) to inland (Ngã Năm). The farmer enters each field: its size and what is in it now.
2. **Compare rotations.** **Plan (+)** ranks the options for that area by five priorities: save water, more income, better soil, lower weather & salt risk, fewer pests. Each card shows its calendar, its scores, why it is suggested, its benefits and its risks, with numbered sources. The upland option lets the farmer choose watermelon, maize or mung bean. A typical year and an El Niño year can be compared; the app opens on El Niño while NOAA forecasts one.
3. **Follow the field day by day.** **Today** shows the crop in the field (a drawn field scene, days to harvest, the next job), this month's rain against what the crop needs, field greenness and this month's pest level, each with the NASA dataset it comes from. The date bar plays the coming 1, 2 or 3 years.
4. **See the season and the evidence.** **Season** is the 12-month calendar. **Data** shows salt in the field and over 12 months, the months a crop is safe from salt, estimated profit, the five scores, the El Niño outlook, sowing and harvest reminders, and a multi-year view.
5. **Several fields, one phone.** **Fields** keeps each field's area, crops, priorities and plan, saved on that phone only.

**Simple** (plain words, larger text) and **Advanced** (every number and score) show the same data. **Works with no signal, and installs like an app.** On the first visit the phone saves the app and its data (about 0.8 MB, `docs/sw.js`); after that it opens with no connection, shows a small "Ngoại tuyến · đang dùng bản đã lưu" (offline · using the saved copy) chip, and keeps each map tile the farmer has looked at. A new version downloads quietly and shows the next time the app is opened. "Add to Home Screen" gives it its own icon (`docs/manifest.webmanifest`). Live weather and place search still need a connection. If the map library fails to load, the rotation cards and plan still appear.

## NASA data it uses
| Dataset | What it gives the app | Resolution, period |
|---|---|---|
| [NASA GPM IMERG Final monthly v07](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary) | Rain each month | ~10 km, Dec 2000 – Nov 2024 |
| [NASA POWER daily API](https://power.larc.nasa.gov/) (MERRA-2 based) | Temperature, humidity, wind and sunlight → crop water demand (FAO-56 Penman–Monteith ET₀); days at or above 35 °C; mean temperature for pest pressure | ~50 km, Dec 2000 – Nov 2024 |
| [NASA MODIS MOD13Q1 v6.1 NDVI](https://lpdaac.usgs.gov/products/mod13q1v061/) via [NASA AppEEARS](https://appeears.earthdatacloud.nasa.gov/) | Field greenness, crops per year, months fields are usually bare | 250 m, 16-day, 2000–2025 |

Other data, not NASA: SoilGrids 2.0 topsoil (a model, not a soil test); NOAA's El Niño index and monthly forecast; salinity from river and canal station records in published reports. **Salinity is never measured by satellite here: the app always labels it an estimate.** Every number in the app names its source, and every source is listed with a link. Full table, caveats and what we chose not to use: [below](SOURCES.md#where-each-number-comes-from).

## How the scores work
Each rotation gets five scores from 1.0 to 5.0 (higher is better), computed for each area from the data above, not set by hand:

| Score | In one line |
|---|---|
| Water | Share of three rice crops' yearly canal water the rotation saves (FAO method, NASA POWER + GPM). |
| Income | Yearly profit against three rice crops, from the median of published profit figures for each crop. Not scored for mung bean, which has no checked figure. |
| Soil | Legume months, an optional cover crop and dry breaks help; brackish shrimp months leave salt. |
| Weather & salt | Crops in the field during the area's salt months, hot days and canal water needed when water is salty. |
| Pests | Monthly pest pressure on each crop (brown planthopper on rice from NASA POWER temperature), lowered by rest and non-rice months that break the pest cycle. |

The match is the average of the five, weighted by the farmer's priorities. Every card states **High, Medium or Low confidence**, worked out from the evidence behind it: thin profit figures, a salinity station with few recent readings, or a team estimate each lower it, and the reasons are listed on the card. Formulas, constants and the published profit table: [below](SOURCES.md#how-the-scores-are-set).

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
- **Every claim has a link,** and a source is marked checked only after the claim was found in it with a quote. 55 automated checks (`python pipeline/test_build.py`) cover the calculations and the data the app reads.

Details and numbers: [below](SOURCES.md#how-we-checked-it).

## Limitations
- Five preset areas, not any field: weather describes a 10–50 km area and greenness one 250 m pixel. The method extends to the whole Delta ([how](SOURCES.md#using-it-anywhere-in-the-delta)); salinity records and crop calendars are the local work.
- Typical and El Niño weather and rain are averages of 2000–2024, not forecasts; salt uses the dry seasons 2017–2026.
- The data also covers Vietnam's 34 provinces since July 2025 and their 63 former provinces, on the app's one map: zoom out from the Sóc Trăng areas, or tap **Việt Nam** in the top bar: NASA weather and rain for all, rotation scores only in the 5 Mekong Delta provinces, and there with a salinity estimate only where a KTTV station lies within 25 km (8 of the 63 points), so elsewhere weather & salt is not scored and confidence is mostly Low ([details](SOURCES.md#the-34-provinces)).
- Salinity comes from river and canal stations, not fields. Each Sóc Trăng typical-year average rests on 4–6 dry seasons and each El Niño average on 2–3; the other provinces rest on 1–3 seasons of 10-day bulletins, and the El Niño view on one season (2024).
- Scores are our rules from published sources, not calibrated against farm yields; profits are medians of published figures from other places and years. Some constants are team estimates, and each one lowers the card's confidence.
- Pest pressure for rice comes from a lab temperature curve and is nearly flat across months here; upland and shrimp pests follow the calendar.
- Fields are saved only in that phone's browser.

Full list: [below](SOURCES.md#limitations-in-full).

## Run it yourself
The app is a static site with no build step. With Python 3.10 or newer, from the project folder:
```
python -m http.server 8000 -d docs
```
then open http://localhost:8000. Step-by-step Windows instructions, and how to refresh the NASA data: [below](#run-the-app-on-your-windows-computer).

## How it was built
Six AI agents (Claude, GPT and Gemini), each driven by a team member, built the app through issues, reviewed pull requests and written proposals. The data pipeline (`pipeline/`) is Python standard library only and writes `docs/data/sites.json`, the one file the app reads.

## Methods and data
The full working behind the sections above (where every number comes from, how each score is computed, the published figures, how we checked it, how to add an area, and the limitations in full) is in [SOURCES.md](SOURCES.md).

## Run the app on your Windows computer
<details><summary>Show the step-by-step guide and how teammates update the data</summary>

No coding experience needed. The first time takes about 10 minutes, and after that about 1 minute. You need a Windows computer that is **connected to the internet** (the map and the chart load from the internet), plus the free program Python.

> **Why not just double-click `index.html`?** The app reads its data from a file, and web browsers block that when a page is opened straight from your disk. You'll get an empty page. Step 3 starts a tiny "web server" on your own computer, built into Python, so the browser is allowed to read the file. Nothing is sent anywhere.

### Step 1: Install Python (one time only)
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

### Step 2: Download the app (one time only)
1. Open **https://github.com/kp712/mekong_luclonghoi** in your browser.
2. Click the green **Code** button, then **Download ZIP**.
3. Open your **Downloads** folder, right-click **mekong_luclonghoi-main.zip** and choose **Extract All…**, then **Extract**.
4. Open the new **mekong_luclonghoi-main** folder. If it only contains another **mekong_luclonghoi-main** folder, open that one too. You are in the right place when you can see the folders **docs**, **pipeline** and **data**, and the file **README.md**.

### Step 3: Start the app (every time you want to use it)
1. In that folder, click once in the **address bar** at the top of the File Explorer window (where the folder path is shown), type `powershell` and press **Enter**. A PowerShell window opens, already "inside" the app folder. On Windows 11 you can also right-click an empty space in the folder and choose **Open in Terminal**.
2. Type this line exactly and press **Enter**:
   ```
   py -m http.server 8000 -d docs
   ```
3. You should see a message like `Serving HTTP on :: port 8000`. That means the app is running. **Leave this window open** while you use the app.
   - If Windows asks whether to allow Python through the firewall, you can click **Cancel**. The app still works on this computer.
4. Open your web browser (Edge or Chrome) and go to **http://localhost:8000**.

### Step 4: Use it
Click **Try a sample field**, or **Create a field** to pick your area on the map and plan your own. **What it does** (above) explains each part. The **EN / VI** switch at the top right changes the whole app's language.

### Step 5: Stop the app
Click on the PowerShell window and press **Ctrl** + **C**, then close the window. Next time, start again from **Step 3**. You don't need to repeat Steps 1 and 2.

### If something goes wrong

| What you see | What to do |
|---|---|
| `py is not recognized…` and `python` doesn't work either | Python isn't installed for PowerShell yet. Restart the computer and try Step 1, point 4 again. If it still fails, run the installer again and make sure **Add python.exe to PATH** is ticked. |
| A message mentioning **docs** and "No such file or directory" | PowerShell is in the wrong folder. Close it, go back to Step 2, point 4 to find the folder that contains **docs**, and open PowerShell from there. |
| The browser says **"This site can't be reached"** | The PowerShell window from Step 3 was closed, or the command isn't running. Do Step 3 again and keep the window open. |
| `Only one usage of each socket address…` or "address already in use" | Another program is using that number. Use `py -m http.server 8001 -d docs` and go to **http://localhost:8001**. |
| The page is empty, or shows no map or chart | Check the internet connection, then press **Ctrl** + **F5** to reload. Make sure the address starts with **http://localhost**, not `file://`. |
| You downloaded a newer version but still see the old one | Press **Ctrl** + **F5** in the browser to reload without the old saved copy. |

### Put it online (GitHub Pages)
To give everyone a normal web link instead of running it yourself, a person with admin rights to the GitHub project can:
1. Go to the project on GitHub, then **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, **Branch** to **release**, and the folder to **/docs**, then click **Save**.
3. After a few minutes the app is at **https://kp712.github.io/mekong_luclonghoi/**. Free GitHub accounts can only do this for public projects.

### For teammates: updating the data
You don't need this to use the app. The data in the download is already complete. Run these from the project folder in PowerShell (Step 3, point 1), one line at a time:
```
py pipeline/fetch_power.py      # NASA POWER rain + temperature, NOAA El Niño index + forecast -> data/raw/ (no login)
py pipeline/appeears.py ndvi    # NASA MODIS greenness via AppEEARS (needs Earthdata login, see below; can take hours)
py pipeline/fetch_soil.py       # SoilGrids topsoil (slow website: if it stops, run it again to continue)
py pipeline/fetch_gpm.py        # NASA GPM rain, the rain the app shows (needs Earthdata login, see below)
py pipeline/fetch_salinity_vietnam.py  # KTTV 10-day salinity bulletins -> data/raw/salinity_kttv_vietnam.json (no login; writes nothing if any fetch fails or a bulletin on file would be lost)
py pipeline/build.py            # combines everything into docs/data/sites.json
py pipeline/test_build.py       # expect 55 ok lines, the unknown-ID fixture warning, a rebuild message and any unverified sources
```
The plan builder's `docs/app/builder.js` is a snapshot whose generator is not in the repo: when a pin's salinity in `sites.json` changes, copy its months, `station_ppt`, `max_ppt` and level into `BUILDER.sites` by hand (`test_builder_salt_sync` fails until they match).
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
