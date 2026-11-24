"""3-month rain outlook at the 5 Sóc Trăng pins -> data/raw/seasonal.json. ECMWF SEAS5 via the Open-Meteo Seasonal API (free, no login, CC BY 4.0).
Run: python pipeline/fetch_seasonal.py   (exits 1 and writes nothing if any pin fails)

The API gives the ensemble-mean monthly rain (precipitation_mean) and its anomaly against the model's own hindcast climatology
(precipitation_anomaly). anom_pct = anomaly / climatological mean x 100, where climatological mean = mean - anomaly.
Label (team choice, not an ECMWF or WMO rule): beyond +20% wetter, below -20% drier, else normal. Not bias-corrected.
"""
import json
import pathlib
import sys
import urllib.request
from datetime import date

from sites import SITES

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
URL = "https://seasonal-api.open-meteo.com/v1/seasonal?latitude={lat}&longitude={lon}&models=ecmwf_seas5&monthly=precipitation_mean,precipitation_anomaly&forecast_days=100"
MONTHS = 3
BAND = 20  # percent of the month's climatological mean


def label(anom_pct):
    return "wetter" if anom_pct > BAND else "drier" if anom_pct < -BAND else "normal"


def parse(resp):
    """One API response -> [{month, anom_pct, label}] for the first 3 months; ValueError on anything unexpected."""
    try:
        m = resp["monthly"]
        out = []
        for t, mean, anom in list(zip(m["time"], m["precipitation_mean"], m["precipitation_anomaly"]))[:MONTHS]:
            clim = mean - anom
            if clim <= 0:
                raise ValueError(f"climatological mean {clim} at {t}")
            pct = round(anom / clim * 100, 1)
            out.append({"month": t[:7], "anom_pct": pct, "label": label(pct)})
    except (KeyError, TypeError) as e:
        raise ValueError(f"unexpected Open-Meteo response: {e!r}")
    if len(out) < MONTHS:
        raise ValueError(f"only {len(out)} months in the response")
    return out


def main():
    points, today = {}, date.today().isoformat()
    for s in SITES:
        with urllib.request.urlopen(URL.format(lat=s["lat"], lon=s["lon"]), timeout=60) as r:
            points[s["id"]] = parse(json.load(r))
    first = {p[0]["month"] for p in points.values()}
    if len(first) != 1:
        raise ValueError(f"pins start in different months: {first}")
    # SEAS5 runs start on the 1st of a month (released about the 5th); the API does not state it, so the issue date is the 1st of the first month
    out = {"issued": first.pop() + "-01", "fetched": today, "model": "ECMWF SEAS5 via Open-Meteo (not bias-corrected)", "points": points}
    RAW.mkdir(parents=True, exist_ok=True)
    (RAW / "seasonal.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote seasonal.json, issued", out["issued"], {k: [x["label"] for x in v] for k, v in points.items()})


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    try:
        main()
    except Exception as e:  # nothing is written before every pin parsed
        print("seasonal fetch failed:", e, file=sys.stderr)
        sys.exit(1)
