import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";
import { formatDiagnosticLogText, getDiagnosticEntries } from "../../lib/diagnosticLog";
import { peekSyncQueue } from "../sync/services/offlineQueue";
import { getOtaDebugInfo } from "../../services/updateService";
import { loadActiveShift } from "../../storage/driver/activeShiftStorage";
import { loadPendingFuelEntries } from "../../storage/driver/pendingFuelStorage";
import { getLastSyncFlushAt } from "../../storage/core/syncDebugMeta";
import { sumFuelEntriesTotal } from "../../utils/fuelEntryFromManual";

export type BugReportCategory = "bug" | "fuel" | "sync" | "ui" | "crash" | "other";

export async function buildBugReportDiagnostics(): Promise<Record<string, unknown>> {
  const ota = getOtaDebugInfo();
  const queue = await peekSyncQueue();
  const activeShift = await loadActiveShift();
  const pendingFuel = await loadPendingFuelEntries();
  let lastSync: number | null = null;
  try {
    lastSync = await getLastSyncFlushAt();
  } catch {
    lastSync = null;
  }

  const fuelEntries = activeShift?.fuelEntries ?? [];
  const fuelTotal = sumFuelEntriesTotal(fuelEntries);

  return {
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    deviceName: Constants.deviceName ?? null,
    appVersion: Constants.expoConfig?.version ?? null,
    ota: {
      enabled: ota.enabled,
      channel: ota.channel,
      runtimeVersion: ota.runtimeVersion,
      updateId: ota.updateId,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    },
    sync: {
      queueLength: queue.length,
      lastFlushAtMs: lastSync,
      queueTypes: queue.map((q) => q.type),
    },
    shift: activeShift
      ? {
          id: activeShift.id,
          paused: activeShift.paused ?? false,
          distanceKm: Math.round((activeShift.distanceMeters / 1000) * 10) / 10,
          totalIncome: activeShift.totalIncome,
          fuelEntriesCount: fuelEntries.length,
          fuelTotal,
          fuelEntries: fuelEntries.map((e) => ({
            id: e.id,
            fuelType: e.fuelType,
            liters: e.liters,
            totalCost: e.totalCost,
            unitPrice: e.unitPrice,
            source: e.source,
            addedAtMs: e.addedAtMs,
          })),
        }
      : null,
    pendingFuel: pendingFuel.map((e) => ({
      id: e.id,
      fuelType: e.fuelType,
      liters: e.liters,
      totalCost: e.totalCost,
      source: e.source,
    })),
    diagnosticLog: formatDiagnosticLogText(getDiagnosticEntries()),
  };
}

export function formatBugReportText(
  category: BugReportCategory,
  description: string,
  diagnostics: Record<string, unknown>,
): string {
  const lines = [
    "=== AION Driver · отчёт о проблеме ===",
    `Категория: ${category}`,
    `Время: ${new Date().toISOString()}`,
    "",
    "--- Описание ---",
    description.trim() || "(без описания)",
    "",
    "--- Диагностика (JSON) ---",
    JSON.stringify(diagnostics, null, 2),
    "",
    "--- Журнал событий ---",
    typeof diagnostics.diagnosticLog === "string"
      ? diagnostics.diagnosticLog
      : "(нет)",
  ];
  return lines.join("\n");
}
