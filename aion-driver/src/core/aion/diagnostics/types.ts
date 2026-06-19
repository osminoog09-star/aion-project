import type { ApkUpdateReason } from "../../updates/useApkUpdateController";

export type AionOtaPhase =
  | "idle"
  | "checking"
  | "prompt"
  | "downloading"
  | "ready"
  | "error";

/** Состояние живой сущности AION (орб / ядро) */
export type AionEntityState =
  | "idle"
  | "thinking"
  | "success"
  | "warning"
  | "critical"
  | "offline"
  | "syncing"
  | "updating";

/** @deprecated используйте AionEntityState */
export type AionOrbState = AionEntityState;

export type AionDiagnosticsSnapshot = {
  capturedAt: number;
  networkOnline: boolean;
  networkType: string;
  syncQueueLength: number;
  shiftLocationTask?: {
    taskRunning: boolean | null;
    lastHeartbeatJson: string | null;
    lastMergeStateJson: string | null;
  };
  lastSyncFlushAt: number | null;
  auth: {
    sessionPresent: boolean;
    isGuest: boolean;
    isConfigured: boolean;
  };
  ota: {
    enabled: boolean;
    channel: string | null;
    runtimeVersion: string | null;
    updateId: string | null;
    phase: AionOtaPhase;
    bannerVisible: boolean;
    pendingUpdateId: string | null;
    lastCheckAtMs: number | null;
    errorMessage: string | null;
  };
  channelTier: "development" | "preview" | "production";
  appVersion: string;
  /** Сводка APK-манифеста для Entity (без второго экземпляра хука). */
  apk: {
    evalReason: ApkUpdateReason | null;
    critical: boolean;
    manifestFailed: boolean;
    manifestStale: boolean;
  };
};

export type AionDevOpsStub = {
  ciStatus: "unknown" | "passing" | "failing";
  lastWorkflowRun: string | null;
  otaPublishHint: string | null;
};
