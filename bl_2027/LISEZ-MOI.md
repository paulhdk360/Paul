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

- Onglet **3 Catalogue outils** : coller le registre des outils (N° de série, référence, désignation, origine, code SH, poids net, OD, longueur) dès la ligne 6 (jusqu'à 5 000 lignes). Les lignes de l'exemple sont fictives.
- Sur le BL, **une ligne par unité** : une quantité de 3 dans le devis donne 3 lignes. Saisir le N° de série en colonne B : référence, désignation, origine et poids sont repris du catalogue. Série inconnue : la description du devis est conservée et l'origine reste « FR ».
- Code SH, OD et longueur s'affichent à droite (colonnes M à O), hors zone d'impression.
- Après un nouvel import : Ctrl + Alt + L pour réappliquer le filtre (lignes vides masquées).
