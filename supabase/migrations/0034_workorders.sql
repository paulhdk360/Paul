-- Work orders: auto-created when Pointage retour records a repair decision
-- (à inspecter / à rectifier / à recharger / à repeindre — everything except
-- straight back to stock), so Atelier can log the real cost of a repair:
-- hours spent, carbide inserts used, welding consumables used. One
-- workorder per tool_list_item (kept in sync by pointageRetour() whenever
-- the decision changes); the consumables/hours themselves are filled in by
-- hand by Atelier as the repair progresses, since no other source exists
-- anywhere for these figures.
create table workorders (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references affaires (id) on delete cascade,
  tool_list_item_id uuid references tool_list_items (id) on delete cascade,
  outil_id uuid references catalogue_outils (id) on delete set null,
  decision text not null,
  statut text not null default 'Ouvert',
  heures numeric,
  carbures numeric,
  inserts numeric,
  materiel_soudure numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index workorders_tool_list_item_unique on workorders (tool_list_item_id) where tool_list_item_id is not null;

alter table workorders enable row level security;

create policy "workorders_select" on workorders for select to authenticated using (true);
create policy "workorders_write" on workorders for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
