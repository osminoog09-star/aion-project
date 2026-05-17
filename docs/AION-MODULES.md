# AION — структура проекта (модули)

**Один проект:** папка `aion-com` (= GitHub `osminoog09-star/aion-project`).

```
Проекты/
  aion-com/                 ← ПРОЕКТ AION (открывать в Cursor / git)
    aion-driver/            ← модуль Driver — ЕДИНСТВЕННОЕ место
    src/
    public/
    .github/
```

**Нет** отдельной папки `Проекты/aion-driver` на одном уровне с `aion-com`.

## Команды Driver

```bash
cd aion-com/aion-driver
npm install
npm run build:manifest
```

Из корня portal:

```bash
cd aion-com
npm run repo:verify:modules
```

## CI

Workflow: `.github/workflows/eas-build-driver-preview.yml` → `working-directory: aion-driver/`
