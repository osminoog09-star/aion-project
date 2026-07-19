-- Диагностическая (ВРЕМЕННАЯ) табличка: приложение заливает сюда сырые тексты,
-- пойманные от Bolt (уведомления + читалка экрана), чтобы автор мог сверить
-- реальные форматы и настроить авто-запись заказов. Можно удалить после сверки.
--
-- RLS открыт (anon insert + select), потому что приложение пишет анонимным
-- ключом и внешний помощник читает тем же ключом. Данные — транзиентные
-- образцы уведомлений Bolt; не хранить долго.

create table if not exists public.bolt_capture_samples (
  id bigint generated always as identity primary key,
  source text,
  title text,
  text text,
  captured_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.bolt_capture_samples enable row level security;

drop policy if exists "bolt_capture_insert" on public.bolt_capture_samples;
create policy "bolt_capture_insert"
  on public.bolt_capture_samples
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "bolt_capture_select" on public.bolt_capture_samples;
create policy "bolt_capture_select"
  on public.bolt_capture_samples
  for select
  to anon, authenticated
  using (true);

create index if not exists bolt_capture_samples_created_at_idx
  on public.bolt_capture_samples (created_at desc);
