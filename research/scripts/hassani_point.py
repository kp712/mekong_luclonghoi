import struct,sys,json,urllib.request
def lzw(data):
    out=bytearray(); tab=None; bits=9; buf=0; nb=0; prev=None
    def reset():
        return {i:bytes([i]) for i in range(256)}
    tab=reset(); nxt=258
    for byte in data:
        buf=(buf<<8)|byte; nb+=8
        while nb>=bits:
            code=(buf>>(nb-bits))&((1<<bits)-1); nb-=bits; buf&=(1<<nb)-1
            if code==257: return bytes(out)
            if code==256:
                tab=reset(); nxt=258; bits=9; prev=None; continue
            if prev is None: ent=tab[code]
            else:
                ent=tab[code] if code in tab else prev+prev[:1]
                tab[nxt]=prev+ent[:1]; nxt+=1
            out+=ent; prev=ent
            if nxt+1>=(1<<bits) and bits<12: bits+=1
    return bytes(out)
U=sys.argv[1]
def rng(a,b):
    return urllib.request.urlopen(urllib.request.Request(U,headers={'Range':f'bytes={a}-{b}'}),timeout=120).read()
h=rng(0,15); off=struct.unpack('<I',h[4:8])[0]
d=rng(off,off+4095); n=struct.unpack('<H',d[:2])[0]
SZ={1:1,2:1,3:2,4:4,5:8,11:4,12:8,16:8}; FM={1:'B',3:'H',4:'I',12:'d',11:'f',16:'Q'}
tags={}
for i in range(n):
    t,ty,c=struct.unpack('<HHI',d[2+i*12:10+i*12]); v=d[10+i*12:14+i*12]; ln=SZ.get(ty,1)*c
    raw=v[:ln] if ln<=4 else None
    if raw is None:
        o=struct.unpack('<I',v)[0]
        raw=rng(o,o+ln-1) if ln<5_000_000 else None
    tags[t]=(ty,c,struct.unpack('<%d%s'%(c,FM[ty]),raw) if (raw and ty in FM) else raw)
g=lambda t:tags[t][2]
W,H=g(256)[0],g(257)[0]
print('W,H',W,H,'comp',g(259),'pred',tags.get(317,(0,0,None))[2],'bps',g(258),'fmt',tags.get(339,(0,0,None))[2],'tiled',322 in tags, 'nodata',tags.get(42113,(0,0,b''))[2])
scale=g(33550); tie=g(33922); print('rps',tags.get(278,(0,0,None))[2]);print('scale',scale[:2],'tie',tie)
x0,y0=tie[3],tie[4]; dx,dy=scale[0],scale[1]
tiled=322 in tags
pred=tags.get(317,(0,0,(1,)))[2][0]; comp=g(259)[0]; bps=g(258)[0]; fmt=tags.get(339,(0,0,(1,)))[2][0]
ch={(32,1):'I',(32,3):'f',(16,1):'H',(32,2):'i'}[(bps,fmt)]; B=bps//8
R=int(sys.argv[3]) if len(sys.argv)>3 else 5
import statistics
for name,lon,lat in json.loads(sys.argv[2]):
    x=int((lon-x0)/dx); y=int((y0-lat)/dy); vals=[]
    for yy in range(y-R,y+R+1):
        o,bc=g(273)[yy],g(279)[yy]; row=lzw(rng(o,o+bc-1))
        vs=struct.unpack('<%dI'%W,row[:W*4])
        vals+=[v*0.001 for v in vs[x-R:x+R+1] if v<4e9]
    n=(2*R+1)**2
    print(f"{name:12s} valid {len(vals)}/{n}", (f"median {statistics.median(vals):.2f} min {min(vals):.2f} max {max(vals):.2f}" if vals else ""))
