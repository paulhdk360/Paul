export const COMPANY = {
  nom: "Béarn Forage Énergie – BFE",
  adresse: "10 chemin du Gers Dessus 64230 MAZEROLLES",
  siret: "103907267",
  ape: "4313Z",
  representant: "Jérémie CLAUDE",
  fonction: "Gérant",
  telephone: "0789776542",
  email: "contact.bfe64@gmail.com",
  mentionLegale:
    "Société à responsabilité limitée – Capital 10 000 Euros – RCS Pau 103 907 267 – APE 4313Z",
};

export const DEVIS_STATUTS = ["Brouillon", "Envoyé", "Relancé", "Accepté", "Refusé"] as const;

export type TypeActivite = "Forage de production d'eau" | "Forage géothermique";

export const ACTIVITE_DEFAULTS: Record<
  TypeActivite,
  { objetTexte: string; prestationsIncluses: string; limitesExclusions: string }
> = {
  "Forage de production d'eau": {
    objetTexte:
      "Le présent devis a pour objet la réalisation d'un ouvrage de captage d'eau souterraine, destiné à la production d'eau pour l'usage indiqué par le client. La prestation peut comprendre, selon les options retenues :\n• visite préalable et implantation prévisionnelle ;\n• amenée et repli de la foreuse et des équipements ;\n• forage définitif de production ;\n• tubage, crépines, massif filtrant, cimentation annulaire ;\n• développement de l'ouvrage, essais de pompage et mesures de niveaux.",
    prestationsIncluses:
      "• Mobilisation du personnel et du matériel de forage selon planning validé.\n• Mise en place d'une zone de travail sécurisée et respect des consignes chantier.\n• Forage selon les règles de l'art, dans les limites des hypothèses techniques indiquées.\n• Mise en place de l'équipement définitif de l'ouvrage selon les venues d'eau rencontrées.\n• Réalisation des essais et mesures prévus au devis.",
    limitesExclusions:
      "• Étude hydrogéologique complète, modélisation, dossier loi sur l'eau, autorisation administrative ou étude d'incidence, sauf ligne spécifique chiffrée.\n• Ce devis ne constitue pas une garantie de débit, de potabilité ou de qualité physico-chimique de l'eau. Les résultats sont conditionnés par la géologie locale, l'hydrogéologie du site et les essais réalisés après forage.\n• En cas de débit insuffisant, d'absence de ressource ou d'aléa géologique majeur, les travaux réalisés restent dus selon l'avancement constaté.\n• Terrassements, plateformes, accès, empierrement, remise en état lourde, grutage, autorisations de voirie ou occupation du domaine public.\n• Évacuation de boues, déblais ou eaux de forage hors site si non chiffrée.\n• Surcoûts liés à réseaux non signalés, pollution, accès non conforme, refus administratif, venues d'eau incontrôlées, pertes de circulation, terrain instable ou aléa géologique majeur.",
  },
  "Forage géothermique": {
    objetTexte:
      "Le présent devis a pour objet la réalisation d'un ou plusieurs forages géothermiques verticaux destinés à l'installation d'une pompe à chaleur. La prestation peut comprendre, selon les options retenues :\n• visite préalable et implantation prévisionnelle ;\n• amenée et repli de la foreuse et des équipements ;\n• forage(s) au diamètre et à la profondeur prévus ;\n• pose de la ou des sondes géothermiques et cimentation ;\n• raccordement en tranchée jusqu'au collecteur, test d'étanchéité.",
    prestationsIncluses:
      "• Mobilisation du personnel et du matériel de forage selon planning validé.\n• Mise en place d'une zone de travail sécurisée et respect des consignes chantier.\n• Forage selon les règles de l'art, dans les limites des hypothèses techniques indiquées.\n• Pose et raccordement des sondes géothermiques selon les prescriptions du fabricant.\n• Réalisation des essais et contrôles prévus au devis (test d'étanchéité, débit).",
    limitesExclusions:
      "• Étude thermique du bâtiment, dimensionnement de la pompe à chaleur, dossier réglementaire, sauf ligne spécifique chiffrée.\n• Ce devis ne constitue pas une garantie de performance énergétique de l'installation. Les résultats dépendent de la géologie locale et du dimensionnement de la pompe à chaleur.\n• En cas d'aléa géologique majeur (roche dure, venues d'eau importantes), les travaux réalisés restent dus selon l'avancement constaté.\n• Terrassements, plateformes, accès, empierrement, remise en état lourde, grutage, autorisations de voirie ou occupation du domaine public.\n• Fourniture et raccordement de la pompe à chaleur elle-même, sauf ligne spécifique chiffrée.\n• Surcoûts liés à réseaux non signalés, pollution, accès non conforme, refus administratif, terrain instable ou aléa géologique majeur.",
  },
};
