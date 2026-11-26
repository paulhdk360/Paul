# Stand 274 visual pack (English, A3 landscape) : python3 generer_visual_pack.py -> Stand274_Visual_Pack_EN.pdf
import os,subprocess
here=os.path.dirname(os.path.abspath(__file__))
s=96;ox=150;oy=70
X=lambda x:ox+x*s;Y=lambda y:oy+(6-y)*s
def R(x0,x1,y0,y1,fill,stroke='none',sw=1.5):return f'<rect x="{X(x0)}" y="{Y(y1)}" width="{(x1-x0)*s}" height="{(y1-y0)*s}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def C(x,y,r,fill,stroke='none'):return f'<circle cx="{X(x)}" cy="{Y(y)}" r="{r*s}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
def T(x,y,t,size=13,fill='#0B1B2E',anchor='middle',w=600,rot=0):
    r=f' transform="rotate({rot} {X(x)} {Y(y)})"' if rot else ''
    return f'<text x="{X(x)}" y="{Y(y)}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{w}"{r}>{t}</text>'
P=[R(-1.2,4.4,-0.8,6.8,'#F1F5F9'),R(0,3,0,6,'#6FA8E8'),R(3,3.14,0,6,'#08203F'),R(3.14,4.4,0,6,'#DCE3EA'),
R(2,3,4,6,'#F6F8FA','#0A4FA0',2.5),T(2.5,5,'STORAGE 2 × 1 m',12,'#51647A',rot=-90),
R(.55,1.13,4,6,'#FFFFFF','#0A4FA0',2.5),T(.84,5,'WELCOME BAR',12,'#0A4FA0',rot=-90),
C(.3,4.5,.18,'#0A4FA0'),C(.3,5.5,.18,'#0A4FA0'),
R(1.16,2.0,4.27,4.33,'#08203F'),R(1.16,2.0,5.67,5.73,'#08203F'),T(1.58,4.1,'Roll-up 1',11,'#08203F'),T(1.58,5.55,'Roll-up 2',11,'#08203F'),
R(.23,.47,3.08,3.52,'#08203F'),T(.7,3.3,'Brochures',11,'#08203F',anchor='start'),
C(.6,1.5,.36,'#FFFFFF','#0A4FA0'),T(.6,1.5,'High table',9.5,'#0A4FA0'),C(.6,.95,.18,'#0A4FA0'),C(.6,2.05,.18,'#0A4FA0'),
C(1.55,2.65,.45,'#EEF3F8','#9FB0C0'),T(1.55,2.65,'Table',12),
R(1.35,1.75,3.07,3.47,'#DCE3EA','#9FB0C0'),R(1.35,1.75,1.83,2.23,'#DCE3EA','#9FB0C0'),R(1.97,2.37,2.45,2.85,'#DCE3EA','#9FB0C0'),R(.73,1.13,2.45,2.85,'#DCE3EA','#9FB0C0'),
R(2.86,2.97,.07,.93,'#111111'),R(2.86,2.97,.07,.93,'none','#2FB34A',2),T(2.55,.5,'FIXNDRIL roll-up',11,'#1E8A36',w=700,rot=-90),
R(-.04,.04,0,6,'#00AEEF'),C(0,2,.07,'#51647A'),C(0,4,.07,'#51647A'),T(.17,.6,'Fascia 3 × 2 m',10.5,'#0A4FA0',anchor='start',rot=-90),
T(3.07,3,'BACK WALL 6 m (4 m visible)',12,'#FFFFFF',rot=-90,w=700),T(3.8,3,'Stands 275 / 286',12,'#51647A',rot=-90),
T(-.7,3,'MAIN AISLE',13,'#51647A',rot=-90,w=700),T(1.5,6.55,'NORTH · open side',12,'#51647A'),T(1.5,-.5,'SOUTH · open side',12,'#51647A'),
f'<line x1="{X(0)}" y1="{Y(-.3)}" x2="{X(3)}" y2="{Y(-.3)}" stroke="#51647A"/>'+T(1.5,-.17,'3.00 m',12,'#51647A',w=700)]
for y in (.5,1.5,2.5,3.5):P.append(R(2.72,3,y-.07,y+.07,'#F2B705'))
plan=''.join(P)
css='''@font-face{font-family:B;src:url(img/Barlow-Regular.ttf)}@font-face{font-family:B;font-weight:600;src:url(img/Barlow-SemiBold.ttf)}@font-face{font-family:BC;font-weight:700;src:url(img/BarlowCondensed-Bold.ttf)}
@page{size:420mm 297mm;margin:0}*{box-sizing:border-box}body{margin:0;font-family:B;color:#0B1B2E;font-size:16px}
.p{width:420mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;padding:34px 48px;background:#fff}
h1{font-family:BC;font-weight:700;font-size:56px;color:#0A4FA0;margin:0;line-height:1}h2{font-family:BC;font-weight:700;font-size:28px;color:#0A4FA0;margin:0 0 6px}
.k{font-size:15px;color:#51647A;margin:6px 0 18px}.bar{height:5px;width:70px;background:#E2231A;margin:10px 0 6px}
.ft{position:absolute;left:48px;right:48px;bottom:18px;font-size:12px;color:#51647A;display:flex;justify-content:space-between;border-top:1px solid #D5DEE8;padding-top:6px}
.c{background:#EAF3FB;border-radius:14px;padding:14px 16px}ul{margin:4px 0 0;padding-left:18px}li{margin:3px 0}
table{width:100%;border-collapse:collapse;font-size:15px}th{background:#0A4FA0;color:#fff;text-align:left;padding:8px 10px;font-weight:600}td{padding:8px 10px;border-bottom:1px solid #D5DEE8;vertical-align:top}'''
foot=lambda n:f'<div class="ft"><span>Enedril · Fishing and Drilling Solutions · info@enedril.fr · +33 (0)5 59 04 50 45 · www.enedril.com</span><span>Visual pack · page {n}</span></div>'
html=f'''<html><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="p"><div style="font-size:13px;color:#00AEEF;font-weight:600;letter-spacing:1px">GEOTHERM 2027 · OFFENBURG · 25-26 FEBRUARY 2027</div><h1>STAND 274 · VISUAL PACK</h1><div class="bar"></div>
<div class="k">3 × 6 m (18 m²), end of row, three open sides · Enedril with co-exhibitor Fixndril · 2 Enedril roll-ups + 1 Fixndril roll-up · blue carpet · storage face "Our services"</div>
<img src="img/stand3d.jpg" style="width:100%;border-radius:14px;display:block;height:850px;object-fit:cover;object-position:center 55%">{foot(1)}</div>
<div class="p"><h1>FLOOR PLAN AND LAYOUT</h1><div class="bar"></div><div class="k">3 × 6 m = 18 m² · end of row · back wall of 6 m shared with stands 275 and 286 · north at the top, main aisle on the left</div>
<div style="display:flex;gap:30px"><svg width="768" height="912" viewBox="0 0 640 760" font-family="B">{plan}</svg>
<div style="flex:1"><div class="c"><h2>Layout</h2><ul><li><b>System stand type 3</b> (18 m²): 2 × 1 m storage cabin with door, table with 4 chairs, 2 counters, leaflet stand, partition walls, blue carpet.</li><li><b>Welcome bar</b>: the 2 counters end to end (2 m), printed front with logo and QR code, 2 high stools.</li><li><b>High table</b> with 2 stools in the south-west corner, <b>meeting table</b> with 4 chairs against the back wall, <b>brochure stand</b> between the bar and the high table.</li><li><b>Storage face</b> (2 × 2.5 m): 2 printed panels with the "Our services" visual.</li><li><b>2 Enedril roll-ups</b> (Directional Drilling and MWD BOOST), perpendicular to the storage face and standing against it.</li><li><b>Fixndril</b> (co-exhibitor): 1 roll-up against the back wall, south end. Supplied by Fixndril.</li><li><b>Fascia</b> 3 × 2 m above the west opening: 1 central lettering with services, 2 logo-only lettering.</li><li><b>Lighting</b>: 4 wall spots for the back wall (yellow), 3 HQ/LED spots on the mesh strip.</li></ul></div></div></div>{foot(2)}</div>
<div class="p"><h1>FILES TO PRINT</h1><div class="bar"></div><div class="k">All files are vector PDF at final size, with the official Enedril logo. No bleed or crop marks: to be confirmed with Messe Offenburg or the printer. The 6 m back wall is also provided at 1:10.</div>
<table><tr><th>Item</th><th>Size</th><th>Qty</th><th>Messe Offenburg pos.</th><th>File</th></tr>
<tr><td><b>Back wall</b> · dark blue, white logo</td><td>1000 × 2500 mm</td><td>4</td><td>105058</td><td>01_Back_wall/Back_wall_panel_1…4_1000x2500.pdf</td></tr>
<tr><td><b>Storage face</b> · "Our services", white background</td><td>1000 × 2500 mm</td><td>2</td><td>105058</td><td>02_Storage_face_Our_services/Our_services_panel_1…2_1000x2500.pdf</td></tr>
<tr><td><b>Fascia lettering</b> · A: logo + services (centre)</td><td>2000 × 299 mm</td><td>1</td><td>107090 / 107091</td><td>03_Fascia/Fascia_A_logo_and_services_2000x299.pdf</td></tr>
<tr><td><b>Fascia lettering</b> · B: logo only (left and right)</td><td>2000 × 299 mm</td><td>2</td><td>107090</td><td>03_Fascia/Fascia_B_logo_only_2000x299.pdf</td></tr>
<tr><td><b>Welcome bar front</b> · logo + QR code</td><td>2000 × 900 mm</td><td>1</td><td>105059 (2 counter fronts)</td><td>04_Bar_front/Bar_front_2000x900.pdf</td></tr>
<tr><td><b>Roll-up</b> · Directional Drilling (with QR code)</td><td>850 × 2000 mm</td><td>1</td><td>own printer</td><td>05_Roll_ups/Rollup_Directional_Drilling_850x2000.pdf</td></tr>
<tr><td><b>Roll-up</b> · MWD BOOST</td><td>850 × 2000 mm</td><td>1</td><td>own printer</td><td>05_Roll_ups/Rollup_MWD_BOOST_850x2000.pdf</td></tr>
<tr><td><b>Roll-up</b> · Fixndril (co-exhibitor)</td><td>850 × 2000 mm</td><td>1</td><td>supplied by Fixndril</td><td>not included</td></tr></table>
<div class="c" style="margin-top:20px"><h2>Notes</h2><ul><li><b>QR code</b>: real and tested, it opens <b>https://www.enedril.com</b> (on the Directional Drilling roll-up and on the welcome bar front).</li><li><b>Logo</b>: vector files and 6000 px PNG (colour and white) are in 06_Logo, with the official source image.</li><li>Fonts are embedded in the PDFs: nothing to install to open or print them.</li><li>Order deadline for printed panels and fascia lettering: 11 December 2026 (Messe Offenburg). Set-up: 23-24 February 2027.</li></ul></div>{foot(3)}</div></body></html>'''
open(os.path.join(here,'pack.html'),'w').write(html)
js=f"const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://{here}/pack.html');await p.waitForTimeout(800);await p.pdf({{path:'{here}/Stand274_Visual_Pack_EN.pdf',width:'420mm',height:'297mm',printBackground:true}});await b.close()}})()"
open(os.path.join(here,'_pdf.cjs'),'w').write(js);subprocess.run(['node',os.path.join(here,'_pdf.cjs')],check=True,env={**os.environ,'NODE_PATH':'/opt/node-tools/node_modules'});os.remove(os.path.join(here,'_pdf.cjs'))
