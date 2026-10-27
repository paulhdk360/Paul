import numpy as np,potrace
from PIL import Image
im=Image.open('logo_officiel_source_2000px.webp').convert('RGBA');a=np.array(im)[:,:,3]
x0,x1,y0,y1=60,1940,815,1262
sub=a[y0:y1,x0:x1]
bm=potrace.Bitmap(sub<=128)
pl=bm.trace(turdsize=6,alphamax=1.0,opticurve=True,opttolerance=0.6)
def d_of(c):
    s=c.start_point;out=[f'M{s.x:.1f},{s.y:.1f}']
    for seg in c.segments:
        if seg.is_corner:out.append(f'L{seg.c.x:.1f},{seg.c.y:.1f}L{seg.end_point.x:.1f},{seg.end_point.y:.1f}')
        else:out.append(f'C{seg.c1.x:.1f},{seg.c1.y:.1f} {seg.c2.x:.1f},{seg.c2.y:.1f} {seg.end_point.x:.1f},{seg.end_point.y:.1f}')
    return ''.join(out)+'Z'
def bbox(c):
    xs=[c.start_point.x]+[p for seg in c.segments for p in ([seg.end_point.x]+([seg.c.x] if seg.is_corner else [seg.c1.x,seg.c2.x]))]
    ys=[c.start_point.y]+[p for seg in c.segments for p in ([seg.end_point.y]+([seg.c.y] if seg.is_corner else [seg.c1.y,seg.c2.y]))]
    return min(xs),max(xs),min(ys),max(ys)
G={'icon':[],'word':[],'tag':[]}
for c in pl:
    b=bbox(c);cx=(b[0]+b[1])/2;cy=(b[2]+b[3])/2
    g='icon' if cx<(420-x0) else ('tag' if cy>(1190-y0) else 'word')
    G[g].append((c,b))
print({k:len(v) for k,v in G.items()})
W,H=sub.shape[1],sub.shape[0];HW=(1190-y0)+5
join=lambda L:''.join(d_of(c) for c,b in L)
def svg(white,tag):
    h=H if tag else HW
    s=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}">'
    if white:
        s+=f'<path fill="#FFFFFF" fill-rule="evenodd" d="{join(G["icon"]+G["word"]+(G["tag"] if tag else []))}"/>'
    else:
        s+='<defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="%d" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0A4FA0"/><stop offset=".55" stop-color="#0A86D6"/><stop offset="1" stop-color="#01ADEE"/></linearGradient></defs>'%(1190-y0)
        for c,b in G['icon']:
            cx=(b[0]+b[1])/2;cy=(b[2]+b[3])/2
            col='#0A4FA0' if (cx<200 and cy<(1000-y0)) else ('#0F7FCB' if cx>230 and cy<(1000-y0)+60 else '#01ADEE')
            s+=f'<path fill="{col}" d="{d_of(c)}"/>'
        s+=f'<path fill="url(#g)" fill-rule="evenodd" d="{join(G["word"])}"/>'
        if tag:s+=f'<path fill="#0F7FCB" fill-rule="evenodd" d="{join(G["tag"])}"/>'
    return s+'</svg>'
open('Enedril_logo_blanc.svg','w').write(svg(True,True))
open('Enedril_logo_blanc_sans_baseline.svg','w').write(svg(True,False))
open('Enedril_logo_couleur.svg','w').write(svg(False,True))
open('Enedril_logo_couleur_sans_baseline.svg','w').write(svg(False,False))
