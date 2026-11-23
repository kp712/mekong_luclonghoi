"""Head-to-head: GSOD stations vs NASA POWER, ERA5, ERA5-Land, CHIRTS-ERA5 (and the Open-Meteo API where fetched).
Inputs in DIR (from weather_station_fetch.py, weather_station_era5_s3.py, weather_station_chirts.py).
Prints the tables used in research/research_notes/Mekong app data source alternatives/weather_station_test.md.
Run: python3 weather_station_compare.py DIR   (imports pipeline/build.py for et0_penman and ra)"""
import csv, datetime as dt, json, math, os, statistics as st, sys
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'pipeline'))
from build import et0_penman, ra  # the app's own FAO-56 formula

D = sys.argv[1]
ST = {'cantho': ('48912599999', 10.0833), 'camau': ('48914099999', 9.1833), 'rachgia': ('48907099999', 10.0)}
DRY, WET = {2, 3, 4}, {6, 7, 8, 9, 10, 11}
F = lambda x: (x - 32) * 5 / 9
day = lambda s: dt.date(int(s[:4]), int(s[4:6]), int(s[6:]))


def gsod(sid):
    g = {}
    for y in range(2011, 2027):
        p = os.path.join(D, f'g_{sid}_{y}.csv')
        if not os.path.exists(p):
            continue
        for r in csv.DictReader(open(p, encoding='utf-8-sig')):
            mx, mn, tm, td, ws = (float(r[k]) for k in ('MAX', 'MIN', 'TEMP', 'DEWP', 'WDSP'))
            if mx < 9000 and mn < 9000:
                g[r['DATE'].replace('-', '')] = {'tmax': F(mx), 'tmin': F(mn), 'tmean': F(tm) if tm < 9000 else None,
                                                  'reported_max': r['MAX_ATTRIBUTES'].strip() == '', 'nobs': int(r['TEMP_ATTRIBUTES'])}
    return g


def sources(n):
    s = {}
    p = json.load(open(os.path.join(D, f'pw_{n}.json')))['properties']['parameter']
    s['POWER'] = {d: {'tmax': v, 'tmin': p['T2M_MIN'][d], 'rh': p['RH2M'][d], 'u2': p['WS2M'][d], 'rs': p['ALLSKY_SFC_SW_DWN'][d]}
                  for d, v in p['T2M_MAX'].items() if v > -900 and p['T2M_MIN'][d] > -900}
    for m, lab in (('copernicus_era5', 'ERA5'), ('copernicus_era5_land', 'ERA5-Land')):
        f = os.path.join(D, f's3_{m}_{n}.json')
        if os.path.exists(f):
            j = json.load(open(f))
            s[lab] = j['days']
            s[lab + ' cell'] = (j['cell'], j['note'])
    f = os.path.join(D, 'chirts.json')
    if os.path.exists(f):
        j = json.load(open(f))[n]
        s['CHIRTS-ERA5'] = {d: {'tmax': a, 'tmin': b} for d, (a, b) in j['days'].items()}
        s['CHIRTS-ERA5 cell'] = (j.get('cell'), '')
    for m, lab in (('era5', 'OM-API ERA5'), ('era5_land', 'OM-API ERA5-Land')):
        f = os.path.join(D, f'om_{m}_{n}.json')
        if os.path.exists(f):
            j = json.load(open(f)); dd = j['daily']
            s[lab] = {t.replace('-', ''): {'tmax': a, 'tmin': b, 'et0': e} for t, a, b, e in
                      zip(dd['time'], dd['temperature_2m_max'], dd['temperature_2m_min'], dd['et0_fao_evapotranspiration']) if a is not None}
            s[lab + ' cell'] = ([j['latitude'], j['longitude']], 'API cell_selection=land')
    return s


def cold(series, dates):
    """Dates d where Tmin(d-1) - Tmin(d) >= 4.2 (both days present)."""
    out = set()
    for d in dates:
        p = (day(d) - dt.timedelta(days=1)).strftime('%Y%m%d')
        if p in series and series[p]['tmin'] - series[d]['tmin'] >= 4.2:
            out.add(d)
    return out


def corr_lag(g, s, lag):
    pr = []
    for d in g:
        e = (day(d) + dt.timedelta(days=lag)).strftime('%Y%m%d')
        if e in s:
            pr.append((g[d]['tmin'], s[e]['tmin']))
    return st.correlation(*zip(*pr))


TEMP = ['POWER', 'ERA5', 'ERA5-Land', 'CHIRTS-ERA5', 'OM-API ERA5', 'OM-API ERA5-Land']
for n, (sid, lat) in ST.items():
    g = gsod(sid)
    s = sources(n)
    have = [k for k in TEMP if k in s]
    common = sorted(d for d in g if all(d in s[k] for k in have))
    print(f'\n### {n}: {len(common)} common days {common[0]}..{common[-1]}; sources {have}')
    for k in have:
        if k + ' cell' in s:
            print(f'  {k} cell {s[k + " cell"]}')
    print('  Tmin day alignment r(lag0) / r(source next day):', {k: '%.2f/%.2f' % (corr_lag(g, s[k], 0), corr_lag(g, s[k], 1)) for k in have})
    gc = cold(g, common)
    print('| Source | Tmax bias Feb–Apr | Tmax bias Jun–Nov | Tmax RMSE | Tmax r | SD Tmax (stn %.2f) | Days ≥35 (stn %d) | Tmin bias Feb–Apr | Tmin bias Jun–Nov | Tmin RMSE | Cold snaps (stn %d): source / both |'
          % (st.pstdev(g[d]['tmax'] for d in common), sum(g[d]['tmax'] >= 35 for d in common), len(gc)))
    print('|---|---|---|---|---|---|---|---|---|---|---|')
    for k in have:
        x = s[k]
        b = lambda v, mon: st.mean(x[d][v] - g[d][v] for d in common if day(d).month in mon)
        rm = lambda v: math.sqrt(st.mean((x[d][v] - g[d][v]) ** 2 for d in common))
        sc = cold(x, common)
        print(f'| {k} | {b("tmax", DRY):+.2f} | {b("tmax", WET):+.2f} | {rm("tmax"):.2f} | {st.correlation([g[d]["tmax"] for d in common], [x[d]["tmax"] for d in common]):.2f} | '
              f'{st.pstdev(x[d]["tmax"] for d in common):.2f} | {sum(x[d]["tmax"] >= 35 for d in common)} | {b("tmin", DRY):+.2f} | {b("tmin", WET):+.2f} | {rm("tmin"):.2f} | {len(sc)} / {len(sc & gc)} |')
    # heat days on the subset where GSOD MAX is a reported maximum (no '*' = not derived from the synoptic hours)
    rep = [d for d in common if g[d]['reported_max']]
    print(f'  Days >=35 on {len(rep)} days with a reported (unflagged) station max: station {sum(g[d]["tmax"] >= 35 for d in rep)}; '
          + ', '.join(f'{k} {sum(s[k][d]["tmax"] >= 35 for d in rep)} (bias {st.mean(s[k][d]["tmax"] - g[d]["tmax"] for d in rep):+.2f})' for k in have) if rep else '  no reported-max days')
    print('  Station observations per day (median):', st.median(g[d]['nobs'] for d in common))
    drops = lambda x: [x[e]['tmin'] - x[d]['tmin'] for e, d in zip(common, common[1:]) if (day(d) - day(e)).days == 1]
    print('  Night-to-night Tmin drop: largest / nights >=3 C / nights >=2 C:',
          {k: '%.1f / %d / %d' % (max(v), sum(z >= 3 for z in v), sum(z >= 2 for z in v)) for k, v in [('station', drops(g))] + [(k, drops(s[k])) for k in have]})
    # monthly mean temperature ((Tmax+Tmin)/2), per calendar month over common days
    print('  Monthly mean T bias, (Tmax+Tmin)/2 source minus station, by calendar month; last col = RMSE of month-by-month means')
    for k in have:
        x = s[k]
        mb = defaultdict(list); ym = defaultdict(list)
        for d in common:
            e = (x[d]['tmax'] + x[d]['tmin']) / 2 - (g[d]['tmax'] + g[d]['tmin']) / 2
            mb[day(d).month].append(e); ym[d[:6]].append(e)
        rmse_m = math.sqrt(st.mean(st.mean(v) ** 2 for v in ym.values() if len(v) >= 20))
        print(f'  | {k} | ' + ' | '.join('%+.1f' % st.mean(mb[m]) for m in range(1, 13)) + f' | {rmse_m:.2f} |')

    # ET0, mm/day monthly means over 2011-2025 months where all ET0 series are complete
    et = defaultdict(dict)
    for d, v in s['POWER'].items():
        if v['rs'] > -900 and v['rh'] > -900 and v['u2'] > -900:
            et['POWER PM (app formula)'][d] = et0_penman(day(d), lat, v['tmax'], v['tmin'], v['rh'], v['u2'], v['rs'])
    if 'ERA5' in s:
        for d, v in s['ERA5'].items():
            et['ERA5 PM (app formula)'][d] = et0_penman(day(d), lat, v['tmax'], v['tmin'], v['rh'], v['u10'] * 4.87 / math.log(67.8 * 10 - 5.42), v['rs'])
    if 'OM-API ERA5' in s:
        et['Open-Meteo ERA5 et0_fao'] = {d: v['et0'] for d, v in s['OM-API ERA5'].items() if v['et0'] is not None}
    hg = lambda d, v: 0.0023 * 0.408 * ra(day(d), lat) * ((v['tmax'] + v['tmin']) / 2 + 17.8) * math.sqrt(max(v['tmax'] - v['tmin'], 0))
    et['Station Hargreaves'] = {d: hg(d, v) for d, v in g.items()}
    et['POWER Hargreaves'] = {d: hg(d, v) for d, v in s['POWER'].items()}
    if 'ERA5' in s:
        et['ERA5 Hargreaves'] = {d: hg(d, v) for d, v in s['ERA5'].items()}
    keys = list(et)
    months = defaultdict(lambda: defaultdict(list))
    for k in keys:
        for d, v in et[k].items():
            if '20110101' <= d <= '20251231':
                months[d[:6]][k].append(v)
    full = [ym for ym, v in months.items() if all(len(v[k]) >= 25 for k in keys)]
    print(f'  ET0 mm/day, calendar-month means over {len(full)} months where every series has >=25 days')
    print('  | Series | ' + ' | '.join(str(m) for m in range(1, 13)) + ' | year mm |')
    for k in keys:
        mm = [st.mean(st.mean(months[ym][k]) for ym in full if int(ym[4:]) == m) for m in range(1, 13)]
        print(f'  | {k} | ' + ' | '.join('%.2f' % v for v in mm) + ' | %d |' % sum(v * [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i] for i, v in enumerate(mm)))

# latency
print('\n### Latest date per source (any station)')
for n in ST:
    s = sources(n)
    print(n, {k: max(v) for k, v in s.items() if not k.endswith('cell')},
          'POWER rs last', max(d for d, v in s['POWER'].items() if v['rs'] > -900))
