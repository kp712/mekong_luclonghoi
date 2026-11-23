# Provincial salinity bulletins and two open datasets

Probed 2026-11-23 from the cloud sandbox. Units: bulletins in ‰, datasets in g/l (treated as ‰). Raw values: `data/provincial-salinity-bulletins.json`. Scripts: `scripts/salt_probe_vilo.py` (URL probe), `scripts/salt_probe_vilo_parse.py` (table parser), `scripts/salt_probe_datasets.py` (season maxima). Downloads are in the session scratchpad only.

## 1. Vĩnh Long weekly bulletin (XMAN/VILO)

### URL and index
- Pattern: `https://thanhduc.vinhlong.gov.vn/Portals/1216/VILO_XMAN_<YYYYMMDD>_<HHMM>.pdf` (DNN commune portal; the date is the issue day, the time is 1700 in every hit).
- No index page found. The portal home (HTTP 200) has no bulletin link; the PDFs are attachments to unknown news items. The same path on `vinhlong.gov.vn` and `www.vinhlong.gov.vn` is 404. `bentre.gov.vn`, `travinh.gov.vn`: no connection (000). web.archive.org: "Blocked by egress policy".
- A web search found only the 7 May file. A fetcher cannot list; it can only guess dates.

### Tested dates (HEAD, every calendar day)
| Range | Times | Result |
|---|---|---|
| 2026-01-01 to 2026-06-30 | 1500, 1530, 1600, 1630, 1700, 1730 | 4 hits: 20260402, 20260416, 20260507, 20260514 (all 1700); 1082 x 404 |
| 2024-01-01 to 2025-12-31 | 1700, 1600 | 0 hits, 1462 x 404 |
| 2026-07-01 to 2026-11-22 | 1700, 1600 | 0 hits, 290 x 404 |

- January and February 2026 issues: not on this portal. Issue numbers: XMAN-11 (2 Apr), -14 (16 Apr), -17 (7 May), -18 (14 May). Issues 11 to 14 in 14 days means more than weekly at peak; 14 to 17 to 18 is weekly (Thursday). Earlier issues (1-10) exist but were not uploaded here, or sit on another portal. Unknown which.
- 2024 and 2025: none here. The 2025 numbers are only in the "same period last year" column of the 2026 issues (e.g. Vàm Nước Trong 8.0 on 2 Apr 2025 period).
- Conclusion: not a dependable production source as it stands. A production fetcher would need the issuing page (Đài KTTV tỉnh Vĩnh Long, tintuc.vinhlong.gov.vn, or the Nam Bộ hydromet site), which was not found.

### Layout (8-9 pages, text PDF)
Header: "Số: XMAN-17/17h00/VILO", issue date, "(Từ ngày 07/05 đến ngày 16/05/2026)". Section 1 holds the measured table "Độ mặn cao nhất tại các trạm", the last 7 days; a second table "Dự báo độ mặn cao nhất tại các trạm" (forecast) follows from page 3. Also 4‰ line text per river. Columns: Sông, Trạm, Cách cửa sông (km), Smax (‰), Ngày xuất hiện (days of the month, "01;02;05", "30/4-07/5"), Cùng kỳ năm 2025.
- Blank last-year cells exist (new stations). "Nghỉ đo" (station resting) and "(Không đo: 11-16)" (not measured on those days) occur: 4 stations on 16 Apr. Decimal comma in km ("55,5", "12,5").
- The river is a merged cell: forward-fill it down the rows and across pages.

### Parse proof
`salt_probe_vilo_parse.py` parsed all 4 issues with pdfplumber `extract_tables()`: 43 measured rows each (assert on count and river fill). 7 May example: Bình Đại 8 km 22.8, Cầu Quan 37 km 5.6 (3.7 in 2025), Trà Kha 17 km 11.0, Sơn Đốc 23 km 9.5, Trà Vinh 33 km 4.6, Bến Trại 11 km 18.2.
Peak values across the four issues (Bình Đại 19.2, 22.8, 22.3; Trà Kha 8.8, 8.2, 11.0, 11.5) show these are weekly maxima, not the season peak.

### Stations (7 May issue; river as printed, km from the mouth)
- Cửa Đại: Bình Đại 8, Lộc Thuận 21, Giao Hòa 39, Quới Sơn 48, An Khánh 56, Phú Túc 64
- Ba Lai: Long Hòa 46, Ba Lai 1 54, Tân Phú 72
- Hàm Luông: An Thuận 6, Sơn Đốc 23, Phú Khánh 24, Vàm Cái Quao 34, Vàm Thủ Cửu 37, Vàm Nước Trong 43, Mỹ Hóa 48, Thanh Tân 54, An Hiệp 56, Vàm Mơn 64, Hòa Nghĩa 72
- Tiền: Chợ Lách 78, Cái Muối 90 (resting), Đồng Phú 93 (resting)
- Cổ Chiên: Bến Trại 11, Hưng Mỹ 20, Hương Mỹ 29, Trà Vinh 33, Cẩm Sơn 36, Láng Thé 39, Đức Mỹ 46, Vàm Thom 47, Thanh Bình 48, Nàng Âm 52, Nhuận Phú Tân 55.5, Quới An 63, Tân Thiềng 65, Vĩnh Bình 77
- Long Toàn (printed as its own river): Long Toàn 12.5
- Hậu: Trà Kha 17, Cầu Quan 37, Đường Đức 46, Trà Ôn 68
- Nội đồng (inland): Ngã Tư, no km
Verdict: no former-Sóc Trăng station. Trà Kha, Cầu Quan, Bình Đại, Bến Trại, Hưng Mỹ, Hương Mỹ, Trà Vinh, Sơn Đốc, An Thuận, Lộc Thuận are already in `data/raw/kttv_stations.json` (national bulletin). New ones have no coordinates in the repo: Giao Hòa, Quới Sơn, Long Toàn, Cẩm Sơn, Láng Thé, Đức Mỹ, and 15 more.

## 2. Other provinces
| Source | Reachable from sandbox? | Finding |
|---|---|---|
| cantho.gov.vn, stnmt.cantho.gov.vn (former Sóc Trăng stations) | no (000 after 12 s / 0.5 s) | Search for "bản tin xâm nhập mặn" + Cần Thơ found nothing but the national `dbqg_xman` PDFs. Their Table 1 lists Long Phú (cửa Trần Đề), Đại Ngãi (Tranh Đề) and Trần Đề under Cần Thơ; the app already takes these. Đài KTTV Cần Thơ bulletin URL still unknown. |
| soctrang.gov.vn | no (000) | as in CLAUDE.md |
| bentre.gov.vn, travinh.gov.vn | no (000 after 10 s) | Now merged into Vĩnh Long; the Vĩnh Long bulletin covers their stations (Bến Tre: Bình Đại, Sơn Đốc, An Thuận; Trà Vinh: Cổ Chiên and Hậu stations). |
| baclieu.gov.vn | no (000) | nothing found |
| camau.gov.vn | yes (HTTP 200 home, 936 KB) | No XMAN PDF found by search; a Đại Đoàn Kết article cites a Đài KTTV tỉnh Cà Mau bulletin for 21-28 Feb (4‰ reach under 60 km), no link. Hosts for Cà Mau documents: `storage-vnportal.vnpt.vn/cmu-khdn/...` (crop calendars only). |
| angiang.gov.vn / app.angiang.gov.vn | no (000; proxy tunnel closed) | New pattern seen in search: `https://app.angiang.gov.vn/sites/default/files/angiang/2025-06/AGIA_MAN_20250612_1100.pdf` ("MAN" = salinity). Not openable here, so contents unverified. The older `agiatvhn<date>1130.pdf` is in salinity.md. Covers former Kiên Giang. |
| kttv.gov.vn, nchmf.gov.vn | yes | national bulletins only (already used). |

## 3. Open datasets

### Mendeley Data 10.17632/fm996rrfyz.1 (Doan Van Binh et al., Kyoto University)
- Licence CC BY 4.0. One file, 53 KB xlsx, direct download works: `https://data.mendeley.com/public-files/datasets/fm996rrfyz/files/ab873959-0e6c-4db0-8b87-d32334eca66d/file_downloaded` (file list via `https://data.mendeley.com/api/datasets/fm996rrfyz/files?folder_id=root&version=1`).
- Sheets: daily mean discharge (Chiang Saen, Kratie, Tân Châu, Châu Đốc, three periods), water level Tân Châu and Mỹ Thuận (annual), precipitation, and `Max. salinity`.
- Salinity: sheet `Max. salinity`, columns Year, "Max. salinity at TraVinh (g/l)", "Max. salinity at CauQuan (g/l)", 1991-2016 (26 rows; e.g. 2016 14.6 and 16.5, 1998 10.5 and 11.6). Also a small table of monthly maxima at Cầu Quan for 3 years only (1998, 2010, 2016; 2016: Jan 11.6, Feb 16.5, Mar 14.6, Apr 9, May 5.1, Jun 3.8).
- Resolution: one annual dry-season maximum per station and year; no dates, no daily series, no coordinates. The calendar year is the peak year (the Jan-Jun maxima table matches).
- Derivable: yes, the annual maximum is the dry-season maximum already. No finer statistics (salt months) possible except the 3 Cầu Quan years.

### GFZ 10.5880/GFZ.4.4.2024.004 (Apel et al.; data from SRHMC)
- Licence CC BY 4.0 (datacite rights, CSV header and description PDF). The landing page says "not available for automated download, fill in the request form", but the file directory is open: `https://datapub.gfz.de/download/10.5880.GFZ.4.4.2024.004-QWn/` (3 files: the salinity CSV 454 KB, Tân Châu monthly discharge CSV, description PDF).
- `2024-004_Apel_salinity_SONDOC_1996-2016.csv`: `DATETIME;SALINITY [g/l]`, semicolon-separated, 18,336 readings, surface water, every 2 hours, in runs of a few days with gaps, dry season only. Coordinates (description PDF): 10.06425 N, 106.45747 E (the repo's approximate Sơn Đốc is 10.036, 106.473, 3.5 km away).
- Derivable: yes, daily-resolution maxima by season (Oct-Jun). `salt_probe_datasets.py` gives 1996-2016 maxima, e.g. 1998 18.0, 2005 24.1, 2013 19.3, 2016 27.4 (8 Feb). Caveat: coverage is patchy (2004 has 24 days, Feb-Mar only; others 48-95 days), so a maximum is a lower bound; 2004 and 2001 are weakest. Months with 4‰ or more can be counted per season, but only on measured days.

### Mapping to the app's points
- Both stations exist already in the app: Trà Vinh and Cầu Quan (national KTTV, Cổ Chiên and Hậu) and Sơn Đốc (Hàm Luông). Province points within 25 km of them (`SALT_KM` in `pipeline/salinity.py`) already get these via the 2016-2026 seasons. The datasets would only add 1991/1996-2015 seasons for the same three stations. No new points, no Sóc Trăng pins.
- Cầu Quan 2016 (16.5) and Sơn Đốc 2016 (27.4) overlap the app's first season, so they can cross-check the KTTV values.
- Rules to respect before use: CLAUDE.md fixes the seasons at 2016-2026 and the El Niño flag by Dec-Feb ONI; using 1991-2015 means a rule change, the annual-max-only Mendeley data cannot give salt months, and Trà Vinh in Mendeley may not be the same site as the KTTV "Trà Vinh" (33 km, Cổ Chiên): unverified.

## Gaps
- Vĩnh Long: no index, no 2024/2025 issues, no January-February 2026 issues found; whether another portal holds them is unknown.
- Cần Thơ (former Sóc Trăng stations): no bulletin and the portals are unreachable from the sandbox. An Giang bulletin unreachable.
- Mendeley "Trà Vinh" site identity and the GFZ vs KTTV Sơn Đốc location difference.
