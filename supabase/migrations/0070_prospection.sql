-- Prospection pipeline: prospects + their interaction history. Documents
-- sent reuse the existing polymorphic `attachments` table (link_type =
-- 'prospects'), no schema change needed there.
create table prospects (
  id uuid primary key default gen_random_uuid(),
  entreprise text not null,
  contact_nom text,
  contact_fonction text,
  telephone text,
  email text,
  secteur text,
  statut text not null default 'À contacter'
    check (statut in ('À contacter', 'Contacté', 'Relance', 'Qualifié', 'Devis envoyé', 'Gagné', 'Perdu')),
  prochaine_action text,
  date_relance date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table prospect_interactions (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  canal text not null check (canal in ('Téléphone', 'Email', 'Social', 'Visite', 'Réseau', 'Salon', 'Autre')),
  resume text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table prospects enable row level security;
alter table prospect_interactions enable row level security;

create policy "prospects_select" on prospects for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));
create policy "prospects_write" on prospects for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));

create policy "prospect_interactions_select" on prospect_interactions for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));
create policy "prospect_interactions_write" on prospect_interactions for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));
