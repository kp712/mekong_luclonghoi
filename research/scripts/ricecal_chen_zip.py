"""List members of the Chen/Liang 20 m Monsoon Asia zips (Zenodo 15124936) by HTTP range read of the zip central directory (no full download).
Run: python3 -I research/scripts/ricecal_chen_zip.py"""
import struct, urllib.request, urllib.parse
R = "https://zenodo.org/api/records/15124936/files/%s/content"
def rng(u, a, b): return urllib.request.urlopen(urllib.request.Request(u, headers={"Range": f"bytes={a}-{b}"}), timeout=90).read()
for name in ("PADDYINTENSITY.zip", "PADDYPLANTINGDATE.zip"):
    u = R % name
    req = urllib.request.Request(u, headers={"Range": "bytes=0-0"}); size = int(urllib.request.urlopen(req, timeout=90).headers["Content-Range"].split("/")[1])
    tail = rng(u, size - 200000, size - 1)
    i = tail.rfind(b"PK\x06\x06")  # zip64 end record
    if i >= 0:
        n, csz, coff = struct.unpack("<QQQ", tail[i + 32:i + 56])
    else:
        j = tail.rfind(b"PK\x05\x06"); n, csz, coff = struct.unpack("<HII", tail[j + 10:j + 20])[0], *struct.unpack("<II", tail[j + 12:j + 20])
    cd = rng(u, coff, coff + csz - 1); p = 0; names = []
    while p < len(cd) and cd[p:p + 4] == b"PK\x01\x02":
        nl, el, cl = struct.unpack("<HHH", cd[p + 28:p + 34]); csize, usize = struct.unpack("<II", cd[p + 20:p + 28])
        names.append((cd[p + 46:p + 46 + nl].decode(), csize)); p += 46 + nl + el + cl
    print(name, size, "members", len(names)); [print("  ", x) for x in names[:12]]
