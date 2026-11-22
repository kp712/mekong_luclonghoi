# Profit research: shrimp, rice on shrimp land, mung bean

Units: M₫/ha (million ₫ per hectare) after costs. 1 công = 1,000 m². Full quotes, URLs and any conversions are in data/profit-shrimp-mungbean.json, in the shape of `pipeline/profits.json` `figures`. Searched Nov 2026. None of these duplicate the figures already in profits.json.

## shrimp (shrimp phase of a rice–shrimp field, per year)
| M₫/ha | Unit | Place | Year | Kind | Fallback | Source |
|---|---|---|---|---|---|---|
| 45.9 | year | Sóc Trăng, 25 households in cooperatives (species not named) | 2021 | university | false | Trà Vinh Univ. journal no. 45 (2021, online Aug 2022) |
| 31.9 | year | Bạc Liêu (Hồng Dân, Phước Long, Giá Rai), 100 households, dry-season tôm sú | 2023 | survey | false | IRRI Bạc Liêu cost–benefit report (Mar 2026) |
| 39.35 | year | Thạnh Phú, Bến Tre, 61 households, tôm càng xanh in rice fields | 2021 | university | false | Trà Vinh Univ. journal (5 Dec 2023) |
| 35 | year | Ba Đình cooperative, Vĩnh Lộc, Hồng Dân, Bạc Liêu (30–40; tôm càng xanh + tôm sú/thẻ) | 2023 | cooperative | true | VietNamNet (17 Nov 2023) |
| 32.1 | year | Hòa Tú 1 & Ngọc Đông, Mỹ Xuyên, Sóc Trăng, tôm sú | 2024 | university | true | Tạp chí NN&MT (15 Nov 2024); printed unit (per 1,000 m²) is impossible for shrimp, read as per ha |
| 45 | year | Coastal former Sóc Trăng, farmers' estimate (40–50, "thu nhập") | 2025 | news | true | Nhân Dân (6 May 2026) |
| 60 | year | An Biên, Kiên Giang, one farmer, tôm sú (50–70) | 2024 | farmer | true | Báo Sóc Trăng (29 Oct 2024) |
| 40 | year | Vĩnh Bình, An Giang (ex-Kiên Giang), one farmer, all-male tôm càng xanh | 2026 | farmer | true | Nhân Dân (28 Oct 2026) |
| 60 | year | Phong Thạnh A, Giá Rai, Bạc Liêu, one farmer, two shrimp crops a year | 2023 | farmer | true | VnEconomy (13 Nov 2023) |

Qualifying median 39.35 (n = 3). With the existing 79 (Hòa Tú pilot) it is 42.625, the app's median.

## rice_rs (rice crop on rice–shrimp land, per crop)
| M₫/ha | Unit | Place | Year | Kind | Fallback | Source |
|---|---|---|---|---|---|---|
| 54.1 | crop | Sóc Trăng, 25 households in cooperatives | 2021 | university | false | Trà Vinh Univ. journal no. 45 |
| 61.1 | crop | Hòa Tú 1 & Ngọc Đông, Mỹ Xuyên, Sóc Trăng (6.11 per 1,000 m²; 9 t/ha, high; numbers do not reconcile) | 2024 | university | true | Tạp chí NN&MT (15 Nov 2024) |
| 32.4 | crop | Sóc Trăng, 255 interviews; the paper's "lúa 1 vụ" row, read as the rice–shrimp rice crop | 2023 | university | true | Can Tho Univ. journal vol. 61 (2025) |
| 37.5 | crop | Cà Mau province, 2020–2025 average (35–40) | 2025 | government | false | Ministry of Agriculture and Environment (30 Sep 2026) |
| 40 | crop | Hòa Nhờ B, Hòa Tú, Cần Thơ (ex-Mỹ Xuyên), one farmer | 2026 | farmer | true | Nhân Dân (6 May 2026) |
| 35.2 | crop | Cà Mau peninsula, ST24/ST25, an expert's calculation | 2025 | news | true | Nhân Dân (27 Aug 2025) |
| 63.5 | crop | Bạc Liêu, 100 households, wet-season rice plus freshwater prawn | 2023 | survey | true | IRRI Bạc Liêu report (Mar 2026); includes prawn |
| 60 | crop | An Biên, Kiên Giang, one farmer, ST25 rice plus prawn (50–70) | 2024 | farmer | true | Báo Sóc Trăng (29 Oct 2024) |

Qualifying median 45.8 (n = 2: 54.1, 37.5). With the existing 27.5 (Cần Thơ 2025) it is 37.5, the app's median.

Nov 2026 controller rulings: figures with no stated year (Ba Đình 35, Cần Thơ Univ. 32.4) and the NN&MT rice 61.1 (numbers do not reconcile) are fallback; the app's medians are in SOURCES.md.

## mungbean (per crop)
| M₫/ha | Unit | Place | Year | Kind | Fallback | Source |
|---|---|---|---|---|---|---|
| 3 | crop | Khánh Bình Tây, Trần Văn Thời, Cà Mau, dry-season crop on rice land, drought year (1.5 − 1.2 M₫/công, computed) | 2020 | farmer | true | Báo Cà Mau (3 Apr 2020) |
| 35 | crop | Khánh Bình Tây & Khánh Hưng, Trần Văn Thời, Cà Mau, usual years before 2020 (3–4 M₫/công) | 2019 | news | true | Báo Cà Mau (3 Apr 2020); outside the 2020–2026 window |

No qualifying mung bean figure was found.

## Dead ends
- nongnghiepmoitruong.vn (Báo Nông nghiệp & Môi trường) is behind a Cloudflare check: every article, including Trà Vinh rice–shrimp (70–80 M₫/ha/yr whole model, May 2024) and "Sóc Trăng phát triển nuôi tôm càng xanh xen canh", could not be read.
- vietnamnews.vn and mdpi.com return 403; news.laodong.vn returns an empty page.
- The PDFs of both Trà Vinh University papers return 404; only the abstracts on the article pages were read.
- Whole-model figures (rice plus shrimp, not split) were left out: Bạc Liêu People's Committee 40–60 M₫/ha/yr and the coastal-provinces average 90 M₫/ha with aquaculture 76.9% of income (Đại Đoàn Kết, 11 Feb 2022); Ba Đình cooperative 80–100 M₫/ha (Nhân Dân, 8 Oct 2025).
- Cà Mau tôm càng xanh grown with the wet-season rice, 12–16 M₫/ha (Nhân Dân, 28 Jan 2026, no named source) was left out: it is an add-on to the rice crop, not the shrimp season.
- Lương Tâm, Cần Thơ (ex-Hậu Giang): one family's shrimp profit 50–60 M₫ with no area (Nhân Dân, 5 Aug 2026); cannot be converted.
- Mung bean: searches in Vietnamese and English (khuyến nông, Báo Sóc Trăng, Báo Cần Thơ, Báo Cà Mau, Can Tho and Trà Vinh university journals, CGIAR) found only pre-2020 articles (Báo Cần Thơ 2010, 2014, 2017), central-Vietnam figures (Quảng Trị, Ninh Thuận), and Hậu Giang mung bean papers that report carbon, not money. Báo Sóc Trăng (Apr 2025) names mung bean among crops grown on rice land in winter–spring 2024–25 but gives no profit.
- Brackish rice–prawn density trial (Can Tho Univ. journal 2021) skipped: a field experiment, not farm results.

## Confidence
- shrimp: medium. Three qualifying figures from three provinces cluster at 32–46 M₫/ha; only one (TVU) is Sóc Trăng, and it covers cooperative members only, who earned more than twice what individual farmers did. One of the three is tôm càng xanh, not tôm sú.
- rice_rs: medium-low. Only two new figures qualify (54.1, 37.5). The 54.1 comes from cooperative members; 61.1 (units partly wrong, numbers do not reconcile) and 32.4 (rests on reading "lúa 1 vụ" as the rice–shrimp rice crop, no stated year) are fallback.
- mungbean: low. Two fallback figures from one Cà Mau article, one from a drought year and one from before 2020; the công size is assumed.
