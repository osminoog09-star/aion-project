import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { ApkUpdateModal } from "./ApkUpdateModal";
import { useApkUpdates } from "../../contexts/ApkUpdatesContext";
import { openApkDownload } from "../../src/core/updates/openApkDownload";

/**
 * Полная сборка APK (отдельно от OTA через expo-updates).
 * URL: EXPO_PUBLIC_APK_MANIFEST_URL. Без URL — тихо не работает.
 */
export function ApkUpdateGate() {
  const { manifest, evald, visible, snooze } = useApkUpdates();
  if (!manifest || !evald || evald.reason === "none") return null;
  return (
    <ApkUpdateModal
      visible={visible}
      manifest={manifest}
      reason={evald.reason}
      critical={evald.critical}
      onLater={() => {
        void Haptics.selectionAsync();
        snooze();
      }}
      onUpdate={() => {
        void openApkDownload(manifest).then((result) => {
          if (!result.ok) {
            Alert.alert("Не удалось открыть APK", "Проверьте подключение и повторите загрузку из Центра обновлений.");
          }
        });
      }}
    />
  );
}
