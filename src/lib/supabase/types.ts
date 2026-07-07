export type DevisLigne = {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "user";
  created_at: string;
};

export type Foreuse = {
  id: string;
  nom: string;
  statut: "Disponible" | "En service" | "Maintenance";
  localisation: string | null;
  heures_moteur: number;
  prochaine_maintenance: string | null;
  cout_horaire: number;
  created_at: string;
  updated_at: string;
};

export type Equipe = {
  id: string;
  nom: string;
  chef: string | null;
  membres: string | null;
  habilitations: string | null;
  disponibilite: "Disponible" | "En mission" | "Congé";
  created_at: string;
  updated_at: string;
};

export type Chantier = {
  id: string;
  nom: string;
  client: string | null;
  adresse: string | null;
  statut: "À venir" | "En cours" | "Terminé";
  foreuse_id: string | null;
  equipe_id: string | null;
  profondeur_prevue: number;
  profondeur_foree: number;
  materiel_necessaire: string | null;
  montant_devis: number;
  cout_reel: number;
  date_debut: string | null;
  date_fin: string | null;
  created_at: string;
  updated_at: string;
};

export type Devis = {
  id: string;
  reference: string;
  version: string;
  client: string | null;
  objet: string | null;
  type_activite: string;
  statut: "Brouillon" | "Envoyé" | "Relancé" | "Accepté" | "Refusé";
  tva: number;
  date_creation: string;
  date_envoi: string | null;
  date_relance: string | null;
  date_reponse: string | null;
  client_adresse_facturation: string | null;
  contact_chantier: string | null;
  adresse_chantier: string | null;
  references_cadastrales: string | null;
  usage_prevu: string | null;
  type_ouvrage: string | null;
  profondeur_previsionnelle: string | null;
  diametre_forage: string | null;
  tubage_prevu: string | null;
  crepines: string | null;
  massif_filtrant: string | null;
  cimentation_annulaire: string | null;
  essais_prevus: string | null;
  objet_texte: string | null;
  prestations_incluses: string | null;
  limites_exclusions: string | null;
  acompte_pct: number;
  validite_jours: number;
  chantier_genere_id: string | null;
  lignes: DevisLigne[];
  created_at: string;
  updated_at: string;
};

export type Facture = {
  id: string;
  chantier_id: string | null;
  montant: number;
  statut: "Émise" | "Payée" | "En retard";
  date_emission: string | null;
  date_echeance: string | null;
  created_at: string;
  updated_at: string;
};

export type Achat = {
  id: string;
  date: string;
  fournisseur: string | null;
  categorie: string;
  designation: string | null;
  quantite: number;
  montant: number;
  chantier_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Maintenance = {
  id: string;
  foreuse_id: string | null;
  date: string;
  type: string;
  description: string | null;
  cout: number;
  heures_moteur: number;
  created_at: string;
  updated_at: string;
};

export type Attachment = {
  id: string;
  link_type: "chantiers" | "devis" | "achats" | "maintenances";
  link_id: string;
  nom: string;
  type: string | null;
  taille: number;
  storage_path: string;
  date_ajout: string;
  created_by: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      foreuses: {
        Row: Foreuse;
        Insert: Partial<Foreuse>;
        Update: Partial<Foreuse>;
      };
      equipes: { Row: Equipe; Insert: Partial<Equipe>; Update: Partial<Equipe> };
      chantiers: {
        Row: Chantier;
        Insert: Partial<Chantier>;
        Update: Partial<Chantier>;
      };
      devis: { Row: Devis; Insert: Partial<Devis>; Update: Partial<Devis> };
      factures: {
        Row: Facture;
        Insert: Partial<Facture>;
        Update: Partial<Facture>;
      };
      achats: { Row: Achat; Insert: Partial<Achat>; Update: Partial<Achat> };
      maintenances: {
        Row: Maintenance;
        Insert: Partial<Maintenance>;
        Update: Partial<Maintenance>;
      };
      attachments: {
        Row: Attachment;
        Insert: Partial<Attachment>;
        Update: Partial<Attachment>;
      };
    };
  };
};
