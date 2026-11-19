"""Download SoilGrids topsoil clay, organic carbon and pH for every point of sites.points() -> data/raw/soil_<id>.json.
SoilGrids 2.0 (ISRIC): free API, no login, 250 m modelled soil maps. NOT a NASA dataset.
Run: python pipeline/fetch_soil.py
The API is often slow (and allows about 5 calls a minute). Pins already saved are skipped, so just run it again later.

Most province points are a former provincial capital, where SoilGrids has no soil (town pixel). For those:
    python pipeline/fetch_soil.py nearby
looks for the nearest farmland pixel inside the same former province (3-15 km away, 8 directions, outlines from
make_outlines.py) and saves it with "sample": {lat, lon, km}, so the app can say how far from the pin the soil is.
"""
import json
import math
import pathlib
import sys
import time
import urllib.request

from sites import points

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
URL = ("https://rest.isric.org/soilgrids/v2.0/properties/query"
       "?lon={lon}&lat={lat}&property={prop}&depth=0-5cm&depth=5-15cm&value=mean")
PROPS = ["clay", "soc", "phh2o"]  # one property per request: asking for all three at once often times out


WAIT = 13  # seconds between calls: SoilGrids' fair-use limit is about 5 calls a minute
STEPS_KM = (3, 5, 7, 10, 15)


def get(url):
    time.sleep(WAIT)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return json.load(r)
        except OSError:
            if attempt == 2:
                raise
            time.sleep(30 * (attempt + 1))


def no_soil(path):
    raw = json.loads(path.read_text(encoding="utf-8"))
    return all(d["values"]["mean"] is None for layer in raw["layers"] for d in layer["depths"])


def candidates(s, rings):
    """Points 3-15 km from the pin in 8 directions, nearest first, only inside the pin's own former province."""
    from make_outlines import inside
    out = []
    for km in STEPS_KM:
        for k in range(8):
            a = k * math.pi / 4
            lat = s["lat"] + km / 110.57 * math.sin(a)
            lon = s["lon"] + km / (111.32 * math.cos(math.radians(s["lat"]))) * math.cos(a)
            if inside(lon, lat, rings):
                out.append({"lat": round(lat, 4), "lon": round(lon, 4), "km": km})
    return out


def nearby():
    """Re-sample the points whose own pixel has no soil at the nearest farmland pixel in the same former province."""
    from make_outlines import load
    geo = load()
    for s in points():
        out = RAW / f"soil_{s['id']}.json"
        if not out.exists() or not no_soil(out) or s["id"] not in geo:
            continue
        print("searching", s["id"], flush=True)
        for c in candidates(s, geo[s["id"]]):
            probe = get(URL.format(lon=c["lon"], lat=c["lat"], prop="clay"))
            if any(d["values"]["mean"] is None for layer in probe["properties"]["layers"] for d in layer["depths"]):
                continue
            layers = probe["properties"]["layers"] + [layer for prop in PROPS[1:]
                                                      for layer in get(URL.format(lon=c["lon"], lat=c["lat"], prop=prop))["properties"]["layers"]]
            if any(d["values"]["mean"] is None for layer in layers for d in layer["depths"]):
                continue
            out.write_text(json.dumps({"source": "SoilGrids 2.0 (ISRIC)", "sample": c, "layers": layers}), encoding="utf-8")
            print(f"  soil {c['km']} km away", flush=True)
            break
        else:
            print("  no farmland pixel within 15 km inside the province: kept as no data", flush=True)


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    if sys.argv[1:] == ["nearby"]:
        return nearby()
    missing = []
    for s in points():
        out = RAW / f"soil_{s['id']}.json"
        if out.exists():
            continue
        print("fetching", s["id"], flush=True)
        try:
            layers = []
            for prop in PROPS:
                with urllib.request.urlopen(URL.format(lon=s["lon"], lat=s["lat"], prop=prop), timeout=120) as r:
                    layers += json.load(r)["properties"]["layers"]
        except OSError as e:  # timeouts and HTTP errors; never write partial or made-up values
            print(f"  SoilGrids API slow or down ({e}); run again later")
            missing.append(s["id"])
            continue
        out.write_text(json.dumps({"source": "SoilGrids 2.0 (ISRIC)", "layers": layers}), encoding="utf-8")
    print("still missing:", ", ".join(missing) if missing else "none")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
