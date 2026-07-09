-- The Tool List no longer tracks poids/dimensions/colisage per line (that
-- stays on the BL, which keeps its own per-item fields on tool_list_items).
-- Instead the whole Tool List gets one manually-entered summary, stored on
-- the affaire since a Tool List is 1:1 with its affaire.
alter table affaires add column tool_list_poids_total_kg numeric;
alter table affaires add column tool_list_dimensions text;
alter table affaires add column tool_list_colisage text;
