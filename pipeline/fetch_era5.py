"""Download ERA5 / ERA5-Land daily weather (Copernicus Climate Change Service, ECMWF) via the Open-Meteo archive API
for every point of sites.points() -> data/raw/era5_<id>.json.gz, Dec 2000 to yesterday (build averages use build.PERIOD).
Two requests per point: models=era5 (Tmax, Tmin, FAO-56 ET0) and models=era5_land (Tmax, for heat days). Free, no login.
Run: python pipeline/fetch_era5.py   (points already saved this month are skipped; backs off on HTTP 429)
Exits 1 if the API's daily quota is used up: run it again later and it resumes with the points still missing.
The two series are saved side by side and never filled from each other: a day ERA5-Land lacks stays null.
"""
import gzip
import json
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta

from sites import points

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
URL = "https://archive-api.open-meteo.com/v1/archive"
START = "2000-12-01"
MODELS = {"era5": ("temperature_2m_max", "temperature_2m_min", "et0_fao_evapotranspiration"), "era5_land": ("temperature_2m_max",)}
KEYS = {"era5": ("tmax", "tmin", "et0"), "era5_land": ("tmax_land",)}
TITLE = "ERA5 / ERA5-Land (Copernicus Climate Change Service, ECMWF) via Open-Meteo"


def get(point, model, end):
    """One Open-Meteo archive response for one point and model. Waits and retries on HTTP 429 (per-minute limit); stops on the daily limit."""
    q = urllib.parse.urlencode({"latitude": point["lat"], "longitude": point["lon"], "start_date": START, "end_date": end,
                                "daily": ",".join(MODELS[model]), "models": model, "timezone": "Asia/Bangkok"})
    for i in range(6):
        try:
            with urllib.request.urlopen(f"{URL}?{q}", timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            if (e.code != 429 or "Daily" in body) and e.code < 500:  # 5xx: a passing server error, retried
                raise SystemExit(f"{point['id']} {model}: HTTP {e.code} {body[:200]}")
            time.sleep(30 * 2 ** i)
        except OSError:
            time.sleep(5 * 2 ** i)
    raise SystemExit(f"{point['id']} {model}: no answer after 6 tries")


def fetch(point, end):
    out = {"source": {"title": TITLE, "url": "https://open-meteo.com/en/docs/historical-weather-api", "licence": "CC BY 4.0",
                      "fetched": date.today().isoformat(), "cells": {}}, "daily": {}}
    for model, keys in KEYS.items():
        r = get(point, model, end)
        out["source"]["cells"][model] = [r["latitude"], r["longitude"]]
        if "time" not in out["daily"]:
            out["daily"]["time"] = r["daily"]["time"]
        assert r["daily"]["time"] == out["daily"]["time"], (point["id"], model, "dates differ between the two models")
        for k, name in zip(keys, MODELS[model]):
            out["daily"][k] = r["daily"][name]
    return out


def fresh(path):
    """True if the file was fetched this month (from its own "fetched" date: a git checkout resets file times)."""
    return path.exists() and json.loads(gzip.decompress(path.read_bytes()))["source"]["fetched"][:7] == date.today().isoformat()[:7]


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    end = (date.today() - timedelta(days=1)).isoformat()
    for p in points():
        path = RAW / f"era5_{p['id']}.json.gz"
        if fresh(path):
            continue
        print("fetching", p["id"], flush=True)
        # mtime=0 keeps the gzip bytes the same when the values are the same
        path.write_bytes(gzip.compress(json.dumps(fetch(p, end)).encode("utf-8"), mtime=0))
        time.sleep(1)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
