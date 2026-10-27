# Mur du fond : fond bleu + logo Enedril (vecteur issu du logo officiel). Lancer depuis ce dossier :
#   python3 -I generer_mur_logo.py
import re
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
BG=(0.0431,0.1961,0.3765)
svg=open('../00_Logo_vectoriel/Enedril_logo_blanc_sans_baseline.svg').read()
vb=[float(v) for v in re.search(r'viewBox="([^"]+)"',svg).group(1).split()]
d=re.search(r' d="([^"]+)"',svg).group(1)
toks=re.findall(r'[MLCZ]|-?\d+\.?\d*',d)
WALL_W,WALL_H=6000.0,2500.0           # mm : mur de fond de 6 m
LOGO_X,LOGO_Y,LOGO_W=2800.0,1010.0,2398.0   # position du logo sur le mur (mm, depuis le haut) : celle de l'aperçu validé
def draw(c,ox,scale):
    """scale : points PDF par mm du mur ; ox : abscisse (mm) du bord gauche de la page sur le mur"""
    k=LOGO_W/vb[2]
    def X(v):return (LOGO_X+v*k-ox)*scale
    def Y(v):return (WALL_H-(LOGO_Y+v*k))*scale
    p=c.beginPath();i=0
    while i<len(toks):
        t=toks[i]
        if t=='M':p.moveTo(X(float(toks[i+1])),Y(float(toks[i+2])));i+=3
        elif t=='L':p.lineTo(X(float(toks[i+1])),Y(float(toks[i+2])));i+=3
        elif t=='C':p.curveTo(*[(X if j%2==0 else Y)(float(toks[i+1+j])) for j in range(6)]);i+=7
        elif t=='Z':p.close();i+=1
        else:i+=1
    c.setFillColorRGB(1,1,1);c.drawPath(p,stroke=0,fill=1,fillMode=0)
def page(fn,w_mm,h_mm,ox,scale):
    c=canvas.Canvas(fn,pagesize=(w_mm*mm,h_mm*mm));c.setFillColorRGB(*BG);c.rect(0,0,w_mm*mm,h_mm*mm,stroke=0,fill=1)
    draw(c,ox,scale*mm);c.showPage();c.save()
page('Mur_du_fond_logo_ECHELLE_1-10_600x250.pdf',600,250,0,0.1)
for n in range(4):   # 4 panneaux visibles de 1 m, les 2 premiers mètres du mur sont derrière le rangement
    page(f'Mur_du_fond_4_panneaux_visibles/Mur_logo_panneau_{n+1}_1000x2500.pdf',1000,2500,2000+1000*n,1.0)
