"""Download and parse ALL salinity stations from KTTV (NCHMF) 10-day salinity bulletins
(https://kttv.gov.vn/kttv/vi-VN/1/xam-nhap-man-20-18.html) across Vietnam's Mekong Delta
and Southeast provinces -> data/raw/salinity_kttv_vietnam.json and
data/raw/salinity_vietnam_summary.json.

Run: py pipeline/fetch_salinity_vietnam.py
"""
import io
import json
import pathlib
import re
import sys
import urllib.request
from collections import defaultdict

import pdfplumber


ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
KTTV_LIST_URL = "https://kttv.gov.vn/kttv/vi-VN/1/xam-nhap-man-20-18.html"

def fetch_html(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def discover_kttv_pdfs():
    """Return {date_str: pdf_url} from existing salinity_bulletins.json + live kttv.gov.vn list."""
    pdfs = {}
    existing = RAW / "salinity_bulletins.json"
    if existing.exists():
        b = json.loads(existing.read_text(encoding="utf-8")).get("bulletins", {})
        for dt, info in b.items():
            if info.get("url"):
                pdfs[dt] = info["url"].replace("kttv.gov.vn//", "kttv.gov.vn/")
    posts, page = set(), 1
    while True:  # listing pages via ?pageindex=N; stop when a page adds no new posts
        try:
            html = fetch_html(f"{KTTV_LIST_URL}?pageindex={page}")
        except OSError as e:
            print("Warning: could not fetch live KTTV list:", e)
            break
        new = set(re.findall(r'href="(https?://kttv\.gov\.vn/[^"]*xam-nhap-man[^"]*\.html)"', html, re.I)) - posts
        if not new:
            break
        posts |= new
        page += 1
    for post_url in sorted(posts):
        try:
            phtml = fetch_html(post_url)
        except OSError:
            continue
        for pdf_url in re.findall(r'https?://[^\s"\'<>]+\.pdf', phtml, re.I):
            m = re.search(r'(\d{4})(\d{2})(\d{2})', pdf_url)
            dt = f"{m[1]}-{m[2]}-{m[3]}" if m else post_url
            pdfs[dt] = pdf_url.replace("kttv.gov.vn//", "kttv.gov.vn/")
    return dict(sorted(pdfs.items()))


def parse_float(val):
    if val is None:
        return None
    s = str(val).strip().replace(",", ".")
    m = re.search(r'-?\d+(?:\.\d+)?', s)
    return float(m.group(0)) if m else None


def extract_measured_table(pdf_bytes):
    """Return {station: (river, Smax g/l)} from the measured table (STT, Trạm, Sông, Tỉnh, Smax).
    The province column only identifies the table; it is not stored (KTTV renamed provinces in 2025)."""
    rows_out = {}
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                if not table or len(table) < 2:
                    continue
                header = [re.sub(r'\s+', ' ', (c or '')).strip().lower() for c in table[0]]
                if not any('trạm' in h for h in header) or not any('tỉnh' in h for h in header):
                    continue
                idx_station = next((i for i, h in enumerate(header) if 'trạm' in h), None)
                idx_river = next((i for i, h in enumerate(header) if 'sông' in h), None)
                idx_smax = next((i for i, h in enumerate(header) if 'smax' in h), None)
                if idx_station is None or idx_smax is None:
                    continue
                for r in table[1:]:
                    if len(r) <= max(idx_station, idx_smax):
                        continue
                    station = re.sub(r'\s+', ' ', (r[idx_station] or '')).strip()
                    smax = parse_float(r[idx_smax])
                    if not station or smax is None:
                        continue
                    river = re.sub(r'\s+', ' ', (r[idx_river] or '')).strip() if idx_river is not None else ""
                    rows_out[station] = (river, smax)
                if rows_out:
                    return rows_out
    return rows_out


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    pdfs = discover_kttv_pdfs()
    print(f"Found {len(pdfs)} KTTV salinity bulletin PDFs")

    bulletins, rivers = {}, {}
    for dt, url in pdfs.items():
        print(f"Downloading & parsing {dt}: {url}", flush=True)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            table = extract_measured_table(urllib.request.urlopen(req, timeout=45).read())
        except Exception as e:
            print(f"  ERROR {dt}: {e}", flush=True)
            continue
        bulletins[dt] = {"url": url, "readings": {k: v for k, (_, v) in table.items()}}
        for k, (river, _) in table.items():
            rivers.setdefault(k, river)
        print(f"  extracted {len(table)} stations", flush=True)

    out_path = RAW / "salinity_kttv_vietnam.json"
    out_data = {
        "source": {
            "title": "NCHMF (Trung tâm Dự báo KTTV quốc gia), Tin dự báo xâm nhập mặn trên khu vực Nam Bộ",
            "url": KTTV_LIST_URL,
        },
        "bulletins": bulletins,
    }
    out_path.write_text(json.dumps(out_data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {out_path}")

    per_station = defaultdict(list)
    for dt, b in bulletins.items():
        for st, v in b["readings"].items():
            per_station[st].append((dt, v))
    summary = {
        st: {"river": rivers[st], "readings": len(r), "max_ppt": max(v for _, v in r),
             "first": min(d for d, _ in r), "last": max(d for d, _ in r)}
        for st, r in sorted(per_station.items())
    }
    sum_path = RAW / "salinity_vietnam_summary.json"
    sum_path.write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {sum_path} ({len(summary)} stations)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
