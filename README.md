# Mekong Rotation Explorer · Khám phá luân canh Mê Kông

**Tiếng Việt** · [English](#english)

Ứng dụng trên điện thoại giúp bà con trồng lúa ven biển Sóc Trăng (Đồng bằng sông Cửu Long) so sánh cách luân canh đang làm với các cách khác ở địa phương: lúa – tôm, lúa xen cây màu mùa khô, lúa chịu mặn có tháng nghỉ. Ứng dụng xếp hạng các cách theo điều bà con quan tâm nhất (tiết kiệm nước, thu nhập, đất tốt hơn, ít rủi ro mặn và nắng nóng, ít sâu bệnh), rồi biến cách đã chọn thành lịch 12 tháng cho từng thửa ruộng.

**Mở ứng dụng:** **https://kp712.github.io/mekong_luclonghoi/** (miễn phí, không cần đăng nhập). Chạm **Xem thử với ruộng mẫu** để xem một ruộng đã lập kế hoạch, hoặc **Tạo ruộng** để chọn khu vực trên bản đồ.

| Trên điện thoại (tiếng Việt) | Trên máy tính (tiếng Anh) |
|---|---|
| <img src="media/phone.jpg" alt="Ứng dụng trên điện thoại, tiếng Việt: ngày hôm nay, ruộng mẫu ở Mỹ Xuyên, kế hoạch 3 vụ lúa, vụ lúa đang ở ngày 53 trên 95, còn 42 ngày tới gặt, và thanh dưới: Hôm nay, Mùa vụ, Kế hoạch, Số liệu, Ruộng" width="300"> | <img src="media/desktop.jpg" alt="The app on a computer in English: the sample field's current rice crop with days to harvest and the next step, this month's rain (CHIRPS), crop water need (ERA5) and greenness (NASA MODIS NDVI), and this month's pest level for brown planthopper" width="500"> |

**Dành cho bà con và cán bộ khuyến nông**
- **Số liệu từ đâu.** Mưa lấy từ CHIRPS (Trung tâm Khí hậu của Đại học California Santa Barbara, ước tính từ vệ tinh và trạm đo mưa); nắng nóng và độ xanh của ruộng lấy từ vệ tinh NASA (2000–2024). Độ mặn là **ước tính** từ trạm đo trên sông (bản tin của Trung tâm Dự báo KTTV quốc gia và báo cáo đã công bố), không phải đo trong ruộng. Mỗi con số trong ứng dụng đều ghi nguồn.
- **Không có sóng vẫn dùng được.** Lần đầu mở, điện thoại tự lưu ứng dụng và số liệu (khoảng 0,8 MB). Sau đó mở được khi không có mạng. Chọn "Thêm vào Màn hình chính" để có biểu tượng như một ứng dụng.
- **Một cách xem cho mọi người.** Lời dễ hiểu, nút lớn; chạm **Vì sao & nguồn** (và các mục gập khác) để xem mọi con số, điểm và nguồn.
- **So với cách đang làm.** Mỗi cách luân canh ghi rõ so với cách bạn đang trồng: tiền lời và tiền vốn hơn kém bao nhiêu cho diện tích ruộng của bạn, và số tháng cây bị mặn nhiều hay ít hơn (ước tính từ số liệu đã công bố).
- **Ruộng chỉ lưu trên điện thoại đó.** Không ai khác xem được.
- **Giới hạn.** Kế hoạch là điểm khởi đầu để bàn với cán bộ khuyến nông, không thay cho kinh nghiệm của bà con. Số liệu mô tả cả khu vực, không phải từng thửa; mưa và nắng là trung bình nhiều năm, không phải dự báo. Kế hoạch chi tiết hiện có cho 5 khu vực của Sóc Trăng cũ. Bản đồ Đồng bằng sông Cửu Long và Tây Ninh có mưa và thời tiết cho 6 tỉnh (14 tỉnh cũ); điểm luân canh có ở 13 tỉnh cũ (12 tỉnh cũ của Đồng bằng sông Cửu Long và Long An), và chỉ 6 trên 14 điểm có ước tính mặn.
- **Cách tính điểm, nguồn số liệu, công thức:** [SOURCES.md](SOURCES.md) (tiếng Anh).
- **Góp ý, báo lỗi, hỏi đáp:** [github.com/kp712/mekong_luclonghoi/issues](https://github.com/kp712/mekong_luclonghoi/issues).
- **Được dùng và chia sẻ tự do,** kể cả làm tài liệu tập huấn: mã nguồn MIT, nội dung CC BY 4.0, chỉ cần ghi nguồn ([chi tiết](LICENSE-CONTENT.md)).

**Cách mở ứng dụng**
1. **Trên web (dễ nhất):** mở **https://kp712.github.io/mekong_luclonghoi/** bằng trình duyệt trên điện thoại hoặc máy tính. Không cần cài đặt hay đăng nhập.
2. **Trên máy tính của mình** (khi muốn có bản riêng): cài Python 3.10 trở lên từ python.org, tải mã nguồn (nút **Code → Download ZIP** trên trang GitHub) rồi giải nén. Mở PowerShell trong thư mục vừa giải nén, gõ `py -m http.server 8000 -d docs`, rồi mở **http://localhost:8000**. Hướng dẫn từng bước (tiếng Anh): [How to open the app](#how-to-open-the-app).

<a id="english"></a>
## English

Rice farmers in coastal Sóc Trăng, in Vietnam's Mekong Delta, grow two or three rice crops a year on land that is running short of fresh water and is reached by sea salt in the dry season. Mekong Rotation Explorer is a phone app that compares a farmer's current rotation with the local alternatives (rice–shrimp, rice plus a dry-season upland crop, salt-tolerant rice with a rest period), ranks them by what the farmer cares about using NASA Earth data for their area, and turns the chosen one into a day-by-day view of their field and a 12-month plan. It works in Vietnamese and English. It is meant for farmers and for the extension officers, local officials and researchers who bring it to them.

**Try it:** **https://kp712.github.io/mekong_luclonghoi/** (no login). Tap **Try a sample field** to see a field already planned, or **Create a field** to pick an area on the map. Methods, formulas and every source: **[SOURCES.md](SOURCES.md)**. Questions and problems: **[Issues](https://github.com/kp712/mekong_luclonghoi/issues)**. Free to use and adapt: code MIT ([LICENSE](LICENSE)), content CC BY 4.0 ([LICENSE-CONTENT.md](LICENSE-CONTENT.md)).

### What it does
1. **Pick your area and say what you grow.** Five areas of the former Sóc Trăng province, from the coast (Vĩnh Châu, Trần Đề) to inland (Ngã Năm). The farmer enters each field: its size and what is in it now.
2. **Compare rotations.** **Plan (+)** ranks the options for that area by five priorities: save water, more income, better soil, lower weather & salt risk, fewer pests. Each card shows its calendar, its scores, why it is suggested, its benefits and its risks, with numbered sources. Each card also says how it differs from what the farmer grows now: profit and cost for their own hectares, and months with crops in salty water (estimates from published figures); the current rotation always stays on screen. The upland option lets the farmer choose watermelon, maize or mung bean. A typical year and an El Niño year can be compared; the app opens on El Niño while NOAA forecasts one.
3. **Follow the field day by day.** **Today** shows the crop in the field (a drawn field scene, days to harvest, the next job), this month's rain against what the crop needs, field greenness and this month's pest level, each with the dataset it comes from. The date bar plays the coming 1, 2 or 3 years.
4. **See the season and the evidence.** **Season** is the 12-month calendar. **Data** shows salt in the field and over 12 months, the months a crop is safe from salt, estimated profit, the five scores, the El Niño outlook, sowing and harvest reminders, and a multi-year view.
5. **Several fields, one phone.** **Fields** keeps each field's area, crops, priorities and plan, saved on that phone only.

One view for everyone: plain words and big buttons; tap **Why & sources** (and the other folds) for every number, score and source. **Works with no signal, and installs like an app.** On the first visit the phone saves the app and its data (about 0.8 MB, `docs/sw.js`); after that it opens with no connection, shows a small "Ngoại tuyến · đang dùng bản đã lưu" (offline · using the saved copy) chip, and keeps each map tile the farmer has looked at. A new version downloads quietly and shows the next time the app is opened. "Add to Home Screen" gives it its own icon (`docs/manifest.webmanifest`). Live weather and place search still need a connection. If the map library fails to load, the rotation cards and plan still appear.

### NASA data it uses
| Dataset | What it gives the app | Resolution, period |
|---|---|---|
| [NASA GPM IMERG Final monthly v07](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary) | Only a cross-check of the rain below | ~10 km, Dec 2000 – Nov 2024 |
| [CHIRPS v3.0](https://www.chc.ucsb.edu/data/chirps3) (Climate Hazards Center, UC Santa Barbara; not NASA) | Rain each month (satellite and rain-gauge estimate) | ~5 km, Dec 2000 – Nov 2024 |
| [ERA5 / ERA5-Land (Copernicus Climate Change Service, ECMWF) via Open-Meteo](https://open-meteo.com/en/docs/historical-weather-api) (CC BY 4.0) | ERA5: daily maximum and minimum temperature (mean temperature for pest pressure) and the FAO-56 reference evapotranspiration (ET₀) that Open-Meteo computes; ERA5-Land: days at or above 35 °C | ERA5 ~25 km, ERA5-Land ~10 km, Dec 2000 – Nov 2024 |
| [NASA MODIS MOD13Q1 v6.1 NDVI](https://lpdaac.usgs.gov/products/mod13q1v061/) via [NASA AppEEARS](https://appeears.earthdatacloud.nasa.gov/) | Field greenness, crops per year, months fields are usually bare | 250 m, 16-day, 2000–2025 |

Other data, not NASA: SoilGrids 2.0 topsoil (a model, not a soil test); NOAA's El Niño index and monthly forecast; salinity from river and canal station records in published reports. **Salinity is never measured by satellite here: the app always labels it an estimate.** Every number in the app names its source, and every source is listed with a link. Full table, caveats and what we chose not to use: [SOURCES.md](SOURCES.md#where-each-number-comes-from).

### How the scores work
Each rotation gets five scores from 1.0 to 5.0 (higher is better), computed for each area from the data above, not set by hand:

| Score | In one line |
|---|---|
| Water | Share of three rice crops' yearly canal water the rotation saves (FAO method, ERA5 + CHIRPS). |
| Income | Yearly profit against three rice crops, from the median of published profit figures for each crop. Not scored for mung bean, which has no checked figure. |
| Soil | Legume months, an optional cover crop and dry breaks help; brackish shrimp months leave salt. |
| Weather & salt | Crops in the field during the area's salt months, hot days and canal water needed when water is salty. |
| Pests | Monthly pest pressure on each crop (brown planthopper on rice from ERA5 temperature), lowered by rest and non-rice months that break the pest cycle. |

The match is the average of the five, weighted by the farmer's priorities. Every card states **High, Medium or Low confidence**, worked out from the evidence behind it: thin profit figures, a salinity station with few recent readings, or a team estimate each lower it, and the reasons are listed on the card. Formulas, constants and the published profit table: [SOURCES.md](SOURCES.md#how-the-scores-are-set).

### How we know it holds up
- **Pins sit on rice.** Each area's pin must look like rice in NASA MODIS (250 m) and NASA HLS (30 m) greenness. The 30 m check moved the Vĩnh Châu pin off shrimp ponds and the Ngã Năm pin off garden land in November 2026. The pins show 1.9–2.4 crops a year over the last 10 seasons.
- **NASA data finds the known droughts.** Ranked by dry-season water shortfall, 4 of the 5 driest seasons since 2000 at Trần Đề are El Niño seasons, including 2019–20, one of the worst droughts in Vietnamese reports (2015–16 ranks seventh with CHIRPS rain).
- **Two rain sources agree.** CHIRPS and NASA GPM IMERG rain correlate at 0.93–0.94 month to month at every pin; CHIRPS's yearly totals are within −6% to +1% of IMERG's at the 5 pins and its Dec–Apr totals 5–14% lower. Against the one rain gauge we could read (Cà Mau, which CHIRPS itself uses, so not independent) CHIRPS is 13% wetter for the year and IMERG 23%.
- **Methods reproduce their references.** Water demand matches FAO-56's worked example (3.88 vs 3.9 mm/day); canal water reproduces FAO Manual 3's rice example.
- **The ranking survives our guesses.** Moving each team-estimate constant (salt tolerance, heat reference, brackish soil loss, soil and weather weights, pest break) by ±20% never changes the best rotation at any of the 5 areas (`python pipeline/sensitivity.py`; income and water are held at their built values).
- **Every claim has a link,** and a source is marked checked only after the claim was found in it with a quote. 69 automated checks (`python pipeline/test_build.py`) cover the calculations and the data the app reads.

Details and numbers: [SOURCES.md](SOURCES.md#how-we-checked-it).

### Limitations
- Five preset areas, not any field: weather describes a 10–50 km area and greenness one 250 m pixel. The method extends to the whole Delta ([how](SOURCES.md#using-it-anywhere-in-the-delta)); salinity records and crop calendars are the local work.
- Typical and El Niño weather and rain are averages of 2000–2024, not forecasts; salt uses the dry seasons 2016–2026.
- ERA5 temperature and ET₀ are 0.25° (~28 km) model cells: Vĩnh Châu, Trần Đề, Mỹ Xuyên and Long Phú share one cell and get identical temperature and ET₀. Heat days come from ERA5-Land (0.1°) and are rare in a typical year (0.1–3 days), so the heat part of the weather & salt score is small. These are model values, not station readings.
- The data also covers 6 southern provinces (the Mekong Delta's 5 and Tây Ninh, 14 former provinces) on the app's one map: zoom out from the Sóc Trăng areas, or tap **ĐBSCL** in the top bar. NASA weather and CHIRPS rain for all; rotation scores in the 12 Mekong Delta former provinces and former Long An; a salinity estimate only where a KTTV station lies within 25 km (6 of the 14 points), so elsewhere weather & salt is not scored and confidence is mostly Low ([details](SOURCES.md#the-6-provinces)). We cover the south first and will add more provinces once it is refined.
- Salinity comes from river and canal stations, not fields. Each Sóc Trăng typical-year average rests on 4–6 dry seasons and each El Niño average on 3–4; the other provinces rest on 1–3 seasons of 10-day bulletins, and the El Niño view on one season (2024).
- Scores are our rules from published sources, not calibrated against farm yields; profits are medians of published figures from other places and years. Some constants are team estimates, and each one lowers the card's confidence.
- Pest pressure for rice comes from a lab temperature curve and is nearly flat across months here; upland and shrimp pests follow the calendar.
- Fields are saved only in that phone's browser.

Full list: [SOURCES.md](SOURCES.md#limitations-in-full).

### How to open the app
**1. On the web (easiest).** Open **https://kp712.github.io/mekong_luclonghoi/** in any browser, on a phone or a computer. Nothing to install, no login.

**2. On your own computer.** Use this to keep your own copy or try changes. The app is a static site with no build step. With Python 3.10 or newer, from the project folder:
```
python -m http.server 8000 -d docs
```
then open http://localhost:8000.

<details><summary>Show the step-by-step guide for Windows</summary>

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
1. Open **https://github.com/kp712/mekong_luclonghoi** in your browser.
2. Click the green **Code** button, then **Download ZIP**.
3. Open your **Downloads** folder, right-click **mekong_luclonghoi-main.zip** and choose **Extract All…**, then **Extract**.
4. Open the new **mekong_luclonghoi-main** folder. If it only contains another **mekong_luclonghoi-main** folder, open that one too. You are in the right place when you can see the folders **docs**, **pipeline** and **data**, and the file **README.md**.

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

</details>

### Updating the data
<details><summary>Show the commands (for the project team; not needed to use the app)</summary>

You don't need this to use the app. The data in the download is already complete. Run these from the project folder in PowerShell (see Step 3, point 1 of the Windows guide), one line at a time:
```
py pipeline/fetch_era5.py       # ERA5 / ERA5-Land weather via Open-Meteo -> data/raw/ (no login)
py pipeline/fetch_enso.py       # NOAA El Niño index + forecast -> data/raw/ (no login)
py pipeline/appeears.py ndvi    # NASA MODIS greenness via AppEEARS (needs Earthdata login, see below; can take hours)
py pipeline/fetch_soil.py       # SoilGrids topsoil (slow website: if it stops, run it again to continue)
py pipeline/fetch_chirps.py     # CHIRPS v3.0 rain, the rain the app shows (no login; needs tifffile and imagecodecs)
py pipeline/fetch_gpm.py        # NASA GPM IMERG rain, only the cross-check of CHIRPS (needs Earthdata login, see below)
py pipeline/fetch_salinity_vietnam.py  # KTTV 10-day salinity bulletins -> data/raw/salinity_kttv_vietnam.json (no login; writes nothing if any fetch fails or a bulletin on file would be lost)
py pipeline/build.py            # combines everything into docs/data/ and docs/app/builder.js
py pipeline/test_build.py       # expect 69 ok lines, the unknown-ID fixture warning, a rebuild message and any unverified sources
```
`build.py` also writes the Plan Lab's `docs/app/builder.js`; never edit it by hand. `build.py` needs only Python's standard library. `fetch_salinity_vietnam.py` needs `pdfplumber` to read the bulletin PDFs and `fetch_chirps.py` needs `tifffile` and `imagecodecs`: run `py -m pip install pdfplumber tifffile imagecodecs` once, before the tests (they load those scripts).
**NASA Earthdata login** (free account at https://urs.earthdata.nasa.gov; for `fetch_gpm.py` also approve **NASA GESDISC DATA ARCHIVE** under Applications → Authorized Apps). Type these two lines in the same PowerShell window before running `appeears.py` or `fetch_gpm.py`, with your own details between the quotes. They only last until you close the window:
```
$env:EARTHDATA_USERNAME = "your-username"
$env:EARTHDATA_PASSWORD = "your-password"
```
NOAA publishes a new El Niño forecast on the 2nd Thursday of each month. To refresh only that, without downloading the weather again: `py pipeline/fetch_enso.py enso`, then `build.py` and `test_build.py`.

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

### Origin
The app started as the team Lục Long Hội's entry to the NASA Space Apps Challenge 2026. The data pipeline (`pipeline/`) is Python and writes `docs/data/sites.json`, the one file the app reads.

### Methods and data
The full working behind the sections above (where every number comes from, how each score is computed, the published figures, how we checked it, how to add an area, and the limitations in full) is in [SOURCES.md](SOURCES.md).
