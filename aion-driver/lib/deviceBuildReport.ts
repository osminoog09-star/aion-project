import * as Updates from "expo-updates";
import type { DeviceBuildInfo } from "../shared/runtime-compatibility";
import {
  DRIVER_BUILD_FEATURES,
  DRIVER_BUILD_ROUTES,
  getInstalledAppVersion,
  getInstalledRuntimeVersion,
  getInstalledVersionCode,
  readEmbeddedBuildManifest,
} from "./driverBuildCapabilities";

export function collectDeviceBuildInfo(): DeviceBuildInfo {
  const embedded = readEmbeddedBuildManifest();
  const channel = Updates.channel ?? embedded.channel ?? "unknown";
  const updateId = Updates.updateId ?? undefined;

  return {
    appVersion: getInstalledAppVersion(),
    runtimeVersion: getInstalledRuntimeVersion(),
    versionCode: getInstalledVersionCode(),
    gitSha: embedded.gitSha ?? process.env.EXPO_PUBLIC_GIT_COMMIT ?? undefined,
    buildTimestamp: embedded.buildTimestamp ?? undefined,
    features: [...DRIVER_BUILD_FEATURES],
    routes: [...DRIVER_BUILD_ROUTES],
    channel,
    updateId,
  };
}
