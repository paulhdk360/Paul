-- Fields needed to import the real fleet-tracking spreadsheet (one row per
-- physical unit, not per SKU): a permanent serial number distinct from
-- numero_article (an internal reference code), the bottom connection when
-- it differs from the top one, the top sub's own OD/ID when the tool has
-- one, and blade size info for mill-type tools.
alter table catalogue_outils add column numero_serie text;
alter table catalogue_outils add column connexion_bas text;
alter table catalogue_outils add column diametre_top_sub text;
alter table catalogue_outils add column diametre_interieur_top_sub text;
alter table catalogue_outils add column tailles_lames text;
