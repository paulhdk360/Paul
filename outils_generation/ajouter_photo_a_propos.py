"""Option B : la photo des deux opérateurs dans la page « About us / Qui sommes-nous » (page 2),
couverture d'origine conservée. Part des PPTX d'avant l'ajout en couverture (commit d98bc56~1).
 - portrait : photo à droite du bloc ISO 9001 (le texte ISO est resserré à gauche)
 - paysage  : le bloc « Our purpose » est coupé en deux : photo à gauche, texte à droite
Usage : python3 outils_generation/ajouter_photo_a_propos.py   (depuis la racine du dépôt)"""
import io, os, subprocess
from PIL import Image, ImageEnhance
from pptx import Presentation
from pptx.util import Emu

PHOTO = "voeux_2027/photos/chantier_coucher_soleil.jpg"
BASE = "d98bc56~1"          # version sans photo en couverture
OUT = "plaquettes_photo_a_propos"
FILES = ["Plaquette_Enedril_6p.pptx", "Plaquette_Enedril_6p_paysage.pptx",
         "Presentation_Enedril_FR_portrait.pptx", "Presentation_Enedril_FR_paysage.pptx"]
os.makedirs(OUT, exist_ok=True)


def photo(w, h, x0=0, y0=0, dpi=300):
    """Recadre la photo au rapport w/h (EMU) à partir de (x0, y0) en pixels source."""
    src = Image.open(PHOTO).convert("RGB")
    ratio = w / h
    cw = min(src.width, round(src.height * ratio)) if ratio < src.width / src.height else src.width
    ch = round(cw / ratio)
    x0 = min(x0, src.width - cw); y0 = min(y0, src.height - ch)
    img = src.crop((x0, y0, x0 + cw, y0 + ch)).resize((int(w / 914400 * dpi), int(h / 914400 * dpi)), Image.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    buf = io.BytesIO(); img.save(buf, "JPEG", quality=92); buf.seek(0)
    return buf


def shape(slide, name):
    return next(s for s in slide.shapes if s.name == name)


for f in FILES:
    data = subprocess.run(["git", "show", f"{BASE}:{f}"], check=True, capture_output=True).stdout
    prs = Presentation(io.BytesIO(data))
    s = prs.slides[1]; W, H = prs.slide_width, prs.slide_height
    paysage = W > H
    if not paysage:                                   # --- portrait : bloc ISO
        box = shape(s, "Rectangle 28"); txt = shape(s, "TextBox 30")
        x_photo = int(W * .600); w_photo = box.left + box.width - x_photo
        pic = s.shapes.add_picture(photo(w_photo, box.height, 0, 20), x_photo, box.top, w_photo, box.height)
        txt.width = int(W * .296)
    else:                                             # --- paysage : bloc Our purpose
        box = shape(s, "Rectangle 40"); txt = shape(s, "TextBox 41")
        w_photo = int(W * .140)
        pic = s.shapes.add_picture(photo(w_photo, box.height, 10, 0), box.left, box.top, w_photo, box.height)
        txt.left = box.left + w_photo + int(W * .012); txt.width = box.left + box.width - txt.left - int(W * .009)
    pic.name = "Photo operateurs"
    pic._element.nvPicPr.cNvPr.set("descr", "Deux opérateurs Enedril face au coucher de soleil")
    out = os.path.join(OUT, f)
    prs.save(out); print("ok", out)
