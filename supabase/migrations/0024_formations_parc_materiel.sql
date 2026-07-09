-- Two new lightweight trackers, both write-restricted the same way as
-- employes/catalogue_outils already are:
--   formations: per-employé training/certification with an expiry date.
--   parc_materiel: internal equipment (service vehicles, forklifts, workshop
--   machines) — separate from catalogue_outils, which only tracks equipment
--   rented out to clients.
-- rappel_envoye on both is flipped to true by the daily cron reminder job
-- once a notification has gone out for the current expiry date, so the same
-- deadline doesn't spam a fresh notification every day; the update actions
-- reset it back to false whenever the date itself changes.
create table formations (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references employes (id) on delete cascade,
  intitule text not null,
  organisme text,
  date_obtention date,
  date_expiration date,
  notes text,
  rappel_envoye boolean not null default false,
  created_at timestamptz not null default now()
);

alter table formations enable row level security;
create policy "formations_select" on formations for select to authenticated using (true);
create policy "formations_write" on formations for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));

create table parc_materiel (
  id uuid primary key default gen_random_uuid(),
  categorie text not null default 'Véhicule',
  designation text not null,
  numero_identification text,
  statut text not null default 'Disponible',
  date_prochain_controle date,
  notes text,
  rappel_envoye boolean not null default false,
  created_at timestamptz not null default now()
);

alter table parc_materiel enable row level security;
create policy "parc_materiel_select" on parc_materiel for select to authenticated using (true);
create policy "parc_materiel_write" on parc_materiel for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
