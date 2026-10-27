# Papier en-tête Enedril A4 : python3 -I generer_papier_en_tete.py -> Papier_en_tete_Enedril_A4.docx (+ PDF via LibreOffice)
import re,subprocess,io
from PIL import Image
from docx import Document
from docx.shared import Cm,Pt,RGBColor,Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
LG='../stand-geotherm-2027/00_Logo_vectoriel/'
col=open(LG+'Enedril_logo_couleur.svg').read()
vb=re.search(r'viewBox="([^"]+)"',col).group(1).split();W,H=float(vb[2]),float(vb[3])
inner=re.search(r'<svg[^>]*>(.*)</svg>',col,re.S).group(1)
icon=re.sub(r'<defs>.*?</defs>','',inner,flags=re.S);icon=re.sub(r'<path fill="url\(#g\)".*?/>','',icon,flags=re.S)
icon=re.sub(r'<path fill="#0F7FCB" fill-rule="evenodd"[^>]*/>','',icon)   # sans la baseline pour l'icône seule
html=f'''<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;width:2480px;height:420px;overflow:hidden;background:#fff}}</style></head><body>
<svg viewBox="0 0 345 {H}" style="position:absolute;width:760px;right:-170px;top:-250px;opacity:1" xmlns="http://www.w3.org/2000/svg">{icon}</svg>
<svg viewBox="0 0 {W} {H}" style="position:absolute;left:236px;top:92px;height:190px" xmlns="http://www.w3.org/2000/svg">{inner}</svg></body></html>'''
open('/tmp/pt_header.html','w').write(html)
subprocess.run(['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','--headless','--no-sandbox','--hide-scrollbars','--force-device-scale-factor=1','--screenshot=/tmp/pt_header.png','--window-size=2480,700','file:///tmp/pt_header.html'],capture_output=True)
Image.open('/tmp/pt_header.png').convert('RGB').crop((0,0,2480,420)).save('en_tete_image.png')
FONT='Ubuntu Mono';NAVY='08203F'
def setfont(run,size,color=None,bold=False):
    run.font.name=FONT;run.font.size=Pt(size);run.font.bold=bold
    rf=run._r.get_or_add_rPr().find(qn('w:rFonts'))
    for a in ('w:ascii','w:hAnsi','w:cs','w:eastAsia'):rf.set(qn(a),FONT)
    if color:run.font.color.rgb=RGBColor.from_string(color)
def shade(cell,color):
    tcPr=cell._tc.get_or_add_tcPr();sh=OxmlElement('w:shd');sh.set(qn('w:val'),'clear');sh.set(qn('w:color'),'auto');sh.set(qn('w:fill'),color);tcPr.append(sh)
def cellmargins(cell,top,left,bottom,right):
    tcPr=cell._tc.get_or_add_tcPr();m=OxmlElement('w:tcMar')
    for k,v in (('top',top),('left',left),('bottom',bottom),('right',right)):
        e=OxmlElement('w:'+k);e.set(qn('w:w'),str(v));e.set(qn('w:type'),'dxa');m.append(e)
    tcPr.append(m)
d=Document();sec=d.sections[0]
sec.page_width=Cm(21);sec.page_height=Cm(29.7);sec.left_margin=sec.right_margin=Cm(2.2);sec.top_margin=Cm(4.6);sec.bottom_margin=Cm(3.9)
sec.header_distance=Cm(0);sec.footer_distance=Cm(0)
st=d.styles['Normal'];st.font.name=FONT;st.font.size=Pt(11.5);st.element.rPr.rFonts.set(qn('w:eastAsia'),FONT)
# ---- en-tête pleine largeur
hp=sec.header.paragraphs[0];hp.paragraph_format.left_indent=Cm(-2.2);hp.paragraph_format.space_after=Pt(0);hp.paragraph_format.space_before=Pt(0)
hp.add_run().add_picture('en_tete_image.png',width=Cm(21))
# ---- pied de page : bandeau marine pleine largeur
fp=sec.footer.paragraphs[0];fp.paragraph_format.space_after=Pt(0)
r=fp.add_run('[SAS au capital de … € · RCS … · SIRET … · TVA intracommunautaire FR…]');setfont(r,7,'7A8AA0');fp.alignment=WD_ALIGN_PARAGRAPH.CENTER
t=sec.footer.add_table(1,2,Cm(21));t.autofit=False
tblPr=t._tbl.tblPr;ind=OxmlElement('w:tblInd');ind.set(qn('w:w'),str(int(-2.2*567)));ind.set(qn('w:type'),'dxa');tblPr.append(ind)
a,b=t.rows[0].cells;a.width=Cm(14.4);b.width=Cm(6.6)
lay=OxmlElement('w:tblLayout');lay.set(qn('w:type'),'fixed');tblPr.append(lay)
t.columns[0].width=Cm(14.4);t.columns[1].width=Cm(6.6)
for c in (a,b):shade(c,NAVY);cellmargins(c,200,int(2.2*567) if c is a else 0,200,int(1.4*567));c.vertical_alignment=WD_ALIGN_VERTICAL.CENTER
p=a.paragraphs[0];p.paragraph_format.space_after=Pt(2);r=p.add_run('ENEDRIL · Fishing and Drilling Solutions');setfont(r,9,'FFFFFF',True)
for line in ('3 avenue des Lacs · 64140 Lons (France)','+33 (0)5 59 04 50 45 · info@enedril.fr · www.enedril.com'):
    p=a.add_paragraph();p.paragraph_format.space_after=Pt(0);r=p.add_run(line);setfont(r,8.5,'BFD9F2')
p=b.paragraphs[0];p.alignment=WD_ALIGN_PARAGRAPH.RIGHT
for f,h_ in (('../certifications/RSE_badge_entreprise_engagee.png',1.5),('../certifications/LRQA_ISO9001_blanc.png',1.5)):
    p.add_run().add_picture(f,height=Cm(h_));p.add_run('   ')
# ---- corps de lettre (texte d'exemple à remplacer)
def para(text,size=11.5,bold=False,color=None,after=6,align=None):
    p=d.add_paragraph();p.paragraph_format.space_after=Pt(after);r=p.add_run(text);setfont(r,size,color,bold)
    if align:p.alignment=align
    return p
para('Lons, le [date]',11,False,'5A6B7F',18,WD_ALIGN_PARAGRAPH.RIGHT)
para('[Nom du destinataire]',11.5,True,None,0);para('[Société]',11.5,False,None,0);para('[Adresse]',11.5,False,None,0);para('[Code postal · Ville]',11.5,False,None,18)
para('Objet : [objet du courrier]',11.5,True,'0A4FA0',12)
para('Madame, Monsieur,',11.5,False,None,8)
para('[Corps du courrier. Remplacez ce texte par le vôtre. La police du modèle est Ubuntu Mono.]',11.5,False,None,8)
para('Nous restons à votre disposition pour tout complément d’information.',11.5,False,None,8)
para('Cordialement,',11.5,False,None,28)
para('[Prénom NOM]',11.5,True,None,0);para('[Fonction] · Enedril',11,False,'5A6B7F',0)
d.save('Papier_en_tete_Enedril_A4.docx')
