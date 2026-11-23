# Sentinel-1 crop count and HLS-VI access: prototype at the 5 Sóc Trăng pins

Run 2026-11-23. This is the gate before any code switch: can Sentinel-1 radar become the app's main crop counter at the 5 pins, and can the app read NASA HLS-VI v2.0 directly? Background: `research/research_notes/Mekong app data source alternatives/greenness_crops.md` and the greenness section of `research/reports/Mekong app data source alternatives.md`.

Scripts (all new, in `research/scripts/`): `s1_points.py` (fetch), `s1_rice_count.py` (count, with a self-check), `hlsvi_points.py` (fetch). Raw outputs are in the session scratchpad only (`.../scratchpad/s1/`), not in the repo.

## Verdict

| Question | Result |
|---|---|
| Gate 1: S1 crops/yr within ±0.5 of the MODIS RECENT count at each pin | **PASS, narrowly**: 5/5 pins, largest gap 0.4. The margin is thin. In the four planned sensitivity runs, long_phu reaches −0.6 at a 7.8 dB threshold (a fail), and three runs land exactly on +0.5: vinh_chau at window 3, and nga_nam at window 7 and at 6.8 dB. |
| Gate 2: S1 agrees with the Open-SEA-Rice-10 class at ≥ 4 of 5 pins | **FAIL**: 2/5 on the 2021 season (Dec 2020 – Nov 2021). On the mean of calendar 2020 and 2021 (the map's input stack) it is 3/5 exact, and the other two sit at 2.5, a tie. MODIS agrees 5/5 (2 peaks in the 2021 season at every pin). |
| Sentinel-1 as the main crop counter | **Not yet.** Gate 2 fails, so the switch is blocked as agreed. See "Why gate 2 fails". |
| HLS-VI v2.0 direct access | **Works**, with an Earthdata bearer token. Back-processing is complete: S30 from 18 Dec 2015 and L30 from 24 Apr 2013 at the pins, latest 15 Nov 2026 (8 days old on 23 Nov 2026). 14–21 clear dates per season (2016–2025 mean), and only 0.5–1.6 per month in Jun–Oct. Cost: about 2 MB and 30 s per pin per year. |

## 1. Sentinel-1 access (worked first try: Microsoft Planetary Computer)

- **Search**: `POST https://planetarycomputer.microsoft.com/api/stac/v1/search`, collection `sentinel-1-rtc` (radiometrically terrain-corrected gamma0, 10 m, UTM 48N COG, float32 linear power, deflate, 512×512 tiles), bbox around the pins, `query: {"sat:relative_orbit": {"eq": 18}}`. No account is needed.
- **Auth**: an anonymous SAS token from `GET https://planetarycomputer.microsoft.com/api/sas/v1/token/sentinel-1-rtc` (it lasts about 45 min), appended as `?<token>` to each asset href. Read with rasterio (`pip install rasterio`, which brings GDAL 3.12) through `/vsicurl`.
- **Track choice**: descending relative orbit 18 is the only track over all 5 pins from Oct 2015 onward. Ascending orbit 26 starts in 2017. One track keeps the viewing geometry the same on every date. One frame per date covers all 5 pins.
- **Window**: median of the 5×5 pixels (50 m) round each pin, of linear gamma0, then converted to dB. Approximate incidence angle at the pins is 33.8–37.5°, interpolated across the frame footprint.
- **Cost (full run, 1 Oct 2015 – 15 Nov 2026)**: 492 dates; 4,900 tile reads (VH + VV × 5 pins); **4.18 GB** transferred (each read pulls one whole ~0.85 MB compressed 512×512 tile); **6 min** with 8 threads. That is about **0.4 GB and 35 s per pin per year** for VH+VV, or half that for VH only. Nothing is stored except the JSON, about 100 KB.
- **Dates per Dec–Nov season** (track 18): 2016: 33 · 2017–2021: 56–61 (S1A + S1B, 6-day) · 2022: 31 · 2023: 23 · 2024: 28 · 2025: 37 · 2026: 38 (S1A, then S1C, then S1D, 12-day). The largest gaps are two of 48 days in May–Aug 2023.

### Coverage after mid-2026 (checked on the STAC catalogue)
- Sentinel-1A: last date on track 18 is **17 Jun 2026**. Its operations ended 29 Jun 2026.
- Sentinel-1C: last date over the pins is **24 Apr 2026** on track 18 (25 Apr 2026 on track 26). It has acquired nothing here since its orbit change.
- Sentinel-1D: from **19 May 2026** (track 18) and 20 May 2026 (track 26), every 12 days without a miss to **15–16 Nov 2026**.
- There is one gap of 25 days, 24 Apr – 19 May 2026, right at the dry-to-wet season change.

## 2. Method (published rule, not tuned)

Rule: Nguyen-Thi, Bouvet, Jarlan, Le Toan, Mermoz and Doblas Prieto (2026), *Recent Advances in Remote Sensing* 3(1), [link](https://www.recentadvancesin.com/remote-sensing/3020-6448-rars26001/). Quotes from the paper:
- water mask: "average σ° ≤ -20 dB" (mean VH); built-up and permanent vegetation: minimum VH "consistently above -10 dB". None of the pins is masked: mean VH is −15.8 to −18.2 dB and minimum VH is −23 to −28 dB.
- seasons are bounded by local minima of the smoothed VH/VV ratio, and "consecutive local minima must be ≥ 90 days apart". The season window runs from 25 days before one minimum to the next minimum.
- `VHmax_increase` is the max − min of **raw** VH in the window. The season is rice when this exceeds the incidence-angle threshold Δ = aθ² + bθ + c. The paper gives the curve only in a figure: about 6.0–6.5 dB at 31° and 46°, and about 7.5–8.0 dB at 37–39°. A parabola through (31, 6.25), (38.5, 7.75) and (46, 6.25) gives **7.16–7.72 dB at the pins**. The paper says the threshold moves by about 0.5 dB between years.

Choices not in the paper, fixed before seeing any result: the ratio is averaged into a 12-day grid (one-satellite revisit), gaps are filled linearly, then a Savitzky–Golay filter is applied (window 5 bins, order 2). The paper's "adaptive" window (the lesser of the FFT dominant period and the acquisition interval) is not fully specified. A season counts in the Dec–Nov year that holds its VH/VV minimum, which is about 20 days after sowing according to the paper. Sensitivity runs: window 3 and 7, and a fixed threshold of 6.8 and 7.8 dB at all pins (about ±0.5 dB, the paper's year-to-year shift). None of these was chosen to match.

Flooded or bare month (the app's test, not the paper's): that month's mean VH is below −19 dB (the paper's season-minimum level for rice) in more than half of the 10 seasons, mirroring `ndvi.bare_months`.

## 3. Results per pin

### Crops per year (Dec–Nov seasons; the mean covers 2016–2025, the app's RECENT = Dec 2015 – Nov 2025)

| Pin | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | **S1 mean** | **MODIS RECENT** | Δ | Sensitivity range (w3, w7, 6.8 dB, 7.8 dB) | 2026 so far |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vinh_chau | 2 | 2 | 2 | 3 | 1 | 3 | 2 | 2 | 2 | 3 | **2.2** | 2.0 | +0.2 | 2.2–2.5 | 1 |
| tran_de | 3 | 3 | 2 | 3 | 2 | 3 | 2 | 2 | 2 | 2 | **2.4** | 2.0 | +0.4 | 2.3–2.5 | 3 |
| my_xuyen | 2 | 3 | 3 | 2 | 2 | 2 | 2 | 1 | 1 | 2 | **2.0** | 2.0 | 0.0 | 2.0–2.2 | 3 |
| long_phu | 2 | 2 | 3 | 3 | 2 | 2 | 0 | 2 | 2 | 2 | **2.0** | 2.4 | −0.4 | 1.8–2.2 | 2 |
| nga_nam | 2 | 3 | 3 | 2 | 2 | 3 | 2 | 3 | 2 | 3 | **2.5** | 2.1 | +0.4 | 2.5–2.6 | 2 |

I recomputed the MODIS figures with `ndvi.crops_per_year` on `data/raw/ndvi_<pin>.json` clipped to `build.RECENT`, and they match the app. long_phu 2022 = 0: three seasons were found, but their VH rise was 5.1–7.1 dB, under the 7.2 dB threshold. 2022 has 31 dates on one satellite. Per-season counts swing between 1 and 3 more than a farmer's calendar would. Only the 10-year mean is stable.

### Flooded or bare months (VH < −19 dB in more than half of the seasons) against MODIS bare months

| Pin | S1 flooded/bare | MODIS bare (NDVI < 0.3) | Monthly median VH, Jan…Dec (dB) |
|---|---|---|---|
| vinh_chau | 4, 7, 11 | 3, 4, 5, 6, 10 | −16 −16 −19 −20 −18 −19 −21 −16 −15 −18 −22 −16 |
| tran_de | 4, 6 | 3, 4, 5, 10 | −16 −15 −18 −20 −19 −20 −17 −16 −15 −18 −19 −16 |
| my_xuyen | 11 | 4, 6 | −15 −15 −16 −18 −16 −17 −18 −16 −16 −14 −21 −16 |
| long_phu | none | 5 | −16 −16 −16 −15 −16 −18 −15 −15 −15 −17 −15 −15 |
| nga_nam | 10, 11, 12 | 9, 10, 11 | −16 −16 −15 −16 −17 −15 −14 −15 −19 −23 −24 −22 |

They overlap only partly. VH falls below −19 dB when a field is under water (sowing or a flooded fallow), while dry, rough fallow soil in Feb–Apr sits at about −15 to −18 dB, as green rice does. **VH alone cannot report the app's dry "bare months"**; that needs an optical index or the VH/VV ratio phase. nga_nam's Sep–Dec flooding matches MODIS. The coastal pins' March–May dry fallow is not seen by VH.

## 4. Open-SEA-Rice-10 (gate 2)

- Zenodo [record 14627003](https://zenodo.org/records/14627003). **Dataset licence: CC BY 4.0** (Zenodo metadata). The Scientific Data article itself is CC BY-NC-ND 4.0. Classes: 1 single, 2 double, 3 triple; uint8, EPSG:4326, 10 m (0.0000898°), in 2°×2° tiles. Zenodo says "Values from 2021". The paper's input stack is "Sentinel-1 and Sentinel-2 time series data from January 2020 to December 2021", and intensity is "the number of NDVI peaks".
- **Download**: only what was needed. The 547 MB zip's central directory was read by HTTP range (last 170 KB). The 8 KB grid shapefile gives tile ids 238 (104–106° E) and 240 (106–108° E). Those two members (3.8 MB + 1.0 MB compressed) were extracted by range read (`zip_member.py` in the scratchpad).
- **Class at every pin: 2 (double)**. 3×3 = 9/9 pixels and 11×11 ≥ 118/121 pixels are class 2. Within 51×51 (500 m), 2–24% is class 0 (non-rice): my_xuyen 24%, long_phu 12%, nga_nam 9%, vinh_chau 5%, tran_de 2%.

| Pin | Open-SEA-Rice-10 | S1, season 2021 (Dec 20–Nov 21) | S1, mean of calendar 2020 and 2021 | S1, season 2020 | MODIS peaks, season 2021 |
|---|---|---|---|---|---|
| vinh_chau | 2 | 3 ✗ | 2.0 ✓ | 1 | 2 ✓ |
| tran_de | 2 | 3 ✗ | 2.5 (tie) | 2 | 2 ✓ |
| my_xuyen | 2 | 2 ✓ | 2.0 ✓ | 2 | 2 ✓ |
| long_phu | 2 | 2 ✓ | 2.0 ✓ | 2 | 2 ✓ |
| nga_nam | 2 | 3 ✗ | 2.5 (tie) | 2 | 2 ✓ |
| agree | | **2/5** | 3/5 (+2 ties) | 4/5 | 5/5 |

The primary comparison was set before looking: the 2021 season, matching "Values from 2021". It gives 2/5, so **FAIL**. The season-2020 column (4/5) is shown only for transparency and was not used for the verdict.

### Why gate 2 fails
- The S1 rule finds a third season in 2021 at vinh_chau, tran_de and nga_nam. These are not marginal: every 2021 season at those pins has a VH rise of 9.7–14.7 dB, well over the 7.2–7.7 dB threshold. For example, nga_nam's VH/VV minima fall on 2 Jan, 26 May and 11 Sep 2021, then 16 Dec, which counts in season 2022. So radar sees a strong backscatter cycle that the optical map and MODIS count as one crop or as non-rice. Possible causes: a short third crop, or a flooding-and-regrowth cycle between crops (rice–shrimp or a flooded fallow with weeds), which a VH-rise rule cannot tell from rice. A season-length check (≥ 90 days between minima is already applied) does not remove them.
- The Dec–Nov boundary and the threshold edge move seasons between years. At vinh_chau the season starting 9 Dec 2020 rose 7.2 dB, just under its 7.4 dB threshold (not rice), while a crop with its minimum on 22 Nov 2021 counted in season 2021: so 2020 = 1 and 2021 = 3. That is why the two-year mean agrees better.
- Neither map is ground truth for these pins. Open-SEA-Rice-10 underestimates double-cropped area by about 12% against statistics (preprint), and the ESSD 2026 30 m paper says the Delta moved toward triple cropping. Nobody has field-checked which is right at these 5 points.

## 5. NASA HLS-VI v2.0 access test

- **Collections** (CMR): `HLSL30_VI` v2.0 `C3246892554-LPCLOUD` (start 2013-04-11) and `HLSS30_VI` v2.0 `C3246894861-LPCLOUD` (start 2015-11-28). The STAC collection ids are `HLSL30_VI_2.0` and `HLSS30_VI_2.0` on `https://cmr.earthdata.nasa.gov/stac/LPCLOUD`. Each item has the 9 VI COGs (NDVI, NDWI, …; int16, scale 0.0001, fill −19999) plus an `Fmask` asset that points to the parent HLSS30/HLSL30 v2.0 granule.
- **Earliest and latest at the pins** (CMR granule search at vinh_chau): L30 **2013-04-24**, S30 **2015-12-18**; latest L30 **2026-11-14**, S30 **2026-11-15**. The back-processing that the earlier notes were unsure about is finished. The pins sit in MGRS tiles T48PWR and T48PXR, which overlap; one tile is kept per date and sensor.
- **Auth**: search needs no login. Data needs Earthdata login: `POST https://urs.earthdata.nasa.gov/api/users/find_or_create_token` with basic auth gives a bearer token valid 60 days (this one expires 22 Jan 2027). Each COG URL answers `GET` + `Authorization: Bearer` + `Range: bytes=0-0` with **303 to a signed CloudFront URL**, which GDAL then reads with no header. GDAL fails if it follows the redirect itself with the header ("not recognized as a supported file format"), and a `HEAD` gets 403. From the cloud sandbox, `urs.earthdata.nasa.gov` drops about 2 in 3 proxied connections ("tunnel closed mid-exchange"), so the token call needs many retries; the data host never failed.
- **Run (Dec 2015 – Nov 2026, 5 pins)**: 4,724 pin-dates (one per date and sensor), 4,942 reads (Fmask on every date, NDVI + NDWI on clear 2025 dates), **0 failures**, **29.5 min** with 6 threads (STAC search 201 s, including the token retries). Tile bytes: **28 MB**, plus GDAL's first 16 KB header read per file, about 80 MB more if every header was fetched (not measured).
- **Cost per pin per year**: about 90 dates → 90 Fmask reads plus 2 × ~18 clear dates for NDVI and NDWI, about **125 reads, ~2 MB including headers, ~30 s** wall time at 6 threads. That is about 200 times fewer bytes than Sentinel-1 because the HLS tiles are small and int16/uint8.
- **Clear dates** (all 9 pixels of the 3×3 window have Fmask bits 1–3 clear; L30 and S30 on the same day count once), per Dec–Nov season, clear/all:

| Pin | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 (to 15 Nov) | mean 2016–25 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vinh_chau | 12/40 | 15/49 | 14/85 | 16/78 | 30/74 | 25/86 | 23/101 | 24/95 | 31/100 | 18/109 | 28/105 | 20.8 |
| tran_de | 6/39 | 9/43 | 10/82 | 16/75 | 23/67 | 20/83 | 23/96 | 21/92 | 28/94 | 13/103 | 26/99 | 16.9 |
| my_xuyen | 11/39 | 11/48 | 14/74 | 16/71 | 18/68 | 16/83 | 21/98 | 23/92 | 25/97 | 17/100 | 24/104 | 17.2 |
| long_phu | 6/39 | 9/43 | 11/82 | 15/75 | 15/67 | 15/83 | 17/96 | 16/92 | 23/94 | 15/103 | 18/99 | 14.2 |
| nga_nam | 6/39 | 14/48 | 12/74 | 22/71 | 18/68 | 22/83 | 24/98 | 22/92 | 22/97 | 18/100 | 34/104 | 18.0 |

  2016–2017 are thin (Landsat 8 + Sentinel-2A only). Sentinel-2B (mid-2017) and Landsat 9 (2022) raise the total dates to 95–109 a season, but only 15–30% of dates are clear.
- **By month** (mean clear dates per month, 2016–2025, Jan…Dec):

| Pin | J | F | M | A | M | J | J | A | S | O | N | D |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vinh_chau | 2.1 | 2.1 | 2.8 | 2.8 | 2.1 | 1.1 | 0.8 | 1.5 | 1.1 | 1.3 | 1.4 | 1.7 |
| tran_de | 2.1 | 1.7 | 1.4 | 1.6 | 1.3 | 1.1 | 0.8 | 1.6 | 0.9 | 1.1 | 1.2 | 2.1 |
| my_xuyen | 2.2 | 1.2 | 1.4 | 2.6 | 2.0 | 1.0 | 0.5 | 0.8 | 0.9 | 1.4 | 1.3 | 1.9 |
| long_phu | 2.2 | 1.5 | 1.4 | 1.4 | 1.4 | 1.1 | 0.6 | 0.8 | 0.5 | 0.7 | 1.0 | 1.6 |
| nga_nam | 1.5 | 1.8 | 1.7 | 2.2 | 1.6 | 1.0 | 1.2 | 0.8 | 1.0 | 1.8 | 2.3 | 1.1 |

  Years (of 10) with at least one clear date in July: 3–8, and in Sep–Oct at long_phu: 4–5. A wet-season crop that lasts about 100 days usually gets 2–4 clear dates, enough to see a peak in most years but not every year.
- **What the values show** (vinh_chau 2025, clear dates): NDVI 0.77–0.85 in Jan, then 0.22–0.27 from late Feb to mid-May with NDWI −0.35 to −0.43. That is **dry** fallow, not water, which separates it from a flooded field or pond. A wet-season crop peaks at 0.63–0.71 (Jul–Aug), there is a flooded dip on 11 Oct (NDVI 0.00, NDWI −0.13), and the next crop reaches 0.76–0.86 from late Nov to Dec. This is the dry-fallow information Sentinel-1 VH cannot give (section 3).

## 6. Production access recipes

- **Sentinel-1 (Planetary Computer)**: `POST https://planetarycomputer.microsoft.com/api/stac/v1/search` `{"collections":["sentinel-1-rtc"],"bbox":[…],"query":{"sat:relative_orbit":{"eq":18}}}`, then `GET https://planetarycomputer.microsoft.com/api/sas/v1/token/sentinel-1-rtc` → append `?token` to `assets.vh.href` (and `vv`). rasterio window read of 5×5 at 10 m. No account. About 0.85 MB per pin-date-band; for 5 pins × 10 yr, VH+VV is 4.2 GB in about 6 min (8 threads). An incremental monthly update is 2–3 dates × 5 pins × 2 bands ≈ 25 MB in under 30 s. Nothing large is stored.
- **Open-SEA-Rice-10**: one-off. Range-read the zip directory, then members 238 and 240 (4.8 MB). CC BY 4.0, so cite Ginting et al. 2025, Scientific Data 12:1408.
- **HLS-VI**: `GET https://cmr.earthdata.nasa.gov/stac/LPCLOUD/search?collections=HLSS30_VI_2.0,HLSL30_VI_2.0&bbox=<pin ±0.0005°>&datetime=…&limit=250` (no login, follow `next`), then one bearer token from `POST https://urs.earthdata.nasa.gov/api/users/find_or_create_token` (basic auth; cache it, it lasts 60 days; retry, the host drops connections from the sandbox). For each asset (`Fmask`, `NDVI`, `NDWI`), `GET` + Bearer + `Range: bytes=0-0` → 303 `Location` (a signed CloudFront URL) → rasterio 3×3 window. About 2 MB and 30 s per pin per year; the 11-year backfill for 5 pins is about 110 MB in 30 min. Forward latency is 8 days or less.

## 7. Risks

- **Gate 2 failed**: the S1 rule counts strong extra backscatter cycles that the 10 m optical map and MODIS do not call rice. Without field truth, switching the main counter would change the app's crop numbers on evidence that two independent sources contradict.
- **Thin margin on gate 1**: per-season counts swing 0–3, and the mean moves by ±0.3 under reasonable smoothing and threshold choices. long_phu falls outside ±0.5 at a 7.8 dB threshold.
- **Threshold read off a figure**: the paper does not print the incidence-angle coefficients (a, b, c), so the 7.2–7.7 dB values are my reading of the text description of a figure.
- **Constellation**: S1A has ended (last date 17 Jun 2026). S1C acquires nothing over the pins after 24 Apr 2026. **S1D alone carries the record from 19 May 2026**, at 12 days on each track. A single-satellite failure (like S1B in Dec 2021) would leave no Sentinel-1 data here. 2022–2025 already ran on one satellite with 23–37 dates a season and gaps up to 48 days (2023), which is where the odd counts (long_phu 2022 = 0, my_xuyen 2023–24 = 1) appear.
- **Bare months**: VH flags flooded months, not dry fallow, so S1 cannot replace the NDVI bare-month test without an optical layer.
- **Byte cost**: each point read pulls a whole 512×512 tile (0.85 MB), so a 10-year backfill is GB-scale even for 5 points. This is fine for a monthly pipeline but too heavy to run at app runtime.
- **HLS-VI**: the wet season stays thin (0.5–1.6 clear dates a month in Jun–Oct, and some years have no clear July date), so HLS alone will sometimes miss the wet-season peak. The Earthdata login host is unreliable from the cloud sandbox, so cache the 60-day token. The signed-URL redirect step is required with GDAL 3.12.
- **Not shown to farmers as measured**: these are satellite estimates from a 50 m window (S1) or 30–90 m (HLS), not readings from the farmer's field.
