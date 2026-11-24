"""NASA HLS-VI v2.0 (HLSS30_VI + HLSL30_VI, 30 m greenness and water indices) at the 5 Sóc Trăng pins -> data/raw/hlsvi_<pin>.json.
{"source": {...}, "dates": {"YYYY-MM-DD": {"ndvi", "ndmi", "evi", "ndwi", "sensor": "S30"|"L30"}}}: CLEAR dates only.
A date is clear when all 9 pixels of the 3x3 window at the pin have Fmask bits 1-3 clear (cloud, cloud edge, shadow); the
values are the 3x3 medians. One MGRS tile per date and sensor; when S30 and L30 are both clear on a day, S30 counts once.
Search: CMR-STAC LPCLOUD (no login). Read: LP DAAC COGs with an Earthdata bearer token from the login in
EARTHDATA_USERNAME / EARTHDATA_PASSWORD (kept in memory only; the login host drops many connections, so it is retried);
each file answers with a 303 to a signed CloudFront URL, which rasterio then reads (research/s1-hlsvi-prototype.md §5).
Needs: pip install rasterio numpy
Run: python3 pipeline/fetch_hlsvi.py   (dates already saved are skipped; a pin is saved only when all its reads worked; exits 1 on any failure)
"""
import base64
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import numpy as np

import sites

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
STAC = "https://cmr.earthdata.nasa.gov/stac/LPCLOUD/search"
FIRST = "2015-12-01"  # Sentinel-2 over the pins starts 2015-12-18; the chart is Dec-Nov seasons from Dec 2015
CLOUD_BITS = 0b1110   # Fmask bits 1 (cloud), 2 (adjacent), 3 (shadow): the rule in pipeline/hls.py
FILL = -19999
BANDS = ("NDVI", "NDWI", "NDMI", "EVI")
RECHECK_DAYS = 30     # a rerun searches from this long before the last search, for granules published late
SOURCE = {"product": "NASA HLS-VI v2.0: HLSS30_VI (Sentinel-2) + HLSL30_VI (Landsat 8/9), 30 m",
          "url": "https://lpdaac.usgs.gov/products/hlsl30_viv002/", "window": "median of the 3x3 pixels at the pin",
          "clear": "Fmask bits 1-3 clear on all 9 pixels"}
TOKEN = [""]


def retry(f, n=8):
    for i in range(n):
        try:
            return f()
        except Exception as e:
            err = e
            time.sleep(min(2 ** i, 30))
    raise err


def bearer():
    u, p = os.environ["EARTHDATA_USERNAME"], os.environ["EARTHDATA_PASSWORD"]
    req = urllib.request.Request("https://urs.earthdata.nasa.gov/api/users/find_or_create_token", method="POST",
                                 headers={"Authorization": "Basic " + base64.b64encode(f"{u}:{p}".encode()).decode()})
    return retry(lambda: json.load(urllib.request.urlopen(req, timeout=60)), 30)["access_token"]


def pick(features):
    """One MGRS tile per date and sensor (neighbouring tiles overlap), S30 first so that it wins a day both sensors saw: [(date, 'S30'|'L30', item)]."""
    seen, out = set(), []
    for f in sorted(features, key=lambda f: (f["id"].split(".")[1] != "S30", f["id"])):  # id: HLS.S30.T48PWR.2025017T...
        key = (f["properties"]["datetime"][:10], f["id"].split(".")[1])
        if key not in seen:
            seen.add(key)
            out.append((key[0], key[1], f))
    return out


def is_clear(fmask):
    m = np.asarray(fmask)
    return bool(((m & CLOUD_BITS) == 0).all() and (m != 255).all())


def make_record(sensor, win):
    """win = {"Fmask": 3x3, "NDVI": 3x3, ...} (raw int16 for the indices) -> the saved record, or None when the date is not clear or a band is all fill."""
    if not is_clear(win["Fmask"]):
        return None
    rec = {}
    for band in BANDS:
        a = np.asarray(win[band])
        v = a[a != FILL]
        if not v.size:
            return None
        rec[band.lower()] = round(float(np.median(v)) * 0.0001, 4)
    return dict(rec, sensor=sensor)


def search(site, first, last):
    d = 0.0005
    url = (f"{STAC}?collections=HLSS30_VI_2.0,HLSL30_VI_2.0&bbox={site['lon'] - d},{site['lat'] - d},{site['lon'] + d},{site['lat'] + d}"
           f"&datetime={first}T00:00:00Z/{last}T23:59:59Z&limit=250")
    out = []
    while url:
        page = retry(lambda: json.load(urllib.request.urlopen(url, timeout=120)))
        out += page["features"]
        url = next((l["href"] for l in page["links"] if l["rel"] == "next"), None)
    return out


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a):
        return None


def signed(href):
    """LP DAAC answers the bearer token with a 303 to a signed CloudFront URL; GDAL fails if it follows that itself."""
    try:
        urllib.request.build_opener(_NoRedirect).open(urllib.request.Request(href, headers={"Authorization": "Bearer " + TOKEN[0], "Range": "bytes=0-0"}), timeout=60)
    except urllib.error.HTTPError as e:
        if e.code in (302, 303, 307):
            return e.headers["Location"]
        raise
    raise RuntimeError("no redirect for " + href)


def window(href, site):
    import rasterio
    from rasterio.warp import transform

    def go():
        with rasterio.open(signed(href)) as ds:
            x, y = transform("EPSG:4326", ds.crs, [site["lon"]], [site["lat"]])
            r, c = ds.index(x[0], y[0])
            return ds.read(1, window=((r - 1, r + 2), (c - 1, c + 2)))
    return retry(go, 4)


def job(args):
    day, sensor, item, site = args
    win = {"Fmask": window(item["assets"]["Fmask"]["href"], site)}
    if is_clear(win["Fmask"]):
        win.update({b: window(item["assets"][b]["href"], site) for b in BANDS})
    return day, make_record(sensor, win)


def fetch_pin(site, today):
    path = RAW / f"hlsvi_{site['id']}.json"
    old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"dates": {}}
    searched = old.get("source", {}).get("searched_to")
    first = max(FIRST, (date.fromisoformat(searched) - timedelta(days=RECHECK_DAYS)).isoformat()) if searched else FIRST
    todo = [(d, s, it, site) for d, s, it in pick(search(site, first, today)) if d not in old["dates"]]
    dates = dict(old["dates"])
    with ThreadPoolExecutor(6) as ex:
        for day, rec in ex.map(job, todo):  # a failed read raises here and nothing is saved for this pin
            if rec and day not in dates:  # S30 items come first in todo, so S30 wins a day both sensors saw
                dates[day] = rec
    out = {"source": dict(SOURCE, searched_to=today), "dates": dict(sorted(dates.items()))}
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    tmp.replace(path)
    return len(todo), len(dates) - len(old["dates"])


def main():
    TOKEN[0] = bearer()
    os.environ.update(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_MAX_RETRY="5", GDAL_HTTP_RETRY_DELAY="2")
    today, failed = date.today().isoformat(), 0
    for s in sites.SITES:
        t0 = time.time()
        try:
            n, new = fetch_pin(s, today)
            print(f"{s['id']}: {n} dates read, {new} new clear, {round(time.time() - t0)} s", flush=True)
        except Exception as e:
            failed += 1
            print(f"FAILED {s['id']}: {e!r}", file=sys.stderr, flush=True)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
