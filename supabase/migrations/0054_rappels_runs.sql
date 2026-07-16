-- Tracks which calendar day the rappels (formations/parc matériel/anniversaires)
-- have already run for, so the check can be triggered automatically on
-- every app page load (see maybeRunDailyRappels) instead of requiring a
-- manual button click or a working Vercel cron — the unique run_date
-- constraint means only the first request of the day actually executes it,
-- every later one that day just fails to insert and skips.
create table rappels_runs (
  run_date date primary key,
  created_at timestamptz not null default now()
);

alter table rappels_runs enable row level security;

create policy "rappels_runs_all" on rappels_runs for all to authenticated using (true) with check (true);
