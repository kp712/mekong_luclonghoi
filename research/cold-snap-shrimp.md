# Cold-snap rule for shrimp: is there a sourced, countable threshold?

Researched 2026-11-23. Question: can the shrimp pest score's "cold-snap night" (Tmin >= 4.2 C below the previous night, `pests.json` `shrimp.cold_drop_c`) be replaced by a sourced rule that daily gridded Tmin/Tmax/mean can count?

## Candidate rules
All numbers come from one secondary page: Global Seafood Alliance (Responsible Seafood Advocate), 19 April 2021, summarising Millard et al. 2020, J. Invertebr. Pathol. (doi 10.1016/j.jip.2020.107369). I read the GSA page. I could not open the Millard paper (403), so the primary studies behind each number are unknown, and the page names no country, system or species for them.

| Rule | Value | Measures | Species | Evidence |
|---|---|---|---|---|
| Daily air-temperature variation | > 10 C | air, one day (range) | not stated (WSD, shrimp) | "modelling of historic data"; primary study unknown. Weak. |
| Low ambient temperature | 24.5-27.2 C | ambient (air), level | not stated | same modelling sentence; unknown study. Weak, and the Delta is in this band much of the year. |
| Daily pond fluctuation | > 3-4 C | pond water, one day | not stated | "correlated", no causation. Weak. |
| Pond swing after a storm | 4.2-4.5 C | pond water | not stated | the origin of the app's 4.2 C. A reported swing, not a threshold. |

Lab note (same page): L. vannamei WSSV infection is most severe at 25-28 C; no cold-mortality threshold is given.

## Fit to daily gridded data
- Daily air range > 10 C: countable from Tmax-Tmin, but the Delta's diurnal range is mostly 6-9 C and gridded Tmin/Tmax are smoothed, so it is likely never or rarely met. I did not test it. The source is also unattributed.
- Pond-water 3-4 C swings: not countable from air data. I found no sourced air-to-water relation (search found only the generic advice to keep 1.2-1.5 m of water to damp swings).
- Vietnamese searches (tôm chết khi nhiệt độ giảm đột ngột, biên độ nhiệt ngày đêm, khuyến cáo thời tiết lạnh) gave only the generic "26-32 C is good, sudden change causes stress" with no number for a drop or a range. Several nongnghiepmoitruong.vn pages returned 403, so I read none. The La Niña white spot page in `pests.json` also 403'd, so it stays unverified.

## Dead ends
- Millard 2020 full text (ore.exeter.ac.uk, nature.com): 403/redirect.
- No Directorate of Fisheries, DAH or FAO number for a drop or range found.

## Verdict
No sourced rule fits daily gridded data: remove. (The only countable candidate, daily air range > 10 C, has no traceable primary source. If a rule must stay, mark it a team estimate.)
