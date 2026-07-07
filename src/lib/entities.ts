export type FieldType = "text" | "number" | "select" | "date" | "textarea";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  optionsFrom?: "foreuses" | "equipes" | "chantiers";
  optional?: boolean;
}

export interface EntityConfig {
  table: string;
  label: string;
  labelPlural: string;
  attachments?: boolean;
  fields: FieldConfig[];
  columns: string[];
}

export const ENTITY_CONFIG: Record<string, EntityConfig> = {
  foreuses: {
    table: "foreuses",
    label: "Foreuse",
    labelPlural: "Foreuses",
    fields: [
      { key: "nom", label: "Nom / référence", type: "text" },
      { key: "statut", label: "Statut", type: "select", options: ["Disponible", "En service", "Maintenance"] },
      { key: "localisation", label: "Localisation actuelle", type: "text" },
      { key: "heures_moteur", label: "Heures moteur", type: "number" },
      { key: "prochaine_maintenance", label: "Prochaine maintenance", type: "date" },
      { key: "cout_horaire", label: "Coût horaire (€)", type: "number" },
    ],
    columns: ["nom", "statut", "localisation", "heures_moteur", "prochaine_maintenance", "cout_horaire"],
  },
  equipes: {
    table: "equipes",
    label: "Équipe",
    labelPlural: "Équipes",
    fields: [
      { key: "nom", label: "Nom de l'équipe", type: "text" },
      { key: "chef", label: "Chef d'équipe", type: "text" },
      { key: "membres", label: "Foreurs (séparés par des virgules)", type: "text" },
      { key: "habilitations", label: "Habilitations", type: "text" },
      { key: "disponibilite", label: "Disponibilité", type: "select", options: ["Disponible", "En mission", "Congé"] },
    ],
    columns: ["nom", "chef", "membres", "habilitations", "disponibilite"],
  },
  chantiers: {
    table: "chantiers",
    label: "Chantier",
    labelPlural: "Chantiers",
    attachments: true,
    fields: [
      { key: "nom", label: "Nom du chantier", type: "text" },
      { key: "client", label: "Client", type: "text" },
      { key: "adresse", label: "Adresse", type: "text" },
      { key: "statut", label: "Statut", type: "select", options: ["À venir", "En cours", "Terminé"] },
      { key: "foreuse_id", label: "Foreuse affectée", type: "select", optionsFrom: "foreuses", optional: true },
      { key: "equipe_id", label: "Équipe affectée", type: "select", optionsFrom: "equipes", optional: true },
      { key: "profondeur_prevue", label: "Profondeur prévue (m)", type: "number" },
      { key: "profondeur_foree", label: "Profondeur forée (m)", type: "number" },
      { key: "materiel_necessaire", label: "Matériel nécessaire (tubages, crépines, sondes...)", type: "text" },
      { key: "montant_devis", label: "Montant devis (€)", type: "number" },
      { key: "cout_reel", label: "Coût réel (€)", type: "number" },
      { key: "date_debut", label: "Date de début", type: "date" },
      { key: "date_fin", label: "Date de fin prévue", type: "date" },
    ],
    columns: ["nom", "client", "statut", "foreuse_id", "equipe_id", "profondeur_foree", "montant_devis", "date_debut", "date_fin"],
  },
  factures: {
    table: "factures",
    label: "Facture",
    labelPlural: "Factures",
    fields: [
      { key: "chantier_id", label: "Chantier", type: "select", optionsFrom: "chantiers", optional: true },
      { key: "montant", label: "Montant (€)", type: "number" },
      { key: "statut", label: "Statut", type: "select", options: ["Émise", "Payée", "En retard"] },
      { key: "date_emission", label: "Date d'émission", type: "date" },
      { key: "date_echeance", label: "Date d'échéance", type: "date" },
    ],
    columns: ["chantier_id", "montant", "statut", "date_emission", "date_echeance"],
  },
  achats: {
    table: "achats",
    label: "Achat",
    labelPlural: "Achats",
    attachments: true,
    fields: [
      { key: "date", label: "Date d'achat", type: "date" },
      { key: "fournisseur", label: "Fournisseur", type: "text" },
      {
        key: "categorie",
        label: "Catégorie",
        type: "select",
        options: ["Matériel de forage", "Consommables", "Carburant", "Outillage", "Pièces détachées", "Autre"],
      },
      { key: "designation", label: "Désignation", type: "text" },
      { key: "quantite", label: "Quantité", type: "number" },
      { key: "montant", label: "Montant (€)", type: "number" },
      { key: "chantier_id", label: "Chantier lié (facultatif)", type: "select", optionsFrom: "chantiers", optional: true },
    ],
    columns: ["date", "fournisseur", "categorie", "designation", "montant", "chantier_id"],
  },
  maintenances: {
    table: "maintenances",
    label: "Intervention",
    labelPlural: "Maintenance",
    attachments: true,
    fields: [
      { key: "foreuse_id", label: "Foreuse", type: "select", optionsFrom: "foreuses" },
      { key: "date", label: "Date d'intervention", type: "date" },
      {
        key: "type",
        label: "Type d'intervention",
        type: "select",
        options: ["Préventive", "Corrective", "Révision", "Contrôle réglementaire"],
      },
      { key: "description", label: "Description", type: "text" },
      { key: "cout", label: "Coût (€)", type: "number" },
      { key: "heures_moteur", label: "Heures moteur à l'intervention", type: "number" },
    ],
    columns: ["date", "foreuse_id", "type", "description", "cout", "heures_moteur"],
  },
};
