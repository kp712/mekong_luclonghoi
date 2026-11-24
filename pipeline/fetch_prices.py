"""Bạc Liêu wholesale rice price (5% broken), monthly averages in VND/kg -> data/raw/rice_price.json.
Source: FAO FPMA (free JSON API, no login), which republishes the Vietnam Food Association's weekly prices; the monthly averages are FPMA's.
Run: python pipeline/fetch_prices.py   (exits 1 and writes nothing if the series is not found exactly once or the data look wrong)
The series is found by market and commodity name in the country listing, not by a fixed uuid; the uuid is stored in the file.
"""
import json
import pathlib
import sys
import unicodedata
import urllib.request
from datetime import date

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
API = "https://fpma.fao.org/giews/v4/global/price_module/api/v1/"
LIST = API + "FpmaSerieDomestic/?iso3_country_code=VNM&format=json"
SERIES = API + "FpmaSeriePrice/{uuid}/?format=json"
MARKET, COMMODITY = "bac lieu", "Rice (5% broken)"  # FPMA writes the market without diacritics


def plain(s):
    return unicodedata.normalize("NFKD", s).replace("đ", "d").replace("Đ", "D").encode("ascii", "ignore").decode().lower().strip()


def find(listing):
    """The one series for Bạc Liêu rice 5%; ValueError if there are none or several."""
    hit = [r for r in listing["results"] if plain(r["market_name"]) == MARKET and r["commodity_name"] == COMMODITY]
    if len(hit) != 1:
        raise ValueError(f"expected 1 series for {MARKET} / {COMMODITY}, found {len(hit)}")
    return hit[0]


def parse(meta, series, today=None):
    """FPMA series metadata + price response -> the raw file's content (monthly averages, oldest first, complete months only: the current month's average may cover part of it)."""
    this = (today or date.today()).isoformat()[:7]
    try:
        if series["uuid"] != meta["uuid"]:
            raise ValueError("series uuid does not match the listing")
        months = sorted({p["date"][:7]: round(float(p["price_value"]), 2) for p in series["datapoints"] if p["periodicity"] == "monthly" and p["price_value"] is not None and p["date"][:7] < this}.items())
    except (KeyError, TypeError) as e:
        raise ValueError(f"unexpected FPMA response: {e!r}")
    if len(months) < 12 or not all(1000 <= v <= 100000 for _, v in months):
        raise ValueError(f"{len(months)} months, or a value outside 1,000-100,000 VND/kg")
    return {"uuid": meta["uuid"], "market": meta["market_name"], "commodity": meta["commodity_name"], "price_type": meta["price_type"],  # FPMA's own label (a quirk: its market_type says "Retail")
            "unit": "VND/kg", "source": meta["source_name"], "source_url": meta["source_url"], "fetched": (today or date.today()).isoformat(),
            "months": [{"month": m, "vnd_kg": v} for m, v in months]}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "mekong-rotation-explorer/1.0"}), timeout=60) as r:  # FPMA answers 403 to Python's default agent
        return json.load(r)


def main():
    meta = find(get(LIST))
    out = parse(meta, get(SERIES.format(uuid=meta["uuid"])))
    RAW.mkdir(parents=True, exist_ok=True)
    (RAW / "rice_price.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote rice_price.json", out["uuid"], out["months"][0]["month"], "-", out["months"][-1])


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    try:
        main()
    except Exception as e:  # nothing is written before the whole series parsed
        print("price fetch failed:", e, file=sys.stderr)
        sys.exit(1)
