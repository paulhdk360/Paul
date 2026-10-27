# Trames de présentation Enedril (v2) : diapositives types dans l'identité des plaquettes. python3 -I generer_trames_v2.py
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor as C
from pptx.enum.text import PP_ALIGN,MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE as S
from pptx.enum.dml import MSO_LINE
NAVY=(8,32,63);BLUE=(10,79,160);MID=(25,78,154);CYAN=(28,178,254);SKY=(1,173,238);PALE=(234,244,252);INK=(11,27,46);GREY=(90,107,127);WHITE=(255,255,255);LINE=(213,225,238)
F='Ubuntu Mono';LOGOC='../certifications/logo_officiel_couleur_avec_baseline.png';LOGOW='v2/logo_blanc_avec_baseline.png'
FOOT='Enedril · Fishing and Drilling Solutions · 3 avenue des Lacs, 64140 Lons (France) · info@enedril.fr · +33 (0)5 59 04 50 45'
def build(L):
    W,H=(842,595) if L else (595,842);P=Presentation();P.slide_width=Pt(W);P.slide_height=Pt(H)
    n=[0]
    def new(bg=WHITE):
        s=P.slides.add_slide(P.slide_layouts[6]);n[0]+=1;rect(s,0,0,W,H,bg);return s
    def rect(s,x,y,w,h,fill,line=None,dash=False,shape=S.RECTANGLE):
        r=s.shapes.add_shape(shape,Pt(x),Pt(y),Pt(w),Pt(h));r.shadow.inherit=False
        if fill is None:r.fill.background()
        else:r.fill.solid();r.fill.fore_color.rgb=C(*fill)
        if line:r.line.color.rgb=C(*line);r.line.width=Pt(1);r.line.dash_style=MSO_LINE.DASH if dash else None
        else:r.line.fill.background()
        return r
    def poly(s,pts,fill):
        fb=s.shapes.build_freeform(Pt(pts[0][0]),Pt(pts[0][1]));fb.add_line_segments([(Pt(x),Pt(y)) for x,y in pts[1:]],close=True)
        sh=fb.convert_to_shape();sh.shadow.inherit=False;sh.fill.solid();sh.fill.fore_color.rgb=C(*fill);sh.line.fill.background();return sh
    def txt(s,x,y,w,h,text,size=10,color=INK,bold=False,align=PP_ALIGN.LEFT,anchor=MSO_ANCHOR.TOP,line=None,caps=False):
        tb=s.shapes.add_textbox(Pt(x),Pt(y),Pt(w),Pt(h));tf=tb.text_frame;tf.word_wrap=True;tf.vertical_anchor=anchor
        tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
        for i,t in enumerate(text if isinstance(text,list) else [text]):
            p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.alignment=align;p.space_after=Pt(size*0.45)
            if line:p.line_spacing=Pt(line)
            r=p.add_run();r.text=t.upper() if caps else t;r.font.size=Pt(size);r.font.bold=bold;r.font.name=F;r.font.color.rgb=C(*color)
        return tb
    def header(s,title):
        s.shapes.add_picture(LOGOC,Pt(W-40-112),Pt(24),width=Pt(112))
        txt(s,40,32,W-80-130,26,title,17,BLUE,True,caps=True)
    def footer(s):
        rect(s,40,H-34,W-80,0.8,LINE);txt(s,40,H-26,W-160,10,FOOT,6.5,GREY);txt(s,W-80,H-26,40,10,str(n[0]),7,BLUE,True,PP_ALIGN.RIGHT)
    def tile(s,x,y,w,h,big,small,fill):
        rect(s,x,y,w,h,fill);txt(s,x+6,y+h*0.18,w-12,h*0.45,big,20 if h>60 else 16,WHITE,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE);txt(s,x+8,y+h*0.62,w-16,h*0.34,small,7.5,(215,235,250),False,PP_ALIGN.CENTER,line=9.5)
    def panel(s,x,y,w,h,title,body,fill,fg=WHITE,sub=(215,235,250)):
        rect(s,x,y,w,h,fill);txt(s,x+10,y+9,w-20,14,title,8,fg if fill!=PALE else BLUE,True,caps=True);txt(s,x+10,y+27,w-20,h-34,body,8.5,fg if fill!=PALE else INK,line=11.5)
    def photo(s,x,y,w,h,label='Image à insérer'):
        rect(s,x,y,w,h,(232,238,246),(150,175,200),True);txt(s,x+8,y,w-16,h,label+' (clic droit : Modifier l’image)',8,GREY,False,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE)
    LOREM='Texte à remplacer : décrivez ici votre sujet en quelques lignes claires, avec des phrases courtes.'
    x0,x1=40,W-40;cw=x1-x0;y0=100 if L else 96;yb=H-48
    # 1 couverture
    s=new(BLUE)
    poly(s,[(0,0),(W*.57,0),(W*.40,H*.50),(0,H*.60)] if L else [(0,0),(W,0),(W,H*.30),(0,H*.42)],(25,95,175)) 
    poly(s,[(W*.42,H*.48),(W,H*.30),(W,H),(0,H)] if L else [(0,H*.62),(W,H*.50),(W,H),(0,H)],SKY)
    poly(s,[(W*.62,H*.62),(W,H*.48),(W,H),(W*.35,H)] if L else [(0,H*.80),(W,H*.72),(W,H),(0,H)],CYAN)
    s.shapes.add_picture(LOGOW,Pt(40),Pt(46 if L else 50),width=Pt(300 if L else 250))
    txt(s,40,H-135 if L else H-175,W*.6,70,['TITRE DE LA PRÉSENTATION','& SOUS-TITRE'],17,WHITE,True,line=23)
    txt(s,40,H-62 if L else H-84,W*.6,16,'Date · Interlocuteur · Lieu',9,WHITE)
    # 2 sommaire
    s=new();header(s,'Sommaire')
    items=['Introduction','Notre offre','Nos références','Chiffres clés','Notre équipe','Contact']
    cols=2 if L else 1;rows=(len(items)+cols-1)//cols;gw=(cw-20*(cols-1))/cols;rh=min(56,(yb-y0-10*(rows-1))/rows)
    for i,t in enumerate(items):
        c,r=(i//rows,i%rows) if L else (0,i);x=x0+c*(gw+20);y=y0+r*(rh+10)
        rect(s,x,y,52,rh,BLUE if i%2==0 else SKY);txt(s,x,y,52,rh,'%02d'%(i+1),18,WHITE,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE)
        rect(s,x+52,y,gw-52,rh,PALE);txt(s,x+66,y,gw-80,rh,t,12,NAVY,True,anchor=MSO_ANCHOR.MIDDLE,caps=True)
    footer(s)
    # 3 chapitre
    s=new(NAVY)
    poly(s,[(W*.40,0),(W,0),(W,H),(W*.18,H)] if L else [(0,H*.35),(W,H*.22),(W,H),(0,H)],BLUE)
    poly(s,[(W*.72,0),(W,0),(W,H),(W*.50,H)] if L else [(0,H*.62),(W,H*.52),(W,H),(0,H)],SKY)
    txt(s,40,H*.28 if L else H*.40,W*.4 if L else W-80,70,'01',50,CYAN,True)
    txt(s,40,H*.28+64 if L else H*.40+64,W*.42 if L else W-80,70,'Titre du chapitre',22,WHITE,True,caps=True)
    s.shapes.add_picture(LOGOW,Pt(40),Pt(H-62),width=Pt(140))
    # 4 titre + texte
    s=new();header(s,'Titre de la diapositive')
    lw=cw*0.52 if L else cw
    txt(s,x0,y0,lw,200 if L else 150,[LOREM,LOREM+' '+LOREM],9.5,INK,line=13)
    txt(s,x0,y0+(210 if L else 160),lw,14,'Sous-titre',9,BLUE,True,caps=True)
    txt(s,x0,y0+(228 if L else 178),lw,120,[LOREM+' '+LOREM],9.5,INK,line=13)
    rx=x0+lw+20 if L else x0;ry=y0 if L else y0+300;rw=cw-lw-20 if L else cw
    tw=(rw-10)/2
    for i,(b,l,c) in enumerate((('00 000','indicateur 1',BLUE),('00','indicateur 2',SKY),('000','indicateur 3',SKY),('0 000','indicateur 4',BLUE))):tile(s,rx+(i%2)*(tw+10),ry+(i//2)*88,tw,78,b,l,c)
    panel(s,rx,ry+190,rw,(yb-ry-190) if L else 120,'Encadré',LOREM,PALE)
    footer(s)
    # 5 chiffres clés
    s=new();header(s,'Chiffres clés')
    if L:
        tw=(cw-30)/4
        for i,(b,l,c) in enumerate((('00 000 m','libellé de l’indicateur',BLUE),('00','libellé de l’indicateur',SKY),('000','libellé de l’indicateur',SKY),('0 000','libellé de l’indicateur',BLUE))):tile(s,x0+i*(tw+10),y0,tw,80,b,l,c)
        ty=y0+100;pw=(cw-20)/3
    else:
        tw=(cw-10)/2
        for i,(b,l,c) in enumerate((('00 000 m','libellé de l’indicateur',BLUE),('00','libellé de l’indicateur',SKY),('000','libellé de l’indicateur',SKY),('0 000','libellé de l’indicateur',BLUE))):tile(s,x0+(i%2)*(tw+10),y0+(i//2)*100,tw,90,b,l,c)
        ty=y0+210;pw=cw
    for i,(t,c,fg) in enumerate((('Bloc 1',BLUE,WHITE),('Bloc 2',SKY,WHITE),('Bloc 3',PALE,INK))):
        if L:panel(s,x0+i*(pw+10),ty,pw,yb-ty-6,t,LOREM+' '+LOREM,c,fg)
        else:panel(s,x0,ty+i*((yb-ty)/3),pw,(yb-ty)/3-8,t,LOREM,c,fg)
    footer(s)
    # 6 texte + images
    s=new();header(s,'Titre de la diapositive')
    if L:
        txt(s,x0,y0,cw*.46,300,[LOREM+' '+LOREM,LOREM],9.5,INK,line=13);photo(s,x0+cw*.5,y0,cw*.5,(yb-y0-10)/2);photo(s,x0+cw*.5,y0+(yb-y0-10)/2+10,cw*.5,(yb-y0-10)/2)
    else:
        txt(s,x0,y0,cw,200,[LOREM+' '+LOREM,LOREM],9.5,INK,line=13);photo(s,x0,y0+220,cw/2-5,260);photo(s,x0+cw/2+5,y0+220,cw/2-5,260)
        panel(s,x0,y0+500,cw,yb-y0-505,'Légende',LOREM,BLUE)
    footer(s)
    # 7 trois blocs + encadré
    s=new();header(s,'Titre de la diapositive')
    pw=(cw-20)/3 if L else cw;ph_=150 if L else 130
    for i,(t,c) in enumerate((('Bloc 1',NAVY),('Bloc 2',BLUE),('Bloc 3',SKY))):
        if L:panel(s,x0+i*(pw+10),y0,pw,ph_,t,LOREM,c)
        else:panel(s,x0,y0+i*(ph_+8),pw,ph_,t,LOREM,c)
    by=y0+ph_+16 if L else y0+3*(ph_+8)+8
    rect(s,x0,by,cw,yb-by-4,PALE);txt(s,x0+10,by+9,cw-20,14,'Encadré complémentaire',8,BLUE,True,caps=True)
    bw=(cw-20-20)/3 if L else cw-20
    for i in range(3):
        if L:rect(s,x0+10+i*(bw+10),by+30,bw,yb-by-48,WHITE,LINE);txt(s,x0+18+i*(bw+10),by+36,bw-16,yb-by-60,'Sous-titre\n'+LOREM,8.5,INK,line=11.5)
        else:
            hh=(yb-by-48)/3-6;rect(s,x0+10,by+30+i*(hh+8),bw,hh,WHITE,LINE);txt(s,x0+18,by+36+i*(hh+8),bw-16,hh-8,'Sous-titre\n'+LOREM,8.5,INK,line=11.5)
    footer(s)
    # 8 frise
    s=new();header(s,'Notre histoire')
    rect(s,x0,y0,cw,22,PALE);txt(s,x0+8,y0+2,cw-16,18,'Phrase d’introduction de la frise chronologique.',8.5,BLUE,True,anchor=MSO_ANCHOR.MIDDLE)
    if L:
        tw=(cw-30)/4
        for i,(yr,c) in enumerate((('2013',NAVY),('2019',BLUE),('2022',SKY),('2025',MID))):
            x=x0+i*(tw+10);rect(s,x,y0+36,tw,44,c);txt(s,x,y0+36,tw,44,yr,20,WHITE,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE);txt(s,x,y0+92,tw,14,'Événement',8,BLUE,True,caps=True);txt(s,x,y0+108,tw,70,LOREM,8,INK,line=10.5)
        panel(s,x0,y0+210,(cw-10)/2,yb-y0-215,'Continuité',LOREM,BLUE);panel(s,x0+(cw-10)/2+10,y0+210,(cw-10)/2,yb-y0-215,'Nouvelle dynamique',LOREM,SKY)
    else:
        for i,(yr,c) in enumerate((('2013',NAVY),('2019',BLUE),('2022',SKY),('2025',MID))):
            y=y0+36+i*96;rect(s,x0,y,110,80,c);txt(s,x0,y,110,80,yr,22,WHITE,True,PP_ALIGN.CENTER,MSO_ANCHOR.MIDDLE);rect(s,x0+110,y,cw-110,80,PALE);txt(s,x0+124,y+10,cw-140,14,'Événement',8,BLUE,True,caps=True);txt(s,x0+124,y+28,cw-140,50,LOREM,8.5,INK,line=11)
        panel(s,x0,y0+36+4*96+6,cw,yb-(y0+36+4*96+6)-4,'Aujourd’hui',LOREM,BLUE)
    footer(s)
    # 9 image + panneau
    s=new();header(s,'Titre de la diapositive')
    if L:photo(s,x0,y0,cw*.58,yb-y0-6);panel(s,x0+cw*.58+12,y0,cw*.42-12,yb-y0-6,'Points clés','\n'.join(['■ Premier point à développer','■ Deuxième point à développer','■ Troisième point à développer','■ Quatrième point à développer']),BLUE)
    else:photo(s,x0,y0,cw,330);panel(s,x0,y0+342,cw,yb-y0-346,'Points clés','\n'.join(['■ Premier point à développer','■ Deuxième point à développer','■ Troisième point à développer']),BLUE)
    footer(s)
    # 10 tableau
    s=new();header(s,'Titre du tableau')
    rows_,cols_=6,4 if L else 3
    tb=s.shapes.add_table(rows_,cols_,Pt(x0),Pt(y0),Pt(cw),Pt(30*rows_)).table
    for r in range(rows_):
        for c in range(cols_):
            cell=tb.cell(r,c);cell.text='Colonne %d'%(c+1) if r==0 else 'Donnée';cell.margin_left=Pt(8)
            run=cell.text_frame.paragraphs[0].runs[0];run.font.name=F;run.font.size=Pt(9.5 if r else 10);run.font.bold=(r==0);run.font.color.rgb=C(*(WHITE if r==0 else INK))
            cell.fill.solid();cell.fill.fore_color.rgb=C(*(BLUE if r==0 else (PALE if r%2 else WHITE)))
    txt(s,x0,y0+30*rows_+14,cw,40,'Note ou source du tableau.',8,GREY)
    footer(s)
    # 11 atouts (4 encadrés)
    s=new();header(s,'Pourquoi nous choisir')
    gh=(yb-y0-3*10)/4 if not L else None
    if L:
        pw=(cw-10)/2;ph_=(yb-y0-10)/2
        for i,t in enumerate(('Atout 1','Atout 2','Atout 3','Atout 4')):
            x=x0+(i%2)*(pw+10);y=y0+(i//2)*(ph_+10);rect(s,x,y,pw,ph_,PALE);rect(s,x,y,4,ph_,SKY);txt(s,x+16,y+14,pw-30,16,t,10,BLUE,True,caps=True);txt(s,x+16,y+36,pw-30,ph_-44,LOREM,9,INK,line=12)
    else:
        for i,t in enumerate(('Atout 1','Atout 2','Atout 3','Atout 4')):
            y=y0+i*(gh+10);rect(s,x0,y,cw,gh,PALE);rect(s,x0,y,4,gh,SKY);txt(s,x0+16,y+12,cw-30,16,t,10,BLUE,True,caps=True);txt(s,x0+16,y+34,cw-30,gh-40,LOREM,9,INK,line=12)
    footer(s)
    # 12 fin
    s=new(BLUE)
    poly(s,[(0,0),(W*.60,0),(W*.40,H*.55),(0,H*.65)] if L else [(0,0),(W,0),(W,H*.34),(0,H*.46)],(25,95,175))
    poly(s,[(W*.45,H*.55),(W,H*.35),(W,H),(0,H)] if L else [(0,H*.66),(W,H*.54),(W,H),(0,H)],SKY)
    s.shapes.add_picture(LOGOW,Pt(40),Pt(50),width=Pt(300 if L else 250))
    txt(s,40,H*.50 if L else H*.40,W*.5,40,'Merci',28,WHITE,True,caps=True)
    txt(s,40,H-120 if L else H-150,W*.6,100,['Enedril','3 avenue des Lacs','64140 Lons (France)','info@enedril.fr','+33 (0)5 59 04 50 45','www.enedril.com'],10.5,WHITE,False,line=14)
    P.save(f"Trame_Enedril_{'paysage' if L else 'portrait'}_A4.pptx")
build(True);build(False)
