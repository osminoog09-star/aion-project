# AION

Экосистема модулей: **Driver** (готов, им можно пользоваться) · Studio (в разработке) · AI / Core / Link (в планах).

В этом репозитории два проекта:

| Папка | Что это | Стек |
|---|---|---|
| корень (`src/`) | Публичный портал [aion.com](https://www.aion.com): обзор платформы, план развития, релизы, центр управления | Next.js 16 · React 19 · Tailwind v4 · Supabase |
| [`aion-driver/`](./aion-driver) | Мобильное приложение водителя: смены, GPS-километраж, чеки топлива, реальная прибыль | Expo 52 · React Native 0.76 · Android |

## Запуск

```bash
# Портал
npm install
npm run dev            # http://localhost:3000

# Driver (из aion-driver/)
npm install
npm run start          # Expo
```

Шаблон окружения: `.env.example` → `.env.local`.

## Проверки (обязательны перед пушем)

```bash
# Портал (из корня)
npm run lint && npm run build && npm run repo:verify

# Driver (из aion-driver/)
npm run validate:code   # typecheck + все CI-тесты
```

Принцип проекта: **никаких выдуманных данных** — метрики и проценты показываются только из реальных источников; отсутствующие данные остаются отсутствующими.

## Документация

- [docs/AION-MODULES.md](./docs/AION-MODULES.md) — модули экосистемы
- [DEPLOY.md](./DEPLOY.md) — продакшен (Vercel, env, Supabase, релизы/манифест)
- [DOMAIN.md](./DOMAIN.md) — DNS, SSL, редиректы
- [docs/TAXI_PLAN.md](./docs/TAXI_PLAN.md) — планируемая функция «Где таксовать»
- [docs/ADR-road-matching.md](./docs/ADR-road-matching.md) — проект привязки GPS-треков к дорогам
