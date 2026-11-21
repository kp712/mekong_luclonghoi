"""Fetch MODIS NDVI from NASA AppEEARS with no clicking.
Needs environment variables EARTHDATA_USERNAME and EARTHDATA_PASSWORD (free account: urs.earthdata.nasa.gov).

  python pipeline/appeears.py ndvi                             # NDVI for every pin -> data/raw/ndvi_<id>.json
  python pipeline/appeears.py hls                              # NASA HLS 30 m greenness for every pin -> data/raw/hls_<id>.json (cross-check only)
  python pipeline/appeears.py find-hls <pin_id> [--apply]      # 30 m HLS check of an 11x11 grid around a pin; moves it to the nearest rice
  python pipeline/appeears.py find vinh_chau my_xuyen          # search ~5 km around pins for rice-like pixels
  python pipeline/appeears.py find vinh_chau my_xuyen --apply  # ...and move each pin to the best one

AppEEARS queues the job; it can take minutes to hours. The script waits, and if it is stopped,
running the same command again resumes the same job instead of submitting a new one.
"""
import base64
import csv
import hashlib
import io
import json
import math
import os
import re
import sys
import time
import urllib.request

import hls
import ndvi
from ndvi_from_appeears import DATA, convert, parse_raw
from sites import SITES

API = "https://appeears.earthdatacloud.nasa.gov/api"
CACHE = DATA / "appeears"          # downloads + job ids (gitignored)
SITES_PY = DATA.parent / "pipeline" / "sites.py"
STEP, N = 0.015, 3                 # grid: 7 x 7 points, ~1.6 km apart, covers ~5 km around the pin


START = "02-18-2000"  # first MODIS Terra 16-day NDVI


def call(path, token=None, body=None, basic=None):
    data = json.dumps(body).encode() if body is not None else (b"" if basic else None)
    req = urllib.request.Request(API + path, data=data,
                                 method="POST" if (body is not None or basic) else "GET")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    if basic:
        req.add_header("Authorization", "Basic " + base64.b64encode(basic.encode()).decode())
    if token:  # unredirected: downloads redirect to cloud storage, which rejects a second auth header
        req.add_unredirected_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req, timeout=300) as r:
        raw = r.read()
    return json.loads(raw) if r.headers.get_content_type() == "application/json" else raw


def login():
    user, pw = os.environ.get("EARTHDATA_USERNAME"), os.environ.get("EARTHDATA_PASSWORD")
    if not user or not pw:
        sys.exit("Set EARTHDATA_USERNAME and EARTHDATA_PASSWORD first (see README, 'For teammates: updating the data').")
    return call("/login", basic=f"{user}:{pw}")["token"]


MODIS_LAYERS = [{"product": "MOD13Q1.061", "layer": "_250m_16_days_NDVI"}]
HLS_START, HLS_END = "12-01-2014", "11-30-2024"  # the RECENT seasons in build.py (Sentinel-2 starts late 2015)


def run_task(name, coords, layers=None, start=START, end="12-31-2025"):
    """Submit (or resume) a point task (default: MOD13Q1 NDVI 2000-2025); return the path of the results CSV."""
    CACHE.mkdir(parents=True, exist_ok=True)
    # name includes a hash of the request, so moving a pin never reuses an old download (the MODIS hash is unchanged)
    key = [coords, start] if layers is None else [coords, start, end, layers]
    name += "-" + hashlib.md5(json.dumps(key, sort_keys=True).encode()).hexdigest()[:8]
    out, job = CACHE / f"{name}.csv", CACHE / f"{name}.task"
    if out.exists():
        return out
    token = login()
    if job.exists():
        task_id = job.read_text(encoding="utf-8").strip()
        print("resuming AppEEARS job", task_id)
    else:
        task = {"task_type": "point", "task_name": name, "params": {
            "dates": [{"startDate": start, "endDate": end}],
            "layers": layers or MODIS_LAYERS,
            "coordinates": coords}}
        task_id = call("/task", token, task)["task_id"]
        job.write_text(task_id, encoding="utf-8")
        print("submitted AppEEARS job", task_id)
    while (status := call(f"/task/{task_id}", token)["status"]) != "done":
        if status == "error":
            job.unlink()
            sys.exit(f"AppEEARS job {task_id} failed; run again to resubmit.")
        print(time.strftime("%H:%M"), "job status:", status, "- checking again in 60 s", flush=True)
        time.sleep(60)
    files = call(f"/bundle/{task_id}", token)["files"]
    parts = [call(f"/bundle/{task_id}/{f['file_id']}", token).decode("utf-8")
             for f in files if f["file_name"].endswith("-results.csv")]
    out.write_text(merge_csv(parts), encoding="utf-8", newline="")
    print("downloaded", out)
    return out


def merge_csv(parts):
    """AppEEARS writes one results CSV per product; join them into one table on the columns they share (ID, Date, tile...).
    A row one product lacks gets blank cells for that product's columns."""
    tables = [csv.DictReader(io.StringIO(t)) for t in parts]
    heads = [t.fieldnames for t in tables]
    key = [c for c in heads[0] if all(c in h for h in heads)]
    cols = key + [c for h in heads for c in h if c not in key]
    rows = {}
    for t in tables:
        for r in t:
            rows.setdefault(tuple(r[c] for c in key), {}).update(r)
    buf = io.StringIO()
    w = csv.DictWriter(buf, cols, restval="", lineterminator="\n")
    w.writeheader()
    w.writerows(rows.values())
    return buf.getvalue()


def rice_like(series):
    """Return (is_rice, crops/yr, typical peak, typical low). Rice = 2-3 green peaks a year with bare/flooded dips."""
    if not series:
        return False, 0.0, 0.0, 0.0
    years = {}
    for d, v in series.items():
        years.setdefault(d[:4], []).append(v)
    peak = sum(max(v) for v in years.values()) / len(years)
    low = sum(min(v) for v in years.values()) / len(years)
    crops = ndvi.crops_per_year(series)
    # shortcut: thresholds are rules of thumb for Mekong rice; a shrimp pond stays low, an orchard stays flat-high
    return 1.8 <= crops <= 3.3 and peak >= 0.6 and low <= 0.35, crops, round(peak, 2), round(low, 2)


def grid(site):
    """7 x 7 candidate points around a pin. IDs are letters+digits only (AppEEARS strips underscores)."""
    base = site["id"].replace("_", "")
    return [{"id": f"{base}{i + N}{j + N}", "category": site["id"],
             "latitude": round(site["lat"] + i * STEP, 4), "longitude": round(site["lon"] + j * STEP, 4)}
            for i in range(-N, N + 1) for j in range(-N, N + 1)]


def km(lat1, lon1, lat2, lon2):
    return 111.2 * math.hypot(lat2 - lat1, (lon2 - lon1) * math.cos(math.radians(lat1)))


def move_pin_text(text, sid, lat, lon):
    new, n = re.subn(rf'("id": "{sid}", "lat": )[-\d.]+(, "lon": )[-\d.]+', rf"\g<1>{lat}\g<2>{lon}", text)
    assert n == 1, f"could not find pin {sid} in sites.py"
    return new


def find(ids, apply):
    sites = [s for s in SITES if s["id"] in ids]
    assert len(sites) == len(ids), f"unknown pin in {ids}; known: {[s['id'] for s in SITES]}"
    pts = [p for s in sites for p in grid(s)]
    with open(run_task("find-" + "-".join(sorted(ids)), pts), encoding="utf-8", newline="") as f:
        series = parse_raw(f)
    for s in sites:
        rows = []
        for p in grid(s):
            if p["id"] in series:
                ok, crops, peak, low = rice_like(series[p["id"]])
                rows.append((not ok, km(s["lat"], s["lon"], p["latitude"], p["longitude"]), p, crops, peak, low))
        rows.sort(key=lambda r: (r[0], r[1]))  # rice-like first, then nearest
        good = [r for r in rows if not r[0]]
        print(f"\n{s['id']}: {len(good)} of {len(rows)} points look like rice")
        for bad, dist, p, crops, peak, low in rows[:5]:
            print(f"  {'RICE ' if not bad else 'no   '} {p['latitude']}, {p['longitude']}  {dist:.1f} km away"
                  f"  crops/yr {crops}  peak {peak}  low {low}")
        if not good:
            print(f"  -> no clear rice near {s['id']}: keep the pin and relabel it as mixed / rice-shrimp land")
        elif apply:
            p = good[0][2]
            SITES_PY.write_text(move_pin_text(SITES_PY.read_text(encoding="utf-8"), s["id"], p["latitude"], p["longitude"]),
                                encoding="utf-8")
            (DATA / "raw" / f"ndvi_{s['id']}.json").write_text(json.dumps(series[p["id"]]), encoding="utf-8")
            print(f"  -> moved {s['id']} to {p['latitude']}, {p['longitude']} and saved its NDVI")
    if apply:
        print("\nNext: python pipeline/ndvi_from_appeears.py  (refresh the upload file), then build.py and test_build.py")


def find_hls(sid, apply):
    """Check an 11 x 11 grid (~1.1 km apart) around a pin with NASA HLS 30 m over the last 3 seasons, and list the points
    that look like rice (hls.rice_stats), nearest first. MODIS's 250 m pixel can call a pond area rice (Vinh Chau, 2026)."""
    s = next((x for x in SITES if x["id"] == sid), None)
    assert s, f"unknown pin {sid}; known: {[x['id'] for x in SITES]}"
    base = sid.replace("_", "")
    pts = [{"id": f"{base}g{i + 5}x{j + 5}", "category": "grid", "latitude": round(s["lat"] + i * 0.01, 4),
            "longitude": round(s["lon"] + j * 0.01, 4)} for i in range(-5, 6) for j in range(-5, 6)]
    layers = [{"product": p, "layer": l} for p, l in hls.LAYERS]
    with open(run_task("findhls-" + sid, pts, layers, "12-01-2021", HLS_END), encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    cols = hls._columns(rows[0].keys() if rows else [])
    enc = hls.detect_encoding(r[c] for r in rows for k, c in cols.items() if k[1] == "NDVI")
    got = {}
    for r in rows:
        for sensor in "LS":
            v, fm = hls.scaled_ndvi(r[cols[(sensor, "NDVI")]], enc), r[cols[(sensor, "Fmask")]]
            if v is not None and hls.clear(fm):
                got.setdefault(r["ID"].lower(), []).append((v, int(float(fm)) >> 5 & 1))
    res = []
    for p in pts:
        peak, water = hls.rice_stats(got.get(p["id"].lower(), []))
        ok = peak >= hls.RICE_PEAK and water <= hls.RICE_WATER
        res.append((not ok, km(s["lat"], s["lon"], p["latitude"], p["longitude"]), p, peak, water))
    res.sort(key=lambda r: (r[0], r[1]))
    print(f"{sid}: {sum(not r[0] for r in res)} of {len(res)} points look like rice at 30 m")
    for bad, dist, p, peak, water in res[:10]:
        print(f"  {'RICE ' if not bad else 'no   '} {p['latitude']}, {p['longitude']}  {dist:.1f} km  peak {peak:.2f}  water {water:.0%}")
    if apply and not res[0][0]:
        p = res[0][2]
        SITES_PY.write_text(move_pin_text(SITES_PY.read_text(encoding="utf-8"), sid, p["latitude"], p["longitude"]),
                            encoding="utf-8")
        print(f"  -> moved {sid} to {p['latitude']}, {p['longitude']}. Next: appeears.py ndvi, appeears.py hls, build.py")


def main(args):
    if args[:1] == ["ndvi"]:
        pts = [{"id": s["id"].replace("_", ""), "category": "pin", "latitude": s["lat"], "longitude": s["lon"]} for s in SITES]
        convert(run_task("ndvi", pts))
    elif args[:1] == ["hls"]:
        pts = [p for s in SITES for p in hls.points(s)]
        layers = [{"product": p, "layer": l} for p, l in hls.LAYERS]
        out = run_task("hls", pts, layers, HLS_START, HLS_END)
        try:
            with open(out, encoding="utf-8", newline="") as f:
                series = hls.refresh(f, [s["id"] for s in SITES], DATA / "raw")
        except ValueError as e:
            sys.exit(f"ERROR: {e}. Existing data/raw/hls_*.json left untouched.")
        for sid, s in series.items():
            print(sid, len(s), "clear HLS dates" + ("  (WARNING: zero coverage, every month unknown)" if not s else ""))
    elif args[:1] == ["find-hls"] and len(args) > 1:
        find_hls(args[1], "--apply" in args)
    elif args[:1] == ["find"] and len(args) > 1:
        find([a for a in args[1:] if a != "--apply"], "--apply" in args)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
