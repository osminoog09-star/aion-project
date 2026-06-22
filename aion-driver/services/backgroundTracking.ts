import type { ActiveShift } from "../types";

/**
 * Background tracking adapter for Android foreground-service location updates.
 * Android installs the real adapter during runtime bootstrap; other platforms
 * keep the no-op implementation.
 */
export const BACKGROUND_TRACKING_PRODUCTION_READY = false as const;

export const BACKGROUND_TRACKING_EVIDENCE =
  "Android: FGS task only outside active AppState; serialized activeShiftStorage merge with waterline idempotency; foreground watch while active. iOS is a no-op. Manual field gate was retired by owner decision." as const;

/** Compatibility surface for diagnostics; the owner permanently retired the manual 8/8 gate. */
export function backgroundTrackingProductionGate(_fieldValidationReady: boolean): {
  allowed: boolean;
  reasonRu: string;
} {
  return {
    allowed: true,
    reasonRu: "Ручной field validation 8/8 снят решением владельца и не блокирует фоновую смену",
  };
}

export type BackgroundTrackingHandle = {
  dispose: () => void;
};

export interface BackgroundTrackingAdapter {
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
