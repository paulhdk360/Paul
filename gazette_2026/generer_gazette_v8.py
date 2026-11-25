# Gazette Enedril 2026 (v8 : design moderne en blocs arrondis et cercles) : python3 -I generer_gazette_v8.py
# Polices : Barlow Condensed (titres, chiffres) et Barlow (texte), dans ../voeux_2027/polices/ : à installer pour ouvrir le PPTX.
# Les rectangles hachurés « PHOTO » sont des emplacements vides : y glisser les photos.
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor as C
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from PIL import Image, ImageDraw, ImageFont
import os, tempfile, math
BLUE=(10,79,160);SKY=(0,131,203);CYAN=(0,174,239);NAVY=(8,32,63);RED=(226,35,26);PALE=(234,243,251);PALE2=(205,228,246);WHITE=(255,255,255);INK=(11,27,46);GREY=(81,100,122);LIGHT=(190,225,248)
rgb=lambda t:C(*t)
DISP='Barlow Condensed';BODY='Barlow';BODYB='Barlow SemiBold'
W,H=595,842;R='../'
LOGO=R+'public/logo-enedril-white.png';LRQA=R+'certifications/LRQA_ISO9001_gris.png';RSE=R+'certifications/RSE_badge_entreprise_engagee.png'
FP=R+'voeux_2027/polices/Barlow-Medium.ttf'
P=Presentation();P.slide_width=Pt(W);P.slide_height=Pt(H);TMP=tempfile.mkdtemp();K=[0]
def poly(s,pts,fill):
    fb=s.shapes.build_freeform(Pt(pts[0][0]),Pt(pts[0][1]));fb.add_line_segments([(Pt(x),Pt(y)) for x,y in pts[1:]],close=True)
    sh=fb.convert_to_shape();sh.shadow.inherit=False;sh.fill.solid();sh.fill.fore_color.rgb=rgb(fill);sh.line.fill.background();return sh
def rect(s,x,y,w,h,fill):return poly(s,[(x,y),(x+w,y),(x+w,y+h),(x,y+h)],fill)
def txt(s,x,y,w,h,text,size=11,color=INK,font=BODY,bold=False,align=PP_ALIGN.LEFT,anchor=MSO_ANCHOR.TOP,line=None):
    tb=s.shapes.add_textbox(Pt(x),Pt(y),Pt(w),Pt(h));tf=tb.text_frame;tf.word_wrap=True;tf.vertical_anchor=anchor
    tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
    for i,t in enumerate(text if isinstance(text,list) else [text]):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.alignment=align
        if line:p.line_spacing=Pt(line)
        p.space_after=Pt(size*0.4)
        r=p.add_run();r.text=t;r.font.size=Pt(size);r.font.bold=bold;r.font.name=font;r.font.color.rgb=rgb(color)
    return tb
def D(s,x,y,w,h,t,size,color=BLUE,align=PP_ALIGN.LEFT,anchor=MSO_ANCHOR.TOP,line=None):return txt(s,x,y,w,h,t,size,color,DISP,True,align,anchor,line)
def slide(bg=WHITE):
    s=P.slides.add_slide(P.slide_layouts[6]);rect(s,0,0,W,H,bg);return s

from pptx.enum.shapes import MSO_SHAPE
def rr(s,x,y,w,h,fill,r=18):
    sh=s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,Pt(x),Pt(y),Pt(w),Pt(h));sh.adjustments[0]=min(0.5,r/min(w,h))
    sh.shadow.inherit=False;sh.fill.solid();sh.fill.fore_color.rgb=rgb(fill);sh.line.fill.background();return sh
def circ(s,x,y,d,fill):
    sh=s.shapes.add_shape(MSO_SHAPE.OVAL,Pt(x),Pt(y),Pt(d),Pt(d));sh.shadow.inherit=False;sh.fill.solid();sh.fill.fore_color.rgb=rgb(fill);sh.line.fill.background();return sh
def ph(s,x,y,w,h,label,r=18,oval=False,tint=PALE2,line=(218,236,250),ink=(70,120,170)):
    k=3;sz=(int(w*k),int(h*k));base=Image.new('RGB',sz,tint);d=ImageDraw.Draw(base)
    for i in range(-sz[1],sz[0],40):d.line([(i,sz[1]),(i+sz[1],0)],fill=line,width=10)
    try:f=ImageFont.truetype(FP,int(10*k))
    except Exception:f=ImageFont.load_default()
    t='PHOTO · '+label.upper();tw=d.textlength(t,font=f);d.text(((sz[0]-tw)/2,sz[1]/2-14),t,font=f,fill=ink)
    m=Image.new('L',sz,0);md=ImageDraw.Draw(m)
    if oval:md.ellipse([0,0,sz[0]-1,sz[1]-1],fill=255)
    else:md.rounded_rectangle([0,0,sz[0]-1,sz[1]-1],radius=r*k,fill=255)
    im=Image.new('RGBA',sz,(0,0,0,0));im.paste(base,(0,0),m);K[0]+=1;fn=os.path.join(TMP,'p%d.png'%K[0]);im.save(fn);return s.shapes.add_picture(fn,Pt(x),Pt(y),Pt(w),Pt(h))
def pill(s,x,y,w,text,fill=BLUE,col=WHITE,size=10,h=24):
    rr(s,x,y,w,h,fill,h/2);txt(s,x,y,w,h,text,size,col,BODYB,False,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE)
def foot(s,n,dark=False):
    c=WHITE if dark else GREY
    txt(s,44,H-30,300,12,'ENEDRIL · RÉTROSPECTIVE 2026',8,c,BODYB);D(s,W-84,H-36,40,20,str(n),16,WHITE if dark else CYAN,PP_ALIGN.RIGHT)
def page(num,label,title,sub,dark=False):
    s=slide(BLUE if dark else WHITE)
    D(s,W-300,-40,320,300,num,270,SKY if dark else PALE,PP_ALIGN.RIGHT)
    pill(s,44,44,28+len(label)*6.4,num+'  ·  '+label,WHITE if dark else BLUE,BLUE if dark else WHITE)
    D(s,44,82,430,100,title,46,WHITE if dark else BLUE,line=44)
    if sub:txt(s,44,188,430,40,sub,12,WHITE if dark else INK,BODY,False,line=17)
    return s
def body(s,x,y,w,paras,size=10,color=INK):return txt(s,x,y,w,300,paras,size,color,BODY,False,line=size*1.42)
def card(s,x,y,w,h,title,paras,fill=PALE,tc=BLUE,size=9.5,num=None):
    rr(s,x,y,w,h,fill);ty=y+16
    if num:D(s,x+16,y+8,70,46,num,40,CYAN);ty=y+54
    D(s,x+16,ty,w-32,26,title,21,tc);body(s,x+16,ty+28,w-32,paras,size)
def stat(s,x,y,w,h,num,label,fill=BLUE,nc=WHITE,lc=LIGHT,size=70):
    rr(s,x,y,w,h,fill);D(s,x+16,y+8,w-24,size+6,num,size,nc,line=size);txt(s,x+16,y+h-34,w-28,26,label.upper(),8.5,lc,BODYB,line=10.5)

# 1 couverture
s=slide(BLUE);circ(s,290,-170,470,CYAN);circ(s,-120,540,340,SKY);circ(s,478,150,70,WHITE);circ(s,420,640,40,RED)
s.shapes.add_picture(LOGO,Pt(44),Pt(46),width=Pt(150))
pill(s,44,236,262,"LA GAZETTE DE FIN D'ANNÉE",WHITE,BLUE,13,32)
D(s,30,260,560,300,'2026',255,WHITE,line=255)
D(s,44,610,420,34,'RÉTROSPECTIVE ET PROJETS',26,WHITE);rect(s,44,650,56,6,RED)
txt(s,44,780,500,14,'Enedril · 3 avenue des Lacs, 64140 Lons · www.enedril.com',9.5,LIGHT,BODY)
# 2 sommaire
s=slide(PALE);D(s,44,44,400,70,'SOMMAIRE',54,BLUE);rect(s,44,112,64,6,RED)
rows=[('Le mot de la direction','3'),("Les news de l'entreprise",'4'),('Les news RSE','5'),('Les news marketing','6'),('Les news commerciales','7'),("L'année en images",'8-9')]
for i,(t_,p) in enumerate(rows):
    y=150+i*104;rr(s,44,y,507,88,WHITE,22);circ(s,58,y+14,60,[BLUE,SKY,CYAN,BLUE,SKY,CYAN][i]);D(s,58,y+14,60,60,'0%d'%(i+1),30,WHITE,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE)
    D(s,138,y+10,300,68,t_,30,BLUE,anchor=MSO_ANCHOR.MIDDLE,line=30);D(s,440,y+10,95,68,p,40,RED,PP_ALIGN.RIGHT,MSO_ANCHOR.MIDDLE)
foot(s,2)
# 3 mot de la direction
s=slide(WHITE);circ(s,360,-120,330,CYAN);circ(s,330,190,70,RED)
ph(s,395,34,150,150,'portrait',oval=True,tint=(220,240,252));
pill(s,44,44,200,'01  ·  MOT DE LA DIRECTION');D(s,44,82,320,100,'LE MOT DE\nLA DIRECTION',46,BLUE,line=44)
rr(s,44,230,507,500,PALE,26)
body(s,70,258,455,['Chers collaborateurs,',
"Alors que nous clôturons 2026, nous souhaitons revenir sur les temps forts de cette année et partager avec vous les perspectives qui s'ouvrent pour la suivante.",
"2026 a été une année de changements concrets : de nouveaux collaborateurs, l'essai de la semaine à quatre jours, de nouveaux avantages, un nouveau bâtiment de stockage, une nouvelle Break-out unit et un parking remanié. Notre chauffage a aussi évolué : une pompe à chaleur alimentée par deux puits de géothermie, une belle cohérence avec notre métier.",
"Nous avons été présents à GeoTHERM, GEOFLUID, ADIPEC et aux Geodays, accueilli des étudiants d'IFP Training, et nous nous sommes retrouvés : Section Paloise, barbecue, Octobre rose, Movember et la collecte de jouets.",
"Merci pour votre implication et votre sérieux tout au long de l'année. Votre engagement est essentiel pour faire progresser Enedril."],12)
rr(s,44,748,330,44,BLUE,22);txt(s,44,748,330,44,'Merci à tous et à très bientôt,  Fabien & Alexis',12.5,WHITE,BODYB,False,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE);foot(s,3)
# 4 entreprise
s=page('02',"NEWS DE L'ENTREPRISE","LES NEWS\nDE L'ENTREPRISE","Une année d'accueil et de mieux-être au travail : de nouveaux visages, des avantages concrets et des outils pour travailler plus simplement.")
stat(s,44,240,161,118,'5','nouvelles arrivées',BLUE);stat(s,217,240,161,118,'4','jours : test de la semaine de 4 jours',SKY);stat(s,390,240,161,118,'2','puits de géothermie pour notre chauffage',CYAN,WHITE,WHITE)
card(s,44,372,247,158,'Ils nous ont rejoints',["Segen Abraham a signé un CDI en mars (équipe commerciale). En août, Thibaud Worgague et Mickael Arolfo ont pris leurs postes. Maïalen Etcecopar poursuit son alternance en HSE/RSE. Caïo, stagiaire, nous a rejoints en novembre, un élève de 3ᵉ sera accueilli en décembre."])
card(s,304,372,247,158,'Mieux travailler ensemble',["Titres-restaurant en janvier, chèques-vacances ANCV numériques en juillet, et de août à octobre un test de la semaine de 4 jours. Badgeuse, bureaux assis-debout et lunettes de sécurité à la vue complètent ces changements."])
card(s,44,542,247,150,"Se former, s'équiper",["Le projet ERP et un cycle de pilotage de l'activité ont démarré en février. Opérateurs et atelier se sont formés de février à avril. En novembre, Copilot a fait son entrée et un diagnostic RH avec Agilyce prépare les entretiens professionnels."])
card(s,304,542,247,150,'Se retrouver',["Barbecue de printemps en mars, team building avec la Section Paloise en juillet, places pour l'Élan Béarnais en septembre. Et l'activité reste ouverte à Noël et au Nouvel An, avec des congés organisés."])
ph(s,44,706,247,86,"photos de l'équipe");ph(s,304,706,247,86,'photos du site');foot(s,4)
# 5 RSE
s=page('03','NEWS RSE','LES NEWS RSE',"Qualité, sécurité, santé, solidarité : ce que nous avons fait cette année pour travailler mieux et plus responsable.")
cards=[('01','Une qualité suivie',"Notre certification ISO 9001 a fait l'objet d'un audit de suivi en mai, et un diagnostic de conformité a passé en revue nos machines."),
('02','La sécurité au quotidien',"Un point HSE a lieu chaque semaine. L'atelier a reçu des lunettes de sécurité adaptées à la vue de chacun, et le poste de soudure une ventilation dédiée."),
('03','Prendre soin de chacun',"Des bureaux assis-debout améliorent le confort au travail, et une matinée de sensibilisation aux addictions a réuni l'équipe en mars."),
('04',"S'engager autour de nous","Nous avons maintenu notre charte RSE et reconduit l'alternance en HSE/RSE. Dons à la Banque alimentaire, Octobre rose, Movember et collecte de jouets ont rythmé l'année.")]
for i,(n,t_,p) in enumerate(cards):card(s,44+(i%2)*260,240+(i//2)*178,247,166,t_,[p],PALE,BLUE,9.5,n)
rr(s,44,606,247,130,PALE2);s.shapes.add_picture(LRQA,Pt(62),Pt(620),width=Pt(70));s.shapes.add_picture(RSE,Pt(176),Pt(618),width=Pt(70))
txt(s,56,696,110,30,'Certifiés ISO 9001 (LRQA)',8.5,GREY,BODYB,line=10.5);txt(s,170,696,115,30,"Charte RSE de l'UIMM",8.5,GREY,BODYB,line=10.5)
ph(s,304,606,247,130,'photo atelier ou sécurité');ph(s,44,750,507,42,'bandeau photo');foot(s,5)
# 6 marketing
s=page('04','NEWS MARKETING','LES NEWS\nMARKETING',"LinkedIn reste notre vitrine : 2026 a fait grandir la communauté d'Enedril, avec des temps forts liés aux salons et à nos outils.")
rr(s,44,240,507,130,BLUE);D(s,60,240,260,100,'4 885',92,WHITE,line=92);txt(s,62,330,200,12,'ABONNÉS LINKEDIN',8.5,LIGHT,BODYB)
D(s,300,248,240,70,'+1 142',58,CYAN,PP_ALIGN.RIGHT);txt(s,330,310,210,12,'ABONNÉS GAGNÉS EN 2026',8.5,LIGHT,BODYB,False,PP_ALIGN.RIGHT)
txt(s,62,348,480,14,"98 % de l'objectif de 5 000 · 21 posts · 261 384 impressions · 11 067 interactions",10,WHITE,BODYB)
rr(s,44,382,507,190,PALE);D(s,60,392,300,22,'NOUVEAUX ABONNÉS PAR MOIS',16,BLUE)
vals=[47,91,124,142,125,68,70,23,68,131,253];mm=['J','F','M','A','M','J','J','A','S','O','N'];base=548;sc=100/253
for i,v in enumerate(vals):
    x=62+i*23;hh=v*sc;rr(s,x,base-hh,16,hh,CYAN if i<10 else RED,4);txt(s,x-6,base+3,28,10,mm[i],8,GREY,BODY,False,PP_ALIGN.CENTER);txt(s,x-8,base-hh-12,32,11,str(v),8,NAVY,BODYB,False,PP_ALIGN.CENTER)
body(s,330,420,205,["Novembre est le meilleur mois de l'année : 253 nouveaux abonnés. Le post sur le DTU y a largement contribué, avec 86 539 impressions et 39 129 vues vidéo."],10.5)
rr(s,44,584,507,208,WHITE,18);D(s,60,592,400,22,'LES 5 POSTS QUI ONT LE PLUS RÉAGI',16,BLUE)
top=[('Performance Kem One',2196),('DTU',1449),('Teambuilding',1251),('Enedril au GeoTHERM',1211),('Junk Mill GMX 10',955)]
for i,(t_,e) in enumerate(top):
    y=620+i*34;circ(s,60,y,26,RED if i==0 else BLUE);D(s,60,y,26,26,str(i+1),16,WHITE,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE);txt(s,96,y+5,150,16,t_,11,INK,BODYB)
    ww=int(230*e/2196);rr(s,250,y+5,ww,16,BLUE if i==0 else CYAN,8);txt(s,256+ww,y+6,50,14,f"{e:,}".replace(',',' '),10,NAVY,BODYB)
foot(s,6)
# 7 commerciales
s=page('05','NEWS COMMERCIALES','LES NEWS\nCOMMERCIALES',"Une année d'échanges nourris avec nos clients, en France comme à l'international, avec la location comme moteur.",True)
stat(s,44,240,161,118,'199','demandes de devis',WHITE,BLUE,GREY);stat(s,217,240,161,118,'54','commandes remportées',WHITE,BLUE,GREY);stat(s,390,240,161,118,'27 %','de devis transformés',CYAN,WHITE,WHITE)
txt(s,44,370,507,30,"Au 25 novembre : 80 devis en attente, 7 perdus, 35 annulés. Le délai moyen d'envoi d'un devis est de 5,5 jours.",10.5,LIGHT,BODY,line=14)
rr(s,44,410,300,214,WHITE);D(s,60,420,260,26,'NOUS Y ÉTIONS',24,BLUE)
sal=[('GeoTHERM','Offenburg, Allemagne · février'),('Salon géothermie','Berne, Suisse'),('Geodays','Pau, France · juin'),('GEOFLUID','Piacenza, Italie · 9 octobre'),('ADIPEC','Abu Dhabi · 2-5 novembre')]
for i,(a,b) in enumerate(sal):
    y=456+i*32;circ(s,60,y+6,10,RED);D(s,78,y-2,150,26,a.upper(),19,BLUE);txt(s,78,y+20,200,12,b,9,GREY,BODY)
rr(s,356,410,195,214,CYAN);D(s,372,420,170,40,"D'OÙ VIENNENT\nLES DEMANDES",14,WHITE,line=15)
for i,(p,n) in enumerate([('France',99),('Allemagne',25),('Norvège',18),('Cameroun',12),('Italie',6)]):
    y=468+i*30;txt(s,372,y,70,12,p,9.5,WHITE,BODYB);ww=max(6,int(80*n/99));rr(s,372,y+14,ww,8,WHITE,4);txt(s,376+ww,y+11,30,12,str(n),9,WHITE,BODYB)
txt(s,44,640,507,50,["78 % de location, 22 % de vente, 24 pays et 66 clients et prospects. En 2027, nous misons sur GeoTHERM (stand 274, avec Fixndril en co-exposant), l'Europe et le Moyen-Orient."],12,WHITE,BODYB,line=17)
ph(s,44,704,507,88,'photo de salon ou de chantier',tint=(60,125,200),line=(80,142,212),ink=(200,225,248));foot(s,7,True)
# 8-9 photos
s=page('06',"L'ANNÉE EN IMAGES  1/2","L'ANNÉE\nEN IMAGES","Les moments qui ont marqué 2026 : salons, atelier, équipe, rencontres.")
ph(s,44,240,507,250,'grande photo');
for i in range(3):ph(s,44+i*172,502,163,150,'photo %d'%(i+1))
ph(s,44,664,247,128,'photo 4');ph(s,304,664,247,128,'photo 5');foot(s,8)
s=page('06',"L'ANNÉE EN IMAGES  2/2","L'ANNÉE\nEN IMAGES","Équipe, salons, chantiers, bons moments : à compléter avec vos photos préférées.")
ph(s,44,240,247,200,'photo 1');ph(s,304,240,247,200,'photo 2');ph(s,44,452,507,200,'grande photo')
ph(s,44,664,163,128,'photo 3');ph(s,218,664,163,128,'photo 4');ph(s,392,664,159,128,'photo 5');foot(s,9)
# 10 dos
s=slide(BLUE);circ(s,250,300,520,CYAN);circ(s,-140,560,340,SKY);circ(s,70,380,90,WHITE);circ(s,500,230,38,RED)
s.shapes.add_picture(LOGO,Pt(44),Pt(60),width=Pt(250));D(s,40,150,500,170,'MERCI,\nBONNES FÊTES\nET À 2027 !',60,WHITE,line=58)
rr(s,44,720,340,60,WHITE,30);txt(s,64,732,320,16,'Enedril · 3 avenue des Lacs, 64140 Lons',11,BLUE,BODYB);txt(s,64,752,320,16,'www.enedril.com',11,GREY,BODY)
P.save('Gazette_Enedril_2026_v8.pptx')
