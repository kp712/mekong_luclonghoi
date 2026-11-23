"""Season maxima from the GFZ Son Doc csv and the Mendeley xlsx. Usage: salt_probe_datasets.py SONDOC_CSV MENDELEY_XLSX"""
import sys, csv, json, collections, openpyxl
out = {}
rows = [r for r in csv.reader(open(sys.argv[1], encoding="utf-8-sig"), delimiter=";") if r and not r[0].startswith("#") and r[0] != "DATETIME"]
by = collections.defaultdict(list)  # dry season Nov(y-1)..Jun(y) keyed by y of Dec-onward? use Oct-Jun season
for r in rows:
    try: d, v = r[0], float(r[1])
    except ValueError: continue
    y, m = int(d[:4]), int(d[5:7])
    by[y + (1 if m >= 10 else 0)].append((d[:10], m, v))
out["sondoc"] = {"n": len(rows), "extra_cols": rows[0][2:] if rows else None, "seasons": {
    s: {"n": len(v), "max": max(x[2] for x in v), "max_date": max(v, key=lambda x: x[2])[0],
        "months": sorted({x[1] for x in v}), "days": len({x[0] for x in v})} for s, v in sorted(by.items())}}
ws = openpyxl.load_workbook(sys.argv[2], data_only=True)["Max. salinity"]
out["mendeley_annual_max_gl"] = {r[0]: {"TraVinh": r[1], "CauQuan": r[2]} for r in ws.iter_rows(min_row=2, values_only=True) if isinstance(r[0], int)}
print(json.dumps(out, ensure_ascii=False, indent=1))
