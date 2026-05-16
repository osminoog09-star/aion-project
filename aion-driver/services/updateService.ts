import * as Haptics from "expo-haptics";
import * as SystemUI from "expo-system-ui";
import * as Updates from "expo-updates";
import { Platform } from "react-native";
import { consumeOtaSimulateFetchFailOnce, getOtaSimulateOffline } from "../storage/core/otaTestFlags";
import { appendAionTimelineEvent } from "../storage/core/aionTimelineStorage";
import { markPostUpdateCelebrationPending } from "../features/updates/postUpdateCelebration";

/** Минимум между сетевыми проверками при частых событиях (resume + mount). */
export const MIN_CHECK_GAP_MS = 45_000;

/** Период фоновой проверки (при активном приложении). */
export const PERIODIC_CHECK_MS = 4 * 60 * 60 * 1000;

/** Snooze после «Позже». */
export const DEFAULT_SNOOZE_MS = 45 * 60 * 1000;

export const FETCH_MAX_RETRIES = 3;

export const FETCH_BASE_DELAY_MS = 900;

export type OtaCheckDebugSnapshot = { at: number; json: string };

let lastOtaCheckDebug: OtaCheckDebugSnapshot | null = null;

function recordOtaCheckDebug(payload: Record<string, unknown>): void {
  lastOtaCheckDebug = {
    at: Date.now(),
    json: JSON.stringify(payload, null, 2),
  };
}

export function peekLastOtaCheckDebug(): OtaCheckDebugSnapshot | null {
  return lastOtaCheckDebug;
}

/** Сводка по манифесту EAS Update (для премиального UI). */
export type UpdateManifestSummary = {
  updateId: string | null;
  createdAt: string | null;
  runtimeVersion: string | null;
  /** Оценка: 1 launch bundle + N ассетов (не байты — сервер не отдаёт Content-Length в JS). */
  bundleParts: number;
  releaseMessage: string | null;
  commitHash: string | null;
  newFeatures: string[];
  bugFixes: string[];
};

export type CheckOutcome =
  | { ok: true; available: false }
  | { ok: true; available: true; manifestSummary: UpdateManifestSummary }
  | { ok: false; reason: "disabled" | "dev" | "network" | "unknown"; message?: string };

function mapCheckError(e: unknown): CheckOutcome {
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout")) {
    return { ok: false, reason: "network", message: msg };
  }
  return { ok: false, reason: "unknown", message: msg };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

/** Разбор секций «новое / фиксы» из текста сообщения EAS (`eas update --message`). */
function splitReleaseBody(raw: string): { features: string[]; fixes: string[] } {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const features: string[] = [];
  const fixes: string[] = [];
  let mode: "none" | "feat" | "fix" = "none";
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^(новое|features?|что нового)[:：]?\s*$/i.test(line)) {
      mode = "feat";
      continue;
    }
    if (/^(фиксы|исправления|bug\s*fixes?)[:：]?\s*$/i.test(line)) {
      mode = "fix";
      continue;
    }
    if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      const body = line.replace(/^[\s•\-\*]+/, "").trim();
      if (!body) continue;
      if (mode === "fix") fixes.push(body);
      else features.push(body);
      continue;
    }
    if (mode === "fix") fixes.push(line);
    else if (mode === "feat") features.push(line);
    else features.push(line);
  }
  return { features, fixes };
}

function readCommitFromExtra(extra: unknown): string | null {
  if (!isRecord(extra)) return null;
  const ota = extra.ota;
  if (isRecord(ota)) {
    const c = pickString(ota.commitHash) ?? pickString(ota.gitCommit) ?? pickString(ota.commit);
    if (c) return c;
  }
  const top = pickString(extra.EXPO_PUBLIC_GIT_COMMIT) ?? pickString(extra.gitCommit);
  return top;
}

function readReleaseFromMetadata(metadata: unknown): string | null {
  if (!isRecord(metadata)) return null;
  const candidates = [
    metadata.message,
    metadata.updateMessage,
    metadata.description,
    metadata.releaseNotes,
    metadata.changelog,
  ];
  for (const c of candidates) {
    const s = pickString(c);
    if (s) return s;
  }
  return null;
}

/**
 * Извлекает сводку из манифеста проверки/загрузки (Expo Updates / EAS).
 */
export function extractUpdateManifestSummary(
  manifest: Updates.Manifest | undefined | null,
): UpdateManifestSummary | null {
  if (!manifest || typeof manifest !== "object") return null;

  if (!("launchAsset" in manifest) || !("createdAt" in manifest)) {
    const emb = manifest as { id?: string; commitTime?: number };
    return {
      updateId: pickString(emb.id),
      createdAt: typeof emb.commitTime === "number" ? new Date(emb.commitTime).toISOString() : null,
      runtimeVersion: null,
      bundleParts: 1,
      releaseMessage: null,
      commitHash: null,
      newFeatures: [],
      bugFixes: [],
    };
  }

  const m = manifest as {
    id: string;
    createdAt: string;
    runtimeVersion: string;
    launchAsset?: unknown;
    assets?: unknown[];
    metadata?: unknown;
    extra?: unknown;
  };

  const assetsLen = Array.isArray(m.assets) ? m.assets.length : 0;
  const bundleParts = assetsLen + 1;

  let releaseMessage = readReleaseFromMetadata(m.metadata);

  const extraRoot = m.extra;
  let commitHash = readCommitFromExtra(extraRoot);

  if (isRecord(extraRoot)) {
    const ota = extraRoot.ota;
    if (isRecord(ota)) {
      if (!releaseMessage) {
        releaseMessage =
          pickString(ota.releaseNotes) ?? pickString(ota.notes) ?? pickString(ota.message);
      }
    }
  }

  if (isRecord(extraRoot)) {
    const expoClient = extraRoot.expoClient;
    if (isRecord(expoClient)) {
      const inner = expoClient.extra;
      if (!releaseMessage && isRecord(inner)) {
        const ota = inner.ota;
        if (isRecord(ota)) {
          releaseMessage =
            pickString(ota.releaseNotes) ?? pickString(ota.notes) ?? pickString(ota.message);
        }
      }
      if (!commitHash) commitHash = readCommitFromExtra(expoClient);
    }
  }

  const { features, fixes } = releaseMessage
    ? splitReleaseBody(releaseMessage)
    : { features: [], fixes: [] };

  return {
    updateId: pickString(m.id),
    createdAt: pickString(m.createdAt),
    runtimeVersion: pickString(m.runtimeVersion),
    bundleParts,
    releaseMessage,
    commitHash,
    newFeatures: features,
    bugFixes: fixes,
  };
}

/**
 * Проверка наличия OTA на сервере EAS Update.
 */
export async function checkForUpdateDetailed(): Promise<CheckOutcome> {
  if (__DEV__) {
    recordOtaCheckDebug({ outcome: "dev", updatesEnabled: Updates.isEnabled });
    return { ok: false, reason: "dev" };
  }
  if (!Updates.isEnabled) {
    recordOtaCheckDebug({ outcome: "disabled" });
    return { ok: false, reason: "disabled" };
  }
  if (await getOtaSimulateOffline()) {
    recordOtaCheckDebug({ outcome: "simulate_offline" });
    return { ok: false, reason: "network", message: "[OTA test] Симуляция офлайна" };
  }
  try {
    const res = await Updates.checkForUpdateAsync();
    const summary = res.isAvailable && res.manifest ? extractUpdateManifestSummary(res.manifest) : null;
    recordOtaCheckDebug({
      outcome: "check_ok",
      isAvailable: res.isAvailable,
      isRollBackToEmbedded:
        "isRollBackToEmbedded" in res
          ? Boolean((res as { isRollBackToEmbedded?: boolean }).isRollBackToEmbedded)
          : undefined,
      manifestSummary: summary
        ? {
            updateId: summary.updateId,
            createdAt: summary.createdAt,
            runtimeVersion: summary.runtimeVersion,
            commitHash: summary.commitHash,
          }
        : null,
    });
    if (res.isAvailable && res.manifest) {
      const manifestSummary =
        summary ?? {
          updateId: null,
          createdAt: null,
          runtimeVersion: null,
          bundleParts: 1,
          releaseMessage: null,
          commitHash: null,
          newFeatures: [],
          bugFixes: [],
        };
      return { ok: true, available: true, manifestSummary };
    }
    return { ok: true, available: false };
  } catch (e) {
    const mapped = mapCheckError(e);
    recordOtaCheckDebug({
      outcome: "check_error",
      reason: mapped.ok ? undefined : mapped.reason,
      message: mapped.ok ? undefined : mapped.message,
    });
    return mapped;
  }
}

export type ManualOtaResult =
  | { kind: "dev" }
  | { kind: "disabled" }
  | { kind: "no_update" }
  | { kind: "network"; message: string }
  | { kind: "error"; message: string }
  | { kind: "available"; summary: UpdateManifestSummary };

/**
 * Ручная проверка из настроек (без общего UI-хука OTA).
 */
export async function manualOtaCheckForSettings(): Promise<ManualOtaResult> {
  if (__DEV__) return { kind: "dev" };
  if (!Updates.isEnabled) return { kind: "disabled" };
  if (await getOtaSimulateOffline()) {
    return { kind: "network", message: "[OTA test] Симуляция офлайна" };
  }
  try {
    const res = await Updates.checkForUpdateAsync();
    if (res.isAvailable && res.manifest) {
      const summary =
        extractUpdateManifestSummary(res.manifest) ?? {
          updateId: null,
          createdAt: null,
          runtimeVersion: null,
          bundleParts: 1,
          releaseMessage: null,
          commitHash: null,
          newFeatures: [],
          bugFixes: [],
        };
      return { kind: "available", summary };
    }
    return { kind: "no_update" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout")) {
      return { kind: "network", message: msg };
    }
    return { kind: "error", message: msg };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type FetchProgress = (fraction: number) => void;

export type FetchUpdateResult =
  | { ok: true; isNew: true }
  | { ok: true; isNew: false }
  | { ok: false; message: string };

/**
 * Загрузка бандла с ретраями. Прогресс 0..1 — оценка по времени.
 */
export async function fetchUpdateWithRetry(
  onProgress?: FetchProgress,
  options?: { maxRetries?: number },
): Promise<FetchUpdateResult> {
  if (__DEV__ || !Updates.isEnabled) {
    return { ok: false, message: "Обновления недоступны в режиме разработки." };
  }

  const maxRetries = options?.maxRetries ?? FETCH_MAX_RETRIES;
  let lastMessage = "Не удалось загрузить обновление.";

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    if (await consumeOtaSimulateFetchFailOnce()) {
      return { ok: false, message: "[OTA test] Симуляция сбоя загрузки" };
    }
    onProgress?.(0);
    let tick: ReturnType<typeof setInterval> | undefined;
    let simulated = 0;

    try {
      tick = setInterval(() => {
        simulated = Math.min(0.92, simulated + 0.04 + Math.random() * 0.02);
        onProgress?.(simulated);
      }, 220);

      const result = await Updates.fetchUpdateAsync();

      if (tick) clearInterval(tick);
      onProgress?.(1);

      if (typeof result === "object" && result != null && "isNew" in result) {
        if (result.isNew === true) {
          return { ok: true, isNew: true };
        }
        return { ok: true, isNew: false };
      }
      return { ok: true, isNew: true };
    } catch (e) {
      if (tick) clearInterval(tick);
      onProgress?.(0);
      lastMessage = e instanceof Error ? e.message : String(e);
      if (attempt < maxRetries - 1) {
        const delay = FETCH_BASE_DELAY_MS * 2 ** attempt;
        await sleep(delay);
      }
    }
  }

  return { ok: false, message: lastMessage };
}

/** Сглаживаем перезапуск: тот же фон, что у приложения, без «белой вспышки». */
export async function reloadToApplyUpdate(summary?: UpdateManifestSummary | null): Promise<void> {
  if (!Updates.isEnabled || __DEV__) return;
  try {
    await markPostUpdateCelebrationPending({
      previousUpdateId: Updates.updateId ?? null,
      summary: summary ?? null,
    });
  } catch {
    /* ignore */
  }
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* ignore */
  }
  try {
    await SystemUI.setBackgroundColorAsync("#030712");
    if (Platform.OS === "android") {
      const NavigationBar = await import("expo-navigation-bar");
      await NavigationBar.setBackgroundColorAsync("#030712");
      await NavigationBar.setButtonStyleAsync("light");
    }
  } catch {
    /* ignore */
  }
  const uid = Updates.updateId ?? "pending";
  void appendAionTimelineEvent({
    type: "ota_reload_scheduled",
    title: "Перезапуск для применения OTA",
    detail: `До перезапуска · ${uid.slice(0, 12)}…`,
  });
  await Updates.reloadAsync();
}

export function getOtaDebugInfo(): {
  enabled: boolean;
  channel: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
} {
  return {
    enabled: Updates.isEnabled,
    channel: Updates.channel ?? null,
    runtimeVersion:
      Updates.runtimeVersion != null ? String(Updates.runtimeVersion) : null,
    updateId: Updates.updateId ?? null,
  };
}
