import * as Updates from "expo-updates";

export type OtaChannelTier = "development" | "preview" | "production";

/** Канал EAS Update для подписей в UI / QA (не путать с веткой git). */
export function getOtaChannelTier(): OtaChannelTier {
  if (__DEV__) return "development";
  const ch = (Updates.channel ?? "").toLowerCase();
  if (ch === "preview") return "preview";
  if (ch === "development" || ch === "dev") return "development";
  return "production";
}

/**
 * Режим быстрого тестирования OTA на **preview channel** (release / preview APK, не Expo Go).
 *
 * Включить: `EXPO_PUBLIC_OTA_PREVIEW_TEST=1` в профиле EAS build `preview-ota` (см. eas.json).
 */
export function isOtaPreviewTestMode(): boolean {
  return process.env.EXPO_PUBLIC_OTA_PREVIEW_TEST === "1";
}

/**
 * Ненавязчивый OTA: баннер + тихая предзагрузка (как для preview), но без смены канала.
 * Подходит для internal production APK, если не хотите полноэкранную модалку сразу.
 *
 * `EXPO_PUBLIC_OTA_DISCRETE_BANNER=1` в env профиля EAS build.
 */
export function isOtaDiscreteBannerMode(): boolean {
  return process.env.EXPO_PUBLIC_OTA_DISCRETE_BANNER === "1";
}

/** Preview-тест или discrete: одинаковый «лёгкий» UI-поток баннера. */
export function useDiscreteOtaBannerFlow(): boolean {
  return isOtaPreviewTestMode() || isOtaDiscreteBannerMode();
}

/** Минимальный интервал между проверками (ручные checkNow учитывают force). */
export function getOtaMinCheckGapMs(): number {
  return isOtaPreviewTestMode() ? 8_000 : 45_000;
}

/** Фоновый интервал: в preview — 90 с; в prod — 4 ч. */
export function getOtaPeriodicCheckMs(): number {
  return isOtaPreviewTestMode() ? 90_000 : 4 * 60 * 60 * 1000;
}

/** Задержка первой проверки после старта. */
export function getOtaStartupCheckDelayMs(): number {
  return isOtaPreviewTestMode() ? 400 : 2_000;
}
