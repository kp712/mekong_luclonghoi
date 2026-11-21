"""Merge NASA data + local estimates + rotation rules -> docs/data/sites.json (what the website reads).
Run: python pipeline/build.py
"""
import json
import math
import pathlib
import re
import statistics
from collections import defaultdict
from datetime import date, timedelta

import ndvi
from make_outlines import SRC as OUTLINE_SRC
from sites import PROVINCES, REGION_SRC, REGIONS, SCORED_REGIONS, SITES

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "docs" / "data" / "sites.json"
PROV_OUT = ROOT / "docs" / "data" / "provinces.json"  # the 34 provinces and the 63 province points (vietnam.html)

# Canal water of a rotation (FAO Manual 3 section 4.4, month by month): crop water use (FAO-56 Table 12 crop factor x ET0),
# plus for flooded rice 200 mm to soak the soil the month before sowing, a 100 mm water layer at sowing and 4 mm/day seepage
# (FAO's heavy-clay value), minus effective rain. Crop factors (start, middle, last month): rice 1.05 / 1.20 / 0.75
# (end 0.90-0.60), mung bean = green gram 0.40 / 1.05 / 0.475 (end 0.60-0.35); shrimp (brackish water) and rest need none.
KC = {"R": (1.05, 1.20, 0.75), "U": (0.40, 1.05, 0.475)}
# FAO-56 Table 12 (ini, mid, end) per upland crop; a two-value end (fresh-dry harvest) is averaged, as for mung bean above
KC_U = {"watermelon": (0.40, 1.00, 0.75), "maize": (0.30, 1.20, 0.475), "mungbean": (0.40, 1.05, 0.475)}
SAT, WL, PERC = 200, 100, 4
DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
SEED_CROPS = ("rice", "watermelon", "maize", "mungbean")
SALT_HIGH, SALT_MED = 15, 4  # ‰ cut-offs of the salinity level rule (see salinity.json _readme)
# Weather & salt score (see score_weather_salt). No source gives salt-tolerant (ST) rice's damage threshold next to ordinary
# rice's, so a tolerant rice month counts as half an ordinary one: a team estimate (ST story: UPOV, on the card).
TOL, TOL_ESTIMATE = 0.5, True
HEAT_REF = 30             # days at or above 35 °C that take the heat part to 1.0: about a month of hot days (team choice)
BRACKISH_SOIL = 0.5       # soil points lost where the calendar has shrimp months (team estimate: Ngoc et al. 2023 give salinity readings, no score)
BRACKISH_ESTIMATE = True  # False once a source gives BRACKISH_SOIL as a number
# Soil score parts (see score_soil). Legume months are sourced (Rahman et al. 2014); the weights, the 3 dry months for full
# dry-break credit and the rice-month share have no numeric source: team estimates, listed on every card that uses them.
SOIL_W = {"legume": 0.45, "cover": 0.2, "dry": 0.2, "rice": 0.15}
SOIL_DRY_MONTHS = 3
SOIL_ESTIMATE = True      # False once sources give the weights as numbers
WS_W = (0.6, 0.2, 0.2)    # weights of the salt, heat and canal parts (team choice)
# Income: published profit figures per crop key and loss shares (pipeline/profits.json, each quote checked in its source note)
PROFITS = json.loads((HERE / "profits.json").read_text(encoding="utf-8"))
ROTATIONS = json.loads((HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]
# the irrigation need uses FAO-56 (ET0, rice crop factor) and FAO Manual 3 (effective rain, 450/700 mm lines)
FAO_SRCS = list({s["title"]: s for r in ROTATIONS for s in r["sources"] if s["title"].startswith(("FAO Irrigation and Drainage Paper 56", "FAO (1986)"))}.values())
RESOURCES = {c["id"]: c for c in json.loads((HERE / "resources.json").read_text(encoding="utf-8"))["crops"]}
SALINITY = json.loads((HERE / "salinity.json").read_text(encoding="utf-8"))
PESTS = json.loads((HERE / "pests.json").read_text(encoding="utf-8"))
LEVELS = ["low", "medium", "high"]
LEVEL_VI = {"low": "thấp", "medium": "trung bình", "high": "cao"}
UNKNOWN = "unknown"  # salinity level of a place with no salinity estimate (the 34 provinces): salt is not assessed there
MONTHS = {"en": "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(),
          "vi": [f"T{i}" for i in range(1, 13)]}
# The 24 full Dec-Nov seasons where NASA POWER, NASA GPM and NASA MODIS all have data; data/raw holds longer records.
PERIOD = (date(2000, 12, 1), date(2024, 11, 30))
# The newest 10 of those seasons: crops per year and bare months describe today's farm calendar, which changed at some pins.
RECENT = (date(2014, 12, 1), PERIOD[1])
# Salinity has its own window: dry seasons by the year they end, 2017-2026, so the KTTV bulletins (2024-2026) fall inside it.
SALT_SEASONS = (2017, 2026)
SALT_KM = 25  # a province point takes its nearest KTTV station's salinity only this close (km, team rule); else no estimate
KTTV = json.loads((RAW / "salinity_kttv_vietnam.json").read_text(encoding="utf-8"))["bulletins"]
KTTV_STATIONS = json.loads((RAW / "kttv_stations.json").read_text(encoding="utf-8"))["stations"]
# the Sóc Trăng table (salinity_stations.json ids) and the KTTV bulletins name the same 5 stations differently
TABLE_KTTV = {"tran_de": "Trần Đề", "long_phu": "Long Phú", "dai_ngai": "Đại Ngãi", "thanh_phu": "Thạnh Phú", "soc_trang": "Sóc Trăng"}


def elnino_seasons():
    """{start year of a Dec-Nov season in PERIOD: its Dec-Feb NOAA Oceanic Niño Index}, for El Niño seasons (index >= 0.5)."""
    rows = [ln.split() for ln in (RAW / "oni.txt").read_text(encoding="utf-8").splitlines()]
    return {int(r[1]) - 1: float(r[3]) for r in rows
            if r[:1] == ["DJF"] and PERIOD[0].year <= int(r[1]) - 1 < PERIOD[1].year and float(r[3]) >= 0.5}


def salt_elnino(y):
    """True if the dry season ending in year y is an El Niño one: NOAA's Dec-Feb ONI of year y is 0.5 or more (any year in oni.txt)."""
    return y in SALT_ELNINO


SALT_ELNINO = {int(r[1]) for r in (ln.split() for ln in (RAW / "oni.txt").read_text(encoding="utf-8").splitlines())
               if r[:1] == ["DJF"] and float(r[3]) >= 0.5}
ONI = elnino_seasons()
ELNINO = sorted(ONI)  # each number is the year the season starts in December
SEASONS = ", ".join(f"{y}–{(y + 1) % 100:02d}" for y in ELNINO)
ONI_SRC = {"title": f"NOAA CPC Oceanic Niño Index (ONI): {len(ELNINO)} El Niño winters, Dec 2000 – Nov 2024",
           "url": "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt",
           "note": "Dec–Feb ONI 0.5 or more: " + ", ".join(f"{y}–{(y + 1) % 100:02d} ({v})" for y, v in ONI.items())
                   + ". Saved in data/raw/oni.txt; checked against NOAA's live file: Dec–Feb values 2001–2024 identical.", "verified": True}
# NOAA CPC's latest ENSO status (data/raw/enso_outlook.json, from pipeline/fetch_power.py): the app opens on the El Niño view
# while NOAA says El Niño is here or coming (Advisory = present, Watch = favoured within 6 months).
ENSO_VI = {"El Niño Advisory": "đang có El Niño", "El Niño Watch": "El Niño có thể hình thành",
           "La Niña Advisory": "đang có La Niña", "La Niña Watch": "La Niña có thể hình thành",
           "Final El Niño Advisory": "El Niño đã kết thúc", "Final La Niña Advisory": "La Niña đã kết thúc",
           "Not Active": "không có El Niño hay La Niña"}
STRENGTH_VI = {"weak": "yếu", "moderate": "trung bình", "strong": "mạnh", "very strong": "rất mạnh",
               "strong-to-very strong": "mạnh đến rất mạnh", "moderate-to-strong": "trung bình đến mạnh"}
MONTH_NO = {m: i for i, m in enumerate("January February March April May June July August September October November December".split(), 1)}


def outlook(o):
    """NOAA's ENSO discussion -> {elnino: open on the El Niño view?, text: {en, vi}, source}. Status-only line if the synopsis wording is new."""
    d = date.fromisoformat(o["issued"])
    when = {"en": f"{d.day} {MONTHS['en'][d.month - 1]} {d.year}", "vi": f"{d.day}/{d.month}/{d.year}"}
    strengths = "|".join(sorted(STRENGTH_VI, key=len, reverse=True))  # longest first: "strong-to-very strong" before "strong"
    m = re.search(rf"\b({strengths}) (El Niño|La Niña) (?:is )?likely through (\w+)-(\w+) (\d{{4}}) \((?:remaining )?greater than an? (\d+)% chance\)", o["synopsis"])
    if m and m[3] in MONTH_NO and m[4] in MONTH_NO:
        a, b = MONTH_NO[m[3]], MONTH_NO[m[4]]
        text = {"en": f"NOAA forecast ({when['en']}): over {m[6]}% chance of a {m[1]} {m[2]} through {MONTHS['en'][a - 1]}–{MONTHS['en'][b - 1]} {m[5]}.",
                "vi": f"Dự báo của NOAA ({when['vi']}): khả năng có {m[2]} {STRENGTH_VI[m[1]]} kéo dài đến tháng {a}–{b}/{m[5]} là trên {m[6]}%."}
    else:
        text = {"en": f"NOAA El Niño status ({when['en']}): {o['status']}.",
                "vi": f"Tình trạng El Niño theo NOAA ({when['vi']}): {ENSO_VI.get(o['status'], o['status'])}."}
    src = {"title": f"NOAA CPC ENSO Diagnostic Discussion, {when['en']}: {o['status']}", "url": o["url"],
           "note": f"Synopsis: \"{o['synopsis']}\" Saved by pipeline/fetch_power.py (data/raw/enso_outlook.json).", "verified": True}
    return {"elnino": o["status"] in ("El Niño Advisory", "El Niño Watch"), "text": text, "source": src}


OUTLOOK = outlook(json.loads((RAW / "enso_outlook.json").read_text(encoding="utf-8")))
GPM_SRC = {"title": "NASA GPM IMERG Final monthly v07 (GPM_3IMERGM), 0.1° (~10 km)", "url": "https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary", "verified": True}
POWER_SRC = {"title": "NASA POWER daily API (MERRA-2 based)", "url": "https://power.larc.nasa.gov/", "verified": True}
MODIS_SRC = {"title": "NASA MODIS MOD13Q1 v6.1 NDVI, 250 m", "url": "https://lpdaac.usgs.gov/products/mod13q1v061/", "verified": True}
HEAT_SRC = {"title": "Yoshida S. (1981), Fundamentals of Rice Crop Science, IRRI (heat at flowering)", "url": "http://books.irri.org/9711040522_content.pdf",
            "note": "Checked. Section 2.3.6, p. 81: 'High percentages of spikelet sterility occur if temperatures exceed 35°C at anthesis and last for more than 1 hour.' Table 2.4 (p. 72) gives 35 °C as the critical high temperature at anthesis (as a daily mean). Whereas Yoshida measures exposure at flowering (anthesis), our daily-maximum proxy counts NASA POWER days whose daily maximum reaches or exceeds 35 °C across the months a crop is in the field.", "verified": True}
FAO29_SRC = {"title": "Ayers & Westcot (1985), Water quality for agriculture, FAO Irrigation and Drainage Paper 29 Rev. 1, Table 4 and 5",
             "url": "https://www.fao.org/4/t0234e/T0234E03.htm", "verified": True,
             "note": "Checked. Table 4 (irrigation water salinity ECw, dS/m, at 100% and 90% yield potential): 'Corn (maize) (Zea mays) 1.7 1.1 2.5 1.7'; 'Rice (paddy) (Oriza sativa) 3.0 2.0 3.8 2.6'. Watermelon has no number; Table 5 lists it as moderately sensitive. Mung bean is not listed."}
FAO48_SRC = {"title": "Rhoades, Kandiah & Mashali (1992), The use of saline waters for crop production, FAO Irrigation and Drainage Paper 48 (conversion factors)",
             "url": "https://www.fao.org/4/t0667e/t0667e02.htm", "verified": True,
             "note": "Checked. Box 'Useful conversion factors and formulas': 'TDS (mg/l) » EC (dS/m) × 640' 'for EC between 0.1 and 5.0 dS/m'. So maize's 1.1 dS/m ≈ 0.7‰, and 4‰ is about 5 dS/m or more."}
SOIL_SRC = {"title": "SoilGrids 2.0 (ISRIC): modelled soil clay, organic carbon, pH, 250 m (not NASA)", "url": "https://soilgrids.org/", "verified": True}


def ra(day, lat):
    """Extraterrestrial radiation (MJ/m²/day), FAO-56 eq. 21."""
    j = day.timetuple().tm_yday
    phi = math.radians(lat)
    dr = 1 + 0.033 * math.cos(2 * math.pi * j / 365)
    dec = 0.409 * math.sin(2 * math.pi * j / 365 - 1.39)
    ws = math.acos(-math.tan(phi) * math.tan(dec))
    return 24 * 60 / math.pi * 0.082 * dr * (ws * math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.sin(ws))


def e0(t):
    """Saturation vapour pressure (kPa) at t °C, FAO-56 eq. 11."""
    return 0.6108 * math.exp(17.27 * t / (t + 237.3))


def et0_penman(day, lat, tmax, tmin, rh, u2, rs, z=2):
    """Reference evapotranspiration (mm/day), FAO-56 Penman-Monteith eq. 6: water a grass field would lose.
    rh = mean relative humidity (%), u2 = wind at 2 m (m/s), rs = sunlight reaching the ground (MJ/m²/day), z = height (m)."""
    t = (tmax + tmin) / 2
    es = (e0(tmax) + e0(tmin)) / 2
    ea = rh / 100 * es  # eq. 19
    delta = 4098 * e0(t) / (t + 237.3) ** 2
    gamma = 0.665e-3 * 101.3 * ((293 - 0.0065 * z) / 293) ** 5.26
    rso = (0.75 + 2e-5 * z) * ra(day, lat)
    rnl = 4.903e-9 * ((tmax + 273.16) ** 4 + (tmin + 273.16) ** 4) / 2 * (0.34 - 0.14 * math.sqrt(ea)) * (1.35 * min(rs / rso, 1) - 0.35)
    rn = 0.77 * rs - rnl  # grass albedo 0.23; soil heat flux ~0 for a day
    return (0.408 * delta * rn + gamma * 900 / (t + 273) * u2 * (es - ea)) / (delta + gamma * (1 + 0.34 * u2))


def et0_hargreaves(day, lat, tmax, tmin):
    """FAO-56 Hargreaves eq. 52 (temperature only). Kept as a cross-check: it reads low here because coastal days and nights differ little."""
    return 0.0023 * ((tmax + tmin) / 2 + 17.8) * math.sqrt(max(tmax - tmin, 0)) * 0.408 * ra(day, lat)


def in_period(day):
    return PERIOD[0] <= day <= PERIOD[1]


def in_elnino(day):
    """True if the day falls in a Dec-Nov season that starts in an ELNINO year."""
    return (day.year if day.month == 12 else day.year - 1) in ELNINO


def typical_year(day):
    """Days outside the El Niño seasons: what the app calls the typical year."""
    return in_period(day) and not in_elnino(day)


def climate(power, lat, keep=None, gpm=None):
    """Typical year per calendar month over PERIOD, or only over days where keep(day) is True.
    Rain comes from gpm ({"YYYY-MM": mm}, NASA GPM, 10 km) when given, else from NASA POWER (50 km)."""
    p = power["parameter"]
    sums = defaultdict(lambda: defaultdict(float))  # (year, month) -> totals
    prev = None  # (day, T2M_MIN) of the last valid day; a cold snap needs it to be the day before
    for d, rain in sorted(p["PRECTOTCORR"].items()):
        day = date(int(d[:4]), int(d[4:6]), int(d[6:]))
        if not in_period(day) or (keep and not keep(day)):
            continue
        # check GPM coverage for every kept month, before fill days can drop it from sums
        if gpm is not None and f"{day.year}-{day.month:02d}" not in gpm:
            raise ValueError(f"missing GPM month {day.year}-{day.month:02d} (run pipeline/fetch_gpm.py)")
        tmax, tmin, rh, u2, rs = (p[k][d] for k in ("T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN"))
        if -999 in (rain, tmax, tmin, rh, u2, rs):
            continue
        cold = prev is not None and prev[0] == day - timedelta(days=1) and prev[1] - tmin >= PESTS["shrimp"]["cold_drop_c"]
        prev = (day, tmin)
        s = sums[(day.year, day.month)]
        s["rain"] += rain
        s["et0"] += et0_penman(day, lat, tmax, tmin, rh, u2, rs)
        s["tmax"] += tmax
        s["hot"] += tmax >= 35
        s["tmean"] += (tmax + tmin) / 2
        s["cold"] += cold
        s["n"] += 1
    for (y, m), s in sums.items():
        if gpm is not None:
            s["rain"] = gpm[f"{y}-{m:02d}"]
    out = {"rain_mm": [], "rain_min_mm": [], "rain_max_mm": [], "et0_mm": [], "tmax_c": [], "hot_days": [], "tmean_c": [], "cold_days": []}
    for m in range(1, 13):
        ys = [v for (y, mm), v in sums.items() if mm == m]
        out["rain_mm"].append(round(sum(v["rain"] for v in ys) / len(ys)))
        out["rain_min_mm"].append(round(min(v["rain"] for v in ys)))  # driest year for this month
        out["rain_max_mm"].append(round(max(v["rain"] for v in ys)))  # wettest year
        out["et0_mm"].append(round(sum(v["et0"] for v in ys) / len(ys)))
        out["tmax_c"].append(round(sum(v["tmax"] / v["n"] for v in ys) / len(ys), 1))
        out["hot_days"].append(round(sum(v["hot"] for v in ys) / len(ys), 1))
        out["tmean_c"].append(round(sum(v["tmean"] / v["n"] for v in ys) / len(ys), 1))
        out["cold_days"].append(round(sum(v["cold"] for v in ys) / len(ys), 1))
    return out


def topsoil(raw):
    """SoilGrids layers -> {"clay_pct", "soc_g_kg", "ph"} for 0-15 cm (depth-weighted); None if the pixel has no data."""
    out = {}
    for layer in raw["layers"]:
        ds = [(d["range"]["bottom_depth"] - d["range"]["top_depth"], d["values"]["mean"]) for d in layer["depths"]]
        if any(v is None for _, v in ds):  # water or town pixel: SoilGrids has no soil there
            return None
        # stored as integers; dividing by d_factor gives %, g/kg and pH
        out[layer["name"]] = round(sum(w * v for w, v in ds) / sum(w for w, _ in ds) / layer["unit_measure"]["d_factor"], 1)
    return {"clay_pct": out["clay"], "soc_g_kg": out["soc"], "ph": out["phh2o"]}


def corr(a, b):
    """Pearson correlation of a and b (statistics.correlation on Python 3.10+, pure-Python fallback on 3.8–3.9)."""
    if hasattr(statistics, "correlation"):
        return statistics.correlation(a, b)
    ma, mb = statistics.mean(a), statistics.mean(b)
    da, db = [x - ma for x in a], [y - mb for y in b]
    denom = math.sqrt(sum(x * x for x in da) * sum(y * y for y in db))
    if not denom:
        raise statistics.StatisticsError("correlation requires that both inputs are not constant")
    return sum(x * y for x, y in zip(da, db)) / denom


HLS_MIN_YEARS = 5  # a calendar month is judged only when at least 5 of the 10 RECENT years have a clear HLS date in it


def hls_check(series, modis_bare=()):
    """Cross-check of the MODIS bare months with NASA HLS 30 m greenness (proposal #34). series = {"YYYY-MM-DD": ndvi},
    one value per clear date (hls.py). A year-month with at least one clear date is covered; its mean per-date value gives
    one vote, bare if below ndvi.BARE. A month is bare when more than half of its covered years vote bare, and unknown
    when fewer than HLS_MIN_YEARS years are covered (so a month missing from bare_months never stands for "green").
    Cross-check only: no score reads it."""
    n_years = RECENT[1].year - RECENT[0].year
    by_ym = {}
    for d, v in series.items():
        day = date.fromisoformat(d)
        if RECENT[0] <= day <= RECENT[1]:
            by_ym.setdefault((day.year, day.month), []).append(v)
    bare, unknown, covered, dates = [], [], [], []
    for m in range(1, 13):
        days = [xs for (_, mm), xs in by_ym.items() if mm == m]
        means = [sum(xs) / len(xs) for xs in days]
        covered.append(len(means))
        dates.append(round(sum(len(xs) for xs in days) / n_years, 1))  # a year-month with no clear date counts as 0
        if len(means) < HLS_MIN_YEARS:
            unknown.append(m)
        elif 2 * sum(v < ndvi.BARE for v in means) > len(means):
            bare.append(m)
    return {"bare_months": bare, "unknown_months": unknown, "modis_bare_months": sorted(modis_bare),
            "clear_dates_per_month": dates, "years_covered_per_month": covered}


def gpm_check(power, gpm_months):
    """Compare NASA POWER monthly rain with NASA GPM IMERG for the same months: yearly averages, % apart, correlation."""
    p, totals = power["parameter"]["PRECTOTCORR"], defaultdict(float)
    for d, rain in p.items():
        if rain != -999 and in_period(date(int(d[:4]), int(d[4:6]), int(d[6:]))):
            totals[f"{d[:4]}-{d[4:6]}"] += rain
    keys = sorted(k for k in gpm_months if k in totals)
    if len(keys) < 24:  # too little overlap to say anything
        return None
    a, b = [totals[k] for k in keys], [gpm_months[k] for k in keys]
    pw, gp = sum(a) * 12 / len(keys), sum(b) * 12 / len(keys)
    return {"power_mm_yr": round(pw), "gpm_mm_yr": round(gp), "diff_pct": round(100 * (gp - pw) / pw),
            "monthly_r": round(corr(a, b), 2), "months": len(keys)}


def whole(x):
    """4.0 -> "4", 0.5 -> "0.5"."""
    return str(int(x)) if x == int(x) else str(x)


def mo(n):
    """"1 month", "2 months"."""
    return f"{n} month{'' if n == 1 else 's'}"


def vi_num(x):
    """Vietnamese writes decimals with a comma: 3.0 -> "3,0"."""
    return str(x).replace(".", ",")


def line(en, vi):
    return {"en": en, "vi": vi}


# Wikipedia-style sources: one numbered list for the whole app. A source's number is the order it is first cited,
# and build() cites the area-wide ones first, so numbers climb down the page.
SOURCES = {}


def cite(*items):
    """Sources (dicts, or lists of them) -> their numbers (0-based indices into the output "sources" list)."""
    out = []
    for s in [x for i in items for x in (i if isinstance(i, list) else [i])]:
        if s["title"] not in SOURCES:
            SOURCES[s["title"]] = (len(SOURCES), {k: s[k] for k in ("title", "url", "verified") if k in s})
        if SOURCES[s["title"]][0] not in out:
            out.append(SOURCES[s["title"]][0])
    return out


def sourced(l, *items):
    return dict(l, src=cite(*items))


def effective_rain(p):
    """Monthly rain (mm) a crop can use, FAO Manual 3 section 4.2: 0.8 P - 25 above 75 mm/month, else 0.6 P - 10."""
    return 0.8 * p - 25 if p > 75 else max(0.6 * p - 10, 0)


def month_need(et0, kc, rain, sat=0, perc=0, wl=0):
    """FAO Manual 3 section 4.4: canal water for one month (mm) = crop water use + soaking + seepage + water layer - effective rain."""
    return max(kc * et0 + sat + perc + wl - effective_rain(rain), 0)


def crops(months):
    """A 12-month calendar (codes like R1, U, S, -) as runs of the same code, wrapping Dec -> Jan: [(code, [month indexes])]."""
    start = next((i for i in range(12) if months[i] != months[i - 1]), 0)
    runs = []
    for i in ((start + k) % 12 for k in range(12)):
        if runs and runs[-1][0] == months[i]:
            runs[-1][1].append(i)
        else:
            runs.append((months[i], [i]))
    return runs


def water_need(months, clim, kc_u=None):
    """Canal water (mm) of a rotation's calendar in each month (index 0 = Jan), see KC/SAT/WL/PERC above; kc_u = the upland crop's factors."""
    kc, sat, perc, wl = [0.0] * 12, [0] * 12, [0.0] * 12, [0] * 12
    for code, idx in crops(months):
        if code[0] not in KC:
            continue  # shrimp (brackish water) and rest months take no canal water
        ini, mid, end = kc_u if code[0] == "U" and kc_u else KC[code[0]]
        for n, i in enumerate(idx):
            kc[i] = ini if n == 0 else end if n == len(idx) - 1 else mid
        if code[0] == "R":
            wl[idx[0]] = WL
            for i in idx:
                perc[i] = PERC * DAYS[i]
            if months[idx[0] - 1][0] != "R":  # soil not already soaked by the rice crop before
                sat[idx[0] - 1] = SAT
    return [round(month_need(clim["et0_mm"][i], kc[i], clim["rain_mm"][i], sat[i], perc[i], wl[i])) if kc[i] or sat[i] else 0
            for i in range(12)]


BASE_ROT = next(r for r in json.loads((HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"] if r["id"] == "rice3")
BASE = BASE_ROT["months"]


def winter_spring(clim):
    """(canal water mm, first month index, last month index) of the 3-rice calendar's winter-spring crop (the rice crop in January)."""
    idx = next(idx for code, idx in crops(BASE) if 0 in idx)
    need = water_need(BASE, clim)
    return sum(need[i] for i in idx), idx[0], idx[-1]


def seed_window(s, max_days):
    """Consecutive calendar months (1..12) occupied by a crop of max_days starting at the beginning of month s, using non-leap month lengths."""
    win, total = [], 0
    for k in range(12):
        m = (s - 1 + k) % 12 + 1
        win.append(m)
        total += MONTH_DAYS[m - 1]
        if total >= max_days:
            break
    return win


def seed_check_one(crop, dur, clim, sal):
    """Safe sowing window {sow_from, sow_by, harvest_by, water_mm, ok} before a pin's salt months, or None if duration_days is missing."""
    if not dur:
        return None
    max_days = dur[1]
    salt = set(sal["months"])
    wins = {s: seed_window(s, max_days) for s in range(1, 13)}
    safe = {s for s, w in wins.items() if not (set(w) & salt)}
    if not safe:
        return {"sow_from": None, "sow_by": None, "harvest_by": None, "water_mm": None, "ok": False}
    code = "R1" if crop == "rice" else "U"
    need_of = lambda s: sum(water_need([code if m in wins[s] else "-" for m in range(1, 13)], clim, KC_U.get(crop)))
    if not salt or len(safe) == 12:
        sow_from, sow_by = 1, 12
    else:
        runs = [[i + 1 for i in idx] for c, idx in crops(["S" if m in safe else "-" for m in range(1, 13)]) if c == "S"]
        run = max(runs, key=lambda r: (len(r), -need_of(r[-1]), -r[0]))
        sow_from, sow_by = run[0], run[-1]
    return {"sow_from": sow_from, "sow_by": sow_by, "harvest_by": wins[sow_by][-1],
            "water_mm": need_of(sow_by), "hot_days": round(sum(clim["hot_days"][m - 1] for m in wins[sow_by]), 1), "ok": True}


def seed_check(clim, sal, res=RESOURCES):
    return {k: seed_check_one(k, res[k].get("duration_days"), clim, sal) for k in SEED_CROPS}


def score_water(saved):
    """Share of 3 rice crops' canal water saved -> 1.0-5.0 water score: a straight line, no cut-offs."""
    return round(min(max(1 + 4 * saved, 1), 5), 1)


def score_weather_salt(rot, clim, sal):
    """Weather & salt safety 1.0-5.0 = WS_W-weighted mix of three parts, each 1 + 4 x (1 - risk share):
    salt: share of the pin's salt months with a crop in the field (tolerant rice counts TOL) x station salt level (15‰ = 1);
    heat: NASA POWER days at or above 35 °C in months with rice or upland crops / HEAT_REF;
    canal: canal water needed in the salt months / what 3 rice crops need then (FAO method, NASA POWER + GPM)."""
    hot = sum(clim["hot_days"][i] for i in range(12) if rot["months"][i][0] in "RU")
    if sal["level"] == UNKNOWN:  # no salinity estimate: the salt and canal parts need the salt months, so no score
        return None, dict(salt_k=0, salt_n=0, ppt=None, hot_days=round(hot, 1), canal_mm=None,
                          parts=dict(salt=None, heat=round(1 + 4 * (1 - min(hot / HEAT_REF, 1)), 1), canal=None))
    tol = TOL if rot.get("rice_class") == "tolerant" else 1
    cls = [tol if c[0] == "R" else 1 if c[0] == "U" else 0 for c in rot["months"]]  # shrimp (S) and rest (-) are safe
    salt = [m - 1 for m in sal["months"]]
    severity = 4 / 15 if sal["max_ppt"] is None else min(sal["station_ppt"] / 15, 1)  # level override (Ngã Năm): "low"
    need, base = water_need(rot["months"], clim, rot.get("kc_u")), water_need(BASE, clim)
    canal, base_salty = sum(need[i] for i in salt), sum(base[i] for i in salt)
    risk = (sum(cls[i] for i in salt) / len(salt) * severity if salt else 0, min(hot / HEAT_REF, 1), min(canal / base_salty, 1) if base_salty else 0)
    parts = [1 + 4 * (1 - r) for r in risk]
    return round(sum(w * p for w, p in zip(WS_W, parts)), 1), dict(
        salt_k=sum(cls[i] > 0 for i in salt), salt_n=len(salt), ppt=sal["station_ppt"], hot_days=round(hot, 1), canal_mm=canal,
        parts=dict(zip(("salt", "heat", "canal"), (round(p, 1) for p in parts))))


def score_soil(rot):
    """Soil health 1.0-5.0 = 1 + 4 x gain - brackish, kept between 1 and 5. gain (0-1) is the SOIL_W-weighted sum of:
    legume min(legume months / 2, 1); cover min(rest / 2, 1) where the rest may be a cover crop; dry break
    min((rest + upland months) / SOIL_DRY_MONTHS, 1), the months the flooded soil dries out; fewer rice months 1 - rice / 12.
    Brackish takes BRACKISH_SOIL off where the calendar has shrimp months."""
    m = [c[0] for c in rot["months"]]
    rest, nonrice, up, rice = m.count("-"), sum(c in "US" for c in m), m.count("U"), m.count("R")
    legume = sum(c in rot.get("legume_codes", []) for c in m)
    cover, brackish = bool(rot.get("cover_optional")), "S" in m
    parts = {"legume": min(legume / 2, 1), "cover": min(rest / 2, 1) if cover else 0.0,
             "dry": min((rest + up) / SOIL_DRY_MONTHS, 1), "rice": 1 - rice / 12}
    gain = sum(SOIL_W[k] * v for k, v in parts.items())
    x = 1 + 4 * gain - (BRACKISH_SOIL if brackish else 0)
    x = math.floor(min(max(x, 1), 5) * 10 + 0.5 + 1e-9) / 10   # halves round up, the same in lab.js (sums like 3.85 sit on a tie)
    return x, dict(rest=rest, nonrice=nonrice, legume=legume, cover=cover, brackish=brackish,
                                                    dry=rest + up, rice=rice)


def rice_pressure(t):
    """Rice pest pressure 0-1 at mean temperature t (deg C): linear over PESTS["rice"]["points"], 0 outside them."""
    pts = PESTS["rice"]["points"]
    if not pts[0][0] <= t <= pts[-1][0]:
        return 0.0
    for (t0, p0), (t1, p1) in zip(pts, pts[1:]):
        if t <= t1:
            return p0 + (p1 - p0) * (t - t0) / (t1 - t0)


def pest_pressure(rot, clim):
    """12 monthly pest pressures 0-1: rice from mean temperature, upland 1, shrimp from hot+cold days, rest 0."""
    floor, out = PESTS["shrimp"]["floor"], []
    for i, c in enumerate(rot["months"]):
        k = c[0]
        if k == "R":
            out.append(rice_pressure(clim["tmean_c"][i]))
        elif k == "U":
            out.append(1.0)
        elif k == "S":
            out.append(floor + (1 - floor) * min((clim["hot_days"][i] + clim["cold_days"][i]) / MONTH_DAYS[i], 1))
        else:
            out.append(0.0)
    return out


def score_pests(rot, clim):
    """Pests 1.0-5.0 = 1 + 4 x (1 - risk). Risk is the mean monthly pressure; rice months are cut by break_weight x the
    pest-cycle break (half from rest months, half from non-rice months, each min(n / 2, 1))."""
    m, p = [c[0] for c in rot["months"]], pest_pressure(rot, clim)
    rest, nonrice = m.count("-"), sum(c in "US" for c in m)
    brk = 0.5 * min(rest / 2, 1) + 0.5 * min(nonrice / 2, 1)
    rice_p = [x for x, k in zip(p, m) if k == "R"]
    risk = (sum(rice_p) * (1 - PESTS["break_weight"] * brk) + sum(x for x, k in zip(p, m) if k != "R")) / 12
    info = dict(rice=len(rice_p), upland=m.count("U"), shrimp=m.count("S"), rest=rest, nonrice=nonrice,
                rice_p_min=round(min(rice_p), 2) if rice_p else 0, rice_p_max=round(max(rice_p), 2) if rice_p else 0)
    return round(min(max(1 + 4 * (1 - risk), 1), 5), 1), info


def used_figures(key):
    """A key's qualifying (non-fallback) figures when it has at least 2, otherwise all its figures, fallbacks included."""
    fs = [f for f in PROFITS["figures"] if f["key"] == key]
    q = [f for f in fs if not f["fallback"]]
    return q if len(q) >= 2 else fs


def median_profit(key):
    """Median published profit (M ₫/ha, per crop or per year as the key's unit) of one crop key's used figures."""
    fs = used_figures(key)
    return statistics.median(f["value"] for f in fs) if fs else None  # None: no checked figure, income not scored


def low_profit(key):
    """Lowest of a crop key's used figures (the low end of the profit range)."""
    fs = used_figures(key)
    return min(f["value"] for f in fs) if fs else None


def high_profit(key):
    """Highest of a crop key's used figures (the high end of the profit range)."""
    fs = used_figures(key)
    return max(f["value"] for f in fs) if fs else None


def yearly_profit(rot, sal, elnino, not_here, pick=median_profit):
    """Sum over the rotation's crops of median profit x (1 - loss shares); typical losses apply in both views, elnino ones
    only in the El Niño view. A salt_months loss counts only when a month of that crop is one of the pin's salt months.
    Shrimp counts 0 where brackish water is not available."""
    views, total = ("typical", "elnino") if elnino else ("typical",), 0
    for code, key in rot["profit"].items():
        if key == "shrimp" and not_here:
            continue
        salty = any(m == code and i + 1 in sal["months"] for i, m in enumerate(rot["months"]))
        loss = sum(l["share"] for l in PROFITS["loss"] if l["key"] == key and l["view"] in views and (l["applies"] == "all" or salty))
        m = pick(key)
        if m is None:
            return None
        total += m * (1 - loss)
    return round(total, 1)


def score_income(p, p3):
    """Yearly profit vs 3 rice crops -> 1.0-5.0: same = 3, double = 5, half = 1."""
    if p is None:
        return None
    return 1.0 if p <= 0 else round(min(max(3 + 2 * math.log2(p / p3), 1.0), 5.0), 1)


def profit_keys_info(rot, not_here=False):
    """{crop key: {"n", "lo", "hi": count, lowest and highest of the figures in the median, "q": qualifying (non-fallback)
    figures, "fallback": q < 2, i.e. the key relies on fallback figures}} for one rotation."""
    out = {}
    for key in rot["profit"].values():
        if key == "shrimp" and not_here:
            continue  # shrimp adds 0 profit where brackish water is not available
        fs, q = used_figures(key), sum(not f["fallback"] for f in PROFITS["figures"] if f["key"] == key)
        out[key] = {"n": len(fs), "lo": min((f["value"] for f in fs), default=0), "hi": max((f["value"] for f in fs), default=0), "q": q, "fallback": q < 2}
    return out


def summary(clim, nd, sal, elnino=False):
    """Area facts, one short line each (EN + VI), naming the source of each number; the salt line is flagged for styling."""
    (need, a, b), lvl = winter_spring(clim), sal["level"]
    # `plain` = the same sentence without the source/method bracket, same `src`, for the Simple view. The salt line's
    # bracket is the project-rule label (estimate, not satellite), so its plain text is the full text.
    water = line(f"Winter–spring rice ({MONTHS['en'][a]}–{MONTHS['en'][b]}) needs ≈ {need} mm of canal water, field losses included",
                 f"Lúa Đông Xuân ({MONTHS['vi'][a]}–{MONTHS['vi'][b]}) cần ≈ {need} mm nước tưới từ kênh, kể cả thất thoát trên ruộng")
    if lvl == UNKNOWN:
        salt = sal.get("reason") or line("Salt: no estimate for this area yet (salinity is never measured by satellite; no public report checked here).",
                    "Mặn: chưa có ước tính cho khu vực này (độ mặn không đo bằng vệ tinh; chưa kiểm tra báo cáo công khai nào ở đây).")
    else:
        at = (f" at {sal['station']} station, {km_text(sal['km'])} km away", f" tại trạm {sal['station']}, cách {vi_num(km_text(sal['km']))} km") if "station" in sal else ("", "")
        when = (f"Salt usually {month_names(sal['months'], 'en')}", f"Mặn thường vào {month_names(sal['months'], 'vi')}") if sal["months"] else ("Salt", "Mặn")
        salt = line(f"{when[0]}: {lvl}{at[0]} (estimate from public reports, not satellite).",
                    f"{when[1]}, mức {LEVEL_VI[lvl]}{at[1]} (ước tính từ báo cáo công khai, không đo bằng vệ tinh).")
        if sal.get("caveat"):
            salt = line(salt["en"] + sal["caveat"]["en"], salt["vi"] + sal["caveat"]["vi"])
    out = [dict(sourced(line(f"{water['en']} (NASA POWER + GPM{', El Niño average' if elnino else ''}; FAO method).",
                             f"{water['vi']} (NASA POWER + GPM{', trung bình El Niño' if elnino else ''}; phương pháp FAO)."), POWER_SRC, GPM_SRC, FAO_SRCS),
                plain=line(water["en"] + ".", water["vi"] + ".")),
           dict(sourced(salt, *([] if lvl == UNKNOWN else [SALINITY["sources"]])), salt=True, plain=dict(salt))]
    if nd:
        bare_en = f" and bare fields in {month_names(nd['bare_months'], 'en')}" if nd["bare_months"] else ""
        bare_vi = f" và ruộng trống vào {month_names(nd['bare_months'], 'vi')}" if nd["bare_months"] else ""
        crops = line(f"Satellite sees ≈ {nd['crops_per_year']} crops a year{bare_en}", f"Vệ tinh ghi nhận ≈ {vi_num(nd['crops_per_year'])} vụ/năm{bare_vi}")
        out.append(dict(sourced(line(crops["en"] + " (NASA MODIS).", crops["vi"] + " (NASA MODIS)."), MODIS_SRC), plain=line(crops["en"] + ".", crops["vi"] + ".")))
    return out


def month_names(ms, lang):
    """[3, 4, 5, 10] -> "Mar–May, Oct": consecutive months collapse into a range."""
    runs = []
    for m in sorted(ms):
        if runs and m == runs[-1][1] + 1:
            runs[-1][1] = m
        else:
            runs.append([m, m])
    name = MONTHS[lang]
    return ", ".join(name[a - 1] if a == b else f"{name[a - 1]}–{name[b - 1]}" for a, b in runs)


def in_salt_seasons(y):
    return SALT_SEASONS[0] <= int(y) <= SALT_SEASONS[1]


def station_salt(sid, elnino):
    """A station's highest salinity of each dry season (‰, data/raw/salinity_stations.json), averaged over the SALT_SEASONS
    that are El Niño (elnino=True, salt_elnino) or not: (average, first year, last year, number of seasons). Dry season of year y ends in y."""
    rows = json.loads((RAW / "salinity_stations.json").read_text(encoding="utf-8"))["stations"][sid]["yearly_max"]
    ys = {int(y): v[0] for y, v in rows.items() if in_salt_seasons(y) and salt_elnino(int(y)) == elnino}
    return round(sum(ys.values()) / len(ys), 1), min(ys), max(ys), len(ys)


def peak_months(sid):
    """Months when the station had its highest reading in at least 2 of the SALT_SEASONS dry seasons."""
    rows = json.loads((RAW / "salinity_stations.json").read_text(encoding="utf-8"))["stations"][sid]["yearly_max"]
    ms = [v[1] for y, v in rows.items() if in_salt_seasons(y)]
    return {m for m in ms if ms.count(m) >= 2}


def kttv_seasons(name):
    """{dry season (end year): (highest reading ‰, its month, partial)} of one station in the KTTV bulletins. A reading is the
    highest of the 10 days before the issue date; its month is the issue date's. partial: no reading in February or none in March."""
    got = defaultdict(list)
    for d, b in sorted(KTTV.items()):
        if name in b["readings"]:
            day = date.fromisoformat(d)
            got[day.year + (day.month == 12)].append((b["readings"][name], day.month))
    return {y: (*max(rs, key=lambda r: r[0]), not {2, 3} <= {m for _, m in rs}) for y, rs in got.items()}


def station_record(name):
    """{dry season: (max_ppt, month, partial)} of a KTTV station: the Sóc Trăng table's rows first (whole seasons, partial
    False), then the bulletin seasons the table lacks. At a table station a partial bulletin season is left out: its peak
    may be missing, and it would pull a whole-season record down."""
    sid = next((k for k, v in TABLE_KTTV.items() if v == name), None)
    rows = json.loads((RAW / "salinity_stations.json").read_text(encoding="utf-8"))["stations"][sid]["yearly_max"] if sid else {}
    table = {int(y): (v[0], v[1], False) for y, v in rows.items()}
    return {**{y: r for y, r in kttv_seasons(name).items() if not (sid and r[2])}, **table}


def km_between(lat1, lon1, lat2, lon2):
    """Great-circle distance in km (haversine, Earth radius 6371 km), as kmBetween in docs/app/vn.js."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def salt_months(name, seasons=None, need=2):
    """Months that reached SALT_MED (4‰) at the station in at least `need` dry seasons (of `seasons` if given, else of
    SALT_SEASONS): its KTTV bulletin readings, and at a Sóc Trăng table station also each table row's peak, at its month."""
    seen = defaultdict(set)
    want = lambda y: y in seasons if seasons else in_salt_seasons(y)
    for d, b in KTTV.items():
        day = date.fromisoformat(d)
        y = day.year + (day.month == 12)
        if b["readings"].get(name, 0) >= SALT_MED and want(y):
            seen[day.month].add(y)
    sid = next((k for k, v in TABLE_KTTV.items() if v == name), None)
    for y, (ppt, m) in (json.loads((RAW / "salinity_stations.json").read_text(encoding="utf-8"))["stations"][sid]["yearly_max"].items() if sid else ()):
        if ppt >= SALT_MED and want(int(y)):
            seen[m].add(int(y))
    return sorted(m for m, ys in seen.items() if len(ys) >= need)


def km_text(km):
    """Distance as the app writes it: one decimal under 10 km, whole km from 10 km (as the tile in docs/app/vn.js)."""
    return f"{round(km, 1):.1f}" if km < 10 else str(int(km + 0.5))


def station_view(name, view):
    """One view (typical or El Niño seasons, {season: (max_ppt, month, partial)}) of a station: (max_ppt, level, months,
    rule). max_ppt: the average of the seasons' peaks. months: salt_months (rule "two"); if none while the level is medium or
    high (ruling R3), the range from the first to the last month that reached 4‰ in any season of this view (rule "any");
    else none (rule "none")."""
    ppt = round(sum(r[0] for r in view.values()) / len(view), 1)
    ms, rule = salt_months(name), "two"
    if not ms and salt_level(ppt) != "low":
        q = salt_months(name, set(view), 1)
        ms, rule = list(range(min(q), max(q) + 1)), "any"
    elif not ms:
        rule = "none"
    return ppt, salt_level(ppt), ms, rule


def station_monthly(name, view):
    """12 monthly ‰ of a station for one view (its seasons, as station_views gives): each month's highest 10-day reading in
    the bulletins, averaged over the view's seasons that have one; None where no bulletin has a reading that month."""
    got = defaultdict(lambda: defaultdict(list))
    for d, b in KTTV.items():
        day = date.fromisoformat(d)
        if name in b["readings"] and day.year + (day.month == 12) in view:
            got[day.month][day.year + (day.month == 12)].append(b["readings"][name])
    return [round(sum(max(v) for v in got[m].values()) / len(got[m]), 1) if got[m] else None for m in range(1, 13)]


def station_views(name):
    """(typical, El Niño) seasons of a station within SALT_SEASONS, as station_record's rows."""
    rec = {y: r for y, r in station_record(name).items() if in_salt_seasons(y)}
    return tuple({y: r for y, r in rec.items() if salt_elnino(y) == e} for e in (False, True))


def kttv_stations():
    """The KTTV stations for the salt map (docs/app/vn.js blends between them): name, position, and for each view with at
    least one season in SALT_SEASONS its level, max_ppt and months (station_view, the same rules as the province points)."""
    names = sorted({n for b in KTTV.values() for n in b["readings"]})
    out = []
    for n in names:
        s = {"name": n, "lat": KTTV_STATIONS[n]["lat"], "lon": KTTV_STATIONS[n]["lon"]}
        for key, view in zip(("typical", "elnino"), station_views(n)):
            if view:
                ppt, level, ms, _ = station_view(n, view)
                s[key] = {"level": level, "max_ppt": ppt, "months": ms, "monthly": station_monthly(n, view)}
        out.append(s)
    return out


def nearest_station(lat, lon):
    """(name, km) of the KTTV bulletin station nearest a point; ValueError if a bulletin station has no coordinates."""
    names = sorted({n for b in KTTV.values() for n in b["readings"]})
    for n in names:
        if n not in KTTV_STATIONS:
            raise ValueError(f"no coordinates for KTTV station {n}")
    return min(((n, km_between(lat, lon, KTTV_STATIONS[n]["lat"], KTTV_STATIONS[n]["lon"])) for n in names), key=lambda x: x[1])


def no_estimate(lat, lon):
    """unknown_salinity() for a province point kttv_salinity gives no estimate, saying why: its nearest station is over
    SALT_KM away, or it has readings for only one kind of year (typical or El Niño)."""
    name, km = nearest_station(lat, lon)
    d = (km_text(km), vi_num(km_text(km)))
    if km > 100:  # the bulletins cover the south only: a far station's distance tells a farmer nothing
        why = line("this point is outside the area covered by KTTV's salinity bulletins for southern Vietnam",
                   "điểm này nằm ngoài khu vực bản tin độ mặn Nam Bộ của KTTV")
    elif km > SALT_KM:
        why = line(f"the nearest KTTV salinity station, {name}, is {d[0]} km away (over {SALT_KM} km)",
                   f"trạm đo mặn KTTV gần nhất, {name}, cách {d[1]} km (xa hơn {SALT_KM} km)")
    else:
        rec = {y: r for y, r in station_record(name).items() if in_salt_seasons(y)}
        ys = ", ".join(map(str, sorted(rec)))
        kind = ("El Niño", "năm El Niño", "typical-year", "năm thường") if all(map(salt_elnino, rec)) else ("typical", "năm thường", "El Niño", "năm El Niño")
        why = line(f"the nearest KTTV salinity station, {name} ({d[0]} km away), has readings only for {kind[0]} years ({ys}), so no {kind[2]} estimate is given",
                   f"trạm đo mặn KTTV gần nhất, {name} (cách {d[1]} km), chỉ có số liệu {kind[1]} ({ys}), nên chưa có ước tính cho {kind[3]}")
    return dict(unknown_salinity(),
                note=line(f"No salinity estimate here: {why['en']}. Salinity is never measured by satellite; check local salinity reports before planting in the dry season.",
                          f"Chưa có ước tính độ mặn ở đây: {why['vi']}. Độ mặn không đo bằng vệ tinh; hãy xem bản tin độ mặn địa phương trước khi xuống giống mùa khô."),
                reason=line(f"Salt: no estimate here: {why['en']} (salinity is never measured by satellite).",
                            f"Mặn: chưa có ước tính ở đây: {why['vi']} (độ mặn không đo bằng vệ tinh)."))


def kttv_salinity(lat, lon):
    """(typical, El Niño) salinity of a province point from its nearest KTTV station (site_salinity's dict shape plus station,
    km, partial and caveat), or None when that station is over SALT_KM away or has no dry season in one of the views."""
    name, km = nearest_station(lat, lon)
    if km > SALT_KM:
        return None
    km = round(km, 1)
    views = station_views(name)
    rec = {**views[0], **views[1]}
    if not all(views):  # e.g. Rạch Giá: bulletins only in 2024, so no typical season to compare with
        return None
    at = line(f"Nearest KTTV salinity station: {name}, {km_text(km)} km away (station position approximate).",
              f"Trạm đo mặn KTTV gần nhất: {name}, cách {vi_num(km_text(km))} km (vị trí trạm gần đúng).")

    def one(view, kind):
        ppt, _, ms, rule = station_view(name, view)
        if rule == "two":
            month_note = line(" Salt months: months that reached 4‰ there in at least 2 dry seasons.", " Tháng mặn: các tháng độ mặn tại trạm đạt 4‰ trong ít nhất 2 mùa khô.")
        elif rule == "any":  # salty on average, yet no month reached 4‰ twice: any season of this view counts
            month_note = line(f" Fewer than 2 dry seasons reached 4‰ in any month, so the months from the first to the last that reached 4‰ in any {kind[0]} season are used.",
                              f" Không tháng nào đạt 4‰ trong ít nhất 2 mùa khô, nên dùng các tháng từ tháng đầu đến tháng cuối đạt 4‰ trong bất kỳ mùa khô {kind[1]} nào.")
        else:
            month_note = line(" No month reached 4‰ there in 2 dry seasons.", " Chưa tháng nào độ mặn tại trạm đạt 4‰ trong 2 mùa khô.")
        ys, part = ", ".join(map(str, sorted(view))), sorted(y for y, r in view.items() if r[2])
        if len(view) == 1:
            peak = line(f" Highest reading of the one {kind[0]} dry season in the bulletins: {ppt}‰ ({ys}); one season only, so a rough guide.",
                        f" Độ mặn cao nhất của mùa khô {kind[1]} duy nhất có trong bản tin: {vi_num(ppt)}‰ ({ys}); chỉ một mùa nên chỉ để tham khảo.")
        else:
            peak = line(f" Highest reading of each {kind[0]} dry season there: {ppt}‰ on average ({ys}).",
                        f" Độ mặn cao nhất mỗi mùa khô {kind[1]} tại trạm: trung bình {vi_num(ppt)}‰ ({ys}).")
        caveat = line(f" Dry season {', '.join(map(str, part))}: highest in the bulletins found; may miss an earlier peak.",
                      f" Mùa khô {', '.join(map(str, part))}: cao nhất trong các bản tin tìm được; có thể bỏ sót đỉnh mặn sớm hơn.") if part else None
        note = {k: at[k] + peak[k] + (caveat[k] if caveat else "") + month_note[k] for k in ("en", "vi")}
        return dict(months=ms, note=note, station_ppt=ppt, estimate=True, seasons=len(rec), last_year=max(rec),
                    level=salt_level(ppt), max_ppt=ppt, station=name, km=km, partial=bool(part), caveat=caveat,
                    monthly=station_monthly(name, view))
    return one(views[0], ("typical", "năm thường")), one(views[1], ("El Niño", "năm El Niño"))


def site_salinity(entry):
    """(typical, El Niño) salinity for one pin of salinity.json: level from its station's average yearly peak (max_ppt),
    unless the pin states its own level (then max_ppt is None)."""
    (t, a0, a1, na), (e, b0, b1, nb) = station_salt(entry["station"], False), station_salt(entry["station"], True)
    yrs = f"{min(a0, b0)}–{max(a1, b1)}"
    note = line(f"{entry['note']['en']} Highest reading of each dry season there: {t}‰ on average in typical years, {e}‰ in El Niño years ({yrs}).",
                f"{entry['note']['vi']} Độ mặn cao nhất mỗi mùa khô tại trạm: trung bình {vi_num(t)}‰ trong năm thường, {vi_num(e)}‰ trong năm El Niño ({yrs}).")
    months = sorted(set(entry["months"]) | peak_months(entry["station"]))  # reported months + the station's usual peak months
    one = lambda ppt: dict(months=months, note=note, station_ppt=ppt, estimate=True, seasons=na + nb, last_year=max(a1, b1),
                           level=entry.get("level") or salt_level(ppt), max_ppt=None if "level" in entry else ppt)
    return one(t), one(e)


def unknown_salinity():
    """Salinity of a place with no estimate in salinity.json (the 34 provinces): level UNKNOWN, no salt months."""
    return dict(months=[], note=line("No salinity estimate for this area yet. Salinity is never measured by satellite; check local salinity reports before planting in the dry season.",
                                     "Chưa có ước tính độ mặn cho khu vực này. Độ mặn không đo bằng vệ tinh; hãy xem bản tin độ mặn địa phương trước khi xuống giống mùa khô."),
                station_ppt=None, estimate=True, seasons=0, last_year=None, level=UNKNOWN, max_ppt=None)


def salt_level(ppt):
    """Station salinity (‰) -> salinity level for the area badge."""
    return "high" if ppt >= SALT_HIGH else "medium" if ppt >= SALT_MED else "low"


def card(rot, clim, nd, sal, elnino=False, soil=None, site=None):
    """One card; the upland rotation gets one variant per upland crop (variants), the shown one being the best-earning crop
    that farmers grow in this area (rotations.json "local"; every crop where no local report was found)."""
    if not rot.get("upland_crops"):
        return card_one(rot, clim, nd, sal, elnino, soil)
    here = rot.get("local", {}).get(site)  # what reports say about upland crops on rice land in this area
    local = (here or {}).get("crops") or rot["upland_crops"]
    if here:
        l = sourced(line(here["line"]["en"], here["line"]["vi"]), here["sources"])
        rot = dict(rot, **({"gaps": rot["gaps"] + [l]} if here.get("gap") else {"why": rot["why"] + [l]}))
    only = lambda xs, k: [{a: b for a, b in x.items() if a != "crops"} for x in xs if k in x.get("crops", [k])]  # lines tagged with the crops they fit
    vs = {k: dict(card_one(dict(rot, crop=k, kc_u=KC_U[k], profit=dict(rot["profit"], U=k), legume_codes=["U"] if k == "mungbean" else [],
                                **{f: only(rot[f], k) for f in ("why", "benefits", "risks", "gaps")}),
                           clim, nd, sal, elnino, soil), offered=k in local) for k in rot["upland_crops"]}
    best = max((k for k in vs if vs[k]["offered"]), key=lambda k: (vs[k]["scores"]["income"] or 0, -rot["upland_crops"].index(k)))
    return {"id": rot["id"], "kind": rot["kind"], "crop_default": best, "variants": vs}  # the app shows one variant


def card_one(rot, clim, nd, sal, elnino=False, soil=None):
    """make_card, with the pin's SoilGrids clay in place of the generic drainage note on upland options."""
    c = make_card(rot, clim, nd, sal, elnino)
    if soil and rot.get("upland"):
        clay = soil["clay_pct"]
        kind = ("clay", "sét") if clay >= 40 else ("clay-rich", "nhiều sét")  # USDA texture: 40% clay or more = clay
        km = soil.get("km")  # soil re-sampled at the nearest farmland pixel (the pin is on a town)
        at = (f"at the nearest farmland {km} km from the pin", f"tại vùng đất nông nghiệp gần nhất, cách điểm ghim {km} km") if km else ("here", "ở đây")
        c["gaps"] = [sourced(line(f"Topsoil {at[0]} is ≈ {clay}% clay (SoilGrids model, not your field): {kind[0]} soil drains slowly, so upland crops usually need raised beds and drains. Check how your own field drains.",
                          f"Tầng đất mặt {at[1]} có ≈ {vi_num(clay)}% sét (mô hình SoilGrids, không phải ruộng của bạn): đất {kind[1]} thoát nước chậm, nên cây màu thường cần lên liếp và đào rãnh thoát nước. Hãy kiểm tra ruộng của bạn thoát nước thế nào."), SOIL_SRC)
                     if g["en"].startswith("Soil drainage on your field") else g for g in c["gaps"]]
    return c


CROP_WORDS = {"rice_ws": ("winter–spring rice", "lúa Đông Xuân"), "rice_sa": ("summer–autumn rice", "lúa Hè Thu"),
              "rice_aw": ("autumn–winter rice", "lúa Thu Đông"), "rice_rs": ("rice in the rice–shrimp field", "lúa trong ruộng lúa–tôm"),
              "watermelon": ("watermelon", "dưa hấu"), "maize": ("maize", "bắp"), "mungbean": ("mung bean", "đậu xanh"), "shrimp": ("shrimp", "tôm"),
              "st_ws": ("salt-tolerant winter–spring rice", "lúa chịu mặn Đông Xuân"), "st_sa": ("salt-tolerant summer–autumn rice", "lúa chịu mặn Hè Thu")}


# 12-month plan: which crops' inputs (resources.json) each profit key needs; the upland month can be any of three crops
RES_OF = {"rice_ws": ["rice"], "rice_sa": ["rice"], "rice_aw": ["rice"], "rice_rs": ["rice_st"], "st_ws": ["rice_st"], "st_sa": ["rice_st"],
          "watermelon": ["watermelon"], "maize": ["maize"], "mungbean": ["mungbean"], "shrimp": ["shrimp"]}
PLAN_NAME = dict(CROP_WORDS, watermelon=("dry-season watermelon", "dưa hấu mùa khô"), maize=("dry-season maize", "bắp mùa khô"),
                 mungbean=("dry-season mung bean", "đậu xanh mùa khô"))


def confidence(rot, nd, sal, not_here, elnino=False):
    """(level, reasons): start at high, one level down for each of: income on fallback or widely spread figures, no MODIS NDVI,
    a salinity station with under 5 recent seasons or none after 2022, shrimp where brackish water is not available, team
    estimates used (together one level); fields bare in Feb-Apr give the upland and salt-tolerant options one level back.
    Thin income evidence caps the result at medium, so the bonus cannot cancel it."""
    conf, why = 2, []
    info = profit_keys_info(rot, not_here)
    none = [k for k, i in info.items() if not i["n"]]
    weak = [k for k, i in info.items() if i["n"] and (i["fallback"] or i["hi"] / i["lo"] > 2)]
    if none:
        why.append(line(f"No checked profit figure for {CROP_WORDS[none[0]][0]} yet, so income is not scored.",
                        f"Chưa có số liệu lợi nhuận đã kiểm chứng cho {CROP_WORDS[none[0]][1]}, nên chưa chấm điểm thu nhập."))
    if weak:
        en, vi = (sep.join(dict.fromkeys(CROP_WORDS[k][j] for k in weak)) for j, sep in ((0, " and "), (1, " và ")))
        why.append(line(f"Income rests on few or widely spread published figures for {en}.", f"Thu nhập của {vi} dựa trên ít số liệu đã công bố, hoặc các số liệu chênh lệch nhau nhiều."))
    if nd is None:
        conf -= 1
        why.append(line("Satellite greenness (NDVI) is not loaded for this site.", "Chưa có dữ liệu độ xanh vệ tinh (NDVI) cho điểm này."))
    elif set(nd["bare_months"]) & {2, 3, 4} and rot["id"] in ("rice_upland", "salt_tolerant"):
        conf += 1  # team rule: the dry-season gap this option needs already exists in the field calendar
    if sal["level"] == UNKNOWN:
        conf -= 1
        why.append(line("No salinity estimate for this area: weather & salt is not scored, salt-month profit losses are not counted and shrimp's brackish-water need is not checked.",
                        "Chưa có ước tính độ mặn cho khu vực này: chưa chấm điểm Thời tiết & mặn, chưa tính thiệt hại lợi nhuận trong tháng mặn và chưa kiểm tra nguồn nước lợ cho tôm."))
    elif sal["seasons"] < 5 or sal["last_year"] <= 2022:
        conf -= 1
        why.append(sourced(line(f"The salinity station has few recent readings (last: {sal['last_year']}).", f"Trạm đo mặn có ít số liệu gần đây (gần nhất: năm {sal['last_year']})."), SALINITY["sources"]))
    if not_here:
        conf -= 1
        why.append(line("Inland freshwater area: brackish water is not normally available here.", "Vùng nước ngọt nội đồng: thường không có nước lợ để nuôi tôm."))
    views = ("typical", "elnino") if elnino else ("typical",)
    est = []
    if TOL_ESTIMATE and rot.get("rice_class") == "tolerant":
        est.append(("salt-tolerant rice counted as half a rice month in salt months", "lúa chịu mặn được tính bằng nửa tháng lúa trong các tháng mặn"))
    if SOIL_ESTIMATE:
        est.append(("soil score weights and dry-break months", "trọng số điểm đất và số tháng ruộng khô"))
    if BRACKISH_ESTIMATE and "S" in [c[0] for c in rot["months"]]:
        est.append(("salt left by the shrimp phase", "muối còn lại sau vụ tôm"))
    m = [c[0] for c in rot["months"]]
    if "-" in m or "U" in m or "S" in m:
        est.append(("break credit for pests", "mức giảm sâu bệnh nhờ cắt vụ"))
    if "U" in m:
        est.append(("pest timing for upland crops", "thời điểm sâu hại cây màu"))
    if "S" in m:
        est.append(("shrimp disease floor and cold-snap rule", "mức rủi ro bệnh tôm tối thiểu và quy tắc trời lạnh đột ngột"))
    for l in PROFITS["loss"]:
        months = {i + 1 for code, key in rot["profit"].items() if key == l["key"] for i, m in enumerate(rot["months"]) if m == code}
        if l["estimate"] and l["view"] in views and months and (l["applies"] == "all" or months & set(sal["months"])):
            est.append(("El Niño crop-loss share", "tỷ lệ thiệt hại mùa vụ năm El Niño"))
            break
    if est:
        conf -= 1
        why.append(line("Uses team estimates: " + "; ".join(e[0] for e in est) + ".", "Dùng ước tính của nhóm: " + "; ".join(e[1] for e in est) + "."))
    if weak or none:
        conf -= 1
    return LEVELS[min(max(conf, 0), 1 if weak or none else len(LEVELS) - 1)], why


def make_card(rot, clim, nd, sal, elnino=False):
    """One rotation card for one pin.
    Area-wide facts (shortfall, crops seen, salinity, soil) and their sources are shown once per area, not on each card."""
    c = {k: rot[k] for k in ("id", "kind", "name", "calendar", "months", "benefits", "risks", "gaps")}
    c["crops_per_year"] = rot.get("crops_per_year")
    s = {}
    why, ev = list(rot["why"]), []
    risks, gaps = list(rot["risks"]), list(rot["gaps"])

    # NASA POWER + GPM: the water score is the share of 3 rice crops' canal water this calendar saves (FAO method)
    need, base = sum(water_need(rot["months"], clim, rot.get("kc_u"))), sum(water_need(BASE, clim))
    saved = max(1 - need / base, 0) if base else 0
    pw = line("NASA POWER, El Niño average", "NASA POWER, trung bình El Niño") if elnino else line("NASA POWER", "NASA POWER")
    wsrc = line(pw["en"].replace("NASA POWER", "NASA POWER + GPM"), pw["vi"].replace("NASA POWER", "NASA POWER + GPM"))  # rain is GPM
    s["water"] = x = score_water(saved)
    c.update(water_mm=need, water_saved=round(saved, 3))
    pct = round(100 * saved)
    if rot["id"] == "rice3":
        why.append(sourced(line(f"Water {x}: ≈ {need} mm of canal water a year, the most of all options here; the others are compared with it ({wsrc['en']}, FAO method).",
                        f"Nước {vi_num(x)}: ≈ {need} mm nước tưới từ kênh mỗi năm, nhiều nhất trong các phương án; các phương án khác được so với mức này ({wsrc['vi']}, phương pháp FAO)."), POWER_SRC, GPM_SRC, FAO_SRCS))
    else:
        why.append(sourced(line(f"Water {x}: ≈ {need} mm of canal water a year, {pct}% less than 3 rice crops ({wsrc['en']}, FAO method).",
                        f"Nước {vi_num(x)}: ≈ {need} mm nước tưới từ kênh mỗi năm, ít hơn {pct}% so với 3 vụ lúa ({wsrc['vi']}, phương pháp FAO)."), POWER_SRC, GPM_SRC, FAO_SRCS))

    # Weather & salt: salt months from station reports (estimate, never satellite), heat and canal water from NASA POWER + GPM
    x, w = score_weather_salt(rot, clim, sal)
    s["salt"] = x
    if x is None:
        why.append(sourced(line(f"Weather & salt not scored: no salinity estimate for this area yet. {whole(w['hot_days'])} days at or above 35 °C while crops grow ({pw['en']}).",
                                f"Chưa chấm điểm Thời tiết & mặn: chưa có ước tính độ mặn cho khu vực này. {vi_num(whole(w['hot_days']))} ngày từ 35 °C trở lên khi cây đang sinh trưởng ({pw['vi']})."), POWER_SRC, HEAT_SRC))
    else:
        if "station" in sal:  # a province point: its nearest KTTV station
            part = ("; highest in the bulletins found; may miss an earlier peak", "; cao nhất trong các bản tin tìm được, có thể bỏ sót đỉnh mặn sớm hơn") if sal["partial"] else ("", "")
            peak_en = f"{sal['station']} station {km_text(sal['km'])} km away, average peak {w['ppt']}‰{part[0]}; estimate from station reports"
            peak_vi = f"trạm {sal['station']} cách {vi_num(km_text(sal['km']))} km, độ mặn cao nhất trung bình {vi_num(w['ppt'])}‰{part[1]}; ước tính từ báo cáo trạm"
        elif sal["max_ppt"] is not None:
            peak_en, peak_vi = f"station average peak {w['ppt']}‰, estimate from station reports", f"độ mặn cao nhất trung bình tại trạm {vi_num(w['ppt'])}‰, ước tính từ báo cáo trạm"
        else:
            peak_en = f"station average peak {w['ppt']}‰, but rated low here: sluices keep salt out of the fields; estimate from station reports"
            peak_vi = f"độ mặn cao nhất trung bình tại trạm {vi_num(w['ppt'])}‰, nhưng được xếp mức thấp ở đây: cống ngăn mặn giữ cho ruộng không bị mặn; ước tính từ báo cáo trạm"
        why.append(sourced(line(f"Weather & salt {x}: crops in the field in {w['salt_k']} of {w['salt_n']} salt months ({peak_en}); {whole(w['hot_days'])} days at or above 35 °C while crops grow ({pw['en']}); {w['canal_mm']} mm of canal water needed in salty months ({wsrc['en']}).",
                        f"Thời tiết & mặn {vi_num(x)}: có cây trồng trên ruộng trong {w['salt_k']}/{w['salt_n']} tháng mặn ({peak_vi}); {vi_num(whole(w['hot_days']))} ngày từ 35 °C trở lên khi cây đang sinh trưởng ({pw['vi']}); cần {w['canal_mm']} mm nước tưới từ kênh trong các tháng mặn ({wsrc['vi']})."), SALINITY["sources"], POWER_SRC, HEAT_SRC, GPM_SRC))

    # Soil: counted on the calendar (legume months, optional cover crop, dry months, rice months, brackish months), no satellite data
    x, o = score_soil(rot)
    s["soil"] = x
    cv, br, lg = o["cover"], o["brackish"], o["legume"]
    why.append(line(f"Soil {x}: {lg} legume month{'' if lg == 1 else 's'}; {o['dry']} month{'' if o['dry'] == 1 else 's'} when the flooded soil dries out; rice in {o['rice']} of 12 months{'; cover crop optional: more if you sow one' if cv else ''}{'; brackish months leave salt in the soil' if br else ''}.",
                    f"Đất {vi_num(x)}: {lg} tháng cây họ đậu; {o['dry']} tháng đất ruộng được khô; có lúa {o['rice']}/12 tháng{'; cây che phủ không bắt buộc: điểm cao hơn nếu bạn gieo' if cv else ''}{'; các tháng nước lợ để lại muối trong đất' if br else ''}."))

    # Pests: rice planthopper pressure from NASA POWER temperature, upland and shrimp pests named, rest months break the cycle
    x, o = score_pests(rot, clim)
    s["pests"] = x
    why.append(sourced(line(f"Pests {x}: rice in {o['rice']} months; NASA POWER temperatures here suit the brown planthopper all year (Horgan et al. 2020), so rest months that break its cycle matter most; {o['rest']} rest month(s).",
                            f"Sâu bệnh {vi_num(x)}: có lúa trong {o['rice']} tháng; nhiệt độ NASA POWER ở đây thuận lợi cho rầy nâu quanh năm (Horgan và cộng sự 2020), nên các tháng nghỉ cắt vòng đời rầy là quan trọng nhất; {o['rest']} tháng nghỉ."), POWER_SRC, PESTS["rice"]["source"]))
    if o["upland"] and rot.get("crop") in PESTS["upland"]:
        up = PESTS["upland"][rot["crop"]]
        cen, cvi = {"watermelon": ("watermelon", "dưa hấu"), "maize": ("maize", "bắp"), "mungbean": ("mung bean", "đậu xanh")}[rot["crop"]]
        risks.append(sourced(line(f"{cen.capitalize()} here faces {up['pest']['en']} in every month it is in the field: no Mekong Delta source gives its timing, so each of those months counts fully in the Pests score.",
                                  f"{cvi.capitalize()} ở đây bị {up['pest']['vi']} gây hại trong mọi tháng cây đang trên ruộng: chưa có nguồn nào ở Đồng bằng sông Cửu Long cho biết thời điểm, nên mỗi tháng đó được tính đầy đủ trong điểm Sâu bệnh."), up["source"]))
    if o["shrimp"]:
        risks.append(sourced(line("Shrimp months count as at least half the pest risk of a rice month (white spot disease recurs), and more with days at or above 35 °C or a sudden cold night (NASA POWER).",
                                  "Các tháng nuôi tôm được tính ít nhất bằng một nửa rủi ro sâu bệnh của tháng lúa (bệnh đốm trắng hay tái phát), và cao hơn khi có ngày từ 35 °C trở lên hoặc đêm lạnh đột ngột (NASA POWER)."), POWER_SRC, PESTS["shrimp"]["sources"]))

    # MODIS NDVI evidence: bare windows (confidence itself is computed in confidence())
    if nd and nd["bare_months"] and rot["id"] in ("rice_upland", "salt_tolerant"):
        ev.append(sourced(line(f"NASA MODIS NDVI: fields are usually bare in {month_names(nd['bare_months'], 'en')}, a window that fits this option.",
                       f"NASA MODIS NDVI: ruộng thường để trống vào {month_names(nd['bare_months'], 'vi')}, phù hợp với phương án này."), MODIS_SRC))

    # Salinity: local estimate, never satellite
    risk = sal["level"]  # the El Niño view passes the El Niño seasons' salinity
    not_here = risk == "low" and rot.get("needs_brackish", False)
    if risk == UNKNOWN and rot.get("needs_brackish"):
        risks.insert(0, line("No salinity estimate here: check that brackish water reaches your field before stocking shrimp.",
                             "Chưa có ước tính độ mặn ở đây: hãy kiểm tra nước lợ có vào được ruộng của bạn không trước khi thả tôm."))
    if risk == "high" and rot.get("needs_brackish"):
        why.append(sourced(line("High salinity estimate here: this option is designed for salty dry seasons.",
                                "Độ mặn ước tính ở đây cao: phương án này dành cho vùng có mùa khô nhiễm mặn."), SALINITY["sources"]))

    # Upland crops in salt months: river water at medium or high level (4‰ ≈ 5 dS/m or more) is far above what FAO lists for maize
    upl = sorted({i + 1 for i, m in enumerate(rot["months"]) if m == "U"} & set(sal["months"]))
    if rot.get("upland") and upl and risk in ("medium", "high"):
        risks.insert(0, sourced(line(f"Canal water here in {month_names(upl, 'en')} is usually far saltier than upland crops tolerate (FAO: maize loses yield above about 0.7‰; watermelon and mung bean are no hardier): grow them only with stored fresh water.",
                                     f"Nước kênh ở đây vào {month_names(upl, 'vi')} thường mặn hơn nhiều so với mức cây màu chịu được (FAO: bắp giảm năng suất khi nước mặn trên khoảng 0,7‰; dưa hấu và đậu xanh không chịu mặn hơn): chỉ nên trồng khi có nước ngọt trữ sẵn."),
                                SALINITY["sources"], FAO29_SRC, FAO48_SRC))
        risks = [r for r in risks if not r["en"].startswith("Upland crops are also hurt")]  # the flag above says it with numbers

    # Income: medians of published profit figures (profits.json), compared with 3 rice crops at the same pin and view
    p, p3 = yearly_profit(rot, sal, elnino, not_here), yearly_profit(BASE_ROT, sal, elnino, False)
    s["income"] = x = score_income(p, p3)
    info = profit_keys_info(rot, not_here)
    n = sum(i["n"] for i in info.values())
    psrc = list({f["source"]["title"]: f["source"] for f in PROFITS["figures"] if f["key"] in info}.values())
    if p is None:  # a crop with no checked figure: the reason is listed under risks (confidence)
        level, reasons = confidence(rot, nd, sal, not_here, elnino)
        return finish(c, rot, s, why + ev, risks + reasons, gaps, list(rot["benefits"]), level, not_here)
    # profit range for the app: same sum with each crop's lowest / median / highest used figure (M ₫/ha a year)
    c["profit_range"] = {"lo": yearly_profit(rot, sal, elnino, not_here, low_profit), "mid": p,
                         "hi": yearly_profit(rot, sal, elnino, not_here, high_profit), "n": n}
    benefits = list(rot["benefits"])
    ratio = round(p / p3, 1)
    why.append(sourced(line(f"Income {x}: estimated profit ≈ {p} vs {p3} M ₫/ha a year for 3 rice crops ({ratio}×; medians of {n} published figures, 2020–2025).",
                            f"Thu nhập {vi_num(x)}: lợi nhuận ước tính ≈ {vi_num(p)} so với {vi_num(p3)} triệu đồng/ha/năm của 3 vụ lúa ({vi_num(ratio)}×; trung vị của {n} số liệu đã công bố, 2020–2025)."), psrc))

    level, reasons = confidence(rot, nd, sal, not_here, elnino)
    return finish(c, rot, s, why + ev, risks + reasons, gaps, benefits, level, not_here)


def finish(c, rot, s, why, risks, gaps, benefits, level, not_here):
    c.update(scores=s, why=why, risks=risks, gaps=gaps, benefits=benefits, crop=rot.get("crop"),
             confidence=level, not_here=not_here,
             plan={code: {"name": line(*PLAN_NAME[key]), "res": RES_OF[key]} for code, key in rot["profit"].items()},
             upland=rot.get("upland", False), needs_brackish=rot.get("needs_brackish", False),
             cal_src=cite(rot["calendar_sources"]), src=cite(rot["sources"]))  # src: the rotation's own text (why, benefits, risks)
    return c


def mean_climate(clims):
    """Month-by-month average of several climate() results (one per data point of a province)."""
    out = {}
    for k in clims[0]:
        whole_mm = k in ("rain_mm", "rain_min_mm", "rain_max_mm", "et0_mm")  # climate() rounds these to whole mm
        out[k] = [round(sum(c[k][m] for c in clims) / len(clims), None if whole_mm else 1) for m in range(12)]
    return out


def point_soil(i):
    """SoilGrids topsoil of one point, or None (town or water pixel). Points re-sampled by fetch_soil.py nearby carry
    "km": how far from the pin the farmland pixel is (always inside the same former province)."""
    f = RAW / f"soil_{i}.json"
    if not f.exists():
        return None
    raw = json.loads(f.read_text(encoding="utf-8"))
    v = topsoil(raw)
    if v and raw.get("sample"):
        v["km"] = raw["sample"]["km"]
    return v


def mean_soil(ids):
    """SoilGrids topsoil averaged over the points whose pixel has soil, and those points."""
    got = [(i, v) for i, v in ((i, point_soil(i)) for i in ids) if v]
    if not got:
        return None, []
    return {k: round(sum(v[k] for _, v in got) / len(got), 1) for k in ("clay_pct", "soc_g_kg", "ph")}, [i for i, _ in got]


FARM_NDVI = 0.5  # a pixel whose greenest month stays under this is a town, water or bare ground, not a crop field (team rule)


def farmland(nd):
    """True when a MODIS pixel looks like a crop field: rice and upland crops peak well above 0.5 NDVI, towns and water stay
    near 0.2-0.4. The 34 provinces' own points sit on former capitals, so most MODIS pixels there are town."""
    return bool(nd) and max(nd["monthly"]) >= FARM_NDVI


def place_summary(clim, nd, sal, scored, elnino=False):
    """summary(), minus the winter-spring water line outside the Delta: its months are the Mekong Delta's rice calendar."""
    out = summary(clim, nd, sal, elnino)
    return out if scored else out[1:]


def point_rain(gpm, pid):
    if pid not in gpm:
        raise ValueError(f"missing GPM data for {pid} (run pipeline/fetch_gpm.py)")
    return gpm[pid]


NOT_SCORED = line("Rotation cards are not scored here: the rotations and their published profit figures all come from the Mekong Delta.",
                  "Chưa chấm điểm các phương án luân canh ở đây: các phương án và số liệu lợi nhuận đã công bố đều lấy từ Đồng bằng sông Cửu Long.")


def province(pr, rotations, gpm):
    """One of the 34 provinces (sites.PROVINCES): the climate of each former province's point (its own NASA POWER weather,
    NASA GPM rain and latitude for FAO-56 water demand), averaged month by month; SoilGrids topsoil averaged over the
    points with soil. No salinity estimate (UNKNOWN: salt is shown per former province), no MODIS. Rotation cards only in SCORED_REGIONS."""
    ids = [f["id"] for f in pr["former"]]
    rain_ids = [i for i in ids if point_rain(gpm, i)]
    powers = {i: json.loads((RAW / f"power_{i}.json").read_text(encoding="utf-8")) for i in ids}
    clim = mean_climate([climate(powers[f["id"]], f["lat"], typical_year, gpm[f["id"]]) for f in pr["former"]])
    clim_e = mean_climate([climate(powers[f["id"]], f["lat"], in_elnino, gpm[f["id"]]) for f in pr["former"]])
    soil, soil_ids = mean_soil(ids)
    sal = dict(unknown_salinity(), note=line(
        f"No single salinity estimate for the whole province: salt is shown per former province, from its nearest KTTV station where one lies within {SALT_KM} km.",
        f"Không có một ước tính độ mặn chung cho cả tỉnh: độ mặn được hiển thị theo từng tỉnh cũ, theo trạm KTTV gần nhất nếu có trạm trong phạm vi {SALT_KM} km."),
               reason=line("Salt: no estimate for the whole province; salt is shown per former province: pick a former province to see its salt.",
                           "Mặn: chưa có ước tính chung cho cả tỉnh; độ mặn được hiển thị theo từng tỉnh cũ: hãy chọn một tỉnh cũ để xem độ mặn."))
    scored = pr["region"] in SCORED_REGIONS
    cards = [card(r, clim, None, sal, soil=soil, site=pr["id"]) for r in rotations] if scored else []
    cards_e = [card(r, clim_e, None, sal, elnino=True, soil=soil, site=pr["id"]) for r in rotations] if scored else []
    out = {k: pr[k] for k in ("id", "name", "lat", "lon", "region")}
    out.update(region_name=REGIONS[pr["region"]], former=[{k: f[k] for k in ("id", "name", "lat", "lon")} for f in pr["former"]],
               areas=pr.get("areas", []), points={"power": ids, "gpm": rain_ids, "soil": soil_ids},
               climate=clim, soil=soil, salinity=sal, scored=scored, not_scored=None if scored else NOT_SCORED,
               cards=cards, summary=place_summary(clim, None, sal, scored),
               gpm_check=dict(gpm_check(powers[pr["id"]], gpm[pr["id"]]) or {}, point=pr["id"]),
               elnino={"climate": clim_e, "salinity": sal, "cards": cards_e, "summary": place_summary(clim_e, None, sal, scored, elnino=True)})
    return out


def place(f, pr, rotations, gpm):
    """One province point on its own (a former province's capital, or the new province's own pin): the same engine as a
    Sóc Trăng pin with its own NASA POWER weather, NASA GPM rain and SoilGrids topsoil, MODIS greenness where
    data/raw/ndvi_<id>.json exists (39 points for now) and the pixel looks like farmland (farmland()), and salinity from
    the nearest KTTV station within SALT_KM (kttv_salinity), else none (UNKNOWN). Cards only in SCORED_REGIONS."""
    power = json.loads((RAW / f"power_{f['id']}.json").read_text(encoding="utf-8"))
    rain = point_rain(gpm, f["id"])
    clim, clim_e = climate(power, f["lat"], typical_year, rain), climate(power, f["lat"], in_elnino, rain)
    nd = None
    ndvi_file = RAW / f"ndvi_{f['id']}.json"
    if ndvi_file.exists():
        series = json.loads(ndvi_file.read_text(encoding="utf-8"))
        recent = {d: v for d, v in series.items() if RECENT[0] <= date.fromisoformat(d) <= RECENT[1]}
        nd = dict(zip(("monthly_min", "monthly_max"), ndvi.monthly_range(series, typical_year)),
                  monthly=ndvi.monthly_mean(series, typical_year), bare_months=ndvi.bare_months(recent),
                  crops_per_year=ndvi.crops_per_year(recent))
    if nd:
        nd["farmland"] = farmland(nd)
    use = nd if nd and nd["farmland"] else None  # a town or water pixel says nothing about the fields: not used
    soil = point_soil(f["id"])
    sal, sal_e = kttv_salinity(f["lat"], f["lon"]) or (no_estimate(f["lat"], f["lon"]),) * 2
    scored = pr["region"] in SCORED_REGIONS
    cards = [card(r, clim, use, sal, soil=soil, site=f["id"]) for r in rotations] if scored else []
    cards_e = [card(r, clim_e, use, sal_e, elnino=True, soil=soil, site=f["id"]) for r in rotations] if scored else []
    return dict({k: f[k] for k in ("id", "name", "lat", "lon")}, province=pr["id"], region=pr["region"],
                own=f["id"] == pr["id"], climate=clim, ndvi=nd, soil=soil, salinity=sal, scored=scored,
                not_scored=None if scored else NOT_SCORED, cards=cards, summary=place_summary(clim, use, sal, scored),
                gpm_check=gpm_check(power, rain),
                elnino={"climate": clim_e, "salinity": sal_e, "cards": cards_e, "summary": place_summary(clim_e, use, sal_e, scored, elnino=True)})


def build():
    rot_file = json.loads((HERE / "rotations.json").read_text(encoding="utf-8"))
    rotations = rot_file["rotations"]
    salinity = SALINITY
    SOURCES.clear()
    area = {"chart_src": cite(POWER_SRC, GPM_SRC, FAO_SRCS, SALINITY["sources"], MODIS_SRC), "salt_src": cite(SALINITY["sources"]),
            "soil_src": cite(SOIL_SRC)}
    pest_rule = {"rice_points": PESTS["rice"]["points"], "break_weight": PESTS["break_weight"], "shrimp_floor": PESTS["shrimp"]["floor"],
                 "cold_drop_c": PESTS["shrimp"]["cold_drop_c"], "hot_c": PESTS["shrimp"]["hot_c"], "upland_pressure": 1}
    outlook_src, area["elnino_src"] = cite(OUTLOOK["source"]), cite(ONI_SRC)  # area-wide first: numbers climb down the page
    gpm = json.loads((RAW / "gpm.json").read_text(encoding="utf-8"))
    sites = []
    for s in SITES:
        if s["id"] not in gpm:
            raise ValueError(f"missing GPM data for {s['id']} (run pipeline/fetch_gpm.py)")
        power = json.loads((RAW / f"power_{s['id']}.json").read_text(encoding="utf-8"))
        rain = gpm[s["id"]]
        clim, clim_e = climate(power, s["lat"], typical_year, rain), climate(power, s["lat"], in_elnino, rain)
        ndvi_file = RAW / f"ndvi_{s['id']}.json"
        nd = nd_e = None
        if ndvi_file.exists():
            series = json.loads(ndvi_file.read_text(encoding="utf-8"))
            chart = lambda keep: dict(zip(("monthly_min", "monthly_max"), ndvi.monthly_range(series, keep)), monthly=ndvi.monthly_mean(series, keep))
            # the chart follows the typical / El Niño toggle over PERIOD; crops per year and bare months describe today's calendar (RECENT)
            recent = {d: v for d, v in series.items() if RECENT[0] <= date.fromisoformat(d) <= RECENT[1]}
            nd = dict(chart(typical_year), bare_months=ndvi.bare_months(recent), crops_per_year=ndvi.crops_per_year(recent))
            nd_e = chart(in_elnino)
        hls_file = RAW / f"hls_{s['id']}.json"
        hls_result = hls_check(json.loads(hls_file.read_text(encoding="utf-8")), nd["bare_months"] if nd else ()) if hls_file.exists() else None
        soil_file = RAW / f"soil_{s['id']}.json"
        soil = topsoil(json.loads(soil_file.read_text(encoding="utf-8"))) if soil_file.exists() else None
        sal, sal_e = site_salinity(salinity["sites"][s["id"]])
        cards = [card(r, clim, nd, sal, soil=soil, site=s['id']) for r in rotations]
        cards_e = [card(r, clim_e, nd, sal_e, elnino=True, soil=soil, site=s['id']) for r in rotations]
        sites.append(dict(s, climate=clim, ndvi=nd, salinity=sal, soil=soil, cards=cards, summary=summary(clim, nd, sal),
                          seed_check=seed_check(clim, sal),
                          gpm_check=gpm_check(power, gpm[s["id"]]) if s["id"] in gpm else None,
                          hls_check=hls_result,
                          elnino={"climate": clim_e, "ndvi": nd_e, "salinity": sal_e, "cards": cards_e,
                                  "summary": summary(clim_e, nd, sal_e, elnino=True), "seed_check": seed_check(clim_e, sal_e)}))
    soil_help = [dict({k: v for k, v in h.items() if k != "sources"}, src=cite(h["sources"])) for h in rot_file["soil_help"]]
    resources = {k: dict({a: b for a, b in r.items() if a != "sources"}, src=cite(r["sources"])) for k, r in RESOURCES.items()}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"generated": date.today().isoformat(), "soil_help": soil_help,
                               "outlook": dict({k: OUTLOOK[k] for k in ("elnino", "text")}, src=outlook_src), "resources": resources, "pest_rule": pest_rule,
                               **area, "sources": [v for _, v in sorted(SOURCES.values(), key=lambda x: x[0])], "sites": sites}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", OUT, len(sites), "sites")
    # The 34 provinces go to their own file with its own numbered source list, so the file every phone downloads stays small
    SOURCES.clear()
    head = {"chart_src": cite(POWER_SRC, GPM_SRC, FAO_SRCS), "soil_src": cite(SOIL_SRC), "region_src": cite(REGION_SRC),
            "elnino_src": cite(ONI_SRC), "ndvi_src": cite(MODIS_SRC), "outline_src": cite(OUTLINE_SRC)}
    provinces = [province(pr, rotations, gpm) for pr in PROVINCES]
    places = [place(f, pr, rotations, gpm) for pr in PROVINCES for f in pr["former"]]
    # the 5 Sóc Trăng areas, drawn inside the Vietnam map like the main map: salt peak at the nearest station (estimate from
    # public reports, never satellite) and MODIS crops a year; the full planner lives in sites.json
    head["salt_src"] = cite(SALINITY["sources"])
    pins = [dict({k: s[k] for k in ("id", "name", "lat", "lon")},
                 salt={"level": s["salinity"]["level"], "months": s["salinity"]["months"], "max_ppt": s["salinity"]["max_ppt"],
                       "elnino_max_ppt": s["elnino"]["salinity"]["max_ppt"], "estimate": True},
                 crops=s["ndvi"]["crops_per_year"] if s["ndvi"] else None) for s in sites]
    PROV_OUT.write_text(json.dumps({"generated": date.today().isoformat(), "regions": REGIONS, **head,
                                    "sources": [v for _, v in sorted(SOURCES.values(), key=lambda x: x[0])], "provinces": provinces,
                                    "places": places, "pins": pins, "stations": kttv_stations()}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", PROV_OUT, len(provinces), "provinces,", len(places), "province points")


if __name__ == "__main__":
    import sys
    # Windows uses cp1252 when output is redirected; Vietnamese text would crash print().
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    build()
