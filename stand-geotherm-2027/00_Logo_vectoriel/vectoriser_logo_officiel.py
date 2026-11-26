# Vectorise le VRAI logo Enedril (logo_officiel_vrai_2000x449.webp) : formes tracées (potrace), couleurs à plat comme l'original
# (3 bandes dans les lettres, 3 secteurs bleus, signature + 2 carrés bleu / rouge). python3 vectoriser_logo_officiel.py
import numpy as np,potrace
from PIL import Image
NAVY,MID,CYAN,RED='#0451A4','#0183CB','#02ADF0','#E61D23'
S=2                                                     # sur-échantillonnage pour des courbes précises
im=Image.open('logo_officiel_vrai_2000x449.webp').convert('RGB');W,H=im.size
a=np.array(im).astype(int)
def trace(mask):
    big=np.array(Image.fromarray((mask*255).astype('uint8')).resize((W*S,H*S),Image.LANCZOS))>127
    pl=potrace.Bitmap(~big).trace(turdsize=40,alphamax=1.0,opticurve=True,opttolerance=0.4)
    out=[]
    for c in pl:
        s=c.start_point;d=[f'M{s.x/S:.2f},{s.y/S:.2f}']
        for g in c.segments:
            if g.is_corner:d.append(f'L{g.c.x/S:.2f},{g.c.y/S:.2f}L{g.end_point.x/S:.2f},{g.end_point.y/S:.2f}')
            else:d.append(f'C{g.c1.x/S:.2f},{g.c1.y/S:.2f} {g.c2.x/S:.2f},{g.c2.y/S:.2f} {g.end_point.x/S:.2f},{g.end_point.y/S:.2f}')
        out.append(''.join(d)+'Z')
    return ''.join(out)
dark=(255-a.min(2)).astype(float)/255                    # 0 = blanc, 1 = couleur pleine
# mesures sur l'image
yy,xx=np.mgrid[0:H,0:W]
dist=lambda c:((a-np.array(c))**2).sum(2)
cls=np.stack([dist((4,81,164)),dist((1,131,203)),dist((2,173,240)),dist((230,29,35))]).argmin(0)
ink=dark>.5
icon=ink&(xx<420)                               # pastille
word=ink&(xx>=420)&(yy<372)                              # lettres
tag=ink&(yy>=380)&(xx>=420)&(xx<1850)                              # signature
sq1=ink&(yy>=380)&(xx>=1850)&(xx<1930)
sq2=ink&(yy>=380)&(xx>=1930)
d_icon=[trace(icon&(cls==k)) for k in (0,1,2)]           # secteurs : navy, mid, cyan
d_word=trace(word);d_tag=trace(tag);d_sq1=trace(sq1);d_sq2=trace(sq2)
d_silh=trace(icon|word)
B1,B2=161,255.5                                          # limites des bandes dans les lettres
def svg(white,baseline):
    h=H if baseline else 410
    s=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}" width="{W}" height="{h}"><defs>'
    p1,p2=B1/H,B2/H
    s+=f'<linearGradient id="bands" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{H}"><stop offset="0" stop-color="{NAVY}"/><stop offset="{p1:.5f}" stop-color="{NAVY}"/><stop offset="{p1:.5f}" stop-color="{MID}"/><stop offset="{p2:.5f}" stop-color="{MID}"/><stop offset="{p2:.5f}" stop-color="{CYAN}"/><stop offset="1" stop-color="{CYAN}"/></linearGradient></defs>'
    if white:
        s+=f'<path fill="#FFFFFF" fill-rule="evenodd" d="{d_silh}"/>'
        if baseline:s+=f'<path fill="#FFFFFF" fill-rule="evenodd" d="{d_tag}"/><path fill="#FFFFFF" d="{d_sq1}"/><path fill="{RED}" d="{d_sq2}"/>'
    else:
        for col,d in zip((NAVY,MID,CYAN),d_icon):s+=f'<path fill="{col}" fill-rule="evenodd" d="{d}"/>'
        s+=f'<path fill="url(#bands)" fill-rule="evenodd" d="{d_word}"/>'
        if baseline:s+=f'<path fill="{NAVY}" fill-rule="evenodd" d="{d_tag}"/><path fill="{NAVY}" d="{d_sq1}"/><path fill="{RED}" d="{d_sq2}"/>'
    return s+'</svg>'
for white in (False,True):
    for base in (True,False):
        n='Enedril_logo_'+('blanc' if white else 'couleur')+('' if base else '_sans_baseline')+'.svg'
        open(n,'w').write(svg(white,base));print(n)
