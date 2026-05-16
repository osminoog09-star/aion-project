import { readFileSync } from "node:fs";
import path from "node:path";
import type { CompatibilityResult, DeviceBuildInfo, RuntimeRequirement } from "@/lib/shared/runtime-compatibility";
import { semverGte, validateCompatibility } from "@/lib/shared/runtime-compatibility";

export type PortalRuntimeRequirements = RuntimeRequirement & {
  version: string;
  lastUpdated: string;
  safeModeWhenIncompatible: boolean;
  blockFieldValidationUntilCompatible: boolean;
  notesRu?: string;
};

export type PublishedApkManifest = {
  latestVersion?: string;
  runtimeVersion?: string;
  buildNumber?: string;
  releaseDate?: string;
};

export type DeviceHeartbeatRecord = {
  at: string;
  device: DeviceBuildInfo;
};

export type ReleaseSafetyState = {
  safeMode: boolean;
  compatibility: CompatibilityResult;
  requirements: PortalRuntimeRequirements;
  publishedManifest: PublishedApkManifest | null;
  lastDeviceHeartbeat: DeviceHeartbeatRecord | null;
  effectiveDevice: DeviceBuildInfo | null;
  canRequireFieldValidation: boolean;
  canRequireOtaSmoke: boolean;
  headlineRu: string;
  detailRu: string;
};

const CONTENT = path.join(process.cwd(), "src/content");
const PUBLIC = path.join(process.cwd(), "public");

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

export function getPortalRuntimeRequirements(): PortalRuntimeRequirements {
  return readJson(path.join(CONTENT, "portal-runtime-requirements.json"));
}

export function getPublishedApkManifest(): PublishedApkManifest | null {
  try {
    return readJson(path.join(PUBLIC, "apk-manifest.preview.json"));
  } catch {
    return null;
  }
}

export function getLastDeviceHeartbeat(): DeviceHeartbeatRecord | null {
  try {
    return readJson(path.join(CONTENT, "device-build-heartbeat.json"));
  } catch {
    return null;
  }
}

/** Best-effort device view: last heartbeat, else published APK manifest as proxy. */
export function resolveEffectiveDeviceBuild(): DeviceBuildInfo | null {
  const hb = getLastDeviceHeartbeat();
  if (hb?.device?.runtimeVersion) return hb.device;

  const apk = getPublishedApkManifest();
  if (!apk?.runtimeVersion) return null;

  return {
    appVersion: apk.latestVersion ?? apk.runtimeVersion,
    runtimeVersion: apk.runtimeVersion,
    versionCode: apk.buildNumber ? Number.parseInt(apk.buildNumber, 10) : undefined,
    features: [],
    routes: [],
    channel: "preview-manifest",
  };
}

export function evaluateReleaseSafety(): ReleaseSafetyState {
  const requirements = getPortalRuntimeRequirements();
  const publishedManifest = getPublishedApkManifest();
  const lastDeviceHeartbeat = getLastDeviceHeartbeat();
  const effectiveDevice = resolveEffectiveDeviceBuild();

  const compatibility = validateCompatibility(requirements, effectiveDevice);

  const manifestStale =
    publishedManifest?.runtimeVersion &&
    !semverGte(publishedManifest.runtimeVersion, requirements.minRuntimeVersion);

  const safeMode =
    requirements.safeModeWhenIncompatible &&
    (!compatibility.compatible || Boolean(manifestStale));

  const canRequireFieldValidation =
    !safeMode &&
    compatibility.compatible &&
    (requirements.blockFieldValidationUntilCompatible ? compatibility.compatible : true);

  const canRequireOtaSmoke = canRequireFieldValidation;

  let headlineRu = "Сборка Driver совместима с порталом";
  let detailRu = compatibility.reasonRu;

  if (manifestStale && publishedManifest?.runtimeVersion) {
    headlineRu = "APK на портале устарел — нужен новый preview build";
    detailRu = `В apk-manifest.preview.json runtime ${publishedManifest.runtimeVersion}, портал требует ≥ ${requirements.minRuntimeVersion}. Сначала EAS build + sync manifest, затем validation.`;
  } else if (!compatibility.compatible) {
    headlineRu = "Сборка Driver устарела — обновите приложение";
    detailRu = compatibility.reasonRu;
  } else if (!lastDeviceHeartbeat) {
    headlineRu = "Откройте Driver на телефоне для проверки совместимости";
    detailRu =
      "Портал видит только манифест APK. Heartbeat с устройства подтвердит routes/features.";
  }

  return {
    safeMode,
    compatibility,
    requirements,
    publishedManifest,
    lastDeviceHeartbeat,
    effectiveDevice,
    canRequireFieldValidation,
    canRequireOtaSmoke,
    headlineRu,
    detailRu,
  };
}
