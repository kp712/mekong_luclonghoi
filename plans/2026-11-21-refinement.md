# Repo refinement (2026-11-21)

Decided with the user (grilling session). Audit summary: tests 59 ok; build reproducible.

## PR 1 — bugs (fix all confirmed)
- [x] map.js homePad: hidden #areaDock gives negative pad → phone "Create field" shows empty map
- [x] sw.js: only / and index.html cached under the app key
- [x] El Niño % from sites.json outlook everywhere (dash.js, home.js); dashboard opens on El Niño only if outlook says likely
- [x] Plan Lab guide box closes with the drawer (app.js ~1300)
- [x] One field store (mre-fields vs mre-farm) + merge old
- [x] Offline chip clear of Tạo ruộng and date slider
- [x] Offline country map: errorTileUrl
- [x] Country month card counts shown points; Sóc Trăng labels only when zoomed in
- [x] Light / Dark / Auto theme in Settings, phone + desktop, default Auto
- [x] About credits Open-Meteo for the 7-day forecast
- [x] build.py writes builder.js (+ test)
- [x] Docs: pdfplumber install, 59 checks, Pages from main, old repo link

## PR 2 — declutter
- [x] Delete classic page, night map, old home screen, old app.js tour, ensureSkeleton, dead functions, Open-Meteo history + fetch script
- [x] POWER raw: keep Dec 2000–Nov 2024, gzip; fetch + build read .json.gz
- [x] One storage prefix mre- with migration
- [x] MIT (code) + CC BY 4.0 (content); footer line
- [x] README Vietnamese first then English; Issues as contact; hackathon text → one origin line; SOURCES stays English
- [x] Judge-facing app text reworded (show user each change first)
- [ ] Delete merged remote branches (list first); keep plans/ and pretty JSON
- [x] Update CLAUDE.md

## PR 3 — HLS
- [x] Run `python pipeline/appeears.py hls`; report results in SOURCES.md only (no app change)
