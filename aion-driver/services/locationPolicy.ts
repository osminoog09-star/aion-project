import type { DeviceSettings } from "../types/device";

export type MotionState = "moving" | "idle";

/**
 * Интервалы watchPosition: в простое — реже, при движении — по настройке пользователя.
 */
export function resolveLocationWatchTiming(
  device: DeviceSettings,
  motion: MotionState
): { timeIntervalMs: number; distanceIntervalMeters: number } {
  const base = device.gpsUpdateIntervalMs;
  const baseDist = Math.max(5, Math.min(25, Math.round(base / 550)));

  if (motion === "idle") {
    if (device.batteryOptimization) {
      return {
        timeIntervalMs: Math.min(45000, Math.max(12000, base * 5)),
        distanceIntervalMeters: Math.max(22, baseDist * 3),
      };
    }
    return {
      timeIntervalMs: Math.min(30000, Math.max(8000, base * 3)),
      distanceIntervalMeters: Math.max(16, baseDist * 2),
    };
  }

  return {
    timeIntervalMs: base,
    distanceIntervalMeters: baseDist,
  };
}
