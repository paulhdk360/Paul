-- Timestamps when an item's return was confirmed ("bien arrivé à la
-- base"), so Atelier gets a real historique of processed Pointage retours
-- (sortable by date) instead of just the current live state on each
-- affaire's page.
alter table tool_list_items add column retour_confirme_at timestamptz;
