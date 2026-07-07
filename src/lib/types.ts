export type Role = "admin" | "commercial" | "atelier" | "operateur";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Client {
  id: string;
  nom: string;
  adresse_facturation: string | null;
  contact_nom: string | null;
  contact_email: string | null;
  contact_tel: string | null;
  created_at: string;
}

export interface CatalogueOutil {
  id: string;
  famille: string | null;
  designation: string;
  numero_article: string | null;
  diametre: string | null;
  connexion: string | null;
  poids_kg: number | null;
  dimensions: string | null;
  photo_url: string | null;
  fiche_technique_url: string | null;
  prix_defaut: number | null;
  disponibilite: "Disponible" | "En location" | "Maintenance" | "Indisponible";
  created_at: string;
}

export type AffaireStatut =
  | "Devis en préparation"
  | "Devis envoyé"
  | "Devis accepté"
  | "Devis refusé"
  | "En cours"
  | "Terminée";

export interface Affaire {
  id: string;
  reference: string;
  client_id: string | null;
  chantier: string | null;
  well_location: string | null;
  statut: AffaireStatut;
  created_at: string;
}

export type DevisStatut = "Brouillon" | "Envoyé" | "Accepté" | "Refusé";

export type LigneType =
  | "Operation"
  | "Stand By"
  | "Maintenance"
  | "Inspection"
  | "Restocking"
  | "Lost In Hole"
  | "Transport"
  | "Personnel"
  | "Serrage";

export interface Devis {
  id: string;
  affaire_id: string;
  reference: string;
  version: string;
  date_creation: string;
  validite_jours: number;
  statut: DevisStatut;
  contact: string | null;
  established_by: string | null;
  incoterm: string | null;
  payment_terms: string | null;
  remarques_commerciales: string | null;
  conditions_particulieres: string | null;
  tva: number;
  created_at: string;
  updated_at: string;
}

export interface DevisLigne {
  id: string;
  devis_id: string;
  ordre: number;
  type: LigneType;
  designation: string;
  outil_id: string | null;
  quantite: number;
  prix_stand_by: number | null;
  prix_operation: number | null;
  prix_uc: number | null;
  prix_lih: number | null;
  prix_inspection: number | null;
  prix_restocking: number | null;
  prix_forfait: number | null;
  created_at: string;
}

export type ToolStatut = "En stock" | "Préparé" | "Expédié" | "Sur site" | "Retour" | "Maintenance";

export interface ToolListItem {
  id: string;
  affaire_id: string;
  devis_ligne_id: string | null;
  item_index: number;
  designation: string;
  numero_serie: string | null;
  proprietaire: string | null;
  observations: string | null;
  bl_id: string | null;
  statut: ToolStatut;
  poids_kg: number | null;
  dimensions: string | null;
  colisage: string | null;
  prix_stand_by: number | null;
  prix_operation: number | null;
  prix_uc: number | null;
  prix_lih: number | null;
  prix_inspection: number | null;
  prix_restocking: number | null;
  created_at: string;
}

export interface BonLivraison {
  id: string;
  affaire_id: string;
  numero_bl: string;
  date: string | null;
  transporteur: string | null;
  po_transport: string | null;
  delai_eta: string | null;
  lieu_chargement: string | null;
  lieu_livraison: string | null;
  created_at: string;
}

export interface ServiceTicket {
  id: string;
  affaire_id: string;
  client_nom: string | null;
  well_location: string | null;
  operateur_nom: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface ServiceTicketPersonnel {
  id: string;
  ticket_id: string;
  nom: string;
  societe: string | null;
  tarif_mob: number | null;
  tarif_demob: number | null;
  tarif_jour: number | null;
  created_at: string;
}

export type TransportCode = "Aller" | "Retour" | "Express" | "Affrètement" | "Coursier" | "Exceptionnel" | "Autre";

export interface ServiceTicketTransport {
  id: string;
  ticket_id: string;
  designation: string;
  code: TransportCode;
  prix_unitaire: number | null;
  bl_reference: string | null;
  quantite: number;
  created_at: string;
}

export type PointageCode = "MOB" | "S" | "O" | "DEMOB" | "FIN";

export interface ServiceTicketDay {
  id: string;
  ticket_id: string;
  entity_type: "personnel" | "equipement";
  entity_id: string;
  date: string;
  code: PointageCode;
}

export interface Attachment {
  id: string;
  affaire_id: string;
  link_type: string;
  link_id: string;
  nom: string;
  type: string | null;
  taille: number | null;
  storage_path: string;
  created_at: string;
}
