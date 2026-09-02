-- Football Team Manager — module Analyse vidéo (Neon / PostgreSQL standard)
-- A exécuter après 0001_init.sql.
--
-- Les fichiers vidéo eux-mêmes sont stockés sur Cloudflare R2 (pas dans
-- Postgres) : `storage_key` référence l'objet dans le bucket R2. L'upload et
-- la lecture passent par des URL présignées générées côté serveur
-- (voir lib/r2.ts).

create table videos (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  team_id uuid references teams (id) on delete set null,
  event_id uuid references calendar_events (id) on delete set null,
  title text not null,
  storage_key text not null, -- clé de l'objet dans le bucket R2, préfixée par club_id/
  duration_seconds numeric,
  uploaded_by uuid references users (id),
  created_at timestamptz not null default now()
);

create index videos_club_idx on videos (club_id);
create index videos_team_idx on videos (team_id);
create index videos_event_idx on videos (event_id);

create table video_clips (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos (id) on delete cascade,
  start_seconds numeric not null,
  end_seconds numeric,
  play_type text,
  result text,
  down integer,
  distance integer,
  notes text,
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

create index video_clips_video_idx on video_clips (video_id);

create table video_clip_players (
  clip_id uuid not null references video_clips (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  primary key (clip_id, player_id)
);
