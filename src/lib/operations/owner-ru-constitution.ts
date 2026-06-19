/**
 * Конституция UX владельца: только русский в интерфейсе.
 * Код/API/пути — English допустимы во вторичных блоках.
 */

export const OWNER_LANGUAGE_RULE =
  "Владелец видит только русский. Английский — код, API, хеши, пути (свёрнуто).";

export const SUBSYSTEM_TITLES_RU: Record<string, string> = {
  "driver-intelligence": "Интеллект водителя",
  "gps-route": "GPS и маршруты",
  "aion-maps": "AION Maps & Runtime OS",
  "fuel-cost": "Топливо и себестоимость",
  ocr: "OCR и чеки",
  "overlay-hud": "Оверлей HUD",
  "runtime-apk": "Смена и APK",
  "ecosystem-ai": "Экосистема и AI-центр",
  deployment: "Деплой и production",
};

export const AUTONOMOUS_QUEUE_RU = [
  { order: 1, titleRu: "UX маршрутов и field validation", subsystemId: "gps-route" },
  { order: 2, titleRu: "Проверка stop-zone на устройстве", subsystemId: "driver-intelligence" },
  { order: 3, titleRu: "Стабилизация runtime (FGS + смена)", subsystemId: "runtime-apk" },
  { order: 4, titleRu: "Overlay HUD v2", subsystemId: "overlay-hud" },
  { order: 5, titleRu: "Надёжность APK / release loop", subsystemId: "runtime-apk" },
  { order: 6, titleRu: "Тепловые карты (после GPS SoT)", subsystemId: "gps-route" },
  { order: 7, titleRu: "Движок AI-рекомендаций", subsystemId: "driver-intelligence" },
] as const;

/** Перевод типичных runtime-задач с английского */
export function humanizeTaskRu(task: string): string {
  const t = task.trim();
  const map: [RegExp, string][] = [
    [/route intelligence/i, "Улучшение аналитики маршрутов"],
    [/field validation/i, "Проверка на реальном устройстве"],
    [/stop[- ]?zone/i, "Анализ зон остановок GPS"],
    [/backfill/i, "Восстановление исторической аналитики"],
    [/deployment/i, "Обновление production"],
    [/self[- ]?heal/i, "Автовосстановление системы"],
    [/Owner Command Center/i, "Центр управления владельца"],
    [/live orchestration/i, "Живое исполнение AI"],
  ];
  for (const [re, ru] of map) {
    if (re.test(t)) return ru;
  }
  return t;
}

export function humanizeNextStepRu(step: string): string {
  const map: [RegExp, string][] = [
    [/OTA/i, "Тест обновления на телефоне"],
    [/physical device/i, "Проверка на устройстве"],
    [/continue roadmap/i, "Продолжить roadmap автоматически"],
    [/execution:heal/i, "Запустить автовосстановление"],
    [/npm run build/i, "Собрать и проверить приложение"],
    [/deploy:validate/i, "Проверить сайт на production"],
  ];
  for (const [re, ru] of map) {
    if (re.test(step)) return ru;
  }
  return humanizeTaskRu(step);
}

export const NARRATION_TEMPLATES: Record<string, { icon: string; title: string }> = {
  coding: { icon: "⚡", title: "AI пишет и улучшает продукт" },
  validating: { icon: "✅", title: "AI проверяет качество" },
  deploying: { icon: "🚀", title: "AI выкладывает на production" },
  recovering: { icon: "🛠", title: "AI восстанавливает систему" },
  blocked: { icon: "🛑", title: "AI остановлен — нужна помощь" },
  completed: { icon: "✨", title: "AI успешно завершил этап" },
  analyzing: { icon: "🔍", title: "AI анализирует систему" },
  planning: { icon: "📋", title: "AI планирует следующие шаги" },
};
