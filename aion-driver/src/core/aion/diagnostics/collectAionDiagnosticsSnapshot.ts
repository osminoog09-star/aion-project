import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";
import type { UseUpdatesResult } from "../../../../hooks/useUpdatesController";
import { getOtaChannelTier } from "../../../../lib/otaTestMode";
import { getOtaDebugInfo } from "../../../../services/updateService";
import {
  peekSyncDeadLetters,
  peekSyncQueue,
} from "../../../../features/sync/services/offlineQueue";
import { getLastSyncFlushAt } from "../../../../storage/core/syncDebugMeta";
import { getApkDiagnosticsSnapshot } from "../../updates/apkDiagnosticsSink";
import type { AionDiagnosticsSnapshot, AionOtaPhase } from "./types";
import { getShiftLocationTaskDiagnostics } from "../../../../tasks/shiftLocationTask";

export type AionAuthSnapshotInput = {
  sessionPresent: boolean;
  isGuest: boolean;
  isConfigured: boolean;
};

function mapPhase(phase: UseUpdatesResult["phase"]): AionOtaPhase {
  return phase;
}

export async function collectAionDiagnosticsSnapshot(
  updates: UseUpdatesResult,
  auth: AionAuthSnapshotInput,
): Promise<AionDiagnosticsSnapshot> {
  const net = await NetInfo.fetch();
  const [queue, deadLetters, shiftLoc] = await Promise.all([
    peekSyncQueue(),
    peekSyncDeadLetters(),
    getShiftLocationTaskDiagnostics(),
  ]);
  const flush = await getLastSyncFlushAt();
  const ota = getOtaDebugInfo();
  const apkUrl =
    typeof process !== "undefined" ? process.env.EXPO_PUBLIC_APK_MANIFEST_URL?.trim() ?? "" : "";
  const ad = getApkDiagnosticsSnapshot();
  const manifestFailed = Boolean(apkUrl) && !ad.loading && !ad.manifest && ad.lastErrorAtMs != null;

  return {
    capturedAt: Date.now(),
    networkOnline: net.isConnected === true,
    networkType: net.type ?? "unknown",
    syncQueueLength: queue.length + deadLetters.length,
    shiftLocationTask: shiftLoc,
    lastSyncFlushAt: flush,
    auth: {
      sessionPresent: auth.sessionPresent,
      isGuest: auth.isGuest,
      isConfigured: auth.isConfigured,
    },
    ota: {
      enabled: ota.enabled,
      channel: ota.channel,
      runtimeVersion: ota.runtimeVersion,
      updateId: ota.updateId,
      phase: mapPhase(updates.phase),
      bannerVisible: updates.bannerVisible,
      pendingUpdateId: updates.pendingUpdateId,
      lastCheckAtMs: updates.lastOtaCheckAtMs,
      errorMessage: updates.errorMessage,
    },
    channelTier: getOtaChannelTier(),
    appVersion: Constants.expoConfig?.version ?? "1.0.0",
    apk: {
      evalReason: ad.evald?.reason ?? null,
      critical: Boolean(ad.evald?.critical),
      manifestFailed,
      manifestStale: ad.manifestStale,
    },
  };
}
