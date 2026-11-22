"""Daily CHIRTS-ERA5 Tmax/Tmin (0.05 deg, CHC UCSB) at the 3 GSOD station points, 2011 to latest.
Reads only the needed HDF5 chunks of the yearly netCDF files by HTTP Range requests (no key):
https://data.chc.ucsb.edu/experimental/CHIRTS-ERA5/{tmax,tmin}/netcdf/daily/CHIRTS-ERA5.daily_{Tmax,Tmin}.YYYY.nc
(variable "temp", shape (days, 2600 lat, 7200 lon), chunks (19,137,379), gzip; the server answers 429 when hurried).
Writes OUTDIR/chirts_<name>.json: {"cell": [lat, lon], "days": {YYYYMMDD: [tmax, tmin]}}.
Needs: pip install h5py numpy. Run: python3 -I weather_station_chirts.py OUTDIR [first_year]"""
import datetime as dt, io, json, os, sys, time, urllib.error, urllib.request
import h5py, numpy as np

ST = {'cantho': (10.0833, 105.7167), 'camau': (9.1833, 105.15), 'rachgia': (10.0, 105.0833)}
URL = 'https://data.chc.ucsb.edu/experimental/CHIRTS-ERA5/{v}/netcdf/daily/CHIRTS-ERA5.daily_{V}.{y}.nc'


class RangeFile(io.RawIOBase):
    """Seekable read-only HTTP file: Range requests, block cache, backoff on 429."""
    def __init__(s, url, block=1 << 22):
        s.url, s.block, s.pos, s.cache = url, block, 0, {}
        s.size = int(s._req(method='HEAD').headers['Content-Length'])

    def _req(s, rng=None, method='GET'):
        for i in range(12):
            try:
                return urllib.request.urlopen(urllib.request.Request(s.url, headers={'Range': rng} if rng else {}, method=method), timeout=300)
            except urllib.error.HTTPError as e:
                if e.code != 429:
                    raise
            except OSError:
                pass
            time.sleep(min(60, 2 ** i))
        raise RuntimeError('gave up ' + s.url)

    def readable(s): return True
    def seekable(s): return True
    def tell(s): return s.pos

    def seek(s, off, wh=0):
        s.pos = off if wh == 0 else s.pos + off if wh == 1 else s.size + off
        return s.pos

    def _blk(s, b):
        if b not in s.cache:
            s.cache[b] = s._req(f'bytes={b * s.block}-{min(s.size, (b + 1) * s.block) - 1}').read()
        return s.cache[b]

    def readinto(s, buf):
        n = min(len(buf), s.size - s.pos)
        if n <= 0:
            return 0
        d = b''.join(s._blk(b) for b in range(s.pos // s.block, (s.pos + n - 1) // s.block + 1))
        off = s.pos % s.block
        buf[:n] = d[off:off + n]
        s.pos += n
        return n


def main(out, first=2011):
    path = os.path.join(out, 'chirts.json')
    res = json.load(open(path)) if os.path.exists(path) else {n: {'days': {}} for n in ST}
    for y in range(first, dt.date.today().year + 1):
        if all(any(d.startswith(str(y)) for d in res[n]['days']) for n in ST) and y < dt.date.today().year:
            continue
        cols = {}
        for v, V in (('tmax', 'Tmax'), ('tmin', 'Tmin')):
            h = h5py.File(RangeFile(URL.format(v=v, V=V, y=y)), 'r')
            lat, lon, t = h['latitude'][:], h['longitude'][:], h['time'][:]
            for n, (la, lo) in ST.items():
                iy, ix = int(np.abs(lat - la).argmin()), int(np.abs(lon - lo).argmin())
                res[n]['cell'] = [round(float(lat[iy]), 3), round(float(lon[ix]), 3)]
                cols[n, v] = h['temp'][:, iy, ix]
        for n in ST:
            for k, day in enumerate(t):
                d = (dt.date(1980, 1, 1) + dt.timedelta(days=int(day))).strftime('%Y%m%d')
                a, b = float(cols[n, 'tmax'][k]), float(cols[n, 'tmin'][k])
                if a > -999 and b > -999:
                    res[n]['days'][d] = [round(a, 2), round(b, 2)]
        json.dump(res, open(path, 'w'))
        print(y, {n: max(res[n]['days']) for n in ST}, flush=True)


if __name__ == '__main__':
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 2011)
