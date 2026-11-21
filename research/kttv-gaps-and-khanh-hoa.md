# Salinity research: Khánh Hòa and Kiên Giang gaps

Units: g/l treated as ‰. Full quotes, URLs and dates are in data/kttv-gaps-khanh-hoa.json.

## Khánh Hòa (Mỹ Thanh river, Vĩnh Châu), 2023-2026
| Season | Best value | Source | Confidence |
|---|---|---|---|
| 2023 | not found | - | - |
| 2024 | not found | - | - |
| 2025 | none measured. Forecast only: 23.2‰ (mid-Mar 2025, Báo Sóc Trăng 2025-03-16) | forecast, not a reading | none |
| 2026 | measured 14‰, about 15-16 Apr 2026 (Báo Cần Thơ 2026-04-16, Cần Thơ hydromet station). Forecasts: 15-17‰ (peak 19 Apr), 10.5-12.5‰ (28-30 Apr) | mid-rise reading, not a confirmed peak | low |

Thin evidence: KTTV national bulletins never list Khánh Hòa. Báo Sóc Trăng daily bulletins report Dù Tho on the Mỹ Thanh instead. soctrang.gov.vn and the Sóc Trăng environment portal were unreachable.

## Kiên Giang (KTTV 10-day bulletins, Table 1 Smax, measured)
| Station (river, km from mouth) | 2024 | 2025 | 2026 |
|---|---|---|---|
| Rạch Giá (Kiên, 7 km) | 5.8, 21-30 Apr | no data ("-" in all bulletins) | no data |
| Gò Quao (Cái Lớn, 35 km) | 13.6, 11-20 Apr | 7.1, 21-31 Mar | 15.5, 1-10 May |
| An Ninh (Cái Bé, 8 km) | 19.8, 11-20 Apr | 16.5, 21-31 Mar | 17.7, 11-20 Apr |

Confidence: high that the numbers are printed in the cited bulletins. Medium that they are the season maxima, because bulletins were found only for Mar-May 2024, Jan-May 2025 and Mar-May 2026. Jan-Feb 2024 and Jan-Feb 2026 were not found, and no bulletin in the same URL pattern exists for 2017-2023.

Earlier seasons (news, not peaks): 20 Feb 2019 Rạch Giá 1.1‰ (Tuổi Trẻ 2019-02-28); 10 Dec 2019 Xẻo Rô 13.8, An Ninh 14.5, Gò Quao 4.2 g/l (moitruong.net.vn 2019-12-19). Xẻo Rô, Tắc Cậu, Vĩnh Thuận, Giồng Riềng, Kiên Lương: no measured seasonal peak found. Seasons 2017-2018 and 2020-2023: not found for any Kiên Giang station.

Districts: Rạch Giá is Rạch Giá city. Gò Quao is Gò Quao district. An Ninh's district is not stated by KTTV. Xẻo Rô is in An Biên per a 2024 article.

## Outcome (Nov 2026)
- Khánh Hòa 2026: the 14‰ reading is stored as `lower_bound` in `data/raw/salinity_stations.json` (PR #17). It lowers Vĩnh Châu's typical value 15.8→15.4‰ but does not lift confidence.
- Kiên Giang (Rạch Giá point): still no estimate. Rạch Giá has only 2024; An Ninh is 17.6 km away but on a different river (Cái Bé), and the soil maps did not help (see soil-salinity-maps.md).
