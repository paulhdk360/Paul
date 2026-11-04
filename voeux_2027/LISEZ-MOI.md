# Cartes de vœux Enedril 2027 (coffrets cadeaux)

Format A6 paysage (148 × 105 mm), recto / verso, avec 3 mm de fond perdu pour l'imprimeur (page de 154 × 111 mm dans le PDF).

- **A · Nuit de forage** : trois photos « polaroid » (atelier, flamme, rig), titre en Barlow Condensed, flocons discrets, touche dorée.
- **B · L'équipe** : photo d'équipe en grand, bandeau marine, et au verso un cadre « Un mot de notre part » pour écrire à la main.

Les fichiers HTML sont modifiables : remplacer les images du dossier `photos/` (mêmes noms), ou changer les textes dans le HTML, puis lancer `node rendre.cjs` (PDF avec fond perdu). Aperçu PNG au format fini : `pdftoppm -r 300 -png carte_A_nuit_fond_perdu.pdf apercu`, puis rogner 3 mm.
Polices : Barlow, Barlow Condensed, JetBrains Mono (dossier `fonts/`, licence libre SIL OFL). Résolution des photos d'origine : modeste (≈ 450 × 540 px par photo pour A) ; remplacer par des fichiers d'origine en haute définition avant l'impression.
