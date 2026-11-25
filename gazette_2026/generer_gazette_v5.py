# Gazette Enedril 2026 (v5 : textes rédigés, nouvelle mise en page, espaces photo à remplir) : python3 -I generer_gazette_v5.py
# Trame : couverture, présentation et sommaire, mot de la direction, news de l'entreprise, news RSE, news marketing, news commerciales, 4e de couverture.
# Les rectangles hachurés « PHOTO » sont des emplacements vides : y glisser les photos (clic droit > Modifier l'image, ou remplacer la forme).
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor as C
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from PIL import Image, ImageDraw, ImageFont
import os, tempfile, math
NAVY=(8,32,63);DEEP=(4,16,31);BLUE=(10,79,160);MID=(25,78,154);CYAN=(28,178,254);SKY=(1,131,203);PALE=(234,244,252);PALE2=(205,225,243);INK=(11,27,46);GREY=(90,107,127);WHITE=(255,255,255);SOFT=(244,248,252);LINE=(213,222,232)
rgb=lambda t:C(*t)
F='Ubuntu Mono';W,H=595,842
R='../'
LOGO=R+'public/logo-enedril-white.png';LOGOC=R+'stand-geotherm-2027/00_Logo_vectoriel/Enedril_logo_couleur_sans_baseline.svg'
LRQA=R+'certifications/LRQA_ISO9001_gris.png';RSE=R+'certifications/RSE_badge_entreprise_engagee.png'
P=Presentation();P.slide_width=Pt(W);P.slide_height=Pt(H);TMP=tempfile.mkdtemp();K=[0]
FONTB=os.path.expanduser('~/.fonts/UbuntuMono-Bold.ttf')
def poly(s,pts,fill):
    fb=s.shapes.build_freeform(Pt(pts[0][0]),Pt(pts[0][1]));fb.add_line_segments([(Pt(x),Pt(y)) for x,y in pts[1:]],close=True)
    sh=fb.convert_to_shape();sh.shadow.inherit=False;sh.fill.solid();sh.fill.fore_color.rgb=rgb(fill);sh.line.fill.background();return sh
def rect(s,x,y,w,h,fill):return poly(s,[(x,y),(x+w,y),(x+w,y+h),(x,y+h)],fill)
def txt(s,x,y,w,h,text,size=11,color=INK,bold=False,align=PP_ALIGN.LEFT,anchor=MSO_ANCHOR.TOP,line=None):
    tb=s.shapes.add_textbox(Pt(x),Pt(y),Pt(w),Pt(h));tf=tb.text_frame;tf.word_wrap=True;tf.vertical_anchor=anchor
    tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
    for i,t in enumerate(text if isinstance(text,list) else [text]):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.alignment=align
        if line:p.line_spacing=Pt(line)
        p.space_after=Pt(size*0.45)
        r=p.add_run();r.text=t;r.font.size=Pt(size);r.font.bold=bold;r.font.name=F;r.font.color.rgb=rgb(color)
    return tb
def slide(bg=WHITE):
    s=P.slides.add_slide(P.slide_layouts[6]);rect(s,0,0,W,H,bg);return s
def nlines(paras,w,size):
    cpl=max(8,int(w/(size*0.52)));return sum(max(1,math.ceil(len(p)/cpl)) for p in paras)
def bodyh(paras,w,size,lh=1.42):return nlines(paras,w,size)*size*lh+len(paras)*size*0.45
def ph(s,x,y,w,h,label='photo',pts=None,dark=False):
    """emplacement photo vide : fond clair hachuré, aucune image"""
    k=3;im=Image.new('RGBA',(int(w*k),int(h*k)),(0,0,0,0))
    base=Image.new('RGB',im.size,(32,66,108) if dark else PALE2);d=ImageDraw.Draw(base)
    for i in range(-int(h*k),int(w*k),30):d.line([(i,im.size[1]),(i+im.size[1],0)],fill=(40,78,124) if dark else (216,232,246),width=7)
    try:f=ImageFont.truetype(FONTB,int(9*k))
    except Exception:f=ImageFont.load_default()
    t='PHOTO · '+label.upper();tw=d.textlength(t,font=f);d.text(((im.size[0]-tw)/2,im.size[1]/2-14),t,font=f,fill=(150,185,225) if dark else (90,125,165))
    mask=Image.new('L',im.size,0);ImageDraw.Draw(mask).polygon([(px*im.size[0],py*im.size[1]) for px,py in (pts or [(0,0),(1,0),(1,1),(0,1)])],fill=255)
    im.paste(base,(0,0),mask);K[0]+=1;fn=os.path.join(TMP,'p%d.png'%K[0]);im.save(fn);return s.shapes.add_picture(fn,Pt(x),Pt(y),Pt(w),Pt(h))
def head(s,num,t,sub,dark=False):
    """bandeau de rubrique : pastille numérotée, titre, chapô"""
    c=WHITE if dark else NAVY
    rect(s,0,0,W,6,CYAN);poly(s,[(44,44),(92,44),(92,92),(44,92)],BLUE if not dark else CYAN)
    txt(s,44,44,48,48,num,22,WHITE if not dark else NAVY,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE)
    txt(s,108,46,440,40,t,26,c,True,anchor=MSO_ANCHOR.MIDDLE)
    txt(s,44,112,500,60,sub,12,(190,215,240) if dark else GREY,line=17)
def foot(s,n,dark=False):
    rect(s,44,H-44,W-88,1,(30,70,115) if dark else LINE)
    txt(s,44,H-34,300,12,'ENEDRIL · RÉTROSPECTIVE 2026',7.5,CYAN if dark else GREY);txt(s,W-84,H-34,40,12,str(n),9,CYAN if dark else BLUE,True,PP_ALIGN.RIGHT)
def cardh(w,paras,size=9.5):return 22+26+bodyh(paras,w-28,size)+14
def card(s,x,y,w,title,paras,accent=CYAN,dark=False,size=9.5,h=None,tag=None):
    hh=h or (22+26+bodyh(paras,w-28,size)+14)
    rect(s,x,y,w,hh,(14,40,74) if dark else SOFT);rect(s,x,y,w,3,accent)
    if tag:txt(s,x+14,y+14,w-28,12,tag,7.5,CYAN if dark else SKY,True)
    txt(s,x+14,y+(26 if tag else 16),w-28,24,title,13,WHITE if dark else NAVY,True)
    txt(s,x+14,y+(26 if tag else 16)+24,w-28,hh,paras,size,(200,220,240) if dark else INK,line=size*1.42)
    return hh
def kpi(s,x,y,big,label,dark=False,w=120,size=34):
    txt(s,x,y,w,size+8,big,size,WHITE if dark else NAVY,True);txt(s,x,y+size+6,w,28,label.upper(),8,CYAN if dark else SKY,True,line=10)

# ---------- 1 couverture
s=slide(NAVY);poly(s,[(0,0),(595,0),(595,300),(0,150)],MID);poly(s,[(0,430),(595,260),(595,842),(0,842)],BLUE);poly(s,[(0,600),(595,470),(595,842),(0,842)],DEEP)
s.shapes.add_picture(LOGO,Pt(44),Pt(52),width=Pt(170))
txt(s,44,210,520,16,"LA GAZETTE DE FIN D'ANNÉE",10,CYAN,True);txt(s,44,232,540,16,'ÉDITION 2026',10,WHITE,True)
txt(s,40,262,540,90,'Rétro',78,WHITE,True);txt(s,40,338,560,90,'spective',78,WHITE,True);txt(s,44,424,200,50,'2026',40,CYAN,True)
ph(s,230,520,320,230,'photo de l\'équipe',[(0.12,0),(1,0),(0.88,1),(0,1)],dark=True)
txt(s,44,640,170,60,['Une année de nouvelles têtes, de projets et de rencontres.'],11,WHITE,line=16)
txt(s,44,780,500,14,'www.enedril.com · 3 avenue des Lacs, 64140 Lons',9,(190,215,240))
# ---------- 2 présentation et sommaire
s=slide(WHITE);rect(s,0,0,W,6,CYAN);poly(s,[(44,44),(92,44),(92,92),(44,92)],CYAN)
txt(s,44,44,48,48,'2026',12,NAVY,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE)
txt(s,108,46,440,40,'Bienvenue dans la gazette',26,NAVY,True,anchor=MSO_ANCHOR.MIDDLE)
txt(s,44,112,500,100,["Cette gazette raconte 2026 vue de l'intérieur : les arrivées, les changements du quotidien, nos engagements en matière de qualité et de sécurité, notre présence sur les réseaux et le travail de l'équipe commerciale.","Elle se lit en quelques minutes. Feuilletez-la, et si une photo manque ou qu'un souvenir vous revient, dites-le-nous."],11,INK,line=16.5)
rect(s,0,262,W,128,NAVY)
for i,(b,l) in enumerate([('+1 142','nouveaux abonnés LinkedIn'),('199','demandes de devis traitées'),('54','commandes remportées'),('5','nouvelles arrivées en 2026')]):
    kpi(s,44+i*132,284,b,l,True,125,32)
txt(s,44,414,300,16,'AU SOMMAIRE',10,SKY,True)
rows=[('Le mot de la direction',3),("Les news de l'entreprise",4),('Les news RSE',5),('Les news marketing',6),('Les news commerciales',7)]
for i,(t,p) in enumerate(rows):
    y=442+i*54;rect(s,44,y,W-88,1,LINE);txt(s,44,y+12,60,30,'p. %d'%p,15,CYAN,True);txt(s,110,y+14,380,30,t,15,NAVY,True)
ph(s,44,720,507,70,'bandeau photo',None)
foot(s,2)
# ---------- 3 mot de la direction
s=slide(WHITE);head(s,'01','Le mot de la direction',"Le regard de Fabien et Alexis sur l'année écoulée.")
ph(s,360,190,195,250,'portrait de la direction',[(0.14,0),(1,0),(0.86,1),(0,1)])
rect(s,44,200,3,290,CYAN)
txt(s,62,196,280,480,['Chers collaborateurs,',
"Alors que nous clôturons 2026, nous souhaitons revenir sur les temps forts de cette année et partager avec vous les perspectives qui s'ouvrent pour la suivante.",
"2026 a été une année de changements concrets : de nouveaux collaborateurs, l'essai de la semaine à quatre jours, de nouveaux avantages, un nouveau bâtiment de stockage, une nouvelle Break-out unit et un parking remanié. Notre chauffage a aussi évolué : une pompe à chaleur alimentée par deux puits de géothermie, une belle cohérence avec notre métier.",
"Nous avons été présents à GeoTHERM, GEOFLUID, ADIPEC et aux Geodays, accueilli des étudiants d'IFP Training, et nous nous sommes retrouvés : Section Paloise, barbecue, Octobre rose, Movember et la collecte de jouets."],10.5,INK,line=15.5)
poly(s,[(0,540),(595,500),(595,640),(0,640)],NAVY)
txt(s,44,548,510,80,['Rendez-vous à GeoTHERM, à Offenburg, les 25 et 26 février 2027, sur notre stand 274.','Merci pour votre implication et votre sérieux tout au long de l\'année. Votre engagement est essentiel pour faire progresser Enedril.'],11,WHITE,line=16)
txt(s,44,660,400,40,['Merci à tous et à très bientôt,','Fabien & Alexis'],12,BLUE,True);ph(s,44,720,507,70,'photo de la direction avec l\'équipe');foot(s,3)
# ---------- 4 news de l'entreprise
s=slide(WHITE);head(s,'02',"Les news de l'entreprise","2026 a surtout été une année d'accueil et de mieux-être au travail : de nouveaux visages, des avantages concrets et des outils pour travailler plus simplement.")
w=245;x1,x2=44,306;y=200
c=[("Ils nous ont rejoints",["Segen Abraham a signé un CDI en mars pour renforcer l'équipe commerciale. En août, Thibaud Worgague et Mickael Arolfo ont pris leurs postes côté bureau et atelier.","Maïalen Etcecopar poursuit son alternance en Master HSE/RSE, reconduite en janvier. Caïo, stagiaire, nous a rejoints en novembre, et un élève de 3ᵉ sera accueilli en décembre."],"ÉQUIPE"),
("Mieux travailler ensemble",["Les titres-restaurant sont arrivés en janvier et les chèques-vacances ANCV sont devenus numériques en juillet.","De août à octobre, nous avons testé la semaine de 4 jours. La badgeuse, les bureaux assis-debout et les lunettes de sécurité à la vue complètent ces changements."],"AU QUOTIDIEN")]
hh=max(cardh(w,p) for t,p,g in c)
for x,(t,p,g) in zip((x1,x2),c):card(s,x,y,w,t,p,CYAN,tag=g,h=hh)
y2=y+hh+14
c2=[("Se former, s'équiper",["Février a lancé le projet ERP et un cycle de pilotage de l'activité. Les opérateurs et l'atelier ont suivi des formations de février à avril.","En novembre, Copilot a fait son entrée, et un diagnostic RH avec Agilyce prépare les entretiens professionnels (EPP)."],"COMPÉTENCES"),
("Se retrouver",["Un barbecue de printemps en mars, un team building avec la Section Paloise en juillet, des places pour l'Élan Béarnais en septembre : de quoi nourrir la cohésion.","L'activité reste ouverte à Noël et au Nouvel An, avec des congés organisés."],"VIE D'ÉQUIPE")]
h2=max(cardh(w,p) for t,p,g in c2)
for x,(t,p,g) in zip((x1,x2),c2):card(s,x,y2,w,t,p,CYAN,tag=g,h=h2)
y3=y2+h2+14
rect(s,44,y3,507,52,NAVY);txt(s,60,y3+10,480,40,["Sur site : un nouveau bâtiment de stockage, un parking remanié, une nouvelle Break-out unit, et un chauffage par pompe à chaleur alimentée par nos deux puits de géothermie."],9.5,WHITE,line=13.5)
ph(s,44,y3+66,247,H-y3-66-54,'photos de l\'équipe');ph(s,304,y3+66,247,H-y3-66-54,'photos du site')
foot(s,4)
# ---------- 5 news RSE
s=slide(NAVY);head(s,'03','Les news RSE',"Qualité, sécurité, santé, solidarité : ce que nous avons fait cette année pour travailler mieux et plus responsable.",True)
w=245
cc=[("Une qualité suivie",["Notre certification ISO 9001 a fait l'objet d'un audit de suivi en mai, et un diagnostic de conformité a passé en revue nos machines."],"QUALITÉ"),
("La sécurité au quotidien",["Un point HSE a lieu chaque semaine. L'atelier a reçu des lunettes de sécurité adaptées à la vue de chacun, et le poste de soudure une ventilation dédiée."],"SÉCURITÉ"),
("Prendre soin de chacun",["Des bureaux assis-debout améliorent le confort au travail, et une matinée de sensibilisation aux addictions a réuni l'équipe en mars."],"SANTÉ"),
("S'engager autour de nous",["Nous avons maintenu notre charte RSE et reconduit l'alternance en HSE/RSE. Dons à la Banque alimentaire, Octobre rose, Movember et collecte de jouets ont rythmé l'année."],"SOLIDARITÉ")]
y=200
hs=[cardh(w,p) for t,p,g in cc]
r1=max(hs[0],hs[1]);r2=max(hs[2],hs[3])
for i,(t,p,g) in enumerate(cc):
    x=44+(i%2)*262;yy=y if i<2 else y+r1+14;card(s,x,yy,w,t,p,CYAN,True,tag=g,h=r1 if i<2 else r2)
y3=y+r1+14+r2+20
rect(s,44,y3,160,108,WHITE);s.shapes.add_picture(LRQA,Pt(80),Pt(y3+6),width=Pt(88))
rect(s,216,y3,160,108,WHITE);s.shapes.add_picture(RSE,Pt(250),Pt(y3+6),width=Pt(92))
txt(s,392,y3,160,108,['Certifiés ISO 9001 (LRQA) et engagés dans la charte RSE de l\'UIMM : deux repères qui guident nos équipes.'],9.5,(200,220,240),line=13.5)
ph(s,44,y3+124,507,H-(y3+124)-56,'photo atelier ou sécurité',dark=True)
foot(s,5,True)
# ---------- 6 news marketing
s=slide(WHITE);head(s,'04','Les news marketing',"LinkedIn reste notre vitrine : 2026 a fait grandir la communauté d'Enedril, avec des temps forts liés aux salons et à nos outils.")
for i,(b,l) in enumerate([('4 885','abonnés'),('+1 142','abonnés gagnés en 2026'),('261 384','impressions'),('11 067','interactions')]):kpi(s,44+i*132,200,b,l,False,125,30)
txt(s,44,256,507,34,["Nous sommes à 98 % de l'objectif de 5 000 abonnés, avec 21 posts publiés, 1 565 réactions et 9 325 clics."],10,GREY,line=14)
rect(s,44,300,507,150,SOFT);txt(s,58,310,300,14,'NOUVEAUX ABONNÉS PAR MOIS',8.5,SKY,True)
vals=[47,91,124,142,125,68,70,23,68,131,253];mm=['J','F','M','A','M','J','J','A','S','O','N'];base=428;sc=76/253
for i,v in enumerate(vals):
    x=60+i*24;hh=v*sc;rect(s,x,base-hh,16,hh,CYAN if i<10 else BLUE);txt(s,x-6,base+3,28,10,mm[i],7.5,GREY,False,PP_ALIGN.CENTER);txt(s,x-8,base-hh-12,32,10,str(v),7,NAVY,True,PP_ALIGN.CENTER)
txt(s,338,330,200,110,['Novembre est le meilleur mois de l\'année, avec 253 nouveaux abonnés. Le post sur le DTU y a largement contribué : 86 539 impressions et 39 129 vues vidéo.'],9.5,INK,line=13.5)
txt(s,44,468,400,14,'LES 5 POSTS QUI ONT LE PLUS RÉAGI',9,SKY,True)
top=[('Performance Kem One','mars',2196),('DTU','novembre',1449),('Teambuilding','octobre',1251),('Enedril au GeoTHERM','février',1211),('Junk Mill GMX 10','avril',955)]
for i,(t,m,e) in enumerate(top):
    y=490+i*30;txt(s,44,y,24,24,str(i+1),17,CYAN,True);txt(s,72,y+1,230,16,t,11,NAVY,True);txt(s,72,y+15,160,11,m,7.5,GREY)
    rect(s,290,y+8,int(190*e/2196),9,CYAN if i else BLUE);txt(s,290+int(190*e/2196)+6,y+5,50,14,f"{e:,}".replace(',',' '),9.5,NAVY,True)
txt(s,44,650,507,40,["Les salons ont rythmé nos publications : GeoTHERM en février, Geodays en juin, GEOFLUID le 9 octobre, ADIPEC du 2 au 5 novembre. Prochain rendez-vous : GeoTHERM 2027, stand 274."],9.5,INK,line=13.5)
ph(s,44,704,507,76,'capture d\'un post ou photo de salon')
foot(s,6)
# ---------- 7 news commerciales
s=slide(NAVY);head(s,'05','Les news commerciales',"Une année d'échanges nourris avec nos clients, en France comme à l'international, avec la location comme moteur.",True)
for i,(b,l) in enumerate([('199','demandes de devis'),('54','commandes remportées'),('27 %','de devis transformés'),('5,5 j','de délai moyen d\'envoi')]):kpi(s,44+i*132,200,b,l,True,125,34)
txt(s,44,262,507,34,["Au 25 novembre, 80 devis sont encore en attente, 7 ont été perdus et 35 annulés. Le taux de transformation est le rapport entre les devis gagnés et les devis établis."],9.5,(190,215,240),line=13.5)
rect(s,44,312,247,196,(14,40,74));txt(s,58,324,220,14,"D'OÙ VIENNENT LES DEMANDES",8.5,CYAN,True)
pays=[('France',99),('Allemagne',25),('Norvège',18),('Cameroun',12),('Italie',6),('Suisse',6),('Maroc',5)]
for i,(p,n) in enumerate(pays):
    y=346+i*22;txt(s,58,y,70,14,p,9.5,WHITE,True);rect(s,128,y+3,int(110*n/99),9,CYAN if i else WHITE);txt(s,132+int(110*n/99),y,30,14,str(n),9,WHITE,True)
rect(s,304,312,247,196,(14,40,74));txt(s,318,324,220,14,'EN UN COUP D\'ŒIL',8.5,CYAN,True)
txt(s,318,346,220,150,['78 % de location, 22 % de vente.','24 pays concernés, 66 clients et prospects.','Nos cinq clients les plus actifs ont émis 43 % des demandes.'],10.5,WHITE,line=16)
txt(s,44,532,507,80,["Fishing, forage dirigé, blocage et déblocage : l'équipe a répondu à des demandes très variées, avec une réactivité qui reste notre signature.","En 2027, nous misons sur GeoTHERM (stand 274, avec Fixndril en co-exposant), l'Europe et le Moyen-Orient."],10.5,(220,235,250),line=15)
ph(s,44,636,507,142,'photo de chantier ou de salon',dark=True)
foot(s,7,True)
# ---------- 8 dos
s=slide(NAVY);poly(s,[(0,520),(595,380),(595,842),(0,842)],BLUE);poly(s,[(0,650),(595,560),(595,842),(0,842)],DEEP)
s.shapes.add_picture(LOGO,Pt(44),Pt(150),width=Pt(300));txt(s,44,300,480,120,['Merci,','bonnes fêtes','et à 2027 !'],30,WHITE,True,line=38)
txt(s,44,780,500,14,'www.enedril.com · 3 avenue des Lacs, 64140 Lons',10,WHITE)
P.save('Gazette_Enedril_2026_v5.pptx')
