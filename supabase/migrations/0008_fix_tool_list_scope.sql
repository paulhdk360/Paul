-- Transport/Personnel/Serrage devis lines were defaulting to
-- inclure_tool_list = true (the original default applied to every line
-- type), so they were wrongly pulled into the Tool List / Service Ticket
-- équipement pointage as if they were physical equipment. Fix the flag on
-- existing lines and remove the junk rows that flag already generated.

update devis_lignes set inclure_tool_list = false where type in ('Transport', 'Personnel', 'Serrage');

delete from tool_list_items
where devis_ligne_id in (
  select id from devis_lignes where type in ('Transport', 'Personnel', 'Serrage')
);
