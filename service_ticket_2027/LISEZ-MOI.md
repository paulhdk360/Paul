# Service ticket 2027

- `Service_Ticket_Enedril_2027.xlsx` : classeur vierge.
- `Service_Ticket_Enedril_2027_exemple.xlsx` : exemple rempli (tarifs fictifs).
- `generer_service_ticket.py` : recrée les deux fichiers (`python3 generer_service_ticket.py <dossier> [exemple]`).

## Utilisation
1. En haut : client, puits, dossier, PO, ingénieur Enedril et **date de début**. Le calendrier se remplit tout seul : 93 jours (3 mois) en trois blocs de 31 jours, chacun sur sa page à l'impression. La date de fin et la durée se calculent d'après le dernier jour marqué.
2. Matériel : dans le devis, onglet « 2 Matériel », copier les colonnes C à J et les coller en B21 du ticket (description, quantité, tarifs).
3. Calendrier : saisir un code par jour et par ligne. S = stand-by, O = opérations, FOC = gratuit, VR = valeur de remplacement (perdu), RC = restocking (retourné non utilisé), MOB et DEMOB pour les opérateurs.
4. Les totaux se calculent : jours S et O par ligne, UC et inspection une seule fois si l'outil a travaillé au moins un jour, récapitulatif avec les codes comptables.

## Simplifications par rapport à l'ancien ticket
Colonnes supprimées : N° de série, référence article, propriétaire, bon de livraison, vente, transport par ligne. Les sections Mob/Demob et Engineers sont regroupées en « Opérateurs » et « Transport et autres frais ».
