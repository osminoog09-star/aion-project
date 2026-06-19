import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { fetchApkUpdateManifestResilient, isManifestSemanticallyStale } from "./fetchApkManifest";
import { semverLess } from "./semverCompare";
import { publishApkDiagnostics } from "./apkDiagnosticsSink";
import type { ApkUpdateManifest } from "./apkManifest.types";
import { getApkManifestUrl } from "../../../lib/apkManifestUrl";
import { appendAionTimelineEvent } from "../../../storage/core/aionTimelineStorage";

export type ApkUpdateReason =
  | "none"
  | "below_minimum"
  | "newer_available"
  | "runtime_mismatch";

function appVersion(): string {
  return (
    (Constants.expoConfig?.version as string | undefined)?.trim() ||
    "0.0.0"
  );
}

function currentRuntime(): string | null {
  const r = Updates.runtimeVersion;
  return r != null ? String(r) : null;
}

export function evaluateApkUpdate(
  manifest: ApkUpdateManifest,
): { reason: ApkUpdateReason; critical: boolean } {
  const cur = appVersion();
  if (semverLess(cur, manifest.minimumSupported)) {
    return { reason: "below_minimum", critical: true };
  }
  if (manifest.forceUpdate && semverLess(cur, manifest.latestVersion)) {
    return { reason: "newer_available", critical: true };
  }
  if (semverLess(cur, manifest.latestVersion)) {
    return {
      reason: "newer_available",
      critical: Boolean(manifest.critical || manifest.emergency),
    };
  }
  const rt = currentRuntime();
  if (manifest.minimumRuntimeVersion && rt && manifest.minimumRuntimeVersion.trim() !== rt.trim()) {
    return { reason: "runtime_mismatch", critical: Boolean(manifest.emergency) };
  }
  if (manifest.runtimeVersion && rt && manifest.runtimeVersion !== rt) {
    return { reason: "runtime_mismatch", critical: false };
  }
  return { reason: "none", critical: false };
}

const MANIFEST_URL =
  typeof process !== "undefined" ? getApkManifestUrl() : "";

export function useApkUpdateController() {
  const [manifest, setManifest] = useState<ApkUpdateManifest | null>(null);
  const [snoozeUntil, setSnoozeUntil] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastSuccessAtMs, setLastSuccessAtMs] = useState<number | null>(null);
  const [lastErrorAtMs, setLastErrorAtMs] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const manifestRef = useRef<ApkUpdateManifest | null>(null);
  const lastSuccessRef = useRef<number | null>(null);
  const lastErrorRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    if (!MANIFEST_URL || __DEV__) {
      publishApkDiagnostics({
        manifest: null,
        evald: null,
        loading: false,
        lastSuccessAtMs: lastSuccessRef.current,
        lastErrorAtMs: lastErrorRef.current,
        manifestStale: false,
      });
      return;
    }
    refreshInFlightRef.current = true;
    setLoading(true);
    publishApkDiagnostics({
      loading: true,
      manifest: manifestRef.current,
      evald: manifestRef.current ? evaluateApkUpdate(manifestRef.current) : null,
      lastSuccessAtMs: lastSuccessRef.current,
      lastErrorAtMs: lastErrorRef.current,
      manifestStale: false,
    });
    try {
      const res = await fetchApkUpdateManifestResilient(MANIFEST_URL);
      setFromCache(res.fromCache);
      if (res.manifest) {
        const at = res.fetchedAtMs ?? Date.now();
        lastSuccessRef.current = at;
        setLastSuccessAtMs(at);
        manifestRef.current = res.manifest;
        setManifest(res.manifest);
        const evald = evaluateApkUpdate(res.manifest);
        const stale = isManifestSemanticallyStale(res.manifest, at);
        publishApkDiagnostics({
          manifest: res.manifest,
          evald,
          loading: false,
          lastSuccessAtMs: at,
          lastErrorAtMs: lastErrorRef.current,
          manifestStale: stale,
        });
      } else {
        const errAt = Date.now();
        lastErrorRef.current = errAt;
        setLastErrorAtMs(errAt);
        publishApkDiagnostics({
          manifest: null,
          evald: null,
          loading: false,
          lastSuccessAtMs: lastSuccessRef.current,
          lastErrorAtMs: errAt,
          manifestStale: false,
        });
      }
    } catch {
      const errAt = Date.now();
      lastErrorRef.current = errAt;
      setLastErrorAtMs(errAt);
      setFromCache(false);
      publishApkDiagnostics({
        manifest: manifestRef.current,
        evald: manifestRef.current ? evaluateApkUpdate(manifestRef.current) : null,
        loading: false,
        lastSuccessAtMs: lastSuccessRef.current,
        lastErrorAtMs: errAt,
        manifestStale: false,
      });
    } finally {
      refreshInFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const evald = useMemo(() => {
    if (!manifest) return null;
    return evaluateApkUpdate(manifest);
  }, [manifest]);

  const manifestStale = useMemo(() => {
    if (!manifest || !lastSuccessAtMs) return false;
    return isManifestSemanticallyStale(manifest, lastSuccessAtMs);
  }, [manifest, lastSuccessAtMs]);

  const visible = useMemo(() => {
    if (!manifest || !evald || evald.reason === "none") return false;
    if (Date.now() < snoozeUntil && !evald.critical) return false;
    return true;
  }, [manifest, evald, snoozeUntil]);

  const notifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!manifest || !evald || evald.reason === "none" || !visible) return;
    const key = `${manifest.latestVersion}:${manifest.easBuildId ?? manifest.apkUrl}`;
    if (notifiedRef.current === key) return;
    notifiedRef.current = key;
    void appendAionTimelineEvent({
      type: "apk_manifest_refresh",
      title: "Доступна новая сборка",
      detail: `Версия ${manifest.latestVersion} — откройте уведомление или Центр обновлений`,
    });
  }, [manifest, evald, visible]);

  const snooze = useCallback(() => {
    setSnoozeUntil(Date.now() + 45 * 60 * 1000);
  }, []);

  return {
    manifest,
    evald,
    visible,
    loading,
    refresh,
    snooze,
    lastSuccessAtMs,
    lastErrorAtMs,
    fromCache,
    manifestStale,
  };
}
