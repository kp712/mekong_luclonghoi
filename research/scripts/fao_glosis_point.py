import struct,sys,zlib,urllib.request

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
    r=urllib.request.Request(U,headers={'Range':f'bytes={a}-{b}'}); return urllib.request.urlopen(r,timeout=60).read()
h=rng(0,65535)
assert h[:2]==b'II' and struct.unpack('<H',h[2:4])[0]==43
off=struct.unpack('<Q',h[8:16])[0]; n=struct.unpack('<Q',h[off:off+8])[0]
SZ={1:1,2:1,3:2,4:4,5:8,12:8,16:8,17:8,18:8,6:1,7:1,8:2,9:4,10:8,11:4}
FM={1:'B',2:'c',3:'H',4:'I',16:'Q',12:'d',11:'f',8:'h',9:'i',17:'q'}
tags={}
for i in range(n):
    e=h[off+8+i*20:off+28+i*20]; t,ty,c=struct.unpack('<HHQ',e[:12]); v=e[12:20]
    ln=SZ[ty]*c
    if ln>8:
        o=struct.unpack('<Q',v)[0]; data=h[o:o+ln] if o+ln<=len(h) else rng(o,o+ln-1)
    else: data=v[:ln]
    tags[t]=(ty,c,struct.unpack('<%d%s'%(c,FM[ty]),data) if ty in FM else data)
g=lambda t:tags[t][2]
W,H=g(256)[0],g(257)[0]; comp=g(259)[0]; pred=g(317)[0] if 317 in tags else 1
print('W,H',W,H,'comp',comp,'pred',pred,'planar',g(284)[0] if 284 in tags else None,'bps',g(258),'fmt',g(339),'tiled',324 in tags,'tags',sorted(tags))
for lon,lat in [(105.0809,10.0125),(105.98,9.33),(106.20,9.52)]:
    px=(lon-102.1429394)/0.0022457; py=(23.3903145-lat)/0.0022457; x,y=int(px),int(py)
    tw,th=g(322)[0],g(323)[0]; tpr=-(-W//tw); idx=(y//th)*tpr+x//tw
    o,bc=g(324)[idx],g(325)[idx]
    raw=rng(o,o+bc-1); d=lzw(raw) if comp==5 else zlib.decompress(raw)
    ix=(y%th)*tw+(x%tw)
    if pred==3: # float predictor: bytes shuffled, horizontal diff
        rows=bytearray()
        for r in range(th):
            row=bytearray(d[r*tw*4:(r+1)*tw*4])
            for k in range(4,tw*4): row[k]=(row[k]+row[k-4*0-1] )&255 if False else row[k]
            rows+=row
        # proper: byte-wise cumulative sum across row (stride 1), then deshuffle
        out=bytearray()
        for r in range(th):
            row=bytearray(d[r*tw*4:(r+1)*tw*4])
            for k in range(1,len(row)): row[k]=(row[k]+row[k-1])&255
            out+=bytes(row[j*tw+c] for c in range(tw) for j in range(4))
        d=bytes(out)
    elif pred==2: raise SystemExit('pred2')
    v=struct.unpack('<f',d[ix*4:ix*4+4])[0]
    print(lon,lat,'pixel',x,y,'tile',idx,'bytes',bc,'value',v)
