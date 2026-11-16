"""Ajoute la photo des deux opérateurs (coucher de soleil) sur la couverture des 4 plaquettes
(FR / EN, portrait / paysage). La photo est découpée dans le polygone du bas de la couverture,
posée juste au-dessus du polygone bleu clair, sous les traits blancs et les textes.
Usage : python3 outils_generation/ajouter_photo_couverture.py   (depuis la racine du dépôt)"""
import io, os, sys
from PIL import Image, ImageDraw, ImageEnhance
from pptx import Presentation

PHOTO = "voeux_2027/photos/chantier_coucher_soleil.jpg"
# polygone (EMU) = zone claire du bas de la couverture ; (crop_y0 = ordonnée de départ dans la photo, en px)
PORTRAIT = dict(poly=[(0, 6604000), (4191000, 5461000), (7556500, 8890000), (7556500, 10693400), (0, 10693400)], crop_y0=15)
PAYSAGE = dict(poly=[(4000000, 4691700), (6604000, 4191000), (10693400, 5969000), (10693400, 7556500), (3650000, 7556500)], crop_y0=25)
FILES = {
    "Plaquette_Enedril_6p.pptx": PORTRAIT,
    "Presentation_Enedril_FR_portrait.pptx": PORTRAIT,
    "Plaquette_Enedril_6p_paysage.pptx": PAYSAGE,
    "Presentation_Enedril_FR_paysage.pptx": PAYSAGE,
}
SS = 3  # sur-échantillonnage pour des bords nets


def decouper(cfg, dpi=300):
    xs = [p[0] for p in cfg["poly"]]; ys = [p[1] for p in cfg["poly"]]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w_emu, h_emu = x1 - x0, y1 - y0
    wpx = int(w_emu / 914400 * dpi); hpx = int(h_emu / 914400 * dpi)
    src = Image.open(PHOTO).convert("RGB")
    crop_h = round(src.width * h_emu / w_emu)
    y_start = min(cfg["crop_y0"], src.height - crop_h)
    img = src.crop((0, y_start, src.width, y_start + crop_h)).resize((wpx, hpx), Image.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(1.06)
    mask = Image.new("L", (wpx * SS, hpx * SS), 0)
    pts = [((x - x0) / w_emu * wpx * SS, (y - y0) / h_emu * hpx * SS) for x, y in cfg["poly"]]
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    mask = mask.resize((wpx, hpx), Image.LANCZOS)
    img.putalpha(mask)
    buf = io.BytesIO(); img.save(buf, "PNG", optimize=True); buf.seek(0)
    return buf, (x0, y0, w_emu, h_emu)


for f, cfg in FILES.items():
    prs = Presentation(f)
    slide = prs.slides[0]
    tree = slide.shapes._spTree
    for sh in list(slide.shapes):          # idempotent : retire une photo déjà ajoutée
        if sh.name == "Photo operateurs":
            tree.remove(sh._element)
    buf, (x, y, w, h) = decouper(cfg)
    pic = slide.shapes.add_picture(buf, x, y, w, h)
    pic.name = "Photo operateurs"
    pic._element.nvPicPr.cNvPr.set("descr", "Deux opérateurs Enedril face au coucher de soleil")
    ref = next(sh for sh in slide.shapes if sh.name == "Freeform 4")._element   # polygone bleu clair
    tree.remove(pic._element); ref.addnext(pic._element)                          # juste au-dessus, sous les traits blancs
    prs.save(f)
    print("ok", f)
