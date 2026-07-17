-- Parent grouping above "famille" (e.g. "Fraisage / Surforage" contains
-- "Economill", "Junk Mill", "Section Mill"...) — mirrors the category
-- numbering already used in the source fleet spreadsheet (1-10, each with
-- its own numbered sub-families). Free text like famille itself, not an
-- enum, so new categories don't need a migration.
alter table catalogue_outils add column categorie text;
