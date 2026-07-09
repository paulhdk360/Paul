-- A free-form comment thread under Pointage retour, separate from the
-- per-item "Commentaire" textarea — for back-and-forth about the return
-- batch as a whole (same shape/roles as devis_commentaires).
create table pointage_retour_commentaires (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references affaires (id) on delete cascade,
  auteur_id uuid references profiles (id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table pointage_retour_commentaires enable row level security;

create policy "pointage_retour_commentaires_select" on pointage_retour_commentaires for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
create policy "pointage_retour_commentaires_write" on pointage_retour_commentaires for insert to authenticated
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
