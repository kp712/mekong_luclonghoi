"""Self-checks. Run: python pipeline/test_build.py  (no pytest needed)"""
import contextlib
import csv
import io
import json
import pathlib
import re
import statistics
from datetime import date, timedelta

import appeears
import build
import fetch_gpm
import fetch_power
import fetch_salinity_vietnam
import hls
import ndvi
import ndvi_from_appeears


def test_et0_penman_monteith():
    # FAO-56 Example 18 (Brussels, 6 July): lat 50.80 N, 100 m, Tmax 21.5, Tmin 12.3, ea 1.409 kPa, u2 2.078 m/s, Rs 22.07 -> ET0 3.9 mm/day
    rh = 1.409 / ((build.e0(21.5) + build.e0(12.3)) / 2) * 100
    assert abs(build.et0_penman(date(2001, 7, 6), 50.8, 21.5, 12.3, rh, 2.078, 22.07, z=100) - 3.9) < 0.05
    v = build.et0_penman(date(2024, 3, 15), 9.5, 33, 25, 75, 2.5, 21)
    assert 4 < v < 6, v  # Mekong dry season is ~4-5 mm/day


def test_ndvi_counts_three_crops():
    # fake 3-crop year pattern: green peaks every ~4 months for 4 years
    start, series = date(2020, 1, 1), {}
    for i in range(0, 4 * 365, 16):
        phase = (i % 122) / 122  # 0..1 within a crop cycle
        series[(start + timedelta(days=i)).isoformat()] = 0.15 + 0.65 * max(0, 1 - abs(phase - 0.6) * 3)
    assert 2.7 <= ndvi.crops_per_year(series) <= 3.3, ndvi.crops_per_year(series)
    assert len(ndvi.monthly_mean(series)) == 12
    assert ndvi.crops_per_year({}) == 0.0 and ndvi.crops_per_year({"2020-01-01": 0.7}) == 0.0 and appeears.rice_like({}) == (False, 0.0, 0.0, 0.0)


def test_year_to_year_ranges():
    # NDVI: Jan is 0.2 in 2020 and 0.6 in 2021 -> range 0.2..0.6; months with no data stay None
    series = {"2020-01-01": 0.2, "2020-01-17": 0.2, "2021-01-01": 0.6, "2021-01-17": 0.6}
    lo, hi = ndvi.monthly_range(series)
    assert (lo[0], hi[0]) == (0.2, 0.6) and lo[5] is None and hi[5] is None, (lo, hi)
    # bare months: each year checked on its own; Jan bare (0.2) in 1 of 2 years isn't "usually", in 2 of 3 it is
    assert ndvi.bare_months(series) == [] and ndvi.bare_months(dict(series, **{"2022-01-01": 0.2, "2022-01-17": 0.2})) == [1]
    # rain: driest <= average <= wettest, every month, real NASA POWER file
    site = build.SITES[0]
    c = build.climate(build.read_power(site["id"]), site["lat"])
    assert all(a <= m <= b for a, m, b in zip(c["rain_min_mm"], c["rain_mm"], c["rain_max_mm"])), c


def test_month_names():
    assert build.month_names([3, 4, 5, 10], "en") == "Mar–May, Oct"
    assert build.month_names([1, 2, 3, 4, 5], "vi") == "T1–T5" and build.month_names([3], "en") == "Mar"


def test_elnino_year():
    site = next(s for s in build.SITES if s["id"] == "tran_de")
    power = build.read_power("tran_de")
    assert build.ELNINO == [2002, 2004, 2006, 2009, 2014, 2015, 2018, 2019, 2023], build.ELNINO  # from NOAA's Dec-Feb index >= 0.5
    assert build.in_elnino(date(2015, 12, 1)) and build.in_elnino(date(2016, 11, 30)) and not build.in_elnino(date(2016, 12, 1))
    assert build.typical_year(date(2017, 6, 1)) and not build.typical_year(date(2016, 3, 1)) and not build.typical_year(date(2025, 3, 1))
    gpm = json.loads((build.RAW / "gpm.json").read_text(encoding="utf-8"))["tran_de"]
    typ, eln = (build.climate(power, site["lat"], keep, gpm) for keep in (build.typical_year, build.in_elnino))
    assert typ["rain_mm"] != build.climate(power, site["lat"], build.typical_year)["rain_mm"]  # rain comes from GPM, not POWER
    for ym, keep in (("2022-11", build.typical_year), ("2024-11", build.in_elnino)):
        try:
            build.climate(power, site["lat"], keep, {k: v for k, v in gpm.items() if k != ym})
            assert False, f"expected ValueError on missing GPM month {ym}"
        except ValueError as e:
            assert ym in str(e)
    # same check when every POWER day of the missing month is a fill value (-999): the month must not just vanish
    filled = json.loads(json.dumps(power))
    for d in filled["parameter"]["T2M_MAX"]:
        if d.startswith("202211"):
            filled["parameter"]["T2M_MAX"][d] = -999
    try:
        build.climate(filled, site["lat"], build.typical_year, {k: v for k, v in gpm.items() if k != "2022-11"})
        assert False, "expected ValueError on missing GPM month 2022-11 with POWER fill days"
    except ValueError as e:
        assert "2022-11" in str(e)
    assert len(build.climate(filled, site["lat"], build.typical_year)["rain_mm"]) == 12  # gpm=None: POWER-only helper still works
    ws = lambda c: build.winter_spring(c)[0]
    assert ws(typ) < ws(build.climate(power, site["lat"], None, gpm)) < ws(eln)  # typical leaves the El Niño seasons out
    nd = json.loads((build.RAW / "ndvi_tran_de.json").read_text(encoding="utf-8"))
    assert ndvi.monthly_mean(nd, build.in_elnino) != ndvi.monthly_mean(nd, build.typical_year)  # greenness splits by season too
    assert all(len(eln[k]) == 12 for k in eln)
    assert all(a <= m <= b for a, m, b in zip(eln["rain_min_mm"], eln["rain_mm"], eln["rain_max_mm"])), eln
    rot = next(r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"] if r["id"] == "rice2")  # rice3 water is already at the floor (1)
    sal = {"level": "high", "months": [2], "station_ppt": 15.0, "max_ppt": 15.0, "seasons": 9, "last_year": 2024}
    a, b = build.make_card(rot, typ, None, sal), build.make_card(rot, eln, None, sal, elnino=True)
    assert b["scores"]["water"] <= a["scores"]["water"], (a["scores"], b["scores"])  # 2 rice at Trần Đề: the drier El Niño year saves no more water (dots: test_score_rules)
    assert any("El Niño average" in w["en"] for w in b["why"]), b["why"]  # shortfall reason names the El Niño average


def test_appeears_parse():
    rows = ["ID,Latitude,Longitude,Date,MOD13Q1_061__250m_16_days_NDVI",
            "vinh_chau,9.35,105.93,2020-01-01,0.6543",   # already scaled
            "vinh_chau,9.35,105.93,2020-01-17,6543",     # raw integer
            "vinh_chau,9.35,105.93,2020-02-02,-3000",    # fill value
            "vinhchau,9.35,105.93,2020-02-18,0.5",       # AppEEARS dropped the underscore
            "nowhere,9.0,105.0,2020-01-01,0.5"]          # unknown ID: skipped
    assert ndvi_from_appeears.parse(rows) == {"vinh_chau": {"2020-01-01": 0.6543, "2020-01-17": 0.6543, "2020-02-18": 0.5}}


def test_appeears_pin_finder():
    raw = build.RAW
    rice = json.loads((raw / "ndvi_nga_nam.json").read_text(encoding="utf-8"))      # 2.9 crops/yr
    not_rice = {d: 0.3 for d in rice}  # flat, never green (like a shrimp pond)
    assert appeears.rice_like(rice)[0] and not appeears.rice_like(not_rice)[0]
    site = next(s for s in appeears.SITES if s["id"] == "vinh_chau")
    pts = appeears.grid(site)
    assert len({p["id"] for p in pts}) == 49 and all(p["id"].isalnum() for p in pts)
    text = appeears.move_pin_text('{"id": "vinh_chau", "lat": 9.35, "lon": 105.93,', "vinh_chau", 9.38, 105.9)
    assert text == '{"id": "vinh_chau", "lat": 9.38, "lon": 105.9,'
    # whole find() path offline: one rice pixel 2 steps north, the rest not rice
    target = next(p for p in pts if p["id"] == "vinhchau53")
    csv_path = pathlib.Path(build.ROOT / "data" / "appeears" / "_test.csv")
    csv_path.parent.mkdir(exist_ok=True)
    lines = ["ID,Latitude,Longitude,Date,MOD13Q1_061__250m_16_days_NDVI"] + [
        f"{p['id']},{p['latitude']},{p['longitude']},{d},{v}"
        for p in pts for d, v in (rice if p is target else not_rice).items()]
    csv_path.write_text("\n".join(lines), encoding="utf-8")
    real, appeears.run_task = appeears.run_task, lambda name, coords: csv_path
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out):
            appeears.find(["vinh_chau"], apply=False)
    finally:
        appeears.run_task = real
        csv_path.unlink()
    assert "1 of 49 points look like rice" in out.getvalue(), out.getvalue()
    assert f"RICE  {target['latitude']}, {target['longitude']}" in out.getvalue()


def test_card_with_ndvi_and_low_salinity():
    rot = next(r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"] if r["id"] == "rice_shrimp")
    clim = {"rain_mm": [10] * 12, "et0_mm": [100] * 12, "hot_days": [0] * 12, "cold_days": [0] * 12, "tmean_c": [27.0] * 12}
    nd = {"crops_per_year": 2.9, "bare_months": [3]}
    c = build.make_card(rot, clim, nd, {"level": "low", "months": [3], "station_ppt": 2.0, "max_ppt": 2.0, "seasons": 9, "last_year": 2024})
    assert c["scores"]["income"] < build.make_card(rot, clim, nd, {"level": "high", "months": [3], "station_ppt": 20.0, "max_ppt": 20.0, "seasons": 9, "last_year": 2024})["scores"]["income"] and c["not_here"]
    assert c["confidence"] == "low"
    nh = [x["en"] for x in c["risks"]]
    assert f"medians of {build.profit_keys_info(rot)['rice_rs']['n']} published figures" in c["why"][-1]["en"]  # not here: shrimp figures not counted
    assert not any(" and shrimp" in x or "for shrimp" in x for x in nh)  # (rice_rs's own name has "shrimp" in it)
    ovr = build.make_card(rot, clim, nd, {"level": "low", "months": [3], "station_ppt": 10.3, "max_ppt": None, "seasons": 9, "last_year": 2024})
    why = next(w for w in ovr["why"] if w["en"].startswith("Weather & salt"))
    assert "rated low" in why["en"] and "mức thấp" in why["vi"] and "10,3" in why["vi"]
    assert "rated low" not in next(w for w in c["why"] if w["en"].startswith("Weather & salt"))["en"]


def test_soilgrids_topsoil():
    def layer(name, d_factor, top, sub):  # SoilGrids stores integers: clay g/kg, soc dg/kg, pH x10
        return {"name": name, "unit_measure": {"d_factor": d_factor},
                "depths": [{"range": {"top_depth": 0, "bottom_depth": 5}, "values": {"mean": top}},
                           {"range": {"top_depth": 5, "bottom_depth": 15}, "values": {"mean": sub}}]}
    raw = {"layers": [layer("clay", 10, 400, 430), layer("soc", 10, 300, 150), layer("phh2o", 10, 50, 47)]}
    assert build.topsoil(raw) == {"clay_pct": 42.0, "soc_g_kg": 20.0, "ph": 4.8}  # 5 cm + 10 cm weighted
    raw["layers"][1]["depths"][0]["values"]["mean"] = None  # water/town pixel
    assert build.topsoil(raw) is None


def test_score_rules():
    rots = {r["id"]: r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]}
    clim = lambda et0: {"rain_mm": [0] * 12, "et0_mm": [et0] * 12, "hot_days": [0] * 12, "cold_days": [0] * 12, "tmean_c": [27.0] * 12}  # Dec-Apr need = 5 x 1.1 x et0
    assert build.effective_rain(100) == 55 and build.effective_rain(50) == 20 and build.effective_rain(10) == 0  # FAO Manual 3
    # FAO Manual 3 section 4.4 worked example (April): ET0 180 mm, Kc 1.1, seepage 150 mm, water layer 100 mm, effective rain 135 mm -> 313 mm
    assert build.month_need(180, 1.1, 200, perc=150, wl=100) == 313
    assert sum(build.water_need(["-"] * 6 + ["S"] * 6, clim(100))) == 0 and sum(build.water_need(["-"] * 12, clim(100))) == 0  # rest and shrimp months take no canal water
    med = {"level": "medium", "months": [3], "station_ppt": 8.0, "max_ppt": 8.0, "seasons": 9, "last_year": 2024}
    st = rots["salt_tolerant"]
    for k, r in rots.items():  # savings 0, 19, 59, 27, 19%
        c = build.make_card(r, clim(100), None, med)
        assert c["scores"]["water"] == build.score_water(c["water_saved"]), k
    assert build.make_card(rots["rice3"], clim(100), None, med)["scores"]["water"] == 1.0
    bare = lambda months: {"crops_per_year": 2.0, "bare_months": months}  # fields bare in Feb-Apr -> more confidence
    assert build.make_card(st, clim(0), bare([3]), med)["confidence"] == "high"
    assert any("MODIS" in w["en"] for w in build.make_card(st, clim(0), bare([3]), med)["why"])  # bare window named as a reason
    lv = lambda nd: build.LEVELS.index(build.make_card(st, clim(0), nd, med)["confidence"])
    assert lv(bare([3])) == min(lv(bare([10])) + 1, 2)   # the bare Feb-Apr window raises confidence one level


def test_confidence():
    rots = {r["id"]: r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]}
    good = {"months": [3], "station_ppt": 10.0, "max_ppt": 10.0, "level": "medium", "seasons": 9, "last_year": 2024}
    nd = {"crops_per_year": 2.0, "bare_months": [3]}
    L = build.LEVELS
    def lvl(r, nd=nd, sal=good, nh=False, el=False):
        return build.confidence(rots[r], nd, sal, nh, el)[0]
    # every card with a rest month carries the pest break-credit team estimate (one level); rice3's autumn–winter rice has only fallback figures
    assert lvl("rice2") == "medium" and lvl("rice3") == "low"
    assert lvl("rice2", None) == "low" and lvl("rice2", sal=dict(good, last_year=2022)) == "low"   # no MODIS; Khanh Hoa-style gap
    assert lvl("rice2", sal=dict(good, seasons=4)) == "low"
    assert lvl("rice_shrimp", nh=True) == "low"                       # fallback income + not here
    assert L.index(lvl("salt_tolerant")) > L.index(lvl("salt_tolerant", dict(nd, bare_months=[10])))  # MODIS bare-window bonus
    assert lvl("salt_tolerant", dict(nd, bare_months=[10], hls_bare_months=[4])) == lvl("salt_tolerant")  # bare in HLS only counts too
    assert lvl("rice_upland", dict(nd, bare_months=[10])) == "low"                                 # autumn–winter rice income rests on fallbacks
    assert lvl("rice_upland") == "medium"                             # thin income caps at medium, even with the bare-window bonus
    # team estimates cost one level in total, and a loss estimate counts only where it applies
    why = lambda r, el, sal=good: [w["en"] for w in build.confidence(rots[r], nd, sal, False, el)[1] if w["en"].startswith("Uses team estimates")]
    assert why("rice2", True) == ["Uses team estimates: soil score weights and dry-break months; break credit for pests."]   # no El Niño loss share on rice2
    w = why("salt_tolerant", True, dict(good, months=[1]))
    assert len(w) == 1 and "salt-tolerant rice" in w[0] and "crop-loss share" in w[0] and "salt left" not in w[0]
    assert "crop-loss share" not in why("salt_tolerant", True, good)[0]   # good: salt in March, no tolerant-rice month
    assert "salt left by the shrimp phase" in why("rice_shrimp", False)[0]
    _, rs = build.confidence(rots["rice2"], None, good, False)
    assert rs and all(x["en"] and x["vi"] for x in rs)
    allr = build.confidence(rots["rice_upland"], None, dict(good, seasons=3), True)[1] + build.confidence(rots["rice_shrimp"], None, good, True, True)[1]
    assert all(" and " not in x["vi"] for x in allr)                     # Vietnamese reasons use "và"
    assert [x["en"] for x in build.confidence(rots["rice_shrimp"], nd, good, True)[1]].count("Inland freshwater area: brackish water is not normally available here.") == 1
    site = build.make_card(rots["rice3"], {"rain_mm": [0] * 12, "et0_mm": [100] * 12, "hot_days": [0] * 12, "cold_days": [0] * 12, "tmean_c": [27.0] * 12}, None, good)
    assert site["scores"]["pests"] is not None and any("break credit for pests" in r["en"] for r in site["risks"])
    assert all(1 <= v <= 5 for v in site["scores"].values())          # no NDVI still scores


def test_soil_score():
    rots = {r["id"]: r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]}
    assert {k: build.score_soil(r)[0] for k, r in rots.items()} == {
        "rice3": 1.3, "rice2": 2.0, "rice_shrimp": 1.4, "rice_upland": 3.9, "salt_tolerant": 2.8}
    assert build.score_soil(dict(rots["rice_upland"], legume_codes=[]))[0] == 2.1      # maize / watermelon variant
    assert build.score_soil(dict(rots["rice3"], months=["R1"] * 12))[0] == 1.0         # rice all year: floor
    assert build.score_soil(dict(rots["rice3"], months=["-"] * 12))[0] == 2.4          # bare all year: dry break + no rice, no legume
    assert build.score_soil(dict(rots["rice2"], months=[*rots["rice2"]["months"][:7], "S", "S", "S", "-", "-"]))[0] < build.score_soil(rots["rice2"])[0]  # shrimp costs soil points
    assert build.score_soil(rots["rice_upland"])[1] == dict(rest=2, nonrice=3, legume=3, cover=False, brackish=False, dry=5, rice=7)
    assert abs(sum(build.SOIL_W.values()) - 1) < 1e-9                                  # gain stays 0-1, so the score uses the 1-5 scale
    scores = [build.score_soil(r)[0] for r in rots.values()]
    assert len(set(scores)) == len(scores)                                              # every rotation gets its own soil score


def test_pests_score():
    rots = {r["id"]: r for r in build.ROTATIONS}
    flat = dict(tmean_c=[27.0] * 12, hot_days=[0.0] * 12, cold_days=[0.0] * 12)
    assert build.rice_pressure(27.0) == 1 and build.rice_pressure(32.5) == 0.5 and build.rice_pressure(20.0) == 0 and build.rice_pressure(36) == 0
    got = {k: build.score_pests(r, flat)[0] for k, r in rots.items()}
    assert got == {"rice3": 1.8, "rice2": 3.0, "rice_shrimp": 3.3, "rice_upland": 2.8, "salt_tolerant": 3.0}, got
    assert build.score_pests(dict(rots["rice3"], months=["-"] * 12), flat)[0] == 5.0
    hot = dict(flat, hot_days=[31.0] * 12)                       # every shrimp day risky -> shrimp months count 1
    assert build.score_pests(rots["rice_shrimp"], hot)[0] < got["rice_shrimp"]
    el = dict(flat, tmean_c=[33.0] * 12)                         # hotter (El Nino-like) months lower rice pressure
    assert build.score_pests(rots["rice3"], el)[0] > got["rice3"]


def test_income_score():
    assert [build.score_income(p, 3) for p in (3, 6, 1.5, 2, 12)] == [3.0, 5.0, 1.0, 1.8, 5.0]
    rots = {r["id"]: r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]}
    sal = {"months": [2, 3], "station_ppt": 20.0, "max_ppt": 20.0, "seasons": 9, "last_year": 2024, "level": "high"}
    p3 = build.yearly_profit(rots["rice3"], sal, False, False)
    assert p3 == round(sum(build.median_profit(k) for k in ("rice_ws", "rice_sa", "rice_aw")), 1)   # no typical loss on rice
    assert build.yearly_profit(rots["rice_shrimp"], sal, False, True) < build.yearly_profit(rots["rice_shrimp"], sal, False, False)  # not here: no shrimp
    assert build.yearly_profit(rots["rice3"], sal, True, False) < p3   # El Niño salt damage on rice in salt months
    assert build.yearly_profit(rots["rice_shrimp"], sal, True, False) <= build.yearly_profit(rots["rice_shrimp"], sal, False, False)  # typical losses (shrimp disease) also hit El Niño years


def test_profit_figures():
    pf = json.loads((build.HERE / "profits.json").read_text(encoding="utf-8"))
    rots = {r["id"]: r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]}
    keys = {k for r in rots.values() for k in list(r["profit"].values()) + r.get("upland_crops", [])}
    assert keys - {"mungbean"} <= {f["key"] for f in pf["figures"]}, "every crop key but mung bean needs at least one figure"
    assert not [f for f in pf["figures"] if f["key"] == "mungbean"] and build.median_profit("mungbean") is None  # no checked figure yet
    for f in pf["figures"]:
        assert f["unit"] in ("crop", "year") and f["value"] > 0 and f["source"]["verified"] and f["source"]["url"], f
        assert f["fallback"] or (2020 <= f["year"] <= 2025 and f["kind"] not in ("farmer", "news")), f
    assert all(0 <= l["share"] < 1 and l["source"]["url"] and isinstance(l["estimate"], bool) for l in pf["loss"])
    up = lambda k: dict(rots["rice_upland"], profit=dict(rots["rice_upland"]["profit"], U=k))
    info = {**build.profit_keys_info(rots["rice3"]), **build.profit_keys_info(up("watermelon")), **build.profit_keys_info(up("maize"))}
    assert (info["rice_ws"]["q"], info["rice_ws"]["fallback"], info["rice_ws"]["n"]) == (4, False, 4)   # 2 news fallbacks left out of the median
    assert (info["watermelon"]["q"], info["watermelon"]["n"]) == (1, 5) and build.median_profit("watermelon") == 100  # 1 survey figure + 4 fallbacks
    assert (info["maize"]["q"], info["maize"]["n"]) == (1, 1) and build.median_profit("maize") == 100
    assert build.yearly_profit(up("mungbean"), {"months": []}, False, False) is None and build.score_income(None, 95) is None
    assert info["rice_aw"]["fallback"]                                   # autumn–winter rice still thin: keeps the upland card capped
    assert build.median_profit("rice_ws") == statistics.median(f["value"] for f in pf["figures"] if f["key"] == "rice_ws" and not f["fallback"])


def test_water_score():
    assert [build.score_water(x) for x in (0, 0.1, 0.25, 0.5, 0.83, 1.0, 1.2)] == [1.0, 1.4, 2.0, 3.0, 4.3, 5.0, 5.0]


def test_rotation_calendars():
    rots = json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]
    for r in rots:
        assert len(r["months"]) == 12 and set(r["months"]) <= {"R1", "R2", "R3", "U", "S", "-"}, r["id"]
        assert r["calendar_sources"] and all(s["url"] for s in r["calendar_sources"]), r["id"]
    cal = {r["id"]: "".join(r["months"]) for r in rots}
    assert cal["rice3"].count("R") > cal["rice2"].count("R") and "S" in cal["rice_shrimp"] and "U" in cal["rice_upland"]
    assert [len(idx) for code, idx in build.crops(build.BASE)] == [1, 4, 3, 4]  # 3 rice: rest Mar, Apr-Jul, Aug-Oct, Nov-Feb


def test_clay_note():
    rot = next(r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"] if r["id"] == "rice_upland")
    clim = {"rain_mm": [0] * 12, "et0_mm": [100] * 12, "hot_days": [0] * 12, "cold_days": [0] * 12, "tmean_c": [27.0] * 12}
    med = {"level": "medium", "months": [3], "station_ppt": 8.0, "max_ppt": 8.0, "seasons": 9, "last_year": 2024}
    c = build.card(rot, clim, None, med, soil={"clay_pct": 40.6})
    gaps = [g["en"] for g in c["variants"][c["crop_default"]]["gaps"]]
    assert any(g.startswith("Topsoil here is ≈ 40.6% clay (SoilGrids") for g in gaps) and not any("Soil drainage" in g for g in gaps)
    assert not any(g.startswith("Borderline") for g in gaps)  # no cut-offs left, so no borderline notes


def test_weather_salt():
    rots = {r["id"]: r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]}
    clim = {"rain_mm": [0] * 12, "et0_mm": [100] * 12, "hot_days": [0, 0, 0, 15] + [0] * 8, "cold_days": [0] * 12, "tmean_c": [27.0] * 12}
    sal = {"months": [1, 2], "station_ppt": 15.0, "max_ppt": 15.0, "seasons": 9, "last_year": 2024, "level": "high"}
    ws = lambda r, s=sal: build.score_weather_salt(rots[r], clim, s)
    assert ws("rice2")[1]["parts"] == {"salt": 1.0, "heat": 3.0, "canal": 1.0} and ws("rice2")[0] == 1.4   # Jan-Feb rice, 15 hot days in Apr (R2)
    assert ws("rice_shrimp")[0] == 5.0                                                                     # shrimp/rest: no salt, heat or canal risk
    st = ws("salt_tolerant")[1]["parts"]
    assert st["salt"] == round(1 + 4 * (1 - (build.TOL + 0) / 2), 1)                                       # Jan tolerant rice, Feb rest
    low = dict(sal, max_ppt=None, level="low")                                                             # Ngã Năm-style override
    assert ws("rice2", low)[1]["parts"]["salt"] == round(1 + 4 * (1 - 4 / 15), 1)
    wet = dict(clim, rain_mm=[0, 0, 2000] + [0] * 9)                                                       # March rain covers 3 rice's soaking -> base 0
    assert build.score_weather_salt(rots["rice2"], wet, dict(sal, months=[3]))[1]["parts"]["canal"] == 5.0
    card_ws = build.make_card(rots["rice2"], clim, None, sal)["why"][1]
    assert "days at or above 35 °C" in card_ws["en"] and "ngày từ 35 °C trở lên" in card_ws["vi"]
    assert "reaches or exceeds 35 °C" in build.HEAT_SRC["note"]
    assert build.score_weather_salt(rots["rice2"], clim, dict(sal, months=[]))[1]["parts"]["salt"] == 5.0
    assert build.make_card(rots["rice2"], dict(clim, rain_mm=[2000] * 12), None, sal)["water_saved"] == 0


def test_salinity_station_data():
    sal = json.loads((build.HERE / "salinity.json").read_text(encoding="utf-8"))["sites"]
    assert [k for k, s in sal.items() if "level" in s] == ["nga_nam"]  # the one stated exception to the station rule
    typ, eln = build.site_salinity(sal["nga_nam"])
    assert typ["level"] == eln["level"] == "low" and typ["max_ppt"] is None and typ["station_ppt"] > 4  # override: severity 4/15
    typ, eln = build.site_salinity(sal["long_phu"])
    assert typ["level"] == build.salt_level(typ["max_ppt"]) and "‰" in typ["note"]["en"] and "," in typ["note"]["vi"]
    assert build.site_salinity(sal["my_xuyen"])[0]["months"] == [2, 3, 4, 5]  # Thạnh Phú peaked in May in 4 of 9 recent seasons
    assert typ["seasons"] >= 5 and typ["last_year"] >= 2023  # confidence station rule reads these
    st = json.loads((build.RAW / "salinity_stations.json").read_text(encoding="utf-8"))["stations"]
    # our typing of the paper's Table 4 must reproduce its Table 2: years, min, max, mean (‰) per station
    table2 = {"long_phu": (24, 10.1, 23.1, 16.87), "dai_ngai": (24, 5.5, 14.2, 9.53), "thanh_phu": (25, 1.5, 17.5, 9.66),
              "tran_de": (27, 18.3, 36.8, 25.24), "an_lac_tay": (23, 0.3, 8.0, 2.88), "soc_trang": (24, 0.3, 9.5, 3.96),
              "khanh_hoa": (9, 7.3, 24.9, 14.96), "nga_nam": (12, 0.1, 23.2, 10.11)}
    for sid, (n, lo, hi, mean) in table2.items():
        xs = [v[0] for v in st[sid]["yearly_max"].values()]
        assert (len(xs), min(xs), max(xs), round(sum(xs) / len(xs), 2)) == (n, lo, hi, mean), sid
    # El Niño seasons were saltier at every pin's station over the SALT_SEASONS, except Ngã Năm (rated low by its own rule:
    # its canal read 15-17‰ in 2017-2018, typical seasons, and 2.6‰ in El Niño 2019)
    assert all(build.station_salt(s["station"], True)[0] > build.station_salt(s["station"], False)[0]
               for k, s in json.loads((build.HERE / "salinity.json").read_text(encoding="utf-8"))["sites"].items() if k != "nga_nam")
    # the national 10-day bulletins are a second, independent record: never above the paper's yearly max, equal in 9 of 10
    bul = json.loads((build.RAW / "salinity_bulletins.json").read_text(encoding="utf-8"))["bulletins"]
    same = 0
    for year in ("2024", "2025"):
        for sid in ("long_phu", "dai_ngai", "tran_de", "thanh_phu", "soc_trang"):
            top = max(b["max_ppt"][sid] for d, b in bul.items() if d[:4] == year and b["max_ppt"][sid] is not None)
            assert top <= st[sid]["yearly_max"][year][0], (year, sid)
            same += top == st[sid]["yearly_max"][year][0]
    assert same >= 9, same


def test_gpm_cross_check():
    assert fetch_gpm.cell(105.96, 9.365) == (2859, 993)        # old Vĩnh Châu pin -> cell centred 105.95 E, 9.35 N
    assert fetch_gpm.mm_per_month(0.01, 2016, 1) == 7.4        # 0.01 mm/hr x 744 hours
    text = "Dataset: x\nprecipitation[0][0], 0.5, 0.25\nprecipitation[0][1], 0, -9999.9\nlat, 9.25, 9.35"
    assert fetch_gpm.parse(text) == [[0.5, 0.25], [0.0, -9999.9]]
    assert fetch_gpm.parse(text.replace("precipitation[", "/Grid/precipitation[")) == [[0.5, 0.25], [0.0, -9999.9]]  # cloud DAP4 CSV
    days = {f"2020{m:02d}{d:02d}": float(m) for m in range(1, 13) for d in (1, 2)} | \
           {f"2021{m:02d}{d:02d}": float(13 - m) for m in range(1, 13) for d in (1, 2)}
    power = {"parameter": {"PRECTOTCORR": days}}
    same = {f"{k[:4]}-{k[4:6]}": 2 * v for k, v in days.items()}  # monthly totals (2 days each) = POWER exactly
    g = build.gpm_check(power, same)
    assert g["diff_pct"] == 0 and g["monthly_r"] == 1.0 and g["months"] == 24, g
    const = {k: 5.0 for k in same}
    for fn in (lambda: build.gpm_check(power, const),):
        try:
            fn()
            assert False, "expected StatisticsError on constant series"
        except build.statistics.StatisticsError:
            pass
    orig = getattr(build.statistics, "correlation", None)
    try:
        if orig:
            delattr(build.statistics, "correlation")
        assert build.gpm_check(power, same) == g  # Python 3.8–3.9 fallback matches statistics.correlation
        try:
            build.gpm_check(power, const)
            assert False, "expected StatisticsError on constant series in fallback"
        except build.statistics.StatisticsError:
            pass
    finally:
        if orig:
            build.statistics.correlation = orig
    assert build.gpm_check(power, dict(list(same.items())[:10])) is None   # too few months to compare


def test_noaa_outlook():
    page = """<td>issued by<br>CLIMATE PREDICTION CENTER/NCEP/NWS<br></td><td> 8 October 2026 </td>
<strong>ENSO Alert System Status: </font><span style="color:red">El Ni&ntilde;o Advisory</span></strong>
<u>Synopsis:</u>&nbsp;<strong>El Ni&ntilde;o continues to strengthen, with a strong-to-very strong El Ni&ntilde;o likely
 through January-March 2027 (remaining greater than an 83&#37; chance).</strong> El Niño strengthened further."""
    o = dict(fetch_power.parse_enso(page), url="u")
    assert o["issued"] == "2026-10-08" and o["status"] == "El Niño Advisory" and o["synopsis"].endswith("83% chance)."), o
    out = build.outlook(o)
    assert "Fetched" not in out["source"]["note"], out["source"]["note"]
    assert out["elnino"] and out["text"]["en"] == "NOAA forecast (8 Oct 2026): over 83% chance of a strong-to-very strong El Niño through Jan–Mar 2027."
    assert out["text"]["vi"] == "Dự báo của NOAA (8/10/2026): khả năng có El Niño mạnh đến rất mạnh kéo dài đến tháng 1–3/2027 là trên 83%."
    assert out["source"]["verified"] and o["synopsis"] in out["source"]["note"]  # NOAA's own words are the quote
    new = build.outlook(dict(o, status="Final El Niño Advisory", synopsis="ENSO-neutral is favored."))  # new wording: status-only line
    assert not new["elnino"] and new["text"]["vi"].endswith("El Niño đã kết thúc."), new
    assert build.outlook(dict(o, status="El Niño Watch"))["elnino"]


def test_sites_json_contract():
    build.build()
    d = json.loads(build.OUT.read_text(encoding="utf-8"))
    unverified = set()
    for s in d["sites"]:
        assert len(s["climate"]["rain_mm"]) == 12
        assert s["salinity"]["estimate"] is True  # salinity is never presented as measured
        ids = [c["id"] for c in s["cards"]]
        assert {"rice3", "rice2"} <= set(ids) and len([c for c in s["cards"] if c["kind"] == "alt"]) >= 3, ids
        assert len(s["elnino"]["climate"]["rain_mm"]) == 12
        for sc in (s["seed_check"], s["elnino"]["seed_check"]):
            assert set(sc) == {"rice", "watermelon", "maize", "mungbean"} and "rice_st" not in sc
            for k, v in sc.items():
                dur = build.RESOURCES[k].get("duration_days")
                assert (v is None) == (dur is None), (s["id"], k)
                if v is not None:
                    assert set(v) == {"sow_from", "sow_by", "harvest_by", "water_mm", "hot_days", "ok"}
                    if v["ok"]:
                        assert all(1 <= v[m] <= 12 for m in ("sow_from", "sow_by", "harvest_by")) and v["water_mm"] >= 0
                    else:
                        assert all(v[m] is None for m in ("sow_from", "sow_by", "harvest_by", "water_mm"))
        assert not s["ndvi"] or len(s["elnino"]["ndvi"]["monthly"]) == 12
        h = s["hls_check"]  # None until data/raw/hls_<id>.json exists (python pipeline/appeears.py hls)
        if h is not None:
            assert set(h) == {"bare_months", "unknown_months", "modis_bare_months", "clear_dates_per_month", "years_covered_per_month",
                              "peak", "low", "rice_like"}
            assert h["rice_like"], f"{s['id']} is not rice at 30 m (HLS peak {h['peak']}, low {h['low']}); run appeears.py find-hls {s['id']}"
            assert all(1 <= m <= 12 for m in h["bare_months"] + h["unknown_months"]) and not set(h["bare_months"]) & set(h["unknown_months"])
            assert len(h["years_covered_per_month"]) == 12 and all(0 <= n <= 10 for n in h["years_covered_per_month"])
            assert h["modis_bare_months"] == (s["ndvi"]["bare_months"] if s["ndvi"] else [])
        if s["gpm_check"]:
            assert -100 < s["gpm_check"]["diff_pct"] < 100 and -1 <= s["gpm_check"]["monthly_r"] <= 1
        for sm in (s["summary"], s["elnino"]["summary"]):
            assert all(x["en"] and x["vi"] for x in sm) and "NASA POWER" in sm[0]["en"]
            assert [x for x in sm if x.get("salt")] == [sm[1]] and "estimate" in sm[1]["en"] and "ước tính" in sm[1]["vi"]  # salinity always labelled
            for x in sm:  # Simple view: `plain` drops the source bracket only (#60)
                assert x["plain"]["en"] and x["plain"]["vi"] and x["plain"]["en"].endswith(".") and x["plain"]["vi"].endswith("."), x
                assert not [w for w in ("GPM", "POWER", "MODIS", "FAO", "ET₀", "Penman", "El Niño average") if w in x["plain"]["en"] + x["plain"]["vi"]], x
                assert x["src"] and set(x["plain"]) == {"en", "vi"} and "src" not in x["plain"]  # the line's `src` serves both texts
            assert len(sm[0]["plain"]["en"]) < len(sm[0]["en"]) and len(sm[0]["plain"]["vi"]) < len(sm[0]["vi"])
            salt = sm[1]  # the salt line keeps its estimate label (claude-pro2's condition on #57)
            assert "estimate" in salt["plain"]["en"] and "ước tính" in salt["plain"]["vi"]
        assert "El Niño" in s["elnino"]["summary"][0]["en"]
        for c in s["cards"] + s["elnino"]["cards"]:  # the upland card: one variant per crop, the default one a crop grown here
            if "variants" in c:
                assert set(c["variants"]) == {"watermelon", "maize", "mungbean"} and c["variants"][c["crop_default"]]["offered"], c
                assert any("rice land" in x["en"] for v in c["variants"].values() for x in v["why"] + v["gaps"]), s["id"]  # every area says what reports show
                assert c["variants"]["mungbean"]["scores"]["soil"] > c["variants"]["maize"]["scores"]["soil"]  # legume credit
                salty = s["salinity"]["level"] in ("medium", "high") and {1, 2, 12} & set(s["salinity"]["months"])
                assert bool(salty) == any("stored fresh water" in r["en"] for r in c["variants"]["maize"]["risks"]), s["id"]
        for c in flat(s):
            assert all(1 <= v <= 5 for v in c["scores"].values() if v is not None), c["scores"]
            assert c["scores"]["pests"] is not None and any(x["en"].startswith("Pests ") for x in c["why"]), c["id"]
            soil = next(x["en"] for x in c["why"] if x["en"].startswith("Soil "))
            assert soil.split(":")[0].split()[1] == f"{c['scores']['soil']:.1f}", soil  # always one decimal, e.g. "Soil 1.0"
            if c["id"] == "rice_upland":  # the crop's named pest, once
                assert sum("in every month it is in the field" in x["en"] for x in c["risks"]) == 1
            assert c["scores"]["income"] is not None or c["crop"] == "mungbean", c["id"]  # only mung bean has no figure
            for k in ("why", "benefits", "gaps", "risks", "src", "cal_src"):
                assert c[k], (s["id"], c["id"], k)
            assert all(x["en"] and x["vi"] for k in ("why", "benefits", "gaps", "risks") for x in c[k])
    assert d["pest_rule"] == {"rice_points": build.PESTS["rice"]["points"], "break_weight": 0.5, "shrimp_floor": 0.5, "cold_drop_c": 4.2, "hot_c": 35, "upland_pressure": 1}
    for s in d["sites"]:
        if s["id"] == "my_xuyen":
            pe = lambda v: next(c for c in v["cards"] if c["id"] == "rice3")["scores"]["pests"]
            assert pe(s["elnino"]) >= pe(s)  # El Niño months are hotter: less planthopper pressure
    assert d["outlook"]["text"]["en"].startswith("NOAA") and d["outlook"]["text"]["vi"]
    # Wikipedia-style sources: one numbered list; every "src" points into it; every input source is in it exactly once
    S = d["sources"]
    titles = [x["title"] for x in S]
    assert len(titles) == len(set(titles)) and all(x["title"] and "note" not in x for x in S)
    assert S[d["outlook"]["src"][0]]["title"] == build.OUTLOOK["source"]["title"] and S[d["elnino_src"][0]]["title"] == build.ONI_SRC["title"]
    refs = [i for m in re.finditer(r'"(?:src|cal_src|chart_src|salt_src|soil_src|elnino_src)": \[([^\]]*)\]', build.OUT.read_text(encoding="utf-8")) for i in json.loads("[" + m.group(1) + "]")]
    assert refs and all(0 <= i < len(S) for i in refs) and set(refs) == set(range(len(S))), "every source cited, every citation real"
    rot_file = json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))
    inputs = [x for r in rot_file["rotations"] for x in r["sources"] + r["calendar_sources"]] + [x for r in rot_file["rotations"] for v in r.get("local", {}).values() for x in v["sources"]] + [x for h in rot_file["soil_help"] for x in h["sources"]] \
        + [x for r in build.RESOURCES.values() for x in r["sources"]] + build.SALINITY["sources"] + [build.PESTS["rice"]["source"]] + build.PESTS["shrimp"]["sources"] + [v["source"] for v in build.PESTS["upland"].values()] \
        + [build.POWER_SRC, build.GPM_SRC, build.MODIS_SRC, build.HEAT_SRC, build.SOIL_SRC, build.ONI_SRC, build.OUTLOOK["source"], build.FAO29_SRC, build.FAO48_SRC]
    assert {x["title"] for x in inputs} <= set(titles), {x["title"] for x in inputs} - set(titles)
    assert "url" not in json.dumps(d["sites"]) and "data_sources" not in d   # no source lists left anywhere else
    unverified |= {x["title"] for x in S if not x["verified"]}
    vi_texts = re.findall(r'"vi": "((?:[^"\\]|\\.)*)"', build.OUT.read_text(encoding="utf-8"))
    assert vi_texts and not [v for v in vi_texts if re.search(r"\d\.\d(?!\d\d(?!\d))", v)], "Vietnamese text must use decimal commas (3,0 not 3.0); 1.000 is a thousands dot"
    rot_ids = {c["id"] for c in d["sites"][0]["cards"]}
    for h in d["soil_help"]:  # soil-health explainers: bilingual, tied to real cards, every claim sourced
        assert all(h[k]["en"] and h[k]["vi"] for k in ("title", "text")) and set(h["applies"]) <= rot_ids, h
        assert h["src"], h["title"]
    assert len(d["soil_help"]) >= 4, "brief asks about nitrogen-fixing, cover, deep-rooting and drought-tolerant crops"
    res = d["resources"]  # per-crop inputs for the 12-month plan: bilingual, and every figure backed by a quoted source
    assert set(res) == {"rice", "rice_st", "mungbean", "watermelon", "maize", "shrimp"}, set(res)
    for k, r in res.items():
        assert r["name"]["en"] and r["name"]["vi"], k
        for f in ("seed", "fertiliser"):
            assert r[f] is None or (r[f]["en"] and r[f]["vi"]), (k, f)
        assert all(x["en"] and x["vi"] for x in r["steps"]), k
        assert "scope" not in r or (r["scope"]["en"] and r["scope"]["vi"]), k   # figures from outside the Delta are labelled
        if r["seed"] or r["fertiliser"] or r["steps"]:
            assert r["src"] and all(src["url"] and "'" in src["note"] for src in build.RESOURCES[k]["sources"]), k
    for s in d["sites"]:
        for c in flat(s):
            assert {m for m in c["months"] if m != "-"} == set(c["plan"]), (s["id"], c["id"])
            assert all(p["name"]["en"] and p["name"]["vi"] and p["res"] and set(p["res"]) <= set(res) for p in c["plan"].values()), c["id"]
    if unverified:
        print(f"WARNING: {len(unverified)} sources still unverified:\n  - " + "\n  - ".join(sorted(unverified)))


def flat(s):
    """A site's cards in both views, each upland variant as its own card."""
    return [v for c in s["cards"] + s["elnino"]["cards"] for v in (c["variants"].values() if "variants" in c else [c])]


def test_seed_check():
    clim = {"rain_mm": [0] * 12, "et0_mm": [100] * 12, "hot_days": [2] * 12}
    # hot days are summed over the months of the chosen sowing window (Jan-Feb here: 2 + 2)
    assert build.seed_check_one("mungbean", [55, 59], clim, {"months": [3]})["hot_days"] == 4.0
    # missing duration_days -> None
    assert build.seed_check_one("watermelon", None, clim, {"months": [3]}) is None
    # March-salt boundary: from Jan (s = 1), 59 days (31 + 28) stays in Jan-Feb [1, 2]; 60 days reaches March [1, 2, 3]
    assert build.seed_window(1, 59) == [1, 2] and build.seed_window(1, 60) == [1, 2, 3]
    s59 = build.seed_check_one("mungbean", [55, 59], clim, {"months": [3]})
    s60 = build.seed_check_one("mungbean", [55, 60], clim, {"months": [3]})
    assert s59["sow_from"] == 4 and s59["sow_by"] == 1 and s59["harvest_by"] == 2 and s59["ok"] is True
    assert s60["sow_from"] == 4 and s60["sow_by"] == 12 and s60["harvest_by"] == 1 and s60["ok"] is True
    # Vĩnh Châu (salt Jan-May = [1..5]): a 95-105 day crop (max 105) is safe Jun-Sep (sow_by = 9 -> Sep-Dec [9, 10, 11, 12], 122 days); Oct overlaps Jan
    vc = {"months": [1, 2, 3, 4, 5]}
    assert build.seed_window(9, 105) == [9, 10, 11, 12] and 1 in build.seed_window(10, 105)
    r_vc = build.seed_check_one("rice", [95, 105], clim, vc)
    assert r_vc == {"sow_from": 6, "sow_by": 9, "harvest_by": 12,
                    "water_mm": sum(build.water_need(["-"] * 8 + ["R1"] * 4, clim)), "hot_days": 8.0, "ok": True}  # Sep-Dec: 4 x 2
    # no safe window -> ok = False and all other fields None
    none_ok = build.seed_check_one("rice", [90, 100], clim, {"months": list(range(1, 11))})
    assert none_ok == {"sow_from": None, "sow_by": None, "harvest_by": None, "water_mm": None, "ok": False}
    # split salt months (e.g. [3, 9] with [90, 100] days) must return one contiguous safe run, and every advertised start in sow_from..sow_by (including Dec->Jan wrap) must have zero salt overlap
    span = lambda a, b: [a] if a == b else [(a - 1 + k) % 12 + 1 for k in range((b - a) % 12 + 1)]
    split = build.seed_check_one("rice", [90, 100], clim, {"months": [3, 9]})
    assert split["ok"] is True and (split["sow_from"], split["sow_by"]) in ((4, 5), (10, 11)), split
    for r, sal_m in ((s59, [3]), (s60, [3]), (r_vc, [1, 2, 3, 4, 5]), (split, [3, 9])):
        for s in span(r["sow_from"], r["sow_by"]):
            assert not (set(build.seed_window(s, 59 if r is s59 else 60 if r is s60 else 105 if r is r_vc else 100)) & set(sal_m)), (s, r)


def test_score_labels():
    strs = (build.ROOT / "docs" / "app" / "strings.js").read_text(encoding="utf-8")
    assert 'salt: "Weather & salt"' in strs and 'salt: "Thời tiết & mặn"' in strs
    assert 'w_salt: "Lower weather & salt risk"' in strs and 'w_salt: "Giảm rủi ro thời tiết & mặn"' in strs
    for p in build.HERE.glob("*.py"):
        t = p.read_text(encoding="utf-8")
        assert 'if __name__ == "__main__":' not in t or 'reconfigure(encoding="utf-8")' in t, p.name
        assert p.name == "test_build.py" or "CLAUDE.md" not in t, p.name


@contextlib.contextmanager
def _raises(exc):
    try:
        yield
    except exc:
        return
    raise AssertionError(f"{exc.__name__} not raised")


def _hls_csv(rows):
    """rows: (id, date, L ndvi, L fmask, S ndvi, S fmask); '' = no reading from that sensor."""
    head = "ID,Latitude,Longitude,Date,HLSL30_VI_020_NDVI,HLSL30_020_Fmask,HLSS30_VI_020_NDVI,HLSS30_020_Fmask"
    return [head] + [f"{r[0]},9.3,105.9,{r[1]},{r[2]},{r[3]},{r[4]},{r[5]}" for r in rows]


def test_hls_clear_dates():
    parse = lambda rows: hls.parse(_hls_csv(rows), ["vinh_chau"])
    d = "2020-02-01"
    # a cloud-flagged reading (bit 1) is dropped and the flag belongs to its own point: P1 is cloudy, P0 clear
    assert parse([("vinhchauP0", d, 2000, 0, "", ""), ("vinhchauP1", d, 9000, 2, "", "")]) == {"vinh_chau": {d: 0.2}}
    # bits 2 (cloud edge) and 3 (cloud shadow) drop too; water (bit 5 = 32) is kept
    none = {"vinh_chau": {}}  # a pin with rows but no clear reading: zero coverage, not absent
    assert parse([("vinhchauP0", d, 2000, 4, "", "")]) == none and parse([("vinhchauP0", d, 2000, 8, "", "")]) == none
    assert parse([("vinhchauP0", d, 1500, 32, "", "")]) == {"vinh_chau": {d: 0.15}}
    # the mask of the other sensor does not decide: Landsat is clear even if Sentinel-2 is cloudy on that date
    assert parse([("vinhchauP0", d, 2000, 0, 7000, 2)]) == {"vinh_chau": {d: 0.2}}
    # both raw no-data codes (and the same codes already scaled) never count; a fill-only date adds no clear date
    for fill in (-19999, -9999, -1.9999, -0.9999):
        assert parse([("vinhchauP0", d, fill, 0, "", "")]) == none
    assert parse([("vinhchauP0", d, -9999, 0, -19999, 0), ("vinhchauP1", "2020-02-02", 3000, 0, "", "")]) == {"vinh_chau": {"2020-02-02": 0.3}}
    # AppEEARS's real export: scaled NDVI with the raw fill code -19999 is scaled, and the fill is no data
    assert hls.detect_encoding(["-19999.0", "0.5449"]) == "scaled" and hls.scaled_ndvi("-19999.0", "scaled") is None
    assert hls.scaled_ndvi(12000) is None and hls.scaled_ndvi("") is None and hls.scaled_ndvi(1.2, "scaled") is None  # out of -1..1, empty
    # nine points on one date are one date (median of the nine), and Landsat + Sentinel-2 the same day are one date too
    nine = [(f"vinhchauP{k}", d, 1000 * (k + 1), 0, "", "") for k in range(9)]
    assert parse(nine) == {"vinh_chau": {d: 0.5}}
    assert parse([("vinhchauP0", d, 2000, 0, 4000, 0)]) == {"vinh_chau": {d: 0.3}}
    # AppEEARS may drop underscores and change case in IDs; unknown IDs are skipped
    assert parse([("VinhChauP0", d, 2000, 0, "", ""), ("nowhereP0", d, 2000, 0, "", "")]) == {"vinh_chau": {d: 0.2}}
    # every pin gets nine points about 30 m apart, ids unique and alphanumeric
    site = next(s for s in appeears.SITES if s["id"] == "vinh_chau")
    pts = hls.points(site)
    assert len(pts) == 9 and len({p["id"] for p in pts}) == 9 and all(p["id"].isalnum() for p in pts)
    assert all(0.02 < appeears.km(site["lat"], site["lon"], p["latitude"], p["longitude"]) < 0.05 for p in pts[1:])


def test_merge_csv_joins_products():
    """AppEEARS bundles one CSV per product; merged, each (ID, Date) row has every product's columns, blanks where absent."""
    a = "ID,Date,HLSL30_020_Fmask\nvP0,2020-01-01,0\nvP0,2020-01-02,2\n"
    b = "ID,Date,HLSL30_VI_020_NDVI\nvP0,2020-01-01,5000\n"
    rows = list(csv.DictReader(io.StringIO(appeears.merge_csv([a, b]))))
    assert rows == [{"ID": "vP0", "Date": "2020-01-01", "HLSL30_020_Fmask": "0", "HLSL30_VI_020_NDVI": "5000"},
                    {"ID": "vP0", "Date": "2020-01-02", "HLSL30_020_Fmask": "2", "HLSL30_VI_020_NDVI": ""}]


def test_hls_rice_stats():
    rice = [(0.2, 1)] + [(0.3, 0)] * 4 + [(0.85, 0)] * 5   # dips and one flooded date, peaks 0.85
    pond = [(0.1, 1)] * 6 + [(0.5, 0)] * 4                  # Vinh Chau-like: low peak, mostly water
    trees = [(0.6, 0)] * 2 + [(0.8, 0)] * 8                  # dike trees: green all year, never dips
    assert hls.rice_stats(rice) == (0.85, 0.2, 0.1) and hls.rice_stats(pond) == (0.5, 0.1, 0.6) and hls.rice_stats([]) == (0.0, 0.0, 1.0)
    assert hls.is_rice(*hls.rice_stats(rice)) and not hls.is_rice(*hls.rice_stats(pond)) and not hls.is_rice(*hls.rice_stats(trees))


def test_hls_median_precision():
    """Two clear Landsat points on 1 March of each of 2015-2019 (raw 2952 and 3047, Fmask 0): the median is 0.29995, below
    ndvi.BARE (0.3), so all five years vote bare. Rounding the median to 4 decimals made it 0.3 and dropped March (gpt, #59)."""
    rows = [(f"vinhchauP{k}", f"{y}-03-01", raw, 0, "", "") for y in range(2015, 2020) for k, raw in enumerate((2952, 3047))]
    series = hls.parse(_hls_csv(rows), ["vinh_chau"])["vinh_chau"]
    assert len(series) == 5 and all(v == 0.29995 for v in series.values()), series
    r = build.hls_check(series)
    assert 3 in r["bare_months"] and r["years_covered_per_month"][2] == 5


def test_hls_encoding():
    """Raw int16 1 is 0.0001, a scaled 1 is 1.0; the encoding comes from the file (or the caller), never from the cell (gpt, #59)."""
    d = "2020-02-01"
    one = [("vinhchauP0", d, 1, 0, "", "")]
    assert hls.scaled_ndvi(1, "raw") == 0.0001 and hls.scaled_ndvi(1, "scaled") == 1.0 and hls.scaled_ndvi(-1, "scaled") == -1.0
    assert hls.parse(_hls_csv(one), ["vinh_chau"], "raw") == {"vinh_chau": {d: 0.0001}}  # bare vote
    assert hls.parse(_hls_csv(one), ["vinh_chau"], "scaled") == {"vinh_chau": {d: 1.0}}  # green vote
    with _raises(ValueError):  # a file of only 0 / 1 / -1 cannot say which encoding it is
        hls.parse(_hls_csv(one), ["vinh_chau"])
    # detected from the file: a raw file next to a 1, and a scaled file with a +1 endpoint
    assert hls.parse(_hls_csv(one + [("vinhchauP1", d, 3000, 0, "", "")]), ["vinh_chau"]) == {"vinh_chau": {d: 0.15005}}
    assert hls.parse(_hls_csv(one + [("vinhchauP1", d, 0.52, 0, "", "")]), ["vinh_chau"]) == {"vinh_chau": {d: 0.76}}
    with _raises(ValueError):  # raw and scaled values in one file
        hls.parse(_hls_csv(one + [("vinhchauP1", d, 3000, 0, "", ""), ("vinhchauP2", d, 0.52, 0, "", "")]), ["vinh_chau"])


def test_hls_refresh():
    """A successful refresh replaces what is on disk, also with zero clear dates; a failed one leaves it alone (gpt, #59)."""
    import tempfile
    ids = ["vinh_chau", "my_xuyen"]
    d = "2020-02-01"
    with tempfile.TemporaryDirectory() as tmp:
        f = pathlib.Path(tmp, "hls_vinh_chau.json")
        f.write_text(json.dumps({"2019-03-01": 0.2}), encoding="utf-8")
        ok = [("vinhchauP0", d, 2000, 2, "", ""), ("myxuyenP0", d, 2000, 0, "", "")]  # Vinh Chau cloudy only, My Xuyen clear
        hls.refresh(_hls_csv(ok), ids, tmp)
        assert json.loads(f.read_text(encoding="utf-8")) == {}  # no stale date kept: zero coverage
        assert json.loads(pathlib.Path(tmp, "hls_my_xuyen.json").read_text(encoding="utf-8")) == {d: 0.2}
        assert build.hls_check({})["unknown_months"] == list(range(1, 13))  # build reads {} as unknown everywhere
        f.write_text(json.dumps({"2019-03-01": 0.2}), encoding="utf-8")
        before = {p.name: p.read_bytes() for p in pathlib.Path(tmp).iterdir()}
        for bad in (_hls_csv(ok[:1]),  # no rows for My Xuyen: incomplete download
                    ["ID,Date,Other", "vinhchauP0,2020-02-01,1"],  # wrong columns
                    ["ID,Date,HLSL30_VI_020_NDVI,HLSS30_020_Fmask", "vinhchauP0,2020-03-01,2952,0",  # no sensor has both layers
                     "myxuyenP0,2020-03-01,2952,0"],
                    _hls_csv(ok + [("myxuyenP1", "bad-date", 2952, 0, "", "")]),  # a date build.py could not read
                    _hls_csv(ok + [("myxuyenP1", "2020-13-45", 2952, 0, "", "")]),
                    _hls_csv(ok + [("myxuyenP1", d, 3000, 0, "", ""), ("myxuyenP2", d, 0.5, 0, "", "")])):  # undecidable encoding
            with _raises(ValueError):
                hls.refresh(bad, ids, tmp)
            assert {p.name: p.read_bytes() for p in pathlib.Path(tmp).iterdir()} == before


def _hls_series(per_year, month=3):
    """per_year: {year: [values of that year's clear dates in `month`]} -> series; years are RECENT seasons 2015-2024."""
    return {f"{y}-{month:02d}-{1 + 3 * i:02d}": v for y, vs in per_year.items() for i, v in enumerate(vs)}


def test_hls_check_bare_rule():
    green, low = 0.7, 0.1
    check = lambda per_year, modis=(): build.hls_check(_hls_series(per_year), modis)
    # 4 covered years: unknown, even if all are bare; 5 covered: decided
    r = check({y: [low] for y in range(2015, 2019)})
    assert 3 in r["unknown_months"] and 3 not in r["bare_months"] and r["years_covered_per_month"][2] == 4
    assert 3 in check({y: [low] for y in range(2015, 2020)})["bare_months"]
    # strict majority: 3 bare of 5 covered is bare; 3 of 6 is not; 4 of 6 is
    five = {2015: [low], 2016: [low], 2017: [low], 2018: [green], 2019: [green]}
    assert 3 in check(five)["bare_months"]
    six = {**five, 2020: [green]}
    assert 3 not in check(six)["bare_months"] and 3 not in check(six)["unknown_months"]
    assert 3 in check({**six, 2019: [low]})["bare_months"]
    # a year-month votes once with the MEAN of its dates: three dates (0.1, 0.1, 0.8) average 0.33, not bare; pooling dates would say bare
    assert 3 not in check({y: [0.1, 0.1, 0.8] for y in range(2015, 2020)})["bare_months"]
    # no value is borrowed from a neighbouring month: Feb and Apr data never make March covered
    s = {f"{y}-{m:02d}-01": low for y in range(2015, 2021) for m in (2, 4)}
    r = build.hls_check(s, [2])
    assert r["years_covered_per_month"][2] == 0 and 3 in r["unknown_months"] and 2 in r["bare_months"] and 4 in r["bare_months"]
    assert r["modis_bare_months"] == [2]
    # clear dates per month: average over the 10 years, a year with none counts as 0; dates outside the RECENT seasons are ignored
    r = check({y: [green, green] for y in range(2015, 2020)})
    assert r["clear_dates_per_month"][2] == 1.0 and r["years_covered_per_month"][2] == 5
    assert build.hls_check({"2013-03-01": low, "2025-03-01": low})["years_covered_per_month"] == [0] * 12
    assert build.hls_check({})["unknown_months"] == list(range(1, 13))


def test_profit_range():
    """Every card with an income score carries profit_range: lowest <= median <= highest yearly profit (M ₫/ha);
    the median is the same number the income line uses, and 3 rice crops is the README baseline (≈ 95.4)."""
    d = json.loads((pathlib.Path(__file__).resolve().parents[1] / "docs/data/sites.json").read_text(encoding="utf-8"))
    def cards(view):
        for c in view["cards"]:
            yield from (c["variants"].values() if "variants" in c else [c])
    for s in d["sites"]:
        for view in (s, s["elnino"]):
            for c in cards(view):
                pr = c.get("profit_range")
                if c["scores"].get("income") is None:
                    assert pr is None, (s["id"], c["id"])
                    continue
                assert pr and pr["lo"] <= pr["mid"] <= pr["hi"] and pr["n"] >= 1, (s["id"], c["id"], pr)
    r3 = next(c for c in d["sites"][0]["cards"] if c["id"] == "rice3")
    assert r3["profit_range"]["mid"] == 95.4, r3["profit_range"]


def test_pest_sources():
    P = build.PESTS
    assert P["rice"]["points"] == [[20, 0], [25, 1], [30, 1], [35, 0]]
    assert P["shrimp"]["floor"] == 0.5 and P["shrimp"]["cold_drop_c"] == 4.2 and P["shrimp"]["hot_c"] == 35
    assert P["break_weight"] == 0.5 and set(P["upland"]) == {"watermelon", "maize", "mungbean"}
    srcs = [P["rice"]["source"], *P["shrimp"]["sources"], *(u["source"] for u in P["upland"].values())]
    assert all(s["title"] and s["url"].startswith("http") and s["note"] for s in srcs)
    assert P["rice"]["source"]["verified"]   # Horgan et al. 2020 was checked against its text
    assert all(u["pest"]["en"] and u["pest"]["vi"] for u in P["upland"].values())


def test_climate_pest_inputs():
    ks = ("PRECTOTCORR", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN")
    power = {"parameter": {k: {} for k in ks}}
    day = date(2000, 12, 1)
    while day <= date(2001, 11, 30):
        d = day.strftime("%Y%m%d")
        tmin = {date(2000, 12, 1): 10, date(2001, 1, 15): 19.5, date(2001, 1, 16): -999}.get(day, 24)
        for k, v in zip(ks, (5, 30, tmin, 80, 2, 18)):
            power["parameter"][k][d] = v
        day += timedelta(days=1)
    c = build.climate(power, 9.5)
    assert c["tmean_c"][6] == 27.0                      # July: (30 + 24) / 2
    assert c["cold_days"][0] == 1.0                     # 15 Jan only; the -999 day and its neighbour are not compared
    assert c["cold_days"][11] == 0.0                    # first record day has no previous day


def test_provinces_table():
    import sites
    # the 6 southern provinces the app covers (of 34 since 1 Jul 2025), each former province exactly once (14)
    ids = [p["id"] for p in sites.PROVINCES]
    former = [f["id"] for p in sites.PROVINCES for f in p["former"]]
    assert len(ids) == len(set(ids)) == 6 and len(former) == len(set(former)) == 14, (len(ids), len(former))
    count = {r: sum(p["region"] == r for p in sites.PROVINCES) for r in sites.REGIONS}
    assert count == {"southeast": 1, "mekong_delta": 5}, count
    for p in sites.PROVINCES:
        own = [f for f in p["former"] if f["id"] == p["id"]]
        assert len(own) == 1 and (own[0]["lat"], own[0]["lon"]) == (p["lat"], p["lon"]), p["id"]  # the pin is its own former point
        assert p["name"]["en"] and p["name"]["vi"] and all(f["name"]["en"] and f["name"]["vi"] for f in p["former"])
        assert 8 < p["lat"] < 24 and 102 < p["lon"] < 110 and all(8 < f["lat"] < 24 and 102 < f["lon"] < 110 for f in p["former"]), p["id"]
    assert next(p for p in sites.PROVINCES if p["id"] == "can_tho")["areas"] == [s["id"] for s in sites.SITES]  # former Sóc Trăng
    pts = [x["id"] for x in sites.points()]
    assert len(pts) == len(set(pts)) == 5 + 14 and set(former) <= set(pts)


def test_province_helpers():
    # averages month by month; rain/ET0 stay whole mm, the rest one decimal
    a = {"rain_mm": [10] * 12, "et0_mm": [100] * 12, "tmax_c": [30.0] * 12}
    b = {"rain_mm": [11] * 12, "et0_mm": [103] * 12, "tmax_c": [31.5] * 12}
    m = build.mean_climate([a, b])
    assert m["rain_mm"][0] == 10 and m["et0_mm"][0] == 102 and m["tmax_c"][0] == 30.8 and isinstance(m["et0_mm"][0], int), m
    # every point needs its own GPM rain: a missing one stops the build instead of borrowing a neighbour's
    assert build.point_rain({"x": {"2001-01": 10}}, "x") == {"2001-01": 10}
    try:
        build.point_rain({}, "z")
        raise AssertionError("missing GPM must raise")
    except ValueError:
        pass
    # soil re-sampled near a town pin says how far away it is; soil at the pin itself has no distance
    import sites
    for pt in sites.points():
        f = build.RAW / f"soil_{pt['id']}.json"
        raw = json.loads(f.read_text(encoding="utf-8"))
        v = build.point_soil(pt["id"])
        if raw.get("sample"):
            assert v and v["km"] == raw["sample"]["km"] and 0 < v["km"] <= 15, pt["id"]
        elif v:
            assert "km" not in v


def test_unknown_salinity():
    sal = build.unknown_salinity()
    assert sal["level"] == build.UNKNOWN and sal["months"] == [] and sal["estimate"] is True
    clim = {"rain_mm": [100] * 12, "et0_mm": [120] * 12, "hot_days": [3] * 12}
    rice3 = next(r for r in build.ROTATIONS if r["id"] == "rice3")
    score, w = build.score_weather_salt(rice3, clim, sal)
    assert score is None and w["parts"]["salt"] is None and w["parts"]["canal"] is None  # never a salt-free 5.0
    assert w["hot_days"] == 33 and w["parts"]["heat"] == 1.0  # 11 crop months x 3 = 33 hot days >= HEAT_REF 30 -> heat part 1.0
    sm = build.summary(dict(clim, rain_min_mm=[0] * 12, rain_max_mm=[0] * 12), None, sal)
    assert sm[1]["salt"] and "no estimate" in sm[1]["en"] and "chưa có ước tính" in sm[1]["vi"] and "satellite" in sm[1]["en"]
    level, why = build.confidence(rice3, None, sal, False)
    assert any("No salinity estimate" in x["en"] for x in why) and level == "low", (level, why)


def test_provinces_output():
    import sites
    assert "provinces" not in json.loads(build.OUT.read_text(encoding="utf-8"))  # the app's file stays as it was
    d = json.loads(build.PROV_OUT.read_text(encoding="utf-8"))  # written by test_sites_json_contract
    assert [p["id"] for p in d["provinces"]] == [p["id"] for p in sites.PROVINCES] and set(d["regions"]) == set(sites.REGIONS)
    assert d["sources"][d["region_src"][0]]["title"] == sites.REGION_SRC["title"]
    # its own numbered source list: every source cited, every citation real
    text = build.PROV_OUT.read_text(encoding="utf-8")
    refs = [i for m in re.finditer(r'"(?:src|cal_src|chart_src|soil_src|region_src|elnino_src|ndvi_src|outline_src|salt_src)": \[([^\]]*)\]', text) for i in json.loads("[" + m.group(1) + "]")]
    assert set(refs) == set(range(len(d["sources"]))) and "url" not in json.dumps(d["provinces"]) + json.dumps(d["places"])
    vi = re.findall(r'"vi": "((?:[^"\\]|\\.)*)"', text)
    assert vi and not [v for v in vi if re.search(r"\d\.\d(?!\d\d(?!\d))", v)], "Vietnamese text must use decimal commas"
    for p in d["provinces"]:
        assert len(p["climate"]["rain_mm"]) == 12 and len(p["elnino"]["climate"]["rain_mm"]) == 12
        assert p["points"]["power"] == p["points"]["gpm"] == [f["id"] for f in p["former"]] and set(p["points"]["soil"]) <= set(p["points"]["power"])
        assert p["salinity"]["level"] == "unknown" and p["salinity"]["estimate"] is True
        assert (p["soil"] is None) == (not p["points"]["soil"])
        assert p["scored"] == (p["region"] == "mekong_delta") and bool(p["cards"]) == p["scored"] and bool(p["elnino"]["cards"]) == p["scored"]
        assert (p["not_scored"] is None) == p["scored"]
        for sm in (p["summary"], p["elnino"]["summary"]):
            salt = sm[1] if p["scored"] else sm[0]  # outside the Delta the winter-spring (Delta calendar) line is left out
            assert [x for x in sm if x.get("salt")] == [salt] and "no estimate" in salt["en"]
        for c in flat(p):
            assert c["scores"]["salt"] is None and c["confidence"] == "low", (p["id"], c["id"])
            assert all(1 <= v <= 5 for v in c["scores"].values() if v is not None)
            assert any(x["en"].startswith("Weather & salt not scored") for x in c["why"]), (p["id"], c["id"])
            if c.get("needs_brackish"):
                assert any("before stocking shrimp" in r["en"] for r in c["risks"]) and not c["not_here"]
    assert sum(p["scored"] for p in d["provinces"]) == 5
    # every one of the 14 province points has its own model
    places = d["places"]
    assert [x["id"] for x in places] == [f["id"] for p in sites.PROVINCES for f in p["former"]] and len(places) == 14
    region = {p["id"]: p["region"] for p in sites.PROVINCES}
    for x in places:
        assert x["region"] == region[x["province"]] and x["own"] == (x["id"] == x["province"]), x["id"]
        assert len(x["climate"]["rain_mm"]) == 12 and len(x["elnino"]["climate"]["rain_mm"]) == 12 and x["gpm_check"]
        assert (x["ndvi"] is not None) == (build.RAW / f"ndvi_{x['id']}.json").exists(), x["id"]
        if x["ndvi"]:  # a town or water pixel is kept for display but never feeds the summary or the cards
            assert x["ndvi"]["farmland"] == (max(x["ndvi"]["monthly"]) >= build.FARM_NDVI)
            assert any("MODIS" in s["en"] for s in x["summary"]) == x["ndvi"]["farmland"], x["id"]
        # outside the Delta no line uses the Delta's rice calendar
        assert x["scored"] or not any("Winter–spring" in s["en"] for s in x["summary"] + x["elnino"]["summary"]), x["id"]
        assert x["scored"] == (x["region"] == "mekong_delta" or x["id"] in sites.SCORED_PLACES) and bool(x["cards"]) == x["scored"] == bool(x["elnino"]["cards"])
        sal, sal_e = x["salinity"], x["elnino"]["salinity"]
        assert (sal["level"] == "unknown") == (sal_e["level"] == "unknown"), x["id"]
        if sal["level"] != "unknown":  # nearest KTTV station within SALT_KM: an estimate naming the station and its distance
            assert sal["station"] == sal_e["station"] and sal["km"] <= build.SALT_KM and sal["max_ppt"] is not None, x["id"]
            salt = [s for s in x["summary"] if s.get("salt")] + [s for s in x["elnino"]["summary"] if s.get("salt")]
            assert all(sal["station"] in s["en"] and f"{build.km_text(sal['km'])} km" in s["en"] and sal["station"] in s["vi"] for s in salt), x["id"]
            assert all(c["scores"]["salt"] is not None for c in flat(x)), x["id"]
            continue
        for c in flat(x):  # no salinity estimate: low, except the bare Feb-Apr bonus MODIS can give (confidence())
            ok = ("low", "medium") if x["ndvi"] and x["ndvi"]["farmland"] and c["id"] in ("rice_upland", "salt_tolerant") else ("low",)
            assert c["scores"]["salt"] is None and c["confidence"] in ok, (x["id"], c["id"], c["confidence"])
    # the 5 Sóc Trăng areas drawn inside the Vietnam map: salt is always an estimate, from the same stations as sites.json
    app = {s["id"]: s for s in json.loads(build.OUT.read_text(encoding="utf-8"))["sites"]}
    assert [s["id"] for s in d["pins"]] == list(app) and d["salt_src"]
    for s in d["pins"]:
        assert s["salt"]["estimate"] is True and s["salt"]["max_ppt"] == app[s["id"]]["salinity"]["max_ppt"] and s["salt"]["level"] == app[s["id"]]["salinity"]["level"]
    assert sum(x["own"] for x in places) == 6 and sum(x["scored"] for x in places) == 13  # Mekong Delta 2+2+3+3+2, plus Long An
    long_an, tay_ninh = (next(x for x in places if x["id"] == i) for i in ("long_an", "tay_ninh"))
    assert long_an["scored"] and long_an["cards"] and not tay_ninh["scored"] and not tay_ninh["cards"]


def test_outlines():
    """docs/app/vn_geo.js: 14 former + 6 joined provinces, and every pin inside its own outline."""
    import make_outlines as mo
    import sites
    text = (build.ROOT / "docs" / "app" / "vn_geo.js").read_text(encoding="utf-8")
    g = json.loads(text[text.index("{"):text.rindex("}") + 1])
    rings = lambda rs: [mo.ring_pts(g["arcs"], r) for r in rs]
    assert set(g["province"]) == {p["id"] for p in sites.PROVINCES}
    assert set(g["former"]) == {f["id"] for p in sites.PROVINCES for f in p["former"]} and len(g["former"]) == 14
    for p in sites.PROVINCES:
        for f in p["former"]:
            assert mo.inside(f["lon"], f["lat"], rings(g["former"][f["id"]])), f["id"]
            assert mo.inside(f["lon"], f["lat"], rings(g["province"][p["id"]])), (p["id"], f["id"])
    for s in sites.SITES:
        assert mo.inside(s["lon"], s["lat"], rings(g["former"]["soc_trang"])), s["id"]
    # a border inside a joined province is never part of its outline
    used = {i if i >= 0 else ~i for rs in g["province"].values() for r in rs for i in r}
    assert g["inner"] and not used & set(g["inner"])
    assert mo.dp([(0, 0), (1, 0.0001), (2, 0)], 0.01) == [(0, 0), (2, 0)] and len(mo.dp([(0, 0), (1, 1), (2, 0)], 0.01)) == 3


def test_kttv_bulletins_by_station():
    b = json.loads((pathlib.Path(__file__).resolve().parent.parent / "data/raw/salinity_kttv_vietnam.json").read_text(encoding="utf-8"))["bulletins"]
    assert len(b) >= 23, len(b)
    assert all(isinstance(v["readings"], dict) and "province" not in v for v in b.values())
    assert all(type(x) is float and x > 0 for v in b.values() for x in v["readings"].values())
    summ = json.loads((pathlib.Path(__file__).resolve().parent.parent / "data/raw/salinity_vietnam_summary.json").read_text(encoding="utf-8"))
    assert all(set(v) == {"river", "readings", "max_ppt", "first", "last"} for v in summ.values()) and "Gò Quao" in summ
    assert {d[:4] for d, v in b.items() if "Gò Quao" in v["readings"]} >= {"2024", "2026"}


def test_kttv_parse_blank():
    p = fetch_salinity_vietnam.parse_float
    assert p("") is None and p("-") is None and p("—") is None and p("10,4") == 10.4


def test_kttv_station_coords():
    root = pathlib.Path(__file__).resolve().parent.parent / "data/raw"
    st = json.loads((root / "kttv_stations.json").read_text(encoding="utf-8"))["stations"]
    b = json.loads((root / "salinity_kttv_vietnam.json").read_text(encoding="utf-8"))["bulletins"]
    names = {n for v in b.values() for n in v["readings"]}
    assert names <= set(st), names - set(st)
    for n, s in st.items():
        assert 8.3 <= s["lat"] <= 11.2 and 104.4 <= s["lon"] <= 107.1, n
        assert s["source"]["url"] and type(s["approximate"]) is bool and s["river"], n


def kttv_raw():
    return json.loads((build.RAW / "salinity_kttv_vietnam.json").read_text(encoding="utf-8"))["bulletins"]


def station_at(name, dlat_km=0.0):
    """(lat, lon) of a KTTV station, moved dlat_km km due south."""
    st = json.loads((build.RAW / "kttv_stations.json").read_text(encoding="utf-8"))["stations"][name]
    return st["lat"] - dlat_km / 111.195, st["lon"]  # 1° of latitude = 6371 km x pi / 180 = 111.195 km


def test_salt_window():
    assert build.SALT_SEASONS == (2017, 2026)
    assert build.salt_elnino(2024) and not build.salt_elnino(2025) and not build.salt_elnino(2026)
    assert build.salt_elnino(2016) and not build.salt_elnino(2017)  # straight from oni.txt, not limited to PERIOD
    _, first, last, _ = build.station_salt("tran_de", False)
    assert first == 2017 and last >= 2025, (first, last)
    _, first, last, n = build.station_salt("tran_de", True)
    assert (first, last, n) == (2019, 2024, 3)  # El Niño dry seasons 2019, 2020, 2024


def test_station_record_merge():
    rec = build.station_record("Trần Đề")
    assert rec[2024] == (23.7, 3, False)  # the table's row wins over the bulletins' partial 2024 season
    assert rec[1999][2] is False and min(rec) == 1999
    months26 = {int(d[5:7]) for d, b in kttv_raw().items() if d[:4] == "2026" and "Trần Đề" in b["readings"]}
    if not {2, 3} <= months26:  # 2026 partial at Trần Đề: never merged into a full record
        assert 2026 not in rec
    bd = build.station_record("Bình Đại")  # not a table station: bulletins only
    assert set(bd) == {2024, 2025, 2026} and bd[2024] == (25.3, 3, True) and bd[2025] == (23.9, 2, False) and bd[2026][2] is True


def test_kttv_nearest():
    import sites
    pts = {f["id"]: f for p in sites.PROVINCES for f in p["former"]}
    bt = build.kttv_salinity(pts["ben_tre"]["lat"], pts["ben_tre"]["lon"])
    assert bt and bt[0]["level"] != build.UNKNOWN and bt[1]["level"] != build.UNKNOWN
    for pid in ("dong_thap", "an_giang"):  # Cao Lãnh and Long Xuyên: far from the coast and the Cái Bé / Cái Lớn stations
        got = build.kttv_salinity(pts[pid]["lat"], pts[pid]["lon"])
        assert got is None or got[0]["station"] not in ("Vàm Kênh", "Gò Quao", "An Ninh"), (pid, got[0]["station"])
    t, e = build.kttv_salinity(*station_at("Sông Đốc", 25.0))
    assert t["station"] == e["station"] == "Sông Đốc" and t["km"] == 25.0
    assert build.kttv_salinity(*station_at("Sông Đốc", 25.5)) is None
    t, _ = build.kttv_salinity(*station_at("Trần Đề"))
    assert t["station"] == "Trần Đề" and t["km"] == 0 and t["seasons"] == 9 and t["last_year"] == 2025  # the table's long record


def test_kttv_salt_months():
    b = kttv_raw()
    def seasons(name, m):
        return {d[:4] for d, v in b.items() if int(d[5:7]) == m and v["readings"].get(name, 0) >= build.SALT_MED}
    assert len(seasons("Long Phú", 3)) >= 2 and len(seasons("Long Phú", 1)) == 1  # the data this test relies on
    t, e = build.kttv_salinity(*station_at("Long Phú"))
    assert 3 in t["months"] and 1 not in t["months"] and t["months"] == e["months"]
    assert len(seasons("Sóc Trăng", 5)) == 1 and 5 not in build.kttv_salinity(*station_at("Sóc Trăng"))[0]["months"]


def test_kttv_partial_label():
    t, e = build.kttv_salinity(*station_at("Bình Đại"))
    assert t["partial"] and e["partial"]  # 2026 (typical) and 2024 (El Niño) have no February bulletin
    for s in (t, e):
        assert "may miss an earlier peak" in s["note"]["en"] and "Bình Đại" in s["note"]["en"] and "‰" in s["note"]["vi"]
    assert "one" in e["note"]["en"] and "duy nhất" in e["note"]["vi"]  # the El Niño view rests on 2024 alone
    assert e["station_ppt"] == 25.3 and t["station_ppt"] == round((23.9 + 24.1) / 2, 1)
    assert not build.kttv_salinity(*station_at("Trần Đề"))[0]["partial"]
    sm = build.summary({"rain_mm": [100] * 12, "et0_mm": [120] * 12}, None, t)[1]
    assert "Bình Đại" in sm["en"] and f"{build.km_text(t['km'])} km" in sm["en"] and "may miss an earlier peak" in sm["en"] and "Bình Đại" in sm["vi"]


def test_province_average_salt():
    d = json.loads(build.PROV_OUT.read_text(encoding="utf-8"))
    for p in d["provinces"]:
        for sal in (p["salinity"], p["elnino"]["salinity"]):
            assert sal["level"] == "unknown" and "former province" in sal["note"]["en"] and "tỉnh cũ" in sal["note"]["vi"], p["id"]
        for sm in (p["summary"], p["elnino"]["summary"]):  # the flagged salt line sends the farmer to a former province
            salt = [x for x in sm if x.get("salt")][0]
            assert "pick a former province" in salt["en"] and "chọn một tỉnh cũ" in salt["vi"] and "no public report" not in salt["en"], p["id"]


def points():
    import sites
    return {f["id"]: f for p in sites.PROVINCES for f in p["former"]}


def test_no_estimate_reasons():
    d = {x["id"]: x for x in json.loads(build.PROV_OUT.read_text(encoding="utf-8"))["places"]}
    salt = lambda x, v: [s for s in (x["summary"] if v == "t" else x["elnino"]["summary"]) if s.get("salt")][0]
    kg = d["kien_giang"]  # Rạch Giá station 0.3 km away, but bulletins only for 2024 (an El Niño year)
    assert kg["salinity"]["level"] == kg["elnino"]["salinity"]["level"] == build.UNKNOWN
    for v in ("t", "e"):
        assert "Rạch Giá" in salt(kg, v)["en"] and "only for El Niño" in salt(kg, v)["en"] and "no typical-year estimate" in salt(kg, v)["en"]
        assert "Rạch Giá" in salt(kg, v)["vi"] and "năm El Niño" in salt(kg, v)["vi"]
    far = d["can_tho"]  # Đại Ngãi is the nearest station, about 50 km away
    st, km = build.nearest_station(far["lat"], far["lon"])
    assert km > build.SALT_KM and all(st in salt(far, v)["en"] and f"{whole_km(km)} km" in salt(far, v)["en"] and st in salt(far, v)["vi"] for v in ("t", "e"))
    assert "no public report" not in json.dumps([s for x in d.values() for s in x["summary"] + x["elnino"]["summary"]])


def whole_km(km):
    return build.km_text(km)


def test_salt_months_when_salty():
    d = json.loads(build.PROV_OUT.read_text(encoding="utf-8"))["places"]
    for x in d:
        for sal in (x["salinity"], x["elnino"]["salinity"]):
            if sal["level"] in ("medium", "high"):
                assert sal["months"], (x["id"], sal["level"])
    pts = points()
    t, e = build.kttv_salinity(pts["long_an"]["lat"], pts["long_an"]["lon"])  # Tân An: El Niño medium, no month at 4‰ in 2 seasons
    assert e["level"] == "medium" and "any El Niño season" in e["note"]["en"] and "bất kỳ" in e["note"]["vi"]
    assert t["level"] == "low" and "any" not in t["note"]["en"] and not t["months"]
    assert e["months"] == [3, 4, 5]  # Tân An 2024: 4.7-11.1‰ Mar-May
    # R3 fallback: a range from the first to the last month at 4‰, so no month inside it reads 0 in profile() (docs/app/rx.js)
    saved = build.KTTV
    build.KTTV = {"2024-02-10": {"readings": {"X": 5.0}}, "2024-05-10": {"readings": {"X": 6.0}}}
    try:
        assert build.station_view("X", {2024: (6.0, 5, False)}) == (6.0, "medium", [2, 3, 4, 5], "any")
        assert build.station_view("X", {2024: (3.0, 5, False)}) == (3.0, "low", [], "none")
    finally:
        build.KTTV = saved
    for x in d:
        for sal in (x["salinity"], x["elnino"]["salinity"]):
            ms = sal["months"]
            assert ms == sorted(ms), x["id"]
            if "any" in sal["note"]["en"]:
                assert ms == list(range(ms[0], ms[-1] + 1)), (x["id"], ms)


def test_salt_months_table_rows():
    """At a Sóc Trăng table station, each in-window table row's peak at 4‰ or more counts at its month, beside the bulletins."""
    rows = json.loads((build.RAW / "salinity_stations.json").read_text(encoding="utf-8"))["stations"]["soc_trang"]["yearly_max"]
    april = {int(y) for y, (v, m) in rows.items() if m == 4 and v >= build.SALT_MED and build.in_salt_seasons(int(y))}
    assert april >= {2018, 2019, 2021}, april  # the data this test relies on
    saved = build.TABLE_KTTV
    build.TABLE_KTTV = {}
    try:
        bulletins_only = build.salt_months("Sóc Trăng")
    finally:
        build.TABLE_KTTV = saved
    assert 4 not in bulletins_only and 4 in build.salt_months("Sóc Trăng")
    st = points()["soc_trang"]
    t, e = build.kttv_salinity(st["lat"], st["lon"])
    assert t["months"] == e["months"] == build.salt_months("Sóc Trăng") and "No month reached" not in t["note"]["en"]
    assert build.salt_months("Sóc Trăng", {2019}, 1) == [4]  # one season: its table row (9.5‰ in April) counts


def test_kttv_stations_export():
    """provinces.json stations: every bulletin station, each view it has a season for, by the same rules as the points."""
    d = json.loads(build.PROV_OUT.read_text(encoding="utf-8"))
    st = {s["name"]: s for s in d["stations"]}
    assert set(st) == {n for b in kttv_raw().values() for n in b["readings"]}
    assert sum("typical" in s for s in st.values()) >= 20 and sum("elnino" in s for s in st.values()) >= 20
    for n, s in st.items():
        assert set(s) <= {"name", "lat", "lon", "typical", "elnino"} and ("typical" in s or "elnino" in s), n
        for k, view in zip(("typical", "elnino"), build.station_views(n)):
            assert (k in s) == bool(view), (n, k)
            if view:
                assert set(s[k]) == {"level", "max_ppt", "months", "monthly"} and len(s[k]["monthly"]) == 12 and s[k]["level"] in build.LEVELS and s[k]["max_ppt"] > 0, (n, k)
    assert "typical" not in st["Rạch Giá"] and "elnino" in st["Rạch Giá"]  # bulletins only in 2024, an El Niño year
    for x in d["places"]:  # a point's estimate is its station's, view by view
        for k, sal in (("typical", x["salinity"]), ("elnino", x["elnino"]["salinity"])):
            if sal["level"] != "unknown":
                assert {f: sal[f] for f in ("level", "max_ppt", "months", "monthly")} == st[sal["station"]][k], (x["id"], k)


def test_salt_lower_bound():
    # Khánh Hòa 2026: one reading (14‰, mid-April) counted as 'at least', not a peak; the paper's own Table 2 check is untouched
    typ, _ = build.site_salinity(json.loads((build.HERE / "salinity.json").read_text(encoding="utf-8"))["sites"]["vinh_chau"])
    assert build.table_rows("khanh_hoa")["2026"] == [14.0, 4] and "2026" not in json.loads((build.RAW / "salinity_stations.json").read_text(encoding="utf-8"))["stations"]["khanh_hoa"]["yearly_max"]
    assert typ["last_year"] == 2022  # a lower bound is not a published peak: the 'no reading after 2022' confidence drop stays
    assert "at least 14.0‰" in typ["note"]["en"] and "ít nhất 14,0‰" in typ["note"]["vi"] and "baocantho" not in typ["note"]["en"]


def test_builder_sync():
    """docs/app/builder.js (Plan Lab, written by build.write_builder) matches sites.json and the pipeline's constants and files."""
    text = (build.ROOT / "docs" / "app" / "builder.js").read_text(encoding="utf-8")
    line = next(ln for ln in text.splitlines() if ln.startswith("const BUILDER = "))
    b = json.loads(line[len("const BUILDER = "):].rstrip(";"))
    sites = {s["id"]: s for s in json.loads(build.OUT.read_text(encoding="utf-8"))["sites"]}
    assert set(b["sites"]) == set(sites)
    for sid, v in b["sites"].items():
        for view, sal in (("typical", sites[sid]["salinity"]), ("elnino", sites[sid]["elnino"]["salinity"])):
            w = v[view]
            assert (w["salt"], w["ppt"], w["max_ppt"], w["level"]) == (sal["months"], sal["station_ppt"], sal["max_ppt"], sal["level"]), \
                (sid, view, "run pipeline/build.py: builder.js is out of date")
    rot = json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))
    assert b["rubric"] == rot["_rubric"] and b["const"]["SALT_FULL"] == build.SALT_FULL and b["const"]["WS_W"] == list(build.WS_W)
    assert b["rot_profit"] == {r["id"]: {"months": r["months"], "profit": r["profit"]} for r in rot["rotations"]}
    assert b["median"] == {k: build.median_profit(k) for k in b["median"]}


def test_station_monthly():
    # each month: that month's highest 10-day reading, averaged over the view's seasons with a reading; None without one
    typ, nino = build.station_views("Trần Đề")
    m = build.station_monthly("Trần Đề", typ)
    for mon in range(1, 13):
        per = {}
        for d, b in build.KTTV.items():
            dd = build.date.fromisoformat(d)
            if dd.month == mon and "Trần Đề" in b["readings"] and dd.year + (dd.month == 12) in typ:
                per[dd.year] = max(per.get(dd.year, 0), b["readings"]["Trần Đề"])
        assert m[mon - 1] == (round(sum(per.values()) / len(per), 1) if per else None), (mon, m[mon - 1], per)
    assert m[6] is None  # July: no bulletin


def test_offline_precache():
    """sw.js saves every local file index.html loads (src, href, data-src) plus the data the app fetches, and each exists;
    the manifest's icons exist."""
    import re
    docs = pathlib.Path(__file__).resolve().parent.parent / "docs"
    sw, idx = (docs / "sw.js").read_text(encoding="utf-8"), (docs / "index.html").read_text(encoding="utf-8")
    pre = set(re.findall(r'^  "([^"]+)",?$', sw, re.M)) - {"./"}
    need = set(re.findall(r'(?:src|href)="((?:app|data)/[^"#?]+)"', idx)) | set(re.findall(r'data-src="([^"]+)"', idx))
    need |= {"index.html", "data/sites.json", "data/provinces.json", "app/vn_geo.js", "app/costs.json", "app/research.json", "manifest.webmanifest"}
    assert need <= pre, sorted(need - pre)
    assert all((docs / p).is_file() for p in pre), [p for p in pre if not (docs / p).is_file()]
    man = json.loads((docs / "manifest.webmanifest").read_text(encoding="utf-8"))
    assert all((docs / i["src"]).is_file() and i["src"] in pre for i in man["icons"])


def test_kttv_never_shrinks():
    lost = fetch_salinity_vietnam.lost_dates
    assert lost({"2025-04-10": {}, "2025-05-10": {}}, {"2025-05-10": {}, "2026-03-10": {}}) == ["2025-04-10"]
    assert lost({"2025-05-10": {}}, {"2025-05-10": {}, "2026-03-10": {}}) == []
    # a bulletin KTTV later removed (404) keeps its stored readings; other errors still stop the run
    import urllib.error
    keep = fetch_salinity_vietnam.keep_stored
    gone = urllib.error.HTTPError("u", 404, "Not Found", {}, None)
    assert keep(gone, "2025-04-10", {"2025-04-10": {}})
    assert not keep(gone, "2026-04-10", {"2025-04-10": {}})  # never on file: nothing to keep
    assert not keep(urllib.error.HTTPError("u", 500, "err", {}, None), "2025-04-10", {"2025-04-10": {}})
    assert not keep(OSError("reset"), "2025-04-10", {"2025-04-10": {}})


def test_km_and_far_points():
    assert build.km_text(9.84) == "9.8" and build.km_text(20.24) == "20" and build.km_text(20.5) == "21" and build.km_text(2.0) == "2.0"
    d = {x["id"]: x for x in json.loads(build.PROV_OUT.read_text(encoding="utf-8"))["places"]}
    far = d["ha_noi"]  # hundreds of km from the southern bulletins
    assert build.nearest_station(far["lat"], far["lon"])[1] > 100
    salt = [s for s in far["summary"] if s.get("salt")][0]
    assert "outside the area covered by KTTV" in salt["en"] and "km" not in salt["en"] and "ngoài khu vực" in salt["vi"]


def test_kttv_missing_station():
    saved = build.KTTV_STATIONS
    build.KTTV_STATIONS = {k: v for k, v in saved.items() if k != "Gò Quao"}
    try:
        build.kttv_salinity(10.0, 106.0)
        assert False, "expected ValueError"
    except ValueError as e:
        assert "Gò Quao" in str(e)
    finally:
        build.KTTV_STATIONS = saved
    pts = points()
    for pid in ("can_tho", "vinh_long"):  # inland on the Hậu / Cổ Chiên: no coastal station within 25 km
        assert build.kttv_salinity(pts[pid]["lat"], pts[pid]["lon"]) is None, pid


def test_write_dated_keeps_old_date():
    import tempfile
    p = pathlib.Path(tempfile.mkdtemp()) / "x.json"
    p.write_text(json.dumps({"generated": "2000-01-01", "a": [1, 2]}), encoding="utf-8")
    build.write_dated(p, {"a": (1, 2)})  # same data (tuple round-trips to list): date kept
    assert json.loads(p.read_text(encoding="utf-8"))["generated"] == "2000-01-01"
    build.write_dated(p, {"a": [3]})
    assert json.loads(p.read_text(encoding="utf-8"))["generated"] != "2000-01-01"


if __name__ == "__main__":
    import sys
    # Windows uses cp1252 when output is redirected; Vietnamese text would crash print().
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
