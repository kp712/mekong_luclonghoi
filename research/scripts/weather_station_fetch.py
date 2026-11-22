"""Fetch daily series at the 3 GSOD station points for research/research_notes/.../weather_station_test.md.
Writes into OUTDIR: pw_<name>.json (NASA POWER), om_<model>_<name>.json (Open-Meteo archive, era5 / era5_land),
g_<GSOD id>_<year>.csv (NCEI GSOD). Files already present are skipped, so rerun after a rate-limit error.
Run: python3 -I weather_station_fetch.py OUTDIR"""
import os, sys, time, urllib.request, urllib.error

ST = {'cantho': ('48912599999', 10.0833, 105.7167), 'camau': ('48914099999', 9.1833, 105.15), 'rachgia': ('48907099999', 10.0, 105.0833)}
END = time.strftime('%Y-%m-%d')
POWER = ('https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN'
         '&community=AG&latitude={lat}&longitude={lon}&start=20110101&end={end}&format=JSON')
OM = ('https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date=2011-01-01&end_date={end}'
      '&daily=temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&timezone=Asia%2FBangkok&models={model}')
GSOD = 'https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/{y}/{sid}.csv'


def get(url, path):
    if os.path.exists(path):
        return
    try:
        with urllib.request.urlopen(url, timeout=300) as r:
            data = r.read()
    except urllib.error.HTTPError as e:
        print('FAIL', e.code, url, e.read()[:200])
        return
    except OSError as e:  # connection reset etc.: skip, rerun later
        print('FAIL', e, url)
        return
    open(path, 'wb').write(data)
    print('ok', path, len(data))


out = sys.argv[1]
for n, (sid, lat, lon) in ST.items():
    for y in range(2011, int(END[:4]) + 1):
        get(GSOD.format(y=y, sid=sid), os.path.join(out, f'g_{sid}_{y}.csv'))
    get(POWER.format(lat=lat, lon=lon, end=END.replace('-', '')), os.path.join(out, f'pw_{n}.json'))
    for model in ('era5', 'era5_land'):
        get(OM.format(lat=lat, lon=lon, end=END, model=model), os.path.join(out, f'om_{model}_{n}.json'))
