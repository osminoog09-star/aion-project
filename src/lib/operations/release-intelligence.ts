import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { resolveAionDriverPath } from "@/lib/aion-modules";
import { semverGte } from "@/lib/shared/runtime-compatibility";
import { evaluateReleaseSafetyAsync, type ReleaseSafetyState } from "@/lib/operations/release-safety";

export type ReleaseIntelligence = {
  /** Driver tree vs published APK */
  driverSourceVersion: string | null;
  publishedApkVersion: string | null;
  portalMinVersion: string;
  requiresNativeBuild: boolean;
  nativeChangeHints: string[];
  otaOnlyAllowed: boolean;
  apkBuildRequired: boolean;
  runtimeActivationAllowed: boolean;
  validationFlowsAllowed: boolean;
  safeMode: boolean;
  releaseSafety: ReleaseSafetyState;
  headlineRu: string;
  recommendedActions: string[];
};

const NATIVE_PATH_PREFIXES = [
  "app.config.ts",
  "app.json",
  "eas.json",
  "plugins/",
  "android/",
  "ios/",
  "package.json",
];

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

/** Best-effort: scan recent driver git diff for native paths (local/CI only). */
export function detectNativeChangeHints(driverRoot: string): string[] {
  if (!existsSync(path.join(driverRoot, ".git"))) return [];
  try {
    const out = execSync("git diff --name-only HEAD~1", {
      cwd: driverRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter((f) => NATIVE_PATH_PREFIXES.some((p) => f === p || f.startsWith(p)));
  } catch {
    return [];
  }
}

export async function evaluateReleaseIntelligence(): Promise<ReleaseIntelligence> {
  const root = process.cwd();
  const driverRoot = resolveAionDriverPath();
  const safety = await evaluateReleaseSafetyAsync();

  const req = readJson<{ minRuntimeVersion: string }>(
    path.join(root, "src/content/portal-runtime-requirements.json"),
  );
  const apk = readJson<{ runtimeVersion?: string }>(path.join(root, "public/apk-manifest.preview.json"));
  const driverManifest = readJson<{ runtimeVersion?: string }>(
    path.join(driverRoot, "build-manifest.json"),
  );

  const portalMin = req?.minRuntimeVersion ?? "0.0.0";
  const publishedApk = apk?.runtimeVersion ?? null;
  const driverSource = driverManifest?.runtimeVersion ?? null;

  const nativeHints = existsSync(driverRoot) ? detectNativeChangeHints(driverRoot) : [];
  const requiresNativeBuild = nativeHints.length > 0;

  const apkStale =
    publishedApk != null && !semverGte(publishedApk, portalMin);
  const driverAheadOfApk =
    driverSource != null &&
    publishedApk != null &&
    semverGte(driverSource, portalMin) &&
    !semverGte(publishedApk, driverSource);

  const apkBuildRequired = apkStale || driverAheadOfApk || requiresNativeBuild;
  const otaOnlyAllowed = !requiresNativeBuild && !apkBuildRequired;
  const compatibilityOk = safety.compatibility.compatible && !apkStale;
  const runtimeActivationAllowed = compatibilityOk && !safety.safeMode;
  const validationFlowsAllowed = safety.canRequireFieldValidation;

  const recommendedActions: string[] = [];
  if (apkBuildRequired) {
    recommendedActions.push("npm run build:manifest (driver)");
    recommendedActions.push("eas build preview → FINISHED");
    recommendedActions.push("npm run release:apk-manifest:sync <buildId>");
    recommendedActions.push("npm run release:orchestrate -- --activate-runtime");
  }
  if (requiresNativeBuild) {
    recommendedActions.push("BLOCK OTA-only — native paths changed: " + nativeHints.join(", "));
  }
  if (!runtimeActivationAllowed) {
    recommendedActions.push("Keep runtime in blocked/SAFE MODE until compatibility green");
  }
  if (otaOnlyAllowed && compatibilityOk) {
    recommendedActions.push("OTA update may be sufficient (no native diff detected)");
  }

  let headlineRu = "Release intelligence: система совместима";
  if (requiresNativeBuild) {
    headlineRu = "Требуется нативная сборка APK (не только OTA)";
  } else if (apkBuildRequired) {
    headlineRu = "Требуется новый preview APK и sync manifest";
  } else if (!runtimeActivationAllowed) {
    headlineRu = safety.headlineRu;
  }

  return {
    driverSourceVersion: driverSource,
    publishedApkVersion: publishedApk,
    portalMinVersion: portalMin,
    requiresNativeBuild,
    nativeChangeHints: nativeHints,
    otaOnlyAllowed,
    apkBuildRequired,
    runtimeActivationAllowed,
    validationFlowsAllowed,
    safeMode: safety.safeMode,
    releaseSafety: safety,
    headlineRu,
    recommendedActions,
  };
}
