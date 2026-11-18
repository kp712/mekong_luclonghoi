"""Download NASA POWER daily weather for every pin -> data/raw/power_<id>.json, NOAA's El Niño index -> data/raw/oni.txt
and NOAA's latest El Niño outlook -> data/raw/enso_outlook.json.
Rain, temperature, humidity, wind and sunlight (for FAO-56 Penman-Monteith water demand), 1984-2025:
sunlight (ALLSKY_SFC_SW_DWN) starts in 1984. All free, no login. Run: python pipeline/fetch_power.py
Every point of sites.points(): the app's pins and one point per former province (63).
Only points with no file yet: python pipeline/fetch_power.py missing
Only refresh NOAA's outlook (monthly, 2nd Thursday): python pipeline/fetch_power.py enso
"""
import html
import json
import pathlib
import re
import sys
import urllib.request
from datetime import datetime

from sites import points

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
URL = ("https://power.larc.nasa.gov/api/temporal/daily/point"
       "?parameters=PRECTOTCORR,T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN&community=AG"
       "&latitude={lat}&longitude={lon}&start=19840101&end=20251231&format=JSON")
ONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt"  # NOAA Oceanic Niño Index, 3-month seasons
ENSO_URL = "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml"  # NOAA CPC monthly ENSO discussion


def parse_enso(page):
    """NOAA CPC's ENSO discussion page -> {issued (ISO date), status, synopsis}. Fails loudly if NOAA changes the layout."""
    text = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", page)))
    issued = re.search(r"issued by CLIMATE PREDICTION CENTER\S* (\d{1,2} [A-Z][a-z]+ \d{4})", text)
    status = re.search(r"ENSO Alert System Status: (.+?) Synopsis: (.+?\.)(?: |$)", text)
    assert issued and status, "NOAA's ENSO discussion page changed layout: update parse_enso in pipeline/fetch_power.py"
    return {"issued": datetime.strptime(issued[1], "%d %B %Y").date().isoformat(),
            "status": status[1].strip(), "synopsis": status[2].strip()}


def fetch_enso():
    with urllib.request.urlopen(ENSO_URL, timeout=120) as r:
        out = dict(parse_enso(r.read().decode("utf-8", "replace")), url=ENSO_URL)
    (RAW / "enso_outlook.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("NOAA outlook", out["issued"], out["status"])


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    only_missing = sys.argv[1:] == ["missing"]
    if not only_missing:
        fetch_enso()
        if sys.argv[1:] == ["enso"]:
            return
        with urllib.request.urlopen(ONI_URL, timeout=120) as r:
            (RAW / "oni.txt").write_bytes(r.read())
    for s in points():
        if only_missing and (RAW / f"power_{s['id']}.json").exists():
            continue
        print("fetching", s["id"])
        with urllib.request.urlopen(URL.format(**s), timeout=120) as r:
            data = json.load(r)
        # keep only the values; the header tells us the source (MERRA-2) and fill value (-999)
        out = {"source": data["header"]["sources"], "parameter": data["properties"]["parameter"]}
        (RAW / f"power_{s['id']}.json").write_text(json.dumps(out), encoding="utf-8")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
