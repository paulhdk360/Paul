-- The "Vente" line type was added in application code (Devis Vente template)
-- but the underlying ligne_type enum was never updated, so any insert of a
-- Vente line fails at the database level. "Packaging" is a new line type for
-- the Vente template's Packaging tab. Kept as its own migration file (not
-- combined with anything that references either new value) per the usual
-- Postgres rule that ALTER TYPE ... ADD VALUE can't be used in the same
-- transaction as a query referencing that value.
alter type ligne_type add value if not exists 'Vente';
alter type ligne_type add value if not exists 'Packaging';
