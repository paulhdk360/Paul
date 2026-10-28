# Bon de livraison (BL) 2027

- `BL_Enedril_2027.xlsx` : classeur vierge. `BL_Enedril_2027_exemple.xlsx` : exemple.
- `generer_bl.py` : recrée les deux fichiers (`python3 generer_bl.py <dossier> [exemple]`).

## Utilisation
1. Onglet « 2 Import devis » : copier les colonnes C à J de l'onglet « 2 Matériel » du devis (lignes 6 à 29) et les coller en B6. Description, quantité et valeur de remplacement (LIH / DBR) passent sur le BL ; les tarifs de location restent dans l'import et ne sont pas imprimés.
2. Onglet « 1 Bon de livraison » : n° du BL, date, dossier, client, puits, PO, transporteur, PO transport, délai, adresse de livraison ; puis pour chaque ligne la référence, le(s) n° de série, l'origine (FR par défaut) et le poids net par unité. Les totaux (quantité, poids, valeur) et le colisage se calculent.
3. Appuyer sur Ctrl + Alt + L (Données > Réappliquer) pour masquer les lignes vides ; un message rouge le rappelle.
4. Imprimer en A4 portrait ou exporter en PDF : la page porte les cadres de signature expéditeur, transporteur et client.

L'ancien modèle récupérait référence, origine, code SH, poids et désignation dans le fichier de suivi des immobilisations (liens externes). Cette version se remplit à la main, sans lien externe.

## Catalogue outils (désignations automatiques)

- L'onglet **3 Catalogue outils** est **masqué** (clic droit sur un onglet › Afficher). Il contient une copie du registre « Fabrication - Achat - 2014 et + » (colonnes Z à BB de l'ancien BL, 2 955 N° de série repris du cache du lien, fichier `registre_outils.json`). Pour le mettre à jour : l'afficher, coller les colonnes Z:BB du registre en A6.
- Colonne A du BL : numéro de ligne ; colonne B : N° de série, avec liste déroulante (Excel 365 filtre dès les premiers chiffres). **Une ligne par unité** : une quantité de 3 donne 3 lignes.
- La recherche accepte un N° de série saisi en nombre ou en texte.
- Désignation, poids et origine viennent du catalogue ; série inconnue : description du devis conservée, origine « FR ». Référence, code SH, OD (en fractions) et longueur sont à droite (colonnes M à P), hors impression.
- 371 N° de série du cache n'ont pas de désignation (le cache de l'ancien BL ne contenait que leur numéro) : mettre le catalogue à jour depuis le registre.
- Après un nouvel import : Ctrl + Alt + L pour réappliquer le filtre.
