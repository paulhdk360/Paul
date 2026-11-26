# Mémo « collecte de jouets » sur le papier à en-tête Enedril : python3 -I generer_memo.py <entete_vierge.docx> <sortie.docx>
import sys,copy,docx
from docx.shared import Pt,RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
d=docx.Document(sys.argv[1]);body=d.element.body
for p in list(d.paragraphs):p._element.getparent().remove(p._element)
BLUE=RGBColor(0x0A,0x4F,0xA0)
def para(text='',bold=False,size=11,color=None,align=None,after=6,italic=False):
    p=d.add_paragraph();p.paragraph_format.space_after=Pt(after)
    if align:p.alignment=align
    if text:
        r=p.add_run(text);r.bold=bold;r.italic=italic;r.font.size=Pt(size)
        if color:r.font.color.rgb=color
    return p
def line(label,text):
    p=d.add_paragraph();p.paragraph_format.space_after=Pt(3)
    a=p.add_run(label);a.bold=True;a.font.size=Pt(11);b=p.add_run(text);b.font.size=Pt(11);return p
_t=para('MÉMO',True,22,BLUE,after=2);_t.paragraph_format.space_before=Pt(22)
para('Lons, le 26 novembre 2026',size=10,after=12,italic=True)
line('À : ','toute l\'équipe Enedril');line('De : ','Paul Hynderick');line('Objet : ','collecte de jouets, à apporter avant le 18 décembre 2026')
para(after=8)
para('Bonjour à tous,',after=8)
para("À l'approche de Noël, nous organisons une collecte de jouets. Si vous avez des jouets dont vous ne vous servez plus et dont vous souhaitez vous séparer, apportez-les : ils seront ensuite donnés à l'association partenaire de l'opération « Le Père Noël fait de la récup' » de Billère, pour leur donner une seconde vie.",after=10)
para('En pratique',True,13,BLUE,after=4)
for lab,tx in (('Quoi : ',"les jouets et jeux dont vous voulez vous séparer, de préférence propres, en bon état et complets."),('Jusqu\'à quand : ','vous avez jusqu\'au vendredi 18 décembre 2026 pour les apporter.'),('Où : ','à l\'entreprise, sur le site de Lons.')):
    p=d.add_paragraph(style='List Paragraph');p.paragraph_format.left_indent=Pt(18);p.paragraph_format.space_after=Pt(3)
    p.add_run('•  ').font.size=Pt(11);a=p.add_run(lab);a.bold=True;a.font.size=Pt(11);b=p.add_run(tx);b.font.size=Pt(11)
para(after=6)
p=para("Pour en savoir plus sur l'opération : ",after=10)
r=p.add_run('https://www.billere.fr/evenement/le-pere-noel-fait-de-la-recup-2/');r.font.size=Pt(11);r.font.color.rgb=BLUE;r.underline=True
para("Merci d'avance pour votre participation !",after=14)
para('Paul Hynderick',True,after=0);para('Marketing et commercial · Enedril',size=10)
d.save(sys.argv[2])
