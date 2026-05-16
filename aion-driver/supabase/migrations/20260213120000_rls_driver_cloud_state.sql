-- AION Driver: RLS + driver_cloud_state
-- Применить в Supabase SQL Editor или через CLI.
-- Требует существующих таблиц public.profiles, trips, vehicles, … из вашей схемы.

-- ---------------------------------------------------------------------------
-- driver_cloud_state: JSON-снимок настроек / онбординга / флагов (расширяемо)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.driver_cloud_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_cloud_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_cloud_state_select_own" ON public.driver_cloud_state;
CREATE POLICY "driver_cloud_state_select_own"
  ON public.driver_cloud_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "driver_cloud_state_insert_own" ON public.driver_cloud_state;
CREATE POLICY "driver_cloud_state_insert_own"
  ON public.driver_cloud_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "driver_cloud_state_update_own" ON public.driver_cloud_state;
CREATE POLICY "driver_cloud_state_update_own"
  ON public.driver_cloud_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "driver_cloud_state_delete_own" ON public.driver_cloud_state;
CREATE POLICY "driver_cloud_state_delete_own"
  ON public.driver_cloud_state FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- profiles (если ещё без RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trips_select_own" ON public.trips;
CREATE POLICY "trips_select_own"
  ON public.trips FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_insert_own" ON public.trips;
CREATE POLICY "trips_insert_own"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_update_own" ON public.trips;
CREATE POLICY "trips_update_own"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_delete_own" ON public.trips;
CREATE POLICY "trips_delete_own"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles_select_own" ON public.vehicles;
CREATE POLICY "vehicles_select_own"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vehicles_insert_own" ON public.vehicles;
CREATE POLICY "vehicles_insert_own"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vehicles_update_own" ON public.vehicles;
CREATE POLICY "vehicles_update_own"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vehicles_delete_own" ON public.vehicles;
CREATE POLICY "vehicles_delete_own"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- favourite_stations, expenses, fuel_entries, analytics_snapshots, notifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.favourite_stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favourite_stations_own" ON public.favourite_stations;
CREATE POLICY "favourite_stations_own"
  ON public.favourite_stations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_own" ON public.expenses;
CREATE POLICY "expenses_own"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fuel_entries_own" ON public.fuel_entries;
CREATE POLICY "fuel_entries_own"
  ON public.fuel_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_snapshots_own" ON public.analytics_snapshots;
CREATE POLICY "analytics_snapshots_own"
  ON public.analytics_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
