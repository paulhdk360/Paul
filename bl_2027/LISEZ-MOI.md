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

- Onglet **3 Catalogue outils** : même disposition que le registre « Fabrication - Achat - 2014 et + » de l'ancien BL. Copier ses colonnes **Z à BB** (dès la ligne 2) et les coller en **A6**. Colonnes lues : 1 N° de série, 2 désignation, 3 poids, 4 OD, 5 longueur, 20 référence, 22 origine, 23 code SH. Les lignes de l'exemple sont fictives.
- Sur le BL, la colonne A est le numéro de ligne et la colonne B le N° de série (une seule référence imprimée). **Une ligne par unité** : une quantité de 3 donne 3 lignes.
- Saisir le N° de série en B : désignation, poids et origine sont repris du catalogue. Série inconnue : description du devis conservée, origine « FR ».
- Référence catalogue, code SH, OD et longueur s'affichent à droite (colonnes M à P), hors zone d'impression.
- Après un nouvel import : Ctrl + Alt + L pour réappliquer le filtre (lignes vides masquées).
