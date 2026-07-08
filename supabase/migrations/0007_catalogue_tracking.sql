-- Link Tool List items back to their real catalogue entry (independent of
-- whatever wording was typed on the devis/Tool List for the client), and
-- give the catalogue a proper statut/history so equipment can be tracked
-- across affaires: "Réservé pour affaire X", "Sur chantier", "En transit",
-- "Retour à la base", "En attente d'inspection", "À recharger", "À rectifier".

alter table tool_list_items add column outil_id uuid references catalogue_outils (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Catalogue statut: replaces the old 4-value disponibilite with the real
-- physical-tracking vocabulary. Existing values are mapped, not discarded.
-- ---------------------------------------------------------------------------
create type catalogue_statut as enum (
  'En stock', 'Réservé', 'Sur chantier', 'En transit', 'Retour à la base',
  'En attente d''inspection', 'À recharger', 'À rectifier', 'Indisponible'
);

alter table catalogue_outils alter column disponibilite drop default;
alter table catalogue_outils
  alter column disponibilite type catalogue_statut
  using (
    case disponibilite::text
      when 'Disponible' then 'En stock'
      when 'En location' then 'Sur chantier'
      when 'Maintenance' then 'À rectifier'
      else 'Indisponible'
    end::catalogue_statut
  );
alter table catalogue_outils alter column disponibilite set default 'En stock';
alter table catalogue_outils rename column disponibilite to statut;

drop type tool_disponibilite;

-- Which affaire an item is currently reserved/out for, so "Réservé pour
-- affaire 26-46" is a real link, not just a free-text note.
alter table catalogue_outils add column affaire_reservee_id uuid references affaires (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Append-only history: every statut change on a catalogue item, automatic or
-- manual, is logged here so there's always a trace of where a tool has been.
-- ---------------------------------------------------------------------------
create table catalogue_outils_historique (
  id uuid primary key default gen_random_uuid(),
  outil_id uuid not null references catalogue_outils (id) on delete cascade,
  ancien_statut text,
  nouveau_statut text not null,
  affaire_id uuid references affaires (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

alter table catalogue_outils_historique enable row level security;
create policy "catalogue_historique_select" on catalogue_outils_historique for select to authenticated using (true);
create policy "catalogue_historique_write" on catalogue_outils_historique for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));
