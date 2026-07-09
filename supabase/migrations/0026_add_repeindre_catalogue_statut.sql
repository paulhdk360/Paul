-- New Pointage retour decision: "À repeindre", alongside the existing
-- rectifier/inspecter/stock outcomes. Kept as its own migration file, apart
-- from anything referencing the new value, per the usual Postgres rule that
-- ALTER TYPE ... ADD VALUE can't be used in the same transaction as a query
-- referencing that value.
alter type catalogue_statut add value if not exists 'À repeindre';
