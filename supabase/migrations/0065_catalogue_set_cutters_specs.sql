-- Set of Cutters-specific fields — the cutter blade kits that go inside a
-- Hydraulic Pipe Cutter body. Reuses serie/modele/numero_serie (numero_serie
-- holds this sheet's "ref" code, e.g. "203-3600-A1", since there's no
-- separate per-blade serial number in the source).
alter table catalogue_outils add column largeur text;
alter table catalogue_outils add column diametre_ouverture text;
alter table catalogue_outils add column csg_to_cut text;
alter table catalogue_outils add column rechargement text;
alter table catalogue_outils add column numero_set text;
