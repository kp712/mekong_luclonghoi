"""GSOD station Tmax/Tmin vs NASA POWER at the same point, 2011-2025 (research/research_notes/.../weather_et0.md).
Inputs in the cwd: g_<GSOD id>_<year>.csv from https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/<year>/<id>.csv
and pw_<name>.json from the POWER daily point API (T2M_MAX,T2M_MIN, community=AG, 20110101-20251231) at the station lat/lon.
Run: python3 -I gsod_vs_power_tmax.py"""
import csv,json,sys,statistics as st
S={'cantho':'48912599999','camau':'48914099999','rachgia':'48907099999'}
for n,s in S.items():
    pw=json.load(open(f'pw_{n}.json'))['properties']['parameter']
    g={}
    for y in range(2011,2026):
        try: rows=list(csv.DictReader(open(f'g_{s}_{y}.csv',encoding='utf-8-sig')))
        except Exception: continue
        if not rows or 'DATE' not in rows[0]: continue
        for r in rows:
            d=r['DATE'].replace('-','')
            mx,mn=float(r['MAX']),float(r['MIN'])
            g[d]=((mx-32)*5/9 if mx<9000 else None,(mn-32)*5/9 if mn<9000 else None)
    for i,var in enumerate(['T2M_MAX','T2M_MIN']):
        pairs=[(g[d][i],v) for d,v in pw[var].items() if d in g and g[d][i] is not None and v>-900]
        o=[a for a,b in pairs]; m=[b for a,b in pairs]
        diff=[b-a for a,b in pairs]
        r=st.correlation(o,m)
        rmse=(sum(x*x for x in diff)/len(diff))**.5
        print(n,var,'n',len(pairs),'bias %.2f rmse %.2f r %.2f obsmean %.2f'%(st.mean(diff),rmse,r,st.mean(o)))
        if i==0:
            yrs=sorted({d[:4] for d in g})
            ho=sum(a>=35 for a,b in pairs); hm=sum(b>=35 for a,b in pairs)
            p95=sorted(o)[int(.95*len(o))]; p95m=sorted(m)[int(.95*len(m))]
            print('   days>=35 obs',ho,'power',hm,'over',len(pairs),'days; p95 obs %.1f power %.1f; max obs %.1f power %.1f'%(p95,p95m,max(o),max(m)))
    pairs=[(g[d][0],v) for d,v in pw['T2M_MAX'].items() if d in g and g[d][0] is not None and v>-900]
    yrs=sorted({d[:4] for d in g})
    print('  years',yrs[0],'-',yrs[-1],len(yrs),'| obs>=34',sum(a>=34 for a,b in pairs),'obs>=33',sum(a>=33 for a,b in pairs),'power>=36',sum(b>=36 for a,b in pairs),'sd obs %.2f power %.2f'%(st.pstdev([a for a,b in pairs]),st.pstdev([b for a,b in pairs])))
    # monthly mean Tmax bias by calendar month
    from collections import defaultdict
    mm=defaultdict(list)
    for d,v in pw['T2M_MAX'].items():
        if d in g and g[d][0] is not None and v>-900: mm[d[4:6]].append(v-g[d][0])
    print('  monthly Tmax bias', ' '.join('%s:%+.1f'%(k,st.mean(x)) for k,x in sorted(mm.items())))

# Cold-snap nights: Tmin at least 4.2 C below the previous day's Tmin.
import csv,json,datetime as dt
S={'cantho':'48912599999','camau':'48914099999','rachgia':'48907099999'}
for n,s in S.items():
    pw=json.load(open(f'pw_{n}.json'))['properties']['parameter']['T2M_MIN']
    g={}
    for y in range(2011,2026):
        rows=list(csv.DictReader(open(f'g_{s}_{y}.csv',encoding='utf-8-sig')))
        if not rows or 'DATE' not in rows[0]: continue
        for r in rows:
            v=float(r['MIN'])
            if v<9000: g[r['DATE'].replace('-','')]=(v-32)*5/9
    o=m=both=0
    for d in g:
        p=(dt.datetime.strptime(d,'%Y%m%d')-dt.timedelta(days=1)).strftime('%Y%m%d')
        if p in g and d in pw and p in pw and pw[d]>-900 and pw[p]>-900:
            a=g[p]-g[d]>=4.2; b=pw[p]-pw[d]>=4.2; o+=a; m+=b; both+=a and b
    print(n,'cold-snap nights obs',o,'power',m,'both',both)
