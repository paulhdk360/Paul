-- Replaces the single flat "cout_personnel" manual entry on Rentabilité with
-- a structured hourly-rate x hours breakdown per cost category, matching how
-- these internal costs are actually tracked (Opérateur and Atelier personnel
-- by hourly rate, Break Out Unit by running hours) instead of one opaque
-- lump sum with no detail behind it.
alter table affaires
  add column operateur_tarif_horaire numeric,
  add column operateur_heures numeric,
  add column atelier_tarif_horaire numeric,
  add column atelier_heures numeric,
  add column bou_tarif_horaire numeric,
  add column bou_heures numeric;

alter table affaires drop column cout_personnel;
