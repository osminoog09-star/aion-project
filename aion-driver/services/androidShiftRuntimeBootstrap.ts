import Constants from "expo-constants";
import { Platform } from "react-native";
import { setBackgroundTrackingAdapter } from "./backgroundTracking";
import { AndroidForegroundLocationShiftAdapter } from "./androidForegroundLocationShiftAdapter";

function shiftForegroundRuntimeDisabled(): boolean {
  if (process.env.EXPO_PUBLIC_DISABLE_SHIFT_FG_LOCATION === "1") return true;
  const v = (Constants.expoConfig?.extra as { disableShiftFgLocation?: string } | undefined)?.disableShiftFgLocation;
  return v === "1";
}

/** Один раз при старте: Android по умолчанию получает FGS-backed shift location task (если не отключено). */
export function ensureAndroidShiftRuntimeInstalled(): void {
  if (Platform.OS !== "android") return;
  if (shiftForegroundRuntimeDisabled()) return;
  setBackgroundTrackingAdapter(new AndroidForegroundLocationShiftAdapter());
}
