"""Download CHIRPS v3.0 monthly rain (Climate Hazards Center, UC Santa Barbara; 0.05° ≈ 5 km) for every point of sites.points() -> data/raw/chirps.json.
The app's rain (chart, water need, scores): Jan 1981 to the latest published month (build.py averages over PERIOD). NASA GPM IMERG stays as the cross-check.
No login, no GDAL: tifffile reads the cloud-optimised GeoTIFF header over HTTP range requests, then only the one tile holding the points is fetched.
Needs: pip install tifffile imagecodecs
Run: python pipeline/fetch_chirps.py   (months already saved are skipped and each month is saved at once, so run it again to resume)
Exits 1 if any month but the newest is missing; a 404 on the newest month means CHC has not published it yet.
"""
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import numpy as np
import tifffile

from sites import points

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
OUT = RAW / "chirps.json"
URL = "https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/cogs/chirps-v3.0.{y}.{m:02d}.cog"
FIRST = (1981, 1)


def get(url, a, b, size=None):
    """Bytes a..b-1 of url; with size=[] also appends the file size from Content-Range. Backs off on HTTP 429; a 404 is raised at once."""
    req = urllib.request.Request(url, headers={"Range": f"bytes={a}-{b - 1}"})
    for i in range(8):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
                if size is not None:
                    size.append(int(r.headers["Content-Range"].split("/")[1]))
            assert len(data) == b - a or size is not None, (url, a, b, len(data))
            return data
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise
            err = e
            time.sleep(2 ** i if e.code == 429 else 1)
        except Exception as e:
            err = e
            time.sleep(1)
    raise err


class HttpFile:
    """Read-only seekable file over HTTP Range requests, 256 KiB blocks, enough for tifffile to parse the header."""
    BLOCK = 1 << 18

    def __init__(self, url):
        self.url, self.pos, size = url, 0, []
        self.cache = {0: get(url, 0, self.BLOCK, size)}  # first block also gives the size: no HEAD request
        self.size = size[0]

    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else self.pos + off if whence == 1 else self.size + off
        return self.pos

    def tell(self):
        return self.pos

    def read(self, n=-1):
        end = self.size if n < 0 else min(self.size, self.pos + n)
        out = b""
        while self.pos < end:
            k = self.pos // self.BLOCK
            if k not in self.cache:
                self.cache[k] = get(self.url, k * self.BLOCK, min(self.size, (k + 1) * self.BLOCK))
            blk = self.cache[k][self.pos - k * self.BLOCK:end - k * self.BLOCK]
            out += blk
            self.pos += len(blk)
        return out

    def readable(self): return True
    def seekable(self): return True
    def close(self): pass


def cell(lon, lat, geo):
    """(col, row) of the cell holding a point; geo = (x0, dx, y0, dy): west edge, cell width, north edge, cell height.
    Cells are half-open: a point exactly on an edge belongs to the cell east of it (longitude) and south of it (latitude).
    The ratio is rounded to 6 places first so 105.95 / 0.05 is not 2118.9999999."""
    x0, dx, y0, dy = geo
    return int(round((lon - x0) / dx, 6) // 1), int(round((y0 - lat) / dy, 6) // 1)


def month(y, m, pts):
    """{point id: mm} for one month, from the one tile that holds the points. Raises HTTPError 404 when the month is not published."""
    url = URL.format(y=y, m=m)
    with tifffile.TiffFile(HttpFile(url)) as tf:
        p = tf.pages[0]  # full-resolution image; later pages are overviews
        sx, sy = (round(v, 6) for v in p.tags["ModelPixelScaleTag"].value[:2])  # float32 tag: 0.05000000074
        x0, y0 = p.tags["ModelTiepointTag"].value[3:5]
        tw, tl = p.tilewidth, p.tilelength
        across = -(-p.imagewidth // tw)
        out, tiles = {}, {}
        for q in pts:
            col, row = cell(q["lon"], q["lat"], (x0, sx, y0, sy))
            ti = (row // tl) * across + col // tw
            if ti not in tiles:
                off, cnt = p.dataoffsets[ti], p.databytecounts[ti]
                seg, _, shape = p.decode(get(url, off, off + cnt), ti)
                tiles[ti] = seg.reshape(shape[-3], shape[-2])  # (rows, cols) of one band
            v = float(tiles[ti][row % tl, col % tw])
            if v < -9000 or np.isnan(v):
                raise ValueError(f"no CHIRPS value for {q['id']} in {y}-{m:02d}: the point is on a no-data (sea) cell")
            out[q["id"]] = round(v, 1)
        return out


def months_to_fetch(today=None):
    """Every month from Jan 1981 to the one before today's (CHC publishes a month in the third week of the next)."""
    today = today or date.today()
    y, m, out = *FIRST, []
    while (y, m) < (today.year, today.month):
        out.append((y, m))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


def main():
    pts = points()
    data = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    data = {q["id"]: data.get(q["id"], {}) for q in pts}
    months = months_to_fetch()
    todo = [(y, m) for y, m in months if any(f"{y}-{m:02d}" not in data[q["id"]] for q in pts)]

    def one(ym):
        try:
            return ym, month(*ym, pts), None
        except Exception as e:
            return ym, None, e

    failed = []
    with ThreadPoolExecutor(3) as ex:  # 8 threads draws HTTP 429 from the CHC server
        for ym, vals, err in ex.map(one, todo):  # ex.map yields in order, so the file grows month by month
            key = f"{ym[0]}-{ym[1]:02d}"
            if err is not None:
                newest_404 = ym == months[-1] and isinstance(err, urllib.error.HTTPError) and err.code == 404
                print(f"{'skip (not published yet)' if newest_404 else 'FAILED'} {key}: {err}")
                if not newest_404:
                    failed.append(key)
                continue
            for pid, v in vals.items():
                data[pid][key] = v
            OUT.write_text(json.dumps(data, indent=0, sort_keys=True), encoding="utf-8")
    print(f"fetched {len(todo) - len(failed)} of {len(todo)} months -> {OUT}; latest saved {max(data[pts[0]['id']], default='none')}")
    if failed:
        sys.exit(f"{len(failed)} months failed, e.g. {failed[:3]}: run again")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
