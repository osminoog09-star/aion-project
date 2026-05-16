import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  KNOWN_ISO4217_CURRENCIES,
  type AppCurrencyCode,
} from "../features/geo/generatedAlpha2ToCurrency";
import type {
  DeviceSettings,
  DistanceUnits,
  DriverAggregatorPreference,
  DriverSchedulePreference,
} from "../types/device";
import { DEFAULT_DEVICE_SETTINGS } from "../types/device";
import { STORAGE_KEYS } from "../storage/core/keys";

const ALLOWED_CURRENCIES = new Set<string>(KNOWN_ISO4217_CURRENCIES);

function clampInterval(ms: number): number {
  if (!Number.isFinite(ms) || ms < 2000) return 2000;
  if (ms > 30000) return 30000;
  return Math.round(ms);
}

function sanitizeCurrency(code: unknown): AppCurrencyCode {
  if (typeof code === "string" && ALLOWED_CURRENCIES.has(code.toUpperCase())) {
    return code.toUpperCase() as AppCurrencyCode;
  }
  return DEFAULT_DEVICE_SETTINGS.currencyCode;
}

function sanitizeCountry(c: unknown): string {
  if (typeof c === "string" && /^[A-Z]{2}$/i.test(c)) {
    return c.toUpperCase();
  }
  return DEFAULT_DEVICE_SETTINGS.regionCountryCode;
}

function sanitizeDistanceUnits(u: unknown): DistanceUnits {
  if (u === "mi" || u === "km") return u;
  return DEFAULT_DEVICE_SETTINGS.distanceUnits;
}

function sanitizeDriverSchedule(
  v: unknown,
): DriverSchedulePreference | undefined {
  if (v === "full_time" || v === "part_time" || v === "mixed") return v;
  return undefined;
}

function sanitizeAggregator(
  v: unknown,
): DriverAggregatorPreference | undefined {
  if (v === "bolt" || v === "uber" || v === "yandex" || v === "multi" || v === "other") {
    return v;
  }
  return undefined;
}

function sanitizeMonthlyTarget(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const n = Math.round(v);
  if (n < 0 || n > 9_999_999) return undefined;
  return n;
}

export function mergeDeviceSettings(partial: Partial<DeviceSettings>): DeviceSettings {
  const base: DeviceSettings = {
    ...DEFAULT_DEVICE_SETTINGS,
    ...partial,
  };
  return {
    ...base,
    companionMode:
      typeof partial.companionMode === "boolean"
        ? partial.companionMode
        : typeof base.companionMode === "boolean"
          ? base.companionMode
          : DEFAULT_DEVICE_SETTINGS.companionMode,
    aionLinkMode:
      typeof partial.aionLinkMode === "boolean"
        ? partial.aionLinkMode
        : typeof base.aionLinkMode === "boolean"
          ? base.aionLinkMode
          : DEFAULT_DEVICE_SETTINGS.aionLinkMode,
    regionCountryCode: sanitizeCountry(base.regionCountryCode),
    currencyCode: sanitizeCurrency(base.currencyCode),
    distanceUnits: sanitizeDistanceUnits(base.distanceUnits),
    fuelRegionAuto:
      typeof partial.fuelRegionAuto === "boolean"
        ? partial.fuelRegionAuto
        : typeof base.fuelRegionAuto === "boolean"
          ? base.fuelRegionAuto
          : DEFAULT_DEVICE_SETTINGS.fuelRegionAuto,
    gpsUpdateIntervalMs: clampInterval(base.gpsUpdateIntervalMs),
    driverSchedule: sanitizeDriverSchedule(base.driverSchedule),
    primaryAggregator: sanitizeAggregator(base.primaryAggregator),
    monthlyNetTarget: sanitizeMonthlyTarget(base.monthlyNetTarget),
    androidOverlayOrbEnabled:
      typeof partial.androidOverlayOrbEnabled === "boolean"
        ? partial.androidOverlayOrbEnabled
        : typeof base.androidOverlayOrbEnabled === "boolean"
          ? base.androidOverlayOrbEnabled
          : DEFAULT_DEVICE_SETTINGS.androidOverlayOrbEnabled,
  };
}

export async function loadDeviceSettings(): Promise<DeviceSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_SETTINGS);
  if (!raw) return { ...DEFAULT_DEVICE_SETTINGS };
  try {
    const parsed = JSON.parse(raw) as Partial<DeviceSettings>;
    return mergeDeviceSettings(parsed ?? {});
  } catch {
    return { ...DEFAULT_DEVICE_SETTINGS };
  }
}

export async function saveDeviceSettings(next: DeviceSettings): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.DEVICE_SETTINGS,
    JSON.stringify(mergeDeviceSettings(next)),
  );
}
