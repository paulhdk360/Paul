# Cartes de vœux Enedril 2027 (coffrets cadeaux)

Format A6 paysage (148 × 105 mm), recto / verso, avec 3 mm de fond perdu pour l'imprimeur (page de 154 × 111 mm dans le PDF).

- **F · Visuel jour, FR et EN (retenu)** : visuel fourni (rig-sapin sous la neige, puits horizontal qui finit sur une étoile). Titre blanc et or, logo couleur sur la bande claire ; au verso, la photo de chantier (coucher de soleil, luminaire rogné) en fondu sur le bleu, avec le message. Fichiers `carte_F_jour_FR.html` et `carte_F_jour_EN.html`, image dans `photos/visuel_jour.jpg` (1164 × 840 px : environ 190 dpi à 154 mm, à refaire en plus grande définition pour l'impression).
- **E · Visuel nuit** : fond généré par vos soins (rig-sapin lumineux de nuit sur tubes), titre en Barlow Condensed blanc et cyan, mot de l'équipe en or, logo en bas ; au verso, le même visuel recadré et assombri avec le message. Image dans `photos/visuel_fond.jpg`.
- **C · Bon de livraison** : la carte est un faux « Delivery ticket » Enedril (tampon « Livré avec le sourire », lignes santé, projets, opérations sans temps perdu, succès) ; au verso, trois « pièces jointes » photo et un espace pour un mot manuscrit.
- **D · Plan technique** : fond bleu type plan d'ingénieur avec grille, sapin dessiné comme un assemblage de tubulaires (cotation, filetage, cartouche « vérifié par Père Noël ») ; au verso, trois photos en « vues » A/B/C.
- **A · Nuit de forage** : trois photos « polaroid » (atelier, flamme, rig), titre en Barlow Condensed, flocons discrets, touche dorée.
- **B · L'équipe** : photo d'équipe en grand, bandeau marine, et au verso un cadre « Un mot de notre part » pour écrire à la main.

Les fichiers HTML sont modifiables : remplacer les images du dossier `photos/` (mêmes noms), ou changer les textes dans le HTML, puis lancer `node rendre.cjs` (PDF avec fond perdu). Aperçu PNG au format fini : `pdftoppm -r 300 -png carte_A_nuit_fond_perdu.pdf apercu`, puis rogner 3 mm.
Polices : Barlow, Barlow Condensed, JetBrains Mono (dossier `fonts/`, licence libre SIL OFL). Résolution des photos d'origine : modeste (≈ 450 × 540 px par photo pour A) ; remplacer par des fichiers d'origine en haute définition avant l'impression.
