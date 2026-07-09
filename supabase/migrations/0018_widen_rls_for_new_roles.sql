-- Widen existing RLS policies to include the two roles added in migration
-- 0017 (direction, administratif_logistique). Must run after 0017 commits.

-- Tier A: admin + commercial (clients/affaires/devis) — add direction.
alter policy "clients_write" on clients
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));

alter policy "affaires_write" on affaires
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));

alter policy "devis_write" on devis
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));

alter policy "devis_lignes_write" on devis_lignes
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));

alter policy "contacts_write" on contacts
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));

alter policy "employes_write" on employes
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));

-- Tier B: admin + commercial + atelier (catalogue/tool list/BL/attachments,
-- plus devis read access from migration 0006) — add direction + administratif_logistique.
alter policy "catalogue_write" on catalogue_outils
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "tool_list_write" on tool_list_items
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "bl_write" on bons_livraison
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "planning_entries_write" on planning_entries
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "attachments_write" on attachments
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "attachments_storage_write" on storage.objects
  using (bucket_id = 'attachments' and current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (bucket_id = 'attachments' and current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "catalogue_historique_write" on catalogue_outils_historique
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "notifications_insert" on notifications
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "devis_commentaires_select" on devis_commentaires
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "devis_commentaires_write" on devis_commentaires
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "devis_select" on devis
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter policy "devis_lignes_select" on devis_lignes
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

-- Tier C: admin + commercial + atelier + operateur (Service Ticket pointage) —
-- add direction + administratif_logistique alongside the existing roles.
alter policy "tickets_write" on service_tickets
  using (current_role_is(array['admin', 'commercial', 'atelier', 'operateur', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'operateur', 'direction', 'administratif_logistique']::user_role[]));

alter policy "tickets_personnel_write" on service_ticket_personnel
  using (current_role_is(array['admin', 'commercial', 'atelier', 'operateur', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'operateur', 'direction', 'administratif_logistique']::user_role[]));

alter policy "tickets_transport_write" on service_ticket_transport
  using (current_role_is(array['admin', 'commercial', 'atelier', 'operateur', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'operateur', 'direction', 'administratif_logistique']::user_role[]));

alter policy "tickets_days_write" on service_ticket_days
  using (current_role_is(array['admin', 'commercial', 'atelier', 'operateur', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'operateur', 'direction', 'administratif_logistique']::user_role[]));
