-- catalogue_outils.diametre is the outer diameter (OD) — this adds the
-- inner diameter (ID), tracked separately since both specs matter for
-- drilling equipment (e.g. a Junk Mill's OD vs its bore ID).
alter table catalogue_outils add column diametre_interieur text;
