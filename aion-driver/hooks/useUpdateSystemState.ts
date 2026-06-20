import NetInfo from "@react-native-community/netinfo";
import * as Updates from "expo-updates";
import { useEffect, useMemo, useState } from "react";
import { useUpdates } from "../contexts/UpdatesContext";
import { useApkUpdates } from "../contexts/ApkUpdatesContext";
import { deriveUpdateEngineView, type UpdateEngineView } from "../features/updates/updateSystemStateMachine";
import { getApkManifestUrl } from "../lib/apkManifestUrl";

export function useUpdateSystemState(): UpdateEngineView & {
  netOnline: boolean;
  otaPhase: ReturnType<typeof useUpdates>["phase"];
} {
  const u = useUpdates();
  const apk = useApkUpdates();
  const [netOnline, setNetOnline] = useState(true);

  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => {
      setNetOnline(s.isConnected === true);
    });
    void NetInfo.fetch().then((s) => setNetOnline(s.isConnected === true));
    return () => {
      if (typeof sub === "function") (sub as () => void)();
      else (sub as { remove?: () => void }).remove?.();
    };
  }, []);

  const manifestUrlConfigured = Boolean(
    typeof process !== "undefined" && getApkManifestUrl().startsWith("http"),
  );

  return useMemo(() => {
    const base = deriveUpdateEngineView({
      dev: __DEV__,
      otaEnabled: Updates.isEnabled,
      netOnline,
      otaPhase: u.phase,
      otaError: u.errorMessage,
      embeddedLaunch: Updates.isEmbeddedLaunch,
      emergencyLaunch: Updates.isEmergencyLaunch,
      manifestUrlConfigured,
      apkLoading: apk.loading,
      apkManifest: apk.manifest,
      apkEval: apk.evald,
      apkManifestStale: apk.manifestStale,
      apkLastErrorAtMs: apk.lastErrorAtMs,
      apkFromCache: apk.fromCache,
    });
    return { ...base, netOnline, otaPhase: u.phase };
  }, [
    netOnline,
    u.phase,
    u.errorMessage,
    apk.loading,
    apk.manifest,
    apk.evald,
    apk.manifestStale,
    apk.lastErrorAtMs,
    apk.fromCache,
    manifestUrlConfigured,
  ]);
}
