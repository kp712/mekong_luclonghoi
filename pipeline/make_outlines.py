"""Province outlines for the Vietnam map -> docs/app/vn_geo.js (and checks every pin sits inside its own province).

Source: geoBoundaries gbHumanitarian VNM ADM1 (simplified), OCHA ROAP + Government of Viet Nam 2020, CC BY 3.0 IGO:
the 63 provinces before the July 2025 merger, same source and year as the Sóc Trăng district outlines (districts.js).
Only the provinces in sites.PROVINCES are kept; each new province (Resolution 202/2025/QH15) is drawn by joining its former ones.
Saved once to data/raw/adm1_vnm_2020.geojson (downloaded if missing). Pure Python, no GIS library.

Shared borders are cut into arcs at the points where three or more outlines meet, each arc is simplified once
(Douglas-Peucker) and stored once, so neighbouring provinces still share exactly the same border after simplifying.
Output (TopoJSON-like): arcs = [[[lon, lat], ...]], former = {id: [ring]}, province = {id: [ring]}, where a ring is a
list of arc numbers (~n = arc n reversed); inner = arcs between two former provinces of the same new province.
Run: python pipeline/make_outlines.py
"""
import json
import pathlib
import sys
import urllib.request

from sites import PROVINCES, SITES

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "adm1_vnm_2020.geojson"
OUT = ROOT / "docs" / "app" / "vn_geo.js"
URL = ("https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbHumanitarian/VNM/ADM1/"
       "geoBoundaries-VNM-ADM1_simplified.geojson")
SRC = {"title": "geoBoundaries VNM ADM1 (gbHumanitarian, simplified): OCHA ROAP + Government of Viet Nam 2020, CC BY 3.0 IGO",
       "url": "https://www.geoboundaries.org/countryDownloads.html"}
TOL = 0.002        # simplifying tolerance in degrees (~200 m): invisible at the zooms the map allows for the whole country
MIN_AREA = 2e-4    # islands smaller than this (deg², ~2.4 km²) are dropped ...
KEEP_FAR = 109.6   # ... except offshore archipelagos east of this longitude (Hoàng Sa, Trường Sa), always kept
# geoBoundaries names (no accents) -> sites.py point ids, where a plain slug does not match
NAME = {"Hai Phong city": "hai_phong", "Thua Thien Hue": "hue", "Da Nang city": "da_nang", "Ho Chi Minh city": "tp_hcm",
        "Can Tho city": "can_tho", "Ba Ria - Vung Tau": "ba_ria_vung_tau"}


def slug(name):
    return NAME.get(name) or name.lower().replace(" ", "_")


def load():
    if not RAW.exists():
        with urllib.request.urlopen(URL, timeout=120) as r:
            RAW.write_bytes(r.read())
    feats = json.loads(RAW.read_text(encoding="utf-8"))["features"]
    out = {}
    for f in feats:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        # round so the same corner in two provinces is exactly the same point; drop repeated points
        rings = []
        for poly in polys:
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
        out[slug(f["properties"]["shapeName"])] = rings
    return out


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


def dissolve(rings_of, members):
    """Join former provinces: drop arcs used by two members (both directions), chain the rest into closed rings."""
    use = {}
    for m in members:
        for ring in rings_of[m]:
            for i in ring:
                use[i if i >= 0 else ~i] = use.get(i if i >= 0 else ~i, 0) + 1
    inner = sorted(k for k, n in use.items() if n > 1)
    edges = [i for m in members for ring in rings_of[m] for i in ring if use[i if i >= 0 else ~i] == 1]
    return edges, inner


def chain(arcs, edges):
    start = {}
    for e in edges:
        start.setdefault(arc_pts(arcs, e)[0], []).append(e)
    rings, used = [], set()
    for e0 in edges:
        if e0 in used:
            continue
        ring, e = [], e0
        while e not in used:
            used.add(e)
            ring.append(e)
            nxt = [x for x in start.get(arc_pts(arcs, e)[-1], []) if x not in used]
            if not nxt:
                break
            e = nxt[0]
        assert arc_pts(arcs, ring[-1])[-1] == arc_pts(arcs, ring[0])[0], "outline did not close"
        rings.append(ring)
    return rings


def main():
    geo = load()
    former_ids = {f["id"] for p in PROVINCES for f in p["former"]}
    assert former_ids <= set(geo), ("names do not match", former_ids - set(geo))
    geo = {k: v for k, v in geo.items() if k in former_ids}  # only the provinces the app covers
    # every data point must sit inside its own former province (and the 5 area pins inside Sóc Trăng)
    bad = [(f["id"], p["id"]) for p in PROVINCES for f in p["former"] if not inside(f["lon"], f["lat"], geo[f["id"]])]
    bad += [(s["id"], "soc_trang") for s in SITES if not inside(s["lon"], s["lat"], geo["soc_trang"])]
    assert not bad, ("pins outside their province", bad)

    # drop tiny islands before building arcs (kept: the offshore archipelagos)
    for pid, rings in geo.items():
        geo[pid] = [r for r in rings if area(r) >= MIN_AREA or min(x for x, _ in r) > KEEP_FAR]
    arcs, rings_of = topology(geo)
    arcs = [dp(a, TOL) for a in arcs]
    for a in arcs:  # a closed arc (island) needs at least 4 points to stay a shape
        if a[0] == a[-1] and len(a) < 4:
            raise SystemExit("an island collapsed when simplified: lower TOL")
    province, inner = {}, []
    for p in PROVINCES:
        edges, inn = dissolve(rings_of, [f["id"] for f in p["former"]])
        province[p["id"]] = chain(arcs, edges)
        inner += inn
    # keep only the arcs used, renumbered, with 4-decimal coordinates (~11 m)
    used = sorted({i if i >= 0 else ~i for rs in list(rings_of.values()) + list(province.values()) for r in rs for i in r})
    new = {o: n for n, o in enumerate(used)}
    ren = lambda i: new[i] if i >= 0 else ~new[~i]
    out = {"src": SRC,
           "arcs": [[[round(x, 4), round(y, 4)] for x, y in arcs[o]] for o in used],
           "former": {k: [[ren(i) for i in r] for r in rs] for k, rs in rings_of.items()},
           "province": {k: [[ren(i) for i in r] for r in rs] for k, rs in province.items()},
           "inner": sorted(ren(i) for i in set(inner))}
    # the joined outline must still hold every former point of its province
    dec = lambda rs: [ring_pts(out["arcs"], r) for r in rs]
    for p in PROVINCES:
        for f in p["former"]:
            assert inside(f["lon"], f["lat"], dec(out["province"][p["id"]])), ("after joining", p["id"], f["id"])
    js = ("/* Province outlines, made by pipeline/make_outlines.py. " + SRC["title"] + ". " + SRC["url"] + "\n"
          "   arcs: [lon, lat] lines; a ring lists arc numbers (~n = arc n reversed). former = 63 provinces before July 2025,\n"
          "   province = the 34 since (joined), inner = borders between former provinces inside one new province. */\n"
          "const VN_GEO = " + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n")
    OUT.write_text(js, encoding="utf-8")
    print(f"{len(out['arcs'])} arcs, {sum(len(a) for a in out['arcs'])} points, {len(js) // 1024} KB -> {OUT}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
