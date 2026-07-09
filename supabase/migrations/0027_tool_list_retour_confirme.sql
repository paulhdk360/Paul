-- Two-step Pointage retour: first confirm the item physically made it back
-- to the base (sets the catalogue statut to "Retour à la base"), only then
-- decide what to do with it (inspecter/rectifier/repeindre/stock).
alter table tool_list_items add column retour_confirme boolean not null default false;
