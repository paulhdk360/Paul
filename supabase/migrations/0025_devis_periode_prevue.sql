-- Rough forecast window for when a devis's equipment is expected to be
-- mobilized — set once at devis time (often long before the affaire is
-- confirmed), and used purely for the equipment planning calendar so stock
-- availability across the year is visible early, not to drive any billing
-- or Tool List logic.
alter table devis add column periode_prevue_debut date;
alter table devis add column periode_prevue_fin date;
