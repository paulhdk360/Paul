# France Chrono 2027

`France_Chrono_2027.xlsx` : un seul onglet, un devis par ligne (22 colonnes au lieu de 49 en 2026).

- **Statut unique** (liste) : A faire · Envoyé · En attente · Gagné · Terminé · Perdu · Annulé (remplace les colonnes Won / Pending / Lost / Cancelled / Finish).
- **Indicateurs** en haut : devis, à faire, en attente, gagnés, perdus, taux de transformation, nombre de devis faits (avec date d'envoi), durée moyenne d'envoi des devis, à relancer. Pas de tableau croisé dynamique : tout se met à jour tout seul.
- **À relancer** : devis Envoyé ou En attente depuis 7 jours ou plus sans date de relance.
- **Liens** : colonnes Q à U : Devis · Tool list · BL · Service ticket · Dossier = lien cliquable construit à partir de la Réf. Le chemin du serveur (`Z:\MUSTANG SERVICES\12-Clients\2027\`) est inscrit dans les formules : pour le changer, Ctrl + H, cocher « Dans : Formules », remplacer l'ancien chemin par le nouveau. Convention : dossier `chemin + Réf\` avec `Réf_Devis.xlsx`, `Réf_ToolList.xlsx`, `Réf_BL.xlsx`, `Réf_ServiceTicket.xlsx`. 
- Ne pas insérer de lignes : écrire dans la première ligne vide (500 lignes prévues, formules déjà en place). Les 3 lignes d'exemple sont fictives, à effacer.
- **Prospect / client** : colonne à côté du client (liste Prospect · Client).
- **Taux de transformation** = gagnés (Gagné + Terminé) ÷ (gagnés + perdus). Les devis Envoyé, En attente, À faire et Annulé ne comptent pas.
- **Répartition par type de job** (sous les indicateurs) : % des devis par job, % des devis gagnés par job (part de chaque job dans les gagnés) et taux de transformation par job (gagnés ÷ gagnés + perdus).
- **Jobs** (liste déroulante) : Fishing, Directional Drilling, Opérateurs, Serrage / desserrage, Fishing + DD, Machines, Autres.
- **Statut En validation** ajouté (compté avec « À faire » dans les indicateurs).

## Intégration dans l'ancien France Chrono

`integrer_dans_ancien.py <ancien_chrono.xlsx> France_Chrono_2027.xlsx <sortie.xlsx>` ajoute l'onglet « Chrono 2027 » à la fin de l'ancien classeur. Les autres onglets (tableaux croisés, segments, mises en forme) ne sont pas modifiés : seuls les fichiers de styles et de structure du classeur sont complétés. Le classeur obtenu n'est pas conservé dans le dépôt (il contient les données clients).

- **Puits / rig** : colonne après le contact. **Prestation** : Rental ou Sales. Indicateurs « % Rental » et « % Sales » (part des devis) à droite des indicateurs.

- **BL et service tickets multiples** : colonnes « Nb BL » et « Nb ST » (nombre de documents de l'affaire, mis à jour par les scripts ou à la main) ; liens BL 1 à BL 4 et ST 1 à ST 3 affichés selon ce nombre.
