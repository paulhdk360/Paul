<?php
// Configuration — à adapter lors du passage sur l'hébergement OVH.
// En local (démo), ces valeurs pointent vers la base MariaDB locale.

define('DB_HOST', getenv('BFE_DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('BFE_DB_NAME') ?: 'bfe_pilotage');
define('DB_USER', getenv('BFE_DB_USER') ?: 'bfe_app');
define('DB_PASS', getenv('BFE_DB_PASS') ?: 'bfe_dev_local_pw');

// Coordonnées de l'entreprise, reprises du modèle de devis BFE-DEV.
define('ENTREPRISE_NOM', 'Béarn Forage Énergie – BFE');
define('ENTREPRISE_ADRESSE', '10 chemin du Gers Dessus 64230 MAZEROLLES');
define('ENTREPRISE_SIRET', '103907267');
define('ENTREPRISE_APE', '4313Z');
define('ENTREPRISE_REPRESENTANT', 'Jérémie CLAUDE');
define('ENTREPRISE_TEL', '0789776542');
define('ENTREPRISE_EMAIL', 'contact.bfe64@gmail.com');
define('ENTREPRISE_FORME', 'Société à responsabilité limitée – Capital 10 000 Euros – RCS Pau 103 907 267 – APE 4313Z');

date_default_timezone_set('Europe/Paris');
