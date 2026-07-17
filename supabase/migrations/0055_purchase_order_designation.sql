-- Purchase orders can now be created manually (hôtel, transport, etc.), not
-- just auto-generated from an inspection pointage-retour decision — those
-- have no linked tool_list_items to describe what they're for, so this field
-- covers that. Left null for inspection POs, whose linked items already
-- describe them.
alter table purchase_orders add column designation text;
