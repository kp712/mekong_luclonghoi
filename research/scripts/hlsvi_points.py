"""NASA HLS-VI v2.0 (HLSS30_VI + HLSL30_VI, 30 m) access test at the 5 Soc Trang pins, by COG window reads from LP DAAC.
Search: CMR-STAC LPCLOUD (no login). Read: data.lpdaac.earthdatacloud.nasa.gov with an Earthdata bearer token (EARTHDATA_USERNAME / EARTHDATA_PASSWORD ->
urs find_or_create_token); each file's 303 to a signed CloudFront URL is resolved here, then GDAL reads that URL with no header.
Per pin per date (one MGRS tile per date and sensor): Fmask of the 3x3 window around the pin; the date is CLEAR when all
9 pixels have Fmask bits 1-3 clear (as pipeline/hls.py). For clear dates in the NDVI years, the 3x3 median NDVI and NDWI.
Output: <out>/hlsvi.json {pin: {"YYYY-MM-DD S30": {"clear": bool, "ndvi": x, "ndwi": x}}} and <out>/hlsvi_cost.json.
Run: pip install rasterio; python3 research/scripts/hlsvi_points.py <outdir> <first YYYY-MM-DD> <last YYYY-MM-DD> [NDVI years, e.g. 2024,2025]
(research/s1-hlsvi-prototype.md)"""
import base64, json, os, sys, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np, rasterio
from rasterio.warp import transform

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "pipeline"))
import sites

STAC = "https://cmr.earthdata.nasa.gov/stac/LPCLOUD/search"
CLOUD_BITS = 0b1110  # Fmask bits 1 (cloud), 2 (adjacent), 3 (shadow): the rule in pipeline/hls.py
FILL = -19999


def retry(f, n=8):
    for i in range(n):
        try:
            return f()
        except Exception as e:
            err = e
            time.sleep(min(2 ** i, 30))
    raise err


def bearer():
    """Earthdata bearer token; the urs host drops many proxied connections, so retry."""
    u, p = os.environ["EARTHDATA_USERNAME"], os.environ["EARTHDATA_PASSWORD"]
    req = urllib.request.Request("https://urs.earthdata.nasa.gov/api/users/find_or_create_token", method="POST",
                                 headers={"Authorization": "Basic " + base64.b64encode(f"{u}:{p}".encode()).decode()})
    return retry(lambda: json.load(urllib.request.urlopen(req, timeout=60)), 30)["access_token"]


def search(site, first, last):
    d = 0.0005
    url = (f"{STAC}?collections=HLSS30_VI_2.0,HLSL30_VI_2.0&bbox={site['lon'] - d},{site['lat'] - d},{site['lon'] + d},{site['lat'] + d}"
           f"&datetime={first}T00:00:00Z/{last}T23:59:59Z&limit=250")
    out = []
    while url:
        page = retry(lambda: json.load(urllib.request.urlopen(url, timeout=120)))
        out += page["features"]
        url = next((l["href"] for l in page["links"] if l["rel"] == "next"), None)
    seen, keep = set(), []
    for f in sorted(out, key=lambda f: f["id"]):  # one MGRS tile per date and sensor (T48PWR and T48PXR overlap)
        key = (f["properties"]["datetime"][:10], f["id"].split(".")[1])
        if key not in seen:
            seen.add(key)
            keep.append(f)
    return keep


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


TOKEN = [""]


def window(href, site):
    """(3x3 array, tile bytes) at the pin."""
    def go():
        with rasterio.open(signed(href)) as ds:
            x, y = transform("EPSG:4326", ds.crs, [site["lon"]], [site["lat"]])
            r, c = ds.index(x[0], y[0])
            bx, by = ds.block_shapes[0][1], ds.block_shapes[0][0]
            nb = int(ds.get_tag_item(f"BLOCK_SIZE_{c // bx}_{r // by}", "TIFF", bidx=1) or 0)
            return ds.read(1, window=((r - 1, r + 2), (c - 1, c + 2))), nb
    return retry(go, 4)


def job(args):
    item, site, ndvi_years = args
    m, nb = window(item["assets"]["Fmask"]["href"], site)
    rec, nbytes, nread = {"clear": bool(((m & CLOUD_BITS) == 0).all() and (m != 255).all())}, nb, 1
    if rec["clear"] and item["properties"]["datetime"][:4] in ndvi_years:
        for band in ("NDVI", "NDWI"):
            a, nb = window(item["assets"][band]["href"], site)
            v = a[a != FILL]
            rec[band.lower()] = round(float(np.median(v)) * 0.0001, 4) if v.size else None
            nbytes, nread = nbytes + nb, nread + 1
    return item, site, rec, nbytes, nread


def main(outdir, first, last, ndvi_years=""):
    t0 = time.time()
    TOKEN[0] = bearer()
    os.environ.update(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_MAX_RETRY="5", GDAL_HTTP_RETRY_DELAY="2")
    jobs = [(it, s, ndvi_years.split(",")) for s in sites.SITES for it in search(s, first, last)]
    t_search = round(time.time() - t0)
    print(len(jobs), "pin-dates, search", t_search, "s", file=sys.stderr)
    out, cost = {s["id"]: {} for s in sites.SITES}, {"search_s": t_search, "reads": 0, "tile_bytes": 0, "failed": 0}
    with ThreadPoolExecutor(6) as ex:
        futs = [ex.submit(job, j) for j in jobs]
        for k, f in enumerate(futs):
            try:
                it, s, rec, nb, nr = f.result()
            except Exception as e:
                cost["failed"] += 1
                print("FAILED", e, file=sys.stderr)
                continue
            out[s["id"]][it["properties"]["datetime"][:10] + " " + it["id"].split(".")[1]] = rec
            cost["reads"] += nr
            cost["tile_bytes"] += nb
            if k % 200 == 0:
                print(k, len(jobs), round(time.time() - t0), "s", file=sys.stderr)
    cost["seconds"] = round(time.time() - t0)
    tag = f"{first[:4]}_{last[:4]}"
    json.dump({p: dict(sorted(v.items())) for p, v in out.items()}, open(os.path.join(outdir, f"hlsvi_{tag}.json"), "w"), indent=0)
    json.dump(cost, open(os.path.join(outdir, f"hlsvi_cost_{tag}.json"), "w"), indent=1)
    print(cost)


if __name__ == "__main__":
    main(*sys.argv[1:])
