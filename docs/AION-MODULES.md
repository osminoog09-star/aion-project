# AION — структура проекта (модули)

**Всё через один проект AION** — репозиторий `osminoog09-star/aion-project` (локально папка `aion-com`).

## Каноническая структура

```
Проекты/
  aion-com/                 ← корень проекта AION (portal + CI + governance)
    aion-driver/            ← модуль Driver (Expo, EAS, OTA)
    src/                    ← portal Next.js
    public/
    .github/workflows/
    shared/                 ← при необходимости (или ../shared на диске)
```

**Не использовать** отдельную соседнюю папку `Проекты/aion-driver` для новой работы — она legacy.

## Модули

| Модуль | Путь | Назначение |
|--------|------|------------|
| Portal | `src/`, корень | Operations, governance, releases |
| **aion-driver** | `aion-driver/` | Mobile app, EAS build |
| shared | `../shared` или в репо | runtime-compatibility |

## Команды Driver

```bash
cd aion-com/aion-driver
npm run build:manifest
npm run validate:code
```

Из корня portal:

```bash
cd aion-com
node scripts/resolve-aion-driver-path.mjs   # печатает путь к модулю
npm run repo:verify:modules
```

## CI / EAS

Workflow: `.github/workflows/eas-build-driver-preview.yml`  
Рабочая директория: `aion-driver/` в том же репозитории.

## Переменные

- `AION_DRIVER_MODULE_PATH` — override (default: `aion-driver` внутри проекта)
