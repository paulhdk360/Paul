-- Price list per catalogue reference, mirroring the pricing dimensions on
-- devis_lignes (prix_defaut already existed and now doubles as the
-- forfait/lump-sum default). Picking a référence in a devis auto-fills its
-- line from these defaults, but every field on the line stays independently
-- editable afterward.
alter table catalogue_outils add column prix_stand_by numeric;
alter table catalogue_outils add column prix_operation numeric;
alter table catalogue_outils add column prix_uc numeric;
alter table catalogue_outils add column prix_lih numeric;
alter table catalogue_outils add column prix_inspection numeric;
alter table catalogue_outils add column prix_restocking numeric;
alter table catalogue_outils add column prix_serrage numeric;
