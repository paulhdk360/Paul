-- Junk Mill-specific fields — also shown for Economill since both are
-- milling tools and the user wants the same field set on both (they
-- already share the same Type-matching group, keyed off "mill").
-- rechargement already exists (added for Set of Cutters/Hydraulic Pipe
-- Cutter) and is reused here for the same concept.
alter table catalogue_outils add column stabilisee text;
alter table catalogue_outils add column profil text;
