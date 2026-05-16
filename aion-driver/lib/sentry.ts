import NetInfo from "@react-native-community/netinfo";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";
import { peekSyncQueue } from "../features/sync/services/offlineQueue";

let initialized = false;

function hasDsn(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN);
}

export function isSentryEnabled(): boolean {
  return hasDsn();
}

export function initSentry(): void {
  if (initialized || !hasDsn()) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN!;
  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    enableNativeFramesTracking: Platform.OS !== "web",
    tracesSampleRate: 0.15,
    beforeSend: (event) => {
      event.tags = { ...event.tags, ota_channel: Updates.channel ?? "none" };
      return event;
    },
  });
  initialized = true;
}

export async function refreshSentryAppContext(routeName?: string): Promise<void> {
  if (!initialized) return;
  let queueLen = 0;
  try {
    queueLen = (await peekSyncQueue()).length;
  } catch {
    /* noop */
  }
  let online: boolean | null = null;
  try {
    const n = await NetInfo.fetch();
    online = n.isConnected === true && n.isInternetReachable !== false;
  } catch {
    /* noop */
  }
  Sentry.setContext("aion_device", {
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    model: Constants.deviceName,
    appVersion: Constants.expoConfig?.version,
    runtimeVersion: Updates.runtimeVersion != null ? String(Updates.runtimeVersion) : null,
    updateId: Updates.updateId,
    otaEnabled: Updates.isEnabled,
    activeRoute: routeName ?? null,
    syncQueueLength: queueLen,
    online,
  });
}

export function captureSyncError(
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  if (!initialized) return;
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, { tags: { area: "sync" }, extra });
}

export function captureOcrError(error: unknown, extra?: Record<string, unknown>): void {
  if (!initialized) return;
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, { tags: { area: "ocr" }, extra });
}

export function captureApiError(
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  if (!initialized) return;
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, { tags: { area: "api" }, extra });
}

export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "log" | "info" | "debug" = "info",
): void {
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}
