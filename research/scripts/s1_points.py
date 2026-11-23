"""Sentinel-1 RTC gamma0 VH and VV (10 m) at the 5 Soc Trang pins, from Microsoft Planetary Computer, by COG window reads.
One relative orbit only (descending track 18: the one track covering Oct 2015 onward), so the viewing geometry is the same on every date.
Per pin per date: median of a 5x5 pixel window (50 m) of linear gamma0, then dB. Anonymous access: a SAS token from the PC token API.
Output: <out>/s1_track18.json {pin: {"YYYY-MM-DD": [vh_db, vv_db, sat, approx incidence deg]}} and <out>/s1_cost.json.
Run: pip install rasterio; python3 research/scripts/s1_points.py <outdir> [first YYYY-MM-DD] [last YYYY-MM-DD]
(research/s1-hlsvi-prototype.md)"""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np, rasterio
from rasterio.warp import transform
from rasterio.windows import Window

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "pipeline"))
import sites

STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
TOKEN = "https://planetarycomputer.microsoft.com/api/sas/v1/token/sentinel-1-rtc"
TRACK, HALF = 18, 2  # 5x5 window
IW_NEAR, IW_FAR = 29.1, 46.0  # IW swath incidence range (ESA Sentinel-1 user guide); shortcut: linear across the frame footprint
os.environ.update(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tiff", GDAL_HTTP_MAX_RETRY="5", GDAL_HTTP_RETRY_DELAY="2")


def search(first, last):
    lons, lats = [s["lon"] for s in sites.SITES], [s["lat"] for s in sites.SITES]
    body = {"collections": ["sentinel-1-rtc"], "bbox": [min(lons), min(lats), max(lons), max(lats)],
            "datetime": f"{first}/{last}", "limit": 1000, "query": {"sat:relative_orbit": {"eq": TRACK}}}
    out = []
    while True:
        req = urllib.request.Request(STAC, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        d = json.load(urllib.request.urlopen(req, timeout=120))
        out += d["features"]
        nxt = [l for l in d["links"] if l["rel"] == "next"]
        if not nxt:
            return out
        body = nxt[0]["body"]


def lon_span(ring, lat):
    """West and east longitude where the footprint ring crosses this latitude, or None if it does not."""
    xs = [x0 + (lat - y0) * (x1 - x0) / (y1 - y0) for (x0, y0), (x1, y1) in zip(ring, ring[1:]) if (y0 - lat) * (y1 - lat) < 0]
    return (min(xs), max(xs)) if len(xs) >= 2 else None


def incidence(item, site):
    """Approximate incidence angle at the pin, or None if the pin is outside the frame. Descending passes look west, so near range is east."""
    span = lon_span(item["geometry"]["coordinates"][0], site["lat"])
    if not span or not span[0] < site["lon"] < span[1]:
        return None
    w, e = span
    frac = (e - site["lon"]) / (e - w) if item["properties"]["sat:orbit_state"] == "descending" else (site["lon"] - w) / (e - w)
    return round(IW_NEAR + frac * (IW_FAR - IW_NEAR), 1)


_tok = {"t": 0, "v": ""}


def token():
    if time.time() - _tok["t"] > 1200:  # tokens last about 45 min
        _tok.update(t=time.time(), v=json.load(urllib.request.urlopen(TOKEN, timeout=60))["token"])
    return _tok["v"]


def read(href, site):
    """(median linear gamma0 of the 5x5 window or None, bytes of the tile read)."""
    for i in range(4):
        try:
            with rasterio.open(href + "?" + token()) as ds:
                x, y = transform("EPSG:4326", ds.crs, [site["lon"]], [site["lat"]])
                r, c = ds.index(x[0], y[0])
                a = ds.read(1, window=Window(c - HALF, r - HALF, 2 * HALF + 1, 2 * HALF + 1), boundless=True, fill_value=ds.nodata)
                nb = int(ds.get_tag_item(f"BLOCK_SIZE_{c // 512}_{r // 512}", "TIFF", bidx=1) or 0)
                v = a[(a > 0) & (a != ds.nodata)]
                return (float(np.median(v)) if v.size >= 13 else None), nb  # at least half the window valid
        except Exception as e:
            err = e
            time.sleep(2 ** i)
    print("FAILED", href[-60:], site["id"], err, file=sys.stderr)
    return None, 0


def job(args):
    item, site, inc = args
    out = []
    for band in ("vh", "vv"):
        out.append(read(item["assets"][band]["href"], site))
    return item, site, inc, out


def main(outdir, first="2015-10-01", last="2026-11-23"):
    t0 = time.time()
    items = search(first, last)
    jobs = [(it, s, inc) for it in items for s in sites.SITES if (inc := incidence(it, s)) is not None]
    print(len(items), "items,", len(jobs), "pin reads x2 bands", file=sys.stderr)
    series, nbytes, nread = {s["id"]: {} for s in sites.SITES}, 0, 0
    with ThreadPoolExecutor(8) as ex:
        for k, (it, s, inc, ((vh, b1), (vv, b2))) in enumerate(ex.map(job, jobs)):
            nbytes += b1 + b2
            nread += 2
            day = it["properties"]["datetime"][:10]
            if vh and vv and day not in series[s["id"]]:
                series[s["id"]][day] = [round(10 * np.log10(vh), 2), round(10 * np.log10(vv), 2), it["id"][:3], inc]
            if k % 200 == 0:
                print(k, len(jobs), round(time.time() - t0), "s", file=sys.stderr)
    series = {p: dict(sorted(v.items())) for p, v in series.items()}
    json.dump(series, open(os.path.join(outdir, "s1_track18.json"), "w"), indent=0)
    cost = {"items": len(items), "reads": nread, "tile_bytes": nbytes, "seconds": round(time.time() - t0), "threads": 8}
    json.dump(cost, open(os.path.join(outdir, "s1_cost.json"), "w"), indent=1)
    print(cost, {p: len(v) for p, v in series.items()})


if __name__ == "__main__":
    main(*sys.argv[1:])
