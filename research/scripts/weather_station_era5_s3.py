"""Daily ERA5 and ERA5-Land series at the 3 GSOD station points, read from Open-Meteo's public S3 copy
(https://openmeteo.s3.amazonaws.com/data/copernicus_era5[_land]/<var>/year_YYYY.om and chunk_N.om, no key),
used because the Open-Meteo API daily quota was exhausted on the shared sandbox IP.
Hourly values are aggregated to local days (UTC+7, 17 UTC of the day before to 16 UTC).
Writes OUTDIR/s3_<model>_<name>.json: {"cell": [lat, lon], "days": {YYYYMMDD: {tmax, tmin, ...}}}.
ERA5-Land: if the nearest 0.1 cell is sea (NaN) the script takes the nearest land cell in a 5x5 window and says so.
Needs: pip install omfiles numpy. Run: python3 -I weather_station_era5_s3.py OUTDIR"""
import datetime as dt, json, os, sys, time, urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
import numpy as np, omfiles

BASE = 'https://openmeteo.s3.amazonaws.com/data/'
ST = {'cantho': (10.0833, 105.7167), 'camau': (9.1833, 105.15), 'rachgia': (10.0, 105.0833)}
MODELS = {'copernicus_era5': (0.25, ['temperature_2m', 'dew_point_2m', 'shortwave_radiation', 'wind_u_component_10m', 'wind_v_component_10m']),
          'copernicus_era5_land': (0.1, ['temperature_2m', 'dew_point_2m'])}
YEARS = range(2011, 2022)        # year_YYYY.om files exist to 2021
CHUNKS = range(904, 1000)        # chunk_N.om = hours N*504 .. +504 since 1970 (904 starts 2021-12-23)
EPOCH = dt.datetime(1970, 1, 1)


class HTTP:  # the two methods OmFileReader.from_fsspec needs
    def size(self, path):
        return int(urllib.request.urlopen(urllib.request.Request(path, method='HEAD'), timeout=120).headers['Content-Length'])

    def cat_file(self, path, start=None, end=None, **kw):
        for i in range(6):
            try:
                return urllib.request.urlopen(urllib.request.Request(path, headers={'Range': f'bytes={start}-{end - 1}'}), timeout=120).read()
            except OSError:
                time.sleep(2 ** i)
        raise RuntimeError(path)


def read(model, var, f, y, x, h=2):
    """Hourly values (hour since 1970 -> 5x5 window) from one file, or {} if it does not exist."""
    url = f'{BASE}{model}/{var}/{f}.om'
    try:
        r = omfiles.OmFileReader.from_fsspec(HTTP(), url)
    except Exception:
        return {}
    a = r[y - h:y + h + 1, x - h:x + h + 1, :]
    t0 = int((dt.datetime(int(f[5:]), 1, 1) - EPOCH).total_seconds() // 3600) if f.startswith('year') else int(f[6:]) * 504
    return {t0 + k: a[:, :, k] for k in range(a.shape[2])}


def fetch(model, var, lat, lon):
    res, _ = MODELS[model]
    y, x = round((lat + 90) / res), round((lon + 180) / res)
    files = [f'year_{yr}' for yr in YEARS] + [f'chunk_{c}' for c in CHUNKS]
    with ThreadPoolExecutor(8) as ex:
        parts = list(ex.map(lambda f: read(model, var, f, y, x), files))
    hours = {}
    for p in parts:  # year files first; chunks only fill hours not already present
        for k, v in p.items():
            if k not in hours and not np.all(np.isnan(v)):
                hours[k] = v
    return y, x, hours


def main(out):
    for name, (lat, lon) in ST.items():
        for model, (res, vars_) in MODELS.items():
            path = os.path.join(out, f's3_{model}_{name}.json')
            if os.path.exists(path):
                continue
            data = {}
            for var in vars_:
                y, x, data[var] = fetch(model, var, lat, lon)
                print(name, model, var, len(data[var]), 'hours', flush=True)
            # cell: nearest, else nearest non-NaN in the window (ERA5-Land coastal cells)
            sample = data['temperature_2m'][max(data['temperature_2m'])]
            ok = [(abs(i - 2) + abs(j - 2), i, j) for i in range(5) for j in range(5) if not np.isnan(sample[i, j])]
            _, i, j = min(ok)
            note = 'nearest cell' if (i, j) == (2, 2) else f'nearest cell is sea/no data; used cell offset ({i - 2},{j - 2})'
            cell = [round((y + i - 2) * res - 90, 3), round((x + j - 2) * res - 180, 3)]
            days = defaultdict(lambda: defaultdict(list))
            for var in vars_:
                for k, v in data[var].items():
                    loc = EPOCH + dt.timedelta(hours=k + 7)
                    days[loc.strftime('%Y%m%d')][var].append(float(v[i, j]))
            outd = {}
            for d, v in sorted(days.items()):
                if len(v['temperature_2m']) < 24:
                    continue
                t = v['temperature_2m']
                rec = {'tmax': max(t), 'tmin': min(t), 'tmean': sum(t) / 24, 'td': sum(v['dew_point_2m']) / 24}
                if 'shortwave_radiation' in v:
                    rec['rs'] = sum(v['shortwave_radiation']) * 3600 / 1e6  # W/m2 hourly means -> MJ/m2/day
                    rec['u10'] = sum((a * a + b * b) ** .5 for a, b in zip(v['wind_u_component_10m'], v['wind_v_component_10m'])) / 24
                    rec['rh'] = sum(100 * 10 ** (7.5 * td / (237.3 + td)) / 10 ** (7.5 * tt / (237.3 + tt)) for td, tt in zip(v['dew_point_2m'], t)) / 24
                outd[d] = {a: round(b, 3) for a, b in rec.items()}
            json.dump({'cell': cell, 'note': note, 'days': outd}, open(path, 'w'))
            print('wrote', path, cell, note, min(outd), max(outd), flush=True)


if __name__ == '__main__':
    main(sys.argv[1])
