create table drawing_library (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  url text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table drawing_library enable row level security;

create policy "drawing_library_select" on drawing_library for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
create policy "drawing_library_write" on drawing_library for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

insert into storage.buckets (id, name, public) values ('drawings', 'drawings', true)
  on conflict (id) do nothing;

create policy "drawings_storage_select" on storage.objects for select
  using (bucket_id = 'drawings');
create policy "drawings_storage_write" on storage.objects for all to authenticated
  using (bucket_id = 'drawings' and current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (bucket_id = 'drawings' and current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

insert into drawing_library (nom, url) values
  ('Spear', '/drawings/spear.png'),
  ('Overshot', '/drawings/overshot.png'),
  ('Drill Collar', '/drawings/drill-collar.png'),
  ('Taper Mill', '/drawings/taper-mill.png'),
  ('Stabilisateur', '/drawings/stabilisateur.png'),
  ('Packer Milling Tool', '/drawings/packer-milling-tool.png');
