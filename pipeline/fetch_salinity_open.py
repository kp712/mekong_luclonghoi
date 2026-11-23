"""Older open salinity series for 3 KTTV stations -> data/raw/salinity_open_series.json (dry seasons 1999-2016 only).

  Mendeley Data 10.17632/fm996rrfyz.1 (CC BY 4.0), xlsx sheet "Max. salinity": one yearly maximum (g/l, read as ‰) for
      Trà Vinh and Cầu Quan. No month.
  GFZ 10.5880/GFZ.4.4.2024.004 (CC BY 4.0), csv of Sơn Đốc every 2 hours: each dry season (Oct-Jun, named by its end year)
      keeps its maximum and the month of it; partial = no February or no March reading (the rule of salinity.kttv_seasons).

Run: python3 pipeline/fetch_salinity_open.py   (needs openpyxl; exits 1 on any download or name failure)
"""
import csv
import io
import json
import pathlib
import sys
import urllib.request

import openpyxl

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
MENDELEY = "https://data.mendeley.com/public-files/datasets/fm996rrfyz/files/ab873959-0e6c-4db0-8b87-d32334eca66d/file_downloaded"
GFZ = "https://datapub.gfz.de/download/10.5880.GFZ.4.4.2024.004-QWn/2024-004_Apel_salinity_SONDOC_1996-2016.csv"
FIRST, LAST = 1999, 2016
# Mendeley column header -> KTTV station name (data/raw/kttv_stations.json). The identity of Mendeley's "Trà Vinh" with the KTTV one is assumed.
COLS = {"Max. salinity at TraVinh (g/l)": "Trà Vinh", "Max. salinity at CauQuan (g/l)": "Cầu Quan"}
README = ("Older salinity seasons (1999-2016) of three KTTV stations from two open datasets, so the salt window starts in 1999. "
          "Trà Vinh and Cầu Quan: Mendeley Data 10.17632/fm996rrfyz.1 (Doan Van Binh et al., CC BY 4.0), the yearly maximum, g/l read as ‰ "
          "(house convention), no month, so a season counts toward the level and never toward salt months. Mendeley's station named 'Trà Vinh' "
          "is ASSUMED to be KTTV's 'Trà Vinh' (unconfirmed). Sơn Đốc: GFZ 10.5880/GFZ.4.4.2024.004 (Apel et al., data from SRHMC, CC BY 4.0), the "
          "highest 2-hourly reading of each Oct-Jun season and its month (GFZ's site is 3.5 km from KTTV's approximate Sơn Đốc position); "
          "partial = no reading in February or none in March. Coverage is patchy, so a maximum can understate the season. "
          "Where a KTTV bulletin season covers the same station and year, the KTTV value wins (none before 2024).")


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "mekong-rotation-explorer"}), timeout=120).read()


def mendeley(blob):
    ws = openpyxl.load_workbook(io.BytesIO(blob), data_only=True)["Max. salinity"]
    rows = list(ws.iter_rows(values_only=True))
    head = [str(c).strip() if c else "" for c in next(r for r in rows if r and r[0] == "Year")] if any(r and r[0] == "Year" for r in rows) else None
    if not head or any(h not in head for h in COLS):
        raise ValueError(f"Mendeley columns not as expected: {head}")
    out = {n: {} for n in COLS.values()}
    for r in rows:
        if isinstance(r[0], int) and FIRST <= r[0] <= LAST:
            for h, n in COLS.items():
                out[n][str(r[0])] = {"ppt": float(r[head.index(h)]), "month": None, "src": "mendeley"}
    return out


def gfz(text):
    by = {}
    for r in csv.reader(io.StringIO(text.lstrip("﻿")), delimiter=";"):
        if not r or r[0].startswith("#") or r[0] == "DATETIME":
            continue
        if not r[1].strip():  # an empty reading
            continue
        d, v = r[0], float(r[1])
        m = int(d[5:7])
        by.setdefault(int(d[:4]) + (m >= 10), []).append((v, m))
    out = {}
    for y, rs in sorted(by.items()):
        if FIRST <= y <= LAST:
            ppt, m = max(rs, key=lambda r: r[0])
            out[str(y)] = {"ppt": round(ppt, 1), "month": m, "partial": not {2, 3} <= {x[1] for x in rs}, "src": "gfz"}
    return out


def main():
    try:
        st = mendeley(get(MENDELEY))
        st["Sơn Đốc"] = gfz(get(GFZ).decode("utf-8"))
        known = json.loads((RAW / "kttv_stations.json").read_text(encoding="utf-8"))["stations"]
        missing = [n for n in st if n not in known]
        if missing or any(not s for s in st.values()):
            raise ValueError(f"station not in kttv_stations.json or no seasons: {missing}")
    except Exception as e:  # nothing is written on any failure
        print("fetch_salinity_open failed:", e)
        return 1
    sources = {"mendeley": {"doi": "10.17632/fm996rrfyz.1", "licence": "CC BY 4.0", "url": MENDELEY},
               "gfz": {"doi": "10.5880/GFZ.4.4.2024.004", "licence": "CC BY 4.0", "url": GFZ}}
    (RAW / "salinity_open_series.json").write_text(
        json.dumps({"_readme": README, "sources": sources, "stations": st}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print({n: f"{min(s)}-{max(s)} ({len(s)})" for n, s in st.items()})
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    sys.exit(main())
