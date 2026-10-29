# Nouvelle affaire (création automatique du dossier)

Double-cliquer sur `Nouvelle_affaire.bat` :
1. saisir la référence de l'affaire (ex. `27-005-FR`) ;
2. répondre aux questions : client, rig / puits, prospect ou client, job (numéro), Rental ou Sales, description, offre par (initiales), langue du devis (F ou E) ;
3. le script crée `Z:\MUSTANG SERVICES\12-Clients\2027\27-005-FR\` et y copie, depuis `Modeles\` :
   `27-005-FR_Devis.xlsx`, `27-005-FR_ToolList.xlsx`, `27-005-FR_BL.xlsx`, `27-005-FR_ServiceTicket.xlsx`, puis ouvre le dossier.

Les liens du France Chrono 2027 (Devis, Tool list, BL, Service ticket, Dossier) pointent exactement sur ces noms.

- Si la référence est déjà prise (le dossier existe), le script le dit tout de suite en rouge, ne crée ni ne modifie rien, et propose d'ouvrir le dossier existant. Les questions suivantes ne sont pas posées.
- Le script cherche les modèles dans un sous-dossier `Modeles` ou `_Modeles` à côté de lui, par nom : `Devis*FR*`, `Devis*EN*`, `Tool*list*`, `BL*`, `Service*ticket*` (fichiers Excel). Renommer sans souci tant que ces mots restent dans le nom.
- Chemin des affaires : variable `$Base` en haut de `Nouvelle_affaire.ps1`.
- Non testé sous Windows (écrit sans accès à un poste Windows) : tester une première fois avec une référence d'essai.

## Inscription dans le chrono

Après la création du dossier, le script ajoute la ligne dans l'onglet « Chrono 2027 » du chrono situé dans `Z:\MUSTANG SERVICES\12-Clients\` (le script cherche `FRANCE CHRONO.xlsx`, sinon `FRANCE CHRONO 2027.xlsx`, sinon tout fichier `FRANCE*CHRONO*.xls*`) : Réf, date de demande (aujourd'hui), client, prospect/client, puits / rig, job, prestation (Rental / Sales), description, offre par, statut « A faire ». Il utilise Excel (nécessaire sur le poste). Si le chrono est ouvert par quelqu'un d'autre (lecture seule) ou si Excel n'est pas disponible, le script le dit et copie la référence dans le presse-papiers : la coller en colonne A. Si le chrono est ouvert dans votre propre Excel, la ligne s'ajoute et le fichier est enregistré.

## Plusieurs BL et plusieurs service tickets pour une affaire

- `Nouveau_BL.bat` et `Nouveau_ServiceTicket.bat` (avec leurs `.ps1` et `Chrono.ps1`, à placer à côté de `Nouvelle_affaire`) : saisir la référence d'une affaire existante ; le script copie le modèle sous le numéro suivant dans le dossier de l'affaire (`Réf_BL.xlsx`, puis `Réf_BL2.xlsx`, `Réf_BL3.xlsx`… ; `Réf_ServiceTicket.xlsx`, puis `Réf_ServiceTicket2.xlsx`…), l'ouvre, et met à jour le chrono.
- Dans le chrono (onglet « Chrono 2027 »), les colonnes **Nb BL** et **Nb ST** comptent les documents de l'affaire ; les liens **BL 1 à BL 4** et **ST 1 à ST 3** apparaissent selon ce nombre. `Nouvelle_affaire` met Nb BL et Nb ST à 1. Au-delà de 4 BL ou 3 ST, utiliser le lien « Dossier ».
- Si le chrono ne peut pas être mis à jour (ouvert par quelqu'un d'autre…), le script le dit : saisir le nombre à la main dans la colonne Nb BL / Nb ST.
- `Chrono.ps1` contient les fonctions communes (recherche du chrono, écriture). Les trois scripts en ont besoin.
