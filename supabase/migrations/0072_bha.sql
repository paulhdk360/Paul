create table bha_compositions (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  client text,
  well text,
  job_no text,
  date date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table bha_items (
  id uuid primary key default gen_random_uuid(),
  bha_id uuid not null references bha_compositions(id) on delete cascade,
  ordre integer not null default 0,
  outil_id uuid references catalogue_outils(id) on delete set null,
  designation text not null,
  quantite numeric not null default 1,
  longueur text,
  od text,
  id_int text,
  connexion text,
  numero_serie text,
  torque text,
  created_at timestamptz not null default now()
);

alter table bha_compositions enable row level security;
alter table bha_items enable row level security;

create policy "bha_compositions_select" on bha_compositions for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
create policy "bha_compositions_write" on bha_compositions for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

create policy "bha_items_select" on bha_items for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
create policy "bha_items_write" on bha_items for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
