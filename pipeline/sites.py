"""Pin locations and names.

SITES: the 5 preset areas the app shows (coastal Sóc Trăng, now part of Cần Thơ). Coordinates are APPROXIMATE field
locations, not town centres. Districts were abolished in the July 2025 merger, so the pins are labelled "former ... area".

PROVINCES: Vietnam's 34 provinces and centrally governed cities since 1 July 2025 (National Assembly Resolution
202/2025/QH15: 63 -> 34), each in its socio-economic region (Government Resolution 306/NQ-CP, 5 Oct 2025, which
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

# The 6 socio-economic regions of Resolution 306/NQ-CP (5 Oct 2025)
REGIONS = {
    "northern_midlands": {"en": "Northern Midlands and Mountains", "vi": "Trung du và miền núi phía Bắc"},
    "red_river_delta": {"en": "Red River Delta", "vi": "Đồng bằng sông Hồng"},
    "north_central": {"en": "North Central Coast", "vi": "Bắc Trung Bộ"},
    "south_central_highlands": {"en": "South Central Coast and Central Highlands", "vi": "Duyên hải Nam Trung Bộ và Tây Nguyên"},
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
    # Northern Midlands and Mountains (9)
    {"id": "tuyen_quang", "region": "northern_midlands", "former": [
        _p("tuyen_quang", "Tuyên Quang", "Tuyên Quang", 21.8236, 105.2142), _p("ha_giang", "Hà Giang", "Hà Giang", 22.8233, 104.9836)]},
    {"id": "cao_bang", "region": "northern_midlands", "former": [_p("cao_bang", "Cao Bằng", "Cao Bằng", 22.6657, 106.2579)]},
    {"id": "lai_chau", "region": "northern_midlands", "former": [_p("lai_chau", "Lai Châu", "Lai Châu", 22.3864, 103.4703)]},
    {"id": "lao_cai", "region": "northern_midlands", "former": [
        _p("lao_cai", "Lào Cai", "Lào Cai", 22.4809, 103.9755), _p("yen_bai", "Yên Bái", "Yên Bái", 21.7229, 104.9113)]},
    {"id": "thai_nguyen", "region": "northern_midlands", "former": [
        _p("thai_nguyen", "Thái Nguyên", "Thái Nguyên", 21.5672, 105.8252), _p("bac_kan", "Bắc Kạn", "Bắc Kạn", 22.1470, 105.8348)]},
    {"id": "dien_bien", "region": "northern_midlands", "former": [_p("dien_bien", "Điện Biên", "Điện Biên", 21.3860, 103.0230)]},
    {"id": "lang_son", "region": "northern_midlands", "former": [_p("lang_son", "Lạng Sơn", "Lạng Sơn", 21.8537, 106.7615)]},
    {"id": "son_la", "region": "northern_midlands", "former": [_p("son_la", "Sơn La", "Sơn La", 21.3256, 103.9188)]},
    {"id": "phu_tho", "region": "northern_midlands", "former": [
        _p("phu_tho", "Phú Thọ", "Phú Thọ", 21.3227, 105.4020), _p("vinh_phuc", "Vĩnh Phúc", "Vĩnh Phúc", 21.3089, 105.6049),
        _p("hoa_binh", "Hòa Bình", "Hòa Bình", 20.8133, 105.3383)]},
    # Red River Delta (6)
    {"id": "ha_noi", "region": "red_river_delta", "former": [_p("ha_noi", "Hà Nội", "Hà Nội", 21.0285, 105.8542)]},
    {"id": "hai_phong", "region": "red_river_delta", "former": [
        _p("hai_phong", "Hải Phòng", "Hải Phòng", 20.8449, 106.6881), _p("hai_duong", "Hải Dương", "Hải Dương", 20.9373, 106.3146)]},
    {"id": "bac_ninh", "region": "red_river_delta", "former": [
        _p("bac_ninh", "Bắc Ninh", "Bắc Ninh", 21.1861, 106.0763), _p("bac_giang", "Bắc Giang", "Bắc Giang", 21.2731, 106.1946)]},
    {"id": "quang_ninh", "region": "red_river_delta", "former": [_p("quang_ninh", "Quảng Ninh", "Quảng Ninh", 21.0064, 107.2925)]},
    {"id": "hung_yen", "region": "red_river_delta", "former": [
        _p("hung_yen", "Hưng Yên", "Hưng Yên", 20.6464, 106.0511), _p("thai_binh", "Thái Bình", "Thái Bình", 20.4463, 106.3366)]},
    {"id": "ninh_binh", "region": "red_river_delta", "former": [
        _p("ninh_binh", "Ninh Bình", "Ninh Bình", 20.2506, 105.9745), _p("ha_nam", "Hà Nam", "Hà Nam", 20.5411, 105.9229),
        _p("nam_dinh", "Nam Định", "Nam Định", 20.4388, 106.1621)]},
    # North Central Coast (5)
    {"id": "thanh_hoa", "region": "north_central", "former": [_p("thanh_hoa", "Thanh Hóa", "Thanh Hóa", 19.8067, 105.7852)]},
    {"id": "nghe_an", "region": "north_central", "former": [_p("nghe_an", "Nghệ An", "Nghệ An", 18.6796, 105.6813)]},
    {"id": "ha_tinh", "region": "north_central", "former": [_p("ha_tinh", "Hà Tĩnh", "Hà Tĩnh", 18.3560, 105.8877)]},
    {"id": "quang_tri", "region": "north_central", "former": [
        _p("quang_tri", "Quảng Trị", "Quảng Trị", 16.8163, 107.1003), _p("quang_binh", "Quảng Bình", "Quảng Bình", 17.4689, 106.6223)]},
    {"id": "hue", "region": "north_central", "former": [_p("hue", "Thừa Thiên Huế", "Thừa Thiên Huế", 16.4637, 107.5909)]},
    # South Central Coast and Central Highlands (6)
    {"id": "da_nang", "region": "south_central_highlands", "former": [
        _p("da_nang", "Đà Nẵng", "Đà Nẵng", 16.0544, 108.2022), _p("quang_nam", "Quảng Nam", "Quảng Nam", 15.5736, 108.4740)]},
    {"id": "quang_ngai", "region": "south_central_highlands", "former": [
        _p("quang_ngai", "Quảng Ngãi", "Quảng Ngãi", 15.1214, 108.8044), _p("kon_tum", "Kon Tum", "Kon Tum", 14.3497, 108.0005)]},
    {"id": "gia_lai", "region": "south_central_highlands", "former": [
        _p("gia_lai", "Gia Lai", "Gia Lai", 13.9833, 108.0000), _p("binh_dinh", "Bình Định", "Bình Định", 13.7820, 109.2197)]},
    {"id": "dak_lak", "region": "south_central_highlands", "former": [
        _p("dak_lak", "Đắk Lắk", "Đắk Lắk", 12.6667, 108.0500), _p("phu_yen", "Phú Yên", "Phú Yên", 13.0955, 109.2960)]},
    {"id": "khanh_hoa", "region": "south_central_highlands", "former": [
        _p("khanh_hoa", "Khánh Hòa", "Khánh Hòa", 12.2388, 109.1967), _p("ninh_thuan", "Ninh Thuận", "Ninh Thuận", 11.5675, 108.9896)]},
    {"id": "lam_dong", "region": "south_central_highlands", "former": [
        _p("lam_dong", "Lâm Đồng", "Lâm Đồng", 11.9404, 108.4583), _p("dak_nong", "Đắk Nông", "Đắk Nông", 12.0042, 107.6907),
        _p("binh_thuan", "Bình Thuận", "Bình Thuận", 10.9289, 108.1021)]},
    # Southeast (3)
    {"id": "dong_nai", "region": "southeast", "former": [
        _p("dong_nai", "Đồng Nai", "Đồng Nai", 10.9453, 106.8243), _p("binh_phuoc", "Bình Phước", "Bình Phước", 11.5350, 106.8906)]},
    {"id": "tay_ninh", "region": "southeast", "former": [
        _p("tay_ninh", "Tây Ninh", "Tây Ninh", 11.3100, 106.0983), _p("long_an", "Long An", "Long An", 10.5359, 106.4137)]},
    {"id": "tp_hcm", "region": "southeast", "former": [
        _p("tp_hcm", "TP. Hồ Chí Minh", "TP. Hồ Chí Minh", 10.8231, 106.6297), _p("binh_duong", "Bình Dương", "Bình Dương", 10.9804, 106.6519),
        _p("ba_ria_vung_tau", "Bà Rịa – Vũng Tàu", "Bà Rịa – Vũng Tàu", 10.4114, 107.1362)]},
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
    "tuyen_quang": "Tuyên Quang", "cao_bang": "Cao Bằng", "lai_chau": "Lai Châu", "lao_cai": "Lào Cai", "thai_nguyen": "Thái Nguyên",
    "dien_bien": "Điện Biên", "lang_son": "Lạng Sơn", "son_la": "Sơn La", "phu_tho": "Phú Thọ", "ha_noi": "Hà Nội",
    "hai_phong": "Hải Phòng", "bac_ninh": "Bắc Ninh", "quang_ninh": "Quảng Ninh", "hung_yen": "Hưng Yên", "ninh_binh": "Ninh Bình",
    "thanh_hoa": "Thanh Hóa", "nghe_an": "Nghệ An", "ha_tinh": "Hà Tĩnh", "quang_tri": "Quảng Trị", "hue": "Huế",
    "da_nang": "Đà Nẵng", "quang_ngai": "Quảng Ngãi", "gia_lai": "Gia Lai", "dak_lak": "Đắk Lắk", "khanh_hoa": "Khánh Hòa",
    "lam_dong": "Lâm Đồng", "dong_nai": "Đồng Nai", "tay_ninh": "Tây Ninh", "tp_hcm": "TP. Hồ Chí Minh", "dong_thap": "Đồng Tháp",
    "an_giang": "An Giang", "vinh_long": "Vĩnh Long", "can_tho": "Cần Thơ", "ca_mau": "Cà Mau",
}
for _pr in PROVINCES:
    _own = next(f for f in _pr["former"] if f["id"] == _pr["id"])
    _pr.update(name={"en": PROVINCE_NAMES[_pr["id"]], "vi": PROVINCE_NAMES[_pr["id"]]}, lat=_own["lat"], lon=_own["lon"])

# Rotation cards are scored only where the rotations and profit figures come from (all published in the Mekong Delta).
SCORED_REGIONS = ("mekong_delta",)


def points():
    """Every place the fetch scripts download: the app's pins, then each former province's point (no repeats)."""
    out, seen = [], set()
    for p in SITES + [f for pr in PROVINCES for f in pr["former"]]:
        if p["id"] not in seen:
            seen.add(p["id"])
            out.append({"id": p["id"], "lat": p["lat"], "lon": p["lon"]})
    return out
