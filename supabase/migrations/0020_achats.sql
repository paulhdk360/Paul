-- Purchases (achats): sometimes for a specific affaire/chantier (linked via
-- affaire_id so it shows up on that affaire's page), sometimes general
-- overhead for Bureaux / Atelier / Opérateurs with no affaire to tie to.
-- categorie is plain text (like devis.type_activite/type_transaction) rather
-- than an enum, matching the newer, lighter-weight pattern in this codebase
-- for classification fields that may need new values without an enum
-- migration each time.
create table achats (
  id uuid primary key default gen_random_uuid(),
  designation text not null,
  fournisseur text,
  montant numeric,
  date_achat date,
  categorie text not null default 'Bureaux',
  affaire_id uuid references affaires (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

alter table achats enable row level security;

create policy "achats_select" on achats for select to authenticated using (true);
create policy "achats_write" on achats for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
