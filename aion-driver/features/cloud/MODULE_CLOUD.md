# Cloud layer (module-aware)

- Репозитории в `features/cloud/repositories/*` уже разделены по сущностям (trips, vehicles, profile).
- Новые модули: добавляйте репозитории с префиксом домена (`financeLedgerRepository.ts`) и отдельные ключи React Query в `lib/queryKeys.ts`.
- RLS в Supabase должен явно разделять доступ по `user_id`; при общих таблицах добавляйте колонку `module` только если это упрощает аналитику (не обязательно для MVP).
