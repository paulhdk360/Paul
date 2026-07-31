create table outil_drawings (
  id uuid primary key default gen_random_uuid(),
  famille text not null unique,
  fichier text not null,
  created_at timestamptz not null default now()
);

alter table outil_drawings enable row level security;

create policy "outil_drawings_select" on outil_drawings for select to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));
create policy "outil_drawings_write" on outil_drawings for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

alter table bha_items add column famille text;

insert into outil_drawings (famille, fichier) values
  ('SPEAR BODY', '/drawings/spear.png'),
  ('OVERSHOT', '/drawings/overshot.png'),
  ('DRILL COLLAR', '/drawings/drill-collar.png'),
  ('TAPER MILL', '/drawings/taper-mill.png'),
  ('PACKER RETRIEVER - PACKER MILLING TOOL', '/drawings/packer-milling-tool.png');
