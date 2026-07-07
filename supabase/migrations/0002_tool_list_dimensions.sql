-- Adds a free-text dimensions field to the Tool List, alongside the
-- existing weight (poids_kg) and packaging (colisage) fields, so the BL
-- screen can capture both for shipping documents.
alter table tool_list_items add column dimensions text;
