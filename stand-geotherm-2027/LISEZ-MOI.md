# Pack stand GeoTHERM 2027 · Stand 274 · Enedril

Stand 18 m² (3 × 6 m), bout de rangée : trois côtés ouverts (ouest 6 m, nord et sud 3 m) et un mur de fond de 6 m mitoyen avec les stands 275 et 286.
Salon : 25-26 février 2027, Offenburg. Montage 23-24 février. Commandes au plus tard le 11 décembre 2026.

## Contenu
- `00_Dossier_Stand_274_GeoTHERM2027.pdf` : dossier A3 de 10 pages avec tous les visuels prévus (plan, vues 3D, supports imprimés, digital, goodies) et la liste des commandes avec les prix du kit exposant.
- `00_Plan_et_3D/` : plan au sol et `Vues_3D/` (12 vues du stand : ensemble, allée ouest, nord-ouest, sud-ouest, côté sud, côté nord, bar, mange-debout, table de réunion, face du rangement, présentoir, vue intérieure). `source_3D/` contient la scène 3D (three.js) pour refaire d'autres angles.
- `00_Logo_vectoriel/` : logo Enedril en SVG (couleur et blanc), à envoyer aux imprimeurs. Revectorisé à partir du logo officiel en 2000 px (`logo_officiel_source_2000px.webp`) avec `vectoriser_logo.py` ; versions avec et sans baseline.
- `01_Impression_stand/` : mur du fond bleu foncé avec logo Enedril blanc (4 panneaux visibles de 1000 × 2500 mm, les 2 m derrière le rangement ne se voient pas), **face du rangement** (3 options de 2000 × 2500 mm : A « Our services » sur fond blanc, sans MWD (retenue), C bleu uni + logo, chacune en 2 panneaux), enseigne 2000 × 299 mm, face du bar d'accueil 2000 × 900 mm (logo Enedril et QR code), roll-ups 850 × 2000 mm. Les aperçus sont dans `apercu/`.
- `03_Digital_et_reseaux/` : visuels LinkedIn (carré 1080 et couverture 1128 × 191), signature e-mail, bannière web GeoTHERM 300 × 600 px, en-tête d'e-mail d'invitation.
- `04_Papeterie_et_goodies/` : flyer A5 recto-verso, mug, carnet A5, tote bag, tour de cou, planche de stickers, guide logo textile.

## Précisions techniques
- Les grands formats (mur du fond 6 m) sont livrés en PDF à l'échelle réduite (1:10), car un PDF ne peut pas dépasser environ 5 m. Les éléments sont vectoriels : l'imprimeur les agrandit sans perte. Le mur existe aussi en panneaux à l'échelle 1:1.
- Pas de fond perdu ni de traits de coupe dans les fichiers. À demander à Messe Offenburg ou à l'imprimeur avant la commande.
- Les photos de la plaquette sont de trop faible résolution pour les grands formats : les supports utilisent donc uniquement du texte et des formes. Une photo haute définition (outil, chantier, équipe) enrichirait le mur du fond.
- Aucun badge ISO n'est utilisé, comme demandé pour les roll-ups.

## À vérifier avant impression
- Dates, adresse, téléphone et e-mail (info@enedril.fr, +33 (0)5 59 04 50 45) et chiffres (98 500 m, 75 puits, 142 interventions, 2 500 outils).
- Le mur du fond s'appuie sur les panneaux imprimés de l'organisateur (pos. 105058, 330 € le panneau : 4 pour le mur + 2 pour la face du rangement = 1 980 €) ou sur un mur Pixlip : confirmer avec osing@messe-offenburg.de.
- Les prix sont ceux du kit exposant, hors TVA, indicatifs.

- Aménagement : bar d'accueil = les 2 comptoirs du stand système type 3 mis bout à bout (face imprimée logo + QR code 2000 × 900 mm), 4 tabourets hauts et 1 mange-debout à louer, table de réunion et présentoir à brochures inclus dans le type 3. Coût total estimé : environ 6 550 € HT (voir le dossier, page 10).
- Le croquis joint à la commande (`05_Commande_Messe_Offenburg/`) fixe l'emplacement du mobilier ; les positions du livret sont à cocher et à signer.
- 3 roll-ups sur le stand : forage dirigé, fishing, MWD clair.
- Pas d'écrans ni de banderole suspendue (non retenus). Le rangement est contre le mur de 6 m : choisir l'option A, B ou C pour sa face, et confirmer sa position le long du mur (extrémité nord supposée).
- Moquette : le kit ne donne aucune teinte. Demander la référence à Messe Offenburg (15 €/m² hors gris).

- `05_Commande_Messe_Offenburg/GeoTHERM2027_Servicemappe_Enedril_remplie.pdf` : livret exposant rempli (coordonnées, type 3, panneaux, face du bar, tabourets, table haute, moquette bleu clair, passes gratuits, croquis coté). Reste à signer et dater chaque page de commande, puis à envoyer à geotherm@messe-offenburg.de avant le 11 décembre 2026.
- Co-exposant FIXNDRIL ajouté (page 8 du livret) : frais de 350 € + forfait marketing de 120 € HT, à inscrire avant le 27 novembre 2026. Il reste à cocher qui paie (page 8) et à compléter ses produits exposés.

- Mur du fond régénéré avec le nouveau logo vectoriel : `01_Impression_stand/generer_mur_logo.py` (mur de 6 m, 4 panneaux visibles à partir du 3e mètre). Les autres supports (enseignes, comptoir, affiches, roll-ups, goodies, flyer) utilisent encore l'ancien tracé.

- `06_Complement_options_et_plans/` : 5 pages A3 (plan à jour avec 2 roll-ups Enedril et 1 Fixndril, les 4 options, zooms rangement et moquette, Fixndril, budget par option et à-faire). `00_Dossier_..._complet.pdf` = dossier de 10 pages + ces 5 pages. Regénérer : `python3 generer_complement.py`.
- Livret v2 (`05_Commande_Messe_Offenburg/GeoTHERM2027_Servicemappe_Enedril_remplie_v2.pdf`, regénéré par `maj_livret.py`) : croquis p.13 avec 2 roll-ups Enedril + roll-up Fixndril, moquette « blue », produits exposés Fixndril. Restent à faire à la main : qui paie le co-exposant (p.8), dates et signatures.
- Mise à jour du 26/11 : face du placard « Our services » (option A) écrite dans le livret v2 ; roll-ups Enedril perpendiculaires au placard (scène 3D, plan, croquis p.13) ; nouvelles vues dans `00_Plan_et_3D/Vues_3D_v3/` ; zip prêt à envoyer : `Enedril_GeoTHERM2027_Stand274.zip`.
- Mise à jour du 26/11 (v3) : tous les visuels à imprimer sont régénérés avec le VRAI logo Enedril (vectorisé depuis `00_Logo_vectoriel/logo_officiel_vrai_2000x449.webp`, script `vectoriser_logo_officiel.py`, PNG 6000 px inclus) et un QR code réel vers https://www.enedril.com (`01_Impression_stand/generer_visuels.py`, `generer_mur_logo.py`). Pack visuel en anglais : `06_Visual_Pack_EN/`. Vue 3D HD : `00_Plan_et_3D/Vues_3D_v3/00_Stand_3D_HD_3840x2160.png` (2 roll-ups Enedril perpendiculaires au placard + roll-up Fixndril). Zip : `Enedril_GeoTHERM2027_Stand274.zip`. Pas encore refaits avec le vrai logo : flyer, goodies, visuels digitaux, enseigne C (supprimée).
- 26/11 (v4) : 2e mange-debout (107021 x2, tabourets 107004 x6) dans la scène 3D, le livret (p.13 croquis, p.19-20 quantités) et le pack EN ; zip entièrement en anglais (noms de fichiers compris).
