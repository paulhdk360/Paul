# Trames de présentation Enedril vierges (paysage et portrait, A4) : python3 -I generer_trames.py
import re,subprocess,os,copy
from pptx import Presentation
from pptx.util import Pt,Emu
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from lxml import etree
LG='../stand-geotherm-2027/00_Logo_vectoriel/'
def svg_inner(f):
    s=open(LG+f).read();vb=re.search(r'viewBox="([^"]+)"',s).group(1).split();return float(vb[2]),float(vb[3]),re.search(r'<svg[^>]*>(.*)</svg>',s,re.S).group(1)
LW,LH,LOGO_W=svg_inner('Enedril_logo_blanc_sans_baseline.svg')
CW,CH,LOGO_C=svg_inner('Enedril_logo_couleur_sans_baseline.svg')
NAVY='#08203F';BLUE='#0A4FA0';MID='#194E9A';CYAN='#1CB2FE';GREY='#5A6B7F'
FOOT='Enedril · Fishing and Drilling Solutions · 3 avenue des Lacs, 64140 Lons (France) · info@enedril.fr · +33 (0)5 59 04 50 45'
def render(html,w,h,out):
    open('/tmp/_t.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;width:{w}px;height:{h}px;overflow:hidden}}</style></head><body>{html}</body></html>')
    subprocess.run(['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','--headless','--no-sandbox','--hide-scrollbars','--force-device-scale-factor=1',f'--screenshot=/tmp/_t.png',f'--window-size={w},{h+400}','file:///tmp/_t.html'],capture_output=True)
    from PIL import Image;Image.open('/tmp/_t.png').convert('RGB').crop((0,0,w,h)).save(out,optimize=True)
def build(orient):
    pw,ph=(842,595) if orient=='paysage' else (595,842);S=3;W,H=pw*S,ph*S;L=orient=='paysage'
    f=lambda v:v*S
    poly=lambda pts,c:f'<polygon points="{" ".join(f"{f(x)},{f(y)}" for x,y in pts)}" fill="{c}"/>'
    def svg(body):return f'<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0" xmlns="http://www.w3.org/2000/svg">{body}</svg>'
    def logo(kind,x,y,w):
        iw,ih,inner=(LW,LH,LOGO_W) if kind=='w' else (CW,CH,LOGO_C)
        return f'<svg viewBox="0 0 {iw} {ih}" style="position:absolute;left:{f(x)}px;top:{f(y)}px;width:{f(w)}px" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'
    foot_html=lambda:(f'<div style="position:absolute;left:{f(40)}px;top:{f(ph-34)}px;width:{f(pw-80)}px;font-family:\'Ubuntu Mono\',monospace;font-size:{f(6.5)}px;color:{GREY}">{FOOT}</div>'
                       +svg(f'<rect x="{f(40)}" y="{f(ph-42)}" width="{f(pw-80)}" height="{f(0.8)}" fill="#D5E1EE"/>'))
    bg={}
    # couverture
    a=poly([(0,ph*.50),(pw,ph*.28),(pw,ph),(0,ph)],BLUE)+poly([(0,ph*.72),(pw,ph*.60),(pw,ph),(0,ph)],MID)
    bg['couverture']=f'<div style="position:absolute;inset:0;background:{NAVY}"></div>'+svg(a)+logo('w',40,36,170 if L else 150)
    # section
    a=poly([(pw*.42,0),(pw,0),(pw,ph),(pw*.22,ph)],BLUE)+poly([(pw*.75,0),(pw,0),(pw,ph),(pw*.55,ph)],MID)
    bg['section']=f'<div style="position:absolute;inset:0;background:{NAVY}"></div>'+svg(a)+logo('w',40,ph-80,130)
    # contenu
    tl=(pw-40-110,30);ul=(40,(88 if L else 94))
    base=f'<div style="position:absolute;inset:0;background:#fff"></div>'+logo('c',tl[0],tl[1],110 if L else 95)+svg(f'<rect x="{f(ul[0])}" y="{f(ul[1])}" width="{f(56)}" height="{f(3.5)}" fill="{CYAN}"/>')+foot_html()
    bg['contenu']=base;bg['deux']=base;bg['titre']=base
    # chiffres clés : 4 boites bleues
    bx=''
    if L:
        pos=[(40+i*(pw-80+14)/4,130,(pw-80-42)/4,150) for i in range(4)]
    else:
        pos=[(40+(i%2)*((pw-80+14)/2),150+(i//2)*170,(pw-80-14)/2,150) for i in range(4)]
    for i,(x,y,w,h) in enumerate(pos):bx+=f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="{[BLUE,MID,BLUE,MID][i]}"/>'
    bg['chiffres']=base+svg(bx)
    # fin
    a=poly([(0,ph*.62),(pw,ph*.46),(pw,ph),(0,ph)],BLUE)
    bg['fin']=f'<div style="position:absolute;inset:0;background:{NAVY}"></div>'+svg(a)+logo('w',40,ph*.18,260 if L else 230)+f'<div style="position:absolute;left:{f(40)}px;top:{f(ph-70)}px;font-family:\'Ubuntu Mono\',monospace;font-size:{f(9)}px;color:#fff;line-height:1.5">3 avenue des Lacs, 64140 Lons (France)<br>+33 (0)5 59 04 50 45 · info@enedril.fr<br><b>www.enedril.com</b></div>'
    os.makedirs('fonds',exist_ok=True);files={}
    for k,v in bg.items():
        fn=f'fonds/{orient}_{k}.png';render(v,W,H,fn);files[k]=fn
    # ---- pptx
    prs=Presentation();prs.slide_width=Pt(pw);prs.slide_height=Pt(ph)
    NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
    nsdecl=' '.join(f'xmlns:{k}="{v}"' for k,v in NS.items())
    E=lambda v:int(v*12700)
    def ph_xml(idx,typ,name,x,y,w,h,size,color,bold,anchor,prompt,caps=False,extra_levels='',algn='l'):
        t=f' type="{typ}"' if typ else ''
        lvl=f'<a:lvl1pPr marL="0" indent="0" algn="{algn}"><a:spcBef><a:spcPts val="0"/></a:spcBef><a:buNone/><a:defRPr sz="{int(size*100)}" b="{1 if bold else 0}"{" cap=\"all\"" if caps else ""}><a:solidFill><a:srgbClr val="{color}"/></a:solidFill><a:latin typeface="Ubuntu Mono"/></a:defRPr></a:lvl1pPr>'+extra_levels
        return (f'<p:sp {nsdecl}><p:nvSpPr><p:cNvPr id="{idx+2}" name="{name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph{t} idx="{idx}"/></p:nvPr></p:nvSpPr>'
                f'<p:spPr><a:xfrm><a:off x="{E(x)}" y="{E(y)}"/><a:ext cx="{E(w)}" cy="{E(h)}"/></a:xfrm></p:spPr>'
                f'<p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="{anchor}"><a:normAutofit/></a:bodyPr><a:lstStyle>{lvl}</a:lstStyle><a:p><a:r><a:rPr lang="fr-FR"/><a:t>{prompt}</a:t></a:r></a:p></p:txBody></p:sp>')
    def bullets(color,size):  # niveaux 1-3 avec puces cyan
        out=''
        for lv,(ml,sz) in enumerate(((0,size),(16,size-1.5),(32,size-2)),start=1):
            out+=f'<a:lvl{lv}pPr marL="{E(ml+14)}" indent="{-E(14)}"><a:spcBef><a:spcPts val="600"/></a:spcBef><a:buClr><a:srgbClr val="{CYAN}"/></a:buClr><a:buFont typeface="Wingdings"/><a:buChar char="&#167;"/><a:defRPr sz="{int(sz*100)}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill><a:latin typeface="Ubuntu Mono"/></a:defRPr></a:lvl{lv}pPr>'
        return out
    tw=pw-80-(130 if L else 120)
    specs={
     'couverture':('Couverture',[ph_xml(0,'ctrTitle','Titre',50,ph*.52 if L else ph*.50,pw-100,ph*.20,32 if L else 28,'FFFFFF',True,'b','Titre de la présentation',True),ph_xml(1,'subTitle','Sous-titre',50,(ph*.52+ph*.20+10) if L else ph*.50+ph*.20+10,pw-100,40,13,'8FD6FF',False,'t','Sous-titre · date · interlocuteur')]),
     'section':('Titre de section',[ph_xml(0,'title','Titre',50,ph*.30,pw*.45,ph*.34,28,'FFFFFF',True,'b','Titre de section',True),ph_xml(1,'body','Texte',50,ph*.30+ph*.34+12,pw*.4,60,12,'8FD6FF',False,'t','Courte introduction')]),
     'contenu':('Titre et contenu',[ph_xml(0,'title','Titre',40,36 if L else 40,tw,44,20,BLUE.lstrip('#'),True,'b','Titre de la diapositive',True),ph_xml(1,'body','Contenu',40,112 if L else 140,pw-80,ph-112-62 if L else ph-140-62,13,'0B1B2E',False,'t','Cliquez pour ajouter du texte',extra_levels=bullets('0B1B2E',13))]),
     'deux':('Deux colonnes',[ph_xml(0,'title','Titre',40,36 if L else 40,tw,44,20,BLUE.lstrip('#'),True,'b','Titre de la diapositive',True),
        *( [ph_xml(1,'body','Colonne 1',40,112,(pw-80-20)/2,ph-112-62,12.5,'0B1B2E',False,'t','Colonne de gauche',extra_levels=bullets('0B1B2E',12.5)),ph_xml(2,'body','Colonne 2',40+(pw-80-20)/2+20,112,(pw-80-20)/2,ph-112-62,12.5,'0B1B2E',False,'t','Colonne de droite',extra_levels=bullets('0B1B2E',12.5))] if L else
            [ph_xml(1,'body','Bloc 1',40,140,pw-80,(ph-140-62-20)/2,12.5,'0B1B2E',False,'t','Premier bloc',extra_levels=bullets('0B1B2E',12.5)),ph_xml(2,'body','Bloc 2',40,140+(ph-140-62-20)/2+20,pw-80,(ph-140-62-20)/2,12.5,'0B1B2E',False,'t','Second bloc',extra_levels=bullets('0B1B2E',12.5))] )]),
     'chiffres':('Chiffres clés',[ph_xml(0,'title','Titre',40,36 if L else 40,tw,44,20,BLUE.lstrip('#'),True,'b','Chiffres clés',True)]
        +[ph_xml(i+1,'body',f'Chiffre {i+1}',pos[i][0]+12,pos[i][1]+14,pos[i][2]-24,pos[i][3]-28,26 if L else 24,'FFFFFF',True,'ctr','00 000',extra_levels=f'<a:lvl2pPr marL="0" indent="0" algn="ctr"><a:buNone/><a:defRPr sz="1000" b="0"><a:solidFill><a:srgbClr val="BFE4FF"/></a:solidFill><a:latin typeface="Ubuntu Mono"/></a:defRPr></a:lvl2pPr>',algn='ctr') for i in range(4)]
        +[ph_xml(5,'body','Contenu',40,(130+150+20) if L else (150+2*170+0),pw-80,ph-(130+150+20)-62 if L else ph-(150+340)-62,12.5,'0B1B2E',False,'t','Commentaire',extra_levels=bullets('0B1B2E',12.5))]),
     'titre':('Titre seul',[ph_xml(0,'title','Titre',40,36 if L else 40,tw,44,20,BLUE.lstrip('#'),True,'b','Titre de la diapositive',True)]),
     'fin':('Fin et contacts',[ph_xml(0,'title','Titre',pw*.55 if L else 40,ph*.22 if L else ph*.40,pw*.38 if L else pw-80,ph*.14,30,'FFFFFF',True,'b','Merci',True)]),
    }
    order=['couverture','section','contenu','deux','chiffres','titre','fin']
    layouts=list(prs.slide_layouts)
    for l in layouts[7:]:prs.slide_layouts.remove(l)
    for key,lay in zip(order,layouts[:7]):
        name,shapes=specs[key];cSld=lay._element.find(qn('p:cSld')) if False else lay._element.cSld
        cSld.set('name',name)
        tree=cSld.spTree
        for sp in list(tree):
            if sp.tag.endswith('}sp') or sp.tag.endswith('}pic'):tree.remove(sp)
        for x in shapes:tree.append(etree.fromstring(x))
        # fond image
        _,rId=lay.part.get_or_add_image_part(files[key])
        for old in cSld.findall(qn('p:bg')):cSld.remove(old)
        bgx=etree.fromstring(f'<p:bg {nsdecl}><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="{rId}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>')
        cSld.insert(0,bgx)
        lay._element.set('type',{'couverture':'title','section':'secHead','contenu':'obj','deux':'twoObj','chiffres':'obj','titre':'titleOnly','fin':'titleOnly'}[key])
    # thème : polices et couleurs Enedril
    th=prs.slide_master.part.part_related_by(RT.THEME);b=th.blob.decode('utf8')
    b=re.sub(r'(<a:majorFont>\s*<a:latin typeface=")[^"]*','\\1Ubuntu Mono',b);b=re.sub(r'(<a:minorFont>\s*<a:latin typeface=")[^"]*','\\1Ubuntu Mono',b)
    for tag,val in (('dk2','08203F'),('lt2','EAF4FC'),('accent1','0A4FA0'),('accent2','1CB2FE'),('accent3','0F7FCB'),('accent4','01ADEE'),('accent5','08203F'),('accent6','5A6B7F')):
        b=re.sub(rf'(<a:{tag}>)<a:\w+ [^/]*/>(</a:{tag}>)',rf'\1<a:srgbClr val="{val}"/>\2',b)
    th._blob=b.encode('utf8')
    # le gabarit principal : retire les espaces réservés d'origine (positionnés pour 4:3)
    m=prs.slide_master
    for sp in list(m._element.cSld.spTree):
        if sp.tag.endswith('}sp'):m._element.cSld.spTree.remove(sp)
    prs.save(f'Trame_Enedril_{orient}_A4.pptx')
from pptx.oxml.ns import qn
for o in ('paysage','portrait'):build(o)
