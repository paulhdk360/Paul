-- Football Team Manager — schema initial (MVP, Priorité 1 du cahier des charges)
-- A executer dans l'editeur SQL du projet Supabase.

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
-- Profils utilisateurs (1:1 avec auth.users)
-- ==========================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
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
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- Rattachement d'un utilisateur a un club avec un role. Un utilisateur peut
-- appartenir a plusieurs clubs, et cumuler plusieurs roles dans un meme club
-- (ex: coach + responsable materiel).
create table club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
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
  category text, -- U12, U14, U17, U20, senior, feminin, flag...
  level text,
  color text,
  head_coach_id uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index teams_club_idx on teams (club_id);
create index teams_season_idx on teams (season_id);

create table team_groups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  name text not null, -- attaque, defense, equipes speciales, titulaires...
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- Joueurs
-- ==========================================================================

create table players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  team_id uuid references teams (id) on delete set null,
  user_id uuid references profiles (id) on delete set null,
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
  user_id uuid references profiles (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  role_title text, -- head coach, coordinateur offensif, medical, materiel...
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
  meeting_at timestamptz, -- heure de rendez-vous, si differente du debut
  status event_status not null default 'scheduled',
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index calendar_events_club_idx on calendar_events (club_id);
create index calendar_events_team_idx on calendar_events (team_id);
create index calendar_events_start_idx on calendar_events (start_at);

-- Extension "entrainement" d'un evenement de type training
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
-- Disponibilites (declarees par le joueur) et presences (constatees par le staff)
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
  recorded_by uuid references profiles (id),
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
  created_by uuid references profiles (id),
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
  user_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, read_at);

-- ==========================================================================
-- Fonctions utilitaires pour les policies RLS
-- ==========================================================================

create or replace function is_club_member(target_club_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from club_members
    where club_id = target_club_id and user_id = auth.uid()
  );
$$;

create or replace function has_club_role(target_club_id uuid, roles user_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from club_members
    where club_id = target_club_id
      and user_id = auth.uid()
      and role = any(roles)
  );
$$;

-- Un membre est "staff" (droits d'ecriture larges) s'il a l'un de ces roles.
create or replace function is_club_staff(target_club_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select has_club_role(
    target_club_id,
    array['club_admin', 'dirigeant', 'head_coach', 'coach']::user_role[]
  );
$$;

-- ==========================================================================
-- Row Level Security
-- ==========================================================================

alter table profiles enable row level security;
alter table clubs enable row level security;
alter table club_members enable row level security;
alter table seasons enable row level security;
alter table teams enable row level security;
alter table team_groups enable row level security;
alter table players enable row level security;
alter table player_team_groups enable row level security;
alter table staff_members enable row level security;
alter table staff_team_assignments enable row level security;
alter table calendar_events enable row level security;
alter table trainings enable row level security;
alter table training_drills enable row level security;
alter table availabilities enable row level security;
alter table attendances enable row level security;
alter table convocations enable row level security;
alter table convocation_players enable row level security;
alter table notifications enable row level security;

-- Profiles : chacun voit/modifie son propre profil ; un membre de club peut
-- voir les profils des autres membres du meme club.
create policy "profiles_self" on profiles for select using (id = auth.uid());
create policy "profiles_update_self" on profiles for update using (id = auth.uid());
create policy "profiles_insert_self" on profiles for insert with check (id = auth.uid());
create policy "profiles_club_visibility" on profiles for select using (
  exists (
    select 1 from club_members cm1
    join club_members cm2 on cm1.club_id = cm2.club_id
    where cm1.user_id = auth.uid() and cm2.user_id = profiles.id
  )
);

-- Clubs : visibles par leurs membres. Creation libre (le createur devient
-- automatiquement club_admin via l'action serveur applicative).
create policy "clubs_select_members" on clubs for select using (is_club_member(id));
create policy "clubs_insert_authenticated" on clubs for insert with check (auth.uid() is not null);
create policy "clubs_update_admin" on clubs for update using (
  has_club_role(id, array['club_admin']::user_role[])
);

-- club_members : visibles par les membres du club ; geres par les admins du club.
create policy "club_members_select" on club_members for select using (is_club_member(club_id));
create policy "club_members_insert_admin" on club_members for insert with check (
  has_club_role(club_id, array['club_admin']::user_role[])
  or not exists (select 1 from club_members where club_id = club_members.club_id)
);
create policy "club_members_update_admin" on club_members for update using (
  has_club_role(club_id, array['club_admin']::user_role[])
);
create policy "club_members_delete_admin" on club_members for delete using (
  has_club_role(club_id, array['club_admin']::user_role[])
);

-- Regle generique reutilisee pour la plupart des tables rattachees a un club :
-- lecture par tout membre du club, ecriture reservee au staff (admin, dirigeant,
-- head coach, coach).

create policy "seasons_select" on seasons for select using (is_club_member(club_id));
create policy "seasons_write" on seasons for all using (is_club_staff(club_id)) with check (is_club_staff(club_id));

create policy "teams_select" on teams for select using (is_club_member(club_id));
create policy "teams_write" on teams for all using (is_club_staff(club_id)) with check (is_club_staff(club_id));

create policy "team_groups_select" on team_groups for select using (
  exists (select 1 from teams where teams.id = team_groups.team_id and is_club_member(teams.club_id))
);
create policy "team_groups_write" on team_groups for all using (
  exists (select 1 from teams where teams.id = team_groups.team_id and is_club_staff(teams.club_id))
) with check (
  exists (select 1 from teams where teams.id = team_groups.team_id and is_club_staff(teams.club_id))
);

create policy "players_select" on players for select using (is_club_member(club_id));
create policy "players_write" on players for all using (is_club_staff(club_id)) with check (is_club_staff(club_id));

create policy "player_team_groups_select" on player_team_groups for select using (
  exists (select 1 from players where players.id = player_team_groups.player_id and is_club_member(players.club_id))
);
create policy "player_team_groups_write" on player_team_groups for all using (
  exists (select 1 from players where players.id = player_team_groups.player_id and is_club_staff(players.club_id))
) with check (
  exists (select 1 from players where players.id = player_team_groups.player_id and is_club_staff(players.club_id))
);

create policy "staff_members_select" on staff_members for select using (is_club_member(club_id));
create policy "staff_members_write" on staff_members for all using (is_club_staff(club_id)) with check (is_club_staff(club_id));

create policy "staff_team_assignments_select" on staff_team_assignments for select using (
  exists (select 1 from teams where teams.id = staff_team_assignments.team_id and is_club_member(teams.club_id))
);
create policy "staff_team_assignments_write" on staff_team_assignments for all using (
  exists (select 1 from teams where teams.id = staff_team_assignments.team_id and is_club_staff(teams.club_id))
) with check (
  exists (select 1 from teams where teams.id = staff_team_assignments.team_id and is_club_staff(teams.club_id))
);

create policy "calendar_events_select" on calendar_events for select using (is_club_member(club_id));
create policy "calendar_events_write" on calendar_events for all using (is_club_staff(club_id)) with check (is_club_staff(club_id));

create policy "trainings_select" on trainings for select using (
  exists (select 1 from calendar_events where calendar_events.id = trainings.event_id and is_club_member(calendar_events.club_id))
);
create policy "trainings_write" on trainings for all using (
  exists (select 1 from calendar_events where calendar_events.id = trainings.event_id and is_club_staff(calendar_events.club_id))
) with check (
  exists (select 1 from calendar_events where calendar_events.id = trainings.event_id and is_club_staff(calendar_events.club_id))
);

create policy "training_drills_select" on training_drills for select using (
  exists (
    select 1 from trainings
    join calendar_events on calendar_events.id = trainings.event_id
    where trainings.event_id = training_drills.training_event_id and is_club_member(calendar_events.club_id)
  )
);
create policy "training_drills_write" on training_drills for all using (
  exists (
    select 1 from trainings
    join calendar_events on calendar_events.id = trainings.event_id
    where trainings.event_id = training_drills.training_event_id and is_club_staff(calendar_events.club_id)
  )
) with check (
  exists (
    select 1 from trainings
    join calendar_events on calendar_events.id = trainings.event_id
    where trainings.event_id = training_drills.training_event_id and is_club_staff(calendar_events.club_id)
  )
);

-- Disponibilites : le staff voit tout ; un joueur ne voit/modifie que les
-- siennes (via son profil lie).
create policy "availabilities_select" on availabilities for select using (
  exists (select 1 from calendar_events where calendar_events.id = availabilities.event_id and is_club_member(calendar_events.club_id))
);
create policy "availabilities_write_staff" on availabilities for all using (
  exists (select 1 from calendar_events where calendar_events.id = availabilities.event_id and is_club_staff(calendar_events.club_id))
) with check (
  exists (select 1 from calendar_events where calendar_events.id = availabilities.event_id and is_club_staff(calendar_events.club_id))
);
create policy "availabilities_write_self" on availabilities for all using (
  exists (select 1 from players where players.id = availabilities.player_id and players.user_id = auth.uid())
) with check (
  exists (select 1 from players where players.id = availabilities.player_id and players.user_id = auth.uid())
);

create policy "attendances_select" on attendances for select using (
  exists (select 1 from calendar_events where calendar_events.id = attendances.event_id and is_club_member(calendar_events.club_id))
);
create policy "attendances_write" on attendances for all using (
  exists (select 1 from calendar_events where calendar_events.id = attendances.event_id and is_club_staff(calendar_events.club_id))
) with check (
  exists (select 1 from calendar_events where calendar_events.id = attendances.event_id and is_club_staff(calendar_events.club_id))
);

create policy "convocations_select" on convocations for select using (is_club_member(club_id));
create policy "convocations_write" on convocations for all using (is_club_staff(club_id)) with check (is_club_staff(club_id));

create policy "convocation_players_select" on convocation_players for select using (
  exists (select 1 from convocations where convocations.id = convocation_players.convocation_id and is_club_member(convocations.club_id))
);
create policy "convocation_players_write_staff" on convocation_players for all using (
  exists (select 1 from convocations where convocations.id = convocation_players.convocation_id and is_club_staff(convocations.club_id))
) with check (
  exists (select 1 from convocations where convocations.id = convocation_players.convocation_id and is_club_staff(convocations.club_id))
);
create policy "convocation_players_respond_self" on convocation_players for update using (
  exists (select 1 from players where players.id = convocation_players.player_id and players.user_id = auth.uid())
) with check (
  exists (select 1 from players where players.id = convocation_players.player_id and players.user_id = auth.uid())
);

create policy "notifications_select_self" on notifications for select using (user_id = auth.uid());
create policy "notifications_update_self" on notifications for update using (user_id = auth.uid());
create policy "notifications_insert_staff" on notifications for insert with check (is_club_staff(club_id));

-- ==========================================================================
-- Creation automatique du profil a l'inscription
-- ==========================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
