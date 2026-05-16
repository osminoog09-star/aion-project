export type NightContrastMode = "standard" | "nightDrive";

export type RegionCountryCode = string;

export type DistanceUnits = "km" | "mi";

/** С онбординга: график выходов в линию */
export type DriverSchedulePreference = "full_time" | "part_time" | "mixed";

/** Основная платформа заказов */
export type DriverAggregatorPreference = "bolt" | "uber" | "yandex" | "multi" | "other";

import type { AppCurrencyCode } from "../features/geo/generatedAlpha2ToCurrency";

export type { AppCurrencyCode } from "../features/geo/generatedAlpha2ToCurrency";

export interface DeviceSettings {
  /** Режим второго телефона: упрощённый UI и крупные элементы */
  companionMode: boolean;
  /** Рабочий телефон: минимальный экран AION Link, синк в облако без «тяжёлого» хаба */
  aionLinkMode: boolean;
  /** Снижать частоту GPS в простое + адаптивные интервалы */
  batteryOptimization: boolean;
  /** Базовый интервал опроса GPS (мс) в движении */
  gpsUpdateIntervalMs: number;
  /** Контраст для ночной езды */
  nightContrast: NightContrastMode;
  /** ISO 3166-1 alpha-2 */
  regionCountryCode: RegionCountryCode;
  /** Валюта отображения и расчётов UI */
  currencyCode: AppCurrencyCode;
  /** Подставлять страну/валюту из локали устройства */
  fuelRegionAuto: boolean;
  /** Единицы расстояния в UI */
  distanceUnits: DistanceUnits;
  /**
   * Android: нативная орбита TYPE_APPLICATION_OVERLAY (требует разрешения «поверх других»).
   * Не production-gate — OEM/батарея.
   */
  androidOverlayOrbEnabled: boolean;
  /** Онбординг: график */
  driverSchedule?: DriverSchedulePreference;
  /** Онбординг: основная платформа */
  primaryAggregator?: DriverAggregatorPreference;
  /** Онбординг: цель чистого в месяц (0 — не задана) */
  monthlyNetTarget?: number;
}

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  companionMode: false,
  aionLinkMode: false,
  batteryOptimization: true,
  gpsUpdateIntervalMs: 4000,
  nightContrast: "standard",
  regionCountryCode: "RU",
  currencyCode: "RUB",
  fuelRegionAuto: true,
  distanceUnits: "km",
  androidOverlayOrbEnabled: false,
  monthlyNetTarget: 0,
};

export const GPS_INTERVAL_PRESETS_MS = [3000, 5000, 8000, 12000] as const;
