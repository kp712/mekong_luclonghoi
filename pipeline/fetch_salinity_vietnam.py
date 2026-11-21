"""Download and parse ALL salinity stations from KTTV (NCHMF) 10-day salinity bulletins
(https://kttv.gov.vn/kttv/vi-VN/1/xam-nhap-man-20-18.html) across Vietnam's Mekong Delta
and Southeast provinces -> data/raw/salinity_kttv_vietnam.json and
data/raw/salinity_vietnam_summary.json.

Run: py pipeline/fetch_salinity_vietnam.py
"""
import calendar
import datetime
import io
import json
import pathlib
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from collections import defaultdict

import pdfplumber


ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
KTTV_LIST_URL = "https://kttv.gov.vn/kttv/vi-VN/1/xam-nhap-man-20-18.html"

def clean(text):
    return unicodedata.normalize("NFC", re.sub(r'\s+', ' ', text or '')).strip()


def urlopen_retry(req, timeout, tries=3):
    """The proxy occasionally resets connections; HTTP errors (404) are not retried."""
    for i in range(tries):
        try:
            return urllib.request.urlopen(req, timeout=timeout)
        except urllib.error.HTTPError:
            raise
        except OSError:
            if i == tries - 1:
                raise
            time.sleep(2)


def probe_pdfs(have, failed):
    """HEAD-probe the date-patterned PDF URLs for 10th/20th/last day of Dec-May, 2024 to this year, not already known.
    The upload folder is thuyvan1 or thuyvan2; the issue hour is always 1500 (336 other hour guesses all 404'd).
    A network error (not a 404) is appended to `failed`."""
    found = {}
    for y in range(2024, datetime.date.today().year + 1):
        for m in (12, 1, 2, 3, 4, 5):
            for d in (10, 20, calendar.monthrange(y, m)[1]):
                dt = f"{y}-{m:02d}-{d:02d}"
                if dt in have:
                    continue
                for folder in ("thuyvan1", "thuyvan2"):
                    url = f"https://kttv.gov.vn/upload/{folder}/{y}/{m}/{d}/dbqg_xman_{y}{m:02d}{d:02d}_1500.pdf"
                    try:
                        urlopen_retry(urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"}), 30)
                        found[dt] = url
                        break
                    except urllib.error.HTTPError:
                        pass
                    except OSError as e:
                        print("  ERROR probe:", url, e)
                        failed.append(url)
    return found


def fetch_html(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen_retry(req, 30) as r:
        return r.read().decode("utf-8", "replace")


def discover_kttv_pdfs(failed):
    """Return {date_str: pdf_url} from the bulletins already on file + live kttv.gov.vn list + date probes.
    Listing, post-page and probe network errors are appended to `failed`."""
    pdfs = {}
    for name in ("salinity_bulletins.json", "salinity_kttv_vietnam.json"):
        existing = RAW / name
        if existing.exists():
            for dt, info in json.loads(existing.read_text(encoding="utf-8")).get("bulletins", {}).items():
                if info.get("url"):
                    pdfs[dt] = info["url"].replace("kttv.gov.vn//", "kttv.gov.vn/")
    posts, page = set(), 1
    while True:  # listing pages via ?pageindex=N; stop when a page adds no new posts
        try:
            html = fetch_html(f"{KTTV_LIST_URL}?pageindex={page}")
        except OSError as e:
            print(f"  ERROR listing page {page}:", e)
            failed.append(f"listing page {page}")
            break
        new = set(re.findall(r'href="(https?://kttv\.gov\.vn/[^"]*xam-nhap-man[^"]*\.html)"', html, re.I)) - posts
        if not new:
            break
        posts |= new
        page += 1
    for post_url in sorted(posts):
        try:
            phtml = fetch_html(post_url)
        except OSError as e:
            print("  ERROR post page:", post_url, e)
            failed.append(post_url)
            continue
        for pdf_url in re.findall(r'https?://[^\s"\'<>]+\.pdf', phtml, re.I):
            m = re.search(r'(\d{4})(\d{2})(\d{2})', pdf_url)
            dt = f"{m[1]}-{m[2]}-{m[3]}" if m else post_url
            pdfs[dt] = pdf_url.replace("kttv.gov.vn//", "kttv.gov.vn/")
    pdfs.update(probe_pdfs(pdfs, failed))
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
                    station = clean(r[idx_station])
                    smax = parse_float(r[idx_smax])
                    if not station or smax is None:
                        continue
                    river = clean(r[idx_river]) if idx_river is not None else ""
                    rows_out[station] = (river, smax)
                if rows_out:
                    return rows_out
    return rows_out


def lost_dates(old_bulletins, new_bulletins):
    """Bulletin dates on file that a new run would drop (the file must never shrink)."""
    return sorted(set(old_bulletins) - set(new_bulletins))


def keep_stored(err, dt, old_bulletins):
    """A bulletin on file whose PDF KTTV has since removed (HTTP 404) keeps its stored readings instead of blocking every
    later run; any other failure still stops the run."""
    return isinstance(err, urllib.error.HTTPError) and err.code == 404 and dt in old_bulletins


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    out_path = RAW / "salinity_kttv_vietnam.json"
    failed = []
    pdfs = discover_kttv_pdfs(failed)
    print(f"Found {len(pdfs)} KTTV salinity bulletin PDFs")

    old = json.loads(out_path.read_text(encoding="utf-8"))["bulletins"] if out_path.exists() else {}
    sum_path = RAW / "salinity_vietnam_summary.json"
    old_rivers = {k: v["river"] for k, v in json.loads(sum_path.read_text(encoding="utf-8")).items()} if sum_path.exists() else {}
    bulletins, rivers = {}, {}
    for dt, url in pdfs.items():
        print(f"Downloading & parsing {dt}: {url}", flush=True)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            table = extract_measured_table(urlopen_retry(req, 45).read())
        except Exception as e:
            if keep_stored(e, dt, old):
                print(f"  WARNING {dt}: PDF no longer online (404); keeping the readings on file", flush=True)
                bulletins[dt] = old[dt]
                continue
            print(f"  ERROR {dt}: {e}", flush=True)
            failed.append(dt)
            continue
        if not table:
            print(f"  ERROR {dt}: no measured-table rows", flush=True)
            failed.append(dt)
            continue
        bulletins[dt] = {"url": url, "readings": {k: v for k, (_, v) in table.items()}}
        for k, (river, _) in table.items():
            rivers.setdefault(k, river)
        print(f"  extracted {len(table)} stations", flush=True)

    if failed:
        sys.exit(f"{len(failed)} fetch(es) failed ({', '.join(failed)}); nothing written")
    if old:
        lost = lost_dates(old, bulletins)
        if lost:
            sys.exit(f"{len(lost)} bulletin(s) on file missing from this run ({', '.join(lost)}); nothing written")

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
        st: {"river": rivers.get(st, old_rivers.get(st, "")), "readings": len(r), "max_ppt": max(v for _, v in r),
             "first": min(d for d, _ in r), "last": max(d for d, _ in r)}
        for st, r in sorted(per_station.items())
    }
    sum_path.write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {sum_path} ({len(summary)} stations)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
