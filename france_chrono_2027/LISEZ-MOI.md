# France Chrono 2027

`France_Chrono_2027.xlsx` : un seul onglet, un devis par ligne (27 colonnes au lieu de 49 en 2026).

- **Statut unique** (liste) : A faire · Envoyé · En attente · Gagné · Terminé · Perdu · Annulé (remplace les colonnes Won / Pending / Lost / Cancelled / Finish).
- **Indicateurs** en haut : devis, à faire, en attente, gagnés, perdus, taux de transformation, délai moyen, montant gagné, facturé, à relancer. Pas de tableau croisé dynamique : tout se met à jour tout seul.
- **À relancer** : devis Envoyé ou En attente depuis 7 jours ou plus sans date de relance.
- **Prochaine référence** proposée (27-NNN-XX) ; le code client (XX) reste à saisir.
- **Liens** : colonnes Devis · Tool list · BL · Service ticket · Dossier = lien cliquable construit à partir du chemin en A8 et de la Réf. Convention : dossier `chemin + Réf\` avec `Réf_Devis.xlsx`, `Réf_ToolList.xlsx`, `Réf_BL.xlsx`, `Réf_ServiceTicket.xlsx`. Modifier le chemin en A8 si le serveur change.
- Ne pas insérer de lignes : écrire dans la première ligne vide (500 lignes prévues, formules déjà en place). Les 3 lignes d'exemple sont fictives, à effacer.
