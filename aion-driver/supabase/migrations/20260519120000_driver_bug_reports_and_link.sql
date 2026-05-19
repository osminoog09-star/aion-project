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

create table if not exists public.link_pair_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  status text not null default 'pending',
  device_a_id text,
  claimed_by_device_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  claimed_at timestamptz
);

create unique index if not exists link_pair_tokens_user_code_key
  on public.link_pair_tokens (user_id, code);

create index if not exists link_pair_tokens_user_status_idx
  on public.link_pair_tokens (user_id, status);

alter table public.link_pair_tokens enable row level security;

drop policy if exists link_pair_tokens_owner on public.link_pair_tokens;
create policy link_pair_tokens_owner
  on public.link_pair_tokens for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.link_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text,
  source text not null default 'ocr',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists link_snapshots_user_created_idx
  on public.link_snapshots (user_id, created_at desc);

alter table public.link_snapshots enable row level security;

drop policy if exists link_snapshots_owner on public.link_snapshots;
create policy link_snapshots_owner
  on public.link_snapshots for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
