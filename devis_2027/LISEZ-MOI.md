# Devis et Tool List 2027

Deux classeurs Excel, dans deux fichiers séparés :

- `Devis_Enedril_2027.xlsx` : onglets 1 Affaire, 2 Matériel, 3 Options, 4 Devis (avec les prix).
- `Tool_List_Enedril_2027.xlsx` : onglets 1 Matériel (à coller), 2 Tool List et colisage (sans aucun prix, pour l'atelier).
- Les fichiers `_exemple` sont remplis avec un exemple (tarifs fictifs).
- `generer_devis_2027.py` recrée les quatre fichiers : `python3 generer_devis_2027.py <dossier> [exemple]`.

## Du devis à la tool list
Dans le devis, onglet 2, copier B6:E29 (Bannière, Description, Qté, Note) et coller en B6 de l'onglet « 1 Matériel » du classeur Tool List.
Une quantité de 2 donne 2 lignes ; une bannière (ex. « BHA #1 ») donne une ligne de titre. Les références se saisissent dans la tool list.

## Bannières
Dans l'onglet 2 du devis : « Oui » dans la colonne Bannière, titre dans Description. La bannière s'affiche en bandeau sur le devis et sur la tool list.

## Forfait
Bloc détaché et en grand sous la liste du matériel (onglet 3, section Forfait). Mode « calculé » : 3 jours de stand-by + 2 jours d'opérations + toutes les utilisations de charge, sur les lignes « Inclus au forfait ».
