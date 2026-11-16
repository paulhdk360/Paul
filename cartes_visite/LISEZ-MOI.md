# Carte de visite Enedril – Paul Hynderick

Format **85 × 55 mm**, fond perdu **3 mm** (pages de 91 × 61 mm), recto / verso.

## Dossiers
- `1_IMPRESSION/` : PDF recto + verso avec repères de coupe → **à envoyer à l'imprimeur**.
- `2_VERNIS_SELECTIF/` : masques du vernis sélectif (**noir 100 % = zone vernie**), recto puis verso.
- `3_FICHIERS_SEPARES/` : recto et verso seuls, avec fond perdu, sans repères.
- `apercus/` : aperçus PNG (600 dpi), simulation du vernis brillant, mise en situation.
- Sources : `generer_cartes.py` (cartes), `apercus_relief.py` (simulation), `carte_*.html`.

## Zones en relief (finitions à demander à l'imprimeur)
| Face | Zone | Finition |
|---|---|---|
| Recto | Logo Enedril, 4 anneaux lumineux, accroche « Directional Drilling & Fishing » | **Vernis sélectif UV brillant** (épaisseur ou « relief 3D » si proposé) sur fond **pelliculage soft touch mat** |
| Verso | 2 arcs décoratifs en haut à droite | Vernis sélectif UV brillant (optionnel) |
| Option premium | Logo recto | **Gaufrage à sec** (même masque que le vernis du logo) |

Papier conseillé : 400 à 450 g/m², pelliculage soft touch recto-verso. Demander un **BAT** avant tirage.

## Couleurs et technique
- Marine `#08203F` / `#0C2D57`, bleu `#0A4FA0`, ciel `#0083CB`, cyan `#00AEEF`, rouge `#E2231A`.
- Polices : Barlow Condensed (titres) et Barlow (texte), incluses dans `../voeux_2027/polices/`.
- Fichiers en **RVB** : l'imprimeur convertit en CMJN (profil FOGRA39 ou selon son atelier).
- Textes et logos en vecteur. Les repères de coupe sont à 8 mm.
- Le **QR code** contient la fiche contact (vCard : nom, fonction, téléphone, mail, site, adresse). Testé par décodage.

## Contenu de la carte
Paul Hynderick · Chargé de marketing & commercial francophone (Marketing & Sales · French-speaking markets) · +33 (0)5 59 04 50 45 (ligne Enedril) · phynderick@enedril.fr · www.enedril.com · 3 avenue des Lacs, 64140 Lons, France.

Pour changer un texte ou ajouter un numéro de mobile : modifier le bloc `P` en haut de `generer_cartes.py`, puis relancer `python3 generer_cartes.py` (nécessite `segno`, Playwright/Chromium, `pypdf`, `reportlab`, `pdftoppm`) et `python3 apercus_relief.py`.
