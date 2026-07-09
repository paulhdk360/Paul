-- Where a piece of internal equipment (service vehicle, forklift, workshop
-- machine) currently is: at the base, out on a chantier (and which affaire),
-- or at the garage for repair — separate from statut (Disponible/En
-- panne/...), which only tracks its condition, not its location.
alter table parc_materiel add column localisation text not null default 'À la base';
alter table parc_materiel add column affaire_id uuid references affaires (id) on delete set null;
