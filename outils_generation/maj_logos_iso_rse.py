"""Plaquettes (FR/EN, portrait/paysage, options A et B) : dans le bloc qualité de la page « About us / Qui sommes-nous »,
remplace le sceau ISO par le logo LRQA ISO 9001 (celui des signatures mail), ajoute le logo « Entreprise engagée RSE »
et en parle au même endroit (charte RSE délivrée par l'UIMM, texte du site).
Usage : python3 outils_generation/maj_logos_iso_rse.py   (depuis la racine du dépôt ; les fichiers déjà traités sont ignorés)"""
import copy
from pptx import Presentation
from pptx.util import Pt

LRQA = "certifications/LRQA_ISO9001_gris.png"         # version sur fond clair du logo des signatures
RSE = "certifications/RSE_badge_entreprise_engagee.png"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
FILES = ["Plaquette_Enedril_6p.pptx", "Plaquette_Enedril_6p_paysage.pptx", "Presentation_Enedril_FR_portrait.pptx", "Presentation_Enedril_FR_paysage.pptx"]
TXT = {
    "en": ("CSR CHARTER · COMMITTED COMPANY",
           "Enedril holds the CSR charter issued by the UIMM and is committed to more responsible practices towards its teams, its clients and its territory."),
    "fr": ("CHARTE RSE · ENTREPRISE ENGAGÉE",
           "Enedril dispose de la charte RSE délivrée par l'UIMM et s'engage pour des pratiques plus responsables, auprès de ses équipes, de ses clients et de son territoire."),
}


def maj(path):
    lang = "fr" if "_FR_" in path else "en"
    prs = Presentation(path)
    s = prs.slides[1]
    W, H = prs.slide_width, prs.slide_height
    land = W > H
    if any(sh.name == "Logo LRQA" for sh in s.shapes):
        print("déjà fait", path); return
    shp = lambda n: next(x for x in s.shapes if x.name == n)
    box, seal, txt = shp("Rectangle 28"), shp("Picture 29"), shp("TextBox 30")
    photo = next((x for x in s.shapes if x.name == "Photo operateurs"), None)
    seal._element.getparent().remove(seal._element)                  # ancien sceau ISO

    pad = Pt(7)
    col_x = box.left + int(W * (.020 if not land else .012))
    size = int((box.height - 2 * pad - Pt(5)) / 2)                   # deux logos empilés
    lq_w = int(size * 811 / 876)
    p1 = s.shapes.add_picture(LRQA, col_x + (size - lq_w) // 2, box.top + pad, lq_w, size); p1.name = "Logo LRQA"
    p1._element.nvPicPr.cNvPr.set("descr", "LRQA Certified ISO 9001")
    p2 = s.shapes.add_picture(RSE, col_x, box.top + pad + size + Pt(5), size, size); p2.name = "Logo RSE"
    p2._element.nvPicPr.cNvPr.set("descr", "Entreprise engagée RSE" if lang == "fr" else "Committed company (CSR)")

    paras = txt.text_frame.paragraphs
    head_p, body_p = paras[0]._p, paras[1]._p
    rse_head, rse_body = copy.deepcopy(head_p), copy.deepcopy(body_p)
    paras[-1]._p.addnext(rse_head); rse_head.addnext(rse_body)
    paras = txt.text_frame.paragraphs
    n = len(paras)
    paras[n - 2].runs[0].text, paras[n - 1].runs[0].text = TXT[lang]
    ppr = paras[n - 2]._p.get_or_add_pPr()
    sb = ppr.makeelement(A + "spcBef", {}); sb.append(sb.makeelement(A + "spcPts", {"val": "500"})); ppr.insert(0, sb)
    txt.left = col_x + size + int(W * (.020 if not land else .014))
    if photo is not None and not land:                               # option B portrait : photo rognée à droite
        cut = .15; old_w = photo.width
        photo.crop_right = cut; photo.left = photo.left + int(old_w * cut); photo.width = int(old_w * (1 - cut))
        txt.width = photo.left - txt.left - int(W * .015)
    else:
        txt.width = box.left + box.width - txt.left - int(W * .015)
    txt.top = box.top + int(H * .0105)
    prs.save(path); print("ok", path)


if __name__ == "__main__":
    for d in ("", "plaquettes_photo_a_propos/"):
        for f in FILES: maj(d + f)
