"""Download NOAA's El Niño index -> data/raw/oni.txt and NOAA's latest El Niño outlook -> data/raw/enso_outlook.json. Free, no login.
Run: python pipeline/fetch_enso.py
Only refresh NOAA's outlook (monthly, 2nd Thursday): python pipeline/fetch_enso.py enso
"""
import html
import json
import pathlib
import re
import sys
import urllib.request
from datetime import datetime

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
ONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt"  # NOAA Oceanic Niño Index, 3-month seasons
ENSO_URL = "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml"  # NOAA CPC monthly ENSO discussion


def parse_enso(page):
    """NOAA CPC's ENSO discussion page -> {issued (ISO date), status, synopsis}. Fails loudly if NOAA changes the layout."""
    text = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", page)))
    issued = re.search(r"issued by CLIMATE PREDICTION CENTER\S* (\d{1,2} [A-Z][a-z]+ \d{4})", text)
    status = re.search(r"ENSO Alert System Status: (.+?) Synopsis: (.+?\.)(?: |$)", text)
    assert issued and status, "NOAA's ENSO discussion page changed layout: update parse_enso in pipeline/fetch_enso.py"
    return {"issued": datetime.strptime(issued[1], "%d %B %Y").date().isoformat(),
            "status": status[1].strip(), "synopsis": status[2].strip()}


def fetch_enso():
    with urllib.request.urlopen(ENSO_URL, timeout=120) as r:
        out = dict(parse_enso(r.read().decode("utf-8", "replace")), url=ENSO_URL)
    (RAW / "enso_outlook.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("NOAA outlook", out["issued"], out["status"])


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    fetch_enso()
    if sys.argv[1:] == ["enso"]:
        return
    with urllib.request.urlopen(ONI_URL, timeout=120) as r:
        (RAW / "oni.txt").write_bytes(r.read())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
