# Dù Tho (Tham Đôn) station, Mỹ Thanh river

Question: can Dù Tho replace or check Khánh Hòa for Vĩnh Châu? Answer (Nov 2026): no. Full quotes and URLs: `data/du-tho-1.json`, `data/du-tho-2.json` (has `daily_2025`, `weekly_forecasts_2025`, `thanh_thoi_thuan`, `khanh_hoa_same_day`).

## Station
- Dù Tho is an ấp of xã Tham Đôn, Mỹ Xuyên (now xã Ngọc Tố, Cần Thơ). 2016 and 2018 bulletins call it "Sông Dù Tho tại Tham Đôn", same layout and station order, so the record likely starts by 2016 under the name Tham Đôn.
- No published gauge coordinates. The Tham Đôn commune centre (9°31′13″N 105°56′09″E, Wikipedia snippet) is not the gauge.
- Thạnh Thới Thuận (north bank, ~25 km from the mouth) is probably Khánh Hòa's predecessor, not Dù Tho's: Đài KTTV's Jan 2025 outlook lists "Thạnh Thới Thuận 20.6–22.6‰" where its Mar/Apr 2025 outlooks list "Khánh Hòa 23.2‰". Measured: 11.4‰ mid-Dec 2019, 15.9‰ early Feb 2020.

## Best measured value per season
| Season | Value | Note |
|---|---|---|
| 2016–2017, 2019–2023 | none found | a 2023 record exists (2024 articles compare with it) but was never published online |
| 2018 | 3.4‰, 28 Feb | one day, not a peak (tepbac 02/03/2018) |
| 2024 | 8.2‰, before 27 Mar | not the peak (VietnamPlus) |
| 2025 | **15.8‰, 9 Mar** | season peak; 96 of 118 days 3 Feb–31 May read from Báo Sóc Trăng daily "Thông tin nông nghiệp ngày …" bulletins; next highest 14.0 (3 Apr), 13.9 (2 Apr) |
| 2026 | none | Báo Cần Thơ / Đài KTTV Cần Thơ report only Khánh Hòa on the Mỹ Thanh |

No measured same-day pair with Khánh Hòa: Chi cục Thủy lợi bulletins carry Dù Tho, Đài KTTV bulletins carry Khánh Hòa. Forecast pairs only: 16/03/2025 Khánh Hòa 23.2 vs Dù Tho 13.1; 25/04/2025 Khánh Hòa 23.2 vs Dù Tho/Thạnh Phú 8.2–13.1.

## Dead ends
- sotnmt.soctrang.gov.vn and soctrang.gov.vn: 502 from outside Vietnam (Nov 2026). sonnmt.soctrang.gov.vn: no DNS record. These held the monthly KTTV bulletins (e.g. "Thông báo KTTV tháng 03/2020", Thạnh Thới Thuận 24.9‰, unread).
- web.archive.org: connection reset through the session proxy; the page-fetch tool refuses it.
- nongnghiepmoitruong.vn: 403. thiennhien.net Dec 2019 page: 404.
- Parsing tip: Báo Sóc Trăng writes numbers with spaces ("5 , 7 g/l"); a naive regex drops those days.

## Next step if someone in Vietnam can help
Open the sotnmt monthly bulletins for Feb–May 2017–2023, or ask Đài KTTV Cần Thơ for the Tham Đôn/Dù Tho and Khánh Hòa daily maxima for the same days.
