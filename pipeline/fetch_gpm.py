"""Download NASA GPM IMERG monthly rain (Final run, v07, 0.1° ≈ 10 km) for every point of sites.points() -> data/raw/gpm.json.
The app's rain (chart, water need, scores) for Dec 2000 - Nov 2024; NASA POWER rain is the cross-check.
Needs EARTHDATA_USERNAME / EARTHDATA_PASSWORD, and "NASA GESDISC DATA ARCHIVE" approved under
Applications -> Authorized Apps in the Earthdata profile.
Run: python pipeline/fetch_gpm.py   (months already saved are skipped, so run it again to resume)
"""
import calendar
import http.cookiejar
import json
import os
import pathlib
import sys
import time
import urllib.request

from sites import points

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
OUT = RAW / "gpm.json"
URL = ("https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGM.07/{y}/"
       "3B-MO.MS.MRG.3IMERG.{y}{m:02d}01-S000000-E235959.{m:02d}.V07B.HDF5.ascii"
       "?precipitation%5B0%5D%5B{lo0}:{lo1}%5D%5B{la0}:{la1}%5D")
YEARS = range(2000, 2026)


def cell(lon, lat):
    """Grid indices of the 0.1° IMERG cell holding a point (cell centres run from -179.95 / -89.95)."""
    return round((lon + 179.95) / 0.1), round((lat + 89.95) / 0.1)


def mm_per_month(mm_per_hr, y, m):
    return round(mm_per_hr * 24 * calendar.monthrange(y, m)[1], 1)


def parse(text):
    """OPeNDAP ASCII rows 'precipitation[0][i], v, v, ...' -> list of rows (lon offset) of values (lat offset)."""
    return [[float(v) for v in ln.split(",")[1:]] for ln in text.splitlines() if ln.startswith("precipitation[0][")]


def opener():
    user, pw = os.environ.get("EARTHDATA_USERNAME"), os.environ.get("EARTHDATA_PASSWORD")
    if not user or not pw:
        sys.exit("Set EARTHDATA_USERNAME and EARTHDATA_PASSWORD first (see README, 'For teammates: updating the data').")
    pm = urllib.request.HTTPPasswordMgrWithDefaultRealm()
    pm.add_password(None, "https://urs.earthdata.nasa.gov", user, pw)
    return urllib.request.build_opener(urllib.request.HTTPBasicAuthHandler(pm),
                                       urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def main():
    out = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    cells = {s["id"]: cell(s["lon"], s["lat"]) for s in points()}
    lo0, lo1 = min(c[0] for c in cells.values()), max(c[0] for c in cells.values())
    la0, la1 = min(c[1] for c in cells.values()), max(c[1] for c in cells.values())
    op = opener()
    for y in YEARS:
        for m in range(1, 13):
            key = f"{y}-{m:02d}"
            if all(key in out.get(sid, {}) for sid in cells):
                continue
            text = None
            for attempt in range(3):  # GES DISC sometimes resets the connection; a short wait usually fixes it
                try:
                    with op.open(URL.format(y=y, m=m, lo0=lo0, lo1=lo1, la0=la0, la1=la1), timeout=120) as r:
                        text = r.read().decode("utf-8", errors="replace")
                    break
                except OSError as e:  # timeouts and HTTP errors
                    if getattr(e, "code", None) == 404:  # Final-run months appear a few months late
                        print(key, "not published yet, skipped", flush=True)
                        break
                    if attempt == 2:
                        sys.exit(f"{key}: GES DISC did not answer ({e}). Saved months are kept; run again to continue.")
                    time.sleep(10 * (attempt + 1))
            if text is None:
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
        print(y, "done", flush=True)
    print("saved", OUT)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
