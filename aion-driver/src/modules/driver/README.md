# Модуль Driver (AION)

Домен: смены такси, доход, OCR импорт выплат, гараж, локальные AI-инсайты, карта.

## Код

Логика сосредоточена в `features/trips`, `features/import`, `features/vehicles`, `features/ai`, `screens/DashboardScreen.tsx` и т.д. Маршрут приложения: `/driver` → `app/(aion)/driver/(tabs)/`.

## Дальнейший перенос

По мере роста платформы переносите driver-only файлы сюда (`src/modules/driver/...`) с обновлением импортов; общее оставляйте в `src/core` и `features/cloud`.
