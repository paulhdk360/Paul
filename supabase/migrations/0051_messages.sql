-- Simple internal 1:1 messaging between colleagues — "demander un truc à un
-- collègue sans passer par mail". Non-realtime by design (fetched on
-- navigation like everything else in the app): the same table/thread model
-- can grow a Realtime subscription on top later without changing the schema.
create table messages (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references profiles (id) on delete cascade,
  to_user_id uuid not null references profiles (id) on delete cascade,
  message text not null,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_from_user_id on messages (from_user_id);
create index if not exists idx_messages_to_user_id on messages (to_user_id);

alter table messages enable row level security;

create policy "messages_select" on messages for select to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "messages_insert" on messages for insert to authenticated
  with check (auth.uid() = from_user_id);

-- Only the recipient marking a message as read.
create policy "messages_update" on messages for update to authenticated
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);
