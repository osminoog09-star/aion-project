import type { ApkUpdateManifest } from "./apkManifest.types";
import { isRuntimeBelowMinimum } from "./runtimeCompatibility";
import { semverLess } from "./semverCompare";

export type ApkUpdateReason = "none" | "below_minimum" | "newer_available" | "runtime_mismatch";
export type ApkUpdateEvaluation = { reason: ApkUpdateReason; critical: boolean };

export function evaluateApkUpdatePolicy(
  manifest: ApkUpdateManifest,
  currentVersion: string,
  currentRuntime: string | null,
): ApkUpdateEvaluation {
  if (semverLess(currentVersion, manifest.minimumSupported)) {
    return { reason: "below_minimum", critical: true };
  }

  const newerAvailable = semverLess(currentVersion, manifest.latestVersion);
  const emergency = manifest.emergency === true || manifest.rolloutState === "emergency";
  const rolloutPaused = manifest.rolloutState === "paused";
  if (newerAvailable && (!rolloutPaused || manifest.forceUpdate === true || emergency)) {
    return {
      reason: "newer_available",
      critical: manifest.forceUpdate === true || manifest.critical === true || emergency,
    };
  }

  if (
    manifest.minimumRuntimeVersion &&
    currentRuntime &&
    isRuntimeBelowMinimum(currentRuntime, manifest.minimumRuntimeVersion)
  ) {
    return { reason: "runtime_mismatch", critical: emergency };
  }
  if (manifest.runtimeVersion && currentRuntime && manifest.runtimeVersion.trim() !== currentRuntime.trim()) {
    return { reason: "runtime_mismatch", critical: emergency };
  }
  return { reason: "none", critical: false };
}
