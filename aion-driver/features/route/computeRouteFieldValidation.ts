import type { ShiftAnalyticsBackfillResult } from "../analytics/engine/backfillShiftAnalyticsSnapshots";
import type { HistoricalDriverRollups } from "../analytics/types/historicalDriverRollupsTypes";
import type { StopZonePatterns } from "../analytics/types/stopZonePatternsTypes";
import type { RouteTimelineSummary } from "./computeRouteTimelineSummary";

export type FieldValidationCheck = {
  id: string;
  labelRu: string;
  passed: boolean;
  detailRu: string;
  /** Что сделать на устройстве, если пункт не пройден. */
  actionRu: string;
};

export type RouteFieldValidationStatus = {
  ready: boolean;
  passedCount: number;
  totalCount: number;
  coveragePercent: number | null;
  checks: FieldValidationCheck[];
};

function check(
  id: string,
  labelRu: string,
  passed: boolean,
  detailRu: string,
  actionRu: string,
): FieldValidationCheck {
  return { id, labelRu, passed, detailRu, actionRu };
}

/** Device field-validation checklist — honest gates for roadmap P1. */
export const FGS_HEARTBEAT_FRESH_MS = 5 * 60_000;

export function isFgsHeartbeatFresh(
  ageMs: number | null,
  freshMs = FGS_HEARTBEAT_FRESH_MS,
): boolean {
  return ageMs != null && ageMs >= 0 && ageMs < freshMs;
}

/** OTA smoke — все пункты чеклиста, включая FGS и merge state. */
export const FIELD_VALIDATION_MIN_PASSED = 8;

export function computeRouteFieldValidation(input: {
  summary: RouteTimelineSummary;
  backfill: ShiftAnalyticsBackfillResult | null;
  stopZones: StopZonePatterns | null;
  historical: HistoricalDriverRollups | null;
  topZoneInsight: string | null;
  fgsHeartbeatAgeMs?: number | null;
  hasBgMergeState?: boolean;
  /** Из formatStopZoneProgressRu на экране — единый текст progress. */
  stopZoneProgressRu?: string | null;
}): RouteFieldValidationStatus {
  const {
    summary,
    backfill,
    stopZones,
    historical,
    topZoneInsight,
    fgsHeartbeatAgeMs,
    hasBgMergeState,
    stopZoneProgressRu: stopZoneProgress,
  } = input;

  const coveragePercent =
    summary.totalSessions > 0
      ? Math.round((summary.withAnalytics / summary.totalSessions) * 100)
      : null;

  const checks: FieldValidationCheck[] = [
    check(
      "gps-sessions",
      "Есть GPS-смены",
      summary.totalSessions >= 1,
      summary.totalSessions >= 1
        ? `${summary.totalSessions} смен с треком`
        : "Завершите смену с включённым GPS",
      "Смена → 5+ км с GPS → завершить смену → вернуться сюда",
    ),
    check(
      "analytics-coverage",
      "Покрытие снимками аналитики",
      coveragePercent != null && coveragePercent >= 50,
      coveragePercent != null
        ? `${summary.withAnalytics}/${summary.totalSessions} (${coveragePercent}%)`
        : "Нет смен для расчёта",
      "Завершите ещё 1–2 GPS-смены или pull-to-refresh",
    ),
    check(
      "backfill-ran",
      "Backfill отработал",
      backfill != null && (backfill.attempted > 0 || backfill.created > 0 || backfill.skippedExisting > 0),
      backfill
        ? `попыток ${backfill.attempted} · +${backfill.created} · пропуск ${backfill.skippedExisting}`
        : "Потяните экран вниз для обновления",
      "Потяните экран вниз — дозаполнение аналитики стартует автоматически",
    ),
    check(
      "historical-rollups",
      "Исторические rollups",
      (historical?.sampleSnapshots ?? 0) >= 2,
      historical
        ? `${historical.sampleSnapshots} снимков за ${historical.windowDays}д`
        : "Нужно ≥2 снимка аналитики",
      "Нужны ≥2 завершённые смены со снимком аналитики",
    ),
    check(
      "stop-observations",
      "Данные для stop-zone",
      (stopZones?.stopObservationCount ?? 0) >= 5,
      stopZoneProgress ??
        (stopZones
          ? `${stopZones.stopObservationCount} наблюдений · ${stopZones.sampleShifts} смен`
          : "Мало остановок ≥3 мин"),
      "Больше остановок ≥3 мин в реальных сменах (клиенты, АЗС)",
    ),
    check(
      "stop-insights",
      "Stop-zone insights",
      Boolean(topZoneInsight && stopZones && stopZones.insights.length > 0),
      topZoneInsight
        ? topZoneInsight.slice(0, 72) + (topZoneInsight.length > 72 ? "…" : "")
        : (stopZoneProgress ?? "Нужно ≥2 смены с кластерами остановок"),
      "Ещё 1–2 смены с повторяющимися зонами остановок",
    ),
    check(
      "fgs-heartbeat",
      "FGS heartbeat (фон)",
      isFgsHeartbeatFresh(fgsHeartbeatAgeMs ?? null, FGS_HEARTBEAT_FRESH_MS),
      fgsHeartbeatAgeMs != null
        ? `последний сигнал ${Math.round(fgsHeartbeatAgeMs / 1000)} сек назад`
        : "Сверните приложение на 2+ мин при активной смене",
      "Активная смена → свернуть Driver на 2–3 мин → вернуться на Маршруты",
    ),
    check(
      "bg-merge-state",
      "Headless merge state",
      Boolean(hasBgMergeState),
      hasBgMergeState
        ? "waterline сохранён — headless GPS merge активен"
        : "Нужна смена с фоновым треком Android",
      "Android: смена с FGS + хотя бы одна точка в фоне",
    ),
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const ready = passedCount >= FIELD_VALIDATION_MIN_PASSED;

  return {
    ready,
    passedCount,
    totalCount: checks.length,
    coveragePercent,
    checks,
  };
}

/** Краткий список невыполненных пунктов — для UI / отчёта на устройстве. */
export function formatFieldValidationBlockersRu(
  status: RouteFieldValidationStatus,
): string {
  const failed = status.checks.filter((c) => !c.passed);
  if (!failed.length) return "";
  return failed.map((c) => `${c.labelRu} — ${c.detailRu}`).join(" · ");
}

/** Полный отчёт для OTA smoke / owner (многострочный). */
export function formatFieldValidationReportRu(status: RouteFieldValidationStatus): string {
  const header = status.ready
    ? "FIELD VALIDATION: ГОТОВО (8/8) — OTA smoke"
    : `FIELD VALIDATION: ${status.passedCount}/${status.totalCount}`;
  const lines = status.checks.map(
    (c) =>
      `${c.passed ? "✓" : "○"} ${c.labelRu}: ${c.detailRu}${
        !c.passed && c.actionRu ? ` → ${c.actionRu}` : ""
      }`,
  );
  return [header, ...lines].join("\n");
}
