import type { AppCurrencyCode } from "../types/device";
import { DEFAULT_DEVICE_SETTINGS } from "../types/device";
import type { UserProfile } from "../types";

export function deviceSettingsLookDefault(
  currencyCode: AppCurrencyCode,
  regionCountryCode: string,
): boolean {
  return (
    currencyCode === DEFAULT_DEVICE_SETTINGS.currencyCode &&
    regionCountryCode === DEFAULT_DEVICE_SETTINGS.regionCountryCode
  );
}

/** После загрузки: настройки устройства важнее, кроме «чистой» установки + валюта из облака. */
export function pickCurrencyReconcileAction(
  settingsCurrency: AppCurrencyCode,
  settingsRegion: string,
  profile: UserProfile | null,
): "none" | "settings-to-profile" | "profile-to-settings" {
  const profileCurrency = profile?.currencyCode;
  if (!profileCurrency || profileCurrency === settingsCurrency) return "none";
  if (deviceSettingsLookDefault(settingsCurrency, settingsRegion)) {
    return "profile-to-settings";
  }
  return "settings-to-profile";
}
