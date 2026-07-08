-- Billing engine fields, contacts, and RH planning module.

-- ---------------------------------------------------------------------------
-- Billing: dedicated Maintenance price + one-time-charge flags, "include in
-- Tool List" flag (hidden from the devis PDF), reference article, propriétaire
-- ---------------------------------------------------------------------------
alter table devis_lignes add column prix_maintenance numeric;
alter table devis_lignes add column reference_article text;
alter table devis_lignes add column proprietaire text;
alter table devis_lignes add column inclure_tool_list boolean not null default true;

alter table tool_list_items add column prix_maintenance numeric;
alter table tool_list_items add column reference_article text;
alter table tool_list_items add column maintenance_facturee boolean not null default false;
alter table tool_list_items add column inspection_facturee boolean not null default false;
alter table tool_list_items add column restocking_facture boolean not null default false;
alter table tool_list_items add column lih_facture boolean not null default false;

-- LIH is its own pointage code: it immediately stops day-counting for that
-- equipment (handled in application logic) and triggers a one-time flat
-- charge, independent of Stand By / Operation days.
alter type pointage_code add value if not exists 'LIH';
alter type tool_statut add value if not exists 'Perdu (LIH)';

-- ---------------------------------------------------------------------------
-- Clients: company-level fields + unlimited contacts per company
-- ---------------------------------------------------------------------------
alter table clients rename column nom to raison_sociale;
alter table clients rename column adresse_facturation to adresse;
alter table clients rename column contact_email to email_general;
alter table clients rename column contact_tel to telephone_general;
alter table clients add column pays text;
alter table clients add column numero_tva text;
-- contact_nom is superseded by the contacts table below; left in place
-- (unused by the app) rather than dropped, so no data is lost.

create table contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  nom text not null,
  prenom text,
  fonction text,
  telephone_fixe text,
  telephone_mobile text,
  email text,
  site_chantier text,
  observations text,
  created_at timestamptz not null default now()
);

alter table devis add column contact_id uuid references contacts (id) on delete set null;
alter table affaires add column contact_id uuid references contacts (id) on delete set null;

alter table contacts enable row level security;
create policy "contacts_select" on contacts for select to authenticated using (true);
create policy "contacts_write" on contacts for all to authenticated
  using (current_role_is(array['admin', 'commercial']::user_role[]))
  with check (current_role_is(array['admin', 'commercial']::user_role[]));

-- ---------------------------------------------------------------------------
-- RH: employees + configurable planning statuses + daily planning entries
-- ---------------------------------------------------------------------------
create type categorie_personnel as enum ('administratif', 'terrain');

create table employes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text,
  categorie categorie_personnel not null default 'terrain',
  fonction text,
  email text,
  telephone text,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create table planning_statuts (
  id uuid primary key default gen_random_uuid(),
  categorie categorie_personnel not null,
  libelle text not null,
  couleur text not null default '#1477C6',
  ordre integer not null default 0
);

insert into planning_statuts (categorie, libelle, couleur, ordre) values
  ('administratif', 'Présent', '#1C9A6C', 1),
  ('administratif', 'Congés', '#C98A1E', 2),
  ('administratif', 'RTT / Récupération', '#29ABE2', 3),
  ('administratif', 'Formation', '#8B5CF6', 4),
  ('administratif', 'Télétravail', '#0B2E6B', 5),
  ('administratif', 'Déplacement', '#1477C6', 6),
  ('administratif', 'Autre', '#5B6B85', 7),
  ('terrain', 'Sur chantier', '#1C9A6C', 1),
  ('terrain', 'En transit', '#1477C6', 2),
  ('terrain', 'Disponible', '#29ABE2', 3),
  ('terrain', 'Congés', '#C98A1E', 4),
  ('terrain', 'Formation', '#8B5CF6', 5),
  ('terrain', 'Atelier', '#0B2E6B', 6),
  ('terrain', 'Récupération', '#5EC3A4', 7),
  ('terrain', 'Arrêt maladie', '#D64545', 8),
  ('terrain', 'Autre', '#5B6B85', 9);

create table planning_entries (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references employes (id) on delete cascade,
  date date not null,
  statut text not null,
  affaire_id uuid references affaires (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (employe_id, date)
);

alter table employes enable row level security;
alter table planning_statuts enable row level security;
alter table planning_entries enable row level security;

create policy "employes_select" on employes for select to authenticated using (true);
create policy "employes_write" on employes for all to authenticated
  using (current_role_is(array['admin', 'commercial']::user_role[]))
  with check (current_role_is(array['admin', 'commercial']::user_role[]));

create policy "planning_statuts_select" on planning_statuts for select to authenticated using (true);
create policy "planning_statuts_write" on planning_statuts for all to authenticated
  using (current_role_is(array['admin']::user_role[]))
  with check (current_role_is(array['admin']::user_role[]));

create policy "planning_entries_select" on planning_entries for select to authenticated using (true);
create policy "planning_entries_write" on planning_entries for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));
