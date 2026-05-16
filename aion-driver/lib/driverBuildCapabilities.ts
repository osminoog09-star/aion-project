import Constants from "expo-constants";
import manifest from "../build-manifest.json";

/** Capabilities of this source tree / build — must match portal-runtime-requirements. */
export const DRIVER_BUILD_FEATURES: string[] = manifest.supportedFeatures;

export const DRIVER_BUILD_ROUTES: string[] = manifest.supportedRoutes;

export function readEmbeddedBuildManifest() {
  return manifest as {
    appVersion: string;
    runtimeVersion: string;
    versionCode: number;
    gitSha: string | null;
    buildTimestamp: string | null;
    channel: string;
    supportedFeatures: string[];
    supportedRoutes: string[];
    requiresNativeBuild: boolean;
  };
}

export function getInstalledAppVersion(): string {
  return Constants.expoConfig?.version ?? manifest.appVersion;
}

export function getInstalledRuntimeVersion(): string {
  const policy = Constants.expoConfig?.runtimeVersion;
  if (typeof policy === "string") return policy;
  return manifest.runtimeVersion;
}

export function getInstalledVersionCode(): number | undefined {
  const vc = Constants.expoConfig?.android?.versionCode;
  return typeof vc === "number" ? vc : manifest.versionCode;
}
