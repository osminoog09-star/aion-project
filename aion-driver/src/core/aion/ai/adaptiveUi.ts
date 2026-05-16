import type { AionDiagnosticsSnapshot } from "../diagnostics/types";

/** Локальные флаги адаптивного UI до появления cloud-персонализации. */
export type AionAdaptiveUiHints = {
  preferDenseHub: boolean;
  emphasizeSync: boolean;
  emphasizeOta: boolean;
};

export function deriveAdaptiveUiHints(snapshot: AionDiagnosticsSnapshot): AionAdaptiveUiHints {
  return {
    preferDenseHub: snapshot.syncQueueLength > 3 || snapshot.ota.phase !== "idle",
    emphasizeSync: snapshot.syncQueueLength > 0,
    emphasizeOta: snapshot.ota.bannerVisible || snapshot.ota.phase === "ready" || snapshot.ota.phase === "downloading",
  };
}
