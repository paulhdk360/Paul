# Gazette Enedril 2026 (v3, tons Enedril) : python3 -I generer_gazette.py  (depuis ce dossier)
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor as C
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE as S
from PIL import Image,ImageDraw,ImageFont
import os,tempfile
NAVY=(8,32,63);BLUE=(10,79,160);MID=(25,78,154);CYAN=(28,178,254);SKY=(1,173,238);PALE=(234,244,252);PALE2=(205,225,243);INK=(11,27,46);GREY=(90,107,127);WHITE=(255,255,255)
rgb=lambda t:C(*t)
F='Ubuntu Mono';W,H=595,842
TEAM='../equipe-enedril-v2-paysage.jpg';LOGO='../public/logo-enedril-white.png';TOOL='../outil_SPX_bleu.png'
FONT_B='/root/.fonts/KFO-CneDtsqEr0keqCMhbC-BL-Hy.ttf'
P=Presentation();P.slide_width=Pt(W);P.slide_height=Pt(H);TMP=tempfile.mkdtemp();K=[0]
def poly(s,pts,fill,alpha=None):
    fb=s.shapes.build_freeform(Pt(pts[0][0]),Pt(pts[0][1]))
    fb.add_line_segments([(Pt(x),Pt(y)) for x,y in pts[1:]],close=True)
    sh=fb.convert_to_shape();sh.shadow.inherit=False;sh.fill.solid();sh.fill.fore_color.rgb=rgb(fill);sh.line.fill.background()
    return sh
def rect(s,x,y,w,h,fill):return poly(s,[(x,y),(x+w,y),(x+w,y+h),(x,y+h)],fill)
def txt(s,x,y,w,h,text,size=11,color=INK,bold=False,align=PP_ALIGN.LEFT,anchor=MSO_ANCHOR.TOP,line=None,rot=0):
    tb=s.shapes.add_textbox(Pt(x),Pt(y),Pt(w),Pt(h));tb.rotation=rot;tf=tb.text_frame;tf.word_wrap=True;tf.vertical_anchor=anchor
    tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
    for i,t in enumerate(text if isinstance(text,list) else [text]):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.alignment=align
        if line:p.line_spacing=Pt(line)
        p.space_after=Pt(size*0.5)
        r=p.add_run();r.text=t;r.font.size=Pt(size);r.font.bold=bold;r.font.name=F;r.font.color.rgb=rgb(color)
    return tb
def slide(bg=WHITE):
    s=P.slides.add_slide(P.slide_layouts[6]);rect(s,0,0,W,H,bg);return s
def pimg(s,x,y,w,h,pts,pic=None,label=''):
    """image découpée dans un polygone (pts en fraction 0..1), photo ou emplacement à remplacer"""
    k=3;im=Image.new('RGBA',(int(w*k),int(h*k)),(0,0,0,0))
    if pic:
        src=Image.open(pic).convert('RGB');r=w/h;a,b=src.size
        box=(int((a-b*r)/2),0,int((a+b*r)/2),b) if a/b>r else (0,int((b-a/r)/2),a,int((b+a/r)/2))
        base=src.crop(box).resize(im.size)
    else:
        base=Image.new('RGB',im.size,PALE2);d=ImageDraw.Draw(base)
        for i in range(-int(h*k),int(w*k),34):d.line([(i,im.size[1]),(i+im.size[1],0)],fill=(216,232,246),width=8)
        f=ImageFont.truetype(FONT_B,int(10*k));t=label or 'photo'
        tw=d.textlength(t,font=f);d.text(((im.size[0]-tw)/2,im.size[1]/2-12),t,font=f,fill=(90,125,165))
    mask=Image.new('L',im.size,0);ImageDraw.Draw(mask).polygon([(px*im.size[0],py*im.size[1]) for px,py in pts],fill=255)
    im.paste(base,(0,0),mask);K[0]+=1;fn=os.path.join(TMP,'p%d.png'%K[0]);im.save(fn)
    return s.shapes.add_picture(fn,Pt(x),Pt(y),Pt(w),Pt(h))
def head(s,num,t,dark=False):
    c=WHITE if dark else NAVY
    txt(s,44,40,200,70,num,60,CYAN if dark else PALE2,True);txt(s,44,108,420,36,t,24,c,True);rect(s,44,146,54,4,CYAN)
def foot(s,n,dark=False):
    txt(s,44,H-34,300,12,'ENEDRIL · RÉTROSPECTIVE 2026',7.5,CYAN if dark else GREY);txt(s,W-84,H-34,40,12,str(n),9,CYAN if dark else BLUE,True,PP_ALIGN.RIGHT)
def todo(s,x,y,w,t):
    txt(s,x,y,w,26,'✎ À compléter : '+t,8.5,SKY,True,line=11)
def para(s,x,y,w,lines,size=11,gap=0,color=INK):
    txt(s,x,y,w,300,lines,size,color,line=size*1.45)
def bar(s,x,y,h,color=CYAN):rect(s,x,y,3,h,color)
# 1 couverture
s=slide(NAVY);poly(s,[(0,430),(595,250),(595,842),(0,842)],BLUE);poly(s,[(0,560),(595,420),(595,842),(0,842)],MID)
tl=s.shapes.add_picture(TOOL,Pt(-170),Pt(150),width=Pt(760));tl.rotation=-26
txt(s,44,330,520,18,'LA GAZETTE DE FIN D\'ANNÉE · ÉDITION 2026',9.5,CYAN,True)
txt(s,40,350,540,100,'RÉTRO',84,WHITE,True);txt(s,40,430,560,100,'SPECTIVE',84,WHITE,True);txt(s,44,535,200,50,'2026',44,CYAN,True)
pimg(s,300,610,260,160,[(0.14,0),(1,0),(0.86,1),(0,1)],TEAM)
s.shapes.add_picture(LOGO,Pt(44),Pt(740),width=Pt(190))
# 2 sommaire
s=slide(NAVY);poly(s,[(0,0),(300,0),(180,H),(0,H)],MID);poly(s,[(0,0),(170,0),(60,H),(0,H)],BLUE)
txt(s,44,60,300,50,'SOMMAIRE',28,WHITE,True);rect(s,44,106,54,4,CYAN)
rows=[('Mot de la direction',3),('Actualités internes',4),('Annonces et changements',5),('Actualités commerciales',6),('Marketing et communication',7),('Engagements solidaires',8),('Galerie photos',9),('Les jeux',10)]
for i,(t,p) in enumerate(rows):
    y=170+i*76;x=230+(i%2)*24-i*3
    txt(s,x,y-6,90,60,'%02d'%p,40,CYAN,True);txt(s,x+82,y+4,300,56,t,15,WHITE,True,anchor=MSO_ANCHOR.MIDDLE)
foot(s,2,True)
# 3 mot direction
s=slide(WHITE);poly(s,[(0,0),(595,0),(595,230),(0,300)],NAVY)
txt(s,44,52,200,60,'01',60,BLUE,True);txt(s,44,120,300,36,'Mot de la direction',24,WHITE,True);rect(s,44,160,54,4,CYAN)
pimg(s,330,60,225,150,[(0.12,0),(1,0),(0.88,1),(0,1)],TEAM)
bar(s,44,330,360)
para(s,64,328,470,['Chers collaborateurs,',
'Alors que nous clôturons 2026, nous souhaitons revenir sur les temps forts de cette année et partager avec vous les perspectives qui s\'ouvrent pour la suivante.',
'2026 a été une année de changements concrets : de nouveaux collaborateurs, l\'essai de la semaine à quatre jours, de nouveaux avantages, un nouveau bâtiment de stockage, une nouvelle Break-out unit et un parking remanié. Notre chauffage a aussi évolué : une pompe à chaleur alimentée par deux puits de géothermie, une belle cohérence avec notre métier.',
'Nous avons été présents à GeoTHERM, GEOFLUID, ADIPEC et aux Geodays, accueilli des étudiants d\'IFP Training, et nous nous sommes retrouvés : Section Paloise, barbecue de mai, Octobre rose, Movember et la collecte de jouets.',
'Rendez-vous à GeoTHERM, à Offenburg, les 25 et 26 février 2027, sur notre stand 274.',
'Merci pour votre implication et votre sérieux tout au long de l\'année. Votre engagement est essentiel pour faire progresser Enedril.'],11.5)
txt(s,64,742,400,40,['Merci à tous et à très bientôt,','Fabien & Alexis'],12,BLUE,True)
foot(s,3)
# 4 internes
s=slide(WHITE);poly(s,[(380,0),(595,0),(595,300),(300,300)],PALE);head(s,'02','Actualités internes')
txt(s,44,185,300,20,'BIENVENUE AUX NOUVEAUX',10,SKY,True)
for i,n in enumerate(['Thibaut','Mickael','Xavier','Julien Duval','Segen']):
    txt(s,44+i*8,210+i*40,300,34,n,24,NAVY if i%2==0 else BLUE,True);rect(s,44+i*8,244+i*40,150-i*6,1.5,PALE2)
todo(s,44,425,300,'poste et équipe de chacun, photos')
pimg(s,330,200,225,150,[(0.1,0),(1,0),(0.9,1),(0,1)],None,'photo des nouveaux')
txt(s,44,490,300,20,'ÉVÉNEMENTS D\'ÉQUIPE',10,SKY,True);rect(s,52,525,2,225,PALE2)
ev=['Teambuilding à la Section Paloise','Barbecue en mai','Repas après la matinée de sensibilisation aux addictions','Repas de fin d\'année (date à confirmer)']
for i,t in enumerate(ev):
    y=525+i*58;poly(s,[(46,y+4),(58,y+4),(58,y+16),(46,y+16)],CYAN);txt(s,76,y,240,50,t,12,INK,True,line=16)
pimg(s,330,440,225,150,[(0,0),(0.9,0),(1,1),(0.1,1)],None,'teambuilding');pimg(s,350,605,205,140,[(0.1,0),(1,0),(0.9,1),(0,1)],None,'barbecue')
foot(s,4)
# 5 annonces
s=slide(NAVY);poly(s,[(0,0),(595,0),(595,120),(0,200)],MID);txt(s,44,40,200,70,'03',60,CYAN,True);txt(s,44,108,480,36,'Annonces et changements',24,WHITE,True)
items=[('4 JOURS','Mise en place d\'un essai de la semaine à 4 jours.'),('RESTO & VACANCES','Tickets restaurant et chèques vacances digitaux.'),('CHALEUR','Nouveau système de chauffage : une pompe à chaleur alimentée par nos deux puits de géothermie.'),('BÂTIMENTS','Nouveau bâtiment de stockage, nouveau parking, nouvelle Break-out unit.'),('NOUVEAUX OUTILS','Arrivée de nouveaux outils dans le parc.')]
for i,(k,t) in enumerate(items):
    y=240+i*92;x=44+(i%2)*40;rect(s,x,y,2,64,CYAN);txt(s,x+16,y-2,420,28,k,20,WHITE,True);txt(s,x+16,y+28,285,48,t,11,(190,215,240),line=15)
todo(s,300,700,255,'détails de la semaine à 4 jours, liste des outils');pimg(s,360,300,195,250,[(0.2,0),(1,0),(0.8,1),(0,1)],None,'chantier')
foot(s,5,True)
# 6 commercial
s=slide(WHITE);poly(s,[(0,0),(595,0),(595,170),(0,260)],PALE);head(s,'04','Actualités commerciales')
para(s,44,290,470,['En 2026, Enedril a accompagné de nombreux projets en France et à l\'étranger. Pour 2027, nous misons sur GeoTHERM (stand 274), l\'Europe et le Moyen-Orient.'],12)
poly(s,[(0,400),(595,330),(595,640),(0,640)],BLUE)
for i,(l) in enumerate(['devis envoyés','nouveaux clients','taux de transformation','location / vente']):
    x=44+(i%2)*270;y=[400,360][i%2]+(i//2)*110;txt(s,x,y+10,230,60,'…',46,WHITE,True);txt(s,x,y+70,230,20,l.upper(),9.5,CYAN,True);rect(s,x,y+98,200,1.5,(70,120,190))
txt(s,44,672,250,60,'…',40,NAVY,True);txt(s,44,722,200,18,'PUITS FORÉS',9.5,SKY,True);txt(s,300,672,250,60,'…',40,NAVY,True);txt(s,300,722,200,18,'MÈTRES FORÉS',9.5,SKY,True)
todo(s,44,760,500,'chiffres 2026 et pays d\'intervention')
foot(s,6)
# 7 marketing
s=slide(WHITE);poly(s,[(0,0),(595,0),(595,180),(0,250)],NAVY);txt(s,44,40,200,70,'05',60,BLUE,True);txt(s,44,108,480,36,'Marketing et communication',24,WHITE,True);rect(s,44,146,54,4,CYAN)
ev=[('GeoTHERM','Offenburg · février'),('GEOFLUID','Piacenza · 9 octobre · Luigi Liberatore'),('ADIPEC','Abu Dhabi · 2-5 novembre'),('Geodays','')]
for i,(t,sub) in enumerate(ev):
    y=290+i*62;x=44+i*14;txt(s,x,y,330,32,t,24,NAVY,True);txt(s,x,y+30,330,18,sub,10,GREY);rect(s,x,y+54,280,1.5,PALE2)
txt(s,44,545,500,18,'Accueil d\'étudiants d\'IFP Training sur nos installations.',11,INK,True)
pimg(s,370,280,185,250,[(0.2,0),(1,0),(0.8,1),(0,1)],None,'salons')
poly(s,[(0,600),(595,570),(595,842),(0,842)],BLUE);txt(s,44,628,300,18,'CÔTÉ LINKEDIN',10,CYAN,True)
for i,l in enumerate(['posts','abonnés gagnés','abonnés au total','réactions vs 2025']):txt(s,44+i*132,658,120,50,'…',38,WHITE,True);txt(s,44+i*132,708,125,30,l.upper(),8.5,(190,215,240))
txt(s,44,765,500,18,'✎ À compléter : statistiques LinkedIn 2026, autres actions marketing',8.5,CYAN,True)
foot(s,7,True)
# 8 solidaire
s=slide(WHITE);poly(s,[(0,0),(240,0),(120,330),(0,330)],PALE);head(s,'06','Engagements solidaires')
cols=[('Octobre rose','Mobilisation de toute l\'équipe.',230),('Movember','Sensibilisation à la santé masculine.',290),('Père Noël fait de la récup\'','Collecte interne de jouets pour l\'initiative locale.',250)]
for i,(t,sub,y) in enumerate(cols):
    x=44+i*180;rect(s,x,y,150,3,CYAN);txt(s,x,y+12,155,50,t,15,NAVY,True,line=19);txt(s,x,y+66,150,60,sub,10.5,GREY,line=14.5)
todo(s,44,420,500,'montants, nombre de jouets, associations bénéficiaires')
pimg(s,44,470,250,170,[(0,0),(0.92,0),(1,1),(0.08,1)],TEAM);pimg(s,310,500,245,170,[(0.08,0),(1,0),(0.92,1),(0,1)],None,'Movember');pimg(s,150,660,300,120,[(0.05,0),(1,0),(0.95,1),(0,1)],None,'collecte de jouets')
foot(s,8)
# 9 galerie
s=slide(NAVY);poly(s,[(300,0),(595,0),(595,842),(150,842)],(12,44,84));txt(s,44,40,200,70,'07',60,CYAN,True);txt(s,44,108,300,36,'Galerie photos',24,WHITE,True);rect(s,44,146,54,4,CYAN)
pimg(s,44,190,300,200,[(0,0),(0.93,0),(1,1),(0.07,1)],TEAM);pimg(s,360,215,195,150,[(0.1,0),(1,0),(0.9,1),(0,1)],None,'photo')
pimg(s,70,410,210,160,[(0.08,0),(1,0),(0.92,1),(0,1)],None,'photo');pimg(s,300,385,255,200,[(0,0),(0.92,0),(1,1),(0.08,1)],None,'photo')
pimg(s,44,600,260,175,[(0,0),(0.93,0),(1,1),(0.07,1)],None,'photo');pimg(s,325,610,230,165,[(0.1,0),(1,0),(0.9,1),(0,1)],None,'photo')
foot(s,9,True)
# 10 jeux
s=slide(WHITE);poly(s,[(380,0),(595,0),(595,260),(300,260)],PALE);head(s,'08','Les jeux')
def code(w):return '-'.join(str(ord(c)-64) for c in w)
cw=['FORAGE','GEOTHERMIE','TREPAN','FISHING','MWD','ENEDRIL']
txt(s,44,190,300,18,'MOTS CODÉS · A=1, B=2…',10,SKY,True)
for i,w in enumerate(cw):txt(s,44+(i%2)*260,220+(i//2)*30,255,18,code(w)+' : ......',10.5)
ana=[('TUBAGE','GEBUTA'),('SONDAGE','DOSNAGE'),('POMPE','MPEPO'),('PUITS','TIPUS'),('ENERGIE','GENEIRE'),('GAZETTE','TAGEZET')]
txt(s,60,350,300,18,'ANAGRAMMES',10,SKY,True)
for i,(a,b) in enumerate(ana):txt(s,60+(i%2)*260,380+(i//2)*30,255,18,b+' : ......',11)
txt(s,76,500,300,18,'DEVINETTE',10,SKY,True)
para(s,76,528,440,['Je descends sous terre, je tourne sans cesse, je mords la roche et je ne m\'arrête qu\'une fois au fond. Qui suis-je ?'],12)
poly(s,[(0,690),(595,650),(595,842),(0,842)],NAVY);txt(s,44,712,300,14,'SOLUTIONS',9.5,CYAN,True)
txt(s,44,732,500,60,['Mots codés : '+', '.join(cw),'Anagrammes : '+', '.join(a for a,b in ana),'Devinette : le trépan'],8.5,(190,215,240),line=12)
foot(s,10,True)
# 11 dos
s=slide(NAVY);poly(s,[(0,520),(595,380),(595,842),(0,842)],BLUE);poly(s,[(0,650),(595,560),(595,842),(0,842)],MID)
s.shapes.add_picture(LOGO,Pt(44),Pt(150),width=Pt(300));txt(s,44,218,400,16,'FISHING AND DRILLING SOLUTIONS',10,CYAN,True)
txt(s,44,300,480,120,['Merci,','bonnes fêtes','et à 2027 !'],30,WHITE,True,line=38)
txt(s,44,780,500,14,'www.enedril.com · 3 av des lacs, 64140 Lons',10,WHITE)
P.save('Gazette_Enedril_2026.pptx')
