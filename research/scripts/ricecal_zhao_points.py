"""Zhao et al. (ESSD 18, 5583, 2026) 30 m paddy rice maps (Zenodo 10.5281/zenodo.21349862): class at the app pins, by HTTP range read.
Years 1995, 2005, 2015, 2024. Reuses HttpFile from chirps_points.py. Run: python3 research/scripts/ricecal_zhao_points.py [info]"""
import json, os, sys, urllib.parse
import numpy as np, tifffile
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "pipeline"))
from chirps_points import HttpFile, get
import sites

REC = "https://zenodo.org/api/records/21349862/files/"
def pts():
    return json.load(open(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "data", "sites.json")))["sites"]

for y in (1995, 2005, 2015, 2024):
    url = REC + urllib.parse.quote(f"South and Southeast Asia Paddy Rice {y}.tif") + "/content"
    tf = tifffile.TiffFile(HttpFile(url)); p = tf.pages[0]
    sx, sy = p.tags["ModelPixelScaleTag"].value[:2]; x0, y0 = p.tags["ModelTiepointTag"].value[3:5]
    print(y, p.shape, p.dtype, "tile", p.tilewidth, p.tilelength, "scale", sx, sy, "origin", x0, y0, "comp", p.compression.name, "nodata", p.tags.get("GDAL_NODATA") and p.tags["GDAL_NODATA"].value)
    if "info" in sys.argv: continue
    for q in pts():
        col, row = int((q["lon"] - x0) / sx), int((y0 - q["lat"]) / sy)
        r = []
        # 3x3 window; tile-aware read of each pixel's tile
        vals = []
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                rr, cc = row + dr, col + dc
                if p.is_tiled:
                    tw, tl = p.tilewidth, p.tilelength; across = -(-p.imagewidth // tw); ti = (rr // tl) * across + cc // tw
                    seg, _, shape = p.decode(get(url, p.dataoffsets[ti], p.dataoffsets[ti] + p.databytecounts[ti]), ti)
                    vals.append(int(seg.reshape(shape[-3], shape[-2])[rr % tl, cc % tw]))
                else:
                    rps = p.rowsperstrip; si = rr // rps
                    seg, _, shape = p.decode(get(url, p.dataoffsets[si], p.dataoffsets[si] + p.databytecounts[si]), si)
                    vals.append(int(seg.reshape(-1, p.imagewidth)[rr % rps, cc]))
        print("  ", q["id"], "centre", vals[4], "3x3", sorted(set(vals)))
