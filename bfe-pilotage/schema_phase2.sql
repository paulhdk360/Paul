-- BFE Pilotage — phase 2 : planning chantier, matériel, maintenance, charges, rentabilité

ALTER TABLE chantiers
  ADD COLUMN IF NOT EXISTS date_debut_prevue DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS date_fin_prevue DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS date_debut_reelle DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS date_fin_reelle DATE DEFAULT NULL;

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
