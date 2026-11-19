"""Plaquette portrait EN (option B, photo à côté du bloc ISO) : remplace le sceau ISO par le logo LRQA ISO 9001
(celui des signatures mail), ajoute le logo « Entreprise engagée RSE » et en parle au même endroit.
Usage : python3 outils_generation/maj_logos_iso_rse.py   (depuis la racine du dépôt ; restaurer le PPTX par git checkout pour relancer)"""
import copy
from pptx import Presentation
from pptx.util import Emu, Pt

F = "plaquettes_photo_a_propos/Plaquette_Enedril_6p.pptx"
LRQA = "certifications/LRQA_ISO9001_gris.png"         # version sur fond clair du logo des signatures
RSE = "certifications/RSE_badge_entreprise_engagee.png"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"

prs = Presentation(F)
s = prs.slides[1]
W, H = prs.slide_width, prs.slide_height
if any(sh.name == "Logo LRQA" for sh in s.shapes):
    raise SystemExit("déjà fait : restaurer le PPTX (git checkout) avant de relancer")
shp = lambda n: next(x for x in s.shapes if x.name == n)
box, seal, txt = shp("Rectangle 28"), shp("Picture 29"), shp("TextBox 30")
seal._element.getparent().remove(seal._element)                      # ancien sceau ISO

pad = Pt(7)
col_x = box.left + int(W * .020)
size = int((box.height - 2 * pad - Pt(5)) / 2)                       # deux logos empilés
lq_w = int(size * 811 / 876)
p1 = s.shapes.add_picture(LRQA, col_x + (size - lq_w) // 2, box.top + pad, lq_w, size); p1.name = "Logo LRQA"
p1._element.nvPicPr.cNvPr.set("descr", "LRQA Certified ISO 9001")
p2 = s.shapes.add_picture(RSE, col_x, box.top + pad + size + Pt(5), size, size); p2.name = "Logo RSE"
p2._element.nvPicPr.cNvPr.set("descr", "Entreprise engagée RSE")

# texte : ISO (3 paragraphes d'origine) puis RSE (copie du style titre + corps)
paras = txt.text_frame.paragraphs
head_p, body_p = paras[0]._p, paras[1]._p
rse_head, rse_body = copy.deepcopy(head_p), copy.deepcopy(body_p)
paras[-1]._p.addnext(rse_head); rse_head.addnext(rse_body)
paras = txt.text_frame.paragraphs
paras[3].runs[0].text = "CSR CHARTER · COMMITTED COMPANY"
paras[4].runs[0].text = ("Enedril holds the CSR charter issued by the UIMM and is committed to more responsible practices "
                         "towards its teams, its clients and its territory.")
ppr = paras[3]._p.get_or_add_pPr()
sb = ppr.makeelement(A + "spcBef", {}); sb.append(sb.makeelement(A + "spcPts", {"val": "500"})); ppr.insert(0, sb)
txt.left = col_x + size + int(W * .020)
photo = shp("Photo operateurs")
cut = .15                                                            # photo un peu plus étroite : on rogne le bord droit (rien d'utile)
old_w = photo.width
photo.crop_right = cut
photo.left = photo.left + int(old_w * cut); photo.width = int(old_w * (1 - cut))
txt.width = photo.left - txt.left - int(W * .015)
txt.top = box.top + int(H * .0105)
prs.save(F)
print("ok", F)
