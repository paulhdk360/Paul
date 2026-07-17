-- Free-text notes on a catalogue reference (e.g. known quirks, prep
-- reminders) — separate from famille/désignation which are structured
-- identification fields, not commentary.
alter table catalogue_outils add column commentaire text;
