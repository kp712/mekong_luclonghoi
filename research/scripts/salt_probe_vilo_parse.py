"""Parse a Vinh Long XMAN (VILO) bulletin: measured Smax table. Usage: salt_probe_vilo_parse.py FILE.pdf [json_out]
Tables: pages before the 'Dự báo độ mặn cao nhất' heading are measured; later ones are forecast (skipped).
River label is a merged cell: forward-fill it down rows and across pages (checked on 4 issues)."""
import sys, re, json, pdfplumber
def num(s):
    s = (s or "").replace(",", ".").strip()
    try: return float(s)
    except ValueError: return None
def parse(path):
    rows, river, forecast = [], None, False
    with pdfplumber.open(path) as pdf:
        head = pdf.pages[0].extract_text()
        meta = {"number": re.search(r"Số: (\S+)", head).group(1),
                "period": re.search(r"\(Từ ngày ([^)]*)\)", head).group(1),
                "issued": re.search(r"Vĩnh Long, ngày ([^\n]*?2\d{3})", head).group(1)}
        for pg in pdf.pages:
            if "Dự báo độ mặn cao nhất tại các trạm" in (pg.extract_text() or ""): forecast = True
            if forecast: continue
            for tb in pg.extract_tables():
                if not tb or tb[0][1] != "Trạm": continue
                for r in tb[1:]:
                    if r[0]: river = r[0]
                    rows.append({"river": river, "station": r[1], "km": num(r[2]), "smax": num(r[3]),
                                 "days": r[4] if num(r[3]) is not None else r[4] or None, "last_year": num(r[5])})
    return meta, rows
if __name__ == "__main__":
    meta, rows = parse(sys.argv[1])
    print(meta, len(rows))
    for r in rows: print(r)
    assert len(rows) >= 40 and all(r["river"] for r in rows)
    if len(sys.argv) > 2: json.dump({"meta": meta, "rows": rows}, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
