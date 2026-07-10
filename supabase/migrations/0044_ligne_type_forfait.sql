-- "Forfait" was added as a devis_lignes.type value in application code but
-- the underlying ligne_type enum was never updated, so any insert of a
-- Forfait line fails at the database level. Standalone migration — ALTER
-- TYPE ADD VALUE can't run in the same transaction as a query referencing
-- the new value.
alter type ligne_type add value if not exists 'Forfait';
