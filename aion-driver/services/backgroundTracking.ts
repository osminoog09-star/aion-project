import type { ActiveShift } from "../types";

/**
 * Слой для фонового трекинга (Android foreground service, BG location).
 *
 * **По умолчанию:** noop-адаптер до `ensureAndroidShiftRuntimeInstalled()` (Android подменяет на FGS-backed task).
 * **Не объявляем** production-ready без field gate — см. BACKGROUND_TRACKING_PRODUCTION_READY.
 */
/** Сигнал для диагностики/портала: не менять на true без реальной реализации адаптера. */
export const BACKGROUND_TRACKING_PRODUCTION_READY = false as const;

export const BACKGROUND_TRACKING_EVIDENCE =
  "Android: FGS task только при !AppState.active; merge в activeShiftStorage (сериализованный RMW) + waterline idempotency; foreground watch в active. iOS — noop. Production-ready — field gate." as const;

/** Gate перед BACKGROUND_TRACKING_PRODUCTION_READY=true (owner + device). */
export function backgroundTrackingProductionGate(fieldValidationReady: boolean): {
  allowed: boolean;
  reasonRu: string;
} {
  if (!fieldValidationReady) {
    return {
      allowed: false,
      reasonRu: "Чеклист Маршруты 8/8 на физическом устройстве (field validation)",
    };
  }
  return {
    allowed: false,
    reasonRu: "Field gate пройден — нужен owner sign-off после OTA smoke",
  };
}
export type BackgroundTrackingHandle = {
  dispose: () => void;
};

export interface BackgroundTrackingAdapter {
  /** Запланировать фоновые обновления (пока no-op). */
  enableForShift(_shift: ActiveShift): Promise<BackgroundTrackingHandle>;
}

class NoopBackgroundTracking implements BackgroundTrackingAdapter {
  async enableForShift(_shift: ActiveShift): Promise<BackgroundTrackingHandle> {
    return { dispose: () => {} };
  }
}

let adapter: BackgroundTrackingAdapter = new NoopBackgroundTracking();

export function setBackgroundTrackingAdapter(next: BackgroundTrackingAdapter) {
  adapter = next;
}

export function getBackgroundTrackingAdapter(): BackgroundTrackingAdapter {
  return adapter;
}
