-- Migration 0008 excluded Transport/Personnel/Serrage from the Tool List
-- altogether. That was too broad: only Transport (a shipping charge, never
-- a physical item) should be excluded — Personnel and Serrage ("autres
-- prestations") can legitimately need Tool List tracking, so re-enable them.

update devis_lignes set inclure_tool_list = true where type in ('Personnel', 'Serrage');
