/**
 * Флаги для beta / QA. Часть включается через EXPO_PUBLIC_* в EAS.
 */
export const featureFlags = {
  /** Показать пункт «Отладка» в настройках и экран /debug */
  debugMenu:
    __DEV__ ||
    (typeof process !== "undefined" &&
      process.env.EXPO_PUBLIC_DEBUG_MENU === "1"),
  /** Подробные логи в консоль (не Sentry) */
  verboseConsole: __DEV__,
  /** Водяной знак BETA (внутренние сборки) */
  betaWatermark:
    typeof process !== "undefined" && process.env.EXPO_PUBLIC_BETA_WATERMARK === "1",
  /** Компактный QA HUD: сеть, канал OTA, очередь синка */
  qaHud: typeof process !== "undefined" && process.env.EXPO_PUBLIC_QA_HUD === "1",
  /** Мини-HUD AION Core (Jarvis-стиль) */
  aionHud: typeof process !== "undefined" && process.env.EXPO_PUBLIC_AION_HUD === "1",
  /** Короткая boot-анимация при старте сессии (__DEV__ или EXPO_PUBLIC_AION_BOOT=1) */
  aionBoot:
    __DEV__ ||
    (typeof process !== "undefined" && process.env.EXPO_PUBLIC_AION_BOOT === "1"),
  /** QA: mock OCR (EXPO_PUBLIC_OCR_DEV_MOCK=1). Не использовать как реальные данные. */
  ocrDevMock:
    typeof process !== "undefined" && process.env.EXPO_PUBLIC_OCR_DEV_MOCK === "1",
} as const;
