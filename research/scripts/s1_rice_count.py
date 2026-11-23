"""Count rice crops per Dec-Nov season and flooded/bare months from the Sentinel-1 series of s1_points.py.
Rule: Nguyen-Thi, Bouvet, Jarlan, Le Toan, Mermoz, Doblas Prieto (2026), Recent Advances in Remote Sensing 3(1),
https://www.recentadvancesin.com/remote-sensing/3020-6448-rars26001/ :
  - water if the mean VH <= -20 dB; built-up / permanent vegetation if the minimum VH > -10 dB (no rice at all);
  - seasons are bounded by local minima of the smoothed VH/VV ratio, at least 90 days apart;
  - a season window runs from 25 days before one minimum to the next minimum; VHmax_increase = max - min of RAW VH in it;
  - the season is rice if VHmax_increase exceeds the incidence-angle threshold. The paper gives the threshold only as a
    curve: ~6.0-6.5 dB at 31 and 46 deg, ~7.5-8.0 dB at 37-39 deg. A parabola through (31, 6.25), (38.5, 7.75), (46, 6.25)
    gives ~7.3 dB at the pins (34-35 deg); the paper says it moves ~0.5 dB between years, so 6.8 and 7.8 are also reported.
Not in the paper (fixed here before looking at results, never tuned): the ratio is binned to a 12-day grid (the one-satellite
revisit, so 2016-21 and 2022-26 are treated alike) and smoothed by Savitzky-Golay, window 5 bins, order 2 (the paper's
adaptive window is not fully specified). A season counts in the Dec-Nov season year holding its VH/VV minimum (~20 days after sowing).
Flooded/bare month (app's "bare months" test, not from the paper): that month's mean VH < -19 dB (the paper's
season-minimum level for rice) in more than half of the seasons, like ndvi.bare_months.
Run: python3 research/scripts/s1_rice_count.py <s1_track18.json> [window] [threshold dB]"""
import json, sys
from datetime import date, timedelta
import numpy as np
from scipy.signal import savgol_filter

STEP, GAP, PRE = 12, 90, 25
BARE_DB = -19.0


def threshold(theta):
    return 7.75 - 1.5 / 7.5 ** 2 * (theta - 38.5) ** 2


def season_year(d):
    return d.year + 1 if d.month == 12 else d.year  # season 2016 = Dec 2015 - Nov 2016


def minima(t, y):
    """Indices of local minima of y, keeping the deepest when two are closer than GAP days."""
    idx = [i for i in range(1, len(y) - 1) if y[i] < y[i - 1] and y[i] <= y[i + 1]]
    keep = []
    for i in sorted(idx, key=lambda i: y[i]):
        if all(abs(t[i] - t[j]) >= GAP for j in keep):
            keep.append(i)
    return sorted(keep)


def analyse(series, window=5, thr=None):
    days = [date.fromisoformat(d) for d in series]
    vh = np.array([v[0] for v in series.values()])
    vv = np.array([v[1] for v in series.values()])
    theta = float(np.median([v[3] for v in series.values()]))
    thr = thr if thr is not None else threshold(theta)
    t = np.array([(d - days[0]).days for d in days])
    if vh.mean() <= -20 or vh.min() > -10:
        return {"theta": theta, "thr": thr, "mask": "water" if vh.mean() <= -20 else "built-up/trees", "seasons": []}
    # bin the ratio to a 12-day grid, fill empty bins linearly, then smooth
    grid = np.arange(0, t[-1] + 1, STEP)
    b = np.digitize(t, grid) - 1
    ratio = np.array([np.mean((vh - vv)[b == k]) if (b == k).any() else np.nan for k in range(len(grid))])
    ok = ~np.isnan(ratio)
    ratio = np.interp(grid, grid[ok], ratio[ok])
    sm = savgol_filter(ratio, window, 2)
    mins = minima(grid, sm)
    seasons = []
    for a, z in zip(mins, mins[1:] + [None]):
        t0 = grid[a] - PRE
        t1 = grid[z] if z is not None else t[-1]
        sel = (t >= t0) & (t <= t1)
        if sel.sum() < 4:
            continue
        rise = float(vh[sel].max() - vh[sel].min())
        d_min = days[0] + timedelta(days=int(grid[a]))
        seasons.append({"min": d_min.isoformat(), "year": season_year(d_min), "rise": round(rise, 1),
                        "vh_min": round(float(vh[sel].min()), 1), "rice": rise > thr, "complete": z is not None})
    return {"theta": theta, "thr": round(thr, 2), "mask": None, "seasons": seasons}


def bare_months(series, years):
    by = {}
    for d, v in series.items():
        d = date.fromisoformat(d)
        if season_year(d) in years:
            by.setdefault((season_year(d), d.month), []).append(v[0])
    out = []
    for m in range(1, 13):
        ms = [np.mean(x) for (y, mm), x in by.items() if mm == m]
        if ms and sum(v < BARE_DB for v in ms) > 0.5 * len(ms):
            out.append(m)
    return out


def check():
    """Self-check on a synthetic triple-crop series: 3 dips to -24 dB and rises to -14 dB per year must count 3 a year."""
    s, d = {}, date(2016, 1, 1)
    for k in range(0, 3 * 365, 12):
        ph = (k % 122) / 122
        vh = -24 + 10 * np.sin(np.pi * ph)
        s[(d + timedelta(days=k)).isoformat()] = [vh, -12.0, "S1A", 35.0]
    r = analyse(s)
    n = sum(x["rice"] for x in r["seasons"] if x["year"] == 2017)
    assert n == 3, (n, r)


if __name__ == "__main__":
    check()
    data = json.load(open(sys.argv[1]))
    window = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    thr = float(sys.argv[3]) if len(sys.argv) > 3 else None
    years = range(2016, 2026)  # the app's RECENT: Dec 2015 - Nov 2025
    res = {}
    for pin, series in data.items():
        r = analyse(series, window, thr)
        per = {y: sum(s["rice"] for s in r["seasons"] if s["year"] == y) for y in list(years) + [2026]}
        r["per_year"] = per
        r["mean"] = round(np.mean([per[y] for y in years]), 2)
        r["bare"] = bare_months(series, set(years))
        res[pin] = r
        print(f"{pin:10s} theta {r['theta']:.1f} thr {r['thr']} mask {r['mask']} mean {r['mean']} bare {r['bare']} per-year {per}")
    json.dump(res, open(sys.argv[1].replace(".json", f"_count_w{window}_t{thr}.json"), "w"), indent=1)
