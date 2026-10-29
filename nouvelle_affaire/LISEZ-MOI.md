# Nouvelle affaire (création automatique du dossier)

Double-cliquer sur `Nouvelle_affaire.bat` :
1. saisir la référence de l'affaire (ex. `27-005-FR`) ;
2. répondre aux questions : client, prospect ou client, job (numéro), description, offre par (initiales), langue du devis (F ou E) ;
3. le script crée `Z:\MUSTANG SERVICES\12-Clients\2027\27-005-FR\` et y copie, depuis `Modeles\` :
   `27-005-FR_Devis.xlsx`, `27-005-FR_ToolList.xlsx`, `27-005-FR_BL.xlsx`, `27-005-FR_ServiceTicket.xlsx`, puis ouvre le dossier.

Les liens du France Chrono 2027 (Devis, Tool list, BL, Service ticket, Dossier) pointent exactement sur ces noms.

- Un fichier déjà présent n'est jamais écrasé.
- Le script cherche les modèles dans un sous-dossier `Modeles` ou `_Modeles` à côté de lui, par nom : `Devis*FR*`, `Devis*EN*`, `Tool*list*`, `BL*`, `Service*ticket*` (fichiers Excel). Renommer sans souci tant que ces mots restent dans le nom.
- Chemin des affaires : variable `$Base` en haut de `Nouvelle_affaire.ps1`.
- Non testé sous Windows (écrit sans accès à un poste Windows) : tester une première fois avec une référence d'essai.

## Inscription dans le chrono

Après la création du dossier, le script ajoute la ligne dans l'onglet « Chrono 2027 » de `Z:\MUSTANG SERVICES\12-Clients\FRANCE CHRONO 2027.xlsx` : Réf, date de demande (aujourd'hui), client, prospect/client, job, description, offre par, statut « A faire ». Il utilise Excel (nécessaire sur le poste). Si le chrono est ouvert par quelqu'un d'autre (lecture seule) ou si Excel n'est pas disponible, le script le dit et copie la référence dans le presse-papiers : la coller en colonne A. Si le chrono est ouvert dans votre propre Excel, la ligne s'ajoute et le fichier est enregistré.
