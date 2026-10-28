# Devis et Tool List 2027

- `Devis_Enedril_2027.xlsx` : classeur vierge.
- `Devis_Enedril_2027_exemple.xlsx` : même classeur rempli avec un exemple (tarifs fictifs).
- `generer_devis_2027.py` : recrée les deux fichiers (`python3 generer_devis_2027.py sortie.xlsx [exemple]`).

Saisie dans les onglets 1 (Affaire), 2 (Matériel), 3 (Options). Le devis (4) et la tool list (5) se remplissent seuls.
Une ligne du matériel avec une quantité de 2 donne 2 lignes sur la tool list.
Les listes déroulantes (contacts, incoterms, supports de colisage…) se modifient dans l'onglet « Listes ».

## Mise à jour
- Le devis ne contient plus de références : elles se saisissent dans la tool list (colonne « Référence (PL) »), une par ligne.
- La tool list ne contient aucun prix : pour l'atelier, l'envoyer en PDF (Fichier > Imprimer > feuille active) et ne pas transmettre le classeur.
- Forfait « calculé » : 3 jours de stand-by + 2 jours d'opérations + toutes les utilisations de charge (jours modifiables dans l'onglet 3).
- Onglet « 6 Page de garde » : page de garde du dossier commercial, remplie à partir de l'onglet 1.

Le dossier envoyé au client s'assemble avec `dossier_commercial/assembler_dossier.py`.
