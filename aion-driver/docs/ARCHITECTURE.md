# Архитектура AION (modular super-app)

## Роль репозитория

Один клиент **AION** — экосистемная платформа. **Driver** — первый live-модуль (смены, OCR, доход, карта). Остальные модули подключаются через реестр `src/core/modules/registry.ts` и UI хаба `screens/AionHomeHubScreen.tsx` (маршрут `/home`; Driver — `/driver`).

## Маршрутизация (Expo Router)

| Маршрут | Назначение |
|--------|------------|
| `/home` | Главный хаб экосистемы (launcher модулей) |
| `/driver` | Модуль Driver (табы кокпита) |
| `/settings`, `/map`, `/onboarding`, … | Глобальные экраны платформы |

Группа `app/(aion)/` — корневой layout платформы (stack: `home`, `driver`).

## Каталоги

- `src/core/` — реестр модулей, контракты расширения (без тяжёлой логики).
- `src/modules/driver/` — документация домена Driver; код модуля пока в `features/*`, `screens/*` (постепенный перенос).
- `src/shared/` — зарезервировано под общие утилиты вне `tokens/` (дизайн-система остаётся в `tokens/`).
- `storage/core/` — OTA, ключи устройства, мета синка платформы.
- `storage/driver/` — профиль смен, история, OCR-импорты (домен Driver).
- `features/cloud/` — Supabase: RLS и таблицы остаются совместимыми; новые сущности снабжайте префиксом модуля или отдельной схемой в миграциях.

## Не ломать

Поведение **OTA**, **auth**, **sync**, **Sentry**, **onboarding** и экранов Driver сохранено; изменены только точки входа навигации и нейминг приложения в `app.config.ts`.

## CI / EAS

См. **`docs/PIPELINE.md`** — GitHub Actions, каналы preview/production, секреты `EXPO_TOKEN`, ветки, ручной production OTA, тестирование OTA и production release.
