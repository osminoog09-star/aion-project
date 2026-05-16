import Constants from "expo-constants";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import { openApplicationSettings } from "./androidOverlaySettings";

const ANDROID_PKG = Constants.expoConfig?.android?.package ?? "com.aion.driver";

/** Экран разрешения «поверх других приложений» (API 23+). Нативная орбита — отдельный модуль. */
export function isAndroidOverlayPermissionFlowAvailable(): boolean {
  return Platform.OS === "android";
}

export async function openAndroidOverlayPermissionSettings(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.action.MANAGE_OVERLAY_PERMISSION",
      { data: `package:${ANDROID_PKG}` },
    );
  } catch {
    await openApplicationSettings();
  }
}
