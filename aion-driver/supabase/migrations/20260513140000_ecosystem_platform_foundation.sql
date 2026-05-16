-- AION ecosystem platform: public snapshots, releases, devices, activity, rollout, changelog, acks.
-- Same Supabase project as AION Driver. RLS: public read only where published/is_public; devices owner-only.
-- Applied to linked Supabase project via dashboard/MCP execute_sql (keep file as source of truth for CLI replay).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Public portal payloads (roadmap, release index, health) — anon may SELECT public rows
-- ---------------------------------------------------------------------------
create table if not exists public.ecosystem_public_snapshots (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint ecosystem_public_snapshots_kind_nonempty check (length(trim(kind)) > 0)
);

create index if not exists ecosystem_public_snapshots_kind_public_updated_idx
  on public.ecosystem_public_snapshots (kind, is_public, updated_at desc);

alter table public.ecosystem_public_snapshots enable row level security;

drop policy if exists ecosystem_public_snapshots_select_public on public.ecosystem_public_snapshots;
create policy ecosystem_public_snapshots_select_public
  on public.ecosystem_public_snapshots for select
  using (is_public = true);

-- ---------------------------------------------------------------------------
-- Devices (authenticated users only)
-- ---------------------------------------------------------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  install_id text not null,
  platform text not null,
  device_model text,
  app_version text,
  last_seen_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devices_install_unique unique (user_id, install_id)
);

create index if not exists devices_user_id_idx on public.devices (user_id);

alter table public.devices enable row level security;

drop policy if exists devices_select_own on public.devices;
create policy devices_select_own on public.devices for select using (auth.uid() = user_id);
drop policy if exists devices_insert_own on public.devices;
create policy devices_insert_own on public.devices for insert with check (auth.uid() = user_id);
drop policy if exists devices_update_own on public.devices;
create policy devices_update_own on public.devices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists devices_delete_own on public.devices;
create policy devices_delete_own on public.devices for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Paired devices
-- ---------------------------------------------------------------------------
create table if not exists public.paired_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_a_id uuid not null references public.devices (id) on delete cascade,
  device_b_id uuid not null references public.devices (id) on delete cascade,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint paired_devices_distinct check (device_a_id <> device_b_id)
);

create index if not exists paired_devices_user_id_idx on public.paired_devices (user_id);

alter table public.paired_devices enable row level security;

drop policy if exists paired_devices_all_own on public.paired_devices;
create policy paired_devices_all_own on public.paired_devices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Device activity
-- ---------------------------------------------------------------------------
create table if not exists public.device_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id uuid not null references public.devices (id) on delete cascade,
  event_kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint device_activity_kind_nonempty check (length(trim(event_kind)) > 0)
);

create index if not exists device_activity_device_created_idx on public.device_activity (device_id, created_at desc);

alter table public.device_activity enable row level security;

drop policy if exists device_activity_select_own on public.device_activity;
create policy device_activity_select_own on public.device_activity for select
  using (auth.uid() = user_id and exists (select 1 from public.devices d where d.id = device_id and d.user_id = auth.uid()));
drop policy if exists device_activity_insert_own on public.device_activity;
create policy device_activity_insert_own on public.device_activity for insert
  with check (auth.uid() = user_id and exists (select 1 from public.devices d where d.id = device_id and d.user_id = auth.uid()));
drop policy if exists device_activity_delete_own on public.device_activity;
create policy device_activity_delete_own on public.device_activity for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Centralized OTA / APK releases (portal + clients)
-- ---------------------------------------------------------------------------
create table if not exists public.ecosystem_release_ota (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  version text not null,
  runtime_version text,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecosystem_release_ota_published_idx on public.ecosystem_release_ota (published, published_at desc);

alter table public.ecosystem_release_ota enable row level security;

drop policy if exists ecosystem_release_ota_select_published on public.ecosystem_release_ota;
create policy ecosystem_release_ota_select_published
  on public.ecosystem_release_ota for select
  using (published = true);

create table if not exists public.ecosystem_release_apk (
  id uuid primary key default gen_random_uuid(),
  latest_version text not null,
  minimum_supported text not null,
  apk_url text not null,
  runtime_version text,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ecosystem_release_apk_url_scheme check (apk_url ~* '^https?://')
);

create index if not exists ecosystem_release_apk_published_idx on public.ecosystem_release_apk (published, published_at desc);

alter table public.ecosystem_release_apk enable row level security;

drop policy if exists ecosystem_release_apk_select_published on public.ecosystem_release_apk;
create policy ecosystem_release_apk_select_published
  on public.ecosystem_release_apk for select
  using (published = true);

-- ---------------------------------------------------------------------------
-- Rollout state (visible slice for portal when marked public)
-- ---------------------------------------------------------------------------
create table if not exists public.ecosystem_rollout_state (
  id uuid primary key default gen_random_uuid(),
  ota_release_id uuid references public.ecosystem_release_ota (id) on delete set null,
  apk_release_id uuid references public.ecosystem_release_apk (id) on delete set null,
  channel text not null,
  rollout_status text not null default 'pending',
  cohort_percentage int not null default 0,
  visible_public boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint ecosystem_rollout_cohort_range check (cohort_percentage >= 0 and cohort_percentage <= 100),
  constraint ecosystem_rollout_one_target check (
    (ota_release_id is not null)::int + (apk_release_id is not null)::int <= 1
  )
);

create index if not exists ecosystem_rollout_public_idx on public.ecosystem_rollout_state (visible_public, updated_at desc);

alter table public.ecosystem_rollout_state enable row level security;

drop policy if exists ecosystem_rollout_state_select_public on public.ecosystem_rollout_state;
create policy ecosystem_rollout_state_select_public
  on public.ecosystem_rollout_state for select
  using (visible_public = true);

-- ---------------------------------------------------------------------------
-- Changelog entries
-- ---------------------------------------------------------------------------
create table if not exists public.ecosystem_changelog_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  semver text,
  released_at timestamptz,
  ota_release_id uuid references public.ecosystem_release_ota (id) on delete set null,
  apk_release_id uuid references public.ecosystem_release_apk (id) on delete set null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecosystem_changelog_published_idx on public.ecosystem_changelog_entries (published, released_at desc nulls last);

alter table public.ecosystem_changelog_entries enable row level security;

drop policy if exists ecosystem_changelog_select_published on public.ecosystem_changelog_entries;
create policy ecosystem_changelog_select_published
  on public.ecosystem_changelog_entries for select
  using (published = true);

-- ---------------------------------------------------------------------------
-- Per-user release ack / viewed (Driver + portal when auth lands)
-- ---------------------------------------------------------------------------
create table if not exists public.ecosystem_release_ack (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ota_release_id uuid references public.ecosystem_release_ota (id) on delete cascade,
  apk_release_id uuid references public.ecosystem_release_apk (id) on delete cascade,
  acked_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  constraint ecosystem_release_ack_one_target check (
    (ota_release_id is not null)::int + (apk_release_id is not null)::int = 1
  )
);

create unique index if not exists ecosystem_release_ack_user_ota_unique
  on public.ecosystem_release_ack (user_id, ota_release_id) where ota_release_id is not null;
create unique index if not exists ecosystem_release_ack_user_apk_unique
  on public.ecosystem_release_ack (user_id, apk_release_id) where apk_release_id is not null;

alter table public.ecosystem_release_ack enable row level security;

drop policy if exists ecosystem_release_ack_select_own on public.ecosystem_release_ack;
create policy ecosystem_release_ack_select_own on public.ecosystem_release_ack for select using (auth.uid() = user_id);
drop policy if exists ecosystem_release_ack_insert_own on public.ecosystem_release_ack;
create policy ecosystem_release_ack_insert_own on public.ecosystem_release_ack for insert with check (auth.uid() = user_id);
drop policy if exists ecosystem_release_ack_update_own on public.ecosystem_release_ack;
create policy ecosystem_release_ack_update_own on public.ecosystem_release_ack for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists ecosystem_release_ack_delete_own on public.ecosystem_release_ack;
create policy ecosystem_release_ack_delete_own on public.ecosystem_release_ack for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Realtime: add tables (idempotent)
-- ---------------------------------------------------------------------------
do $pub$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ecosystem_public_snapshots'
  ) then
    alter publication supabase_realtime add table public.ecosystem_public_snapshots;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ecosystem_release_ota'
  ) then
    alter publication supabase_realtime add table public.ecosystem_release_ota;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ecosystem_release_apk'
  ) then
    alter publication supabase_realtime add table public.ecosystem_release_apk;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ecosystem_rollout_state'
  ) then
    alter publication supabase_realtime add table public.ecosystem_rollout_state;
  end if;
end $pub$;
