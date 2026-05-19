-- Driver bug reports + AION Link pairing/snapshots (idempotent SoT for remote apply).

create table if not exists public.driver_bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  category text not null default 'other',
  description text not null,
  diagnostics jsonb not null default '{}'::jsonb,
  app_version text,
  platform text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists driver_bug_reports_created_idx
  on public.driver_bug_reports (created_at desc);

alter table public.driver_bug_reports enable row level security;

drop policy if exists driver_bug_reports_insert_own on public.driver_bug_reports;
create policy driver_bug_reports_insert_own
  on public.driver_bug_reports for insert
  to authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists driver_bug_reports_select_own on public.driver_bug_reports;
create policy driver_bug_reports_select_own
  on public.driver_bug_reports for select
  to authenticated
  using (user_id is null or user_id = auth.uid());

-- Service role / ops reads via portal service key bypass RLS.
-- link_pair_tokens / link_snapshots: создаются отдельными миграциями (см. database.types.ts).
