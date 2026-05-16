-- AION Driver: пользовательские данные, метрики поездок, топливо, уведомления, RLS.
-- Идемпотентно для повторного применения в dev.

alter table public.profiles
  add column if not exists locale text;

alter table public.trips
  add column if not exists client_ref text,
  add column if not exists earnings numeric(14, 4),
  add column if not exists expenses_total numeric(14, 4),
  add column if not exists distance_km numeric(14, 4),
  add column if not exists duration_seconds integer,
  add column if not exists fuel_liters_equivalent numeric(14, 4),
  add column if not exists profit_per_hour numeric(14, 4),
  add column if not exists profit_per_km numeric(14, 6);

create unique index if not exists trips_user_client_ref_key
  on public.trips (user_id, client_ref)
  where client_ref is not null;

create index if not exists trips_user_started_idx
  on public.trips (user_id, started_at desc);

-- Станции (каталог / community)
create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  external_ref text unique,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  country_code text,
  provider text not null default 'user',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.fuel_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  station_id uuid references public.stations (id) on delete set null,
  fuel_kind text not null,
  volume numeric(14, 4),
  price_per_unit numeric(14, 4),
  total_amount numeric(14, 4),
  currency text not null default 'EUR',
  odometer_km numeric(14, 3),
  note text,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fuel_entries_user_occurred_idx
  on public.fuel_entries (user_id, occurred_at desc);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  category text not null,
  amount numeric(14, 4) not null,
  currency text not null default 'EUR',
  occurred_at timestamptz not null,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_occurred_idx
  on public.expenses (user_id, occurred_at desc);

create table if not exists public.favourite_stations (
  user_id uuid not null references auth.users (id) on delete cascade,
  station_id uuid not null references public.stations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, station_id)
);

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_snapshots_user_idx
  on public.analytics_snapshots (user_id, period_end desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at nulls first, created_at desc);

-- Профиль при регистрации
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists aion_on_auth_user_created on auth.users;
create trigger aion_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- RLS новых таблиц
alter table public.stations enable row level security;
alter table public.fuel_entries enable row level security;
alter table public.expenses enable row level security;
alter table public.favourite_stations enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.notifications enable row level security;

drop policy if exists stations_select_auth on public.stations;
create policy stations_select_auth
  on public.stations for select
  to authenticated
  using (true);

drop policy if exists stations_insert_auth on public.stations;
create policy stations_insert_auth
  on public.stations for insert
  to authenticated
  with check (true);

drop policy if exists fuel_entries_select_own on public.fuel_entries;
create policy fuel_entries_select_own
  on public.fuel_entries for select
  using (auth.uid() = user_id);

drop policy if exists fuel_entries_insert_own on public.fuel_entries;
create policy fuel_entries_insert_own
  on public.fuel_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists fuel_entries_update_own on public.fuel_entries;
create policy fuel_entries_update_own
  on public.fuel_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists fuel_entries_delete_own on public.fuel_entries;
create policy fuel_entries_delete_own
  on public.fuel_entries for delete
  using (auth.uid() = user_id);

drop policy if exists expenses_select_own on public.expenses;
create policy expenses_select_own
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists expenses_insert_own on public.expenses;
create policy expenses_insert_own
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists expenses_update_own on public.expenses;
create policy expenses_update_own
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists expenses_delete_own on public.expenses;
create policy expenses_delete_own
  on public.expenses for delete
  using (auth.uid() = user_id);

drop policy if exists favourite_stations_select_own on public.favourite_stations;
create policy favourite_stations_select_own
  on public.favourite_stations for select
  using (auth.uid() = user_id);

drop policy if exists favourite_stations_insert_own on public.favourite_stations;
create policy favourite_stations_insert_own
  on public.favourite_stations for insert
  with check (auth.uid() = user_id);

drop policy if exists favourite_stations_delete_own on public.favourite_stations;
create policy favourite_stations_delete_own
  on public.favourite_stations for delete
  using (auth.uid() = user_id);

drop policy if exists analytics_snapshots_select_own on public.analytics_snapshots;
create policy analytics_snapshots_select_own
  on public.analytics_snapshots for select
  using (auth.uid() = user_id);

drop policy if exists analytics_snapshots_insert_own on public.analytics_snapshots;
create policy analytics_snapshots_insert_own
  on public.analytics_snapshots for insert
  with check (auth.uid() = user_id);

drop policy if exists analytics_snapshots_update_own on public.analytics_snapshots;
create policy analytics_snapshots_update_own
  on public.analytics_snapshots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists analytics_snapshots_delete_own on public.analytics_snapshots;
create policy analytics_snapshots_delete_own
  on public.analytics_snapshots for delete
  using (auth.uid() = user_id);

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists notifications_insert_own on public.notifications;
create policy notifications_insert_own
  on public.notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own
  on public.notifications for delete
  using (auth.uid() = user_id);
