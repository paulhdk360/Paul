-- Progress tracking per affaire ("situations d'avancement"): a dated % complete
-- + note, used to derive progress invoices (montant de la situation =
-- affaires.montant_contrat x (pourcentage - pourcentage précédent) / 100).
create table avancement_situations (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references affaires (id) on delete cascade,
  date date not null default current_date,
  pourcentage numeric not null,
  description text,
  created_at timestamptz not null default now()
);

alter table avancement_situations enable row level security;

create policy "avancement_situations_select" on avancement_situations for select to authenticated using (true);
create policy "avancement_situations_write" on avancement_situations for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'direction']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'direction']::user_role[]));
