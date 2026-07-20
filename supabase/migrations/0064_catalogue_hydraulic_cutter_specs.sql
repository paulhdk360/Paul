-- Hydraulic Pipe Cutter-specific fields. Reuses serie (added for Overshot)
-- and diametre_top_sub (added for Economill) since both are the same
-- concept across families — only the fields genuinely new to this family
-- need a column: the casing cutting range, the top sub's own connection/
-- fishing-neck dimensions (distinct from the tool's own Conn up/down and
-- OD Body, already covered by connexion/connexion_bas/diametre), and the
-- nozzle ("duse") diameter.
alter table catalogue_outils add column cutting_range_csg text;
alter table catalogue_outils add column connexion_top_sub text;
alter table catalogue_outils add column od_fn_top_sub text;
alter table catalogue_outils add column lg_fn_top_sub text;
alter table catalogue_outils add column lg_top_sub text;
alter table catalogue_outils add column diametre_duse text;
