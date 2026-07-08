-- Maintenance and UC represented the exact same real-world charge under two
-- separate fields, both auto-triggered by the equipment having an Operation
-- day — meaning any line with both set was double-billed. Keep UC (the
-- field the billing engine already trusted) and drop Maintenance entirely.
-- Salvage a maintenance-only price into UC first so no pricing is lost.

update devis_lignes set prix_uc = prix_maintenance where prix_uc is null and prix_maintenance is not null;
update tool_list_items set prix_uc = prix_maintenance where prix_uc is null and prix_maintenance is not null;

alter table devis_lignes drop column prix_maintenance;
alter table tool_list_items drop column prix_maintenance;
alter table tool_list_items drop column maintenance_facturee;

-- Note: the unrelated ToolStatut "Maintenance" (a tool's physical
-- state — "in for repair") and its automatic trigger on an Operation day
-- are untouched; that's a workflow status, not a billing charge.
