-- New devis line type: a plain section-header row (no price, no quantity)
-- used to visually group equipment lines, e.g. "Items pour le casing
-- 13-3/8"" before the lines it applies to. Standalone migration per the
-- usual Postgres rule that ALTER TYPE ... ADD VALUE can't share a
-- transaction with a query referencing the new value.
alter type ligne_type add value if not exists 'Titre';
