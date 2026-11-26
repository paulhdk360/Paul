# Met à jour le livret rempli : croquis p.13 (2 roll-ups Enedril + roll-up Fixndril), moquette bleue, co-exposant.
# python3 maj_livret.py  -> GeoTHERM2027_Servicemappe_Enedril_remplie_v2.pdf
import io,os
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject,BooleanObject
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color,black,white
here=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(here,'GeoTHERM2027_Servicemappe_Enedril_remplie.pdf');OUT=os.path.join(here,'GeoTHERM2027_Servicemappe_Enedril_remplie_v2.pdf')
PH=841.89;NAVY=Color(.03,.125,.25);BLUE=Color(.04,.31,.63);GRN=Color(.12,.7,.25);CY=Color(0,.68,.94);GREY=Color(.86,.89,.92)
GX0,GX1=97.65,395.29;GT,GB=431.9,701.19;CELL=7.0866
def Y(t):return PH-t
buf=io.BytesIO();c=canvas.Canvas(buf,pagesize=(595.276,PH))
# 1) efface la zone et redessine la grille
c.setFillColor(white);c.setStrokeColor(white);c.rect(GX0-1,Y(GB)-1,GX1-GX0+2,GB-GT+2,fill=1,stroke=0)
c.setStrokeColor(black);c.setLineWidth(.5)
for i in range(43):
    x=GX0+i*CELL;c.line(x,Y(GT),x,Y(GB))
for j in range(39):
    t=GT+j*CELL
    if t<=GB+.3:c.line(GX0,Y(t),GX1,Y(t))
# 2) croquis (1 m = 40 pt, aire du stand 3 x 6 m)
SX,ST=130,682
px=lambda x:SX+x*40;py=lambda y:Y(ST-y*40)
def box(x0,x1,y0,y1,fill=white,stroke=NAVY,w=1.2):
    c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(w);c.rect(px(x0),py(y0),(x1-x0)*40,(y1-y0)*40,fill=1,stroke=1)
def circle(x,y,r,fill=white,stroke=BLUE):
    c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(1.2);c.circle(px(x),py(y),r*40,fill=1,stroke=1)
def label(x,y,t,size=6.5,col=NAVY,ang=0,al='c'):
    c.setFillColor(col);c.setFont('Helvetica',size);c.saveState();c.translate(px(x),py(y)-size/3);c.rotate(ang)
    (c.drawCentredString if al=='c' else c.drawString)(0,0,t);c.restoreState()
c.setDash(3,3);c.setStrokeColor(NAVY);c.setLineWidth(.7);c.rect(px(0),py(0),120,240,fill=0,stroke=1);c.setDash()
box(2,3,4,6);label(2.5,5.1,'STORAGE',7);label(2.5,4.85,'200x100',6)
box(.55,1.13,4,6);c.setStrokeColor(NAVY);c.line(px(.55),py(5),px(1.13),py(5));label(.84,5.0,'BAR',6.5)
circle(.3,4.5,.18,BLUE);circle(.3,5.5,.18,BLUE)
box(1.16,2.0,4.27,4.33,NAVY);box(1.16,2.0,5.67,5.73,NAVY)
label(1.58,4.1,'roll-up 1',6);label(1.58,5.52,'roll-up 2',6)
box(.23,.47,3.08,3.52,NAVY);label(.3,3.62,'brochures',6)
circle(.6,1.5,.36,white,BLUE);label(.6,1.5,'standing',6.5);circle(.6,.95,.18,BLUE);circle(.6,2.05,.18,BLUE)
circle(1.9,.95,.36,white,BLUE);label(1.9,.95,'standing 2',6);circle(1.9,.4,.18,BLUE);circle(1.9,1.5,.18,BLUE)
for dx,dy in((0,.62),(0,-.62),(.62,0),(-.62,0)):box(1.55+dx-.2,1.55+dx+.2,2.65+dy-.2,2.65+dy+.2,GREY,Color(.62,.69,.75),.8)
circle(1.55,2.65,.45,Color(.93,.95,.97),Color(.62,.69,.75));label(1.55,2.65,'table',6.5)
c.setStrokeColor(CY);c.setLineWidth(3);c.line(px(0),py(0),px(0),py(6));label(-.14,3.0,'AISLE | fascia',6,CY,90)
c.setFillColor(NAVY);c.setStrokeColor(NAVY);c.setLineWidth(3);c.line(px(3),py(0),px(3),py(6))
box(2.86,2.97,.07,.93,Color(.07,.07,.07),GRN,1.4);label(2.55,.5,'FIXNDRIL roll-up',6,Color(.08,.5,.2),90)
# 3) légende
c.setFillColor(white);c.rect(258,Y(570),GX1-258,570-442,fill=1,stroke=0)
L=['STAND 274 - 3 x 6 m, open sides W / N / S','Back wall (E): 4 printed panels 105058','Storage cabin 200x100 (type 3), N end:','  west face = 2 printed panels 105058,','  visual "OUR SERVICES" (white background)','Bar = 2 counters of type 3, end to end,','  printed front 105059 x2','2 bar stools 107004 (+4 for standing tables)','2 standing tables 107021 (D70, H110)','Meeting table + 4 chairs + leaflet stand: type 3','2 Enedril roll-ups, perpendicular to storage face','1 FIXNDRIL roll-up (co-exhibitor), back wall S','Fascia 200 x 29.9 above west opening','Carpet: blue (system stand colour upgrade)','Dimensions in cm: see attached sketch']
c.setFillColor(NAVY);c.setFont('Helvetica',5.9)
for i,t in enumerate(L):c.drawString(261,Y(449+i*8.1),t)
# case « autre couleur de moquette » (15 EUR/m2) : coche visible
c.save();buf.seek(0)
ov=PdfReader(buf).pages[0]
# p.15 et p.17 : visuel de la face du rangement
b2=io.BytesIO();c2=canvas.Canvas(b2,pagesize=(595.276,PH));c2.setFillColor(NAVY);c2.setFont('Helvetica-Bold',6.6)
c2.drawString(226,Y(402),'Design: 4 panels = back wall with Enedril logo;');c2.drawString(226,Y(410),'2 panels = west face of storage cabin: "OUR SERVICES" visual (white).');c2.save();b2.seek(0)
ov15=PdfReader(b2).pages[0]
b3=io.BytesIO();c3=canvas.Canvas(b3,pagesize=(595.276,PH));c3.setFillColor(white);c3.rect(118,Y(600),190,32,fill=1,stroke=0);c3.setFillColor(NAVY);c3.setFont('Helvetica-Bold',6.4)
for i,tx in enumerate(['West face of storage cabin (2 x 2.5 m):','2 printed panels 105058, visual "OUR SERVICES"','(white background, no MWD) - file supplied']):c3.drawString(121,Y(576+i*8.5),tx)
c3.save();b3.seek(0);ov17=PdfReader(b3).pages[0]
r=PdfReader(SRC);w=PdfWriter();w.append(r)
def ticks(boxes,k=1.0):
    bb=io.BytesIO();cc=canvas.Canvas(bb,pagesize=(595.276,PH));cc.setStrokeColorRGB(.85,0,0);cc.setLineWidth(2.4*k);cc.setLineCap(1);cc.setLineJoin(1)
    for x,y in boxes:
        pth=cc.beginPath();pth.moveTo(x+2.1*k,y+8.3*k);pth.lineTo(x+6.8*k,y+2.3*k);pth.lineTo(x+16.9*k,y+15.3*k);cc.drawPath(pth,stroke=1,fill=0)
    cc.save();bb.seek(0);return PdfReader(bb).pages[0]
# F électricité / éclairage (spots commandés p.10) : on coche aussi la case de la liste p.2
for an in w.pages[1]['/Annots']:
    an=an.get_object()
    if an.get('/T')=='Kontrollkästchen5':
        an[NameObject('/AS')]=NameObject('/Ja');an[NameObject('/V')]=NameObject('/Ja')
w.pages[1].merge_page(ticks([(119,431),(120,418),(119,389),(119,333),(119,455)]))   # p.2 checklist
w.pages[11].merge_page(ticks([(97,160)]))                                 # p.12 SYSTEM STAND type 3 (106003)
w.pages[12].merge_page(ticks([(96,536),(96,494)]))                                 # p.13 logo en couleur (107091)
w.pages[25].merge_page(ticks([(94,522)]))
# p.4 B.3 code de réduction gratuit (e-mail) ; p.8 co-exposant : « own staff » et frais payés par « main exhibitor »
def on(pi,names):
    for an in w.pages[pi]['/Annots']:
        an=an.get_object();nm=an.get('/T')
        if nm in names:an[NameObject('/AS')]=NameObject('/On');an[NameObject('/V')]=NameObject('/On')
on(3,['Please send me the code to the following email']);on(7,['eigenem Personal  own staff','Hauptaussteller  mainexhibitor'])
w.pages[3].merge_page(ticks([(98.5,222)],.55))
w.pages[7].merge_page(ticks([(62,224),(289.5,224)],.55))                                 # p.26 passes gratuits
w.pages[12].merge_page(ov);w.pages[14].merge_page(ov15);w.pages[16].merge_page(ov17)
# 4) champs
vals={'undefined':'dcatelain@enedril.fr','Quantity':'6','Quantity_2':'2','Price 1500 EURsqm desired color shade':'blue','AustellungsprodukteExhibits 1':'Fixndril documentation','AustellungsprodukteExhibits 2':'and 1 roll-up (co-exhibitor)'}
for pg in w.pages:
    try:w.update_page_form_field_values(pg,{k:v for k,v in vals.items()},auto_regenerate=False)
    except Exception as e:pass
w._root_object['/AcroForm'][NameObject('/NeedAppearances')]=BooleanObject(False)
w.write(OUT);print(OUT)
