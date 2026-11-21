"""Pin locations and names.

SITES: the 5 preset areas the app shows (coastal Sóc Trăng, now part of Cần Thơ). Coordinates are APPROXIMATE field
locations, not town centres. Districts were abolished in the July 2025 merger, so the pins are labelled "former ... area".

PROVINCES: the 6 southern provinces the app covers (the Mekong Delta's 5 plus Tây Ninh, which holds former Long An), of
Vietnam's 34 since 1 July 2025 (National Assembly Resolution 202/2025/QH15: 63 -> 34), each in its socio-economic region (Government Resolution 306/NQ-CP, 5 Oct 2025, which
adjusts the National Master Plan 2021-2030). `former` lists the pre-July-2025 provinces each one now covers, with one
data point per former province (its former capital). A province's own lat/lon is the former point with the same id.
Data files are per point: data/raw/power_<point id>.json, soil_<point id>.json, and gpm.json[<point id>].
build.py averages a province's points; `points()` is the list the fetch scripts download.
"""

SITES = [
    {"id": "vinh_chau", "lat": 9.435, "lon": 105.98,
     "name": {"en": "Former Vĩnh Châu area (rice, inland)", "vi": "Khu vực Vĩnh Châu cũ (lúa, nội đồng)"}},
    {"id": "tran_de", "lat": 9.50, "lon": 106.10,
     "name": {"en": "Former Trần Đề area (river mouth)", "vi": "Khu vực Trần Đề cũ (cửa sông)"}},
    {"id": "my_xuyen", "lat": 9.5, "lon": 105.9,
     "name": {"en": "Former Mỹ Xuyên area", "vi": "Khu vực Mỹ Xuyên cũ"}},
    {"id": "long_phu", "lat": 9.61, "lon": 106.10,
     "name": {"en": "Former Long Phú area (Hậu River)", "vi": "Khu vực Long Phú cũ (sông Hậu)"}},
    {"id": "nga_nam", "lat": 9.548, "lon": 105.6,
     "name": {"en": "Former Ngã Năm area (inland)", "vi": "Khu vực Ngã Năm cũ (nội đồng)"}},
]

# The socio-economic regions of Resolution 306/NQ-CP (5 Oct 2025) that the app covers
REGIONS = {
    "southeast": {"en": "Southeast", "vi": "Đông Nam Bộ"},
    "mekong_delta": {"en": "Mekong Delta", "vi": "Đồng bằng sông Cửu Long"},
}
REGION_SRC = {"title": "Government of Viet Nam, Resolution 306/NQ-CP (5 Oct 2025) adjusting the National Master Plan 2021–2030: 6 socio-economic regions of the 34 provinces",
              "url": "https://baolamdong.vn/danh-sach-34-tinh-thanh-cua-viet-nam-theo-vung-mien-394955.html",
              "note": "Checked against the Lâm Đồng newspaper's list of the resolution's regions: northern midlands and mountains 9, Red River Delta 6, North Central Coast 5, South Central Coast and Central Highlands 6, Southeast 3, Mekong Delta 5.",
              "verified": True}


def _p(pid, en, vi, lat, lon):
    return {"id": pid, "name": {"en": en, "vi": vi}, "lat": lat, "lon": lon}


# Former provinces' points: the province pin itself (same id) or the former provincial capital.
PROVINCES = [
    # Southeast: only Tây Ninh, which now holds former Long An (Mekong Delta rice land)
    {"id": "tay_ninh", "region": "southeast", "former": [
        _p("tay_ninh", "Tây Ninh", "Tây Ninh", 11.3100, 106.0983), _p("long_an", "Long An", "Long An", 10.5359, 106.4137)]},
    # Mekong Delta (5)
    {"id": "dong_thap", "region": "mekong_delta", "former": [
        _p("dong_thap", "Đồng Tháp", "Đồng Tháp", 10.4567, 105.6361), _p("tien_giang", "Tiền Giang", "Tiền Giang", 10.3600, 106.3600)]},
    {"id": "an_giang", "region": "mekong_delta", "former": [
        _p("an_giang", "An Giang", "An Giang", 10.3864, 105.4352), _p("kien_giang", "Kiên Giang", "Kiên Giang", 10.0125, 105.0809)]},
    {"id": "vinh_long", "region": "mekong_delta", "former": [
        _p("vinh_long", "Vĩnh Long", "Vĩnh Long", 10.2537, 105.9722), _p("ben_tre", "Bến Tre", "Bến Tre", 10.2434, 106.3756),
        _p("tra_vinh", "Trà Vinh", "Trà Vinh", 9.9347, 106.3453)]},
    {"id": "can_tho", "region": "mekong_delta", "areas": [s["id"] for s in SITES], "former": [
        _p("can_tho", "Cần Thơ", "Cần Thơ", 10.0452, 105.7469), _p("soc_trang", "Sóc Trăng", "Sóc Trăng", 9.6025, 105.9739),
        _p("hau_giang", "Hậu Giang", "Hậu Giang", 9.7845, 105.4701)]},
    {"id": "ca_mau", "region": "mekong_delta", "former": [
        _p("ca_mau", "Cà Mau", "Cà Mau", 9.1768, 105.1524), _p("bac_lieu", "Bạc Liêu", "Bạc Liêu", 9.2941, 105.7278)]},
]
PROVINCE_NAMES = {
    "tay_ninh": "Tây Ninh", "dong_thap": "Đồng Tháp", "an_giang": "An Giang", "vinh_long": "Vĩnh Long", "can_tho": "Cần Thơ",
    "ca_mau": "Cà Mau",
}
for _pr in PROVINCES:
    _own = next(f for f in _pr["former"] if f["id"] == _pr["id"])
    _pr.update(name={"en": PROVINCE_NAMES[_pr["id"]], "vi": PROVINCE_NAMES[_pr["id"]]}, lat=_own["lat"], lon=_own["lon"])

# Rotation cards are scored only where the rotations and profit figures come from (all published in the Mekong Delta).
SCORED_REGIONS = ("mekong_delta",)
SCORED_PLACES = ("long_an",)  # former Long An (now in Tây Ninh, Southeast) is Mekong Delta rice land with salt data


def points():
    """Every place the fetch scripts download: the app's pins, then each former province's point (no repeats)."""
    out, seen = [], set()
    for p in SITES + [f for pr in PROVINCES for f in pr["former"]]:
        if p["id"] not in seen:
            seen.add(p["id"])
            out.append({"id": p["id"], "lat": p["lat"], "lon": p["lon"]})
    return out
