# AION Core

Центральное AI-ядро экосистемы AION: идентичность платформы, оркестрация модулей, диагностика, OTA и «память» без облачного LLM на первом этапе.

## Personality

AION Core говорит коротко, уверенно и без маркетингового шума. Тон — **премиальный, футуристичный, инженерный**: система партнёр, а не болтливый чат-бот. Копирайт по умолчанию см. `src/core/aion/personality/persona.ts` (`AION_PERSONA`).

## Mission

- Единая **control room** для модулей (Driver, Finance, Fleet, …).
- Предсказуемые **состояния** (сеть, синк, OTA, здоровье модулей).
- **Безопасная эволюция**: OTA и каналы не ломают локальные данные без явного сценария.

## Ecosystem philosophy

- **Driver** — первый живой модуль; остальные подключаются через реестр (`src/core/aion/modules/registry.ts`).
- Модули **слабо связаны**: общий контракт метаданных, собственные маршруты и данные.
- **Cloud** — опциональное ускорение, не единственный источник правды для мобильного UX.

## UI philosophy

- **Glass + глубина** без «Expo demo»: градиенты, свечение, слои — умеренно, без стека blur на каждый пиксель.
- **Орб** как живой индикатор состояния (`components/aion/AionCoreOrb.tsx`).
- **HUD** — минимальный, по флагу `EXPO_PUBLIC_AION_HUD` (`components/aion/AionHud.tsx`).

## AI behavior (без cloud AI)

- Рекомендации строятся **эвристиками** из снимка диагностики (`deriveRecommendations`).
- **Память**: типы в `memoryTypes.ts`; персонализация UI — `deriveAdaptiveUiHints` (`adaptiveUi.ts`).
- Лента событий — локальный журнал (`storage/core/aionTimelineStorage.ts`).

## Naming conventions

- Префикс **Aion** для публичных типов/компонентов Core (`AionCoreOrb`, `AionDiagnosticsSnapshot`).
- Пути **`src/core/aion/**`** — платформенный слой; **`features/**`** — продуктовые вертикали.
- Маршруты диагностики: **`/aion-diagnostics`**, хаб: **`/home`**.

## Module philosophy

- Каждый модуль: `readiness`, `category`, `health`, `dependsOn`, `accent`, опционально `href`.
- Статусы готовности: `live` | `beta` | `alpha` | `experimental` | `coming_soon`.
- Навигация из хаба разрешена для **`live` и `beta`**, если задан `href`.

## OTA philosophy

- Каналы и runtime — часть **идентичности** сборки; Core отображает фазу, pending update и tier канала.
- Применение OTA логируется в **timeline** перед `reloadAsync` (см. `services/updateService.ts`).
- Подробный UI остаётся в `UpdateGate` / `UpdatesContext`; Core только **наблюдает и диагностирует**.

## Future expansion

- GitHub Actions / CI статусы: заглушка `getDevOpsStatusStub` → реальный API badges.
- Облачный **AION AI** поверх тех же контрактов памяти и рекомендаций.
- Маркетплейс модулей и политики доступа по ролям.

---

*Документ живой: меняется вместе с `src/core/aion` и маршрутами приложения.*
