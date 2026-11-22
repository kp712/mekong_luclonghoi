"""Compare CHIRPS v3.0 / v2.0 monthly rain with the app's IMERG Final v07 (data/raw/gpm.json) and with GSOD station months.
Inputs: <dir>/chirps_v3.json, chirps_v2.json (chirps_points.py over sites.points()), <dir>/stations/chirps_v3.json, chirps_v2.json
(chirps_points.py with stations/points.json), <dir>/gsod/g_<id>_<year>.csv from
https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/<year>/<id>.csv.
Run: python3 -I research/scripts/chirps_vs_imerg.py <dir>   (prints Markdown tables; rain_pin_test.md)"""
import calendar, csv, glob, json, os, statistics as st, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
sys.path.insert(0, os.path.join(ROOT, "pipeline"))
import sites

D = sys.argv[1]
IM = json.load(open(os.path.join(ROOT, "data", "raw", "gpm.json")))
V3 = json.load(open(os.path.join(D, "chirps_v3.json")))
V2 = json.load(open(os.path.join(D, "chirps_v2.json")))
PINS = [s["id"] for s in sites.SITES]
PTS = [p["id"] for p in sites.points()]


def seasons(a, b):
    """Dec-Nov seasons starting Dec a .. Dec b-1 -> list of (season start year, [12 'YYYY-MM' keys])."""
    return [(y, [f"{y}-12"] + [f"{y + 1}-{m:02d}" for m in range(1, 12)]) for y in range(a, b)]


APP = seasons(2000, 2024)  # build.PERIOD: Dec 2000 - Nov 2024, 24 seasons
OVER = [k for y, ks in seasons(2000, 2025) for k in ks if k <= "2025-09"]  # every IMERG month from Dec 2000
DRY = ("12", "01", "02", "03", "04")


def r(a, b):
    return st.correlation(a, b)


def annual(src, pid, ss=APP):
    return st.mean(sum(src[pid][k] for k in ks) for y, ks in ss)


def dry(src, pid, ss=APP):
    return [sum(src[pid][k] for k in ks if k[5:] in DRY) for y, ks in ss]


def pct(a, b):
    return f"{100 * (a - b) / b:+.0f}%"


def check():
    """Self-check: every point has every month from Jan 1981 to Oct 2026 in both CHIRPS files, no ocean (None) cells."""
    for src in (V3, V2):
        for pid in PTS:
            assert len(src[pid]) == 550 and None not in src[pid].values(), pid


def table_points():
    print("| point | r v3-IMERG | r v2-IMERG | r v3-v2 | IMERG mm/yr | v2 mm/yr | v3 mm/yr | v2 vs IMERG | v3 vs IMERG | v3 vs v2 "
          "| dry IMERG | dry v2 | dry v3 | dry v3 vs IMERG | dry-season r v3-IMERG |")
    print("|" + "---|" * 15)
    rows = []
    for pid in PTS:
        im, a2, a3 = (annual(s, pid) for s in (IM, V2, V3))
        d_im, d2, d3 = (dry(s, pid) for s in (IM, V2, V3))
        row = (r([V3[pid][k] for k in OVER], [IM[pid][k] for k in OVER]), r([V2[pid][k] for k in OVER], [IM[pid][k] for k in OVER]),
               r([V3[pid][k] for k in OVER], [V2[pid][k] for k in OVER]), im, a2, a3, st.mean(d_im), st.mean(d2), st.mean(d3), r(d3, d_im))
        rows.append(row)
        print(f"| {pid}{' (pin)' if pid in PINS else ''} | {row[0]:.2f} | {row[1]:.2f} | {row[2]:.2f} | {im:.0f} | {a2:.0f} | {a3:.0f} "
              f"| {pct(a2, im)} | {pct(a3, im)} | {pct(a3, a2)} | {row[6]:.0f} | {row[7]:.0f} | {row[8]:.0f} | {pct(row[8], row[6])} | {row[9]:.2f} |")
    m = [st.mean(c) for c in zip(*rows)]
    print(f"| **mean of 19** | {m[0]:.2f} | {m[1]:.2f} | {m[2]:.2f} | {m[3]:.0f} | {m[4]:.0f} | {m[5]:.0f} | {pct(m[4], m[3])} "
          f"| {pct(m[5], m[3])} | {pct(m[5], m[4])} | {m[6]:.0f} | {m[7]:.0f} | {m[8]:.0f} | {pct(m[8], m[6])} | {m[9]:.2f} |")
    pooled = [(V3[p][k], V2[p][k], IM[p][k]) for p in PTS for k in OVER]
    print(f"\nPooled monthly r over {len(pooled)} point-months: v3-IMERG {r(*[[x[0] for x in pooled], [x[2] for x in pooled]]):.3f}, "
          f"v2-IMERG {r([x[1] for x in pooled], [x[2] for x in pooled]):.3f}, v3-v2 {r([x[0] for x in pooled], [x[1] for x in pooled]):.3f}")
    rmse = lambda i: (st.mean([(x[i] - x[2]) ** 2 for x in pooled])) ** .5
    print(f"Pooled monthly RMSE vs IMERG: v3 {rmse(0):.0f} mm, v2 {rmse(1):.0f} mm")


def monthly_means(src, pid_list, ss):
    return [st.mean(src[p][ks[i]] for p in pid_list for y, ks in ss) for i in range(12)]


def table_typical():
    names = ["Dec"] + [calendar.month_abbr[m] for m in range(1, 12)]
    for label, pl in (("5 Sóc Trăng pins", PINS), ("all 19 points", PTS)):
        rows = [("IMERG v07, Dec 2000-Nov 2024 (app now)", monthly_means(IM, pl, APP)),
                ("CHIRPS v2, Dec 2000-Nov 2024", monthly_means(V2, pl, APP)),
                ("CHIRPS v3, Dec 2000-Nov 2024", monthly_means(V3, pl, APP)),
                ("CHIRPS v3, Dec 1981-Nov 2025 (44 seasons)", monthly_means(V3, pl, seasons(1981, 2025))),
                ("CHIRPS v3, Dec 1981-Nov 2000 (19 seasons)", monthly_means(V3, pl, seasons(1981, 2000))),
                ("CHIRPS v2, Dec 1981-Nov 2025", monthly_means(V2, pl, seasons(1981, 2025)))]
        print(f"\nTypical-year monthly mean rain (mm), {label}\n")
        print("| series | " + " | ".join(names) + " | Dec-Apr | year |")
        print("|" + "---|" * 15)
        for n, v in rows:
            print(f"| {n} | " + " | ".join(f"{x:.0f}" for x in v) + f" | {sum(v[:5]):.0f} | {sum(v):.0f} |")
        im = rows[0][1]
        for n, v in rows[1:3]:
            print(f"| {n.split(',')[0]} minus IMERG | " + " | ".join(f"{a - b:+.0f}" for a, b in zip(v, im))
                  + f" | {sum(v[:5]) - sum(im[:5]):+.0f} | {sum(v) - sum(im):+.0f} |")


def table_v3_v2():
    print("\nCHIRPS v3 / v2 ratio of the 19-point mean, by period\n")
    print("| period | v2 mm/yr | v3 mm/yr | v3/v2 | v2 Dec-Apr | v3 Dec-Apr | v3/v2 Dec-Apr |")
    print("|---|---|---|---|---|---|---|")
    for a, b in ((1981, 2000), (2000, 2024), (2024, 2025), (1981, 2025)):
        ss = seasons(a, b)
        y2, y3 = (st.mean(annual(s, p, ss) for p in PTS) for s in (V2, V3))
        d2, d3 = (st.mean(st.mean(dry(s, p, ss)) for p in PTS) for s in (V2, V3))
        print(f"| Dec {a} - Nov {b} | {y2:.0f} | {y3:.0f} | {y3 / y2:.3f} | {d2:.0f} | {d3:.0f} | {d3 / d2:.3f} |")


def latest12():
    ks = [f"2025-{m:02d}" for m in (11, 12)] + [f"2026-{m:02d}" for m in range(1, 11)]
    print("\nLatest 12 months (Nov 2025 - Oct 2026), mean of the 5 pins, mm; IMERG has none of them\n")
    print("| series | " + " | ".join(k for k in ks) + " | total |")
    print("|" + "---|" * 14)
    for n, s in (("CHIRPS v3", V3), ("CHIRPS v2", V2)):
        v = [st.mean(s[p][k] for p in PINS) for k in ks]
        print(f"| {n} | " + " | ".join(f"{x:.0f}" for x in v) + f" | {sum(v):.0f} |")


def gsod_months(sid, strict):
    """{'YYYY-MM': mm} for months with valid days >= 90% of the month. Valid: PRCP not 99.99 and flag not I (no report);
    strict also needs a whole-day flag (D = four 6 h, F = two 12 h, G = one 24 h report)."""
    days = {}
    for f in glob.glob(os.path.join(D, "gsod", f"g_{sid}_*.csv")):
        for row in csv.DictReader(open(f, encoding="utf-8-sig")):
            p, fl = float(row["PRCP"]), row["PRCP_ATTRIBUTES"].strip()
            if p < 99.99 and fl != "I" and (fl in "DFG" if strict else True):
                days[row["DATE"]] = p * 25.4
    out = {}
    for k in sorted({d[:7] for d in days}):
        y, m = map(int, k.split("-"))
        got = [v for d, v in days.items() if d[:7] == k]
        if len(got) >= 0.9 * calendar.monthrange(y, m)[1]:
            out[k] = sum(got)
    return out


def table_stations():
    st3 = json.load(open(os.path.join(D, "stations", "chirps_v3.json")))
    st2 = json.load(open(os.path.join(D, "stations", "chirps_v2.json")))
    print("\nGSOD station months (valid days >= 90%) against CHIRPS at the station pixel and IMERG at the nearest app point "
          "(same 0.1° cell as the station), months Dec 2000 - Jul 2025\n")
    print("| station | rule | months | dry-season months | gauge mean mm/mo | r IMERG | r v2 | r v3 | bias IMERG | bias v2 | bias v3 "
          "| dry bias IMERG | dry bias v2 | dry bias v3 |")
    print("|" + "---|" * 14)
    for name, sid, sp, ip in (("Cần Thơ", "48912599999", "st_cantho", "can_tho"), ("Cà Mau", "48914099999", "st_camau", "ca_mau"),
                              ("Rạch Giá", "48907099999", "st_rachgia", "kien_giang")):
        for strict in (True, False):
            g = {k: v for k, v in gsod_months(sid, strict).items() if "2000-12" <= k <= "2025-07"}
            ks = sorted(g)
            if len(ks) < 3:
                print(f"| {name} | {'strict' if strict else 'lenient'} | {len(ks)} | | | | | | | | | | | |")
                continue
            o = [g[k] for k in ks]
            sets = [[IM[ip][k] for k in ks], [st2[sp][k] for k in ks], [st3[sp][k] for k in ks]]
            dk = [i for i, k in enumerate(ks) if k[5:] in DRY]
            db = lambda s: pct(sum(s[i] for i in dk), sum(o[i] for i in dk)) if dk and sum(o[i] for i in dk) else "n/a"
            print(f"| {name} | {'strict' if strict else 'lenient'} | {len(ks)} | {len(dk)} | {st.mean(o):.0f} | "
                  + " | ".join(f"{r(s, o):.2f}" for s in sets) + " | " + " | ".join(pct(sum(s), sum(o)) for s in sets)
                  + " | " + " | ".join(db(s) for s in sets) + " |")


if __name__ == "__main__":
    check()
    table_points()
    table_typical()
    table_v3_v2()
    latest12()
    table_stations()
