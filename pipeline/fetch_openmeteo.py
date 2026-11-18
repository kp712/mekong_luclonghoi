"""Download Open-Meteo ERA5-Land historical daily weather for every pin -> data/raw/openmeteo_<id>.json.
Free, no login, ~9 km resolution. Skips pins already saved.
"""
import json
import pathlib
import time
import urllib.request

from sites import SITES

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
URL = (
    "https://archive-api.open-meteo.com/v1/archive"
    "?latitude={lat}&longitude={lon}"
    "&start_date=2000-01-01&end_date=2025-12-31"
    "&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration"
    "&timezone=Asia%2FHo_Chi_Minh"
)


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    for s in SITES:
        out = RAW / f"openmeteo_{s['id']}.json"
        if out.exists():
            continue
        print("fetching", s["id"], flush=True)
        for attempt in range(6):
            try:
                with urllib.request.urlopen(URL.format(**s), timeout=120) as r:
                    data = json.load(r)
                out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
                break
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt < 5:
                    wait = 15 * (attempt + 1)
                    print(f"  429 rate-limited, waiting {wait}s...", flush=True)
                    time.sleep(wait)
                else:
                    raise
        time.sleep(5)


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
