-- No migration has ever added an index (Postgres only auto-indexes primary
-- keys and unique constraints — foreign keys get none). Nearly every page
-- in the app does several `.eq("affaire_id", ...)`-style queries per load
-- (tool-list, bl, service-ticket, devis, rentabilite, avancement,
-- pointage-retour, documents, workorders...), each one a full sequential
-- scan without these. Purely additive — no data touched, safe to run
-- anytime.
create index if not exists idx_devis_affaire_id on devis (affaire_id);
create index if not exists idx_devis_contact_id on devis (contact_id);
create index if not exists idx_devis_lignes_devis_id on devis_lignes (devis_id);

create index if not exists idx_tool_list_items_affaire_id on tool_list_items (affaire_id);
create index if not exists idx_tool_list_items_devis_ligne_id on tool_list_items (devis_ligne_id);
create index if not exists idx_tool_list_items_outil_id on tool_list_items (outil_id);
create index if not exists idx_tool_list_items_bl_id on tool_list_items (bl_id);

create index if not exists idx_service_tickets_affaire_id on service_tickets (affaire_id);
create index if not exists idx_service_ticket_personnel_ticket_id on service_ticket_personnel (ticket_id);
create index if not exists idx_service_ticket_transport_ticket_id on service_ticket_transport (ticket_id);

create index if not exists idx_attachments_affaire_id on attachments (affaire_id);
create index if not exists idx_attachments_link on attachments (link_type, link_id);

create index if not exists idx_contacts_client_id on contacts (client_id);
create index if not exists idx_affaires_contact_id on affaires (contact_id);
create index if not exists idx_employes_manager_id on employes (manager_id);
create index if not exists idx_planning_entries_affaire_id on planning_entries (affaire_id);

create index if not exists idx_catalogue_outils_affaire_reservee_id on catalogue_outils (affaire_reservee_id);
create index if not exists idx_catalogue_historique_outil_id on catalogue_outils_historique (outil_id);
create index if not exists idx_catalogue_historique_affaire_id on catalogue_outils_historique (affaire_id);

create index if not exists idx_notifications_user_id on notifications (user_id);
create index if not exists idx_notifications_created_by on notifications (created_by);

create index if not exists idx_devis_commentaires_devis_id on devis_commentaires (devis_id);
create index if not exists idx_devis_commentaires_auteur_id on devis_commentaires (auteur_id);

create index if not exists idx_achats_affaire_id on achats (affaire_id);
create index if not exists idx_formations_employe_id on formations (employe_id);

create index if not exists idx_pointage_retour_commentaires_affaire_id on pointage_retour_commentaires (affaire_id);
create index if not exists idx_pointage_retour_commentaires_auteur_id on pointage_retour_commentaires (auteur_id);

create index if not exists idx_parc_materiel_affaire_id on parc_materiel (affaire_id);

create index if not exists idx_workorders_affaire_id on workorders (affaire_id);
create index if not exists idx_workorders_tool_list_item_id on workorders (tool_list_item_id);
create index if not exists idx_workorders_outil_id on workorders (outil_id);

create index if not exists idx_avancement_situations_affaire_id on avancement_situations (affaire_id);
