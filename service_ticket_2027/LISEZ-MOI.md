# Service ticket 2027

- `Service_Ticket_Enedril_2027.xlsx` : classeur vierge.
- `Service_Ticket_Enedril_2027_exemple.xlsx` : exemple rempli (tarifs fictifs), sur deux mois (octobre et novembre).
- `generer_service_ticket.py` : recrée les deux fichiers (`python3 generer_service_ticket.py <dossier> [exemple]`).

## Utilisation
1. En haut : client, puits, dossier, PO, ingénieur, **date de début** et **date de fin**. Un bloc du calendrier = **un mois civil** : le 1er bloc va de la date de début à la fin de son mois, puis un bloc par mois suivant (3 mois maximum). Sans date de fin, le ticket couvre le mois de la date de début ; changer la date de fin active les jours et les mois suivants. Les mois 2 et 3 sont repliés : cliquer sur le [+] au-dessus du calendrier pour les déplier. Les jours après la date de fin sont grisés et ne comptent pas.
2. Matériel : dans le devis, onglet « 2 Matériel », copier les colonnes C à J et les coller en B22 du ticket.
3. Calendrier : un code par jour et par ligne. S = stand-by, O = opérations, FOC = gratuit, VR = valeur de remplacement, RC = restocking, MOB / DEMOB = arrivée / départ (comptés comme des jours de stand-by ; pour les opérateurs, le prix mob / demob s'ajoute).
4. UC et inspection : facturées une seule fois par outil, dans le mois où il travaille en O pour la première fois, même s'il est réutilisé les mois suivants. Si l'UC a déjà été facturée sur un ticket précédent, mettre « Oui » dans la colonne « UC déjà facturée ».
5. Récapitulatif global à gauche, et facturation de chaque mois sous le calendrier (jours opérateurs, mob / demob, location, UC, valeur de remplacement). Le transport et les autres frais sont hors blocs.

## Serrages

- Section **SERRAGES** (2 lignes) sous le matériel : saisir le nombre de serrages effectués chaque jour directement dans le calendrier (un nombre, pas un code), et le prix par serrage en colonne « Opér. € » (E).
- Le montant suit les mois : les serrages d'octobre sont dans la facturation d'octobre, ceux de novembre dans celle de novembre. Une ligne « Serrages » apparaît dans le récapitulatif général et dans chaque bloc mensuel.
