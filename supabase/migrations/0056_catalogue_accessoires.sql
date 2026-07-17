-- Lets a catalogue reference declare which other catalogue references
-- should automatically be added alongside it whenever it's linked into a
-- devis or the Tool List — e.g. a Moteur's power section (Rotor + Stator),
-- which get their own serial numbers and are tracked independently even
-- though they're priced as part of the Moteur's own line, never billed
-- separately (hence no price columns here).
create table catalogue_accessoires (
  id uuid primary key default gen_random_uuid(),
  outil_id uuid not null references catalogue_outils (id) on delete cascade,
  accessoire_id uuid not null references catalogue_outils (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (outil_id, accessoire_id),
  check (outil_id <> accessoire_id)
);

create index if not exists idx_catalogue_accessoires_outil_id on catalogue_accessoires (outil_id);

alter table catalogue_accessoires enable row level security;

create policy "catalogue_accessoires_select" on catalogue_accessoires for select to authenticated using (true);
create policy "catalogue_accessoires_write" on catalogue_accessoires for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
