"""Bilingual text helpers shared by build.py and salinity.py: {"en", "vi"} lines, Vietnamese decimal commas, month names."""

MONTHS = {"en": "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(),
          "vi": [f"T{i}" for i in range(1, 13)]}


def whole(x):
    """4.0 -> "4", 0.5 -> "0.5"."""
    return str(int(x)) if x == int(x) else str(x)


def vi_num(x):
    """Vietnamese writes decimals with a comma: 3.0 -> "3,0"."""
    return str(x).replace(".", ",")


def line(en, vi):
    return {"en": en, "vi": vi}


def km_text(km):
    """Distance as the app writes it: one decimal under 10 km, whole km from 10 km (as the tile in docs/app/vn.js)."""
    return f"{round(km, 1):.1f}" if km < 10 else str(int(km + 0.5))


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
