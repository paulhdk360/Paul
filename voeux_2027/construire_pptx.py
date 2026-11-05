"""Fichier PowerPoint à calques (un objet nommé par élément) de la carte de voeux 2027 : recto + verso, FR ou EN.
Page = 154 x 111 mm (format fini A6 148 x 105 mm + 3 mm de fond perdu de chaque côté).
Usage : python3 construire_pptx.py FR|EN <sortie.pptx>"""
import sys
from pptx import Presentation
from pptx.util import Mm, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn

LANG, OUT = sys.argv[1].upper(), sys.argv[2]
T = {'FR': dict(h1a='JOYEUSES FÊTES', h1b="DE FIN D'ANNÉE", sign="DE LA PART DE TOUTE L'ÉQUIPE D'ENEDRIL", thanks='MERCI POUR VOTRE CONFIANCE EN 2026',
               m=[('NOUS VOUS SOUHAITONS DE TRÈS BELLES FÊTES ET UNE ', False), ('ANNÉE 2027', True), (' RICHE EN PROJETS ET EN SUCCÈS PARTAGÉS !', False)]),
     'EN': dict(h1a="SEASON'S", h1b='GREETINGS', sign='FROM THE WHOLE ENEDRIL TEAM', thanks='THANK YOU FOR YOUR TRUST IN 2026',
               m=[('WE WISH YOU A WONDERFUL HOLIDAY SEASON AND A ', False), ('2027', True), (' FULL OF PROJECTS AND SHARED SUCCESS!', False)])}[LANG]
WHITE, GOLD, BLUEL = RGBColor(255, 255, 255), RGBColor(0xFF, 0xE0, 0x8A), RGBColor(0x1B, 0x60, 0xAC)
W, H = 154, 111

prs = Presentation(); prs.slide_width, prs.slide_height = Mm(W), Mm(H)
blank = prs.slide_layouts[6]

def pic(sl, path, l, t, w, h, name):
    p = sl.shapes.add_picture(path, Mm(l), Mm(t), Mm(w), Mm(h)); p.name = name; return p
def rect(sl, l, t, w, h, fill, name, line=None):
    s = sl.shapes.add_shape(MSO_SHAPE.RECTANGLE, Mm(l), Mm(t), Mm(w), Mm(h)); s.name = name
    if fill is None: s.fill.background()
    else: s.fill.solid(); s.fill.fore_color.rgb = fill
    if line is None: s.line.fill.background()
    s.shadow.inherit = False
    return s
def text(sl, name, l, t, w, h, paras, size_pt, font, bold=False, spc_em=0.0, line=1.0, color=WHITE):
    """paras : liste de paragraphes ; un paragraphe = liste de (texte, couleur|None, gras|None)"""
    tb = sl.shapes.add_textbox(Mm(l), Mm(t), Mm(w), Mm(h)); tb.name = name
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.TOP
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, runs in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph(); p.line_spacing = line; p.alignment = PP_ALIGN.LEFT
        for txt, col, b in runs:
            r = p.add_run(); r.text = txt; f = r.font; f.name = font; f.size = Pt(size_pt); f.bold = bold if b is None else b
            f.color.rgb = col or color
            r._r.get_or_add_rPr().set('spc', str(int(round(size_pt * spc_em * 100))))
            for tag in ('a:latin', 'a:ea', 'a:cs'):
                el = r._r.get_or_add_rPr().find(qn(tag))
                if el is None: el = r._r.get_or_add_rPr().makeelement(qn(tag), {}); r._r.get_or_add_rPr().append(el)
                el.set('typeface', font)
    return tb
def guides(sl):
    for nm, m in (('REPÈRE masqué · format fini 148 x 105 mm (trait de coupe)', 3), ('REPÈRE masqué · zone de sécurité (11 mm du bord de page)', 11)):
        g = sl.shapes.add_shape(MSO_SHAPE.RECTANGLE, Mm(m), Mm(m), Mm(W - 2 * m), Mm(H - 2 * m)); g.name = nm
        g.fill.background(); g.line.color.rgb = RGBColor(0xE2, 0x23, 0x1A); g.line.width = Pt(0.5); g.shadow.inherit = False
        g._element.nvSpPr.cNvPr.set('hidden', '1')              # à afficher via Accueil > Organiser > Volet Sélection pour vérifier les marges
def logo(sl):
    h = 30 * 119 / 523; pic(sl, 'photos/logo-blanc.png', 11, H - 8.5 - h, 30, h, 'LOGO Enedril (blanc)')

# ---------------- RECTO
s = prs.slides.add_slide(blank)
pic(s, 'photos/visuel_jour.jpg', 0, 0, W, H, 'FOND · visuel rig + trajectoire (image fournie)')
pic(s, 'photos/ombre_recto.png', 0, H - 26, 100, 26, 'OMBRE · dégradé bleu foncé sous le logo')
text(s, 'TEXTE · signature de marque', 11, 10.6, 100, 4, [[('ENEDRIL · FISHING AND DRILLING SOLUTIONS', None, None)]], 5.8, 'JetBrains Mono Medium', spc_em=0.2)
text(s, 'TEXTE · titre (2 lignes)', 11, 15.3, 100, 32, [[(T['h1a'], WHITE, None)], [(T['h1b'], GOLD, None)]], 41, 'Barlow Condensed', bold=True, spc_em=0.05, line=0.9)
rect(s, 11, 48.7, 14, 0.45, GOLD, 'FILET · or sous le titre')
text(s, 'TEXTE · signature équipe', 11, 51.6, 110, 6, [[(T['sign'], None, None)]], 8.65, 'Barlow Condensed SemiBold', spc_em=0.14)
logo(s); guides(s)
s.notes_slide.notes_text_frame.text = ("RECTO. Calques : FOND (image), OMBRE, TEXTES, FILET, LOGO. Polices à installer : Barlow Condensed (Bold + SemiBold), JetBrains Mono (dossier « polices »). "
    "Pour imprimer : Fichier > Exporter > PDF (qualité maximale), page de 154 x 111 mm = format fini 148 x 105 mm + 3 mm de fond perdu.")

# ---------------- VERSO
s = prs.slides.add_slide(blank)
bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Mm(W), Mm(H)); bg.name = 'FOND · bleu uni (dégradé léger)'; bg.line.fill.background(); bg.shadow.inherit = False
bg.fill.gradient(); bg.fill.gradient_angle = 100
st = bg.fill.gradient_stops; st[0].color.rgb = RGBColor(0x1B, 0x60, 0xAC); st[0].position = 0; st[1].color.rgb = RGBColor(0x1F, 0x66, 0xB2); st[1].position = 1
pic(s, 'photos/chantier_fondu.png', W - 106, H - 76.3, 106, 76.3, 'PHOTO · chantier coucher de soleil (fondu haut et gauche)')
pic(s, 'photos/ombre_verso.png', 0, H - 26, 60, 26, 'OMBRE · dégradé bleu foncé sous le logo')
text(s, 'TEXTE · remerciement', 11, 11.1, 120, 4, [[(T['thanks'], None, None)]], 5.8, 'JetBrains Mono Medium', spc_em=0.2)
text(s, 'TEXTE · message de voeux', 11, 16.6, 128, 26, [[(t_, GOLD if g else WHITE, True if g else None) for t_, g in T['m']]], 17.6, 'Barlow Condensed SemiBold', spc_em=0.06, line=1.0)
logo(s); guides(s)
s.notes_slide.notes_text_frame.text = ("VERSO. Calques : FOND (bleu), PHOTO (PNG avec transparence déjà fondue : haut et gauche), OMBRE, TEXTES, LOGO. "
    "Pour changer la photo : clic droit sur la photo > Changer l'image (garder le même cadrage).")
prs.save(OUT); print('ok', OUT)
