# France Chrono 2027

`France_Chrono_2027.xlsx` : un seul onglet, un devis par ligne (20 colonnes au lieu de 49 en 2026).

- **Statut unique** (liste) : A faire · Envoyé · En attente · Gagné · Terminé · Perdu · Annulé (remplace les colonnes Won / Pending / Lost / Cancelled / Finish).
- **Indicateurs** en haut : devis, à faire, en attente, gagnés, perdus, taux de transformation, nombre de devis faits (avec date d'envoi), durée moyenne d'envoi des devis, à relancer. Pas de tableau croisé dynamique : tout se met à jour tout seul.
- **À relancer** : devis Envoyé ou En attente depuis 7 jours ou plus sans date de relance.
- **Prochaine référence** (case à droite des indicateurs) proposée (27-NNN-XX) ; le code client (XX) reste à saisir.
- **Liens** : colonnes P à T : Devis · Tool list · BL · Service ticket · Dossier = lien cliquable construit à partir de la Réf. Le chemin du serveur (`Z:\MUSTANG SERVICES\Affaires 2027\`) est inscrit dans les formules : pour le changer, Ctrl + H, cocher « Dans : Formules », remplacer l'ancien chemin par le nouveau. Convention : dossier `chemin + Réf\` avec `Réf_Devis.xlsx`, `Réf_ToolList.xlsx`, `Réf_BL.xlsx`, `Réf_ServiceTicket.xlsx`. 
- Ne pas insérer de lignes : écrire dans la première ligne vide (500 lignes prévues, formules déjà en place). Les 3 lignes d'exemple sont fictives, à effacer.
