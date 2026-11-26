# Visuels à imprimer du stand 274 (anglais), avec le VRAI logo Enedril (vecteur issu du logo officiel) et un QR code réel vers www.enedril.com.
# python3 generer_visuels.py  -> roll-ups, enseignes, face du bar, face du placard (2 panneaux)
import os,subprocess,segno
here=os.path.dirname(os.path.abspath(__file__));os.chdir(here)
LOGO_DIR='../00_Logo_vectoriel/'
def logo(white=False,base=True):
    n='Enedril_logo_'+('blanc' if white else 'couleur')+('' if base else '_sans_baseline')+'.svg'
    s=open(LOGO_DIR+n).read();return s.replace('<svg ','<svg preserveAspectRatio="xMinYMid meet" style="display:block;width:100%;height:100%" ',1).replace('width="2000" height="449"','').replace('width="2000" height="410"','')
def qr(color='#08203F'):
    q=segno.make('https://www.enedril.com',error='h',micro=False)
    return q.svg_inline(dark=color,light=None,border=0,scale=1,omitsize=True).replace('<svg ','<svg style="width:100%;height:100%;display:block" ',1)
NAVY,BLUE,SKY,CYAN,PALE='#08203F','#0A4FA0','#0F7FCB','#02ADF0','#F1F5F9'
CSS='''*{box-sizing:border-box;margin:0;padding:0}html,body{width:%(W)spx;height:%(H)spx;overflow:hidden;background:#fff}
.pg{position:absolute;left:0;top:0;width:%(DW)spx;height:%(DH)spx;transform-origin:0 0;transform:scale(%(K)s) translateX(%(TX)spx);font-family:'Ubuntu Mono',monospace;background:#fff;overflow:hidden}
.a{position:absolute}.b{font-weight:700}svg{overflow:visible}'''
def render(fn,w_mm,h_mm,dw,dh,body,tx=0,vis=None):
    px=lambda mm:mm/25.4*96
    css=CSS%dict(W=px(w_mm),H=px(h_mm),DW=dw,DH=dh,K=px(w_mm)/(vis or dw),TX=tx)
    html=f'<html><head><meta charset="utf-8"><style>{css}</style></head><body><div style="position:absolute;left:0;top:0;width:{px(w_mm)}px;height:{px(h_mm)}px;overflow:hidden;contain:paint"><div class="pg">{body}</div></div></body></html>'
    open('_t.html','w').write(html)
    js=f"const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://{here}/_t.html');await p.waitForTimeout(300);await p.pdf({{path:'{here}/{fn}',width:'{w_mm}mm',height:'{h_mm}mm',printBackground:true,pageRanges:'1'}});await b.close()}})()"
    open('_t.cjs','w').write(js);subprocess.run(['node','_t.cjs'],check=True,env={**os.environ,'NODE_PATH':'/opt/node-tools/node_modules'})
def poly(pts,fill):return f'<svg class="a" style="left:0;top:0" width="1" height="1"><polygon points="{" ".join(f"{x},{y}" for x,y in pts)}" fill="{fill}"/></svg>'
def T(x,y,t,size,color,bold=False,w=None,extra=''):return f'<div class="a{" b" if bold else ""}" style="left:{x}px;top:{y}px;{f"width:{w}px;" if w else "white-space:nowrap;"}font-size:{size}px;line-height:1.2;color:{color};{extra}">{t}</div>'
def R(x,y,w,h,fill,extra=''):return f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:{fill};{extra}"></div>'
def LG(x,y,w,h,white=False,base=True):return f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">{logo(white,base)}</div>'
RW,RH=850,2000;LR=2000/449     # rapport du logo complet
def rollup_dir():
    b=poly([(0,0),(850,0),(850,475),(0,745)],NAVY)+poly([(520,0),(850,0),(850,330)],'#1486D8')+poly([(640,0),(850,0),(850,210)],'#0D4FA0')+poly([(700,0),(850,0),(850,120)],'#29A9F5')
    b+=poly([(0,720),(850,470),(850,500),(0,750)],CYAN)+R(0,750,850,1100,PALE)
    b+=poly([(0,745),(850,475),(850,500),(0,750)],CYAN)
    b+=R(0,0,0,0,'transparent')+LG(50,50,330,74,True,False)
    b+=T(50,170,'DIRECTIONAL',118,'#fff',True)+T(50,300,'DRILLING',118,'#1CA7F5',True)
    b+=T(50,470,'High-precision trajectories<br>for complex wells.',27,'#C3D1E2')
    b+=T(50,800,'Motors, RSS and MWD, with in-house well planning.',27,BLUE,True,w=760)
    rows=[('3-1/8" to 9-5/8"','PDM motors, high-temperature power sections'),('RSS','push-the-bit and point-the-bit'),('up to 200°C','MWD kits with HT electronics'),('Innova · DrillScan','torque and drag, hydraulics, anti-collision')]
    for i,(h,d) in enumerate(rows):
        y=960+i*190;b+=R(50,y,750,4,CYAN)+T(50,y+28,h,58,BLUE,True)+T(50,y+112,d,22,'#51647A')
    b+=T(50,1745,'ALSO: survey equipment (LWD, gyro), turbodrilling, jar placement, non-magnetic equipment, slimhole tools 3-1/2".',17,'#51647A',w=750)
    b+=R(0,1831,850,169,NAVY)+T(50,1862,'+33 (0)5 59 04 50 45',32,'#fff',True)+T(50,1912,'www.enedril.com · info@enedril.fr',17,'#DCE6F2')+T(50,1940,'GeoTHERM 2027 · Stand 274',17,'#DCE6F2')
    b+=R(640,1848,135,135,'#fff','border-radius:6px')+f'<div class="a" style="left:652px;top:1860px;width:111px;height:111px">{qr()}</div>'
    return b
def rollup_mwd():
    b=poly([(0,0),(850,0),(850,470),(0,720)],NAVY)+poly([(520,0),(640,0),(850,210),(850,330)],'#0D4FA0')+poly([(640,0),(760,0),(850,90),(850,210)],'#1281CB')+poly([(760,0),(850,0),(850,90)],'#29A9F5')
    b+=R(0,720,850,1130,PALE)+poly([(0,690),(850,470),(850,500),(100,720),(0,720)],CYAN)
    b+=LG(50,45,330,74,True,False)
    b+=T(46,150,'BOOST',250,'#fff',True)+T(50,405,'MUD PULSE MWD',62,'#1CA7F5',True)
    b+=T(50,492,"Rock solid performance for today's<br>aggressive drilling conditions.",24,'#C3D1E2')
    b+=T(50,800,'Surveys, directional telemetry and gamma ray, to surface in real time.',27,BLUE,True,w=750)
    st=[('185°C','standard rating · 200°C version available'),('20,000 psi','pressure rating'),('47.6 mm','outside diameter, 1.875"'),('400+ h','battery life with 2 modules')]
    for i,(n,l) in enumerate(st):
        x=50+(i%2)*385;y=950+(i//2)*215;b+=R(x,y,365,4,SKY)+T(x,y+22,n,66,BLUE,True)+T(x,y+112,l,15.5,'#51647A')
    b+=T(50,1403,'TELEMETRY',32,SKY,True)
    tm=[('Inclination','0 - 180° · ±0.10°'),('Azimuth','0 - 360° · ±0.50°'),('Toolface','0 - 360° · ±0.20°'),('Gamma ray','orbital, 360° available'),('Shock & vibration','500 g · 24 MB memory'),('Stick-slip & RPM','downhole dynamics'),('Temperature','-35 to 200°C · ±0.5°C'),('Tool health','battery, annular pressure')]
    for i,(a,v) in enumerate(tm):
        y=1465+i*45.3;b+=T(50,y,a,18,BLUE,True)+T(430,y+3,v,14.5,'#51647A',False,w=370,extra='text-align:right')+R(50,y+34,750,1.5,'#D5DEE8')
    b+=R(0,1850,850,150,NAVY)+T(50,1865,'+33 (0)5 59 04 50 45',26,'#fff',True)+T(50,1908,'www.enedril.com · info@enedril.fr',15,'#DCE6F2')+T(50,1932,'3, avenue des Lacs · 64140 Lons · France',15,'#DCE6F2')
    return b
def fascia(kind):
    b=R(0,0,2000,32,'#0D4F9F')+R(0,32,2000,11,'#1AA7F5')
    if kind=='A':
        b+=LG(100,75,950,213,False,True)+R(1180,95,3,175,'#B7D5EE')+T(1230,128,'DIRECTIONAL DRILLING',70,BLUE,True)+T(1230,205,'FISHING · MWD · P&amp;A',70,SKY,True)
    else:
        b+=LG(500,60,1000,225,False,True)
    return b
def bar_banner(kind):
    """Banderole de comptoir 950 x 800 mm (pos. 105059), une par comptoir (2 comptoirs de 100 x 58 x 90 cm)."""
    b=R(0,0,950,30,'#0D4F9F')+R(0,30,950,10,'#1AA7F5')
    if kind=='logo':
        b+=LG(95,335,760,171,False,True)
    else:
        b+=f'<div class="a" style="left:285px;top:150px;width:380px;height:380px">{qr()}</div>'
        b+=T(0,565,'SCAN · www.enedril.com',44,SKY,True,w=950,extra='text-align:center')+T(0,635,'Fishing and Drilling Solutions',32,'#51647A',False,w=950,extra='text-align:center')
    return b
def services():
    b=R(0,0,2000,70,'#0D4F9F')+R(0,70,2000,22,'#1AA7F5')+LG(150,190,950,213,False,True)
    b+=T(135,430,'OUR',250,SKY,True)+T(135,640,'SERVICES',330,NAVY,True)
    cards=[('DIRECTIONAL DRILLING','PDM 3-1/8" to 9-5/8", RSS, up to 200°C'),('FISHING','Rods, strings, stuck tools. 24/48h'),('WORKOVER','Milling, wash over, casing repair'),('PLUG &amp; ABANDONMENT','Cutters, whipstocks, packers')]
    for i,(h,d) in enumerate(cards):
        y=1160+i*285;b+=R(150,y,1700,250,'#EAF3FB')+R(150,y,14,250,'#1AA7F5')+T(210,y+42,h,66,NAVY,True)+T(210,y+135,d,46,'#51647A')
    b+=R(0,2330,2000,170,NAVY)+T(150,2385,'STAND 274 · www.enedril.com',62,'#fff',True)
    return b
os.makedirs('Roll_ups',exist_ok=True)
render('Rollup_Directional_Drilling_850x2000.pdf',850,2000,RW,RH,rollup_dir())
render('Rollup_MWD_BOOST_850x2000.pdf',850,2000,RW,RH,rollup_mwd())
render('Enseigne_2000x299_A_logo_et_metiers.pdf',2000,299,2000,299,fascia('A'))
render('Enseigne_2000x299_B_logo_seul.pdf',2000,299,2000,299,fascia('B'))
render('Bar_banner_1_logo_950x800.pdf',950,800,950,800,bar_banner('logo'))
render('Bar_banner_2_QR_950x800.pdf',950,800,950,800,bar_banner('qr'))
os.makedirs('Face_placard_Our_services_2_panneaux',exist_ok=True)
for n,tx in ((1,0),(2,-1000)):
    render(f'Face_placard_Our_services_2_panneaux/Our_services_panel_{n}_1000x2500.pdf',1000,2500,2000,2500,services(),tx,vis=1000)
for f in ('_t.html','_t.cjs'):os.remove(f)
