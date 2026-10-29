# Nouvelle affaire (création automatique du dossier)

Double-cliquer sur `Nouvelle_affaire.bat` :
1. saisir la référence de l'affaire (ex. `27-005-FR`) ;
2. choisir la langue du devis (F ou E) ;
3. le script crée `Z:\MUSTANG SERVICES\12-Clients\2027\27-005-FR\` et y copie, depuis `Modeles\` :
   `27-005-FR_Devis.xlsx`, `27-005-FR_ToolList.xlsx`, `27-005-FR_BL.xlsx`, `27-005-FR_ServiceTicket.xlsx`, puis ouvre le dossier.

Les liens du France Chrono 2027 (Devis, Tool list, BL, Service ticket, Dossier) pointent exactement sur ces noms.

- Un fichier déjà présent n'est jamais écrasé.
- Mettre le dossier `nouvelle_affaire` sur le serveur (ex. `Z:\MUSTANG SERVICES\12-Clients\_Modeles\`) pour que tout le monde utilise les mêmes modèles ; pour changer de modèle, remplacer le fichier dans `Modeles\` en gardant le même nom.
- Chemin des affaires : variable `$Base` en haut de `Nouvelle_affaire.ps1`.
- Non testé sous Windows (écrit sans accès à un poste Windows) : tester une première fois avec une référence d'essai.
