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
box(.65,1.23,4,6);c.setStrokeColor(NAVY);c.line(px(.65),py(5),px(1.23),py(5));label(.94,5.0,'BAR',6.5)
circle(.3,4.5,.18,BLUE);circle(.3,5.5,.18,BLUE)
box(1.37,1.43,4.15,5.0,NAVY);box(1.37,1.43,5.02,5.88,NAVY)
label(1.62,4.58,'roll-up 1',6,ang=90);label(1.62,5.45,'roll-up 2',6,ang=90)
box(.23,.47,3.08,3.52,NAVY);label(.3,3.62,'brochures',6)
circle(.6,1.5,.36,white,BLUE);label(.6,1.5,'standing',6.5);circle(.6,.95,.18,BLUE);circle(.6,2.05,.18,BLUE)
for dx,dy in((0,.62),(0,-.62),(.62,0),(-.62,0)):box(1.55+dx-.2,1.55+dx+.2,2.65+dy-.2,2.65+dy+.2,GREY,Color(.62,.69,.75),.8)
circle(1.55,2.65,.45,Color(.93,.95,.97),Color(.62,.69,.75));label(1.55,2.65,'table',6.5)
c.setStrokeColor(CY);c.setLineWidth(3);c.line(px(0),py(0),px(0),py(6));label(-.14,3.0,'AISLE | fascia',6,CY,90)
c.setFillColor(NAVY);c.setStrokeColor(NAVY);c.setLineWidth(3);c.line(px(3),py(0),px(3),py(6))
box(2.86,2.97,.07,.93,Color(.07,.07,.07),GRN,1.4);label(2.55,.5,'FIXNDRIL roll-up',6,Color(.08,.5,.2),90)
# 3) légende
c.setFillColor(white);c.rect(258,Y(560),GX1-258,560-442,fill=1,stroke=0)
L=['STAND 274 - 3 x 6 m, open sides W / N / S','Back wall (E): 4 printed panels 105058','Storage cabin 200x100 (type 3), N end:','  west face = 2 printed panels 105058','Bar = 2 counters of type 3, end to end,','  printed front 105059 x2','2 bar stools 107004 (+2 for standing table)','Standing table 107021 (D70, H110)','Meeting table + 4 chairs + leaflet stand: type 3','2 Enedril roll-ups behind the bar (own)','1 FIXNDRIL roll-up (co-exhibitor), back wall S','Fascia 200 x 29.9 above west opening','Carpet: blue (system stand colour upgrade)','Dimensions in cm: see attached sketch']
c.setFillColor(NAVY);c.setFont('Helvetica',5.9)
for i,t in enumerate(L):c.drawString(261,Y(449+i*8.1),t)
c.save();buf.seek(0)
ov=PdfReader(buf).pages[0]
r=PdfReader(SRC);w=PdfWriter();w.append(r)
w.pages[12].merge_page(ov)
# 4) champs
vals={'Price 1500 EURsqm desired color shade':'blue','AustellungsprodukteExhibits 1':'Fixndril documentation','AustellungsprodukteExhibits 2':'and 1 roll-up (co-exhibitor)'}
for pg in w.pages:
    try:w.update_page_form_field_values(pg,{k:v for k,v in vals.items()},auto_regenerate=False)
    except Exception as e:pass
w._root_object['/AcroForm'][NameObject('/NeedAppearances')]=BooleanObject(True)
w.write(OUT);print(OUT)
