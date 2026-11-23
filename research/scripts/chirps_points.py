"""CHIRPS v3.0 and v2.0 monthly rain (mm) at every sites.points() point, by HTTP range reads of the CHC cloud-optimised GeoTIFFs.
No GDAL: tifffile parses the TIFF header, then only the one tile holding the points is fetched and decoded.
Output: <out>/chirps_v3.json and chirps_v2.json, {point id: {"YYYY-MM": mm}} like data/raw/gpm.json.
Run: pip install tifffile imagecodecs; python3 research/scripts/chirps_points.py <outdir> [first YYYY-MM] [last YYYY-MM] [points.json]
(research/research_notes/Mekong app data source alternatives/rain_pin_test.md)"""
import json, os, sys, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np, tifffile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "pipeline"))
import sites

URL = {"v3": "https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/cogs/chirps-v3.0.{y}.{m:02d}.cog",
       "v2": "https://data.chc.ucsb.edu/products/CHIRPS/v2.0/global_monthly/cogs/chirps-v2.0.{y}.{m:02d}.cog"}


def get(url, a, b, size=None):
    """Bytes a..b-1 of url; with size=[] also appends the file size from Content-Range. Backs off on HTTP 429."""
    req = urllib.request.Request(url, headers={"Range": f"bytes={a}-{b - 1}"})
    for i in range(8):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
                if size is not None:
                    size.append(int(r.headers["Content-Range"].split("/")[1]))
            assert len(data) == b - a or size is not None, (url, a, b, len(data))
            return data
        except Exception as e:
            err = e
            time.sleep(2 ** i if isinstance(e, urllib.error.HTTPError) and e.code == 429 else 1)
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


def month(ver, y, m, pts):
    url = URL[ver].format(y=y, m=m)
    with tifffile.TiffFile(HttpFile(url)) as tf:
        p = tf.pages[0]  # full-resolution image; later pages are overviews
        sx, sy = (round(v, 6) for v in p.tags["ModelPixelScaleTag"].value[:2])  # float32 tag: 0.05000000074
        x0, y0 = p.tags["ModelTiepointTag"].value[3:5]
        tw, tl = p.tilewidth, p.tilelength
        across = -(-p.imagewidth // tw)
        out, tiles = {}, {}
        for q in pts:
            # a point exactly on a cell edge (lat 9.5, lon 106.1 ...) goes to the cell south / east of it
            col, row = int(round((q["lon"] - x0) / sx, 6) // 1), int(round((y0 - q["lat"]) / sy, 6) // 1)
            ti = (row // tl) * across + col // tw
            if ti not in tiles:
                off, cnt = p.dataoffsets[ti], p.databytecounts[ti]
                seg, _, shape = p.decode(get(url, off, off + cnt), ti)
                tiles[ti] = seg.reshape(shape[-3], shape[-2])  # (rows, cols) of one band
            v = float(tiles[ti][row % tl, col % tw])
            out[q["id"]] = None if v < -9000 or np.isnan(v) else round(v, 1)
        return out


def main():
    outdir = sys.argv[1]
    first = sys.argv[2] if len(sys.argv) > 2 else "1981-01"
    last = sys.argv[3] if len(sys.argv) > 3 else "2026-10"
    pts = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else sites.points()  # optional [{"id","lat","lon"}] file
    months = []
    y, m = map(int, first.split("-"))
    while f"{y}-{m:02d}" <= last:
        months.append((y, m))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    for ver in ("v3", "v2"):
        path = os.path.join(outdir, f"chirps_{ver}.json")
        data = json.load(open(path)) if os.path.exists(path) else {q["id"]: {} for q in pts}
        todo = [(y, m) for y, m in months if f"{y}-{m:02d}" not in data[pts[0]["id"]]]
        for i in range(0, len(todo), 24):  # save every 24 months so a rerun resumes
            with ThreadPoolExecutor(3) as ex:
                res = list(ex.map(lambda ym: (ym, month(ver, *ym, pts)), todo[i:i + 24]))
            for (y, m), vals in res:
                for pid, v in vals.items():
                    data[pid][f"{y}-{m:02d}"] = v
            json.dump(data, open(path, "w"), indent=0, sort_keys=True)
        print(ver, "fetched", len(todo), "months ->", path)


if __name__ == "__main__":
    main()
