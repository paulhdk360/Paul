-- Overshot-specific fields, read off the source fleet sheet's "Serie",
-- "Type", "Max catch Spiral", "Max catch Basket" and "Grapple" columns.
-- "modele" holds the per-unit model/type code (e.g. "3-3/4\" SH") — distinct
-- from the top-level Type/famille classification ("Overshot") already
-- covered by the existing famille column. bowen_assy_numero (added for
-- Fishing Bumper Sub) is reused here for the overshot's own Bowen catalog
-- number, same concept across families.
alter table catalogue_outils add column serie text;
alter table catalogue_outils add column modele text;
alter table catalogue_outils add column max_catch_spiral text;
alter table catalogue_outils add column max_catch_basket text;
alter table catalogue_outils add column grapple text;
