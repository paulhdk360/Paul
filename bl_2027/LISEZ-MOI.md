# Bon de livraison (BL) 2027

- `BL_Enedril_2027.xlsx` : classeur vierge. `BL_Enedril_2027_exemple.xlsx` : exemple.
- `generer_bl.py` : recrée les deux fichiers (`python3 generer_bl.py <dossier> [exemple]`).

## Utilisation
1. Onglet « 2 Import devis » : copier les colonnes C à J de l'onglet « 2 Matériel » du devis (lignes 6 à 29) et les coller en B6. Description, quantité et valeur de remplacement (LIH / DBR) passent sur le BL ; les tarifs de location restent dans l'import et ne sont pas imprimés.
2. Onglet « 1 Bon de livraison » : n° du BL, date, dossier, client, puits, PO, transporteur, PO transport, délai, adresse de livraison ; puis pour chaque ligne la référence, le(s) n° de série, l'origine (FR par défaut) et le poids net par unité. Les totaux (quantité, poids, valeur) et le colisage se calculent.
3. Appuyer sur Ctrl + Alt + L (Données > Réappliquer) pour masquer les lignes vides ; un message rouge le rappelle.
4. Imprimer en A4 portrait ou exporter en PDF : la page porte les cadres de signature expéditeur, transporteur et client.

L'ancien modèle récupérait référence, origine, code SH, poids et désignation dans le fichier de suivi des immobilisations (liens externes). Cette version se remplit à la main, sans lien externe.

## Saisie et catalogue

- Plus d'import du devis : le BL se remplit directement. Par ligne : **N° de série** (colonne B, liste déroulante), **quantité** (D) et **valeur de remplacement** (G). Désignation, origine et poids se remplissent depuis le catalogue ; la description (C) peut être écrasée à la main pour un article sans N° de série. 14 lignes.
- L'onglet **Catalogue outils** est masqué (clic droit sur un onglet › Afficher). Il contient une copie du registre « Fabrication - Achat - 2014 et + » (colonnes Z à BB, 2 955 N° de série repris du cache de l'ancien BL, fichier `registre_outils.json`). Pour le mettre à jour : l'afficher, coller les colonnes Z:BB du registre en A6.
- La recherche accepte un N° de série saisi en nombre ou en texte. Référence, code SH, OD (en fractions) et longueur sont à droite (colonnes M à P), hors impression.
- 371 N° de série du cache n'ont pas de désignation : mettre le catalogue à jour depuis le registre.
