-- Football Team Manager — module Analyse vidéo
-- A exécuter après 0001_init.sql dans l'éditeur SQL du projet Supabase.

-- ==========================================================================
-- Bucket de stockage pour les vidéos (privé, accès via policies RLS)
-- ==========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  524288000, -- 500 Mo par fichier
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ==========================================================================
-- Vidéos et découpage en "plays" (clips)
-- ==========================================================================

create table videos (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  team_id uuid references teams (id) on delete set null,
  event_id uuid references calendar_events (id) on delete set null,
  title text not null,
  storage_path text not null, -- chemin dans le bucket "videos", préfixé par club_id/
  duration_seconds numeric,
  uploaded_by uuid references profiles (id),
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
  play_type text, -- Course, Passe, Botté, Field Goal, Défense...
  result text,     -- texte libre : "Touchdown", "Gain de 8 yards"...
  down integer,
  distance integer,
  notes text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index video_clips_video_idx on video_clips (video_id);

create table video_clip_players (
  clip_id uuid not null references video_clips (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  primary key (clip_id, player_id)
);

-- ==========================================================================
-- Row Level Security
-- ==========================================================================

alter table videos enable row level security;
alter table video_clips enable row level security;
alter table video_clip_players enable row level security;

create policy "videos_select" on videos for select using (is_club_member(club_id));
create policy "videos_write" on videos for all using (is_club_staff(club_id)) with check (is_club_staff(club_id));

create policy "video_clips_select" on video_clips for select using (
  exists (select 1 from videos where videos.id = video_clips.video_id and is_club_member(videos.club_id))
);
create policy "video_clips_write" on video_clips for all using (
  exists (select 1 from videos where videos.id = video_clips.video_id and is_club_staff(videos.club_id))
) with check (
  exists (select 1 from videos where videos.id = video_clips.video_id and is_club_staff(videos.club_id))
);

create policy "video_clip_players_select" on video_clip_players for select using (
  exists (
    select 1 from video_clips
    join videos on videos.id = video_clips.video_id
    where video_clips.id = video_clip_players.clip_id and is_club_member(videos.club_id)
  )
);
create policy "video_clip_players_write" on video_clip_players for all using (
  exists (
    select 1 from video_clips
    join videos on videos.id = video_clips.video_id
    where video_clips.id = video_clip_players.clip_id and is_club_staff(videos.club_id)
  )
) with check (
  exists (
    select 1 from video_clips
    join videos on videos.id = video_clips.video_id
    where video_clips.id = video_clip_players.clip_id and is_club_staff(videos.club_id)
  )
);

-- ==========================================================================
-- Policies sur le contenu du bucket "videos"
-- Convention de chemin : <club_id>/<uuid>-<nom-fichier>
-- ==========================================================================

create policy "videos_bucket_select" on storage.objects for select using (
  bucket_id = 'videos' and is_club_member((storage.foldername(name))[1]::uuid)
);

create policy "videos_bucket_insert" on storage.objects for insert with check (
  bucket_id = 'videos' and is_club_staff((storage.foldername(name))[1]::uuid)
);

create policy "videos_bucket_delete" on storage.objects for delete using (
  bucket_id = 'videos' and is_club_staff((storage.foldername(name))[1]::uuid)
);
