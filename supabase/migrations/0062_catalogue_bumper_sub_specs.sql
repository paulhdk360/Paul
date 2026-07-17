-- Fishing Bumper Sub-specific fields, read off the source fleet sheet's
-- "Stroke", "Logan Assy N°" and "Bowen Assy N°" columns — the two assembly
-- numbers identify which manufacturer's part drawing the physical unit was
-- built to, distinct from its own numero_serie.
alter table catalogue_outils add column stroke text;
alter table catalogue_outils add column logan_assy_numero text;
alter table catalogue_outils add column bowen_assy_numero text;
