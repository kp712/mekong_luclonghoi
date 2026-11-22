# Rain: CHIRPS v3 / v2 against IMERG Final and station rain at the app's points

Test date: 22 Nov 2026. This tests the recommendation in `rain.md` (switch monthly rain from IMERG Final v07 to CHIRPS v3.0, with v2.0 as fallback) at the app's 19 points (5 Sóc Trăng pins + 14 former-province points, `sites.points()`). The numbers here are my own computations from the files named. Scripts:
- `research/scripts/chirps_points.py`: CHIRPS point extraction.
- `research/scripts/chirps_vs_imerg.py`: all tables below. Its output was saved to the scratchpad as `rain/tables.md`.

Periods: "app period" means Dec 2000 – Nov 2024, `build.PERIOD`, 24 Dec–Nov seasons. Correlations use every month that both series have, Dec 2000 – Sep 2025 (298 months per point). "Dry season" means Dec–Apr.

## Method, and the latest CHIRPS files and URL patterns

### Takeaway
Both CHIRPS versions publish monthly cloud-optimised GeoTIFFs. The full record, Jan 1981 – Oct 2026, was read at all 19 points through HTTP range reads, with no GDAL: `tifffile` parses the header, and the one 512×512 tile that holds all the points is fetched and decoded (about 0.5 MB per month). The range-read values match a full-file read exactly. The latest file for both versions is Oct 2026, posted 13 Nov 2026. The server rate-limits (HTTP 429), so the fetcher needs back-off.

### Cited Findings
- URL patterns, verified 22 Nov 2026:
  - v3: `https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/cogs/chirps-v3.0.YYYY.MM.cog` runs from `1981.01` to `2026.10`. The Oct 2026 file is 29.6 MiB, posted 2026-Nov-13 22:26, and the server answers `accept-ranges: bytes`.
  - v2: `https://data.chc.ucsb.edu/products/CHIRPS/v2.0/global_monthly/cogs/chirps-v2.0.YYYY.MM.cog` runs from `1981.01` to `2026.10` (24.5 MiB, posted 2026-Nov-13 22:26).
  - Plain GeoTIFFs: `.../v3.0/monthly/global/tifs/chirps-v3.0.YYYY.MM.tif` and `.../v2.0/global_monthly/tifs/chirps-v2.0.YYYY.MM.tif.gz`.
  - Sources: [v3 COG folder](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/cogs/); [v2 COG folder](https://data.chc.ucsb.edu/products/CHIRPS/v2.0/global_monthly/cogs/)
- COG layout, read from the file headers:
  - v3 is 7200×2400 float32, 0.05°, top-left corner (−180°, 60°N), 512×512 tiles, 5 pages (full resolution plus overviews).
  - v2 is 7200×2000, top-left corner (−180°, 50°N).
  - Every point falls in one tile, and no point lands on an ocean (no-data) cell.
  - Source: [v3 COG, Oct 2026](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/cogs/chirps-v3.0.2026.10.cog)
- CHC README for v3:
  - The final product is "updated monthly" and is "typically complete during the third week of the following month".
  - The preliminary product is out 2 days after each pentad ends. A `prelim/monthly/global/tifs/` folder exists (updated 2026-Nov-02).
  - Version 3.0 was released 2025-01-01.
  - Missing satellite data is filled with 0.25° ERA5 (v2 used 0.5° CFS).
  - Station data is gauge-undercatch corrected, so "CHIRPS v3.0 is overall wetter compared to CHIRPS v2.0".
  - Source: [README-CHIRPSv3.0.txt](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/README-CHIRPSv3.0.txt); [prelim folder](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/prelim/monthly/)
- Self-checks:
  - For Oct 2024, the range-read values equal the values read from the full v3 `.tif` and the full v2 `.tif.gz` at all 19 points.
  - A decoded tile equals the same 512×512 block of the full file (max difference 0.0).
  - `chirps_vs_imerg.check()` asserts 550 months and no gaps for every point in both versions. — `research/scripts/chirps_points.py`, `research/scripts/chirps_vs_imerg.py`
- Fetching all 1,100 COGs plus 592 station-pixel months took about 15 minutes with 3 threads. The server returned `429 Too Many Requests` at 8 threads and again for about a minute between bursts, so the fetcher retries with exponential back-off and saves every 24 months. — [CHC data server](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/)

### Inferences
- A pipeline fetcher needs only `tifffile` + `imagecodecs` (pip wheels), about 100 lines, and no login. Compare `fetch_gpm.py`, which needs an Earthdata login, OPeNDAP fallbacks and 4-month batches.
- Pixel edges matter. Four pins sit exactly on a 0.05° edge: Trần Đề (9.5 N, 106.1 E), Mỹ Xuyên (9.5 N, 105.9 E), Long Phú (106.1 E) and Ngã Năm (105.6 E). The two neighbouring cells can differ by about 9% in a month: Trần Đề, Oct 2024, v3 gave 369 vs 404 mm. My reader puts an edge point in the cell to its south/east. A production fetcher should fix one rule, or nudge pins off the edges.

### Gaps
- I did not test the NetCDF route (`netcdf/chirps-v3.0.monthly.nc`) or the preliminary monthly files.

## CHIRPS against IMERG Final at the 19 points

### Takeaway
Month to month, CHIRPS and IMERG agree closely: pooled r = 0.93 for v3 and 0.92 for v2, and every point is between 0.89 and 0.96. Over the app period, CHIRPS is drier than IMERG:
- v3 is −6% for the year (1895 vs 2009 mm, mean of 19 points) and −13% for Dec–Apr (163 vs 186 mm).
- v2 is −11% for the year and −19% for Dec–Apr.
- At the 5 Sóc Trăng pins, v3 is within −6% to +1% of IMERG for the year and −5% to −14% for Dec–Apr.

The biggest gaps are inland in the north-west of the Delta: An Giang −23% and Đồng Tháp −20% for the year.

### Cited Findings
All rows below are from `chirps_vs_imerg.py`, using data from [CHIRPS v3/v2 COGs](https://data.chc.ucsb.edu/products/CHIRPS/) and the app's `data/raw/gpm.json` (IMERG V07 Final, GPM_3IMERGM).

Per point: the r columns are monthly correlations, Dec 2000 – Sep 2025. Totals are means over the app period. "dry r" is the correlation of the 24 Dec–Apr totals.

| point | r v3-IMERG | r v2-IMERG | r v3-v2 | IMERG mm/yr | v2 mm/yr | v3 mm/yr | v2 vs IMERG | v3 vs IMERG | v3 vs v2 | dry IMERG | dry v2 | dry v3 | dry v3 vs IMERG | dry r v3-IMERG |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vinh_chau (pin) | 0.94 | 0.94 | 0.98 | 2068 | 1770 | 1955 | -14% | -5% | +10% | 164 | 118 | 150 | -9% | 0.90 |
| tran_de (pin) | 0.93 | 0.93 | 0.98 | 1962 | 1708 | 1862 | -13% | -5% | +9% | 156 | 105 | 139 | -11% | 0.88 |
| my_xuyen (pin) | 0.94 | 0.94 | 0.98 | 2158 | 1867 | 2028 | -13% | -6% | +9% | 169 | 122 | 161 | -5% | 0.90 |
| long_phu (pin) | 0.93 | 0.93 | 0.98 | 1893 | 1773 | 1910 | -6% | +1% | +8% | 160 | 117 | 147 | -8% | 0.91 |
| nga_nam (pin) | 0.94 | 0.94 | 0.98 | 2275 | 2100 | 2283 | -8% | +0% | +9% | 209 | 175 | 180 | -14% | 0.89 |
| tay_ninh | 0.92 | 0.92 | 0.95 | 2097 | 2042 | 1908 | -3% | -9% | -7% | 231 | 209 | 221 | -4% | 0.89 |
| long_an | 0.92 | 0.93 | 0.97 | 1770 | 1659 | 1779 | -6% | +0% | +7% | 156 | 147 | 169 | +8% | 0.89 |
| dong_thap | 0.93 | 0.90 | 0.96 | 1922 | 1518 | 1534 | -21% | -20% | +1% | 191 | 168 | 150 | -22% | 0.90 |
| tien_giang | 0.92 | 0.92 | 0.97 | 1704 | 1589 | 1556 | -7% | -9% | -2% | 154 | 121 | 143 | -7% | 0.85 |
| an_giang | 0.92 | 0.89 | 0.96 | 2013 | 1548 | 1548 | -23% | -23% | -0% | 216 | 178 | 158 | -27% | 0.92 |
| kien_giang | 0.93 | 0.91 | 0.96 | 2291 | 1992 | 2272 | -13% | -1% | +14% | 225 | 211 | 186 | -17% | 0.95 |
| vinh_long | 0.93 | 0.92 | 0.96 | 1765 | 1556 | 1524 | -12% | -14% | -2% | 163 | 128 | 140 | -14% | 0.86 |
| ben_tre | 0.92 | 0.92 | 0.98 | 1683 | 1583 | 1727 | -6% | +3% | +9% | 148 | 117 | 143 | -3% | 0.86 |
| tra_vinh | 0.93 | 0.93 | 0.96 | 1753 | 1579 | 1533 | -10% | -13% | -3% | 152 | 94 | 100 | -34% | 0.85 |
| can_tho | 0.94 | 0.93 | 0.98 | 1896 | 1635 | 1760 | -14% | -7% | +8% | 174 | 140 | 143 | -17% | 0.88 |
| soc_trang | 0.93 | 0.93 | 0.98 | 1896 | 1845 | 2050 | -3% | +8% | +11% | 158 | 132 | 181 | +14% | 0.89 |
| hau_giang | 0.94 | 0.93 | 0.98 | 2212 | 1971 | 2180 | -11% | -1% | +11% | 200 | 180 | 178 | -11% | 0.92 |
| ca_mau | 0.96 | 0.94 | 0.98 | 2791 | 2420 | 2568 | -13% | -8% | +6% | 338 | 261 | 260 | -23% | 0.88 |
| bac_lieu | 0.95 | 0.93 | 0.97 | 2029 | 1790 | 2028 | -12% | -0% | +13% | 172 | 123 | 143 | -17% | 0.92 |
| **mean of 19** | 0.93 | 0.92 | 0.97 | 2009 | 1786 | 1895 | -11% | -6% | +6% | 186 | 150 | 163 | -13% | 0.89 |

Pooled over 5,662 point-months: monthly r v3–IMERG 0.930, v2–IMERG 0.923, v3–v2 0.969. RMSE against IMERG: v3 52 mm/month, v2 57 mm/month.

Typical year, monthly means in mm, **5 Sóc Trăng pins**:

| series | Dec | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec-Apr | year |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| IMERG v07, Dec 2000–Nov 2024 (app now) | 52 | 25 | 9 | 26 | 59 | 225 | 256 | 326 | 255 | 353 | 313 | 172 | 172 | 2071 |
| CHIRPS v2, Dec 2000–Nov 2024 | 38 | 12 | 6 | 15 | 56 | 204 | 229 | 275 | 242 | 301 | 296 | 169 | 127 | 1843 |
| CHIRPS v3, Dec 2000–Nov 2024 | 49 | 17 | 6 | 20 | 63 | 227 | 253 | 305 | 286 | 311 | 308 | 161 | 155 | 2007 |
| CHIRPS v3, Dec 1981–Nov 2025 (44 seasons) | 47 | 12 | 6 | 16 | 66 | 225 | 268 | 287 | 302 | 308 | 315 | 159 | 148 | 2011 |
| CHIRPS v3, Dec 1981–Nov 2000 (19 seasons) | 37 | 7 | 6 | 11 | 72 | 220 | 286 | 270 | 324 | 303 | 320 | 149 | 134 | 2005 |
| CHIRPS v2, Dec 1981–Nov 2025 | 34 | 10 | 6 | 14 | 51 | 202 | 236 | 258 | 250 | 295 | 290 | 160 | 115 | 1806 |
| v2 minus IMERG (app period) | -15 | -12 | -3 | -12 | -3 | -21 | -27 | -51 | -13 | -52 | -17 | -2 | -44 | -228 |
| v3 minus IMERG (app period) | -3 | -8 | -3 | -6 | +4 | +2 | -3 | -21 | +31 | -42 | -4 | -10 | -16 | -64 |

Typical year, monthly means in mm, **all 19 points**:

| series | Dec | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec-Apr | year |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| IMERG v07, Dec 2000–Nov 2024 (app now) | 56 | 25 | 12 | 29 | 65 | 209 | 239 | 300 | 248 | 338 | 316 | 174 | 186 | 2009 |
| CHIRPS v2, Dec 2000–Nov 2024 | 46 | 12 | 6 | 19 | 67 | 198 | 219 | 268 | 223 | 276 | 292 | 160 | 150 | 1786 |
| CHIRPS v3, Dec 2000–Nov 2024 | 52 | 17 | 7 | 21 | 65 | 204 | 235 | 280 | 251 | 293 | 305 | 163 | 163 | 1895 |
| CHIRPS v3, Dec 1981–Nov 2025 (44 seasons) | 48 | 13 | 7 | 18 | 67 | 203 | 246 | 268 | 260 | 293 | 312 | 162 | 152 | 1896 |
| CHIRPS v3, Dec 1981–Nov 2000 (19 seasons) | 36 | 6 | 6 | 14 | 71 | 198 | 256 | 259 | 271 | 291 | 315 | 155 | 133 | 1879 |
| CHIRPS v2, Dec 1981–Nov 2025 | 40 | 10 | 6 | 17 | 61 | 193 | 222 | 253 | 229 | 269 | 286 | 152 | 134 | 1738 |
| v2 minus IMERG (app period) | -9 | -13 | -6 | -10 | +2 | -10 | -19 | -32 | -25 | -62 | -24 | -14 | -36 | -223 |
| v3 minus IMERG (app period) | -3 | -7 | -5 | -8 | +0 | -5 | -3 | -19 | +3 | -45 | -11 | -11 | -23 | -114 |

El Niño split, mean of 19 points, app period. El Niño seasons are those with Dec–Feb ONI ≥ 0.5 in `data/raw/oni.txt`: 2002, 2004, 2006, 2009, 2014, 2015, 2018, 2019 and 2023, 9 seasons.

| product | Dec–Apr, El Niño seasons | Dec–Apr, other seasons | year, El Niño | year, other |
|---|---|---|---|---|
| IMERG | 111 | 231 | 2026 | 2000 |
| CHIRPS v2 | 92 | 185 | 1817 | 1768 |
| CHIRPS v3 | 86 | 209 | 1911 | 1885 |

Seasons where IMERG and CHIRPS v3 part most (19-point mean, Dec–Nov totals):

| season | IMERG | v2 | v3 | v3/IMERG |
|---|---|---|---|---|
| 2013 | 1929 | 1560 | 1569 | 0.81 |
| 2017 | 2095 | 1588 | 1707 | 0.81 |
| 2018 | 2579 | 1603 | 1789 | 0.69 |

All other seasons from 2000 to 2023 fall between 0.89 and 1.10.

### Inferences
- The timing agrees: r ≈ 0.93 monthly and 0.89 for the dry-season totals. The main difference is level. IMERG is about 11% (v2) and 6% (v3) wetter for the year, and about 13–19% wetter in Dec–Apr. For the app's water need this means CHIRPS will show slightly *more* irrigation need in the dry season than today's IMERG figures: about 16 mm less Dec–Apr rain at the pins with v3, 44 mm less with v2.
- The El Niño dry-season signal is about as strong in CHIRPS v3 (86 vs 209 mm, −59%) as in IMERG (111 vs 231 mm, −52%), so the El Niño view would keep its message.
- IMERG has some seasons that are much wetter than CHIRPS, notably 2018. The station check below suggests that is an IMERG wet bias, not CHIRPS missing rain.

### Gaps
- No independent gauge network inside Sóc Trăng was available, so I cannot tell from this alone which product is right at the pins.

## How much does v3's undercatch correction raise totals against v2?

### Takeaway
At these points v3 is 6% wetter than v2 over the app period (Dec–Apr +9%), and 13% wetter over 1981–2000 (Dec–Apr +18%). The increase is not uniform: the coastal Sóc Trăng and Bạc Liêu points rise 8–14%, while An Giang, Đồng Tháp, Tiền Giang, Vĩnh Long, Trà Vinh and Tây Ninh are unchanged or lower (−7% to +1%).

### Cited Findings
19-point mean, from `chirps_vs_imerg.py` (`table_v3_v2`):

| period | v2 mm/yr | v3 mm/yr | v3/v2 | v2 Dec–Apr | v3 Dec–Apr | v3/v2 Dec–Apr |
|---|---|---|---|---|---|---|
| Dec 1981 – Nov 2000 | 1661 | 1879 | 1.131 | 113 | 133 | 1.181 |
| Dec 2000 – Nov 2024 | 1786 | 1895 | 1.061 | 150 | 163 | 1.087 |
| Dec 2024 – Nov 2025 | 2033 | 2250 | 1.107 | 165 | 245 | 1.484 |
| Dec 1981 – Nov 2025 | 1738 | 1896 | 1.091 | 134 | 152 | 1.132 |

- Per-point v3 vs v2 for the app period is in the "v3 vs v2" column of the first table: −7% (Tây Ninh) to +14% (Kiên Giang). The pins are +8% to +10%.
- CHC says v3 switched to "gauge-undercatch corrected station data", so "CHIRPS v3.0 is overall wetter", and that CHIRP3's lower intercept and larger slope widen the range of values. — [README-CHIRPSv3.0.txt](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/README-CHIRPSv3.0.txt)
- At the Cà Mau station pixel, v3 lands above the gauge value it ingests. In June 2018 the CHC station table lists GSOD Cà Mau 237.7 mm (MCDW 239), while the v3 pixel is 328 mm and the v2 pixel 280 mm. — [CHC monthly station data 2018.06](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/diagnostics/monthly_station_data/2018.06.csv)

### Inferences
- "v3 is wetter" holds only on average. Inland points where IMERG was already much wetter (An Giang, Đồng Tháp) get no increase, so the gap to IMERG stays there.
- The v3/v2 ratio is not stable over time: 1.13 before 2000, 1.06 after. Between products, this alone means v2 and v3 cannot be spliced.

### Gaps
- The exact Legates undercatch factors at the Delta stations were not read (they are in `diagnostics/legates-willmott_corrections/`).

## Station check: GSOD Cần Thơ, Cà Mau, Rạch Giá

### Takeaway
Only Cà Mau gives a usable sample: 255 months pass the strict ≥90% rule (103 of them Dec–Apr). Rạch Giá gives 44. Cần Thơ gives none, because its GSOD file holds no precipitation reports at all.

At Cà Mau:
- IMERG is 23% wetter than the gauge, and 56% wetter for Dec–Apr.
- CHIRPS v2 is +7% (Dec–Apr +20%); CHIRPS v3 is +13% (Dec–Apr +20%).
- CHIRPS v3 has the best correlation (0.95, against 0.92 for IMERG and 0.91 for v2).

But both Cà Mau and Rạch Giá are CHIRPS input stations, so this check is not independent for CHIRPS. It is reasonably independent for IMERG's level, though IMERG's monthly gauge calibration may also use them (not verified).

### Cited Findings
- GSOD PRCP is "total precipitation ... reported during the day", missing = 99.99. The flags:
  - A–C: partial 6-hour sums. D: four 6-hour reports. E: one 12-hour report. F: two 12-hour reports. G: one 24-hour report.
  - H: reported 0 but precipitation was observed, "incomplete data for the day".
  - I: no precipitation data reported; "it's still possible that precipitation occurred".
  - Source: [GSOD readme](https://www.ncei.noaa.gov/data/global-summary-of-the-day/doc/readme.txt)
- Station records (`isd-history.csv`): Cần Thơ 489125-99999 (10.083 N, 105.717 E), 1965-12-13 to 2025-08-24; Cà Mau 489140-99999 (9.183, 105.150), 1957 to 2025-08-24; Rạch Giá 489070-99999 (10.000, 105.083), 1956 to 2025-08-24. There are no 2026 GSOD files for any of the three (HTTP 404). — [isd-history.csv](https://www.ncei.noaa.gov/pub/data/noaa/isd-history.csv); [GSOD access](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/)
- Flag counts, 2000–2025 files:
  - Cần Thơ (files exist only 2014–2025): 2,315 days flagged I (zero, no report) and 1,731 days missing; no other flags.
  - Cà Mau: mostly G (8,540 days), then E/F/D.
  - Rạch Giá: 3,785 days I, 1,044 missing and 2,860 G.
  - Source: [GSOD files](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/2018/48914099999.csv), my tally.
- Qualifying months, Dec 2000 – Jul 2025:
  - Strict rule (valid day = flag D, F or G): Cà Mau 255, Rạch Giá 44 (mostly 2016–2024), Cần Thơ 0.
  - Lenient rule (any non-missing, non-I day): Cà Mau 272, Rạch Giá 55.
  - Check on the aggregation: my Cà Mau June 2018 sum, 237.7 mm, equals CHC's GSOD value for that station-month.
  - Sources: `chirps_vs_imerg.gsod_months`; [CHC station data 2018.06](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/diagnostics/monthly_station_data/2018.06.csv)

Station results: CHIRPS at the station pixel, IMERG at the nearest app point, which falls in the same 0.1° IMERG cell as the station. Bias is (product sum − gauge sum) / gauge sum over the qualifying months.

| station | rule | months | Dec–Apr months | gauge mean mm/mo | r IMERG | r v2 | r v3 | bias IMERG | bias v2 | bias v3 | Dec–Apr bias IMERG | Dec–Apr bias v2 | Dec–Apr bias v3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cần Thơ | strict / lenient | 0 | – | – | – | – | – | – | – | – | – | – | – |
| Cà Mau | strict | 255 | 103 | 194 | 0.92 | 0.91 | 0.95 | +23% | +7% | +13% | +56% | +20% | +20% |
| Cà Mau | lenient | 272 | 109 | 194 | 0.92 | 0.91 | 0.95 | +23% | +7% | +13% | +52% | +21% | +19% |
| Rạch Giá | strict | 44 | 11 | 284 | 0.90 | 0.85 | 0.91 | +8% | -19% | +4% | +10% | +12% | -4% |
| Rạch Giá | lenient | 55 | 14 | 261 | 0.90 | 0.83 | 0.91 | +9% | -17% | +5% | +7% | +11% | -9% |

Cà Mau calendar years with all 12 months qualifying (strict), mm:

| year | gauge | IMERG | CHIRPS v2 | CHIRPS v3 |
|---|---|---|---|---|
| 2003 | 2369 | 2581 | 2660 | 2737 |
| 2004 | 1759 | 2372 | 2125 | 2136 |
| 2005 | 2385 | 2640 | 2334 | 2643 |
| 2007 | 3118 | 2894 | 2536 | 2956 |
| 2010 | 1982 | 2445 | 2302 | 2441 |
| 2012 | 2272 | 2914 | 2310 | 2433 |
| 2015 | 2202 | 2610 | 2294 | 2259 |
| 2018 | 1931 | 3000 | 2346 | 2549 |
| 2019 | 2192 | 3460 | 2252 | 2516 |
| 2020 | 2404 | 2869 | 2538 | 2712 |
| 2023 | 2504 | 2946 | 2553 | 2784 |

Cà Mau dry-season calendar-month means over qualifying months, mm (gauge / IMERG / v2 / v3): Dec 64 / 82 / 87 / 71; Jan 27 / 61 / 20 / 31; Feb 9 / 38 / 5 / 8; Mar 31 / 62 / 25 / 43; Apr 85 / 100 / 118 / 104.

- CHIRPS v3 ingests these stations. The CHC monthly station tables list, inside the Delta box (8.4–11 N, 104.4–106.9 E):
  - Jun 1995: GSOD Cà Mau, Côn Sơn and Tân Sơn Hòa (3 stations).
  - Jun 2005 and Jun 2018: Cà Mau (GSOD, GTS, and MCDW in 2018), Rạch Giá (GTS, GSOD), Côn Sơn and Tân Sơn Nhất (7 records).
  - Oct 2026: Cà Mau (GTS, MCDW), Rạch Giá (GTS) and Côn Sơn (4).
  - There is never a station in Sóc Trăng or Cần Thơ.
  - Sources: [1995.06](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/diagnostics/monthly_station_data/1995.06.csv); [2005.06](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/diagnostics/monthly_station_data/2005.06.csv); [2018.06](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/diagnostics/monthly_station_data/2018.06.csv); [2026.10](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/diagnostics/monthly_station_data/2026.10.csv)
- CHC's plot of Vietnam stations in monthly CHIRPS v3 shows about 150–170 stations from 1981 to early 2007, then a sudden drop to about 25, rising to about 30 by 2015–2024 and falling to about 15–25 in 2025–26. — [Vietnam station count plot](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/diagnostics/stations-perMonth-byCountry/Vietnam.095.station.count.CHIRPS-v3.0.png)

### Inferences
- IMERG Final runs clearly wet at Cà Mau: +23% for the year and +52–56% in Dec–Apr, where Jan–Mar IMERG is two to four times the gauge. 2018–2019 are especially wet: 3000 and 3460 mm against 1931 and 2192 at the gauge. That matches the 2018 season, when IMERG was 1.45× CHIRPS v3 over all 19 points.
- CHIRPS sits closer to the gauge, but partly by construction: it blends this very gauge. v3's extra +6% over v2 at Cà Mau matches its undercatch correction. A raw gauge without that correction is expected to read low, so "+13% vs GSOD" is not necessarily a v3 error.
- GSOD daily totals from SYNOP may themselves be incomplete (the readme warns about H and I days). The strict rule keeps only whole-day reports, and both rules give the same biases at Cà Mau.
- The station evidence therefore favours CHIRPS (v2 or v3) over IMERG on level, especially in the dry season. It does not separate v2 from v3, and Rạch Giá (44 months, r 0.85–0.91) is too thin to decide.

### Gaps
- Cần Thơ has no GSOD precipitation; Sóc Trăng and Bạc Liêu are not in GSOD. There is no independent gauge in the pins' province.
- I did not verify whether IMERG V07 Final's GPCC calibration uses Cà Mau and Rạch Giá. If it does, IMERG's wet bias at Cà Mau is even harder to explain.
- GHCN-Daily Cà Mau (VMM00048914, named in `rain.md`) was not compared. It probably shares the same SYNOP source.

## Verdict: which product for (a) long-term averages, (b) the latest 12 months, and should averages start Dec 1981?

### Takeaway
Switch to **CHIRPS v3.0 monthly** for both the averages and the latest 12 months, but **keep the averages on the app's period (Dec 2000 – Nov 2024, `build.PERIOD`) for now**, not Dec 1981. Use **v2.0 only as an emergency fallback**, never spliced into the same series. The change lowers the pins' typical Dec–Apr rain from 172 mm to about 155 mm and the year from 2071 mm to 2007 mm. Tell users the source changed.

### Cited Findings
- v3 matches IMERG's timing as well as v2 does (r 0.930 vs 0.923) and is closer to IMERG's level (−6% vs −11% for the year). At Cà Mau it has the best monthly correlation with the gauge (0.95). — tables above
- The latest months exist only in CHIRPS. Nov 2025 – Oct 2026, mean of the 5 pins, mm:

| series | 2025-11 | 2025-12 | 2026-01 | 2026-02 | 2026-03 | 2026-04 | 2026-05 | 2026-06 | 2026-07 | 2026-08 | 2026-09 | 2026-10 | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHIRPS v3 | 278 | 35 | 0 | 13 | 0 | 1 | 196 | 124 | 223 | 216 | 347 | 258 | 1691 |
| CHIRPS v2 | 248 | 28 | 4 | 6 | 5 | 6 | 164 | 100 | 148 | 182 | 333 | 211 | 1433 |

  IMERG V07 Final stops at Sep 2025. — [CHIRPS v3 COGs](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/cogs/); [GPM V08 update, Aug 2026](https://gpm.nasa.gov/data/news/update-imerg-v08-transition-schedule-aug-2026)
- Final CHIRPS months are posted around the third week of the next month: Oct 2026 was posted 13 Nov. — [README](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/README-CHIRPSv3.0.txt)
- On a 1981 start, from the CHIRPS v3 typical-year tables:
  - Dec 1981 – Nov 2000 is drier in Dec–Mar than 2000–2024: 19-point Dec–Apr 133 vs 163 mm; pins Jan 7 vs 17 mm, Mar 11 vs 20 mm.
  - The annual totals are almost the same (1879 vs 1895).
  - The v3/v2 ratio shifts between the two periods (1.13 vs 1.06).
  - The Vietnam station count in v3 is about 6× higher before 2007 than after.
  - Sources: [station count plot](https://data.chc.ucsb.edu/products/CHIRPS/v3.0/diagnostics/stations-perMonth-byCountry/Vietnam.095.station.count.CHIRPS-v3.0.png); tables above
- A 1981 start would raise the El Niño seasons in `oni.txt` from 9 (2000–2023) to 15: adding 1982, 1986, 1987, 1991, 1994 and 1997. — `data/raw/oni.txt` (NOAA CPC ONI)

### Inferences
- **(a) Long-term averages: CHIRPS v3, Dec 2000 – Nov 2024**, the same seasons as the NASA POWER weather the app pairs with rain in the water balance and El Niño split. Moving only rain to 1981 would mix periods in one chart. The earlier network is also not consistent with the later one (the 2007 station drop and the shifting v3/v2 ratio), and the 1981–2000 dry seasons differ enough (−18% Dec–Apr) to shift the typical year. If the whole app (POWER too) later moves to 1981, CHIRPS v3 can support it and adds six El Niño seasons, including 1982–83 and 1997–98. That is a separate decision.
- **(b) Latest 12 months: CHIRPS v3 final monthly**, refreshed after about the 15th of each month. Same product as the averages, so the "latest vs typical" comparison has no product jump. Do not fill the newest month from preliminary files without a "preliminary" label.
- **v2** reads about 6% drier than v3 here, 9% in Dec–Apr, and up to 48% in single dry seasons (2024–25). Keep it only as a whole-series fallback if v3 stops, never month by month.
- **Do not splice IMERG and CHIRPS.** IMERG runs 6–11% wetter on average and up to 45% wetter in single seasons (2018).
- Water-need effect at the pins: Dec–Apr rain about −16 mm (−10%), and Jul/Sep lower, Aug higher. Expect slightly higher irrigation need figures after the switch.
- Pins on 0.05° cell edges (Trần Đề, Mỹ Xuyên, Long Phú, Ngã Năm) need one fixed pixel rule in the fetcher.

### Gaps
- No independent Sóc Trăng gauge, so absolute accuracy at the pins is unproven for every product.
- Not tested: CHIRPS against IMERG V08 Final, which was not yet released as of the Aug 2026 notice.
- Not tested: whether the pipeline's water-need outputs (`sites.json`) change any card score. That needs a rebuild with CHIRPS in place of `gpm.json`.
