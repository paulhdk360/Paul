export const COMPANY = {
  nom: "ENEDRIL SAS",
  adresse: "Zone Induspal, 3 av. des Lacs, 64140 Lons, France",
  tel: "+33 559 045 045",
  web: "www.enedril.com",
  siret: "794 642 462 00020",
  tva: "FR11794642462",
};

export const AFFAIRE_STATUTS = [
  "Devis en préparation",
  "Devis envoyé",
  "Devis accepté",
  "Devis refusé",
  "En cours",
  "Terminée",
] as const;

export const DEVIS_STATUTS = ["Brouillon", "Envoyé", "Accepté", "Refusé"] as const;

export const LIGNE_TYPES = [
  "Operation",
  "Stand By",
  "Maintenance",
  "Inspection",
  "Restocking",
  "Lost In Hole",
  "Transport",
  "Personnel",
  "Serrage",
] as const;

export const TOOL_STATUTS = ["En stock", "Préparé", "Expédié", "Sur site", "Retour", "Maintenance"] as const;

export const TRANSPORT_CODES = ["Aller", "Retour", "Express", "Affrètement", "Coursier", "Exceptionnel", "Autre"] as const;

export const POINTAGE_CODES = ["MOB", "S", "O", "DEMOB", "FIN"] as const;

export const ROLES = ["admin", "commercial", "atelier", "operateur"] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  commercial: "Commercial",
  atelier: "Atelier / Logistique",
  operateur: "Opérateur",
};
