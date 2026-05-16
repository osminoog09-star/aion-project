# GitHub → Expo EAS → OTA (production pipeline)

## Repository safety (Driver ≠ Portal)

| Проект | Deploy | Canonical remote |
|--------|--------|------------------|
| **AION Portal** (Next.js) | Vercel `main` | `osminoog09-star/aion-project` |
| **AION Driver** (Expo) | EAS build + OTA | **отдельный Driver repo** или подпапка монорепо |

**Не пушить Driver из корня Expo в `aion-project`** — это перезапишет portal production.

```bash
npm run repo:verify        # CI: tree + scripts isolation
npm run repo:verify:push   # перед git push: блок если origin = portal repo
```

Driver `origin` должен указывать на **Driver repository** (не на portal), если репозитории раздельные. EAS → GitHub: Base directory = корень Driver (или `apps/driver` в монорепо).

```bash
git remote -v
# origin  https://github.com/osminoog09-star/<DRIVER_REPO>.git
```

## Ветки

| Ветка | CI | OTA |
|--------|----|-----|
| **`main`** | Push + PR: validate, export smoke | Только **вручную** (`OTA Production`) → канал **production** |
| **`preview`**, **`preview-ota`** | То же (PR в `preview`) | **Авто** push → `eas update --channel preview` |
| feature / develop | PR в `main` / `preview` | Локально + dev client (`development` в `eas.json`) |

Автоматический OTA с **`main`** в канал **preview** отключён намеренно: стабильные обновления для публики идут только через **production** workflow.

## Каналы EAS Update

| Канал | Назначение | Кто публикует |
|--------|------------|----------------|
| **development** | Локально / dev client | `eas update --channel development` с машины |
| **preview** | Beta для internal / preview APK | Push в `preview` / `preview-ota` (workflow **OTA Preview**) |
| **production** | Стабильные обновления для production APK | **Actions → OTA Production** (environment `production`) |

Профили сборки: `eas.json` (`preview`, `preview-ota`, `production`, `development`).

- **EAS CLI:** не добавлять `eas-cli` в `dependencies` / `devDependencies` — `expo-doctor` ругается. Используйте **`npx eas-cli@latest`** (как в `package.json` scripts) или глобальную установку.

## Preview APK и runtimeVersion (нативные изменения)

- **`runtimeVersion`** в `app.config.ts`: политика **`appVersion`** → строка runtime = **`expo.version`** (сейчас **1.0.4**). Любой новый APK и OTA на него должны совпадать по этой строке.
- **`android.versionCode`** — вручную в `app.config.ts` при **нативных** изменениях (maps, navigation-bar, плагины…). Поле **`autoIncrement`** в `eas.json` **не используется** с `app.config.ts` (EAS выдаёт ошибку) — инкремент только в конфиге.
- **Обновления URL OTA:** `updates.url` = `https://u.expo.dev/<projectId>` — совпадает с `extra.eas.projectId`.
- После выхода **нового preview APK** все OTA на канал **`preview`** для теста должны таргетить **`runtimeVersion` = `1.0.4`** (команды `ship:preview` / CI как сейчас).

**Публичный JSON-манифест APK (preview):** после деплоя портала — `https://aion-com.vercel.app/apk-manifest.preview.json`. В EAS для клиента задайте `EXPO_PUBLIC_APK_MANIFEST_URL` на этот URL; в JSON поле `apkUrl` должно указывать на **реальный** `.apk` артефакт (`eas build:view <id> --json` после `FINISHED`). Автозапись полей манифеста из EAS: в репозитории **`aion-project`** выполните `npm run release:apk-manifest:sync <buildId>` (нужен `eas`/`EXPO_TOKEN` в CI) или workflow **apk-manifest-from-eas**.

Текущая сборка (пример): логи и статус — [expo.dev build](https://expo.dev/accounts/osminoog/projects/aion/builds/9176f99c-dd21-4318-8c97-be5c85b0ee78). Проверка: `npx eas-cli@latest build:view 9176f99c-dd21-4318-8c97-be5c85b0ee78`.

## Секреты GitHub (Actions)

| Secret | Назначение |
|--------|------------|
| **`EXPO_TOKEN`** | Обязателен для OTA и EAS Build в CI ([Expo access token](https://expo.dev/accounts/[account]/settings/access-tokens)) |
| **`SENTRY_AUTH_TOKEN`** | Опционально, если добавите upload source maps в CI (сейчас не используется в workflows) |
| **Supabase** | В репозиторий **не** класть `service_role`. Для билдов — только **EAS Secrets** / env в dashboard для `EXPO_PUBLIC_SUPABASE_*` |

**Запрещено:** коммитить `.env`, токены в `app.config.ts`, PEM ключи подписи. См. `.gitignore` и `.env.example`.

## Workflows (`.github/workflows`)

| Файл | Триггер |
|------|---------|
| **`ci.yml`** | push/PR на `main`, `master`, `preview` + ручной dispatch — validate + `expo export` |
| **`ota-preview-on-push.yml`** | push на **`preview`** или **`preview-ota`** → OTA **preview** + changelog из git |
| **`ota-production.yml`** | **workflow_dispatch** → OTA **production** (environment **`production`** — можно включить required reviewers) |
| **`eas-update.yml`** | Ручной dispatch (любой channel) или теги **`ota-preview*`** / **`ota-production*`** |
| **`eas-build-android-preview.yml`** | Ручной → `eas build` profile **preview** (`--no-wait`) |
| **`eas-build-android-production.yml`** | Ручной → profile **production** (`--no-wait`), environment **production** |

Логи: вкладка **Actions** → выбранный run → шаги; сводка OTA — в **Summary** (GitHub Job Summary).

## Expo ↔ GitHub

В [expo.dev](https://expo.dev) → проект **AION** (`slug` в `app.config.ts`) → подключите репозиторий **`osminoog09-star/aion-project`**, укажите корректную ветку по умолчанию и **root** (корень репозитория, если монорепо — подпапку).

## Метаданные OTA

Во всех OTA-шагах CI выставляется **`EXPO_PUBLIC_GIT_COMMIT=${{ github.sha }}`** (см. `app.config.ts` → `extra.ota`). Сообщение для `eas update --message` собирается из **последнего коммита** и **краткого changelog** (`git log`).

## Быстрый цикл разработки

### Автономный ship (рекомендуется)

Скрипт **`scripts/dev/ship.mjs`**: **validate → `git add -A` → conventional commit → push → (опционально) локальный EAS OTA**.

| Скрипт | Поведение |
|--------|-----------|
| **`npm run ship:preview`** | `npm run validate`, затем коммит с авто-сообщением, **`git push origin HEAD:preview`** → GitHub **OTA Preview** на канал `preview`. |
| **`npm run ship:main`** | То же, push в **`main`** → CI validate + export; **без** preview OTA. |
| **`npm run release:preview`** | Как `ship:preview`, плюс **`eas update --channel preview`** локально (нужен `eas login` / токен) для мгновенного теста на телефоне параллельно с CI. |
| **`npm run release:production`** | Алиас **`ship:main`**: стабильный **production** OTA только вручную в GitHub (**OTA Production**), не из этого скрипта. |
| **`npm run ship:dry`** | Только validate + превью сообщения коммита (`--dry-run --no-push`). |
| **`npm run dev:git-status`** | `git status -sb` |

При ошибке **validate**, **git** или **EAS** — push/OTA не выполняются; в терминале выводится блок с причиной.

Артефакты последнего прогона (для отладки): **`dist/ship/last-metadata.json`**, **`last-summary.txt`**, **`last-ota-message.txt`** (каталог в `.gitignore`).

Флаги вручную: `node scripts/dev/ship.mjs preview --message="fix: сеть" --no-push --local-ota` и т.д. (см. заголовок в `ship.mjs`).

### Ручной push (как раньше)

1. **`npm run push:preview`** после своего коммита → тот же триггер **OTA Preview** в CI.
2. **`npm run push:main`** → CI на `main`.
3. **Production OTA:** GitHub → **Actions** → **OTA Production** → Run.

### npm scripts (локально)

| Скрипт | Действие |
|--------|----------|
| `npm run push:preview` | `git push -u origin HEAD:preview` (без validate; для совместимости) |
| `npm run push:main` | `git push -u origin HEAD:main` |
| `npm run ota:preview` | Только локально: `eas update --channel preview` |
| `npm run ota:production` | Только локально: `eas update --channel production` |
| `npm run validate` | typecheck + expo-doctor |

## Как работает OTA в приложении

- **expo-updates** включён; **`checkAutomatically: "NEVER"`** — проверки из JS (`hooks/useUpdatesController.ts`): старт, resume, сеть, периодический poll в preview-режиме.
- Канал OTA задаётся **нативным билдом** (`eas.json` → `channel`: `preview` / `production` / `development`).
- **Preview APK** (`preview` или `preview-ota` профиль) получает обновления с канала **preview**; **production APK** — с канала **production**.
- **`EXPO_PUBLIC_OTA_PREVIEW_TEST=1`** (профиль `preview-ota`) — ускоренные проверки и баннерный UX; **`EXPO_PUBLIC_OTA_DISCRETE_BANNER=1`** — тихий баннер + предзагрузка без смены канала.
- После загрузки бандла **`reloadToApplyUpdate`** (`services/updateService.ts`) выставляет фон **`#030712`** и перезапускает runtime.
- Ручная проверка: **`/ota-debug`** или `checkNow` / `checkNowForce` из контекста обновлений.

## Как тестировать OTA

1. Соберите APK с нужным каналом (`eas build --profile preview` или `production`).
2. Выложите **preview** OTA: push в ветку **`preview`** (или `npm run ota:preview` с машины при логине EAS).
3. Откройте приложение на устройстве → через короткое время должен появиться update (или используйте **Проверить обновления** на `/ota-debug`).

## Production release (чеклист)

1. Код в **`main`**, CI зелёный.
2. **OTA:** Actions → **OTA Production** → при необходимости введите сообщение → Run.
3. При смене нативных зависимостей / `expo.version` — новый **`eas build`** profile **production**, затем снова OTA на тот же **`runtimeVersion`** (политика `appVersion` в `app.config.ts`).

## Проверка локально перед push

```bash
npm ci
npm run validate
```
