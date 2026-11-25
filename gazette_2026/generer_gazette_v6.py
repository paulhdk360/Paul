# Gazette Enedril 2026 (v6 : design plus clair et plus dynamique, polices Barlow de la charte) : python3 -I generer_gazette_v6.py
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
def ph(s,x,y,w,h,label,pts=None,tint=PALE2,line=(218,236,250),ink=(70,120,170)):
    k=3;im=Image.new('RGBA',(int(w*k),int(h*k)),(0,0,0,0));base=Image.new('RGB',im.size,tint);d=ImageDraw.Draw(base)
    for i in range(-int(h*k),int(w*k),34):d.line([(i,im.size[1]),(i+im.size[1],0)],fill=line,width=9)
    try:f=ImageFont.truetype(FP,int(10*k))
    except Exception:f=ImageFont.load_default()
    t='PHOTO · '+label.upper();tw=d.textlength(t,font=f);d.text(((im.size[0]-tw)/2,im.size[1]/2-14),t,font=f,fill=ink)
    mask=Image.new('L',im.size,0);ImageDraw.Draw(mask).polygon([(px*im.size[0],py*im.size[1]) for px,py in (pts or [(0,0),(1,0),(1,1),(0,1)])],fill=255)
    im.paste(base,(0,0),mask);K[0]+=1;fn=os.path.join(TMP,'p%d.png'%K[0]);im.save(fn);return s.shapes.add_picture(fn,Pt(x),Pt(y),Pt(w),Pt(h))
SL=[(0.1,0),(1,0),(0.9,1),(0,1)];SR=[(0,0),(0.9,0),(1,1),(0.1,1)]
def header(s,num,title,sub,col=BLUE,numcol=CYAN):
    poly(s,[(0,0),(W,0),(W,128),(0,176)],col);poly(s,[(0,176),(W,128),(W,140),(0,188)],RED)
    D(s,W-170,-6,150,150,num,130,numcol,PP_ALIGN.RIGHT)
    D(s,44,46,380,90,title,40,WHITE,line=40)
    txt(s,44,208,500,44,sub,13,INK,BODY,False,line=18)
def foot(s,n,dark=False):
    c=WHITE if dark else GREY
    txt(s,44,H-30,300,12,'ENEDRIL · RÉTROSPECTIVE 2026',8,c,BODYB);D(s,W-84,H-36,40,20,str(n),16,CYAN if not dark else WHITE,PP_ALIGN.RIGHT)
def body(s,x,y,w,paras,size=10.5,color=INK):return txt(s,x,y,w,300,paras,size,color,BODY,False,line=size*1.45)
def item(s,x,y,w,title,paras,col=BLUE,size=10.5):
    rect(s,x,y+4,10,10,RED);D(s,x+18,y-2,w-18,28,title,22,col);body(s,x,y+28,w,paras,size)
def big(s,x,y,num,label,col=BLUE,size=78,w=150,lc=GREY):
    D(s,x,y,w,size+4,num,size,col,line=size);txt(s,x,y+size*0.85,w,30,label.upper(),9,lc,BODYB,line=11)

# 1 couverture
s=slide(BLUE);poly(s,[(0,470),(W,300),(W,H),(0,H)],CYAN);poly(s,[(0,470),(W,300),(W,318),(0,488)],WHITE)
s.shapes.add_picture(LOGO,Pt(44),Pt(46),width=Pt(150))
ph(s,290,40,260,150,'photo de l\'équipe',[(0.16,0),(1,0),(0.84,1),(0,1)],tint=(60,125,200),line=(80,142,212),ink=(200,225,248))
D(s,40,250,520,80,'LA GAZETTE',74,WHITE,line=72);D(s,44,322,520,40,"DE FIN D'ANNÉE",30,WHITE)
D(s,28,415,560,300,'2026',250,WHITE,line=250)
poly(s,[(0,700),(W,640),(W,H),(0,H)],WHITE);rect(s,44,730,56,6,RED)
D(s,44,748,400,34,"RÉTROSPECTIVE ET PROJETS",24,BLUE);txt(s,44,786,500,14,'Enedril · 3 avenue des Lacs, 64140 Lons · www.enedril.com',9.5,GREY,BODY)
# 2 sommaire
s=slide(WHITE);poly(s,[(0,0),(210,0),(120,H),(0,H)],BLUE);poly(s,[(210,0),(240,0),(150,H),(120,H)],CYAN)
D(s,30,60,200,70,'SOMMAIRE',38,WHITE)
rows=[('Le mot de la direction',3),("Les news de l'entreprise",4),('Les news RSE',5),('Les news marketing',6),('Les news commerciales',7)]
for i,(t,p) in enumerate(rows):
    y=170+i*118;D(s,270,y-14,90,80,'%d'%p,64,CYAN);D(s,340,y+2,230,50,t,30,BLUE,anchor=MSO_ANCHOR.MIDDLE,line=30);rect(s,270,y+70,281,1.5,PALE2)
foot(s,2)
# 3 mot de la direction
s=slide(PALE);poly(s,[(0,0),(W,0),(W,150),(0,110)],BLUE);D(s,44,34,420,80,'LE MOT DE LA DIRECTION',38,WHITE);rect(s,44,108,60,5,RED)
D(s,40,118,120,120,'“',150,CYAN)
ph(s,365,170,190,260,'portrait de la direction',SL)
body(s,44,232,300,['Chers collaborateurs,',
"Alors que nous clôturons 2026, nous souhaitons revenir sur les temps forts de cette année et partager avec vous les perspectives qui s'ouvrent pour la suivante.",
"2026 a été une année de changements concrets : de nouveaux collaborateurs, l'essai de la semaine à quatre jours, de nouveaux avantages, un nouveau bâtiment de stockage, une nouvelle Break-out unit et un parking remanié. Notre chauffage a aussi évolué : une pompe à chaleur alimentée par deux puits de géothermie, une belle cohérence avec notre métier.",
"Nous avons été présents à GeoTHERM, GEOFLUID, ADIPEC et aux Geodays, accueilli des étudiants d'IFP Training, et nous nous sommes retrouvés : Section Paloise, barbecue, Octobre rose, Movember et la collecte de jouets."],11)
poly(s,[(0,560),(W,500),(W,690),(0,690)],CYAN)
txt(s,44,548,500,110,["Rendez-vous à GeoTHERM, à Offenburg, les 25 et 26 février 2027, sur notre stand 274.","Merci pour votre implication et votre sérieux tout au long de l'année. Votre engagement est essentiel pour faire progresser Enedril."],12.5,WHITE,BODYB,line=18)
D(s,44,712,300,30,'Merci à tous et à très bientôt,',20,BLUE);D(s,44,742,300,30,'Fabien & Alexis',26,RED);foot(s,3)
# 4 news de l'entreprise
s=slide(WHITE);header(s,'02',"LES NEWS\nDE L'ENTREPRISE","2026 a surtout été une année d'accueil et de mieux-être au travail : de nouveaux visages, des avantages concrets et des outils pour travailler plus simplement.")
poly(s,[(0,300),(W,272),(W,392),(0,420)],PALE)
big(s,44,318,'5','nouvelles arrivées',BLUE,70,120);big(s,210,318,'4','jours : le test de la semaine de 4 jours',BLUE,70,150);big(s,400,318,'2','puits de géothermie pour notre chauffage',BLUE,70,155)
item(s,44,440,240,'Ils nous ont rejoints',["Segen Abraham a signé un CDI en mars pour renforcer l'équipe commerciale. En août, Thibaud Worgague et Mickael Arolfo ont pris leurs postes côté bureau et atelier. Maïalen Etcecopar poursuit son alternance en HSE/RSE, reconduite en janvier. Caïo, stagiaire, nous a rejoints en novembre, et un élève de 3ᵉ sera accueilli en décembre."])
item(s,310,440,240,'Mieux travailler ensemble',["Titres-restaurant en janvier, chèques-vacances ANCV numériques en juillet, et de août à octobre un test de la semaine de 4 jours. La badgeuse, les bureaux assis-debout et les lunettes de sécurité à la vue complètent ces changements."])
item(s,44,606,240,"Se former, s'équiper",["Le projet ERP et un cycle de pilotage de l'activité ont démarré en février. Opérateurs et atelier se sont formés de février à avril. En novembre, Copilot a fait son entrée et un diagnostic RH avec Agilyce prépare les entretiens professionnels."])
item(s,310,606,240,'Se retrouver',["Barbecue de printemps en mars, team building avec la Section Paloise en juillet, places pour l'Élan Béarnais en septembre. Et l'activité reste ouverte à Noël et au Nouvel An, avec des congés organisés."])
ph(s,44,716,247,74,"photos de l'équipe",SR);ph(s,304,716,247,74,'photos du site',SL);foot(s,4)
# 5 news RSE
s=slide(WHITE);header(s,'03','LES NEWS RSE',"Qualité, sécurité, santé, solidarité : ce que nous avons fait cette année pour travailler mieux et plus responsable.",SKY,WHITE)
data=[('01','Une qualité suivie',"Notre certification ISO 9001 a fait l'objet d'un audit de suivi en mai, et un diagnostic de conformité a passé en revue nos machines."),
('02','La sécurité au quotidien',"Un point HSE a lieu chaque semaine. L'atelier a reçu des lunettes de sécurité adaptées à la vue de chacun, et le poste de soudure une ventilation dédiée."),
('03','Prendre soin de chacun',"Des bureaux assis-debout améliorent le confort au travail, et une matinée de sensibilisation aux addictions a réuni l'équipe en mars."),
('04',"S'engager autour de nous","Nous avons maintenu notre charte RSE et reconduit l'alternance en HSE/RSE. Dons à la Banque alimentaire, Octobre rose, Movember et collecte de jouets ont rythmé l'année.")]
for i,(n,t,p) in enumerate(data):
    y=290+i*108;D(s,44,y-14,90,90,n,70,CYAN);D(s,130,y,300,28,t.upper(),22,BLUE);body(s,130,y+28,255,[p],10);rect(s,130,y+96,255,1.5,PALE2)
poly(s,[(435,262),(W,262),(W,700),(405,700)],PALE)
s.shapes.add_picture(LRQA,Pt(462),Pt(300),width=Pt(90));txt(s,452,400,125,30,'Certifiés ISO 9001 (LRQA)',9.5,GREY,BODYB,line=12)
s.shapes.add_picture(RSE,Pt(464),Pt(470),width=Pt(86));txt(s,446,562,115,44,"Engagés dans la charte RSE de l'UIMM",9.5,GREY,BODYB,line=12)
ph(s,44,720,507,70,'photo atelier ou sécurité',SL);foot(s,5)
# 6 news marketing
s=slide(WHITE);header(s,'04','LES NEWS\nMARKETING',"LinkedIn reste notre vitrine : 2026 a fait grandir la communauté d'Enedril, avec des temps forts liés aux salons et à nos outils.",BLUE,CYAN)
big(s,40,278,'4 885','abonnés LinkedIn',BLUE,92,230);big(s,290,288,'+1 142','abonnés gagnés en 2026',CYAN,70,250,GREY)
txt(s,44,376,507,36,["98 % de l'objectif de 5 000 abonnés · 21 posts publiés · 261 384 impressions · 11 067 interactions."],11,INK,BODYB,line=15)
D(s,44,420,300,22,'NOUVEAUX ABONNÉS PAR MOIS',17,BLUE)
vals=[47,91,124,142,125,68,70,23,68,131,253];mm=['J','F','M','A','M','J','J','A','S','O','N'];base=556;sc=96/253
for i,v in enumerate(vals):
    x=48+i*26;hh=v*sc;rect(s,x,base-hh,19,hh,CYAN if i<10 else RED);txt(s,x-6,base+3,31,10,mm[i],8,GREY,BODY,False,PP_ALIGN.CENTER);txt(s,x-8,base-hh-13,35,11,str(v),8,NAVY,BODYB,False,PP_ALIGN.CENTER)
txt(s,345,440,206,120,["Novembre est le meilleur mois de l'année : 253 nouveaux abonnés. Le post sur le DTU y a largement contribué, avec 86 539 impressions et 39 129 vues vidéo."],11,INK,BODY,line=15.5)
D(s,44,592,400,22,'LES 5 POSTS QUI ONT LE PLUS RÉAGI',17,BLUE)
top=[('Performance Kem One',2196),('DTU',1449),('Teambuilding',1251),('Enedril au GeoTHERM',1211),('Junk Mill GMX 10',955)]
for i,(t,e) in enumerate(top):
    y=620+i*26;D(s,44,y-4,26,30,str(i+1),22,RED);txt(s,70,y+1,200,16,t,11,INK,BODYB);rect(s,260,y+5,int(220*e/2196),11,CYAN if i else BLUE);txt(s,264+int(220*e/2196),y+2,50,14,f"{e:,}".replace(',',' '),10,NAVY,BODYB)
ph(s,44,758,507,34,'visuel',None);foot(s,6)
# 7 news commerciales
s=slide(BLUE);poly(s,[(0,0),(W,0),(W,120),(0,168)],CYAN);poly(s,[(0,168),(W,120),(W,132),(0,180)],WHITE)
D(s,44,40,420,90,'LES NEWS\nCOMMERCIALES',40,WHITE,line=40);D(s,W-170,-6,150,150,'05',130,BLUE,PP_ALIGN.RIGHT)
txt(s,44,208,500,44,"Une année d'échanges nourris avec nos clients, en France comme à l'international, avec la location comme moteur.",13,WHITE,BODY,False,line=18)
big(s,40,262,'199','demandes de devis',WHITE,84,160,LIGHT);big(s,215,262,'54','commandes remportées',WHITE,84,160,LIGHT);big(s,390,262,'27 %','de devis transformés',WHITE,84,170,LIGHT)
txt(s,44,368,507,34,["Au 25 novembre : 80 devis en attente, 7 perdus, 35 annulés. Le délai moyen d'envoi d'un devis est de 5,5 jours."],10.5,LIGHT,BODY,line=14.5)
poly(s,[(0,420),(W,396),(W,590),(0,614)],WHITE)
D(s,44,430,300,26,'NOUS Y ÉTIONS',24,BLUE)
sal=[('GeoTHERM','Offenburg, Allemagne · février'),('Salon géothermie','Berne, Suisse'),('Geodays','Pau, France · juin'),('GEOFLUID','Piacenza, Italie · 9 octobre'),('ADIPEC','Abu Dhabi · 2-5 novembre')]
for i,(a,b) in enumerate(sal):
    y=462+i*27;rect(s,44,y+5,8,8,RED);D(s,60,y-3,190,24,a.upper(),19,BLUE);txt(s,262,y+1,135,16,b,9.5,GREY,BODY)
D(s,400,430,150,26,"D'OÙ VIENNENT\nLES DEMANDES",13,SKY,line=14)
pays=[('France',99),('Allemagne',25),('Norvège',18),('Cameroun',12),('Italie',6)]
for i,(p,n) in enumerate(pays):
    y=470+i*23;txt(s,400,y,60,14,p,9,INK,BODYB);rect(s,455,y+3,int(70*n/99),9,CYAN if i else BLUE);txt(s,458+int(70*n/99),y,30,14,str(n),9,NAVY,BODYB)
txt(s,44,632,507,60,["78 % de location, 22 % de vente, 24 pays et 66 clients et prospects. En 2027, nous misons sur GeoTHERM (stand 274, avec Fixndril en co-exposant), l'Europe et le Moyen-Orient."],12,WHITE,BODYB,line=17)
ph(s,44,708,507,84,'photo de salon ou de chantier',SR,tint=(60,125,200),line=(80,142,212),ink=(200,225,248));foot(s,7,True)
# 8 dos
s=slide(BLUE);poly(s,[(0,430),(W,290),(W,H),(0,H)],CYAN);poly(s,[(0,430),(W,290),(W,308),(0,448)],WHITE);poly(s,[(0,640),(W,560),(W,H),(0,H)],WHITE)
s.shapes.add_picture(LOGO,Pt(44),Pt(60),width=Pt(260));D(s,40,170,500,170,'MERCI,\nBONNES FÊTES\nET À 2027 !',60,WHITE,line=58)
rect(s,44,690,56,6,RED);txt(s,44,706,500,16,'Enedril · 3 avenue des Lacs, 64140 Lons',11,BLUE,BODYB);txt(s,44,724,500,16,'www.enedril.com',11,GREY,BODY)
P.save('Gazette_Enedril_2026_v6.pptx')
