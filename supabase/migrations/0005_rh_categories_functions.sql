-- Replace the 2-way categorie_personnel split (administratif/terrain) with
-- the 3 real-world locations Enedril organizes personnel by.
create type categorie_personnel_new as enum ('bureaux', 'atelier', 'chantier');

alter table employes
  alter column categorie type categorie_personnel_new
  using (case categorie::text when 'administratif' then 'bureaux' else 'chantier' end::categorie_personnel_new);
alter table employes alter column categorie set default 'chantier';

alter table planning_statuts
  alter column categorie type categorie_personnel_new
  using (case categorie::text when 'administratif' then 'bureaux' else 'chantier' end::categorie_personnel_new);

drop type categorie_personnel;
alter type categorie_personnel_new rename to categorie_personnel;

-- Reseed the statuses for the 3 categories (the whole taxonomy changes, so
-- prior seed rows are cleared; any planning_entries referencing an old
-- libellé simply lose their color-coding, no data is deleted).
delete from planning_statuts;

insert into planning_statuts (categorie, libelle, couleur, ordre) values
  ('bureaux', 'Présent', '#1C9A6C', 1),
  ('bureaux', 'Congés', '#C98A1E', 2),
  ('bureaux', 'RTT / Récupération', '#29ABE2', 3),
  ('bureaux', 'Formation', '#8B5CF6', 4),
  ('bureaux', 'Télétravail', '#0B2E6B', 5),
  ('bureaux', 'Déplacement', '#1477C6', 6),
  ('bureaux', 'Autre', '#5B6B85', 7),
  ('atelier', 'Présent', '#1C9A6C', 1),
  ('atelier', 'Congés', '#C98A1E', 2),
  ('atelier', 'RTT / Récupération', '#29ABE2', 3),
  ('atelier', 'Formation', '#8B5CF6', 4),
  ('atelier', 'Récupération', '#5EC3A4', 5),
  ('atelier', 'Arrêt maladie', '#D64545', 6),
  ('atelier', 'Autre', '#5B6B85', 7),
  ('chantier', 'Sur chantier', '#1C9A6C', 1),
  ('chantier', 'En transit', '#1477C6', 2),
  ('chantier', 'Disponible', '#29ABE2', 3),
  ('chantier', 'Congés', '#C98A1E', 4),
  ('chantier', 'Formation', '#8B5CF6', 5),
  ('chantier', 'Récupération', '#5EC3A4', 6),
  ('chantier', 'Arrêt maladie', '#D64545', 7),
  ('chantier', 'Autre', '#5B6B85', 8);
