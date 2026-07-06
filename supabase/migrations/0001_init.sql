-- Béarn Forage Énergie — schéma initial
-- Reprend le modèle de données du prototype (bearn-forage-pilotage.html)
-- avec des clés étrangères UUID à la place des références par nom.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES (rôle utilisateur / administrateur)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'user' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- FOREUSES
-- ---------------------------------------------------------------------------
create table public.foreuses (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  statut text not null default 'Disponible' check (statut in ('Disponible', 'En service', 'Maintenance')),
  localisation text,
  heures_moteur numeric not null default 0,
  prochaine_maintenance date,
  cout_horaire numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_foreuses_updated_at before update on public.foreuses
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ÉQUIPES
-- ---------------------------------------------------------------------------
create table public.equipes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  chef text,
  membres text,
  habilitations text,
  disponibilite text not null default 'Disponible' check (disponibilite in ('Disponible', 'En mission', 'Congé')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_equipes_updated_at before update on public.equipes
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- CHANTIERS
-- ---------------------------------------------------------------------------
create table public.chantiers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  client text,
  adresse text,
  statut text not null default 'À venir' check (statut in ('À venir', 'En cours', 'Terminé')),
  foreuse_id uuid references public.foreuses (id) on delete set null,
  equipe_id uuid references public.equipes (id) on delete set null,
  profondeur_prevue numeric not null default 0,
  profondeur_foree numeric not null default 0,
  materiel_necessaire text,
  montant_devis numeric not null default 0,
  cout_reel numeric not null default 0,
  date_debut date,
  date_fin date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_chantiers_updated_at before update on public.chantiers
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- DEVIS (les lignes de prestations sont stockées en JSONB, comme dans le prototype)
-- ---------------------------------------------------------------------------
create table public.devis (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  version text not null default 'V0',
  client text,
  objet text,
  type_activite text not null default 'Forage géothermique',
  statut text not null default 'Brouillon' check (statut in ('Brouillon', 'Envoyé', 'Relancé', 'Accepté', 'Refusé')),
  tva numeric not null default 10,
  date_creation date not null default current_date,
  date_envoi date,
  date_relance date,
  date_reponse date,
  client_adresse_facturation text,
  contact_chantier text,
  adresse_chantier text,
  references_cadastrales text,
  usage_prevu text,
  type_ouvrage text,
  profondeur_previsionnelle text,
  diametre_forage text,
  tubage_prevu text,
  crepines text,
  massif_filtrant text,
  cimentation_annulaire text,
  essais_prevus text,
  objet_texte text,
  prestations_incluses text,
  limites_exclusions text,
  acompte_pct numeric not null default 30,
  validite_jours integer not null default 30,
  chantier_genere_id uuid references public.chantiers (id) on delete set null,
  lignes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_devis_updated_at before update on public.devis
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- FACTURES
-- ---------------------------------------------------------------------------
create table public.factures (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid references public.chantiers (id) on delete set null,
  montant numeric not null default 0,
  statut text not null default 'Émise' check (statut in ('Émise', 'Payée', 'En retard')),
  date_emission date,
  date_echeance date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_factures_updated_at before update on public.factures
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ACHATS
-- ---------------------------------------------------------------------------
create table public.achats (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  fournisseur text,
  categorie text not null default 'Autre' check (
    categorie in ('Matériel de forage', 'Consommables', 'Carburant', 'Outillage', 'Pièces détachées', 'Autre')
  ),
  designation text,
  quantite numeric not null default 0,
  montant numeric not null default 0,
  chantier_id uuid references public.chantiers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_achats_updated_at before update on public.achats
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- MAINTENANCES
-- ---------------------------------------------------------------------------
create table public.maintenances (
  id uuid primary key default gen_random_uuid(),
  foreuse_id uuid references public.foreuses (id) on delete set null,
  date date not null default current_date,
  type text not null default 'Préventive' check (
    type in ('Préventive', 'Corrective', 'Révision', 'Contrôle réglementaire')
  ),
  description text,
  cout numeric not null default 0,
  heures_moteur numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_maintenances_updated_at before update on public.maintenances
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- PIÈCES JOINTES (métadonnées ; le fichier lui-même est dans Supabase Storage)
-- ---------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  link_type text not null check (link_type in ('chantiers', 'devis', 'achats', 'maintenances')),
  link_id uuid not null,
  nom text not null,
  type text,
  taille bigint not null default 0,
  storage_path text not null,
  date_ajout date not null default current_date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index attachments_link_idx on public.attachments (link_type, link_id);

-- ---------------------------------------------------------------------------
-- RLS — application collaborative interne : tout utilisateur authentifié
-- (compte créé par un administrateur) peut lire/écrire les données métier.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.foreuses enable row level security;
alter table public.equipes enable row level security;
alter table public.chantiers enable row level security;
alter table public.devis enable row level security;
alter table public.factures enable row level security;
alter table public.achats enable row level security;
alter table public.maintenances enable row level security;
alter table public.attachments enable row level security;

create policy "profiles: lecture par tout utilisateur authentifié" on public.profiles
  for select to authenticated using (true);
create policy "profiles: mise à jour de son propre profil" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "profiles: un administrateur peut tout mettre à jour" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "foreuses: accès complet aux utilisateurs authentifiés" on public.foreuses
  for all to authenticated using (true) with check (true);
create policy "equipes: accès complet aux utilisateurs authentifiés" on public.equipes
  for all to authenticated using (true) with check (true);
create policy "chantiers: accès complet aux utilisateurs authentifiés" on public.chantiers
  for all to authenticated using (true) with check (true);
create policy "devis: accès complet aux utilisateurs authentifiés" on public.devis
  for all to authenticated using (true) with check (true);
create policy "factures: accès complet aux utilisateurs authentifiés" on public.factures
  for all to authenticated using (true) with check (true);
create policy "achats: accès complet aux utilisateurs authentifiés" on public.achats
  for all to authenticated using (true) with check (true);
create policy "maintenances: accès complet aux utilisateurs authentifiés" on public.maintenances
  for all to authenticated using (true) with check (true);
create policy "attachments: accès complet aux utilisateurs authentifiés" on public.attachments
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- STORAGE — bucket privé pour les documents joints
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments storage: lecture authentifiée"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments');
create policy "attachments storage: dépôt authentifié"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments');
create policy "attachments storage: suppression authentifiée"
  on storage.objects for delete to authenticated
  using (bucket_id = 'attachments');
