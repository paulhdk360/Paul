-- BFE Pilotage — schéma MySQL/MariaDB
-- Compatible hébergement mutualisé OVH (Web Cloud Pro)

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(190) NOT NULL,
  adresse_facturation VARCHAR(255) DEFAULT NULL,
  telephone VARCHAR(30) DEFAULT NULL,
  email VARCHAR(190) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chantiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  adresse_chantier VARCHAR(255) DEFAULT NULL,
  ville VARCHAR(120) DEFAULT NULL,
  code_postal VARCHAR(10) DEFAULT NULL,
  type_projet VARCHAR(60) NOT NULL DEFAULT 'forage_eau', -- forage_eau | geothermie_sonde | geothermie_nappe | autre
  usage_eau VARCHAR(120) DEFAULT NULL,
  statut VARCHAR(30) NOT NULL DEFAULT 'prevu', -- prevu | en_cours | termine
  date_debut_prevue DATE DEFAULT NULL,
  date_fin_prevue DATE DEFAULT NULL,
  date_debut_reelle DATE DEFAULT NULL,
  date_fin_reelle DATE DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(40) NOT NULL UNIQUE, -- ex: BFE-DEV-2026-011
  chantier_id INT NOT NULL,
  date_devis DATE NOT NULL,
  version VARCHAR(10) NOT NULL DEFAULT 'V0',
  profondeur_min_m DECIMAL(6,2) DEFAULT NULL,
  profondeur_max_m DECIMAL(6,2) DEFAULT NULL,
  diametre_forage VARCHAR(60) DEFAULT NULL,
  tva_taux DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  acompte_pct DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  validite_jours INT NOT NULL DEFAULT 30,
  statut VARCHAR(30) NOT NULL DEFAULT 'brouillon', -- brouillon | envoye | accepte | refuse
  total_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chantier_id) REFERENCES chantiers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devis_lignes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  devis_id INT NOT NULL,
  numero INT NOT NULL,
  designation VARCHAR(500) NOT NULL,
  unite VARCHAR(20) NOT NULL DEFAULT 'forfait', -- forfait | h | m
  quantite DECIMAL(10,2) NOT NULL DEFAULT 1,
  prix_unitaire_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS factures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(40) NOT NULL UNIQUE, -- ex: BFE-FAC-2026-011
  devis_id INT DEFAULT NULL,
  chantier_id INT NOT NULL,
  date_facture DATE NOT NULL,
  profondeur_reelle_m DECIMAL(6,2) DEFAULT NULL, -- KPI : mètres forés réellement réalisés sur ce chantier
  tva_taux DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  statut VARCHAR(30) NOT NULL DEFAULT 'emise', -- emise | payee | retard
  total_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (devis_id) REFERENCES devis(id),
  FOREIGN KEY (chantier_id) REFERENCES chantiers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS facture_lignes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  facture_id INT NOT NULL,
  numero INT NOT NULL,
  designation VARCHAR(500) NOT NULL,
  unite VARCHAR(20) NOT NULL DEFAULT 'forfait',
  quantite DECIMAL(10,2) NOT NULL DEFAULT 1,
  prix_unitaire_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materiel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(190) NOT NULL,
  type VARCHAR(60) NOT NULL DEFAULT 'autre', -- foreuse | compresseur | pompe | vehicule | outillage | autre
  numero_serie VARCHAR(100) DEFAULT NULL,
  statut VARCHAR(30) NOT NULL DEFAULT 'disponible', -- disponible | affecte | en_maintenance | hors_service
  date_derniere_revision DATE DEFAULT NULL,
  periodicite_revision_mois INT DEFAULT NULL, -- ex : 6 -> révision tous les 6 mois
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chantier_materiel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chantier_id INT NOT NULL,
  materiel_id INT NOT NULL,
  date_affectation DATE NOT NULL DEFAULT (CURRENT_DATE),
  FOREIGN KEY (chantier_id) REFERENCES chantiers(id) ON DELETE CASCADE,
  FOREIGN KEY (materiel_id) REFERENCES materiel(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  materiel_id INT NOT NULL,
  date_maintenance DATE NOT NULL,
  type VARCHAR(60) NOT NULL DEFAULT 'revision', -- revision | reparation | controle
  description VARCHAR(500) DEFAULT NULL,
  cout DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (materiel_id) REFERENCES materiel(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS charges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(190) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'variable', -- fixe | variable
  montant DECIMAL(10,2) NOT NULL DEFAULT 0,
  date_charge DATE NOT NULL,
  chantier_id INT DEFAULT NULL, -- NULL = charge générale non affectée à un chantier précis
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chantier_id) REFERENCES chantiers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
