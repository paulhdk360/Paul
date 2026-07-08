-- Let opérateurs point their own equipment/personnel usage on the Service
-- Ticket (MOB/S/O/DEMOB/FIN/LIH, personnel, transport), while keeping devis
-- and the Tool List management screens out of their reach at the RLS level.

-- ---------------------------------------------------------------------------
-- Service Ticket tables: opérateur can now write (pointage, personnel,
-- transport, ticket header), not just read. Pricing stays hidden purely in
-- the "operateur" UI variant, matching how these tables already exposed
-- price columns to opérateur's SELECT access.
-- ---------------------------------------------------------------------------
drop policy "tickets_write" on service_tickets;
create policy "tickets_write" on service_tickets for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'operateur']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'operateur']::user_role[]));

drop policy "tickets_personnel_write" on service_ticket_personnel;
create policy "tickets_personnel_write" on service_ticket_personnel for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'operateur']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'operateur']::user_role[]));

drop policy "tickets_transport_write" on service_ticket_transport;
create policy "tickets_transport_write" on service_ticket_transport for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'operateur']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'operateur']::user_role[]));

drop policy "tickets_days_write" on service_ticket_days;
create policy "tickets_days_write" on service_ticket_days for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'operateur']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'operateur']::user_role[]));

-- Pointing "O" or "LIH" auto-flips the Tool List item's statut. Rather than
-- widen general Tool List write access to opérateur (who must not be able to
-- edit designations/prices), this narrow security-definer function is the
-- only door opérateur gets into tool_list_items.
create or replace function set_tool_list_statut(item_id uuid, new_statut tool_statut)
returns void
language sql
security definer
set search_path = public
as $$
  update tool_list_items set statut = new_statut where id = item_id;
$$;

revoke all on function set_tool_list_statut(uuid, tool_statut) from public;
grant execute on function set_tool_list_statut(uuid, tool_statut) to authenticated;

-- ---------------------------------------------------------------------------
-- Devis / devis_lignes: opérateur loses read access entirely (they never
-- needed it — their ticket page doesn't query these tables). Combined with
-- route guards on the devis/tool-list/bl/service-ticket pages, this closes
-- both the UI and the direct-API path.
-- ---------------------------------------------------------------------------
drop policy "devis_select" on devis;
create policy "devis_select" on devis for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));

drop policy "devis_lignes_select" on devis_lignes;
create policy "devis_lignes_select" on devis_lignes for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));
