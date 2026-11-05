"""Génère les calques de neige (PNG transparents 154 x 111 mm, 300 dpi) du recto et du verso de la carte de voeux.
Usage : python3 neige.py   (nécessite node + playwright : voir rendre.cjs)"""
import math, random, subprocess, os
from PIL import Image
W, H = 154, 111
ARM = '<path d="M0 0 L0 -46 M0 -32 L-10 -42 M0 -32 L10 -42 M0 -19 L-7.5 -27 M0 -19 L7.5 -27" />'
ARMS = ''.join(f'<g transform="rotate({a})">{ARM}</g>' for a in range(0, 360, 60))
def flake(x, y, s, r, o, sw=4.2, col='#fff'):
    return (f'<svg style="position:absolute;left:{x-s/2:.2f}mm;top:{y-s/2:.2f}mm;width:{s:.2f}mm;height:{s:.2f}mm;opacity:{o:.2f};transform:rotate({r:.0f}deg);overflow:visible" viewBox="-50 -50 100 100">'
            f'<g fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ARMS}</g></svg>')
def dot(x, y, d, o): return f'<span style="position:absolute;left:{x-d/2:.2f}mm;top:{y-d/2:.2f}mm;width:{d:.2f}mm;height:{d:.2f}mm;border-radius:50%;background:#fff;opacity:{o:.2f};box-shadow:0 0 {d:.1f}mm rgba(255,255,255,.55)"></span>'
def spark(x, y, s, o=.95, col='#FFE9A8'):
    return (f'<svg style="position:absolute;left:{x-s/2:.2f}mm;top:{y-s/2:.2f}mm;width:{s:.2f}mm;height:{s:.2f}mm;opacity:{o}" viewBox="-10 -10 20 20"><defs><radialGradient id="g{int(x*10)}{int(y*10)}"><stop offset="0" stop-color="{col}" stop-opacity=".9"/><stop offset="1" stop-color="{col}" stop-opacity="0"/></radialGradient></defs>'
            f'<circle r="9.5" fill="url(#g{int(x*10)}{int(y*10)})"/><path d="M0 -8 L1.6 -1.6 L8 0 L1.6 1.6 L0 8 L-1.6 1.6 L-8 0 L-1.6 -1.6 Z" fill="#FFF8DD"/></svg>')
def bulb(x, y, r=1.05, col='#FFD36B'):
    return (f'<span style="position:absolute;left:{x-r*3:.2f}mm;top:{y-r*3:.2f}mm;width:{r*6:.2f}mm;height:{r*6:.2f}mm;border-radius:50%;background:radial-gradient(circle,{col} 0%,{col} 16%,rgba(255,211,107,.55) 30%,rgba(255,211,107,0) 70%)"></span>'
            f'<span style="position:absolute;left:{x-r*.55:.2f}mm;top:{y-r*.55:.2f}mm;width:{r*1.1:.2f}mm;height:{r*1.1:.2f}mm;border-radius:50%;background:#FFF6D6"></span>')
def inrect(x, y, rects, pad=0):
    return any(a - pad <= x <= c + pad and b - pad <= y <= d + pad for a, b, c, d in rects)

def scene(seed, excl, zones_flakes, zones_dots, n_dots, extra=''):
    rnd = random.Random(seed); out = []
    for (x0, y0, x1, y1, smin, smax, n, omin, omax) in zones_flakes:
        k = 0; tries = 0
        while k < n and tries < 400:
            tries += 1; x = rnd.uniform(x0, x1); y = rnd.uniform(y0, y1); s = rnd.uniform(smin, smax)
            if inrect(x, y, excl, s / 2): continue
            out.append(flake(x, y, s, rnd.uniform(0, 60), rnd.uniform(omin, omax), sw=4.2 if s > 6 else 5.4)); k += 1
    for _ in range(n_dots):
        for _t in range(40):
            x = rnd.uniform(1, W - 1); y = rnd.uniform(1, H - 1)
            if any(a <= x <= c and b <= y <= d for a, b, c, d in zones_dots): break
        else: continue
        out.append(dot(x, y, rnd.choice([.5, .7, .9, 1.2, 1.6]), rnd.uniform(.35, .85)))
    return ''.join(out) + extra

# ---- recto : texte (9..112, 8..58), rig (103..132, 8..67) à éviter ; sol à partir de y = 67
excl_r = [(9, 8, 112, 58), (102, 6, 133, 68), (0, 67, W, H)]
fl_r = [(4, 2, 150, 8, 3.5, 6.5, 7, .55, .85), (134, 9, 152, 62, 4, 9, 5, .5, .85), (9, 59, 100, 66, 3, 5, 3, .5, .8), (84, 12, 101, 56, 3.5, 6, 2, .5, .8)]
dots_r = [(0, 0, W, 66)]
sp_r = spark(141, 13, 4.5) + spark(96, 61, 3.6) + spark(8, 63, 3.2)
recto = scene(5, excl_r, fl_r, dots_r, 26, sp_r)
# ---- verso : message (9..141, 9..42) à éviter ; casques à éviter
excl_v = [(9, 9, 141, 43), (66, 48, 90, 66), (96, 34, 132, 72)]
fl_v = [(4, 1.5, 150, 8.5, 3.5, 6, 9, .6, .9), (3, 44, 47, 96, 8, 16, 7, .55, .9), (40, 40, 66, 100, 4, 8, 4, .5, .85),
        (92, 44, 152, 106, 3.5, 7, 6, .4, .7), (110, 9, 152, 33, 3.5, 6, 0, .5, .8)]
dots_v = [(0, 0, 9, H), (0, 43, W, H), (141, 0, W, 43)]
# guirlande : trois festons en haut, ampoules dorées
sw = ''; bulbs = ''
pts = [(-2, 4.2), (50, 4.2), (102, 4.2), (156, 4.2)]
for i in range(3):
    xa, ya = pts[i]; xb, yb = pts[i + 1]
    sw += f'<path d="M{xa} {ya} Q{(xa+xb)/2} {ya+6.8} {xb} {yb}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".28"/>'
    for k in range(1, 6):
        t = k / 6; x = (1 - t) ** 2 * xa + 2 * (1 - t) * t * ((xa + xb) / 2) + t * t * xb; y = (1 - t) ** 2 * ya + 2 * (1 - t) * t * (ya + 6.8) + t * t * yb
        bulbs += bulb(x, y + .5, 1.0, '#FFD36B' if (i + k) % 2 == 0 else '#FFE9A8')
garland = f'<svg style="position:absolute;left:0;top:0;width:{W}mm;height:{H}mm" viewBox="0 0 {W} {H}">{sw}</svg>' + bulbs
sp_v = spark(120, 52, 4.2) + spark(52, 62, 4) + spark(24, 96, 3.6) + spark(147, 80, 3.2) + spark(134, 100, 3)
verso = scene(9, excl_v, fl_v, dots_v, 70, sp_v + garland)

for name, body in (('recto', recto), ('verso', verso)):
    open(f'neige_{name}.html', 'w').write(f'<!doctype html><meta charset="utf-8"><style>html,body{{margin:0;background:transparent}}.p{{position:relative;width:{W}mm;height:{H}mm;overflow:hidden}}</style><div class="p">{body}</div>')
js = '''const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
for(const n of ['recto','verso']){const pg=await b.newPage({viewport:{width:583,height:420},deviceScaleFactor:3.125});await pg.goto('file://'+process.cwd()+'/neige_'+n+'.html');await pg.waitForTimeout(500);
await pg.screenshot({path:'photos/neige_'+n+'.png',omitBackground:true,clip:{x:0,y:0,width:582.05,height:419.5}});await pg.close()}await b.close()})();'''
open('neige.cjs', 'w').write(js)
subprocess.run(['node', 'neige.cjs'], check=True)
for n in ('recto', 'verso'):
    im = Image.open(f'photos/neige_{n}.png').convert('RGBA').resize((1819, 1311), Image.LANCZOS); im.save(f'photos/neige_{n}.png'); print(n, im.size)
    os.remove(f'neige_{n}.html')
