-- Football Team Manager — module Feuilles de match
-- A exécuter après 0001, 0002, 0003.

-- Extension "match" d'un événement de type match, sur le même principe que
-- `trainings` pour les entraînements.
create table matches (
  event_id uuid primary key references calendar_events (id) on delete cascade,
  opponent_name text,
  is_home boolean not null default true,
  team_score integer,
  opponent_score integer,
  notes text
);

-- Statistiques individuelles par joueur et par match. Modèle clé/valeur
-- plutôt que des colonnes fixes : permet de couvrir les statistiques
-- pertinentes selon le poste (passe, course, réception, défense...) sans
-- multiplier les colonnes vides. Les clés utilisées sont définies côté
-- application (voir lib/stats.ts).
create table match_player_stats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references calendar_events (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  stat_key text not null,
  stat_value numeric not null default 0,
  unique (event_id, player_id, stat_key)
);

create index match_player_stats_event_idx on match_player_stats (event_id);
