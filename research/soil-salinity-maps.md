# Soil salinity sources for southern Vietnam (research, 2026-11-21)

## Retrieved point values (best usable source)

Source: FAO GLOSIS / GSNmap Vietnam, `VN-GSNM-ECX-2024`, "Electrical conductivity (Vietnam, dS/m, 0.0022457 deg, 2024)", depth 0-30 cm, statistic MEAN (also SDEV). Float32, nodata -9999, EPSG:4326, 3262 x 6612 px, extent lon 102.1429-109.4684, lat 8.5417-23.3903.

Request URLs (no login, plain HTTPS, Range requests honoured, HTTP 206):
- MEAN: https://storage.googleapis.com/fao-gismgr-glosis-data/DATA/GLOSIS/MAPSET/VN-GSNM-ECX-2024/GLOSIS.VN-GSNM-ECX-2024.D-0-30.D-MEAN.tif (32,092,936 bytes)
- SDEV: same path, `...D-0-30.D-SDEV.tif` (32,657,785 bytes)
- Metadata: https://data.apps.fao.org/gismgr/api/v2/catalog/workspaces/GLOSIS/mapsets/VN-GSNM-ECX-2024/rasters (JSON)

File structure (read from the first 64 KB via `Range: bytes=0-65535`): BigTIFF (II, 43), tiled 256x256, **LZW compression (tag 259 = 5)**, no predictor, single band Float32. Not a COG with overviews that I checked. Single-pixel read = 1 range request for the header + 1 range request for the one tile (tile sizes 20-280 KB compressed).

Pixel = floor((lon-102.1429394)/0.0022457), floor((23.3903145-lat)/0.0022457). I did this with my own stdlib-only script (struct + a ~25-line LZW decoder; `zlib` cannot read LZW, so the project needs a small LZW decoder). Script: research/scripts/fao_glosis_point.py

| Point | lon, lat | pixel (x,y) | EC 0-30 cm MEAN (dS/m) | SDEV (dS/m) |
|---|---|---|---|---|
| Rạch Giá | 105.0809, 10.0125 | 1308, 5957 | 9.502 | 4.467 |
| Vĩnh Châu | 105.98, 9.33 | 1708, 6260 | 9.286 | 2.722 |
| Trần Đề | 106.20, 9.52 | 1806, 6176 | 9.377 | 2.330 |

**Red flag: these values are not credible as field-soil EC.** Sanity probes of the same layer: Cần Thơ (105.78, 10.03) 9.98; Đà Lạt highlands (108.44, 11.94) 7.96; Hồ Chí Minh (106.65, 10.8) 11.31; Tây Ninh-ish inland (106.0, 10.9) NaN. Every pixel reads 8-11 dS/m, including inland and highland sites that cannot be that saline, and Rạch Giá (coastal, saline) is not distinguishable from Cần Thơ. Decoding is correct (floats sane, nodata appears as NaN), so the map itself is nearly flat and looks like a poorly-constrained model. Unit is "dS/m" but the type of extract (ECe vs EC1:5) is not stated in the metadata. Do not show these numbers to farmers as "your field's salinity".

## Source table

| Source | Measures | Licence | Programmatic point query without login | Result for 3 points |
|---|---|---|---|---|
| FAO GLOSIS `VN-GSNM-ECX-2024` (GSNmap Vietnam, AFACI project) | Soil EC, dS/m, 0-30 cm, mean and sd, ~250 m, 2024 | not read from the metadata (the FAO catalogue licenses its national GSAS layers CC BY 4.0 or CC BY-NC-SA 4.0; check before use) | Yes: public GCS object, Range requests OK, 32 MB BigTIFF, LZW tiles. Single-pixel read needs 2 small range requests plus an LZW decoder. No WCS/WMS tested | Retrieved (above), values implausible |
| FAO GSASmap Vietnam `VN-GSAS-ECX-2021` / `VN-GSAS-SALT-2021` / `VN-GSAS-NAEXC-2021` (1 km, 0.0083333 deg, 0-30 and 30-100 cm, 2021) | EC, salinity class, exchangeable Na | catalogue says CC BY 4.0 or CC BY-NC-SA 4.0 for other countries' GSAS layers; not verified for VN | Catalogue entries exist (https://data.apps.fao.org/gismgr/api/v2/catalog/workspaces/GLOSIS/mapsets/VN-GSAS-ECX-2021) but `/rasters` returns `items: []` and the bucket folder `DATA/GLOSIS/MAPSET/VN-GSAS-ECX-2021/` is empty; guessed `.tif` URLs gave 404 | not retrieved |
| FAO GSASmap global (v1.0, 2021) | Topsoil 0-30 and subsoil 30-100 cm EC, ESP, pH, salt-affected classes; country-submitted maps, 118 countries, 1 km | per-country; mostly CC BY 4.0 | FAO page is https://www.fao.org/global-soil-partnership/gsasmap/en/ ; data platform https://data.apps.fao.org/glosis/ . Per-country layers in the GLOSIS bucket (BD, KH, LA, MN, PH, VN listed). No global mosaic found | not retrieved (Vietnam raster missing, see above) |
| Hassani et al. 2020 PNAS / Zenodo update "1980 to 2024" (doi 10.5281/zenodo.16430116; also 10.5281/zenodo.13865595) | global ECe/ESP annual rasters 1980-2024, 1 km | CC BY 4.0 | Direct Zenodo GeoTIFFs, one per year, ~440-465 MB each (e.g. ECe_1998.tif 463,747,295 bytes). Zenodo supports Range requests but I did NOT probe the header, compression or a pixel | not retrieved (not attempted) |
| Ivushkin et al. 2019 RSE | global soil salinity from remote sensing | not checked | not checked | not retrieved |
| Zenodo CoastSal v1.0 (doi 10.5281/zenodo.20802658) | global 250 m near-surface soil salinity for coastal saltmarsh/mangrove only | CC BY 4.0 | 316 MB tif, not probed. Only mangrove/saltmarsh pixels, so not paddy | not retrieved |
| ISRIC SoilGrids v2 | No salinity/EC layer. Property list from https://rest.isric.org/soilgrids/v2.0/properties/layers: bdod, cec, cfvo, clay, nitrogen, ocd, ocs, phh2o, sand, silt, soc, wv0010, wv0033, wv1500 | CC BY 4.0 | REST point query works without login (e.g. `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=105.0809&lat=10.0125&property=phh2o&depth=0-5cm&value=mean` returned `mean: null` for Rạch Giá - null because that pixel is masked); `property=ec` gives Internal Server Error | n/a (no salinity layer) |
| FAO "Excess salts from HWSD v1.2" (catalog 40db0008-...) | coarse HWSD soil-quality class, global | CC BY-NC-SA 4.0 | tif https://storage.googleapis.com/fao-maps-catalog-data/geonetwork/gsoc/SQ/sq5.tif ; WMS https://data.apps.fao.org/map/gsrv/gsrv1/gsoc/wms | not tried; ~1 km, categorical, not useful for seasonal salinity |
| Vietnamese national/Mekong soil salinity maps (SIWRR/VAWR, Cần Thơ Univ., Ministry soil survey) | Not found as open data | - | Only paper maps / journal figures surfaced (ctujsvn.ctu.edu.vn, vjs.ac.vn articles in search results, not read). No API found | not retrieved |

## Validity limits (what I could verify)
- GSNmap/GSASmap are static maps built from legacy soil profiles by digital soil mapping. They do not represent seasonal salinity: no time dimension, so they cannot show dry-season peaks in paddy fields or the effect of flooding/irrigation. I read no accuracy statement for the Mekong Delta; the VN 2024 layer carries an SDEV raster (4.5, 2.7, 2.3 dS/m at the three points), i.e. the model's own uncertainty is about 25-50% of the value.
- The flat 8-11 dS/m across all of Vietnam (above) indicates the 2024 EC layer is not usable for point decisions.
- Hassani/Ivushkin: global 1 km scale, built mostly from sparse arid-region samples; not verified here for the delta.

## What was not done
FAO WMS/WCS GetFeatureInfo endpoints (data.apps.fao.org/map/gsrv) not tested for GSNM; Hassani/Ivushkin pixel reads; licence text of the VN 2024 mapset. Several FAO web pages returned 502/503 intermittently.

## Hassani (Zenodo 10.5281/zenodo.16430116, CC BY 4.0) — probed 2026-11-21
ECe (dS/m, scale 0.001, nodata 4294967295), 1 km, one GeoTIFF per year 1980-2024, LZW strips of 1 row (43200 px).
Reader: research/scripts/hassani_point.py <url> '<[[name,lon,lat],...]>' <R>  (median of the (2R+1)^2 km box, nodata dropped).
11x11 km medians, 2024: Rạch Giá 1.36 (58/121 valid), Vĩnh Châu 1.73, Trần Đề 2.46, Châu Đốc 1.57, Cao Lãnh 1.35,
Cần Thơ 1.14, Bạc Liêu 0.94, Cà Mau tip 3.32, Đà Lạt 0.87, Hà Nội 1.29.
By year (Rạch Giá / Vĩnh Châu / Châu Đốc / Cà Mau tip): 2016 1.28/1.11/0.52/1.98; 2020 0.51/1.19/0.49/1.59;
2022 0.56/0.87/0.46/1.16; 2024 1.36/1.73/1.57/3.32.
Problems: fresh Châu Đốc ≈ salty Vĩnh Châu; Bạc Liêu below Châu Đốc in 2024; 2020 (worst delta drought) gives Rạch Giá its
lowest value; 2023-24 files (larger) jump everywhere (Châu Đốc x3). Annual, not dry-season. Half the Rạch Giá box is nodata.

## Outcome (Nov 2026)
Neither map used; Kiên Giang stays "no estimate". Noted in SOURCES.md.
Scripts are stdlib Python: `python3 research/scripts/hassani_point.py <ECe_YEAR.tif url> '[["name",lon,lat]]' 5` (median of an 11×11 km box). `fao_glosis_point.py <url>` reads three fixed points; edit the list to change them.
