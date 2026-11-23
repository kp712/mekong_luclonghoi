"""How fragile is the ranking? Move each team-estimate constant by +-20% and count how often the best rotation changes.

Run: python pipeline/sensitivity.py   (needs docs/data/sites.json from build.py; changes nothing)
Water and income do not use these constants, so they are taken from sites.json. Soil, weather & salt and pests are
recomputed with the nudged constant. Match = mean of the five scores (equal priorities).
"""
import json
import sys

import build
import salinity

SHIFT = 0.2


def baseline():
    sites = json.loads(build.OUT.read_text(encoding="utf-8"))["sites"]
    rots = {r["id"]: r for r in json.loads((build.HERE / "rotations.json").read_text(encoding="utf-8"))["rotations"]}
    inputs = []
    for s in sites:
        power = build.read_power(s["id"])
        rain = json.loads((build.RAW / "chirps.json").read_text(encoding="utf-8"))[s["id"]]
        clim = build.climate(power, s["lat"], build.typical_year, rain)
        sal, _ = salinity.at(s)
        rows = []
        for c in s["cards"]:
            v = c["variants"][c["crop_default"]] if "variants" in c else c
            rot = dict(rots[c["id"]])
            if "variants" in c:
                k = c["crop_default"]
                rot.update(crop=k, kc_u=build.KC_U[k], legume_codes=["U"] if k == "mungbean" else [])
            rows.append((c["id"], rot, v["scores"]))
        inputs.append((s["id"], clim, sal, rows))
    return inputs


def ranks(inputs):
    out = {}
    for sid, clim, sal, rows in inputs:
        tot = {}
        for rid, rot, sc in rows:
            soil, _ = build.score_soil(rot)
            ws, _ = build.score_weather_salt(rot, clim, sal)
            pests, _ = build.score_pests(rot, clim)
            parts = [sc["water"], sc.get("income"), soil, ws, pests]
            parts = [p for p in parts if p is not None]
            tot[rid] = sum(parts) / len(parts)
        out[sid] = sorted(tot, key=lambda r: -tot[r])
    return out


def with_const(name, fn):
    """Apply fn to a module constant (or a key of a dict constant), return a restore function."""
    if isinstance(name, tuple):
        d, k = getattr(build, name[0]), name[1]
        old = d[k]
        d[k] = fn(old)
        return lambda: d.__setitem__(k, old)
    old = getattr(build, name)
    setattr(build, name, fn(old))
    return lambda: setattr(build, name, old)


def main():
    inputs = baseline()
    base = ranks(inputs)
    tests = [("TOL", "TOL"), ("HEAT_REF", "HEAT_REF"), ("BRACKISH_SOIL", "BRACKISH_SOIL"), ("SOIL_DRY_MONTHS", "SOIL_DRY_MONTHS")]
    cases = [(n, n) for _, n in tests]
    for k in build.SOIL_W:
        cases.append((f"SOIL_W[{k}]", ("SOIL_W", k)))
    for i, n in enumerate(("salt", "heat", "canal")):
        cases.append((f"WS_W[{n}]", ("WS_W", i)))
    cases += [("PESTS break_weight", ("PESTS", "break_weight"))]
    print(f"{'constant':22} {'shift':>6}  top-1 changes  order changes (of {len(base)} pins)")
    worst = []
    for label, target in cases:
        for sign in (-SHIFT, SHIFT):
            if isinstance(target, tuple) and target[0] == "WS_W":
                old = build.WS_W
                w = list(old)
                w[target[1]] *= 1 + sign
                build.WS_W = tuple(w)
                restore = lambda old=old: setattr(build, "WS_W", old)
            else:
                restore = with_const(target, lambda x, s=sign: x * (1 + s))
            try:
                new = ranks(inputs)
            finally:
                restore()
            top = sum(new[s][0] != base[s][0] for s in base)
            order = sum(new[s] != base[s] for s in base)
            worst.append((top, order, label, sign))
            print(f"{label:22} {sign:+6.0%}  {top:>13}  {order:>13}")
    fragile = sorted({(l) for t, o, l, _ in worst if t})
    print("\nconstants that can change a pin's best rotation:", ", ".join(fragile) or "none")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
