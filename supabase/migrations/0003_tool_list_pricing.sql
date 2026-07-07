-- The Service Ticket Enedril prices equipment directly per unit (as in the
-- original workbook's "Enedril" sheet), independently of whatever devis
-- line it may have come from — so the Tool List carries its own pricing.
alter table tool_list_items add column prix_stand_by numeric;
alter table tool_list_items add column prix_operation numeric;
alter table tool_list_items add column prix_uc numeric;
alter table tool_list_items add column prix_lih numeric;
alter table tool_list_items add column prix_inspection numeric;
alter table tool_list_items add column prix_restocking numeric;
