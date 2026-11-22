# Data Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four data refinements in one PR. (1) The El Niño salt view includes 2015–16, the last very strong El Niño. (2) More published rice–shrimp profit figures, and (3) mung bean profit figures. (4) NASA POWER and GPM fetched to the latest month available, with the climate averages running to Nov 2025.

**Architecture:** All four changes are inputs plus constants in `pipeline/`, followed by one `python3 pipeline/build.py` that rewrites `docs/data/sites.json`, `docs/data/provinces.json` and `docs/app/builder.js`. App code changes only where text names a year range. Profit figures come from a research note that a background subagent is writing (`research/data/profit-shrimp-mungbean.json`, in the exact shape of `pipeline/profits.json` `figures` items).

**Tech Stack:** Python 3 pipeline (`build.py`, `salinity.py`, `fetch_power.py`, `fetch_gpm.py`); plain-function tests `python3 pipeline/test_build.py`; Playwright phone check `node tools/ui_check.js`.

**Spec:** the "Decisions (spec)" section below (agreed with the user in a question session, 2026-11-22).

## Decisions (spec)

1. **2016 in the El Niño salt view, always.** The salt window `salinity.SALT_SEASONS` becomes `(2016, 2026)`. 2016 is an El Niño season (DJF ONI 2.50), so only the El Niño view changes: its averages now use 2016, 2019, 2020 and 2024. The typical view is unchanged. No "like 2016" line and no condition on the NOAA outlook. Every text that says the salt seasons are 2017–2026 or "the last 10 dry seasons" now says 2016–2026 or "11 dry seasons".
2. **Profit figures for `shrimp`, `rice_rs` (the rice in a rice–shrimp field) and `mungbean`.** These are published figures from the Mekong Delta with harvest years 2020–2026, under the same rule as the existing figures. Each key prefers the figure closest to the farmer: Sóc Trăng (including now Cần Thơ city) first, then the coastal rice–shrimp belt (Bạc Liêu, Cà Mau, Kiên Giang, Trà Vinh, Bến Tre), then the rest of the Delta. The `profits.json` rule's year range widens from 2020–2025 to 2020–2026. `build.py` already takes the median of qualifying figures when a key has at least 2. Mung bean gets an income score only if it ends up with at least 1 figure; with none, it stays unscored and the reason is written down.
3. **Climate to the latest month available.** `fetch_power.py` asks NASA POWER for days up to today (missing days come back as −999, and `climate()` already skips them). `fetch_gpm.py` asks for months up to the current year (unpublished months return 404 and are skipped, as today). The averages still use whole Dec–Nov seasons: `PERIOD` ends on **30 Nov 2025**, which gives 25 seasons (16 typical, 9 El Niño, since 2024–25 is not El Niño). `RECENT` stays the newest 10 seasons. The "latest 12 months" rain view (`EXTRA.latest`) picks up the newest GPM months on its own. NASA HLS (ends Nov 2024) is not refreshed.
4. **One PR**, merged right away (house rule).

## Global Constraints

- Every user-facing string gets EN and VI. Keep `strings.js`, `app.js` and `index.html` text pairs in step.
- Never show model or map values as measured readings, and say where every number comes from.
- Profit figures: `kind` is one of `survey | government | university | cooperative | farmer | news`. A figure that does not fit the rule has `fallback: true`. `source.verified` is true only for a quote that was read on the page. Units are `crop` or `year`.
- Python edits to Vietnamese text: read and write with `encoding="utf-8"`. For multi-line edits, use a Python string replace with an assert, not sed.
- Any diff in `docs/data/` after a build is a real change: commit it. Never edit `docs/app/builder.js` by hand.
- `python3 pipeline/test_build.py` (all ok) after every task. `node tools/ui_check.js` (15 ok, exit 0) after Tasks 2 and 4.
- No model names in commits, code or PR. End commits with the session's attribution lines.
- Locate code by grep; line numbers are from main at 87f0cdc.

## Review Focus

1. **Ngã Năm's El Niño level.** With 2016's 23.2‰ the canal average becomes about 10.7‰, but `salinity.json` overrides Ngã Năm to `level: "low"` (sluices). The pin must stay low in both views. Task 1 asserts this.
2. **A season cut off by missing data.** If GPM has no Oct or Nov 2025 when it is fetched, `climate()` raises "missing GPM month". The build must fail loudly, never average a partial season. Task 2 asserts that GPM covers every month of `PERIOD`.
3. **`typical_year` across the new edge.** March 2025 now falls inside `PERIOD` and is typical (ONI −0.46). December 2025 is outside. Task 2's test pins both.
4. **Duplicate profit figures.** A research figure can repeat an existing source (same URL and key), and counting it twice would skew the median. Task 3 asserts no (key, url, value) repeats.
5. **A single-farmer or revenue-only figure counted as qualifying.** Task 3 asserts that every non-fallback figure has a qualifying `kind` and a `year` in 2020–2026.

---

### Task 1: 2016 in the El Niño salt view

**Files:**
- Modify: `pipeline/salinity.py:22-23` (`SALT_SEASONS` and its comment)
- Modify: `pipeline/salinity.json` `_readme` ("dry seasons ending 2017-2026" → "2016-2026")
- Modify: `pipeline/test_build.py` `test_salt_window` (around line 970)
- Modify text: `CLAUDE.md:39`, `README.md:78,80`, `SOURCES.md:21,156,206,207`
- Rebuild: `docs/data/sites.json`, `docs/data/provinces.json`, `docs/app/builder.js`

**Interfaces:**
- Produces: `salinity.SALT_SEASONS == (2016, 2026)`. `salinity.station_salt(DATA, "tran_de", True)` returns `(avg, 2016, 2024, 4)`.

- [ ] **Step 1: Update the test to the new window (it fails)**

In `test_salt_window`:
```python
assert salinity.SALT_SEASONS == (2016, 2026)
...
_, first, last, _ = salinity.station_salt(salinity.DATA, "tran_de", False)
assert first == 2017 and last >= 2025, (first, last)   # unchanged: 2016 is El Niño
_, first, last, n = salinity.station_salt(salinity.DATA, "tran_de", True)
assert (first, last, n) == (2016, 2024, 4)  # El Niño dry seasons 2016, 2019, 2020, 2024
```
Add at the end of the same test (Review Focus 1):
```python
s = {x["id"]: x for x in json.loads((build.DOCS / "data" / "sites.json").read_text(encoding="utf-8"))["sites"]}
assert s["nga_nam"]["salinity"]["level"] == "low" and s["nga_nam"]["elnino"]["salinity"]["level"] == "low"
```
(Use whatever constant `test_build.py` already uses for the `docs/data` path, and the El Niño view's actual key in `sites.json`: grep for `"elnino"` in a site to confirm.)

- [ ] **Step 2: Run it and see it fail**

Run: `python3 pipeline/test_build.py 2>&1 | grep -A3 salt_window`
Expected: FAIL on `SALT_SEASONS == (2016, 2026)`.

- [ ] **Step 3: Set `SALT_SEASONS = (2016, 2026)`** and update the comment above it ("2016-2026, so 2015-16, the last very strong El Niño, and the KTTV bulletins (2024-2026) fall inside it"). Update the `salinity.json` `_readme` year range.

- [ ] **Step 4: Rebuild and run the tests**

Run: `python3 pipeline/build.py && python3 pipeline/test_build.py`
Expected: all ok. If another test pinned a 2017–2026 average (for example the "El Niño seasons were saltier" assert, or a station average), check the new value against `data/raw/salinity_stations.json` by hand and update the pinned number, not the rule. Note each pin's El Niño station average before and after (from `sites.json` `elnino` salinity notes) for Step 5.

- [ ] **Step 5: Update the text**

- `CLAUDE.md:39`: "The seasons used are 2016–2026".
- `README.md:78`: "salt uses the dry seasons 2016–2026". `README.md:80`: El Niño averages rest on "3–4" dry seasons (Khánh Hòa has 3: no 2024 reading).
- `SOURCES.md:21`: "over the last 11 dry seasons (2016–2026 …)". "El Niño averages on 3–4". Add one sentence: "2016–2026 since Nov 2026, so the El Niño view includes 2015–16, the last very strong El Niño (DJF ONI 2.50), like the 2026–27 forecast", with the before → after El Niño averages from Step 4 for any pin whose level or months changed (or "no pin's level changed").
- `SOURCES.md:156`: "Over the 11 dry seasons (2016–2026)". Re-check the "4 of the 5 pins" count against the rebuilt averages.
- `SOURCES.md:206-207`: the same range and counts.

- [ ] **Step 6: Commit**

```bash
git add pipeline/salinity.py pipeline/salinity.json pipeline/test_build.py docs/data docs/app/builder.js CLAUDE.md README.md SOURCES.md
git commit -m "El Niño salt view includes 2015–16 (salt seasons 2016–2026)"
```

---

### Task 2: NASA POWER and GPM to the latest month; averages to Nov 2025

**Files:**
- Modify: `pipeline/fetch_power.py:3,23` (end date = today, docstring)
- Modify: `pipeline/fetch_gpm.py:2,31` (`YEARS = range(2000, date.today().year + 1)`, docstring)
- Modify: `pipeline/build.py:65-67` (`PERIOD` end `date(2025, 11, 30)`; `RECENT` start computed as the newest 10 seasons: `date(PERIOD[1].year - 10, 12, 1)`), `build.py:79` (the `ONI_SRC` title from `PERIOD`, not literal text)
- Modify: `pipeline/test_build.py:64` (the `typical_year` assert) and add `test_gpm_covers_period`
- Data: `data/raw/power_*.json.gz`, `data/raw/gpm.json`, `data/raw/oni.txt`, `data/raw/enso_outlook.json` (all rewritten by the fetchers)
- Modify text (2024 → 2025, season counts 15/24 → 16/25): `docs/app/app.js:90,102,263,268`, `docs/app/strings.js:7,12,71,76`, `docs/index.html:120`, `README.md:14,47,48,78`, `SOURCES.md:10,11,16,17,19,149,161,206`, `CLAUDE.md:30`
- Rebuild: `docs/data/*`, `docs/app/builder.js`

**Interfaces:**
- Consumes: Task 1's rebuilt data (rebuild again on top).
- Produces: `build.PERIOD == (date(2000, 12, 1), date(2025, 11, 30))`; `build.RECENT == (date(2015, 12, 1), date(2025, 11, 30))`.

- [ ] **Step 1: Write the failing tests**

In the test around `test_build.py:64`:
```python
assert build.typical_year(date(2017, 6, 1)) and not build.typical_year(date(2016, 3, 1))
assert build.typical_year(date(2025, 3, 1)) and not build.typical_year(date(2025, 12, 1))  # 2024-25 typical; Dec 2025 outside PERIOD
assert build.PERIOD[1] == date(2025, 11, 30) and build.RECENT[0] == date(2015, 12, 1)
```
New test (Review Focus 2):
```python
def test_gpm_covers_period():
    gpm = json.loads((build.RAW / "gpm.json").read_text(encoding="utf-8"))
    need = {f"{y}-{m:02d}" for y in range(build.PERIOD[0].year, build.PERIOD[1].year + 1) for m in range(1, 13)
            if build.PERIOD[0] <= date(y, m, 1) <= build.PERIOD[1]}
    for pid, months in gpm.items():
        assert need <= set(months), (pid, sorted(need - set(months))[:3])
```

- [ ] **Step 2: Run and see them fail**

Run: `python3 pipeline/test_build.py 2>&1 | grep -B1 -A3 "FAIL\|Error"`
Expected: the `PERIOD` assert fails, and `test_gpm_covers_period` fails after `PERIOD` moves (GPM ends 2025-09 today).

- [ ] **Step 3: Change the fetchers and `PERIOD`/`RECENT`/`ONI_SRC`** as listed under Files. In `fetch_power.py` the URL's `end=` comes from `date.today().strftime("%Y%m%d")`.

- [ ] **Step 4: Fetch**

Run: `python3 pipeline/fetch_power.py`, then `python3 pipeline/fetch_gpm.py`. Rerun `fetch_gpm.py` until it reports no missing months; "not published yet, skipped" for the newest months is expected. The Earthdata login is already set in the environment. Before going on, check that `gpm.json` has 2025-10 and 2025-11 for every point. If NASA has not published them, stop and report: do not move `PERIOD` past the last whole season GPM covers.

- [ ] **Step 5: Rebuild and run the tests**

Run: `python3 pipeline/build.py && python3 pipeline/test_build.py`
Expected: all ok. Tests that pin climate-derived numbers (GPM/POWER cross-check, season counts, scores) may move. Update a pinned number only after checking it follows from the new season. Record the new `gpm_check` figures (correlation, yearly-total gap, months compared) from `sites.json` for Step 6.

- [ ] **Step 6: Update the text** in the files listed. "Dec 2000 – Nov 2024" → "Dec 2000 – Nov 2025", "2000–2024" → "2000–2025", "12/2000 – 11/2024" → "12/2000 – 11/2025", "15 … seasons" → "16", "24 seasons" → "25", "288 months" → "300 months". In `SOURCES.md` also update the cross-check numbers from Step 5 and the MODIS line if it says what the averages use. Leave `SOURCES.md:148` (the 1984–2024 drought ranking) as it is: it is a dated finding. `CLAUDE.md:30`: POWER "(Dec 2000 – latest; averages use Dec 2000 – Nov 2025)".

- [ ] **Step 7: Phone check**

Run: `node tools/ui_check.js`
Expected: 15 ok, exit 0.

- [ ] **Step 8: Commit**

```bash
git add pipeline/fetch_power.py pipeline/fetch_gpm.py pipeline/build.py pipeline/test_build.py data/raw docs CLAUDE.md README.md SOURCES.md
git commit -m "NASA POWER and GPM to the latest month; climate averages to Nov 2025"
```

---

### Task 3: Shrimp, rice–shrimp rice and mung bean profit figures

**Files:**
- Read: `research/profit-shrimp-mungbean.md`, `research/data/profit-shrimp-mungbean.json` (from the research subagent; already in the working tree)
- Modify: `pipeline/profits.json` (`figures`, `_readme`)
- Modify: `pipeline/test_build.py` (add `test_profit_figures_clean`)
- Modify text: `SOURCES.md` profit table (around lines 75–125) and its "Income" row (line 62) if the counts change; `README.md` wherever it quotes a profit median that moved
- Rebuild: `docs/data/*`, `docs/app/builder.js`

**Interfaces:**
- Consumes: research entries `{key, value, unit, place, year, kind, fallback, source: {title, url, note, verified}}`.
- Produces: `profits.json` `figures` with the new entries appended after the existing ones of the same key.

- [ ] **Step 1: Write the failing test** (Review Focus 4 and 5)

```python
def test_profit_figures_clean():
    figs = json.loads((build.HERE / "profits.json").read_text(encoding="utf-8"))["figures"]
    seen = [(f["key"], f["source"]["url"], f["value"]) for f in figs]
    assert len(seen) == len(set(seen)), "duplicate profit figure"
    for f in figs:
        assert f["unit"] in ("crop", "year") and f["kind"] in ("survey", "government", "university", "cooperative", "farmer", "news")
        if not f["fallback"]:
            assert f["kind"] in ("survey", "government", "university", "cooperative") and 2020 <= f["year"] <= 2026, f["place"]
            assert f["source"]["verified"], f["place"]
    assert any(f["key"] == "mungbean" for f in figs) or "mungbean (no checked figure" in \
        json.loads((build.HERE / "profits.json").read_text(encoding="utf-8"))["_readme"]
```
Run it. It should pass on today's data (the guard). Then go on to Step 2, which adds the data it guards.

- [ ] **Step 2: Merge the research figures**

Skip any entry that is already in `profits.json` (same key and URL) and any with `verified: false`. Re-check each entry's `kind` and `fallback` against the rule: a single farmer or an unnamed news figure is `fallback: true`, and a figure outside 2020–2026 or outside the Delta is fallback. In `_readme`, change "2020–2025" to "2020–2026". If mung bean gets at least one figure, drop "(no checked figure yet: its income is not scored)". Otherwise keep it and add one sentence naming what the search found.

- [ ] **Step 3: Rebuild and test**

Run: `python3 pipeline/build.py && python3 pipeline/test_build.py`
Expected: all ok. Pinned income scores, medians, profit ranges or confidence levels may change. Update them only after you've checked the new median by hand from the figures. Write down, for Step 4 and the PR: the before → after median per key, rice–shrimp's confidence and rank at each pin, and whether mung bean is now scored.

- [ ] **Step 4: Update `SOURCES.md`.** Add one table row per new figure, in the existing format, and update the medians and counts. In `README.md`, update any median that moved.

- [ ] **Step 5: Commit**

```bash
git add pipeline/profits.json pipeline/test_build.py docs/data docs/app/builder.js SOURCES.md README.md research/profit-shrimp-mungbean.md research/data/profit-shrimp-mungbean.json
git commit -m "More published rice–shrimp and mung bean profit figures (Mekong Delta, 2020–2026)"
```

---

### Task 4: Ship

**Files:**
- Modify: `docs/sw.js` (`CACHE = "mre-app-8"`)
- Modify: `plans/2026-11-21-handoff.md` (one line under Done; update "Facts worth not re-deriving": test count, any ranking change)

- [ ] **Step 1: Bump the cache** to `mre-app-8`, because `sites.json`, `builder.js` and app text changed.
- [ ] **Step 2: Full check.** Run `python3 pipeline/test_build.py` (all ok) and `node tools/ui_check.js` (15 ok, exit 0). Then `git diff main --stat -- docs/data` must show the rebuilt files.
- [ ] **Step 3: Handoff line.** "Data refresh (PR #N): El Niño salt view includes 2016 (window 2016–2026); POWER/GPM to latest, averages Dec 2000 – Nov 2025; profit figures for shrimp / rice–shrimp rice / mung bean (counts, medians, rank effect)". Note that HLS was not refreshed.
- [ ] **Step 4: Commit, push, PR** (draft → ready → merge with the full 40-character SHA). The PR body lists the before → after numbers from Tasks 1–3.
