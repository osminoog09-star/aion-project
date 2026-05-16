import type { ApkUpdateManifest } from "./apkManifest.types";

/** Совместимо с evaluateApkUpdate в useApkUpdateController. */
export type ApkEvalSnapshot = {
  reason: "none" | "below_minimum" | "newer_available" | "runtime_mismatch";
  critical: boolean;
} | null;

export type ApkDiagnosticsSnapshot = {
  manifest: ApkUpdateManifest | null;
  evald: ApkEvalSnapshot;
  loading: boolean;
  lastSuccessAtMs: number | null;
  lastErrorAtMs: number | null;
  manifestStale: boolean;
};

let current: ApkDiagnosticsSnapshot = {
  manifest: null,
  evald: null,
  loading: false,
  lastSuccessAtMs: null,
  lastErrorAtMs: null,
  manifestStale: false,
};

export function publishApkDiagnostics(next: Partial<ApkDiagnosticsSnapshot>): void {
  current = { ...current, ...next };
}

export function getApkDiagnosticsSnapshot(): ApkDiagnosticsSnapshot {
  return current;
}
