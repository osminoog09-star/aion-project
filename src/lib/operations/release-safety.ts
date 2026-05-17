import { readFileSync } from "node:fs";
import path from "node:path";
import type { CompatibilityResult, DeviceBuildInfo, RuntimeRequirement } from "@/lib/shared/runtime-compatibility";
import { semverGte, validateCompatibility } from "@/lib/shared/runtime-compatibility";
import {
  getLocalDeviceHeartbeatRecord,
  resolveDeviceHeartbeatRecord,
} from "@/lib/operations/device-heartbeat-persist";

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
  supportedFeatures?: string[];
  supportedRoutes?: string[];
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
  heartbeatSource: "supabase" | "filesystem" | "apk_manifest_proxy" | "none";
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

function buildReleaseSafetyState(input: {
  requirements: PortalRuntimeRequirements;
  publishedManifest: PublishedApkManifest | null;
  lastDeviceHeartbeat: DeviceHeartbeatRecord | null;
  effectiveDevice: DeviceBuildInfo | null;
  heartbeatSource: ReleaseSafetyState["heartbeatSource"];
}): ReleaseSafetyState {
  const { requirements, publishedManifest, lastDeviceHeartbeat, effectiveDevice, heartbeatSource } =
    input;

  const compatibility = validateCompatibility(requirements, effectiveDevice);

  const manifestStale =
    publishedManifest?.runtimeVersion &&
    !semverGte(publishedManifest.runtimeVersion, requirements.minRuntimeVersion);

  const realDeviceHeartbeat = Boolean(lastDeviceHeartbeat?.device?.features?.length);
  const safeMode =
    requirements.safeModeWhenIncompatible &&
    (Boolean(manifestStale) ||
      (realDeviceHeartbeat && !compatibility.compatible) ||
      (!realDeviceHeartbeat &&
        heartbeatSource === "apk_manifest_proxy" &&
        !compatibility.compatible));

  const canRequireFieldValidation = !safeMode && compatibility.compatible;
  const canRequireOtaSmoke = canRequireFieldValidation;

  let headlineRu = "Сборка Driver совместима с порталом";
  let detailRu = compatibility.reasonRu;

  if (manifestStale && publishedManifest?.runtimeVersion) {
    headlineRu = "APK на портале устарел — нужен новый preview build";
    detailRu = `В apk-manifest.preview.json runtime ${publishedManifest.runtimeVersion}, портал требует ≥ ${requirements.minRuntimeVersion}. Сначала EAS build + sync manifest, затем validation.`;
  } else if (!compatibility.compatible) {
    headlineRu = "Сборка Driver устарела — обновите приложение";
    detailRu = compatibility.reasonRu;
  } else if (!lastDeviceHeartbeat?.device?.features?.length) {
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
    heartbeatSource,
  };
}

function effectiveFromHeartbeat(hb: DeviceHeartbeatRecord | null): {
  device: DeviceBuildInfo | null;
  source: ReleaseSafetyState["heartbeatSource"];
} {
  if (hb?.device?.runtimeVersion) {
    return { device: hb.device, source: "filesystem" };
  }
  const apk = getPublishedApkManifest();
  if (!apk?.runtimeVersion) {
    return { device: null, source: "none" };
  }
  return {
    device: {
      appVersion: apk.latestVersion ?? apk.runtimeVersion,
      runtimeVersion: apk.runtimeVersion,
      versionCode: apk.buildNumber ? Number.parseInt(apk.buildNumber, 10) : undefined,
      features: apk.supportedFeatures ?? [],
      routes: apk.supportedRoutes ?? [],
      channel: "preview-manifest",
    },
    source: "apk_manifest_proxy",
  };
}

/** Sync — local JSON only (SSR / build). */
export function evaluateReleaseSafety(): ReleaseSafetyState {
  const hb = getLocalDeviceHeartbeatRecord();
  const { device, source } = effectiveFromHeartbeat(hb);
  return buildReleaseSafetyState({
    requirements: getPortalRuntimeRequirements(),
    publishedManifest: getPublishedApkManifest(),
    lastDeviceHeartbeat: hb,
    effectiveDevice: device,
    heartbeatSource: source,
  });
}

/** Async — Supabase + FS (API / live). */
export async function evaluateReleaseSafetyAsync(): Promise<ReleaseSafetyState> {
  const hb = await resolveDeviceHeartbeatRecord();
  let heartbeatSource: ReleaseSafetyState["heartbeatSource"] = "none";
  let effectiveDevice: DeviceBuildInfo | null = null;

  if (hb?.device?.runtimeVersion) {
    effectiveDevice = hb.device;
    const local = getLocalDeviceHeartbeatRecord();
    const remoteNewer =
      local?.at && hb.at && Date.parse(hb.at) > Date.parse(local.at) && hb !== local;
    heartbeatSource = remoteNewer ? "supabase" : "filesystem";
  } else {
    const proxy = effectiveFromHeartbeat(null);
    effectiveDevice = proxy.device;
    heartbeatSource = proxy.source;
  }

  return buildReleaseSafetyState({
    requirements: getPortalRuntimeRequirements(),
    publishedManifest: getPublishedApkManifest(),
    lastDeviceHeartbeat: hb,
    effectiveDevice,
    heartbeatSource,
  });
}
