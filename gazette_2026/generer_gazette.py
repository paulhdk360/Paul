# Gazette Enedril 2026 (design chaleureux) : python3 -I generer_gazette.py  (depuis ce dossier)
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor as C
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE as S
from pptx.enum.dml import MSO_LINE
NAVY=C(8,32,63);BLUE=C(10,79,160);CYAN=C(28,178,254);CREAM=C(251,246,238);WHITE=C(255,255,255);INK=C(36,40,52)
ORANGE=C(244,140,40);CORAL=C(238,98,76);SAND=C(244,232,214);SUN=C(255,196,87);GREY=C(120,112,104);PINK=C(240,120,170)
F='Ubuntu Mono';W,H=595,842
TEAM='../equipe-enedril-v2-paysage.jpg';LOGO='../public/logo-enedril-white.png'
P=Presentation();P.slide_width=Pt(W);P.slide_height=Pt(H)
def shp(s,kind,x,y,w,h,fill,line=None,rot=0,dash=False,adj=None,lw=1):
    r=s.shapes.add_shape(kind,Pt(x),Pt(y),Pt(w),Pt(h));r.shadow.inherit=False;r.rotation=rot
    if adj is not None:r.adjustments[0]=adj
    if fill is None:r.fill.background()
    else:r.fill.solid();r.fill.fore_color.rgb=fill
    if line:r.line.color.rgb=line;r.line.width=Pt(lw);r.line.dash_style=MSO_LINE.DASH if dash else None
    else:r.line.fill.background()
    return r
def txt(s,x,y,w,h,text,size=11,color=INK,bold=False,align=PP_ALIGN.LEFT,anchor=MSO_ANCHOR.TOP,line=None,rot=0):
    tb=s.shapes.add_textbox(Pt(x),Pt(y),Pt(w),Pt(h));tb.rotation=rot;tf=tb.text_frame;tf.word_wrap=True;tf.vertical_anchor=anchor
    tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
    for i,t in enumerate(text if isinstance(text,list) else [text]):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.alignment=align
        if line:p.line_spacing=Pt(line)
        p.space_after=Pt(size*0.55)
        r=p.add_run();r.text=t;r.font.size=Pt(size);r.font.bold=bold;r.font.name=F;r.font.color.rgb=color
    return tb
def slide(bg=CREAM):
    s=P.slides.add_slide(P.slide_layouts[6]);shp(s,S.RECTANGLE,0,0,W,H,bg);return s
def deco(s,a=ORANGE,b=CYAN):
    shp(s,S.OVAL,430,-90,230,230,a);shp(s,S.OVAL,500,-40,150,150,SUN);shp(s,S.OVAL,-70,740,190,190,b)
def head(s,num,t,sub=None):
    deco(s);txt(s,40,48,120,60,num,52,SUN,True);txt(s,40,104,380,30,t,22,NAVY,True)
    shp(s,S.ROUNDED_RECTANGLE,40,138,70,6,ORANGE,adj=0.5)
    if sub:txt(s,40,152,380,34,sub,10.5,GREY,line=14)
def foot(s,n):
    txt(s,40,H-32,300,12,'Enedril · Rétrospective 2026',8,GREY);txt(s,W-80,H-32,40,12,str(n),9,ORANGE,True,PP_ALIGN.RIGHT)
def card(s,x,y,w,h,fill=WHITE):
    shp(s,S.ROUNDED_RECTANGLE,x+3,y+4,w,h,SAND,adj=0.08);return shp(s,S.ROUNDED_RECTANGLE,x,y,w,h,fill,adj=0.08)
def sticky(s,x,y,w,h,label,rot=-2):
    shp(s,S.RECTANGLE,x,y,w,h,SUN,rot=rot);txt(s,x+8,y+4,w-16,h-8,'✎ À compléter : '+label,8.5,C(90,60,0),True,anchor=MSO_ANCHOR.MIDDLE,rot=rot)
def polaroid(s,x,y,w,h,label,rot=0,pic=None):
    shp(s,S.RECTANGLE,x+3,y+4,w,h,SAND,rot=rot);shp(s,S.RECTANGLE,x,y,w,h,WHITE,rot=rot)
    ix,iy,iw,ih=x+8,y+8,w-16,h-34
    if pic:
        from PIL import Image
        im=Image.open(pic);r=iw/ih;wi,hi=im.size
        if wi/hi>r:nw=int(hi*r);l=(wi-nw)//2;box=(l,0,l+nw,hi)
        else:nh=int(wi/r);t=(hi-nh)//2;box=(0,t,wi,t+nh)
        im.crop(box).save('/tmp/_pol.png');s.shapes.add_picture('/tmp/_pol.png',Pt(ix),Pt(iy),Pt(iw),Pt(ih)).rotation=rot
    else:
        shp(s,S.RECTANGLE,ix,iy,iw,ih,C(232,236,242),rot=rot);txt(s,ix+6,iy,iw-12,ih,'📷 '+label,8.5,GREY,False,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE,rot=rot)
    txt(s,x+8,y+h-22,w-16,14,label if pic else 'légende',8.5,GREY,align=PP_ALIGN.CENTER,rot=rot)
    shp(s,S.RECTANGLE,x+w/2-22,y-7,44,14,C(255,220,150),rot=rot-4 if rot else -4)
def bubble(s,x,y,d,val,label,fill=BLUE):
    shp(s,S.OVAL,x,y,d,d,fill);txt(s,x,y+d*0.28,d,d*0.3,val,d*0.28,WHITE,True,PP_ALIGN.CENTER)
    txt(s,x+8,y+d*0.62,d-16,d*0.3,label,8,C(255,240,220),align=PP_ALIGN.CENTER)
def item(s,x,y,w,t,color=ORANGE,size=11.5):
    shp(s,S.OVAL,x,y+2,11,11,color);n=max(1,-(-len(t)*size*0.58//(w-22)));txt(s,x+22,y,w-22,n*size*1.4,t,size,INK,line=size*1.35);return y+n*size*1.35+9
# 1 couverture
s=slide(NAVY)
g=shp(s,S.RECTANGLE,0,0,W,H,NAVY);g.fill.gradient();g.fill.gradient_angle=90
g.fill.gradient_stops[0].color.rgb=C(8,32,63);g.fill.gradient_stops[1].color.rgb=C(10,79,160)
shp(s,S.OVAL,150,420,520,520,ORANGE);shp(s,S.OVAL,230,500,360,360,SUN)
shp(s,S.OVAL,-60,590,200,200,CYAN);shp(s,S.OVAL,470,60,180,180,CORAL)
txt(s,40,70,520,20,'LA GAZETTE DE FIN D\'ANNÉE',12,SUN,True)
txt(s,40,100,520,90,'RÉTRO',78,WHITE,True);txt(s,40,180,540,90,'SPECTIVE',78,WHITE,True);txt(s,40,275,300,60,'2026',50,SUN,True)
polaroid(s,70,370,330,235,'L\'équipe Enedril',rot=-4,pic=TEAM)
s.shapes.add_picture(LOGO,Pt(40),Pt(760),width=Pt(190))
# 2 sommaire
s=slide();head(s,'✦','Sommaire','Tout ce qui a fait 2026 chez Enedril.')
rows=[('Mot de la direction',3,ORANGE),('Actualités internes',4,CYAN),('Annonces et changements',5,CORAL),('Actualités commerciales',6,BLUE),('Marketing et communication',7,ORANGE),('Engagements solidaires',8,PINK),('Galerie photos',9,CYAN),('Les jeux',10,CORAL)]
for i,(t,p,c) in enumerate(rows):
    y=210+i*66;card(s,40,y,515,52);shp(s,S.OVAL,52,y+9,34,34,c);txt(s,52,y+9,34,34,str(p),13,WHITE,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE);txt(s,100,y,420,52,t,15,NAVY,True,anchor=MSO_ANCHOR.MIDDLE)
foot(s,2)
# 3 mot direction
s=slide();head(s,'01','Mot de la direction')
polaroid(s,360,70,190,128,'On est fiers de vous',rot=3,pic=TEAM)
card(s,40,215,515,540)
shp(s,S.RECTANGLE,40,215,8,540,ORANGE)
txt(s,64,232,470,510,['Chers collaborateurs,',
'Alors que nous clôturons 2026, nous souhaitons revenir sur les temps forts de cette année et partager avec vous les perspectives qui s\'ouvrent pour la suivante.',
'2026 a été une année de changements concrets : de nouveaux collaborateurs, l\'essai de la semaine à quatre jours, de nouveaux avantages, un nouveau bâtiment de stockage, une nouvelle Break-out unit et un parking remanié. Notre chauffage a aussi évolué : une pompe à chaleur alimentée par deux puits de géothermie, une belle cohérence avec notre métier.',
'Nous avons été présents à GeoTHERM, GEOFLUID, ADIPEC et aux Geodays, accueilli des étudiants d\'IFP Training, et nous nous sommes retrouvés : Section Paloise, barbecue de mai, Octobre rose, Movember et la collecte de jouets.',
'Rendez-vous à GeoTHERM, à Offenburg, les 25 et 26 février 2027, sur notre stand 274.',
'Merci pour votre implication et votre sérieux tout au long de l\'année. Votre engagement est essentiel pour faire progresser Enedril.',
'Merci à tous et à très bientôt,','Fabien & Alexis'],13.5,line=19.5)
foot(s,3)
# 4 internes
s=slide();head(s,'02','Actualités internes','Ils nous ont rejoints, on s\'est retrouvés.')
txt(s,40,205,515,20,'Bienvenue aux nouveaux',15,CORAL,True)
for i,(n,c) in enumerate([('Thibaut',ORANGE),('Mickael',CYAN),('Xavier',CORAL),('Julien D.',BLUE),('Segen',PINK)]):
    x=48+i*104;shp(s,S.OVAL,x,235,84,84,c);txt(s,x,235,84,84,n[0],36,WHITE,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE);txt(s,x-6,326,96,16,n,11,NAVY,True,PP_ALIGN.CENTER)
sticky(s,330,350,225,40,'poste / équipe de chacun, photo',2)
txt(s,40,410,515,20,'Événements d\'équipe',15,CORAL,True)
y=440
for t in ['Teambuilding à la Section Paloise.','Barbecue en mai.','Repas après la matinée de sensibilisation aux addictions.','Repas de fin d\'année (date à confirmer).']:y=item(s,40,y,300,t)
polaroid(s,355,430,200,150,'barbecue de mai',rot=3);polaroid(s,60,600,230,150,'Section Paloise',rot=-3);polaroid(s,320,610,235,150,'repas après la matinée',rot=2)
foot(s,4)
# 5 annonces
s=slide();head(s,'03','Annonces et changements','Ce qui change chez nous au quotidien.')
cards=[('4','jours : essai de la semaine à 4 jours',ORANGE),('✓','Tickets restaurant et chèques vacances digitaux',CYAN),('♨','Chauffage par pompe à chaleur sur nos deux puits de géothermie',CORAL),('▣','Nouveau bâtiment de stockage, parking et Break-out unit',BLUE),('⚒','Arrivée de nouveaux outils',PINK)]
for i,(n,t,c) in enumerate(cards):
    x=40+(i%2)*262;y=205+(i//2)*118;card(s,x,y,253,106);shp(s,S.OVAL,x+14,y+22,60,60,c);txt(s,x+14,y+22,60,60,n,26,WHITE,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE);txt(s,x+86,y+10,157,86,t,11,NAVY,True,anchor=MSO_ANCHOR.MIDDLE,line=14.5)
sticky(s,302,442,253,60,'modalités de la semaine à 4 jours, dates, liste des nouveaux outils',-2)
polaroid(s,50,540,230,200,'nouveau bâtiment de stockage',rot=-3);polaroid(s,320,550,230,190,'Break-out unit',rot=3)
foot(s,5)
# 6 commercial
s=slide();head(s,'04','Actualités commerciales','Des projets en France et à l\'étranger.')
txt(s,40,205,515,70,'En 2026, Enedril a accompagné de nombreux projets. Pour 2027, nous misons sur GeoTHERM (stand 274), l\'Europe et le Moyen-Orient.',12,line=17)
for i,(v,l,c) in enumerate([('…','devis envoyés',BLUE),('…','nouveaux clients',ORANGE),('…','taux de transformation',CORAL),('…','puits forés',CYAN),('…','mètres forés',PINK)]):
    d=150;x=[40,222,404,130,312][i];y=[290,290,290,455,455][i];bubble(s,x,y,d,v,l,c)
sticky(s,40,640,515,44,'chiffres commerciaux et de chantier 2026, pays d\'intervention (Paul / équipe)',-1)
foot(s,6)
# 7 marketing
s=slide();head(s,'05','Marketing et communication','Là où on s\'est montrés.')
ev=[('GeoTHERM','Offenburg, février',ORANGE),('GEOFLUID','Piacenza, 9 octobre · Luigi Liberatore',CYAN),('ADIPEC','Abu Dhabi, 2-5 novembre',CORAL),('Geodays','',BLUE)]
for i,(t,sub,c) in enumerate(ev):
    x=40+(i%2)*262;y=205+(i//2)*100;card(s,x,y,253,88);shp(s,S.RECTANGLE,x,y,8,88,c);txt(s,x+22,y+14,220,26,t,17,NAVY,True);txt(s,x+22,y+46,220,36,sub,10,GREY,line=13)
y=item(s,40,420,515,'Accueil d\'étudiants d\'IFP Training sur nos installations.')
txt(s,40,470,515,20,'Côté LinkedIn',15,CORAL,True)
for i,l in enumerate(['posts','abonnés gagnés','abonnés au total','réactions vs 2025']):bubble(s,40+i*132,500,118,'…',l,[BLUE,ORANGE,CORAL,CYAN][i])
polaroid(s,40,640,160,110,'GeoTHERM',rot=-3);polaroid(s,215,645,160,110,'GEOFLUID',rot=2);polaroid(s,390,640,160,110,'ADIPEC',rot=-2)
sticky(s,380,470,175,22,'stats LinkedIn',2)
foot(s,7)
# 8 solidaire
s=slide();head(s,'06','Engagements solidaires','Parce qu\'on est aussi une équipe qui s\'engage.')
for i,(t,sub,c) in enumerate([('Octobre rose','Mobilisation de toute l\'équipe',PINK),('Movember','Sensibilisation à la santé masculine',BLUE),('Père Noël fait de la récup\'','Collecte interne de jouets',ORANGE)]):
    x=40+i*175;card(s,x,205,165,150);shp(s,S.OVAL,x+52,220,60,60,c);txt(s,x+10,292,145,30,t,12,NAVY,True,PP_ALIGN.CENTER);txt(s,x+10,322,145,30,sub,9,GREY,align=PP_ALIGN.CENTER,line=12)
sticky(s,40,378,515,34,'montants, nombre de jouets, associations bénéficiaires',-1)
polaroid(s,50,440,240,170,'Octobre rose',rot=-3,pic=TEAM);polaroid(s,320,450,230,160,'Movember',rot=3);polaroid(s,150,640,290,140,'collecte de jouets',rot=-1)
foot(s,8)
# 9 galerie
s=slide();head(s,'07','Galerie photos','Les moments qu\'on garde.')
pos=[(40,205,2),(300,215,-3),(50,400,-2),(305,410,3),(40,600,3),(300,610,-2)]
for i,(x,y,r) in enumerate(pos):polaroid(s,x,y,250,175,'chantier / atelier / équipe' if i else 'l\'équipe',rot=r,pic=TEAM if i==0 else None)
foot(s,9)
# 10 jeux
s=slide();head(s,'08','Les jeux','Une pause avant les fêtes.')
def code(w):return '-'.join(str(ord(c)-64) for c in w)
card(s,40,205,515,160);txt(s,58,215,480,20,'Mots codés (A=1, B=2…)',13,CORAL,True)
cw=['FORAGE','GEOTHERMIE','TREPAN','FISHING','MWD','ENEDRIL']
for i,w in enumerate(cw):txt(s,58+(i%2)*250,245+(i//2)*34,245,18,code(w)+' : ......',10)
card(s,40,380,515,150);txt(s,58,390,480,20,'Anagrammes',13,CORAL,True)
ana=[('TUBAGE','GEBUTA'),('SONDAGE','DOSNAGE'),('POMPE','MPEPO'),('PUITS','TIPUS'),('ENERGIE','GENEIRE'),('GAZETTE','TAGEZET')]
for i,(a,b) in enumerate(ana):txt(s,58+(i%2)*250,420+(i//2)*34,245,18,b+' : ......',11)
card(s,40,545,515,110);txt(s,58,555,480,20,'Devinette',13,CORAL,True)
txt(s,58,580,480,70,['Je descends sous terre, je tourne sans cesse, je mords la roche et je ne m\'arrête qu\'une fois au fond. Qui suis-je ?'],11,line=15)
shp(s,S.ROUNDED_RECTANGLE,40,672,515,86,SUN,adj=0.1);txt(s,56,680,490,14,'Solutions',10.5,NAVY,True)
txt(s,56,698,490,56,['Mots codés : '+', '.join(cw),'Anagrammes : '+', '.join(a for a,b in ana),'Devinette : le trépan'],9,NAVY,line=12)
foot(s,10)
# 11 dos
s=slide(NAVY);shp(s,S.OVAL,200,380,480,480,ORANGE);shp(s,S.OVAL,290,470,300,300,SUN);shp(s,S.OVAL,-80,-60,240,240,CYAN)
s.shapes.add_picture(LOGO,Pt(50),Pt(330),width=Pt(300));txt(s,50,400,400,16,'Fishing and Drilling Solutions',11,SUN)
txt(s,50,120,420,80,'Merci,\nbonnes fêtes\net à 2027 !'.split('\n'),30,WHITE,True,line=38)
txt(s,50,780,480,14,'www.enedril.com · 3 av des lacs, 64140 Lons',10,WHITE)
P.save('Gazette_Enedril_2026.pptx')
