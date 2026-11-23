"""Salinity of any point the app shows, from station reports (never satellite). The rules are in SOURCES.md;
build.py only calls the interface:

    at(point, db=DATA) -> (typical, El Niño): the 5 area pins use salinity.json and the Sóc Trăng paper table; any other
        point its nearest KTTV station inside the app's area within SALT_KM, else a level-UNKNOWN dict that says why.
    stations(db=DATA) -> the KTTV stations for the salt map, with each view's level, peak and months.
    unknown() -> the placeholder of a place with no estimate (the province averages).

db bundles every input (load()); tests pass small fixtures instead of the real files.
"""
import json
import math
import pathlib
from collections import defaultdict
from datetime import date

import make_outlines
from text import km_text, line, vi_num

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
SALT_HIGH, SALT_MED = 15, 4  # ‰ cut-offs of the salinity level rule (see salinity.json _readme)
# Salinity has its own window: dry seasons by the year they end, 1999-2026: the Sóc Trăng table starts in 1999, two open series (Mendeley, GFZ) give 1999-2016 for 3 KTTV stations, and the KTTV bulletins (2024-2026) end it.
SALT_SEASONS = (1999, 2026)
SALT_KM = 25  # a province point takes its nearest KTTV station's salinity only this close (km, team rule); else no estimate
UNKNOWN = "unknown"  # salinity level of a place with no salinity estimate (the province averages): salt is not assessed there# The 24 full Dec-Nov seasons where NASA POWER, NASA GPM and NASA MODIS all have data; data/raw holds longer records.
SALT_ELNINO = {int(r[1]) for r in (ln.split() for ln in (RAW / "roni.txt").read_text(encoding="utf-8").splitlines())
               if r[:1] == ["DJF"] and float(r[2]) >= 0.5}


def salt_elnino(y):
    """True if the dry season ending in year y is an El Niño one: NOAA's Dec-Feb RONI of year y is 0.5 or more (any year in roni.txt)."""
    return y in SALT_ELNINO


def load():
    """Every input, read once: KTTV bulletins and station positions, the Sóc Trăng paper table, salinity.json (the pins),
    the names linking the table to the bulletins, and the app's area (province outlines from make_outlines.py)."""
    text = make_outlines.OUT.read_text(encoding="utf-8")
    g = json.loads(text[text.index("{"):text.rindex("}") + 1])
    return {"bulletins": json.loads((RAW / "salinity_kttv_vietnam.json").read_text(encoding="utf-8"))["bulletins"],
            "stations": json.loads((RAW / "kttv_stations.json").read_text(encoding="utf-8"))["stations"],
            "open": json.loads((RAW / "salinity_open_series.json").read_text(encoding="utf-8"))["stations"],
            "table": json.loads((RAW / "salinity_stations.json").read_text(encoding="utf-8"))["stations"],
            "pins": json.loads((pathlib.Path(__file__).resolve().parent / "salinity.json").read_text(encoding="utf-8")),
            # the Sóc Trăng table (salinity_stations.json ids) and the KTTV bulletins name the same 5 stations differently
            "links": {"tran_de": "Trần Đề", "long_phu": "Long Phú", "dai_ngai": "Đại Ngãi", "thanh_phu": "Thạnh Phú", "soc_trang": "Sóc Trăng"},
            "area": [make_outlines.ring_pts(g["arcs"], r) for rs in g["province"].values() for r in rs]}


DATA = load()
SOURCES = DATA["pins"]["sources"]


def at(point, db=DATA):
    """(typical, El Niño) salinity of a point {id, lat, lon}: always a pair, an estimate or UNKNOWN with the reason."""
    pin = db["pins"]["sites"].get(point["id"])
    if pin:
        return site_salinity(db, pin)
    return kttv_salinity(db, point["lat"], point["lon"]) or (no_estimate(db, point["lat"], point["lon"]),) * 2


def stations(db=DATA):
    return kttv_stations(db)


def unknown():
    return unknown_salinity()


def in_salt_seasons(y):
    return SALT_SEASONS[0] <= int(y) <= SALT_SEASONS[1]


def table_rows(db, sid):
    """{season: [peak ‰, month]} of a Sóc Trăng table station: the paper's yearly peaks, plus any lower_bound season (a measured
    reading entered as 'at least', so it can only understate that season)."""
    st = db["table"][sid]
    return {**st["yearly_max"], **{y: [v["ppt"], v["month"]] for y, v in st.get("lower_bound", {}).items()}}


def full_last_year(db, sid):
    """The last season of a table station with a published peak (lower_bound seasons are single readings, not peaks: the
    confidence rule 'no reading after 2022' still applies to a station whose newer seasons are only lower bounds)."""
    return max(int(y) for y in db["table"][sid]["yearly_max"])


def station_salt(db, sid, elnino):
    """A station's highest salinity of each dry season (‰, table_rows), averaged over the SALT_SEASONS
    that are El Niño (elnino=True, salt_elnino) or not: (average, first year, last year, number of seasons). Dry season of year y ends in y."""
    rows = table_rows(db, sid)
    ys = {int(y): v[0] for y, v in rows.items() if in_salt_seasons(y) and salt_elnino(int(y)) == elnino}
    return round(sum(ys.values()) / len(ys), 1), min(ys), max(ys), len(ys)


def peak_months(db, sid):
    """Months when the station had its highest reading in at least 2 of the SALT_SEASONS dry seasons."""
    ms = [v[1] for y, v in table_rows(db, sid).items() if in_salt_seasons(y)]
    return {m for m in ms if ms.count(m) >= 2}


def kttv_seasons(db, name):
    """{dry season (end year): (highest reading ‰, its month, partial)} of one station in the KTTV bulletins. A reading is the
    highest of the 10 days before the issue date; its month is the issue date's. partial: no reading in February or none in March."""
    got = defaultdict(list)
    for d, b in sorted(db["bulletins"].items()):
        if name in b["readings"]:
            day = date.fromisoformat(d)
            got[day.year + (day.month == 12)].append((b["readings"][name], day.month))
    return {y: (*max(rs, key=lambda r: r[0]), not {2, 3} <= {m for _, m in rs}) for y, rs in got.items()}


def station_record(db, name):
    """{dry season: (max_ppt, month, partial)} of a KTTV station: the Sóc Trăng table's rows first (whole seasons, partial
    False), then the bulletin seasons the table lacks, then the open series' seasons (db["open"], 1999-2016) neither has. At a
    table station a partial bulletin season is left out: its peak may be missing, and it would pull a whole-season record down.
    An open season with no month (Mendeley) has month None: it counts toward the level, never toward salt months."""
    sid = next((k for k, v in db["links"].items() if v == name), None)
    rows = db["table"][sid]["yearly_max"] if sid else {}
    table = {int(y): (v[0], v[1], False) for y, v in rows.items()}
    opened = {int(y): (v["ppt"], v["month"], v.get("partial", False)) for y, v in db.get("open", {}).get(name, {}).items()}
    return {**opened, **{y: r for y, r in kttv_seasons(db, name).items() if not (sid and r[2])}, **table}


def km_between(lat1, lon1, lat2, lon2):
    """Great-circle distance in km (haversine, Earth radius 6371 km), as kmBetween in docs/app/vn.js."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def salt_months(db, name, seasons=None, need=2):
    """Months that reached SALT_MED (4‰) at the station in at least `need` dry seasons (of `seasons` if given, else of
    SALT_SEASONS): its KTTV bulletin readings, at a Sóc Trăng table station also each table row's peak, at its month, and each open-series
    season that has a month (GFZ Sơn Đốc)."""
    seen = defaultdict(set)
    want = lambda y: y in seasons if seasons else in_salt_seasons(y)
    for d, b in db["bulletins"].items():
        day = date.fromisoformat(d)
        y = day.year + (day.month == 12)
        if b["readings"].get(name, 0) >= SALT_MED and want(y):
            seen[day.month].add(y)
    for y, v in db.get("open", {}).get(name, {}).items():  # open series: only a season with a month, and not one the bulletins cover
        if v["month"] and v["ppt"] >= SALT_MED and want(int(y)) and int(y) not in kttv_seasons(db, name):
            seen[v["month"]].add(int(y))
    sid = next((k for k, v in db["links"].items() if v == name), None)
    for y, (ppt, m) in (db["table"][sid]["yearly_max"].items() if sid else ()):
        if ppt >= SALT_MED and want(int(y)):
            seen[m].add(int(y))
    return sorted(m for m, ys in seen.items() if len(ys) >= need)


def station_view(db, name, view):
    """One view (typical or El Niño seasons, {season: (max_ppt, month, partial)}) of a station: (max_ppt, level, months,
    rule). max_ppt: the average of the seasons' peaks. months: salt_months (rule "two"); if none while the level is medium or
    high (ruling R3), the range from the first to the last month that reached 4‰ in any season of this view (rule "any");
    else none (rule "none")."""
    ppt = round(sum(r[0] for r in view.values()) / len(view), 1)
    ms, rule = salt_months(db, name), "two"
    if not ms and salt_level(ppt) != "low":
        q = salt_months(db, name, set(view), 1)
        ms, rule = list(range(min(q), max(q) + 1)), "any"
    elif not ms:
        rule = "none"
    return ppt, salt_level(ppt), ms, rule


def station_monthly(db, name, view):
    """12 monthly ‰ of a station for one view (its seasons, as station_views gives): each month's highest 10-day reading in
    the bulletins, averaged over the view's seasons that have one; None where no bulletin has a reading that month."""
    got = defaultdict(lambda: defaultdict(list))
    for d, b in db["bulletins"].items():
        day = date.fromisoformat(d)
        if name in b["readings"] and day.year + (day.month == 12) in view:
            got[day.month][day.year + (day.month == 12)].append(b["readings"][name])
    return [round(sum(max(v) for v in got[m].values()) / len(got[m]), 1) if got[m] else None for m in range(1, 13)]


def station_views(db, name):
    """(typical, El Niño) seasons of a station within SALT_SEASONS, as station_record's rows."""
    rec = {y: r for y, r in station_record(db, name).items() if in_salt_seasons(y)}
    return tuple({y: r for y, r in rec.items() if salt_elnino(y) == e} for e in (False, True))


def bulletin_stations(db):
    """Names of the KTTV bulletin stations inside the app's area (sorted)."""
    rings = db["area"]
    return sorted(n for n in {n for b in db["bulletins"].values() for n in b["readings"]}
                  if n not in db["stations"] or make_outlines.inside(db["stations"][n]["lon"], db["stations"][n]["lat"], rings))


def kttv_stations(db):
    """The KTTV stations for the salt map (docs/app/vn.js blends between them): name, position, and for each view with at
    least one season in SALT_SEASONS its level, max_ppt and months (station_view, the same rules as the province points)."""
    names = bulletin_stations(db)
    out = []
    for n in names:
        s = {"name": n, "lat": db["stations"][n]["lat"], "lon": db["stations"][n]["lon"]}
        for key, view in zip(("typical", "elnino"), station_views(db, n)):
            if view:
                ppt, level, ms, _ = station_view(db, n, view)
                s[key] = {"level": level, "max_ppt": ppt, "months": ms, "monthly": station_monthly(db, n, view)}
        out.append(s)
    return out


def nearest_station(db, lat, lon):
    """(name, km) of the KTTV bulletin station nearest a point; ValueError if a bulletin station has no coordinates."""
    names = bulletin_stations(db)
    for n in names:
        if n not in db["stations"]:
            raise ValueError(f"no coordinates for KTTV station {n}")
    return min(((n, km_between(lat, lon, db["stations"][n]["lat"], db["stations"][n]["lon"])) for n in names), key=lambda x: x[1])


def no_estimate(db, lat, lon):
    """unknown_salinity() for a province point kttv_salinity gives no estimate, saying why: its nearest station is over
    SALT_KM away, or it has readings for only one kind of year (typical or El Niño)."""
    name, km = nearest_station(db, lat, lon)
    d = (km_text(km), vi_num(km_text(km)))
    if km > 100:  # the bulletins cover the south only: a far station's distance tells a farmer nothing
        why = line("this point is outside the area covered by KTTV's salinity bulletins for southern Vietnam",
                   "điểm này nằm ngoài khu vực bản tin độ mặn Nam Bộ của KTTV")
    elif km > SALT_KM:
        why = line(f"the nearest KTTV salinity station, {name}, is {d[0]} km away (over {SALT_KM} km)",
                   f"trạm đo mặn KTTV gần nhất, {name}, cách {d[1]} km (xa hơn {SALT_KM} km)")
    else:
        rec = {y: r for y, r in station_record(db, name).items() if in_salt_seasons(y)}
        ys = ", ".join(map(str, sorted(rec)))
        kind = ("El Niño", "năm El Niño", "typical-year", "năm thường") if all(map(salt_elnino, rec)) else ("typical", "năm thường", "El Niño", "năm El Niño")
        why = line(f"the nearest KTTV salinity station, {name} ({d[0]} km away), has readings only for {kind[0]} years ({ys}), so no {kind[2]} estimate is given",
                   f"trạm đo mặn KTTV gần nhất, {name} (cách {d[1]} km), chỉ có số liệu {kind[1]} ({ys}), nên chưa có ước tính cho {kind[3]}")
    return dict(unknown_salinity(),
                note=line(f"No salinity estimate here: {why['en']}. Salinity is never measured by satellite; check local salinity reports before planting in the dry season.",
                          f"Chưa có ước tính độ mặn ở đây: {why['vi']}. Độ mặn không đo bằng vệ tinh; hãy xem bản tin độ mặn địa phương trước khi xuống giống mùa khô."),
                reason=line(f"Salt: no estimate here: {why['en']} (salinity is never measured by satellite).",
                            f"Mặn: chưa có ước tính ở đây: {why['vi']} (độ mặn không đo bằng vệ tinh)."))


def kttv_salinity(db, lat, lon):
    """(typical, El Niño) salinity of a province point from its nearest KTTV station (site_salinity's dict shape plus station,
    km, partial and caveat), or None when that station is over SALT_KM away or has no dry season in one of the views."""
    name, km = nearest_station(db, lat, lon)
    if km > SALT_KM:
        return None
    km = round(km, 1)
    views = station_views(db, name)
    rec = {**views[0], **views[1]}
    if not all(views):  # e.g. Rạch Giá: bulletins only in 2024, so no typical season to compare with
        return None
    at = line(f"Nearest KTTV salinity station: {name}, {km_text(km)} km away (station position approximate).",
              f"Trạm đo mặn KTTV gần nhất: {name}, cách {vi_num(km_text(km))} km (vị trí trạm gần đúng).")

    def one(view, kind):
        ppt, _, ms, rule = station_view(db, name, view)
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
                    monthly=station_monthly(db, name, view))
    return one(views[0], ("typical", "năm thường")), one(views[1], ("El Niño", "năm El Niño"))


def site_salinity(db, entry):
    """(typical, El Niño) salinity for one pin of salinity.json: level from its station's average yearly peak (max_ppt),
    unless the pin states its own level (then max_ppt is None)."""
    (t, a0, a1, na), (e, b0, b1, nb) = station_salt(db, entry["station"], False), station_salt(db, entry["station"], True)
    yrs = f"{min(a0, b0)}–{max(a1, b1)}"
    note = line(f"{entry['note']['en']} Highest reading of each dry season there: {t}‰ on average in typical years, {e}‰ in El Niño years ({yrs}).",
                f"{entry['note']['vi']} Độ mặn cao nhất mỗi mùa khô tại trạm: trung bình {vi_num(t)}‰ trong năm thường, {vi_num(e)}‰ trong năm El Niño ({yrs}).")
    lb = {y: v for y, v in db["table"][entry["station"]].get("lower_bound", {}).items() if in_salt_seasons(y)}
    for y, v in sorted(lb.items()):  # a season counted as 'at least' one reading: say so, with its source
        note = {k: note[k] + line(f" {y}: at least {v['ppt']}‰, one reading on {v['date']} while salt was still rising, not the season's peak ({v['source']['title'].split(' (')[0]}).",
                                  f" {y}: ít nhất {vi_num(v['ppt'])}‰, một lần đo khoảng {v['date'].replace('about ', '').replace(' Apr ', '/4/')} khi mặn còn đang lên, không phải đỉnh mùa ({v['source']['title'].split(' (')[0]}).")[k] for k in ("en", "vi")}
    months = sorted(set(entry["months"]) | peak_months(db, entry["station"]))  # reported months + the station's usual peak months
    one = lambda ppt: dict(months=months, note=note, station_ppt=ppt, estimate=True, seasons=na + nb, last_year=min(max(a1, b1), full_last_year(db, entry["station"])),
                           level=entry.get("level") or salt_level(ppt), max_ppt=None if "level" in entry else ppt)
    return one(t), one(e)


def unknown_salinity():
    """Salinity of a place with no estimate in salinity.json (the province averages): level UNKNOWN, no salt months."""
    return dict(months=[], note=line("No salinity estimate for this area yet. Salinity is never measured by satellite; check local salinity reports before planting in the dry season.",
                                     "Chưa có ước tính độ mặn cho khu vực này. Độ mặn không đo bằng vệ tinh; hãy xem bản tin độ mặn địa phương trước khi xuống giống mùa khô."),
                station_ppt=None, estimate=True, seasons=0, last_year=None, level=UNKNOWN, max_ppt=None)


def salt_level(ppt):
    """Station salinity (‰) -> salinity level for the area badge."""
    return "high" if ppt >= SALT_HIGH else "medium" if ppt >= SALT_MED else "low"
