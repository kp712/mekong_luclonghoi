# Rice calendar and cropping-intensity maps at the 5 pins (tested 23 Nov 2026)

Pins (docs/data/sites.json): vinh_chau 9.435/105.98, tran_de 9.5/106.1, my_xuyen 9.5/105.9, long_phu 9.61/106.1, nga_nam 9.548/105.6.

## 1. Ginting et al. 2026 (RSASE 43:102143) and Open-SEA-Rice-10
- Paper: https://doi.org/10.1016/j.rsase.2026.102143. Closed access (OpenAlex `oa_status: closed`); ScienceDirect returns a Cloudflare 403 to scripts, Crossref has no abstract. I could not read the data-availability statement or the years.
- Zenodo 14627003 (CC BY 4.0) cites the 2026 paper in its description but, in the metadata edited 31 Jul 2026, still holds only `GEE_SEA_Rice_Ci10_20250110.zip` (547 MB, classes 1/2/3, "Values from 2021"), the grid shapefile and a docx. No pattern, calendar or ecosystem layer.
- Zenodo search (`Rudiyanto`, `Ginting`, `Minasny`, `Open-SEA-Rice`): only 14627003, Open-SARice-10 (20923150, South Asia, 2021, CC BY 4.0) and Open-East-Africa-Rice10 (21502815). No second Southeast Asia record. No Figshare/Mendeley link found.
- GEE app https://ee-rudiyanto.projects.earthengine.app/view/open-sea-rice-10: the served HTML is a JS shell; the asset names are not in it. Earth Engine REST `projects/ee-rudiyanto/assets` answers 401 without credentials (guessed path only, nothing readable). No accounts created.
- Climate TRACE: API (`api.climatetrace.org/v6/definitions/...`) lists sector `agriculture` and subsector `rice-cultivation`; it serves emissions by asset, not rasters. No cropping-intensity or calendar layer found (the asset endpoint I guessed 404s).
- Verdict for this source: **not downloadable beyond the 2021 intensity map.** Years of the 2026 layers unknown.

## 2. Zhao et al., ESSD 18:5583 (2026): Zenodo 10.5281/zenodo.21349862
- 30 m, South and mainland Southeast Asia, four composite periods: **1995, 2005, 2015, 2024**. Licence CC BY 4.0. Layers in the paper: distribution (binary), cropping intensity 1/2/3 (single/double/triple within the composite period), confidence 0-1. No calendar layer (peak dates are internal). Overall accuracy 83.7-87.6%.
- Files: four GeoTIFFs of 470-520 MB (uint8, LZW, 128 px tiles, EPSG:4326, 0.000269 deg), one per year, plus `India North 2024.tif` and the GEE code. The IFD sits at the end of the file, so a first range read costs about 90 s per year; then 1 tile per pin.
- Access tested by range read, `research/scripts/ricecal_zhao_points.py` (3x3 window, centre value; set of values in brackets):

| Pin | 1995 | 2005 | 2015 | 2024 |
|---|---|---|---|---|
| vinh_chau | 2 [2] | 3 [2,3] | 3 [2,3] | 2 [2,3] |
| tran_de | 1 [1] | 2 [2] | 2 [2] | 3 [3] |
| my_xuyen | 1 [1] | 2 [2] | 3 [3] | 3 [2,3] |
| long_phu | 2 [1,2] | 0 [0,2] | 3 [2,3] | 3 [2,3] |
| nga_nam | 2 [1,2,3] | 2 [2,3] | 1 [1,2] | 2 [2] |

  Class 0 is not rice. Values vary between neighbouring pixels and years, so this is a 30 m composite, not a season record. For 2024, tran_de and my_xuyen read 3 and long_phu 3, against MODIS and Open-SEA-Rice-10 (2021) = 2 at every pin: the ESSD map counts a third crop that the other two do not (compare the gate 2 notes in s1-hlsvi-prototype.md).

## 3. Chen, Liang et al.: Zenodo 15124936 (CC BY 4.0)
- "20 m maps of paddy rice cropping intensity and planting dates in Monsoon Asia, 2018 to 2021" (Sentinel-1 based; 82-84% accuracy; planting dates correlate with RiceAtlas, R2 0.92, RMSE 28 days).
- Files: `PADDYINTENSITY.zip` (4.1 GB: one tif per year 2018, 2019, 2020, 2021 plus a 4-year composite) and `PADDYPLANTINGDATE.zip` (3.3 GB): `_S1`, `_S2`, `_S3` = first, second, third round, value x 6 = day of year of approximate transplanting, 0 = no rice that round. The plantings are one set (explanation file says 2018-2021), not per year.
- Access tested: zip central directory read by range (works). Members are deflated whole files (method 8), so reading a pin means inflating a whole tif (S3 is 26 MB compressed, S2 400 MB, S1 2.8 GB); not done. Values at the pins: **not read**.
- This is the only product found that gives sowing dates per crop round for the Delta.

## 4. Not tested
- RiceAtlas (Laborte et al. 2017, Sci Data): statistics-based, province level, 2000s, CC BY; the Mekong provinces are in it. GEOGLAM crop calendars (national/admin-1 calendars, no pixel level). Only the Zenodo search for "RiceAtlas" was run (no RiceAtlas record).

## Verdict
Nothing from the 2026 Ginting paper can be used: the record has only the 2021 intensity map. The usable downloads are Zhao 2026 (crop count 1/2/3 at 30 m for 1995, 2005, 2015 and 2024, CC BY 4.0) and Chen 2018-2021 (sowing months for round 1 to 3, 20 m, CC BY 4.0, needs a 26-400 MB download per round to read pins). Neither gives harvest or fallow months directly; harvest would be sowing plus about 100 days, and fallow is what is left. Against today's MODIS peaks (2 per season at all 5 pins), Zhao 2024 says 3 at three pins, so it cannot replace MODIS for the crop count without field truth; it is useful as a long-term trend (1995 to 2024: more triple cropping) and Chen as a sowing-month cross-check for the calendar. Both are single composites, not a yearly series.
