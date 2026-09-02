-- Football Team Manager — module Tactiques (formations, jeux, routes des 11 joueurs)
-- A exécuter après 0001_init.sql et 0002_video_analysis.sql.

create type play_phase as enum ('offense', 'defense');

create table plays (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  team_id uuid references teams (id) on delete set null,
  phase play_phase not null,
  formation text not null,
  name text not null,
  description text,
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plays_club_idx on plays (club_id);
create index plays_team_idx on plays (team_id);

-- Un joueur du jeu : position de départ (yards, relatif au centre de la ligne
-- de mêlée) + route (séquence de segments distance/angle, même format que le
-- prototype) + une consigne libre (utile surtout côté défense : "couverture
-- homme sur WR1", "zone profonde", "blitz"...).
create table play_positions (
  id uuid primary key default gen_random_uuid(),
  play_id uuid not null references plays (id) on delete cascade,
  position_order integer not null default 0,
  label text not null,
  start_x numeric not null,
  start_y numeric not null,
  assignment text,
  route jsonb not null default '[]'::jsonb
);

create index play_positions_play_idx on play_positions (play_id);
