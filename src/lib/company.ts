export const COMPANY = {
  nom: "ENEDRIL SAS",
  adresse: "Zone Induspal, 3 av. des Lacs, 64140 Lons, France",
  tel: "+33 559 045 045",
  web: "www.enedril.com",
  siret: "794 642 462 00020",
  tva: "FR11794642462",
};

// Standard terms applied to every quote — distinct from the per-devis
// "Conditions particulières" field, which stays free-text for anything
// specific to that job.
export const CONDITIONS_GENERALES =
  "La location s'entend depuis le jour de départ de la base d'origine jusqu'à son retour au même endroit. " +
  "Le Wear Charge s'applique pour toute usure liée à un usage normal des équipements. En cas de dommages plus " +
  "importants liés à un usage anormal, la valeur de remplacement sera facturée sur documentation. Charges " +
  "additionnelles à prévoir pour le colisage d'outils destinés à une expédition en aérien ou maritime. " +
  "Conditions générales de vente disponibles sur demande ou sur notre site internet www.enedril.com.\n\n" +
  "The rental is from the day of departure from the base of origin until its return to the same place. Wear Charge " +
  "applies to all wear and tear related to normal use of equipment. In case of greater damage due to abnormal use, " +
  "the replacement value will be charged based on supporting documentation. Additional charges may apply for " +
  "packing tools intended for air or ocean shipment. General conditions of sale available upon request or on our " +
  "website www.enedril.com.";

export const AFFAIRE_STATUTS = [
  "Devis en préparation",
  "Devis envoyé",
  "Devis accepté",
  "Devis refusé",
  "En cours",
  "Terminée",
] as const;

export const DEVIS_STATUTS = ["Brouillon", "À confirmer", "Validé", "Envoyé", "Accepté", "Refusé"] as const;

export const TYPES_ACTIVITE = ["Fishing", "Directional Drilling", "Whipstocks", "Break-out", "Opérateur", "Autre"] as const;

export const TYPES_TRANSACTION = ["Location", "Vente"] as const;

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

export const TOOL_STATUTS = ["En stock", "Préparé", "Expédié", "Sur site", "Retour", "Maintenance", "Perdu (LIH)"] as const;

// Catalogue statut vocabulary: tracks where a physical tool actually is,
// independent of the Tool List statut of whichever affaire currently has it.
export const CATALOGUE_STATUTS = [
  "En stock",
  "Réservé",
  "Sur chantier",
  "En transit",
  "Retour à la base",
  "En attente d'inspection",
  "À recharger",
  "À rectifier",
  "Indisponible",
] as const;

// Tool List statut -> catalogue statut, applied automatically to any Tool
// List row linked to a real catalogue entry (outil_id set).
export const TOOL_STATUT_TO_CATALOGUE_STATUT: Record<string, string> = {
  "En stock": "Réservé",
  Préparé: "Réservé",
  Expédié: "En transit",
  "Sur site": "Sur chantier",
  Retour: "En attente d'inspection",
  Maintenance: "À rectifier",
  "Perdu (LIH)": "Indisponible",
};

export const TRANSPORT_CODES = ["Aller", "Retour", "Express", "Affrètement", "Coursier", "Exceptionnel", "Autre"] as const;

export const POINTAGE_CODES = ["MOB", "S", "O", "FOC", "DEMOB", "FIN", "LIH"] as const;

export const CATEGORIES_PERSONNEL = ["bureaux", "atelier", "chantier"] as const;

export const CATEGORIE_PERSONNEL_LABELS: Record<string, string> = {
  bureaux: "Bureaux",
  atelier: "Atelier",
  chantier: "Chantier",
};

export const ROLES = ["admin", "commercial", "atelier", "operateur"] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  commercial: "Commercial",
  atelier: "Atelier / Logistique",
  operateur: "Opérateur",
};
