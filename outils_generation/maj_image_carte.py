"""Remplace l'image de la carte (page « Où nous trouver ») dans les plaquettes déjà construites, sans toucher au reste.
Usage : python3 outils_generation/maj_image_carte.py   (depuis la racine du dépôt, après carte_europe.py)"""
from pptx import Presentation
FILES = ["Plaquette_Enedril_6p.pptx", "Plaquette_Enedril_6p_paysage.pptx", "Presentation_Enedril_FR_portrait.pptx", "Presentation_Enedril_FR_paysage.pptx"]
for d in ("", "plaquettes_photo_a_propos/"):
    for f in FILES:
        lang = "fr" if "_FR_" in f else "en"
        png = open(f"carte_europe/carte_europe_plaquette_compact_{lang}.png", "rb").read()
        prs = Presentation(d + f); n = 0
        for sl in prs.slides:
            for sh in sl.shapes:
                if sh.name == "Carte Europe":
                    rid = sh._element.blipFill.blip.rEmbed; sl.part.related_part(rid)._blob = png; n += 1
        assert n == 1, (d + f, n)
        prs.save(d + f); print("ok", d + f)
