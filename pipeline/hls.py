"""NASA HLS (Landsat + Sentinel-2, 30 m) greenness, used only to cross-check MODIS bare months (proposal #34).

AppEEARS point CSV -> {pin id: {"YYYY-MM-DD": ndvi}} with one value per CLEAR DATE:
  - each pin is asked for at 9 points (the pin and its 8 neighbours 30 m away), see points();
  - a reading counts only if the SAME point, sensor and date has Fmask bits 1-3 clear (cloud, cloud edge/shadow,
    cloud shadow); bit 5 (water) is kept, because flooded paddy is part of the bare-month question;
  - both raw fill codes (-19999, -9999) are rejected before scaling, then anything outside -1..1;
  - the NDVI encoding (raw int16, scale 0.0001, or already scaled) is decided once per file from its cells (detect_encoding),
    never per cell, so a raw 1 (= 0.0001) and a scaled 1 (= 1.0) cannot be confused;
  - a pin whose rows are all cloudy or fill gets an EMPTY series (zero coverage), a pin with no rows at all makes the
    download incomplete and refresh() writes nothing;
  - readings from all points and both sensors are pooled per calendar date and the median is the date's value,
    so nine points or two sensors never count as more than one date. No smoothing.
"""
import csv
import json
import math
import pathlib
import re
import statistics
from datetime import date

FILL_RAW = (-19999, -9999)   # HLS User Guide Table 3 says -19999, the Earthdata catalogue says -9999: reject both
CLOUD_BITS = 0b1110          # Fmask bits 1 (cloud), 2 (adjacent to cloud/shadow), 3 (cloud shadow)
LAYERS = [("HLSL30_VI.020", "NDVI"), ("HLSS30_VI.020", "NDVI"), ("HLSL30.020", "Fmask"), ("HLSS30.020", "Fmask")]
STEP_M = 30
N_POINTS = 9


def points(site):
    """The pin and its 8 neighbours 30 m away: AppEEARS point dicts with ids like vinhchauP0 (P0 = the pin itself)."""
    dlat = STEP_M / 111320
    dlon = STEP_M / (111320 * math.cos(math.radians(site["lat"])))
    offsets = [(0, 0)] + [(i, j) for i in (-1, 0, 1) for j in (-1, 0, 1) if (i, j) != (0, 0)]
    return [{"id": f"{site['id'].replace('_', '')}P{k}", "category": "pin",
             "latitude": round(site["lat"] + i * dlat, 6), "longitude": round(site["lon"] + j * dlon, 6)}
            for k, (i, j) in enumerate(offsets)]


RICE_PEAK, RICE_WATER = 0.7, 0.1  # shortcut: tuned on the 5 Soc Trang pins (rice peaks ~0.85, Vinh Chau ponds 0.4-0.66)


def rice_stats(readings):
    """readings: [(ndvi, water flag 0/1)] of one point's clear dates -> (peak = 90th percentile NDVI, share flagged water).
    Rice at 30 m peaks near 0.85 and is rarely flagged water; shrimp ponds peak low and are often water (Vinh Chau, 2026)."""
    if not readings:
        return 0.0, 1.0
    v = sorted(x for x, _ in readings)
    return v[int(0.9 * (len(v) - 1))], sum(w for _, w in readings) / len(readings)


def scaled_ndvi(raw, encoding="raw"):
    """One NDVI cell -> value in -1..1, or None for no data. encoding "raw": int16 with scale 0.0001 (1 means 0.0001);
    "scaled": already NDVI (1 means 1.0). The fill codes are checked in the file's own encoding before anything is scaled."""
    try:
        v = float(raw)
    except (TypeError, ValueError):
        return None
    if v != v:  # NaN
        return None
    if encoding == "raw":
        if v in FILL_RAW:
            return None
        v *= 0.0001
    elif any(abs(v - f * 0.0001) < 1e-6 for f in FILL_RAW):  # the same codes, scaled
        return None
    return round(v, 4) if -1 <= v <= 1 else None


def detect_encoding(cells):
    """"raw" or "scaled" for a whole file's NDVI cells. Fill codes say nothing (AppEEARS scales NDVI but keeps fill as
    raw -19999). A whole number beyond -1..1 (7000) can only be raw;
    a fractional value (0.52, -0.9999) can only be scaled. Both kinds in one file, or neither (only 0, 1, -1 or blanks),
    cannot be decided: ValueError (unless the file is all fill: no data either way), and the caller passes encoding explicitly or checks the export."""
    raw = scaled = fill = False
    for c in cells:
        try:
            v = float(c)
        except (TypeError, ValueError):
            continue
        if v != v:
            continue
        if v in FILL_RAW:
            fill = True
            continue
        if v == int(v) and abs(v) > 1:
            raw = True
        elif v != int(v):
            scaled = True
    if not raw and not scaled and fill:
        return "raw"
    if raw == scaled:
        raise ValueError("HLS NDVI encoding is ambiguous (" + ("raw and scaled values both present" if raw else "no value tells raw from scaled") + "); pass encoding='raw' or 'scaled'")
    return "raw" if raw else "scaled"


def clear(fmask):
    """True when Fmask bits 1-3 are all 0. A missing or non-numeric Fmask is not clear."""
    try:
        return int(float(fmask)) & CLOUD_BITS == 0
    except (TypeError, ValueError):
        return False


def _columns(names):
    """{(sensor 'L'/'S', 'NDVI'/'Fmask'): column name}; AppEEARS names columns like HLSL30_VI_020_NDVI / HLSL30_020_Fmask."""
    out = {}
    for c in names:
        m = re.search(r"HLS([LS])30.*?(NDVI|Fmask)$", c)
        if m:
            out[(m.group(1), m.group(2))] = c
    return out


def parse(lines, pin_ids, encoding=None):
    """AppEEARS point CSV rows -> {pin id: {"YYYY-MM-DD": pooled median NDVI of the clear readings}}.
    pin_ids: the sites' ids; AppEEARS can drop underscores, so IDs are matched without them. A pin with rows but no clear
    reading maps to {} (zero coverage); a pin with no rows is absent. The median keeps 6 decimals: it is judged against
    ndvi.BARE, so two clear readings of 0.2952 and 0.3047 must stay 0.29995, not become 0.3.
    encoding: "raw" / "scaled", or None to detect it from the file (detect_encoding)."""
    known = {p.replace("_", ""): p for p in pin_ids}
    rows = csv.DictReader(lines)
    cols = _columns(rows.fieldnames or [])
    need = [(sensor, layer) for sensor in "LS" for layer in ("NDVI", "Fmask")]  # the four layers appeears.py asks for (LAYERS)
    if [k for k in need if k not in cols]:
        raise ValueError("HLS CSV needs NDVI and Fmask columns for both HLSL30 and HLSS30, missing: "
                         + ", ".join(f"HLS{a}30 {b}" for a, b in need if (a, b) not in cols))
    rows = list(rows)
    mine = []
    for r in rows:
        m = re.fullmatch(r"(.+?)p([0-8])", r["ID"].replace("_", "").lower())
        if m and known.get(m.group(1)):
            try:
                date.fromisoformat(r["Date"])  # build.py reads every key with date.fromisoformat
            except (TypeError, ValueError):
                raise ValueError(f"HLS CSV has a bad date {r['Date']!r} for {r['ID']}") from None
            mine.append((known[m.group(1)], r))
    if encoding is None:
        encoding = detect_encoding(r[c] for _, r in mine for k, c in cols.items() if k[1] == "NDVI")
    pooled = {pin: {} for pin, _ in mine}
    for pin, r in mine:
        for sensor in "LS":
            nd, fm = cols[(sensor, "NDVI")], cols[(sensor, "Fmask")]
            v = scaled_ndvi(r[nd], encoding)
            if v is not None and clear(r[fm]):  # the mask of this very point, sensor and date
                pooled[pin].setdefault(r["Date"], []).append(v)
    return {pin: {d: round(statistics.median(vs), 6) for d, vs in sorted(days.items())} for pin, days in pooled.items()}


def refresh(lines, pin_ids, raw_dir, encoding=None):
    """Parse a results CSV and rewrite data/raw/hls_<id>.json for EVERY pin, all or nothing. A malformed download (missing
    or incomplete columns, a malformed date, undecidable encoding) or one with no rows for some pin raises ValueError before any file is touched, so a failed
    import never replaces valid data. A pin with rows but no clear date is written as {}: zero coverage, no stale dates."""
    series = parse(lines, pin_ids, encoding)
    missing = sorted(set(pin_ids) - series.keys())
    if missing:
        raise ValueError("HLS download has no rows for " + ", ".join(missing) + "; nothing written")
    for sid, s in series.items():
        pathlib.Path(raw_dir, f"hls_{sid}.json").write_text(json.dumps(s), encoding="utf-8")
    return series
