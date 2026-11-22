# Measured river/canal salinity sources for the Mekong Delta (focus: former Sóc Trăng)

Researched 2026-11-22 from the cloud sandbox. "Access tested" means a curl or fetch from the sandbox on that date. Units: g/l is treated as ‰.

## 1. Why the 2026 February peak is missing from the KTTV national bulletins

### Takeaway
The national 10-day bulletin series for the 2025–2026 season starts on 10 March 2026 (number XMAN-01), so January–February 2026 national bulletins do not exist. The app's fetcher is not missing them. The 2026 season peak came in the 14–19 February spring tide, before the series started, so a February 2026 value must come from another issuer.

### Cited Findings
- The 10 March 2026 bulletin is numbered "Số: XMAN-01/15h00/DBQG", covers 11–20/3/2026, and its Table 1 is "Bảng độ mặn cao nhất từ ngày 01-10/3/2026". Access tested: HTTP 200 PDF — [kttv.gov.vn dbqg_xman_20260310](https://kttv.gov.vn/upload/thuyvan1/2026/3/10/dbqg_xman_20260310_1500.pdf)
- Probes of `kttv.gov.vn/upload/{thuyvan1,thuyvan2}/<folder date>/dbqg_xman_<file date>_1500.pdf` for 10/20/last-day file dates from Dec 2025 to Feb 2026 and Jan–Feb 2024, with the folder date shifted −1 to +3 days, all returned no hit (HEAD). The same HEAD probe returned 200 for known files. One known file sits in a folder 2 days after its file date: [thuyvan2/2026/3/22/dbqg_xman_20260320](https://kttv.gov.vn/upload/thuyvan2/2026/3/22/dbqg_xman_20260320_1500.pdf), next to [thuyvan2/2026/3/20/…](https://kttv.gov.vn/upload/thuyvan2/2026/3/20/dbqg_xman_20260320_1500.pdf).
- The 31 May 2026 bulletin is the last of the 2025–2026 dry season — [kttv.gov.vn dbqg_xman_20260531](https://kttv.gov.vn/upload/thuyvan1/2026/5/31/dbqg_xman_20260531_1500.pdf) (per search snippet)
- The Department of Water Resources Management's (DWRM) monthly report for the Cửu Long basin (No. 91/BC-TNN, 22 Apr 2026) says: "Xâm nhập mặn lớn nhất từ đầu mùa khô đến nay đã xuất hiện trong kỳ triều cường giữa tháng 2 (14-19/2) và kỳ triều cường giữa tháng 3 (17-20/3)". It puts the 4 g/l line at 40–50 km from the Cửu Long mouths, 2–4 km shorter than the long-term average and 5–13 km shorter than 2025. It gives intrusion distances, not station values. Access tested: HTTP 200, 2.4 MB PDF — [dwrm.mae.gov.vn 260422 - 91 BC TNN KBNN CUU LONG BC DINH KY T3.pdf](https://dwrm.mae.gov.vn/noidung/Lists/ListTinTuc/Attachments/16455/260422%20-%2091%20BC%20TNN%20KBNN%20CUU%20LONG%20BC%20DINH%20KY%20T3.pdf)
- Nhân Dân (24 Feb 2026, citing the irrigation works agency) reported that the largest intrusion of the season came in the 14–19 Feb spring tides — [nhandan.vn](https://nhandan.vn/dieu-hanh-linh-hoat-nguon-nuoc-chu-dong-kiem-soat-xam-nhap-man-o-dong-bang-song-cuu-long-post944498.html) (per search summary, not opened)

### Inferences
- For the 2026 season, the March–May national bulletins may understate the season maximum at stations whose peak came in mid-February. Treat 2026 national values as possibly not the peak.
- The fetcher assumes folder date = file date. One 2026 file also exists in a +2-day folder, and the same file exists at the matching path too, so nothing was lost this time.

### Gaps
- No February 2026 value found for any Sóc Trăng station (Trần Đề, Long Phú, Đại Ngãi, Thạnh Phú, Khánh Hòa).

## 2. Provincial hydro-met station bulletins (Đài KTTV khu vực Nam Bộ network): the best lead for denser, fresher data

### Takeaway
Provincial stations under the Southern Regional Hydro-Met Center issue their own weekly "Tin dự báo xâm nhập mặn" bulletins. These list measured Smax per station with km from the mouth, the day it occurred and the same period last year, and they run from early in the season. Vĩnh Long's is posted publicly. The Cần Thơ one (which now covers former Sóc Trăng) was not found online.

### Cited Findings
- Vĩnh Long bulletin "Số: XMAN-17/17h00/VILO", 7 May 2026, issued by Đài KTTV tỉnh Vĩnh Long under Đài KTTV Nam Bộ. Table "Độ mặn cao nhất tại các trạm" has columns river, station, km from mouth, Smax (‰), day, and "Cùng kỳ năm 2025". Example: Bình Đại 8 km, 22.8‰ (day 03); Giao Hòa 39 km, 2.8‰ (5.4 in 2025); Vàm Thủ Cửu 37 km, 4.0‰ (3.6). It covers about 20 stations on the Cửa Đại, Ba Lai, Hàm Luông and Cổ Chiên, many more than the national bulletin. Access tested: HTTP 200 PDF, text extractable — [thanhduc.vinhlong.gov.vn VILO_XMAN_20260507_1700.pdf](https://thanhduc.vinhlong.gov.vn/Portals/1216/VILO_XMAN_20260507_1700.pdf)
- Issue number 17 by 7 May, issued weekly, means the Vĩnh Long series began around January 2026 and covers the February peak — inferred from the issue number on the [same PDF](https://thanhduc.vinhlong.gov.vn/Portals/1216/VILO_XMAN_20260507_1700.pdf).
- A Vĩnh Long hydro-met report cites "số liệu quan trắc 5-12/2/2026" for the 4‰ line on the Cửa Đại, Hàm Luông, Cổ Chiên and Hậu — [en.sggp.org.vn](https://en.sggp.org.vn/salinity-intrusion-deepens-on-major-rivers-in-vinh-long-post124112.html) (per search snippet)
- An Giang (which now includes former Kiên Giang) posts daily hydrology bulletins named `agiatvhn<YYYYMMDD>1130.pdf`, including February 2026 issues, e.g. [agiatvhn202602261130.pdf](https://angiang.gov.vn/sites/default/files/2026/02/tap-tin-dinh-kem/agiatvhn202602261130.pdf), [agiatvhn202602111130.pdf](https://angiang.gov.vn/sites/default/files/2026/02/tap-tin-dinh-kem/agiatvhn202602111130.pdf), [agiatvhn202605191130.pdf](https://angiang.gov.vn/sites/default/files/2026/05/tap-tin-dinh-kem/agiatvhn202605191130.pdf). Access tested: curl got no connection (code 000); WebFetch got HTTP 503. Contents (salinity at Rạch Giá, An Ninh, Gò Quao?) not verified.
- Đài KTTV TP. Cần Thơ issued the March 2026 salinity forecasts for the Hậu river (4‰ line 45–55 km, to An Lạc Tây) and for Quản Lộ–Phụng Hiệp. The article names no website — [Nhân Dân, 18 Mar 2026](https://nhandan.vn/nong-nghiep-can-tho-chu-dong-ung-pho-xam-nhap-man-post949370.html)
- The old regional domain kttvnb.vn now redirects to a cPanel "suspendedpage.cgi". Access tested: http 200 to `kttvnb.vn/cgi-sys/suspendedpage.cgi`; https got no connection — [kttvnb.vn](http://kttvnb.vn/)

### Inferences
- A Cần Thơ bulletin like Vĩnh Long's (likely numbered `XMAN-nn/…/` with a city code) would give weekly measured Smax at Trần Đề, Long Phú, Đại Ngãi, Thạnh Phú, An Lạc Tây and perhaps Khánh Hòa/Dù Tho, with a "same period last year" column. That covers the February 2026 peak and a second season for free. It is probably posted on cantho.gov.vn ward/commune portals or the Sở NN&MT site, as Vĩnh Long's is on a commune portal.
- The An Giang daily bulletins are the most likely route to measured 2026 (and perhaps earlier) values for former Kiên Giang, if they reach a network outside the sandbox.

### Gaps
- No Cần Thơ city XMAN bulletin found by search. Its URL pattern is unknown.
- An Giang PDFs could not be opened from the sandbox, so it is unconfirmed whether they contain salinity.
- The current website of Đài KTTV khu vực Nam Bộ was not identified.

## 3. SIWRR / VAWR (Viện Khoa học Thủy lợi miền Nam) weekly bulletins

### Takeaway
SIWRR's weekly "dự báo nguồn nước" bulletins are reachable PDFs with text tables, but their salinity table is mostly forecast. Each has one "update" column per station and only 8 stations (Đại Ngãi is the only Sóc Trăng one), so they add little beyond KTTV.

### Cited Findings
- Archive path: `https://vawr.org.vn/Upload/DUBAO-CANHBAO/ĐBSCL/NGUỒN NƯỚC/<file>.pdf`. File names vary, e.g. `bantintuan18-dubaonguonnuoc-31_03_2022-v1.pdf`, `vkhtlmn_bantintuan15-dubaonguonnuoc_10032022.pdf`, `bantintuan-dubaonguonnuoc-30_3_2023.pdf`, `bantintuan-dubaonguonnuoc-22_6_2023.pdf` — [vawr.org.vn 30_3_2023](https://vawr.org.vn/Upload/DUBAO-CANHBAO/%C4%90BSCL/NGU%E1%BB%92N%20N%C6%AF%E1%BB%9AC/bantintuan-dubaonguonnuoc-30_3_2023.pdf), [vawr.org.vn 31_03_2022](https://vawr.org.vn/Upload/DUBAO-CANHBAO/ĐBSCL/NGUỒN NƯỚC/bantintuan18-dubaonguonnuoc-31_03_2022-v1.pdf). Access tested: HTTP 200, 392 KB PDF (30_3_2023), text extractable.
- The 30 Mar 2023 bulletin's "Phụ lục 3: Cập nhật và dự báo độ mặn lớn nhất một số trạm chính" lists 8 stations: Vàm Giồng, Trà Vinh, Mỹ Hóa, Cầu Quan, Gò Quao, Đại Ngãi, Xẻo Quao (7M), Kim Quy (11M), e.g. Đại Ngãi 1.8 (30/03 update) → 5.1 (06/04 forecast). Appendix 2 forecasts maximum water level at Mỹ Thanh, Đại Ngãi, Trà Vinh and others — [same PDF](https://vawr.org.vn/Upload/DUBAO-CANHBAO/%C4%90BSCL/NGU%E1%BB%92N%20N%C6%AF%E1%BB%9AC/bantintuan-dubaonguonnuoc-30_3_2023.pdf)
- SIWRR homepage reachable (HTTP 200) but is an id-based CMS (`?gid=…&id=…`) with no obvious bulletin list — [siwrr.org.vn](https://www.siwrr.org.vn/)
- Lao Động (Mar 2026) used a SIWRR-credited forecast for the delta mouths, so SIWRR still issued forecasts in 2026 — [laodong](https://news.laodong.vn/xa-hoi/cao-diem-xam-nhap-man-tai-dong-bang-song-cuu-long-vao-cuoi-thang-3-1662523.ldo) (per search summary)
- SIWRP (planning institute) 2015 dry-season observed salinity per station is on Zenodo but "restricted" (by request, SIWRP approval, non-commercial). The file list is empty in the API — [zenodo.org/records/4771261](https://zenodo.org/records/4771261) (API tested: `access_right: restricted`)

### Inferences
- Use SIWRR only as a cross-check for Đại Ngãi; it brings no new Sóc Trăng stations or measured series.

### Gaps
- 2024–2026 SIWRR bulletin file names were not found; the naming is irregular, so guessing is unreliable.

## 4. Department of Water Resources (Cục Quản lý tài nguyên nước, DWRM) and irrigation agencies (Cục Thủy lợi / thuyloivietnam.vn)

### Takeaway
The DWRM monthly "Kịch bản nguồn nước" reports for the Cửu Long basin are reachable, current (2026) PDFs. They give intrusion distance of the 4 g/l and 1 g/l lines per river and maps, not station readings. thuyloivietnam.vn is a thin landing page from the sandbox.

### Cited Findings
- Report No. 91/BC-TNN (March 2026 period): narrative intrusion lengths by river (e.g. Vĩnh Long 25–28/2: 4 g/l line ~40 km Cửa Đại, ~50 km Hàm Luông/Cổ Chiên/Hậu; An Giang 23/2–1/3: Cái Lớn 4 g/l 38–42 km to xã Gò Quao). Appendix 3 holds 4 g/l maps for Feb and Mar 2026 — [dwrm.mae.gov.vn report 91](https://dwrm.mae.gov.vn/noidung/Lists/ListTinTuc/Attachments/16455/260422%20-%2091%20BC%20TNN%20KBNN%20CUU%20LONG%20BC%20DINH%20KY%20T3.pdf)
- The governing scenario decision is QĐ 4815/QĐ-BNNMT of 14 Nov 2025 — [dwrm.mae.gov.vn QD 4815](https://dwrm.mae.gov.vn/noidung/Lists/ListTinTuc/Attachments/16030/251114%20-%20QD%204815%20BNNMT%20KBNN%20%C4%90BSCL%202025_signed.pdf); there is also a June monthly bulletin, [BAN TIN TNN_T6.pdf](https://dwrm.mae.gov.vn/noidung/Lists/ListTinTuc/Attachments/16573/BAN%20TIN%20TNN_T6.pdf) (not opened)
- `http://thuyloivietnam.vn/` redirects to `/Home/TLVN` (3.3 KB page); https and `dbcl.thuyloivietnam.vn` got no connection. Access tested 2026-11-22.
- The Institute of Marine Technology (Viện Kỹ thuật Biển) has monitored water quality and salinity in four southern irrigation systems (Dầu Tiếng, Quản Lộ–Phụng Hiệp, Tứ giác Long Xuyên, Cái Lớn–Cái Bé) since 2014. Bulletins go to a WebGIS system and the operating agencies; no URL is given — [Nhân Dân feature](https://nhandan.vn/special/tu-nhung-ban-tin-chat-luong-nuoc-den-la-chan-mem-bao-ve-bon-he-thong-thuy-loi-trong-diem-phia-nam/index.html)
- Monitoring rules: Circular 47/2024/TT-BTNMT (replaced 39/2016 from 22 Jan 2025) defines automatic salinity monitoring and the measured elements (salinity, depth, water temperature) — [monre.gov.vn TT 47/2024](https://monre.gov.vn/noidung/Lists/VBQPPL/Attachments/522/TT%20%2047-2024-tt-btnmt_Signed.pdf)

### Inferences
- The Quản Lộ–Phụng Hiệp sampling by the Institute of Marine Technology covers inland Sóc Trăng canals (near Ngã Năm) with 10+ years of data, but it is not published openly. It is a request-by-letter source.

### Gaps
- No open daily station data, API or WebGIS URL was found for the irrigation agencies.

## 5. Mekong River Commission (MRC) portal

### Takeaway
The MRC portal is a JavaScript app. Its API (api.mrcmekong.org) returns 401 without a key. MRC water-quality sites in Vietnam include Đại Ngãi (since 2004), but they are monthly grab samples with conductivity, not a salinity peak series, and their frequency was not confirmed.

### Cited Findings
- `https://portal.mrcmekong.org/time-series/water-quality` HTTP 200 (26 KB SPA shell); `https://api.mrcmekong.org/api/v1/ts/inventory/timeSeriesList` HTTP 401 `application/problem+json`. Access tested 2026-11-22.
- MRC water-quality metadata lists "H029812 Dai Ngai Bassac River Viet Nam 9,73222 106,07528 2004" — [archive.iwlearn.org WQmetadata.pdf](https://archive.iwlearn.org/mrcmekong.org/spatial/meta_html/WQmetadata.pdf)
- The MRC programme parameters include conductivity — [MRC water quality report card 2008](https://archive.iwlearn.net/mrcmekong.org/download/free_download/EP-Water-Quality-Report-Card-2008A.pdf) (per search summary)
- Tra Vinh and Cau Quan salinity 1990–2016 came from the Vietnamese National Hydro-meteorological Data Center and the MRC — [Mendeley Data fm996rrfyz](https://data.mendeley.com/datasets/fm996rrfyz/1)

### Gaps
- Sampling frequency, years after 2004 and whether Đại Ngãi conductivity is downloadable were not verified (API needs registration).

## 6. Published datasets in repositories

### Takeaway
Only two open measured-salinity datasets were found, both outside Sóc Trăng: Trà Vinh/Cầu Quan 1990–2016 (Mendeley, CC BY 4.0) and Sơn Đốc 1996–2016 (GFZ, CC BY 4.0). None covers the Sóc Trăng stations.

### Cited Findings
- Mendeley Data "Long-term discharges, water levels, salinity concentrations, and precipitation in the Mekong River basin", DOI 10.17632/fm996rrfyz.1, 26 Sep 2019, CC BY 4.0, by Doan Van Binh, Sameh Kantoush, Tetsuya Sumi and Nguyen Phuong Mai (Kyoto University). Salinity at Tra Vinh and Cau Quan, 1990–2016. Resolution and units not stated on the page, and the file list did not render — [data.mendeley.com](https://data.mendeley.com/datasets/fm996rrfyz/1)
- GFZ Data Services DOI 10.5880/GFZ.4.4.2024.004: surface water salinity at Sơn Đốc (Bến Tre, Hàm Luông), 1996–2016, discontinuous, dry season only, plus Tân Châu discharge, CC BY 4.0. Access tested: DOI resolves HTTP 200 — [dataservices.gfz.de](https://dataservices.gfz.de/10.5880/gfz.4.4.2024.004/surface-water-salinity-measurements-at-son) ; [b2find record](https://b2find.eudat.eu/dataset/bc48e088-0396-5b16-b53f-f5853d8975dc)
- Zenodo 4772967 holds modelled salinity projections (Eslami et al. 2021), not measurements — [zenodo.org/record/4772967](https://zenodo.org/record/4772967); Zenodo 15653696 is satellite soil salinity/NDWI 2000–2023, already rejected (soil maps) — [zenodo.org/records/15653696](https://zenodo.org/records/15653696)
- UK NERC (Living Deltas) "surface water quality data from rivers and ponds in the Mekong Delta & Red River Delta 2018–2024" — [data.gov.uk](https://www.data.gov.uk/dataset/surface-water-quality-data-from-rivers-and-ponds-in-the-mekong-delta-red-river-delta-2018-2024) (not opened; sites and whether it has EC or salinity unknown)
- The Sóc Trăng 8-station Smax study already used by the app is Nguyễn Trọng Khanh et al., Tạp chí Khoa học Biến đổi khí hậu no. 36 (2025-11-12), DOI 10.55659/2525-2496/36.121694. It reports that Smax mostly falls in Feb–Apr, with rising trends at 5 of 8 stations — [vjol.info.vn 121694](https://vjol.info.vn/TCKHBDKH/article/view/121694)

### Inferences
- The Mendeley and GFZ sets could extend El Niño/typical statistics for the Trà Vinh, Cầu Quan and Sơn Đốc province points back to the 1990s (more seasons than 2016–2026). They do not help the Sóc Trăng pins.

### Gaps
- No open dataset by Eslami, Minderhoud or Loc with multi-year measured series at Sóc Trăng stations was found. Their papers use the National Hydro-met Data Center data under licence.

## 7. Real-time sensor networks (IoT)

### Takeaway
The Rynan Mekong network (IoT stations and buoys, 2018/2021 to at least Nov 2025) is the densest near-continuous measured salinity source, but no open access route was found. A UNEP-DHI/CTCN project to build a salinity data-sharing platform for the Viet Nam National Mekong Committee is ongoing.

### Cited Findings
- Rynan Mekong platform (Rynan Technologies): IoT smart stations and buoys on main branches and secondary channels, near-continuous salinity and water level. Station records start 2018–2021 and run to November 2025 — [Kyoto DPRI paper C108](https://www.dpri.kyoto-u.ac.jp/hapyo/26/pdf/C108.pdf) (per search summary); MDPI Water 18(10):1240 (2026) uses the same data — [mdpi.com](https://www.mdpi.com/2073-4441/18/10/1240) (HTTP 403 to WebFetch)
- rynan.vn is reachable (HTTP 200); guessed data hosts `monitoring.rynangroup.com` and `mekongdeltasalinity.rynan.vn` got no connection. Access tested 2026-11-22.
- UNEP-DHI project "Strengthening salinity intrusion data sharing and forecasting… Mekong Delta of Viet Nam" says monitoring data "remains fragmented across multiple institutions"; status Ongoing — [unepdhi.org](https://unepdhi.org/strengthening-salinity-intrusion-data-sharing-and-forecasting-for-adaptation-to-climate-change-impacts-in-the-mekong-delta-of-viet-nam/)
- Real-time salinity detection and warning technology feature (June 2026) — [van.nongnghiepmoitruong.vn](https://van.nongnghiepmoitruong.vn/turning-wind-and-rain-into-action-8-real-time-salinity-detection-and-early-warning-technology-d758534.html) (not opened)

### Gaps
- Rynan's station list near Sóc Trăng, licence and API were not found. Contacting Rynan or the paper authors is the route.
- No Sóc Trăng/Cần Thơ provincial IoT portal was found (soctrang.gov.vn is unreachable from the sandbox anyway).

## 8. Model and satellite salinity products

### Takeaway
Nothing found beats the station data on accuracy. Model products (Eslami 2021 projections, the SIWRR and KTTV forecast maps) are forecasts or scenarios. Under the house rule they can only be labelled as model values, never shown as readings.

### Cited Findings
- KTTV bulletins carry a forecast salinity distribution map ("Hình 4. Bản đồ dự báo phân bố độ mặn cao nhất từ 11-20/3/2026") — [dbqg_xman_20260310](https://kttv.gov.vn/upload/thuyvan1/2026/3/10/dbqg_xman_20260310_1500.pdf)
- Eslami et al. modelled salinity projections — [zenodo.org/record/4772967](https://zenodo.org/record/4772967)

### Gaps
- No estuarine salinity reanalysis with published station validation for Sóc Trăng was found within this search budget.

## Summary ranking (accuracy → freshness → coverage → access)
1. Đài KTTV TP. Cần Thơ weekly XMAN bulletin (measured Smax and same period last year, likely from January, Sóc Trăng stations). Not found online; ask the station or search cantho.gov.vn portals from outside the sandbox. Proven format: [Vĩnh Long XMAN-17](https://thanhduc.vinhlong.gov.vn/Portals/1216/VILO_XMAN_20260507_1700.pdf).
2. An Giang daily `agiatvhn` bulletins for former Kiên Giang, February 2026 onward. Blocked from the sandbox; contents unverified.
3. Mendeley (Trà Vinh, Cầu Quan 1990–2016) and GFZ (Sơn Đốc 1996–2016), CC BY 4.0, open: longer series for 3 province points.
4. Restricted or by request: SIWRP 2015 (Zenodo), Rynan IoT, the Institute of Marine Technology's Quản Lộ–Phụng Hiệp data, MRC API.
5. Context only: DWRM monthly reports (intrusion km), SIWRR weekly bulletins (forecast-heavy).
