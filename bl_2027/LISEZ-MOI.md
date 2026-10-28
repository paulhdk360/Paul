# Bon de livraison (BL) 2027

- `BL_Enedril_2027.xlsx` : classeur vierge. `BL_Enedril_2027_exemple.xlsx` : exemple.
- `generer_bl.py` : recrée les deux fichiers (`python3 generer_bl.py <dossier> [exemple]`).

## Utilisation
1. Onglet « 2 Import devis » : copier les colonnes C à J de l'onglet « 2 Matériel » du devis (lignes 6 à 29) et les coller en B6. Description, quantité et valeur de remplacement (LIH / DBR) passent sur le BL ; les tarifs de location restent dans l'import et ne sont pas imprimés.
2. Onglet « 1 Bon de livraison » : n° du BL, date, dossier, client, puits, PO, transporteur, PO transport, délai, adresse de livraison ; puis pour chaque ligne la référence, le(s) n° de série, l'origine (FR par défaut) et le poids net par unité. Les totaux (quantité, poids, valeur) et le colisage se calculent.
3. Appuyer sur Ctrl + Alt + L (Données > Réappliquer) pour masquer les lignes vides ; un message rouge le rappelle.
4. Imprimer en A4 portrait ou exporter en PDF : la page porte les cadres de signature expéditeur, transporteur et client.

L'ancien modèle récupérait référence, origine, code SH, poids et désignation dans le fichier de suivi des immobilisations (liens externes). Cette version se remplit à la main, sans lien externe.

## Désignations : lien vers le registre (comme l'ancien BL)

- Le BL lit directement le classeur **Mouvements et modif Immo.xlsx** (feuille « Fabrication - Achat - 2014 et + », colonnes Z à BB) sur le serveur : `Z:\\MUSTANG SERVICES\\10_Servicing\\5_Stock\\Inventaire\\`. Même lien que l'ancien BL. Il n'y a plus d'onglet catalogue.
- À l'ouverture, Excel affiche « La mise à jour automatique des liaisons a été désactivée » : cliquer sur **Activer le contenu** (ou Données › Modifier les liens › Mettre à jour). Sans accès à `Z:`, le BL utilise la dernière copie mémorisée dans le classeur.
- Sur le BL, la colonne A est le numéro de ligne et la colonne B le N° de série. **Une ligne par unité** : une quantité de 3 donne 3 lignes. Désignation, poids et origine sont repris du registre. Série inconnue : description du devis conservée, origine « FR ».
- Référence du registre, code SH, OD et longueur s'affichent à droite (colonnes M à P), hors zone d'impression. L'OD est affiché en fractions (4,75 donne 4 3/4).
- Pas de liste déroulante des N° de série avec un lien externe : saisie directe.
- Après un nouvel import : Ctrl + Alt + L pour réappliquer le filtre (lignes vides masquées).
- Le dossier `lien_registre/` contient le lien repris de l'ancien BL ; le générateur l'injecte dans le classeur.
