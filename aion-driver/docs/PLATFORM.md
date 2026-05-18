# AION Driver — платформа (архитектура и дорожная карта)

Документ фиксирует **production-grade каркас**: офлайн-first, облако Supabase, AI-слой, расширяемые модули. Полный продукт из спецификации заказчика — **поэтапное** наращивание поверх этих слоёв.

## Слои (текущее состояние)

| Слой | Статус | Путь / заметки |
|------|--------|----------------|
| Expo SDK 52, Router, OTA | Готово | `app.config.ts`, `eas.json` |
| TanStack Query + persist `cloud:*` | Готово | `PersistQueryClientProvider`, `lib/queryKeys.ts`, AsyncStorage persister |
| Supabase typed client | Готово | `lib/supabase.ts`, `lib/database.types.ts`, `lib/supabaseSecureStorage.ts` |
| Auth (email, Google, Apple, guest) | MVP | `features/auth/context/AuthContext.tsx`, PKCE OAuth; Google: `npm run auth:google-setup` + Supabase Providers |
| Гараж облако / локально | MVP | `features/vehicles/hooks/useGarage.ts`, `features/cloud/repositories/vehiclesRepository.ts` |
| Поездки trips + офлайн-очередь | MVP | `features/cloud/repositories/tripsRepository.ts`, `features/sync/services/syncEngine.ts`, `CloudSyncBootstrap` |
| Сеть | Каркас | `features/sync/hooks/useNetworkStatus.ts` |
| AI (локальные эвристики) | MVP | `features/ai/services/aiInsightsService.ts`, `app/(aion)/driver/(tabs)/hub.tsx` |
| SQL / RLS | Расширено | `20250514120000_platform_core.sql`, `20250515120000_user_data_layer.sql` |
| Валюты | Утилита | `core/utils/formatCurrency.ts`, `core/constants/currencies.ts` |
| Импорт OCR (Bolt/Uber/…) | MVP | `screens/ImportScreenshotScreen.tsx`, `features/import/*`, локальное хранение |
| Онбординг 6 шагов | MVP | `screens/OnboardingScreen.tsx`, страна/валюта, каталог ТС |

## Дорожная карта (крупные блоки)

1. **Smart Car** — импорт полного каталога (файл / Edge API), VIN, расход по циклам WLTP, пользовательские правки.
2. **Гео + топливо** — провайдер цен (Edge + кэш), карты (`expo-maps` или MapLibre), избранные АЗС, история цен.
3. **Auth** — довести magic link, linking гостя к аккаунту, политика сессий.
4. **Синк** — конфликт-резолвер по `updated_at`, vehicle_upsert в sync engine, фоновый worker.
5. **AI Premium** — Edge Function + модель; trip summaries, monthly reports, anomaly detection.
6. **Push** — `expo-notifications`, сегменты каналов preview/production.
7. **Экспорт** — PDF/CSV (нативный share), налоговые шаблоны.
8. **Монетизация** — RevenueCat / Stripe Customer Portal; feature flags в `extra`.
9. **Fleet** — роли owner/driver, отдельная схема БД и политики RLS.

## Безопасность

- Только **anon** ключ в клиенте; **RLS** на всех таблицах в `public` (см. миграцию).
- Не использовать `user_metadata` для авторизации в RLS (см. Supabase security guidelines).

## DevOps

- CI: `.github/workflows/ci.yml` — `npm ci`, validate, `expo export`.
- EAS: профили `preview` / `production`, каналы OTA, internal APK.
