# Custom domain — www.aion.com (ecosystem platform)

## Product vs platform

| Layer | URL | Role |
|--------|-----|------|
| **Ecosystem portal** | `https://www.aion.com/` | Главная, навигация, операции, roadmap, статус |
| **Current flagship product** | `https://www.aion.com/aionproject` | Публичный хаб AION Driver (описание, ссылки на релизы; сам клиент — отдельный билд EAS) |
| **Reserved modules** | `/downloads`, `/ai`, `/core`, `/studio`, `/link` | Зарезервированные маршруты под мультипродукт; контент по мере готовности |

Старый путь **`/driver`** → постоянный редирект на **`/aionproject`** (`next.config.ts`), чтобы внешние ссылки и закладки не ломались.

## DNS checklist

- Vercel → Project → **Domains**: добавьте **`www.aion.com`** и при необходимости **`aion.com`** (apex).
- Запишите DNS-записи, которые показывает Vercel (apex **A** на anycast Vercel; **`www`** → **CNAME** на `cname.vercel-dns.com` или указанный хост).
- Ожидание DNS: от минут до 48 ч в зависимости от TTL.

## SSL

- После успешного резолва на Vercel сертификаты **Let’s Encrypt** выдаются и продлеваются автоматически.

## Redirect strategy (canonical)

**Рекомендация для этого репозитория:** канонический хост **`https://www.aion.com`** (платформа и вложенные продукты).

1. В Vercel назначьте **Primary domain** = `www.aion.com`.
2. Включите редирект apex → primary: `aion.com` → `https://www.aion.com` (стандартная опция Vercel).
3. В переменных окружения задайте **`NEXT_PUBLIC_SITE_URL=https://www.aion.com`** (без слэша в конце) и передеплойте — так выровняны `metadataBase`, sitemap, OG.

## Subpath / multi-product

- Один Next.js-проект (repo `aion-project`): сегменты `app/aionproject`, `app/roadmap`, … без `basePath` — проще SEO и ссылки.
- Новые продукты: добавляйте `app/<product>/page.tsx` и константы в `src/lib/ecosystem-routes.ts`.

## SEO (вложенные маршруты)

- У ключевых страниц заданы `metadata.alternates.canonical` на путь относительно `metadataBase` (корневой `layout.tsx`).
- Для новых модулей копируйте шаблон из `EcosystemModuleStub` + `ecosystemModuleMetadata`.

## Validate

- `curl -I https://www.aion.com/aionproject` → `200`.
- `curl -I https://www.aion.com/driver` → `308` (или `301`) → `Location: …/aionproject`.
- Откройте `/robots.txt`, `/sitemap.xml` на проде.
