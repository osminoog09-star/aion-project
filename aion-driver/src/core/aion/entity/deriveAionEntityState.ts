import type { AionDiagnosticsSnapshot } from "../diagnostics/types";
import type { AionEntityState } from "../diagnostics/types";

export type AionEntityActivity = {
  ocrActive: boolean;
  successUntilMs: number;
};

/**
 * Полная машина состояний AION Entity: снимок диагностики + сигналы активности (OCR, импульс успеха).
 */
export function deriveAionEntityState(
  s: AionDiagnosticsSnapshot,
  activity: AionEntityActivity,
): AionEntityState {
  const now = Date.now();

  if (!s.networkOnline) return "offline";

  if (s.ota.phase === "downloading" || s.ota.phase === "checking") {
    return "updating";
  }

  if (s.apk.manifestFailed || (s.apk.manifestStale && s.apk.evalReason === "none")) {
    return "warning";
  }
  if (
    s.apk.evalReason === "below_minimum" ||
    (s.apk.evalReason === "newer_available" && s.apk.critical) ||
    (s.apk.evalReason === "runtime_mismatch" && s.apk.critical)
  ) {
    return "critical";
  }
  if (s.apk.evalReason === "newer_available" || s.apk.evalReason === "runtime_mismatch") {
    return "warning";
  }

  if (activity.successUntilMs > now) {
    return "success";
  }

  if (s.auth.isConfigured && !s.auth.isGuest && !s.auth.sessionPresent) {
    if (s.syncQueueLength > 8 || s.ota.phase === "error") return "critical";
    return "warning";
  }

  if (s.syncQueueLength > 16) return "critical";
  if (s.syncQueueLength > 5 || s.ota.phase === "error") return "warning";

  if (activity.ocrActive) return "thinking";

  if (s.syncQueueLength > 0) return "syncing";

  return "idle";
}
