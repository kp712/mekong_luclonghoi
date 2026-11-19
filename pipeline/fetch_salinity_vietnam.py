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

from vietnam_sites import VIETNAM_SITES

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
KTTV_LIST_URL = "https://kttv.gov.vn/kttv/vi-VN/1/xam-nhap-man-20-18.html"

# Map KTTV province names (normalized) to our 63-province IDs
PROVINCE_MAP = {
    "hồ chí minh": "ho_chi_minh",
    "tp. hồ chí minh": "ho_chi_minh",
    "tp hcm": "ho_chi_minh",
    "long an": "long_an",
    "tiền giang": "tien_giang",
    "bến tre": "ben_tre",
    "trà vinh": "tra_vinh",
    "vĩnh long": "vinh_long",
    "đồng tháp": "dong_thap",
    "an giang": "an_giang",
    "kiên giang": "kien_giang",
    "cần thơ": "can_tho",
    "hậu giang": "hau_giang",
    "sóc trăng": "soc_trang",
    "bạc liêu": "bac_lieu",
    "cà mau": "ca_mau",
    "đồng nai": "dong_nai",
    "bà rịa - vũng tàu": "ba_ria_vung_tau",
    "tây ninh": "tay_ninh",
}

COASTAL_NORTH_CENTRAL = {
    "quang_ninh", "hai_phong", "thai_binh", "nam_dinh", "ninh_binh",
    "thanh_hoa", "nghe_an", "ha_tinh", "quang_binh", "quang_tri", "thua_thien_hue",
    "da_nang", "quang_nam", "quang_ngai", "binh_dinh", "phu_yen", "khanh_hoa",
    "ninh_thuan", "binh_thuan", "ba_ria_vung_tau",
}


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
    try:
        html = fetch_html(KTTV_LIST_URL)
        posts = set(re.findall(r'href="(https?://kttv\.gov\.vn/[^"]*xam-nhap-man[^"]*\.html)"', html, re.I))
        for post_url in sorted(posts):
            try:
                phtml = fetch_html(post_url)
                for pdf_url in re.findall(r'https?://[^\s"\'<>]+\.pdf', phtml, re.I):
                    m = re.search(r'(\d{4})(\d{2})(\d{2})', pdf_url)
                    dt = f"{m[1]}-{m[2]}-{m[3]}" if m else post_url
                    pdfs[dt] = pdf_url.replace("kttv.gov.vn//", "kttv.gov.vn/")
            except OSError:
                pass
    except OSError as e:
        print("Warning: could not fetch live KTTV list:", e)
    return dict(sorted(pdfs.items()))


def parse_float(val):
    if val is None:
        return None
    s = str(val).strip().replace(",", ".")
    m = re.search(r'-?\d+(?:\.\d+)?', s)
    return float(m.group(0)) if m else None


def extract_measured_table(pdf_bytes):
    """Extract the measured salinity table (first table with STT, Trạm, Sông, Tỉnh, Smax)."""
    rows_out = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                if not table or len(table) < 2:
                    continue
                header = [re.sub(r'\s+', ' ', (c or '')).strip().lower() for c in table[0]]
                if not any('trạm' in h for h in header) or not any('tỉnh' in h for h in header):
                    continue
                # Measured table usually has a comparison column ("so sánh") or is the first table
                idx_station = next((i for i, h in enumerate(header) if 'trạm' in h), None)
                idx_river = next((i for i, h in enumerate(header) if 'sông' in h), None)
                idx_prov = next((i for i, h in enumerate(header) if 'tỉnh' in h), None)
                idx_dist = next((i for i, h in enumerate(header) if 'k/c' in h or 'cửa' in h), None)
                idx_smax = next((i for i, h in enumerate(header) if 'smax' in h), None)
                if idx_station is None or idx_prov is None or idx_smax is None:
                    continue
                for r in table[1:]:
                    if len(r) <= max(idx_station, idx_prov, idx_smax):
                        continue
                    station = re.sub(r'\s+', ' ', (r[idx_station] or '')).strip()
                    prov = re.sub(r'\s+', ' ', (r[idx_prov] or '')).strip()
                    if not station or not prov:
                        continue
                    smax = parse_float(r[idx_smax])
                    if smax is None:
                        continue
                    rows_out.append({
                        "station": station,
                        "river": re.sub(r'\s+', ' ', (r[idx_river] or '')).strip() if idx_river is not None else None,
                        "province": prov,
                        "province_id": PROVINCE_MAP.get(prov.lower()),
                        "distance_km": parse_float(r[idx_dist]) if idx_dist is not None else None,
                        "smax_gl": smax,
                    })
                if rows_out:
                    return rows_out
    return rows_out


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    pdfs = discover_kttv_pdfs()
    print(f"Found {len(pdfs)} KTTV salinity bulletin PDFs")

    out_path = RAW / "salinity_kttv_vietnam.json"
    bulletins = {}
    if out_path.exists():
        bulletins = json.loads(out_path.read_text(encoding="utf-8")).get("bulletins", {})

    for dt, url in pdfs.items():
        if dt in bulletins and bulletins[dt].get("stations"):
            continue
        print(f"Downloading & parsing {dt}: {url}", flush=True)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            pdf_bytes = urllib.request.urlopen(req, timeout=45).read()
            stations = extract_measured_table(pdf_bytes)
            bulletins[dt] = {"url": url, "stations": stations}
            print(f"  extracted {len(stations)} stations", flush=True)
        except Exception as e:
            print(f"  ERROR {dt}: {e}", flush=True)

    out_data = {
        "source": {
            "title": "NCHMF (Trung tâm Dự báo KTTV quốc gia), Tin dự báo xâm nhập mặn trên khu vực Nam Bộ",
            "url": KTTV_LIST_URL,
        },
        "bulletins": dict(sorted(bulletins.items())),
    }
    out_path.write_text(json.dumps(out_data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {out_path}")

    # Build 63-province summary
    prov_stations = defaultdict(lambda: defaultdict(list))
    for dt, b in bulletins.items():
        for st in b.get("stations", []):
            pid = st.get("province_id")
            if pid:
                prov_stations[pid][st["station"]].append({
                    "date": dt,
                    "smax_gl": st["smax_gl"],
                    "river": st["river"],
                    "distance_km": st["distance_km"],
                })

    summary = {}
    for s in VIETNAM_SITES:
        pid = s["id"]
        if pid in prov_stations:
            all_vals = [r["smax_gl"] for recs in prov_stations[pid].values() for r in recs]
            stations_summary = {}
            for st_name, recs in sorted(prov_stations[pid].items()):
                vals = [r["smax_gl"] for r in recs]
                stations_summary[st_name] = {
                    "river": recs[0]["river"],
                    "distance_km": recs[0]["distance_km"],
                    "readings": len(vals),
                    "max_smax_gl": max(vals),
                    "mean_smax_gl": round(sum(vals) / len(vals), 2),
                }
            summary[pid] = {
                "name": s["name"],
                "region": s["region"],
                "status": "kttv_monitored",
                "max_smax_gl": max(all_vals),
                "stations": stations_summary,
            }
        elif pid in COASTAL_NORTH_CENTRAL:
            summary[pid] = {
                "name": s["name"],
                "region": s["region"],
                "status": "coastal_no_kttv_bulletin",
                "note": "Coastal province outside KTTV Southern 10-day salinity bulletins",
            }
        else:
            summary[pid] = {
                "name": s["name"],
                "region": s["region"],
                "status": "inland_freshwater",
                "note": "Inland/highland province; no coastal salinity intrusion",
            }

    sum_path = RAW / "salinity_vietnam_summary.json"
    sum_path.write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
    monitored = sum(1 for v in summary.values() if v["status"] == "kttv_monitored")
    print(f"wrote {sum_path} ({monitored} KTTV-monitored provinces, {len(summary)} total provinces)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
