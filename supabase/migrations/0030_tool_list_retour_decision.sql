-- The retour decision (inspecter/rectifier/repeindre/stock) must be
-- recordable even when the item isn't linked to a catalogue reference yet
-- — previously it only ever propagated to catalogue_outils.statut, so an
-- unlinked item's decision was silently lost. Stored here regardless of the
-- link; still synced to the catalogue statut whenever outil_id is set.
alter table tool_list_items add column retour_decision text;
