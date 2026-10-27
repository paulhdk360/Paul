# Arrière-plans Teams Enedril (1920x1080) : python3 -I generer_arriere_plans.py
import re,subprocess,os
LG='../stand-geotherm-2027/00_Logo_vectoriel/'
def paths(f):
    s=open(LG+f).read();vb=re.search(r'viewBox="([^"]+)"',s).group(1).split()
    return float(vb[2]),float(vb[3]),re.search(r' d="([^"]+)"',s).group(1) if 'blanc' in f else None
Wb,Hb,D=paths('Enedril_logo_blanc_sans_baseline.svg')
couleur=open(LG+'Enedril_logo_couleur_sans_baseline.svg').read()
inner=re.search(r'<svg[^>]*>(.*)</svg>',couleur,re.S).group(1)
def logo_w(h,cls='lg'):return f'<svg class="{cls}" viewBox="0 0 {Wb} {Hb}" style="height:{h}px" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" fill-rule="evenodd" d="{D}"/></svg>'
def logo_c(h):return f'<svg viewBox="0 0 {Wb} {Hb}" style="height:{h}px" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'
def icon(w,op,extra=''):return f'<svg viewBox="0 0 345 {Hb}" style="position:absolute;width:{w}px;opacity:{op};{extra}" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" fill-rule="evenodd" d="{D}"/></svg>'
CSS="html,body{margin:0;width:1920px;height:1080px;overflow:hidden}.b{position:relative;width:1920px;height:1080px;font-family:'Ubuntu Mono',monospace;overflow:hidden}"
A=f'''<div class="b" style="background:linear-gradient(115deg,#08203F 0%,#08203F 40%,#0A4FA0 100%)">
{icon(760,.10,'right:-140px;top:-120px')}{icon(520,.07,'left:-170px;bottom:-190px')}
<div style="position:absolute;left:70px;top:60px">{logo_w(92)}</div>
<div style="position:absolute;left:70px;bottom:62px;color:#7CCBFF;font-size:30px;letter-spacing:5px;font-weight:bold">FISHING AND DRILLING SOLUTIONS</div>
<div style="position:absolute;right:70px;bottom:62px;color:#fff;font-size:34px;font-weight:bold;letter-spacing:2px">www.enedril.com</div>
<div style="position:absolute;right:70px;bottom:112px;width:70px;height:6px;background:#1CB2FE"></div></div>'''
B=f'''<div class="b" style="background:#EEF5FB">
<svg style="position:absolute;left:0;top:0" width="1920" height="1080"><polygon points="1180,1080 1920,640 1920,1080" fill="#0A4FA0"/><polygon points="1500,1080 1920,830 1920,1080" fill="#1CB2FE"/></svg>
<div style="position:absolute;left:70px;top:60px">{logo_c(92)}</div>
<div style="position:absolute;left:70px;bottom:62px;color:#194E9A;font-size:30px;letter-spacing:5px;font-weight:bold">FISHING AND DRILLING SOLUTIONS</div>
<div style="position:absolute;right:70px;bottom:62px;color:#fff;font-size:34px;font-weight:bold;letter-spacing:2px">www.enedril.com</div></div>'''
# trajectoire de puits
import math
pts=[]
for k in range(81):
    u=k/80;x=(1-u)**2*1560+2*u*(1-u)*1560+u*u*980;y=(1-u)**2*80+2*u*(1-u)*980+u*u*980;pts.append(f'{x:.1f},{y:.1f}')
ticks=''.join(f'<rect x="1790" y="{80+i*300}" width="40" height="3" fill="#8DB4E8"/><text x="1780" y="{90+i*300}" fill="#8DB4E8" font-size="26" text-anchor="end" font-family="Ubuntu Mono">{t}</text>' for i,t in enumerate(['0','1 000 m','2 000 m','3 000 m']))
C=f'''<div class="b" style="background:linear-gradient(180deg,#08203F,#0B2D57)">
<svg style="position:absolute;left:0;top:0" width="1920" height="1080"><rect x="1808" y="80" width="3" height="900" fill="#3E67A0"/>{ticks}
<polyline points="{' '.join(pts)}" fill="none" stroke="#1CB2FE" stroke-width="8" stroke-linecap="round"/><circle cx="980" cy="980" r="20" fill="#08203F" stroke="#1CB2FE" stroke-width="7"/></svg>
<div style="position:absolute;left:70px;top:60px">{logo_w(92)}</div>
<div style="position:absolute;left:70px;bottom:62px;color:#7CCBFF;font-size:30px;letter-spacing:5px;font-weight:bold">FISHING AND DRILLING SOLUTIONS</div></div>'''
for name,body in (('A_Marine',A),('B_Clair',B),('C_Trajectoire',C)):
    html=f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>'
    open(f'/tmp/tb_{name}.html','w').write(html)
    subprocess.run(['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','--headless','--no-sandbox','--hide-scrollbars','--force-device-scale-factor=1',f'--screenshot=/tmp/tb_{name}.png','--window-size=1920,1300',f'file:///tmp/tb_{name}.html'],capture_output=True)
    from PIL import Image
    Image.open(f'/tmp/tb_{name}.png').crop((0,0,1920,1080)).convert('RGB').save(f'Enedril_Teams_arriere_plan_{name}.jpg',quality=93)
