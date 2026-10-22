# Veille commerciale Enedril

- `Veille_Enedril_2026-10.pdf` / `.html` : premier bulletin (rigs actifs en Europe, projets et appels d'offres, acier, tungstène, euro/dollar, actions conseillées).
- `generer_bulletin.py` : refait le bulletin à partir du fichier Excel mensuel Baker Hughes et d'un fichier `contenu_AAAA-MM.json` (projets, marchés, actions).
  `python3 generer_bulletin.py <rig_count.xlsx> <contenu.json> <sortie_sans_extension>`
- `Baker_Hughes_RigCount_2026-09.xlsx` : données du mois de septembre 2026.

## Mise à jour
1. Chaque mois : télécharger le nouveau fichier Excel sur https://rigcount.bakerhughes.com/intl-rig-count/ (non accessible depuis la session de Claude tant que ce domaine n'est pas autorisé dans l'environnement).
2. Chaque semaine : faire rechercher par Claude les projets, appels d'offres (BOAMP, TED), l'acier, le tungstène et le taux euro/dollar, et mettre à jour le fichier JSON.
3. Relancer le script : le PDF est refait.

## Limites
Baker Hughes ne compte pas les foreuses de géothermie. Les prix des matières viennent de la presse spécialisée, pas de cotations en direct.

## Carte
`europe_paths.json` est le fond de carte simplifié ; `fabriquer_fond_de_carte.py` le recrée (une seule fois, nécessite `pip install geopandas==0.14.4`).
