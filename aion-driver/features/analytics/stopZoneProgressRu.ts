import type { StopZonePatterns } from "./types/stopZonePatternsTypes";

export const STOP_ZONE_MIN_OBSERVATIONS = 5;
export const STOP_ZONE_MIN_CLUSTER_SHIFTS = 2;

/** Прогресс для field validation / UI на устройстве. */
export function formatStopZoneProgressRu(
  patterns: StopZonePatterns | null,
): string | null {
  if (!patterns) return "Нужны ≥2 смены со снимками за 30д";
  const obs = patterns.stopObservationCount;
  if (obs < STOP_ZONE_MIN_OBSERVATIONS) {
    return `Остановки ≥3 мин: ${obs}/${STOP_ZONE_MIN_OBSERVATIONS} (ещё ${STOP_ZONE_MIN_OBSERVATIONS - obs})`;
  }
  if (!patterns.insights.length) {
    return `Наблюдений достаточно · ждём кластер ≥${STOP_ZONE_MIN_CLUSTER_SHIFTS} смен`;
  }
  return `${obs} наблюдений · ${patterns.insights.length} инсайт(ов)`;
}
