# CI / EAS Diagnostic Report

**Date:** 2026-05-16 (updated — monorepo model)  
**Architecture:** **AION = один проект** (`aion-project`), **aion-driver = модуль** внутри него.

---

## Исправление ошибки

Ранее ошибочно предлагался отдельный репозиторий `osminoog09-star/aion-driver`.  
**Неверно.** Driver — модуль экосистемы AION, как Portal и shared.

См. `docs/AION-MODULES.md`.

---

## Почему нет build 1.0.6 в Expo

1. На GitHub в `aion-project` **нет папки `aion-driver/`** (на remote только portal).
2. Workflow **EAS Build Driver (preview)** не был запушен / не запускался.
3. Локально: нет `GITHUB_TOKEN` → autonomous trigger не вызывал API.
4. Local `eas` — SSL на этой машине.

Последний build **1.0.4** — от старой сборки, не от текущего CI.

---

## Целевая структура (монорепо)

```
osminoog09-star/aion-project/
  .github/workflows/
    eas-build-driver-preview.yml   ← EAS для модуля
    portal-build.yml
  src/                             ← portal
  public/
  aion-driver/                     ← модуль Driver (ОБЯЗАТЕЛЕН для CI)
    package.json
    app.config.ts
    ...
```

---

## Что сделать

### 1. Добавить модуль в репозиторий проекта

```bash
# из корня aion-com (portal), скопировать модуль:
# Windows PowerShell example:
Copy-Item -Recurse ..\aion-driver .\aion-driver

cd aion-com
npm run repo:verify:modules
git add aion-driver .github/workflows/eas-build-driver-preview.yml docs/
git commit -m "chore: aion-driver module + EAS preview workflow in AION monorepo"
git push
```

### 2. Secrets на **aion-project**

- `EXPO_TOKEN`

### 3. Запуск

GitHub → Actions → **EAS Build Driver (preview)** → Run workflow

Или с PAT:

```bash
$env:GITHUB_TOKEN = "..."
npm run execution:autonomous-gha:full
```

### 4. После FINISHED

```bash
npm run apk:complete-loop -- <BUILD_ID>
```

---

## Проверки

```bash
npm run ci:eas:diagnostic
npm run repo:verify:modules
```

---

*Один проект AION. Модули внутри. Без отдельного driver repo.*
