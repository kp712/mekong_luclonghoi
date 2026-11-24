"""Province outlines for the Vietnam map -> docs/app/vn_geo.js (and checks every pin sits inside its own province).

Source: OCHA COD-AB Viet Nam v02 (HDX), the 34 provinces valid since 1 July 2025 (Resolution 202/2025/QH15), CC BY-IGO.
Only the provinces in sites.PROVINCES are kept, saved once to data/raw/adm1_vnm_2025.geojson.gz (downloaded if missing).
The 63 former provinces are not drawn; load() still reads their 2020 outlines (geoBoundaries) for fetch_soil.py.
Pure Python, no GIS library.

Shared borders are cut into arcs at the points where three or more outlines meet, each arc is simplified once
(Douglas-Peucker) and stored once, so neighbouring provinces still share exactly the same border after simplifying.
Output (TopoJSON-like): arcs = [[[lon, lat], ...]], province = {id: [ring]}, where a ring is a list of arc numbers
(~n = arc n reversed).
Run: python pipeline/make_outlines.py
"""
import gzip
import io
import json
import pathlib
import sys
import urllib.request
import zipfile

from sites import PROVINCES, SITES

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "adm1_vnm_2025.geojson.gz"
OUT = ROOT / "docs" / "app" / "vn_geo.js"
URL = ("https://data.humdata.org/dataset/3cb544a9-9d04-4f54-94e2-93230efd8ceb/resource/048a6012-a8c2-4fa9-be87-cb6c01e9afbf/"
       "download/vnm_admin_boundaries.geojson.zip")
SRC = {"title": "OCHA COD-AB Viet Nam v02 (HDX): 34 provinces valid from 1 July 2025, OCHA ROAP + Government of Viet Nam, CC BY-IGO",
       "url": "https://data.humdata.org/dataset/cod-ab-vnm"}
# the 63 former provinces (2020), only for fetch_soil.py: a soil sample must stay inside the pin's own former province
RAW_2020 = ROOT / "data" / "raw" / "adm1_vnm_2020.geojson"
URL_2020 = ("https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbHumanitarian/VNM/ADM1/"
            "geoBoundaries-VNM-ADM1_simplified.geojson")
TOL = 0.002        # simplifying tolerance in degrees (~200 m): invisible at the zooms the map allows for the whole country
MIN_AREA = 2e-4    # islands smaller than this (deg², ~2.4 km²) are dropped ...
KEEP_FAR = 109.6   # ... except offshore archipelagos east of this longitude (Hoàng Sa, Trường Sa), always kept
# geoBoundaries names (no accents) -> sites.py point ids, where a plain slug does not match
NAME = {"Hai Phong city": "hai_phong", "Thua Thien Hue": "hue", "Da Nang city": "da_nang", "Ho Chi Minh city": "tp_hcm",
        "Can Tho city": "can_tho", "Ba Ria - Vung Tau": "ba_ria_vung_tau"}


def slug(name):
    return NAME.get(name) or name.lower().replace(" ", "_")


def rings_of(g):
    """A GeoJSON (Multi)Polygon -> rings of (lon, lat) rounded to 5 decimals, so the same corner in two provinces is exactly
    the same point; repeated points dropped."""
    rings = []
    for poly in (g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]):
        for ring in poly:
            pts = []
            for x, y in ring:
                p = (round(x, 5), round(y, 5))
                if not pts or pts[-1] != p:
                    pts.append(p)
            if pts[0] == pts[-1]:
                pts.pop()
            if len(pts) >= 3:
                rings.append(pts)
    return rings


def load():
    """The 63 former provinces (2020, geoBoundaries): {point id: rings}. Used by fetch_soil.py only."""
    if not RAW_2020.exists():
        with urllib.request.urlopen(URL_2020, timeout=120) as r:
            RAW_2020.write_bytes(r.read())
    return {slug(f["properties"]["shapeName"]): rings_of(f["geometry"])
            for f in json.loads(RAW_2020.read_text(encoding="utf-8"))["features"]}


def load_2025():
    """The provinces of sites.PROVINCES from COD-AB v02: {province id: rings}, matched by Vietnamese name."""
    if not RAW.exists():
        req = urllib.request.Request(URL, headers={"User-Agent": "mekong-rotation-explorer/1.0"})
        with urllib.request.urlopen(req, timeout=300) as r:
            feats = json.loads(zipfile.ZipFile(io.BytesIO(r.read())).read("vnm_admin1.geojson"))["features"]
        keep = {p["name"]["vi"] for p in PROVINCES}
        feats = [f for f in feats if f["properties"]["adm1_name1"] in keep]
        RAW.write_bytes(gzip.compress(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False).encode("utf-8")))
    feats = {f["properties"]["adm1_name1"]: f["geometry"] for f in json.loads(gzip.decompress(RAW.read_bytes()))["features"]}
    missing = [p["name"]["vi"] for p in PROVINCES if p["name"]["vi"] not in feats]
    assert not missing, ("not in COD-AB v02", missing)
    return {p["id"]: rings_of(feats[p["name"]["vi"]]) for p in PROVINCES}


def inside(x, y, rings):
    """Even-odd rule over all rings (so holes count)."""
    c = False
    for ring in rings:
        j = len(ring) - 1
        for i in range(len(ring)):
            (xi, yi), (xj, yj) = ring[i], ring[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                c = not c
            j = i
    return c


def area(ring):
    return abs(sum(ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1] for i in range(len(ring)))) / 2


def dp(pts, tol):
    """Douglas-Peucker on an open polyline, keeping both ends."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (x0, y0), (x1, y1) = pts[a], pts[b]
        dx, dy = x1 - x0, y1 - y0
        n = (dx * dx + dy * dy) ** 0.5
        best, bi = -1, None
        for i in range(a + 1, b):
            x, y = pts[i]
            d = abs(dy * (x - x0) - dx * (y - y0)) / n if n else ((x - x0) ** 2 + (y - y0) ** 2) ** 0.5
            if d > best:
                best, bi = d, i
        if bi is not None and best > tol:
            keep[bi] = True
            stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]


def topology(geo):
    """Cut every ring into arcs at junctions (points with 3+ different neighbours); store each arc once."""
    nb = {}
    for rings in geo.values():
        for ring in rings:
            for i, p in enumerate(ring):
                s = nb.setdefault(p, set())
                s.add(ring[i - 1])
                s.add(ring[(i + 1) % len(ring)])
    junction = {p for p, s in nb.items() if len(s) > 2}
    arcs, index, rings_out = [], {}, {}
    for pid, rings in geo.items():
        out = []
        for ring in rings:
            cuts = [i for i, p in enumerate(ring) if p in junction]
            if not cuts:  # an island or a ring touching nobody: one closed arc, cut at its lowest-left point
                k = ring.index(min(ring))
                cuts = [k]
            pieces = []
            for a, b in zip(cuts, cuts[1:] + [cuts[0] + len(ring)]):
                pieces.append([ring[i % len(ring)] for i in range(a, b + 1)])
            ids = []
            for pc in pieces:
                key, rev = tuple(pc), tuple(reversed(pc))
                if key in index:
                    ids.append(index[key])
                elif rev in index:
                    ids.append(~index[rev])
                else:
                    index[key] = len(arcs)
                    arcs.append(pc)
                    ids.append(index[key])
            out.append(ids)
        rings_out[pid] = out
    return arcs, rings_out


def arc_pts(arcs, i):
    return arcs[i] if i >= 0 else arcs[~i][::-1]


def ring_pts(arcs, ring):
    pts = []
    for i in ring:
        a = arc_pts(arcs, i)
        pts += a[1:] if pts else a
    return pts[:-1]


def main():
    geo = load_2025()
    # every data point must sit inside its own province (the 5 area pins inside Cần Thơ, which holds former Sóc Trăng)
    bad = [(f["id"], p["id"]) for p in PROVINCES for f in p["former"] if not inside(f["lon"], f["lat"], geo[p["id"]])]
    bad += [(s["id"], "can_tho") for s in SITES if not inside(s["lon"], s["lat"], geo["can_tho"])]
    assert not bad, ("points outside their province", bad)

    # drop tiny islands before building arcs (kept: the offshore archipelagos)
    for pid, rings in geo.items():
        geo[pid] = [r for r in rings if area(r) >= MIN_AREA or min(x for x, _ in r) > KEEP_FAR]
    arcs, province = topology(geo)
    small = [dp(a, TOL) for a in arcs]
    for a, o in zip(small, arcs):  # a closed arc (island) needs at least 4 points to stay a shape (a 1 m spike in the source never had them)
        if a[0] == a[-1] and len(a) < 4 <= len(o):
            raise SystemExit("an island collapsed when simplified: lower TOL")
    arcs = small
    out = {"src": SRC, "arcs": [[[round(x, 4), round(y, 4)] for x, y in a] for a in arcs], "province": province}
    # the simplified outline must still hold every point of its province
    for p in PROVINCES:
        rings = [ring_pts(out["arcs"], r) for r in out["province"][p["id"]]]
        for f in p["former"]:
            assert inside(f["lon"], f["lat"], rings), ("after simplifying", p["id"], f["id"])
    js = ("/* Province outlines, made by pipeline/make_outlines.py. " + SRC["title"] + ". " + SRC["url"] + "\n"
          "   arcs: [lon, lat] lines; a ring lists arc numbers (~n = arc n reversed). province = the 34 provinces since July 2025. */\n"
          "const VN_GEO = " + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n")
    OUT.write_text(js, encoding="utf-8")
    print(f"{len(out['arcs'])} arcs, {sum(len(a) for a in out['arcs'])} points, {len(js) // 1024} KB -> {OUT}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
