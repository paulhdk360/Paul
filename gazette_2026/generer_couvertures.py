# 4 propositions de page d'accueil (couverture) avec photos en fondu. GAZETTE_PHOTOS=<dossier photos> GAZETTE_OUT=<sortie> python3 -I generer_couvertures.py
import os,glob,tempfile
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor as C
from pptx.enum.text import PP_ALIGN,MSO_ANCHOR
from PIL import Image,ImageOps,ImageDraw,ImageFilter,ImageChops
import numpy as np
IMG=os.environ.get('GAZETTE_PHOTOS','.');OUT=os.environ.get('GAZETTE_OUT','.');TMP=tempfile.mkdtemp()
BLUE=(10,79,160);NAVY=(8,32,63);CYAN=(0,174,239);RED=(226,35,26);LIGHT=(200,232,255)
LOGO='../stand-geotherm-2027/00_Logo_vectoriel/Enedril_logo_blanc_sans_baseline_HD_6000px.png'
W,H=595,842;S=3   # pixels par point pour les fonds
P=Presentation();P.slide_width=Pt(W);P.slide_height=Pt(H)
def photo(name,w,h,fx=.5,fy=.5):
    f=glob.glob(os.path.join(IMG,name+'.*'))[0];im=ImageOps.exif_transpose(Image.open(f)).convert('RGB');W0,H0=im.size
    ar=w/h;cw,ch=(W0,W0/ar) if W0/H0<ar else (H0*ar,H0)
    cx=min(max(fx*W0,cw/2),W0-cw/2);cy=min(max(fy*H0,ch/2),H0-ch/2)
    return im.crop((int(cx-cw/2),int(cy-ch/2),int(cx+cw/2),int(cy+ch/2))).resize((w,h),Image.LANCZOS)
def grad(w,h,a,b,vertical=True,gamma=1.0):
    n=h if vertical else w;v=np.clip((np.arange(n)-a*n)/max((b-a)*n,1),0,1)**gamma
    m=np.tile(v[:,None],(1,w)) if vertical else np.tile(v[None,:],(h,1));return Image.fromarray((m*255).astype('uint8'))
def fade(im,color,mask):return Image.composite(Image.new('RGB',im.size,color),im,mask)
def save(im,n):fn=os.path.join(TMP,n+'.png');im.save(fn);return fn
def slide(bgfile):
    s=P.slides.add_slide(P.slide_layouts[6]);s.shapes.add_picture(bgfile,0,0,Pt(W),Pt(H));return s
def txt(s,x,y,w,h,t,size,color=(255,255,255),font='Barlow Condensed',bold=True,align=PP_ALIGN.LEFT,line=None):
    tb=s.shapes.add_textbox(Pt(x),Pt(y),Pt(w),Pt(h));tf=tb.text_frame;tf.word_wrap=True
    tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
    p=tf.paragraphs[0];p.alignment=align
    if line:p.line_spacing=Pt(line)
    r=p.add_run();r.text=t;r.font.size=Pt(size);r.font.bold=bold;r.font.name=font;r.font.color.rgb=C(*color)
def logo(s,x=44,y=44,w=150):s.shapes.add_picture(LOGO,Pt(x),Pt(y),width=Pt(w))
def foot(s,col=(255,255,255)):
    txt(s,44,780,500,16,"RÉTROSPECTIVE ET PROJETS",16,col)
    txt(s,44,802,500,14,'Enedril · 3 avenue des Lacs, 64140 Lons · www.enedril.com',9,(200,222,244),'Barlow',False)
# A : opérateurs et rig, fondu vertical vers le bleu
bg=photo('65',W*S,H*S,.5,.40);bg=fade(bg,BLUE,grad(W*S,H*S,.42,.70,True,.9))
s=slide(save(bg,'A'));logo(s)
txt(s,40,516,520,80,'LA GAZETTE',72,line=70);txt(s,44,586,520,36,"DE FIN D'ANNÉE",28,LIGHT)
txt(s,30,618,540,220,'2026',175,line=175);foot(s)
# B : soudure en bichromie bleue, fondu vers le bas
im=photo('62',W*S,H*S,.5,.45);g=ImageOps.grayscale(im);g=ImageOps.autocontrast(g)
duo=ImageOps.colorize(g,black=NAVY,white=(120,200,255),mid=BLUE)
bg=Image.blend(duo,im,.28);bg=fade(bg,BLUE,grad(W*S,H*S,.55,.82,True,1.0))
s=slide(save(bg,'B'));logo(s)
txt(s,40,538,520,80,'LA GAZETTE',72,line=70);txt(s,44,608,520,36,"DE FIN D'ANNÉE",28,LIGHT)
txt(s,30,646,540,200,'2026',150,(255,255,255),line=150);foot(s)
# C : flamme bleue à droite, fondu horizontal vers le bleu (texte à gauche)
bg=photo('63',W*S,H*S,.62,.45);bg=fade(bg,BLUE,grad(W*S,H*S,.0,.80,False,.8)[::-1].transpose(Image.FLIP_LEFT_RIGHT) if False else ImageChops.invert(grad(W*S,H*S,.15,.85,False,1.0)))
s=slide(save(bg,'C'));logo(s)
txt(s,40,296,420,80,'LA GAZETTE',72,line=70);txt(s,44,364,420,36,"DE FIN D'ANNÉE",28,LIGHT)
txt(s,30,414,420,220,'2026',190,line=190);foot(s)
# D : mosaïque de photos arrondies sur fond bleu + cercles
cv=Image.new('RGB',(W*S,H*S),BLUE);d=ImageDraw.Draw(cv)
def circ(cx,cy,r,col):d.ellipse([(cx-r)*S,(cy-r)*S,(cx+r)*S,(cy+r)*S],fill=col)
circ(500,120,260,CYAN);circ(40,640,170,(0,131,203));circ(520,640,40,RED)
def card(name,x,y,w,h,fx=.5,fy=.5,r=16):
    im=photo(name,int(w*S),int(h*S),fx,fy);m=Image.new('L',im.size,0);ImageDraw.Draw(m).rounded_rectangle([0,0,im.size[0]-1,im.size[1]-1],radius=r*S,fill=255)
    cv.paste(im,(int(x*S),int(y*S)),m)
card('65',330,90,210,300,.5,.45);card('62',130,190,185,260,.5,.5);card('61',360,330,185,200,.5,.5)
s=slide(save(cv,'D'));logo(s)
txt(s,40,492,300,80,'LA GAZETTE',64,line=62);txt(s,44,552,300,36,"DE FIN D'ANNÉE",26,LIGHT)
txt(s,30,612,540,220,'2026',175,line=175);foot(s)
P.save(os.path.join(OUT,'Couvertures_gazette_2026.pptx'))
