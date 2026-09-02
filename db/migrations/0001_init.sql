-- Football Team Manager — schéma initial (Neon / PostgreSQL standard)
-- A exécuter dans la console SQL de ton projet Neon (ou via psql).
--
-- Contrairement à la version Supabase précédente, l'autorisation n'est pas
-- gérée par des policies Row Level Security : chaque action serveur vérifie
-- explicitement l'appartenance au club (voir lib/auth-helpers.ts). Les
-- comptes utilisateurs et mots de passe sont stockés directement ici (table
-- `users`), gérés par Auth.js — il n'y a plus de schéma `auth` fourni par un
-- tiers.

create extension if not exists pgcrypto;

-- ==========================================================================
-- Types
-- ==========================================================================

create type user_role as enum (
  'club_admin', 'dirigeant', 'head_coach', 'coach',
  'medical', 'equipment_manager', 'player', 'parent'
);

create type license_status as enum ('valid', 'pending', 'expired', 'missing');

create type player_status as enum (
  'active', 'trial', 'injured', 'limited', 'unavailable',
  'suspended', 'inactive', 'archived'
);

create type event_type as enum (
  'training', 'match', 'tournament', 'staff_meeting', 'player_meeting',
  'video_session', 'fitness_test', 'travel', 'club_event',
  'admin_deadline', 'individual_meeting'
);

create type event_status as enum ('scheduled', 'confirmed', 'cancelled', 'completed');

create type availability_status as enum ('present', 'absent', 'uncertain', 'late', 'partial');

create type attendance_status as enum (
  'present', 'absent_justified', 'absent_unjustified',
  'late', 'left_early', 'injured', 'observer', 'exempted'
);

create type convocation_player_status as enum ('selected', 'waiting');

create type convocation_response as enum ('pending', 'accepted', 'declined', 'uncertain');

-- ==========================================================================
-- Comptes utilisateurs (remplace profiles + auth.users de Supabase)
-- ==========================================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- Clubs
-- ==========================================================================

create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  address text,
  phone text,
  email text,
  website text,
  affiliation_number text,
  primary_color text,
  timezone text not null default 'Europe/Paris',
  language text not null default 'fr',
  currency text not null default 'EUR',
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

create table club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role user_role not null,
  position_group text,
  created_at timestamptz not null default now(),
  unique (club_id, user_id, role)
);

create index club_members_user_idx on club_members (user_id);
create index club_members_club_idx on club_members (club_id);

-- ==========================================================================
-- Saisons
-- ==========================================================================

create table seasons (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create index seasons_club_idx on seasons (club_id);

-- ==========================================================================
-- Equipes et groupes internes
-- ==========================================================================

create table teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  season_id uuid references seasons (id) on delete set null,
  name text not null,
  category text,
  level text,
  color text,
  head_coach_id uuid references users (id),
  created_at timestamptz not null default now()
);

create index teams_club_idx on teams (club_id);
create index teams_season_idx on teams (season_id);

create table team_groups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- Joueurs
-- ==========================================================================

create table players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  team_id uuid references teams (id) on delete set null,
  user_id uuid references users (id) on delete set null,
  photo_url text,
  first_name text not null,
  last_name text not null,
  birth_date date,
  gender text,
  address text,
  phone text,
  email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  legal_guardian_name text,
  legal_guardian_email text,
  legal_guardian_phone text,
  license_number text,
  license_status license_status not null default 'missing',
  primary_position text,
  secondary_positions text[] not null default '{}',
  jersey_number integer,
  height_cm integer,
  weight_kg numeric(5, 2),
  dominant_side text,
  arrival_date date,
  sport_status player_status not null default 'active',
  admin_status text,
  notes text,
  created_at timestamptz not null default now()
);

create index players_club_idx on players (club_id);
create index players_team_idx on players (team_id);
create index players_user_idx on players (user_id);

create table player_team_groups (
  player_id uuid not null references players (id) on delete cascade,
  team_group_id uuid not null references team_groups (id) on delete cascade,
  primary key (player_id, team_group_id)
);

-- ==========================================================================
-- Staff
-- ==========================================================================

create table staff_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  user_id uuid references users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  role_title text,
  certifications text,
  created_at timestamptz not null default now()
);

create index staff_club_idx on staff_members (club_id);

create table staff_team_assignments (
  staff_id uuid not null references staff_members (id) on delete cascade,
  team_id uuid not null references teams (id) on delete cascade,
  role_in_team text,
  primary key (staff_id, team_id)
);

-- ==========================================================================
-- Calendrier / evenements
-- ==========================================================================

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  team_id uuid references teams (id) on delete cascade,
  type event_type not null,
  title text not null,
  description text,
  location text,
  address text,
  start_at timestamptz not null,
  end_at timestamptz,
  meeting_at timestamptz,
  status event_status not null default 'scheduled',
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

create index calendar_events_club_idx on calendar_events (club_id);
create index calendar_events_team_idx on calendar_events (team_id);
create index calendar_events_start_idx on calendar_events (start_at);

create table trainings (
  event_id uuid primary key references calendar_events (id) on delete cascade,
  objective text,
  weather text,
  notes text
);

create table training_drills (
  id uuid primary key default gen_random_uuid(),
  training_event_id uuid not null references trainings (event_id) on delete cascade,
  position integer not null default 0,
  title text not null,
  objective text,
  duration_minutes integer,
  group_name text,
  responsible_staff_id uuid references staff_members (id),
  description text,
  equipment text
);

create index training_drills_training_idx on training_drills (training_event_id);

-- ==========================================================================
-- Disponibilites et presences
-- ==========================================================================

create table availabilities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references calendar_events (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  status availability_status not null,
  comment text,
  responded_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create table attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references calendar_events (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  status attendance_status not null,
  notes text,
  recorded_by uuid references users (id),
  recorded_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create index availabilities_event_idx on availabilities (event_id);
create index attendances_event_idx on attendances (event_id);

-- ==========================================================================
-- Convocations
-- ==========================================================================

create table convocations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  event_id uuid not null references calendar_events (id) on delete cascade,
  team_id uuid references teams (id) on delete set null,
  instructions text,
  response_deadline timestamptz,
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

create table convocation_players (
  id uuid primary key default gen_random_uuid(),
  convocation_id uuid not null references convocations (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  status convocation_player_status not null default 'selected',
  response convocation_response not null default 'pending',
  response_comment text,
  responded_at timestamptz,
  unique (convocation_id, player_id)
);

create index convocation_players_convocation_idx on convocation_players (convocation_id);

-- ==========================================================================
-- Notifications in-app
-- ==========================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, read_at);
