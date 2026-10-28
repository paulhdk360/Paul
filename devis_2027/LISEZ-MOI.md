# Devis et Tool List 2027

Deux classeurs Excel, dans deux fichiers séparés :

- `Devis_Enedril_2027_FR.xlsx` et `Devis_Enedril_2027_EN.xlsx` : onglets 1 Affaire, 2 Matériel, 3 Options, 4 Devis (avec les prix). Le devis imprimé est entièrement en français ou en anglais (titres, libellés, unités, conditions) ; la saisie reste en français.
- `Tool_List_Enedril_2027.xlsx` : onglets 1 Matériel (à coller), 2 Tool List et colisage (sans aucun prix, pour l'atelier).
- Les fichiers `_exemple` sont remplis avec un exemple (tarifs fictifs).
- `generer_devis_2027.py` recrée les quatre fichiers : `python3 generer_devis_2027.py <dossier> [exemple]`.

## Du devis à la tool list
Dans le devis, onglet 2, copier B6:D29 (Bannière, Description, Qté) et coller en B6 de l'onglet « 1 Matériel » du classeur Tool List.
Une quantité de 2 donne 2 lignes ; une bannière (ex. « BHA #1 ») donne une ligne de titre. Les références se saisissent dans la tool list.

## Bannières
Dans l'onglet 2 du devis : « Oui » dans la colonne Bannière, titre dans Description. La bannière s'affiche en bandeau sur le devis et sur la tool list.

## Forfait
Bloc détaché et en grand sous la liste du matériel (onglet 3, section Forfait). Mode « calculé » : 3 jours de stand-by + 2 jours d'opérations + toutes les utilisations de charge, sur les lignes « Inclus au forfait ».

## Forfait : prix affichés ou masqués
Onglet 3, section Forfait : « Afficher les prix des lignes du forfait sur le devis ». Non : les lignes couvertes s'affichent « incl. » ; Oui : elles gardent leurs tarifs. Le prix final du forfait apparaît dans le bandeau dans les deux cas.

## Impression
Le devis est en A4 portrait, sur 2 pages (matériel, puis serrage, transport, opérateurs, forfait, conditions et signature). La tool list reste en paysage.

## Forfait, serrage et transport
Dans le forfait, le serrage et le transport sont inclus par défaut (onglet 3, deux cases à cocher) : leur prix s'ajoute au montant calculé et leurs lignes s'affichent « incl. » (ou avec leurs prix si l'affichage des prix du forfait est sur Oui).
Le devis n'écrit pas le détail du calcul : il montre le bandeau Forfait et son montant, avec le périmètre en dessous s'il est renseigné.

## Mise en page du devis
Les lignes du devis se compactent toutes seules : matériel, puis serrage, transport, opérateurs et forfait se suivent sans ligne vide. Les conditions et la signature sont sur la page 2.

## Mise à jour des lignes du devis
Les lignes vides du devis sont masquées par un filtre. Après avoir modifié le matériel ou les options, appuyer sur **Ctrl + Alt + L** (Données > Réappliquer) dans l'onglet 4 pour recompacter. Un message rouge en haut du devis le rappelle quand c'est nécessaire.

## Français ou anglais
Deux fichiers : `_FR` et `_EN`. Pour basculer un fichier de langue, mettre 1 (français) ou 2 (anglais) dans la cellule H1 de l'onglet « Listes ».

## Tool list : mise à jour des lignes
Comme pour le devis, les lignes vides de la tool list sont masquées par un filtre : après avoir collé le matériel, appuyer sur **Ctrl + Alt + L** (Données > Réappliquer) pour afficher toutes les lignes. Un message rouge le rappelle quand c'est nécessaire.
La tool list contient : préparée par et validée par en haut, les items avec leurs relevés (la référence et le numéro de série s'écrivent à la main, en gros), le nombre de serrages effectués, puis le colisage de l'ensemble des items (type, dimensions, poids, volume).
