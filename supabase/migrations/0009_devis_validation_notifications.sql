-- Internal devis validation workflow: a "ready to check" / "validated" step
-- before a quote goes out, a notification to nudge a colleague to look at
-- it, and a lightweight comment thread on the devis for back-and-forth.

alter type devis_statut add value if not exists 'À confirmer' after 'Brouillon';
alter type devis_statut add value if not exists 'Validé' after 'À confirmer';

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  message text not null,
  link text,
  lu boolean not null default false,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table devis_commentaires (
  id uuid primary key default gen_random_uuid(),
  devis_id uuid not null references devis (id) on delete cascade,
  auteur_id uuid references profiles (id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
alter table devis_commentaires enable row level security;

-- Everyone can see who a notification is from, but only the recipient can
-- read their own inbox / mark it read; any admin/commercial/atelier can
-- notify a colleague (creating a row for someone else).
create policy "notifications_select_own" on notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_insert" on notifications for insert to authenticated
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));
create policy "notifications_update_own" on notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "devis_commentaires_select" on devis_commentaires for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));
create policy "devis_commentaires_write" on devis_commentaires for insert to authenticated
  with check (current_role_is(array['admin', 'commercial', 'atelier']::user_role[]));
