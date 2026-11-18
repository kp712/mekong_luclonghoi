"""Download SoilGrids topsoil clay, organic carbon and pH for every point of sites.points() -> data/raw/soil_<id>.json.
SoilGrids 2.0 (ISRIC): free API, no login, 250 m modelled soil maps. NOT a NASA dataset.
Run: python pipeline/fetch_soil.py
The API is often slow. Pins already saved are skipped, so just run it again later.
"""
import json
import pathlib
import urllib.request

from sites import points

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
URL = ("https://rest.isric.org/soilgrids/v2.0/properties/query"
       "?lon={lon}&lat={lat}&property={prop}&depth=0-5cm&depth=5-15cm&value=mean")
PROPS = ["clay", "soc", "phh2o"]  # one property per request: asking for all three at once often times out


def main():
    RAW.mkdir(parents=True, exist_ok=True)
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
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
