import { Linking, Platform } from "react-native";

/**
 * Открывает системные настройки приложения (Android/iOS).
 * Для SYSTEM_ALERT_WINDOW пользователь обычно идёт в «Отображение поверх других приложений» вручную;
 * прямой deep link зависит от OEM — здесь безопасный baseline.
 */
export function openApplicationSettings(): Promise<void> {
  return Linking.openSettings();
}

export function isAndroidOverlayFoundationAvailable(): boolean {
  return Platform.OS === "android";
}
