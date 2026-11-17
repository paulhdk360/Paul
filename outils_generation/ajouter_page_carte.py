"""Ajoute la page « Où nous trouver / Where we are » (carte de l'Europe, Enedril positionné à Lons)
juste avant la dernière page (4ᵉ de couverture) des plaquettes FR/EN, portrait et paysage.
La page est construite à partir de « About us / Qui sommes-nous » (mêmes styles, logo, pied de page).
Usage : python3 outils_generation/ajouter_page_carte.py [dossier]   (par défaut : racine du dépôt)"""
import copy, io, os, sys
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.util import Emu, Pt

CARTE = "carte_europe/carte_europe_plaquette_compact_%s.png"
FILES = ["Plaquette_Enedril_6p.pptx", "Plaquette_Enedril_6p_paysage.pptx",
         "Presentation_Enedril_FR_portrait.pptx", "Presentation_Enedril_FR_paysage.pptx"]

TXT = {
    "en": dict(
        title="WHERE WE ARE",
        intro="Enedril is based in Lons, near Pau, in south-west France, and operates in France and abroad for geothermal, oil & gas and underground gas storage projects.",
        boxes=[("HQ & WORKSHOPS", "Lons (64), near Pau: two workshops of more than 1,000 m² and a 3,500 m² outdoor yard."),
               ("FRANCE", "Fishing response within 24/48h across metropolitan France."),
               ("EUROPE & NORTH AFRICA", "International interventions for geothermal, oil & gas and underground gas storage.")]),
    "fr": dict(
        title="OÙ NOUS TROUVER",
        intro="Enedril est basée à Lons, près de Pau, dans le sud-ouest de la France, et intervient en France et à l'international pour des projets de géothermie, de pétrole et de gaz et de stockage souterrain de gaz.",
        boxes=[("SIÈGE ET ATELIERS", "Lons (64), près de Pau : deux ateliers de plus de 1 000 m² et 3 500 m² de parc extérieur."),
               ("FRANCE", "Intervention fishing sous 24/48 h partout en France métropolitaine."),
               ("EUROPE ET AFRIQUE DU NORD", "Interventions à l'international en géothermie, pétrole et gaz, stockage souterrain de gaz.")]),
}


def shp(slide, name):
    return next(s for s in slide.shapes if s.name == name)


def set_paras(shape, texts):
    """Remplace le texte de chaque paragraphe en gardant la mise en forme du premier run."""
    paras = shape.text_frame.paragraphs
    for p, t in zip(paras, texts):
        runs = p.runs
        runs[0].text = t
        for r in runs[1:]:
            r._r.getparent().remove(r._r)
    for p in paras[len(texts):]:
        p._p.getparent().remove(p._p)


def pct(v, total): return int(total * v / 100)


def build(path, outdir):
    prs = Presentation(os.path.join(outdir, path) if outdir else path)
    W, H = prs.slide_width, prs.slide_height
    lang = "fr" if "_FR_" in path else "en"
    land = W > H
    for sl in prs.slides:                      # pas de doublon : repartir de la version sans page carte (git checkout)
        if any(sh.name == "Carte Europe" for sh in sl.shapes):
            raise SystemExit("%s contient déjà la page carte : restaurer le fichier (git checkout) avant de relancer" % path)
    ids = prs.slides._sldIdLst
    tpl = prs.slides[1]
    new = prs.slides.add_slide(tpl.slide_layout)
    for ph in list(new.placeholders): ph._element.getparent().remove(ph._element)
    tree = new.shapes._spTree
    t = TXT[lang]

    def clone(name):
        el = copy.deepcopy(shp(tpl, name)._element); tree.append(el)
        return next(s for s in new.shapes if s._element is el)

    logo = shp(tpl, "Picture 1")
    new.shapes.add_picture(io.BytesIO(logo.image.blob), logo.left, logo.top, logo.width, logo.height)
    title = clone("TextBox 2"); set_paras(title, [t["title"]])
    bar = clone("Rectangle 3"); intro = clone("TextBox 4"); set_paras(intro, [t["intro"]])
    boxes = [(clone("Rectangle %d" % r), clone("TextBox %d" % (r + 1))) for r in (22, 24, 26)]
    sizes = (9.5, 7.8) if not land else (10.5, 8.6)
    for (rect, tb), (head, body) in zip(boxes, t["boxes"]):
        set_paras(tb, [head, body])
        for para, sz in zip(tb.text_frame.paragraphs, sizes):
            para.runs[0].font.size = Pt(sz)
            ln = para._p.pPr.find('{http://schemas.openxmlformats.org/drawingml/2006/main}lnSpc')
            if ln is not None: ln.getchildren()[0].set('val', str(int(sz * 100 * 1.22)))
    for n in ("Rectangle 42", "TextBox 43", "TextBox 44"): clone(n)
    set_paras(shp(new, "TextBox 44"), ["7"])

    pic_path = CARTE % lang
    ratio = 2016 / 2400
    if not land:
        left = shp(tpl, "TextBox 2").left; width = W - 2 * left
        intro.top = bar.top = pct(10.5, H); bar.height = pct(3.9, H)
        mh = int(width * ratio); mtop = pct(20.0, H)
        pic = new.shapes.add_picture(pic_path, left, mtop, width, mh)
        bw, gap = pct(27.9, W), (width - 3 * pct(27.9, W)) // 2
        btop, bh = mtop + mh + pct(2.4, H), pct(10.0, H)
        for i, (rect, tb) in enumerate(boxes):
            x = left + i * (bw + gap)
            rect.left, rect.top, rect.width, rect.height = x, btop, bw, bh
            tb.left, tb.top, tb.width = x + pct(1.8, W), btop + pct(1.4, H), bw - pct(3.6, W)
    else:
        left = pct(4.3, W); colw = pct(32.0, W)
        bar.left = left; bar.top = pct(15.1, H); bar.height = pct(10.2, H)
        intro.left, intro.top, intro.width = left + pct(1.2, W), pct(15.1, H), colw - pct(1.2, W)
        mleft = left + colw + pct(2.8, W); mwidth = W - pct(4.3, W) - mleft
        mh = int(mwidth * ratio); mtop = pct(15.1, H)
        pic = new.shapes.add_picture(pic_path, mleft, mtop, mwidth, mh)
        bh = pct(15.2, H); gap = (mh - pct(15.5, H) - pct(3, H) - 3 * bh) // 2 if False else pct(2.2, H)
        btop0 = pct(32.5, H)
        for i, (rect, tb) in enumerate(boxes):
            y = btop0 + i * (bh + gap)
            rect.left, rect.top, rect.width, rect.height = left, y, colw, bh
            tb.left, tb.top, tb.width = left + pct(1.3, W), y + pct(1.6, H), colw - pct(2.6, W)
    pic.name = "Carte Europe"
    pic._element.nvPicPr.cNvPr.set("descr", "Carte de l'Europe : Enedril est basé à Lons, près de Pau" if lang == "fr" else "Map of Europe: Enedril is based in Lons, near Pau")
    pic.line.color.rgb = RGBColor(0xD5, 0xE1, 0xEE); pic.line.width = Emu(9525)
    for i, c in enumerate(tree.iter('{http://schemas.openxmlformats.org/presentationml/2006/main}cNvPr'), 2): c.set('id', str(i))   # ids uniques
    # placer la page juste avant la dernière (4e de couverture)
    last = ids[-1]; ids.remove(last); ids.insert(len(ids) - 1, last)
    prs.save(os.path.join(outdir, path) if outdir else path)
    print("ok", path)


if __name__ == "__main__":
    d = sys.argv[1] if len(sys.argv) > 1 else ""
    for f in FILES: build(f, d)
