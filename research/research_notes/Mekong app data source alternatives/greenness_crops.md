# Greenness, crops per year and bare months: alternatives to MODIS NDVI (Mekong Delta rice)

Notes written 2026-11-22. Scope: what should replace or complement MODIS MOD13Q1 NDVI (250 m, 16-day) for crops per year, Feb–Apr bare months and a monthly greenness chart at 5 Sóc Trăng pins. Criteria in order: validated accuracy in the Delta, freshness in 2026, finer resolution, simpler pipeline. About 16 searches and fetches; everything below has a link, and gaps say where I could not verify.

## Q1. Raw-data candidates: VIIRS, Sentinel-2, HLS v2, Sentinel-1, Landsat

### Takeaway
No optical index fixes the main problems at these pins, which are wet-season cloud, fields under 1 ha and shrimp ponds nearby. Two sources do better than MODIS. Sentinel-1 radar (10 m, 2015 onward) has the best validated Delta accuracy for counting rice crops, at 90.5–96.1% overall accuracy over 2016–2024. NASA's HLS v2 vegetation-index product (30 m) is forward-processed with a latency of about 2–3 days and can be read straight from LP DAAC STAC as COGs, without AppEEARS. VIIRS VNP13 continues the MODIS record but stays at about 250–500 m and has had processing problems in late 2026.

### Cited Findings
**MODIS baseline (what the app uses now)**
- MODIS phenology-based classification of Delta rice cropping systems for 2000–2012 reached overall accuracies of 81.4% (kappa 0.75) for 2002, 80.6% (0.74) for 2006 and 85.5% (0.81) for 2012. Accuracy was lowest for single-cropped rain-fed rice, "because this rice class occupied a small area and was spatially scattered along coastal areas". MODIS rice area was overestimated against statistics by 0.9–15.9%. — [Chen et al. 2014, Remote Sensing 6(1):135](https://doi.org/10.3390/rs6010135)
- Sakamoto et al. applied a wavelet filter to MODIS 2002–2003 data to map rice phenology, the number of rice crops per year and cropping patterns in the Mekong Delta. This is the founding MODIS method for crops per year. — [Sakamoto et al., Remote Sensing of Environment](https://www.sciencedirect.com/science/article/abs/pii/S0034425705002920)
- A 2025 An Giang study found that DLF-processed MOD09GQ (daily 250 m surface reflectance) reconstructed NDVI time series best and caught short phenological transitions, outperforming coarser products. — [Remote Sensing 17(9):1583, 2025](https://doi.org/10.3390/rs17091583)
- MODIS-based land-use change for the Delta: rice practice "rapidly increased from 2010 to 2015 but dropped afterwards", and shrimp farming was stably dominant in the coastal areas from 2001 to 2020. — [Science of the Total Environment, Land use change in the Vietnamese Mekong Delta](https://www.sciencedirect.com/science/article/abs/pii/S0048969721069941) (from the search snippet; full text not read)

**VIIRS VNP13Q1 / VNP13A1 (MODIS continuity)**
- The LP DAAC VNP13 user guide says the VIIRS VI time series is comparable to MODIS and that MODIS algorithms apply to VIIRS. VIIRS compositing bins observations with view angles under 30° and picks the maximum NDVI in that bin. — [VNP13 User Guide/ATBD v2.1.2](https://lpdaac.usgs.gov/documents/1372/VNP13_User_Guide_ATBD_V2.1.2.pdf)
- VIIRS and MODIS VI product components agree with R² ≥ 0.90. VIIRS values run slightly higher (one agricultural study found NDVI 0.018 higher on average), so a transformation may be needed. — [Transitioning from MODIS to VIIRS, PMC5992487](https://pmc.ncbi.nlm.nih.gov/articles/PMC5992487/); [cross-sensor compatibility, ResearchGate](https://www.researchgate.net/publication/328210448_Assessment_of_cross-sensor_vegetation_index_compatibility_between_VIIRS_and_MODIS_using_near-coincident_observations)
- VIIRS observes only in the afternoon, while MODIS had both morning (Terra) and afternoon (Aqua) passes. — [PMC5992487](https://pmc.ncbi.nlm.nih.gov/articles/PMC5992487/)
- Forward processing of most VIIRS Version 1 products has ended. Collection 1 land products stopped forward processing in June 2024, and Version 2 reprocessing was still in progress as of January 2026. — [Earthdata alert](https://www.earthdata.nasa.gov/data/alerts-outages/forward-processing-most-viirs-version-1-products-has-ended)
- 2026 VIIRS problems: gaps in NOAA-20/NOAA-21 data for 5–7 Nov 2026 are delaying downstream products, with resolution "TBD". An Oct 2026 processing delay was resolved on 23 Oct. — [Earthdata alert, Nov 2026](https://www.earthdata.nasa.gov/data/alerts-outages/viirs-data-gaps-processing-delays-from-november-5-2026). An ESDIS metrics page says delivery of new Suomi NPP data ceases on 2 Nov 2026. — [ESDIS weekly metrics](https://earthdata.nasa.gov/about/data-metrics/esdis-metrics/weekly-metrics/10-06-2025) (search snippet only; not fetched)

**HLS v2 and HLS-VI (30 m, Landsat 8/9 + Sentinel-2)**
- HLS v2 latency is 1.7 days from overpass to availability at LP DAAC on one HLS page, and about 2–3 days on others. HLS collections are in CMR and CMR-STAC for scripted, cloud-native access. — [hls.gsfc.nasa.gov/hls-data](https://hls.gsfc.nasa.gov/hls-data); [Earthdata HLS project page](https://www.earthdata.nasa.gov/data/projects/hls)
- The low-latency HLS product (about 6 h) is now expected in early 2027 (earlier target: end of 2025). — [hls.gsfc.nasa.gov](https://hls.gsfc.nasa.gov/)
- HLS-VI (HLSL30_VI from Landsat 8/9 OLI; HLSS30_VI from Sentinel-2A/2B/2C MSI) is 30 m on the MGRS tiling, ready to stack. It has 9 indices: NDVI, EVI, SAVI, MSAVI, NDMI, NDWI, NBR, NBR2 and TVI. NDVI is int16, scale 0.0001, fill −19999. It comes as Cloud-Optimized GeoTIFF, one file per band. — [LP DAAC HLSS30_VI v002](https://lpdaac.usgs.gov/products/hlss30_viv002/); [HLS-VI User Guide](https://lpdaac.usgs.gov/documents/2088/HLS_VI_User_Guide_V2.pdf)
- HLS-VI was released with data from February 2025 onward and forward processing. Historical processing back to April 2013 (L30) and December 2015 (S30) was planned. — [LP DAAC release notice](https://lpdaac.usgs.gov/news/lp-daac-release-of-harmonized-landsat-and-sentinel-2-vegetation-indices-hls-vi-data-products/). A NASA SNWG page expected the VI archive to be complete by mid-2026. — [Earthdata low-latency HLS](https://earthdata.nasa.gov/about/nasa-support-snwg/solutions/low-latency-hls-products). The LP DAAC product table already lists both products from their start dates "to present", so the sources disagree on whether the back-processing is finished.
- An Earthdata forum thread reports slow access to HLSL30/HLSS30 v2.0 through the cloud endpoint. — [Earthdata forum](https://forum.earthdata.nasa.gov/viewtopic.php?p=15368)

**Sentinel-1 SAR (cloud-free)**
- Nguyen-Thi, Bouvet, Jarlan, Le Toan, Mermoz and Doblas Prieto (CESBIO/GlobEO), *Recent Advances in Remote Sensing* 3(1), published 23 Jan 2026. They used Sentinel-1 10 m VH/VV GRD from Oct 2015 to 2024 for the whole Vietnamese Mekong Delta. Seasons come from an adaptive Savitzky–Golay filter on the VH/VV ratio, and rice is confirmed by the maximum VH rise per season against incidence-angle thresholds. Sowing date is about 20 days before each VH/VV minimum. Overall accuracy was 90.5% (2020) to 96.1% (2021), mean 93.84%. Rice producer's accuracy was 94.76% and user's accuracy 94.98%. Rice area came out 5–16% above GSO statistics. For the coastal provinces Bạc Liêu, Sóc Trăng and Trà Vinh, they found a "Progressive reduction in double-cropping areas from 2016 to 2023", with some areas moving to rice–aquaculture. Caveat: the abstract says 600 reference samples, while Section 2 says 600 fields for training and 85 for validation. No data-availability statement was visible. — [Recent Advances in Remote Sensing, 2026](https://www.recentadvancesin.com/remote-sensing/3020-6448-rars26001/)
- Earlier Delta Sentinel-1 work: phenological metrics gave OA 86.2%, kappa 0.72 against 1,000 reference pixels (Chen et al., ISPRS 2016; part of the reference was a 2006 Landsat land-use map) — [ISPRS Archives XLI-B8-863](https://isprs-archives.copernicus.org/articles/XLI-B8/863/2016/). An Giang cropping pattern by SVM: OA 80.7%, kappa 0.78 — [ISPRS IJGI 8(5):211, 2019](https://www.mdpi.com/2220-9964/8/5/211). Rice production in the Delta from Sentinel-1: 92.2% validation accuracy — [ResearchGate](https://www.researchgate.net/publication/327535633_Estimating_rice_production_in_the_Mekong_Delta_Vietnam_utilizing_time_series_of_Sentinel-1_SAR_data). Cloudy-area harmonic analysis on Sentinel-1 for cropping intensity, with Sentinel-2 NDVI/NDWI as a check — [GIScience & Remote Sensing, 2025](https://www.tandfonline.com/doi/full/10.1080/15481603.2025.2571255).
- Constellation status: Sentinel-1B failed in late 2021 (power system), which left only Sentinel-1A, so 2022–2024 has thinner coverage. Sentinel-1C is in service (Copernicus "return to nominal operations" note, Jan 2026). Sentinel-1A operations ended 29 June 2026. Sentinel-1C has been changing orbit since 9 June 2026 for a 6-day revisit with Sentinel-1D. — [ESA, Time to say goodbye to Sentinel-1A](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Time_to_say_goodbye_to_Sentinel-1A); [CDSE note](https://dataspace.copernicus.eu/node/2958); [Copernicus updates](https://sentiwiki.copernicus.eu/web/latest-copernicus-updates). There are also several unrecoverable Sentinel-1C data losses in 2025 (e.g. 8 July 2025). — [Copernicus notice](https://sentinels.copernicus.eu/-/copernicus-sentinel-1c-data-unavailability-on-8-july-2025)

**Sentinel-2 L2A and Landsat C2**
- Sentinel-2 and Landsat C2 L2 are the inputs behind HLS and the 30 m ESSD product below. I found no Delta validation that uses Sentinel-2 NDVI alone for crops per year. Studies combine it with Sentinel-1. — see the [SEA-Rice-Ci10 paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC12343852/) and the [GIScience 2025 paper](https://www.tandfonline.com/doi/full/10.1080/15481603.2025.2571255)

### Inferences
- MODIS's known weak spot in the Delta is scattered coastal rice (Chen 2014), which is exactly the Sóc Trăng pin setting. A 250 m pixel of about 6 ha around a field under 1 ha mixes in ponds, canals and homesteads. The finer sources (HLS 30 m, Sentinel-1/2 10 m) address this, MODIS cannot, and VIIRS (250–500 m) does no better.
- VIIRS is the MODIS continuity product, but it does not meet criterion 3 (resolution), and its 2026 freshness is shaky (SNPP end, NOAA-20/21 gaps). It is only worth adding to keep a coarse 2000-onward series going after MODIS ends.
- For freshness and resolution, HLS-VI is the smallest change from the current pipeline. It is the same NASA family as what the app already uses, gives NDVI directly, and comes as COGs over CMR-STAC. The app's "HLS to Nov 2024" limit looks like a pipeline choice: HLS v2 itself is forward-processed with a latency of a few days. I have not checked the AppEEARS-specific limit.
- Optical NDVI cannot tell a flooded field from a bare one: both read low. Sentinel-1 VH also drops when a field is flooded. A Feb–Apr "bare" reading at a pin next to shrimp ponds is therefore ambiguous unless a water index (LSWI/NDWI/MNDWI, all in HLS-VI as NDWI, or the app's existing HLS water fraction) separates dry fallow from a flooded pond or field.

### Gaps
- Whether the HLS-VI historical back-processing (2013/2015 onward) is complete as of Nov 2026: the sources conflict.
- Exact VNP13Q1/VJ113Q1 v002 temporal extent and current latency: the LP DAAC product page redirected and was not read.
- No source checked for the MODIS Terra/Aqua end-of-mission dates or the last MOD13Q1 date. The caller's premise ("near end of mission") is not verified here.
- No access test from the sandbox: request size and time for LP DAAC STAC COG reads, Microsoft Planetary Computer (sentinel-1-rtc, sentinel-2-l2a) or the Sentinel Hub Statistical API (CDSE free quota) were not measured.
- No Delta validation for crops per year from Sentinel-2 or HLS NDVI alone.

## Q2. Ready-made products (rice cropping intensity, calendars, aquaculture, WorldCereal, Vietnam's own)

### Takeaway
Two open, validated cropping-intensity maps cover Sóc Trăng and can be sampled at a pin. Open-SEA-Rice-10 is 10 m, 2020–2021, from Sentinel-1 and Sentinel-2, with Vietnam OA 0.981. The ESSD 2026 South/Southeast Asia map is 30 m with epochs 1995/2005/2015/2024, OA 83.7–87.6%. Both give crops per year only: no months and no fallow. ESA WorldCereal does not map rice, so it is not useful here. For ponds, a Sentinel-1 Vietnam coastal aquaculture map reached 90.16% OA.

### Cited Findings
- **Open-SEA-Rice-10 / SEA-Rice-Ci10** (Ginting, Rudiyanto, Minasny et al., *Scientific Data* 12:1408, 12 Aug 2025). It uses Sentinel-1 VH and Sentinel-2 L1C on GEE, 10 m, 2020–2021. The method is LUCK-PALM: k-means in 2°×2° grids, phenological labels, and intensity from the number of NDVI peaks. Pixel validation (n = 58,885) gave OA 0.98, kappa 0.870, F1 0.879. Vietnam alone: OA 0.981, kappa 0.897, F1 0.908. Vietnam harvested area was 6,248 × 10³ ha against 7,109 × 10³ ha in national statistics. The preprint reports double-cropping underestimated by about 12% and triple-cropping overestimated by about 4% against statistics. The data is GeoTIFF (EPSG:4326) on Zenodo, [record 14627003](https://zenodo.org/records/14627003). The article is CC BY-NC-ND 4.0, and the dataset licence was not stated. There are no sowing or harvest dates, and the Mekong Delta has no separate validation. — [PMC12343852](https://pmc.ncbi.nlm.nih.gov/articles/PMC12343852/); [ESSD preprint essd-2024-90](https://essd.copernicus.org/preprints/essd-2024-90/essd-2024-90.pdf)
- **Paddy rice distribution and cropping intensity, South and Southeast Asia, 1995–2024, 30 m** (Zhao, Zhang, Dong, Yang, Fan, Liu, Xiao; *ESSD* 18:5583–5599, 2026). It uses Landsat C2 L2 and Sentinel-2 harmonized on GEE (Sentinel-1 only for validation samples). Composite periods are 1993–1997, 2003–2007, 2014–2016 and 2023–2025. Methods: NDVI peaks after Whittaker smoothing, plus a flooding rule (LSWI + 0.05 ≥ EVI, EVI ≤ 0.35, LSWI > 0.05). Intensity classes are 1/2/3. OA was 83.74–87.60%, F1 0.7872–0.8628, on 23,396 samples. The country-level table was not readable, so there is no Vietnam-specific accuracy. The paper notes the Delta shifted from double to triple cropping, and that Delta inter-season gaps can be under 15 days. Data: Zenodo [10.5281/zenodo.21349862](https://doi.org/10.5281/zenodo.21349862) (the paper prints the DOI with a typo). The article is CC BY 4.0, and the dataset licence was not stated. — [ESSD 2026](https://essd.copernicus.org/articles/18/5583/2026/)
- **Sun et al. 2023, 20 m annual paddy map, mainland Southeast Asia** (Sentinel-1, U-Net): 92.20% accuracy for 2019. It maps paddy area, not intensity. — [ESSD 15:1501, 2023](https://essd.copernicus.org/articles/15/1501/2023/essd-15-1501-2023-metrics.html)
- **ESA WorldCereal** (2021 global, 10 m): its seasonal calendars and products cover maize, (winter/spring) cereals and irrigation, not rice. Accuracy is "somewhat lower" in Asia and Africa. The authors avoid the word "accuracy" because the sample design is not probabilistic. — [ESSD 15:5491, 2023](https://essd.copernicus.org/articles/15/5491/2023/); [maize/wheat crop calendars](https://www.researchgate.net/publication/361121245_Global_crop_calendars_of_maize_and_wheat_in_the_framework_of_the_WorldCereal_project)
- **Rice calendars for Asia**: RiceAtlas exists but rests on "heterogeneous data sources with varying levels of detail and are challenging to update". RICA is a MODIS-based rice calendar for Asia. — [RICA, ResearchGate](https://www.researchgate.net/publication/354338574_RICA_A_rice_crop_calendar_for_Asia_based_on_MODIS_multi_year_data)
- **Aquaculture ponds**: a nation-scale Sentinel-1 map of Vietnam's coastal aquaculture ponds on GEE had OA 90.16% on independent samples — [Remote Sensing 12(18):3086, 2020](https://doi.org/10.3390/RS12183086). An earlier Sentinel-1 multi-site study scored 166/200 aquaculture and 169/200 non-aquaculture points correctly in the Mekong Delta (mean OA 0.83) — [Remote Sensing 9(5):440, 2017](https://doi.org/10.3390/rs9050440).
- **Sóc Trăng local**: a Sentinel-1 + Sentinel-2 Random Forest land-use update for Thuận Hòa commune (Châu Thành district, 2023, 10 m) reached 72.09% accuracy on 301 changed plots. — [ResearchGate](https://www.researchgate.net/publication/387648742_Possibilities_for_remote_sensing_applications_to_support_the_updating_of_land_use_maps_in_Thuan_Hoa_commune_Chau_Thanh_district_Soc_Trang_Province)
- **VNSC / Vietnam rice monitoring**: a Vietnam National Space Center (Lâm Đạo Nguyên) presentation on rice mapping and yield in the Mekong with Sentinel-1 exists. — [UMD LCLUC slides](https://lcluc.umd.edu/sites/default/files/Lam%20Dao%20Nguyen_D2_Session%20II.pdf) (not opened)

### Inferences
- Open-SEA-Rice-10 and the ESSD 2026 maps can serve as one-off checks: does the pin's MODIS/HLS peak count match an independent map? They cannot replace the monthly chart or the Feb–Apr bare test, and they are not refreshed (2021 and 2023–2025 composites).
- The pond maps could support a pin-quality check (distance to the nearest pond) next to the existing HLS water ≤ 10% rule. That is a small gain and is not needed for the core question.
- WorldCereal can be dropped: it has no rice layer.

### Gaps
- Dataset licences for both Zenodo rice maps (the article licences differ: CC BY vs CC BY-NC-ND). This needs checking on the Zenodo pages before redistributing values.
- Accuracy of either product for the Mekong Delta or Sóc Trăng specifically: not reported.
- I found nothing open from VNSC or MARD as a downloadable rice-season map, and no IRRI/GEOGLAM Delta calendar at sub-province level. These were not searched in depth.
- A global aquaculture map (e.g. Global Surface Water based) was not checked.

## Q3. Best approach for "how many rice crops per year, and are fields bare in Feb–Apr" at a point, over the longest record

### Takeaway
No single source does it all. MODIS is the only consistent record back to 2000, and its Delta-validated accuracy is about 80–86%. Sentinel-1 (Oct 2015 onward) is the most accurate validated method for crop counting, at about 94% mean OA, and it works through wet-season cloud. HLS-VI gives 30 m optical NDVI plus a water index from 2013/2015. Switching fully to Sentinel-1 and Sentinel-2 would lose 2000–2015, which is exactly the period before the coastal shift from double crops to rice–shrimp.

### Cited Findings
- Sentinel-1 2016–2024 Delta crop counting: mean OA 93.84%. It found progressive loss of double-cropping in Sóc Trăng, Bạc Liêu and Trà Vinh from 2016 to 2023. — [Nguyen-Thi et al. 2026](https://www.recentadvancesin.com/remote-sensing/3020-6448-rars26001/)
- MODIS 2000–2012 Delta cropping-system mapping: OA 80.6–85.5%, weakest for scattered coastal rice. — [Chen et al. 2014](https://doi.org/10.3390/rs6010135)
- 30 m optical intensity mapping (Landsat + Sentinel-2) reaches OA 83.7–87.6% and back-extends to 1993–1997 by multi-year compositing. A flooding rule (LSWI/EVI) separates flooded transplanting from bare soil. — [Zhao et al., ESSD 2026](https://essd.copernicus.org/articles/18/5583/2026/)
- In the Delta, gaps between seasons can be under 15 days. — [Zhao et al., ESSD 2026](https://essd.copernicus.org/articles/18/5583/2026/)
- Coastal Delta change since 2001 (MODIS): rice rose to 2015 and then fell, and shrimp stayed dominant on the coast. — [STOTEN](https://www.sciencedirect.com/science/article/abs/pii/S0048969721069941)

### Inferences
- With inter-season gaps under 15 days, a 16-day MODIS composite can merge two crops into one peak or miss a short bare break. Denser 30 m HLS (Landsat 8/9 + Sentinel-2A/B/C) or 6–12-day Sentinel-1 resolves this better. This is an inference from revisit times and is not validated at the pins.
- "Bare in Feb–Apr" is easiest to defend as dry fallow when low NDVI and low water both hold, which HLS-VI NDVI + NDWI can show at 30 m. Sentinel-1 VH alone can confuse a flooded shrimp pond with flooded rice at sowing, and a pond with open water.
- Best balance: keep MODIS for the 2000-onward history and long-term averages (and label it 250 m). Use HLS-VI (2013/2015 onward, forward to within days) as the primary source for recent years and the monthly chart, because it fixes resolution and freshness with the least new code. Treat Sentinel-1 as an optional wet-season crop-count check. It is the most accurate, but it means a new data type (backscatter, terrain/angle handling) and a new access route (Planetary Computer `sentinel-1-rtc` or CDSE/Sentinel Hub), which goes against criterion 4.

### Gaps
- No study found that validates the bare/fallow months themselves (as opposed to crop counts) in Sóc Trăng's rice–shrimp areas.
- No direct comparison of MODIS, HLS and Sentinel-1 crop counts at the same Delta pixels.
- How much HLS wet-season (May–Nov) data survives cloud masking at these pins: not measured. This matters for how often HLS alone can count the wet-season crop.

## Q4. Recommendation

### Takeaway
Do not drop MODIS: it is the only 2000–2015 record. Add NASA HLS-VI v2.0 NDVI and NDWI from LP DAAC CMR-STAC as the primary recent source: 30 m, about 2–3-day latency, back to 2013/2015, and the same NASA family the app already uses. Use the two open Zenodo cropping-intensity maps as a one-time check on each pin's crop count. Add Sentinel-1 only if HLS cloud gaps keep the wet-season crop from being counted. Skip VIIRS (too coarse, unstable in 2026) and WorldCereal (no rice).

### Cited Findings
- HLS-VI: 30 m NDVI/NDWI as COG, forward-processed with latency of about 1.7–3 days, available over CMR-STAC — [LP DAAC HLS-VI](https://lpdaac.usgs.gov/products/hlss30_viv002/); [hls.gsfc.nasa.gov](https://hls.gsfc.nasa.gov/hls-data)
- Sentinel-1 is the most accurate validated Delta crop counter (mean OA 93.84%, 2016–2024) — [Nguyen-Thi et al. 2026](https://www.recentadvancesin.com/remote-sensing/3020-6448-rars26001/)
- Independent maps to check pins against: Open-SEA-Rice-10 (Vietnam OA 0.981) — [Zenodo 14627003](https://zenodo.org/records/14627003); ESSD 30 m 1995–2024 (OA 83.7–87.6%) — [Zenodo 21349862](https://doi.org/10.5281/zenodo.21349862)
- WorldCereal covers maize and cereals, not rice — [ESSD 15:5491](https://essd.copernicus.org/articles/15/5491/2023/)
- VIIRS: 2026 gaps and delays, SNPP delivery ending — [Earthdata alert](https://www.earthdata.nasa.gov/data/alerts-outages/viirs-data-gaps-processing-delays-from-november-5-2026)

### Inferences
- Ranked by the caller's criteria: (1) accuracy: Sentinel-1 > HLS/Sentinel-2 optical ≈ 30 m products > MODIS > VIIRS; (2) freshness: HLS-VI and Sentinel-1/2 (days) > MODIS/VIIRS (weeks, end of mission, 2026 gaps); (3) resolution: Sentinel-1/2 10 m > HLS 30 m >> MODIS/VIIRS 250 m; (4) simplicity: HLS-VI (NDVI precomputed, NASA login already in use) > Sentinel-2 L2A via Planetary Computer or Sentinel Hub (compute NDVI and cloud-mask yourself) > Sentinel-1 (new data type).
- Sentinel-1 has lower freshness in 2022–mid-2025, after Sentinel-1B's loss and before Sentinel-1C. Expect fewer images in those seasons.
- Never present any of these as measured on the farmer's field. They are satellite estimates at a nearby 10–250 m pixel (the project's data rules).

### Gaps
- No pin-level test was run. Before switching, pull HLS-VI NDVI/NDWI at the 5 pins for 2016–2026 and compare peak counts with MODIS and with the two Zenodo maps.
