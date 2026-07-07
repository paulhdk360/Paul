-- Enedril — Application de gestion des locations d'outillage
-- Schéma initial : profils/rôles, clients, catalogue, affaires, devis,
-- tool list, bons de livraison, service tickets (Enedril + Opérateur),
-- pointage calendrier, pièces jointes.

-- ---------------------------------------------------------------------------
-- Profils utilisateurs & rôles
-- ---------------------------------------------------------------------------
create type user_role as enum ('admin', 'commercial', 'atelier', 'operateur');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'operateur',
  created_at timestamptz not null default now()
);

create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'operateur' end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create function current_role_is(roles user_role[])
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = any(roles)
  );
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse_facturation text,
  contact_nom text,
  contact_email text,
  contact_tel text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalogue outils
-- ---------------------------------------------------------------------------
create type tool_disponibilite as enum ('Disponible', 'En location', 'Maintenance', 'Indisponible');

create table catalogue_outils (
  id uuid primary key default gen_random_uuid(),
  famille text,
  designation text not null,
  numero_article text,
  diametre text,
  connexion text,
  poids_kg numeric,
  dimensions text,
  photo_url text,
  fiche_technique_url text,
  prix_defaut numeric,
  disponibilite tool_disponibilite not null default 'Disponible',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Affaires (dossier regroupant devis, tool list, BL, service tickets)
-- ---------------------------------------------------------------------------
create type affaire_statut as enum (
  'Devis en préparation', 'Devis envoyé', 'Devis accepté', 'Devis refusé', 'En cours', 'Terminée'
);

create table affaires (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  client_id uuid references clients (id) on delete set null,
  chantier text,
  well_location text,
  statut affaire_statut not null default 'Devis en préparation',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Devis
-- ---------------------------------------------------------------------------
create type devis_statut as enum ('Brouillon', 'Envoyé', 'Accepté', 'Refusé');

create table devis (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references affaires (id) on delete cascade,
  reference text not null,
  version text not null default 'V0',
  date_creation date not null default current_date,
  validite_jours integer not null default 30,
  statut devis_statut not null default 'Brouillon',
  contact text,
  established_by text,
  incoterm text,
  payment_terms text,
  remarques_commerciales text,
  conditions_particulieres text,
  tva numeric not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type ligne_type as enum (
  'Operation', 'Stand By', 'Maintenance', 'Inspection', 'Restocking', 'Lost In Hole', 'Transport', 'Personnel', 'Serrage'
);

create table devis_lignes (
  id uuid primary key default gen_random_uuid(),
  devis_id uuid not null references devis (id) on delete cascade,
  ordre integer not null default 0,
  type ligne_type not null default 'Operation',
  designation text not null default '',
  outil_id uuid references catalogue_outils (id) on delete set null,
  quantite numeric not null default 1,
  prix_stand_by numeric,
  prix_operation numeric,
  prix_uc numeric,
  prix_lih numeric,
  prix_inspection numeric,
  prix_restocking numeric,
  prix_forfait numeric,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tool List (une ligne par unité physique d'équipement)
-- ---------------------------------------------------------------------------
create type tool_statut as enum ('En stock', 'Préparé', 'Expédié', 'Sur site', 'Retour', 'Maintenance');

create table bons_livraison (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references affaires (id) on delete cascade,
  numero_bl text not null,
  date date,
  transporteur text,
  po_transport text,
  delai_eta text,
  lieu_chargement text,
  lieu_livraison text,
  created_at timestamptz not null default now(),
  unique (affaire_id, numero_bl)
);

create table tool_list_items (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references affaires (id) on delete cascade,
  devis_ligne_id uuid references devis_lignes (id) on delete set null,
  item_index integer not null default 1,
  designation text not null default '',
  numero_serie text,
  proprietaire text,
  observations text,
  bl_id uuid references bons_livraison (id) on delete set null,
  statut tool_statut not null default 'En stock',
  poids_kg numeric,
  colisage text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Service Tickets (Enedril = interne avec prix ; Opérateur = même données
-- sans les colonnes commerciales, calculé côté application)
-- ---------------------------------------------------------------------------
create table service_tickets (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references affaires (id) on delete cascade,
  client_nom text,
  well_location text,
  operateur_nom text,
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);

create table service_ticket_personnel (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references service_tickets (id) on delete cascade,
  nom text not null,
  societe text,
  tarif_mob numeric,
  tarif_demob numeric,
  tarif_jour numeric,
  created_at timestamptz not null default now()
);

create type transport_code as enum ('Aller', 'Retour', 'Express', 'Affrètement', 'Coursier', 'Exceptionnel', 'Autre');

create table service_ticket_transport (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references service_tickets (id) on delete cascade,
  designation text not null default '',
  code transport_code not null default 'Autre',
  prix_unitaire numeric,
  bl_reference text,
  quantite numeric not null default 1,
  created_at timestamptz not null default now()
);

create type pointage_code as enum ('MOB', 'S', 'O', 'DEMOB', 'FIN');
create type pointage_entity as enum ('personnel', 'equipement');

create table service_ticket_days (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references service_tickets (id) on delete cascade,
  entity_type pointage_entity not null,
  entity_id uuid not null,
  date date not null,
  code pointage_code not null,
  unique (ticket_id, entity_type, entity_id, date)
);

-- ---------------------------------------------------------------------------
-- Pièces jointes (fiches techniques, photos, certificats...)
-- ---------------------------------------------------------------------------
create table attachments (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid references affaires (id) on delete cascade,
  link_type text not null,
  link_id uuid not null,
  nom text not null,
  type text,
  taille bigint,
  storage_path text not null,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
  on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table clients enable row level security;
alter table catalogue_outils enable row level security;
alter table affaires enable row level security;
alter table devis enable row level security;
alter table devis_lignes enable row level security;
alter table tool_list_items enable row level security;
alter table bons_livraison enable row level security;
alter table service_tickets enable row level security;
alter table service_ticket_personnel enable row level security;
alter table service_ticket_transport enable row level security;
alter table service_ticket_days enable row level security;
alter table attachments enable row level security;

-- profiles: everyone signed-in can read (needed for name lookups); only an
-- admin may change someone's role.
create policy "profiles_select_authenticated" on profiles for select to authenticated using (true);
create policy "profiles_update_admin" on profiles for update to authenticated
  using (current_role_is(array['admin']::user_role[]));

-- clients & catalogue: readable by everyone signed-in, writable by
-- commercial/atelier/admin (operateur is read-only everywhere).
create policy "clients_select" on clients for select to authenticated using (true);
create policy "clients_write" on clients for all to authenticated
  using (current_role_is(array['admin', 'commercial']::user_role[]))
  with check (current_role_is(array['admin', 'commercial']::user_role[]));

create policy "catalogue_select" on catalogue_outils for select to authenticated using (true);
create policy "catalogue_write" on catalogue_outils for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

-- affaires & devis: commercial/admin manage; atelier can read + update
-- (for tool list / BL work); opérateur read-only (prices hidden client-side).
create policy "affaires_select" on affaires for select to authenticated using (true);
create policy "affaires_write" on affaires for all to authenticated
  using (current_role_is(array['admin', 'commercial']::user_role[]))
  with check (current_role_is(array['admin', 'commercial']::user_role[]));

create policy "devis_select" on devis for select to authenticated using (true);
create policy "devis_write" on devis for all to authenticated
  using (current_role_is(array['admin', 'commercial']::user_role[]))
  with check (current_role_is(array['admin', 'commercial']::user_role[]));

create policy "devis_lignes_select" on devis_lignes for select to authenticated using (true);
create policy "devis_lignes_write" on devis_lignes for all to authenticated
  using (current_role_is(array['admin', 'commercial']::user_role[]))
  with check (current_role_is(array['admin', 'commercial']::user_role[]));

-- tool list & BL: commercial/atelier/admin can manage.
create policy "tool_list_select" on tool_list_items for select to authenticated using (true);
create policy "tool_list_write" on tool_list_items for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

create policy "bl_select" on bons_livraison for select to authenticated using (true);
create policy "bl_write" on bons_livraison for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

-- service tickets: commercial/atelier/admin can manage; opérateur can read
-- (their own client-facing view hides prices in the UI).
create policy "tickets_select" on service_tickets for select to authenticated using (true);
create policy "tickets_write" on service_tickets for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

create policy "tickets_personnel_select" on service_ticket_personnel for select to authenticated using (true);
create policy "tickets_personnel_write" on service_ticket_personnel for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

create policy "tickets_transport_select" on service_ticket_transport for select to authenticated using (true);
create policy "tickets_transport_write" on service_ticket_transport for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

create policy "tickets_days_select" on service_ticket_days for select to authenticated using (true);
create policy "tickets_days_write" on service_ticket_days for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

create policy "attachments_select" on attachments for select to authenticated using (true);
create policy "attachments_write" on attachments for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

create policy "attachments_storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'attachments');
create policy "attachments_storage_write" on storage.objects for all to authenticated
  using (bucket_id = 'attachments' and current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (bucket_id = 'attachments' and current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));
