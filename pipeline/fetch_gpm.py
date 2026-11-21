"""Download NASA GPM IMERG monthly rain (Final run, v07, 0.1° ≈ 10 km) for every point of sites.points() -> data/raw/gpm.json.
The app's rain (chart, water need, scores) for Dec 2000 - Nov 2024; NASA POWER rain is the cross-check.
Needs EARTHDATA_USERNAME / EARTHDATA_PASSWORD, and "NASA GESDISC DATA ARCHIVE" approved under
Applications -> Authorized Apps in the Earthdata profile.
Run: python pipeline/fetch_gpm.py   (months already saved are skipped, so run it again to resume)
Each month asks only for the cells still missing and retries on its own (NASA's cloud copy first, then GES DISC, same
product), 4 months at a time, because connections from some networks drop often.
"""
import calendar
import concurrent.futures
import http.cookiejar
import json
import os
import pathlib
import sys
import threading
import time
import urllib.request

from sites import points

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
OUT = RAW / "gpm.json"
URL = ("https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGM.07/{y}/"
       "3B-MO.MS.MRG.3IMERG.{y}{m:02d}01-S000000-E235959.{m:02d}.V07B.HDF5.ascii"
       "?precipitation%5B0%5D%5B{lo0}:{lo1}%5D%5B{la0}:{la1}%5D")
# the same granules in NASA Earthdata Cloud (OPeNDAP/DAP4); it returns nothing for a 1-cell range, so main() asks >= 2 x 2
CLOUD_URL = ("https://opendap.earthdata.nasa.gov/collections/C2723754851-GES_DISC/granules/GPM_3IMERGM.07%3A"
             "3B-MO.MS.MRG.3IMERG.{y}{m:02d}01-S000000-E235959.{m:02d}.V07B.HDF5.dap.csv"
             "?dap4.ce=/Grid/precipitation%5B0:0%5D%5B{lo0}:{lo1}%5D%5B{la0}:{la1}%5D")
YEARS = range(2000, 2026)


def cell(lon, lat):
    """Grid indices of the 0.1° IMERG cell holding a point (cell centres run from -179.95 / -89.95)."""
    return round((lon + 179.95) / 0.1), round((lat + 89.95) / 0.1)


def mm_per_month(mm_per_hr, y, m):
    return round(mm_per_hr * 24 * calendar.monthrange(y, m)[1], 1)


def parse(text):
    """OPeNDAP ASCII rows 'precipitation[0][i], v, v, ...' (cloud: '/Grid/precipitation[0][i], ...') -> list of rows
    (lon offset) of values (lat offset)."""
    return [[float(v) for v in ln.split(",")[1:]] for ln in text.splitlines()
            if ln.removeprefix("/Grid/").startswith("precipitation[0][")]


def opener():
    user, pw = os.environ.get("EARTHDATA_USERNAME"), os.environ.get("EARTHDATA_PASSWORD")
    if not user or not pw:
        sys.exit("Set EARTHDATA_USERNAME and EARTHDATA_PASSWORD first (see README, 'For teammates: updating the data').")
    pm = urllib.request.HTTPPasswordMgrWithPriorAuth()  # send the login up front: Earthdata resets requests that wait for a 401
    pm.add_password(None, "https://urs.earthdata.nasa.gov", user, pw, is_authenticated=True)
    return urllib.request.build_opener(urllib.request.HTTPBasicAuthHandler(pm),
                                       urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def main():
    out = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    cells_all = {s["id"]: cell(s["lon"], s["lat"]) for s in points()}
    todo = []
    for y in YEARS:
        for m in range(1, 13):
            cells = {sid: c for sid, c in cells_all.items() if f"{y}-{m:02d}" not in out.get(sid, {})}  # only what is missing
            if cells:
                todo.append((y, m, cells))
    opener()  # stop early if the login variables are missing
    failed = []
    with concurrent.futures.ThreadPoolExecutor(4) as pool:  # the time goes on dropped connections, not bandwidth
        for y, m, cells, lo0, la0, text in pool.map(fetch_month, todo):
            key = f"{y}-{m:02d}"
            if text is None:
                failed.append(key)
                continue
            if text == "404":
                print(key, "not published yet, skipped", flush=True)
                continue
            if not text.startswith("Dataset:"):
                sys.exit("Earthdata login failed: check the username/password and that 'NASA GESDISC DATA ARCHIVE' "
                         "is approved in the Earthdata profile (Applications -> Authorized Apps).")
            grid = parse(text)
            for sid, (i, j) in cells.items():
                v = grid[i - lo0][j - la0]
                if v >= 0:  # negative = fill value (no data)
                    out.setdefault(sid, {})[key] = mm_per_month(v, y, m)
            OUT.write_text(json.dumps(out, indent=1), encoding="utf-8")  # save every month so a stop loses nothing
            if m == 12:
                print(y, "done", flush=True)
    if failed:
        sys.exit(f"No answer for {len(failed)} months ({', '.join(failed[:6])}...). Saved months are kept; run again.")
    print("saved", OUT)


_local = threading.local()


def fetch_month(job):
    """One month for the given cells -> (y, m, cells, lo0, la0, text); text is "404" (not published) or None (no answer)."""
    y, m, cells = job
    if not hasattr(_local, "op"):
        _local.op = opener()  # one login session per worker thread
    lo0, la0 = min(c[0] for c in cells.values()), min(c[1] for c in cells.values())
    lo1, la1 = max(c[0] for c in cells.values()) + 1, max(c[1] for c in cells.values()) + 1  # >= 2 x 2 (CLOUD_URL)
    for attempt in range(10):  # dropped connections are common: the cloud copy 8 times, then GES DISC twice
        url = (CLOUD_URL if attempt < 8 else URL).format(y=y, m=m, lo0=lo0, lo1=lo1, la0=la0, la1=la1)
        try:
            with _local.op.open(url, timeout=120) as r:
                return y, m, cells, lo0, la0, r.read().decode("utf-8", errors="replace")
        except OSError as e:  # timeouts and HTTP errors
            if getattr(e, "code", None) == 404:  # Final-run months appear a few months late
                return y, m, cells, lo0, la0, "404"
            time.sleep(3)
    return y, m, cells, lo0, la0, None

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
