"""Probe Vinh Long XMAN bulletin URLs by date pattern (HEAD, threaded). Usage: salt_probe_vilo.py START END [times]"""
import sys, datetime as dt, subprocess, json
from concurrent.futures import ThreadPoolExecutor
B = "https://thanhduc.vinhlong.gov.vn/Portals/1216/VILO_XMAN_%s_%s.pdf"
def head(u):
    r = subprocess.run(["curl","-s","-m","25","-o","/dev/null","-I","-w","%{http_code}",u],capture_output=True,text=True)
    return u, r.stdout
def main():
    a, b = (dt.date.fromisoformat(x) for x in sys.argv[1:3])
    times = (sys.argv[3] if len(sys.argv) > 3 else "1700").split(",")
    urls = []
    d = a
    while d <= b:
        urls += [B % (d.strftime("%Y%m%d"), t) for t in times]; d += dt.timedelta(1)
    with ThreadPoolExecutor(16) as ex:
        res = list(ex.map(head, urls))
    hits = [u for u, c in res if c == "200"]
    codes = {}
    for u, c in res: codes[c] = codes.get(c, 0) + 1
    print(json.dumps({"codes": codes, "hits": hits}, indent=0))
main()
