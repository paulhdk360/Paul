-- The diameter actually needed for a job can differ from a catalogue
-- reference's nominal diameter (e.g. client wants 17" but the tool on the
-- shelf is 17-1/2") — the tool then needs rework (rectifier/recharger)
-- before it can go out. This column captures the requested diameter so it
-- can be compared against catalogue_outils.diametre.

alter table devis_lignes add column diametre_souhaite text;
alter table tool_list_items add column diametre_souhaite text;
