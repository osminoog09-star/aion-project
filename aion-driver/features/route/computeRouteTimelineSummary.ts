import type { ShiftAnalyticsSnapshot } from "../analytics/types/shiftAnalyticsTypes";
import type { HistoricalDriverRollups } from "../analytics/types/historicalDriverRollupsTypes";
import type { StopZonePatterns } from "../analytics/types/stopZonePatternsTypes";
import { pickProfitFromRouteRow } from "../../utils/shiftDisplayEconomics";
import type { RouteTimelineRow } from "./useRouteTimeline";

export type RouteTimelineSummary = {
  totalSessions: number;
  withAnalytics: number;
  medianProfitPerHour: number | null;
  medianIdleRatio: number | null;
  medianRouteKmPerMovingHour: number | null;
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

export function computeRouteTimelineSummary(
  rows: RouteTimelineRow[],
  analyticsByShift: Map<string, ShiftAnalyticsSnapshot>,
): RouteTimelineSummary {
  const pph: number[] = [];
  const idle: number[] = [];
  const routeKm: number[] = [];
  let withAnalytics = 0;

  for (const row of rows) {
    const analytics = analyticsByShift.get(row.shiftId) ?? row.analytics;
    if (analytics) withAnalytics += 1;

    const p = pickProfitFromRouteRow({ analytics, shift: row.shift }).profitPerHour;
    if (p != null && p > 0) pph.push(p);

    const idleRatio = analytics?.idle.idleRatio ?? row.summary.idleRatio;
    if (idleRatio >= 0) idle.push(idleRatio);

    const kmh = analytics?.route.routeEfficiencyKmPerMovingHour;
    if (kmh != null && kmh > 0) routeKm.push(kmh);
  }

  return {
    totalSessions: rows.length,
    withAnalytics,
    medianProfitPerHour: median(pph),
    medianIdleRatio: median(idle),
    medianRouteKmPerMovingHour: median(routeKm),
  };
}

export function mergeRouteTimelineContext(
  summary: RouteTimelineSummary,
  historical: HistoricalDriverRollups | null,
): RouteTimelineSummary {
  if (!historical) return summary;
  return {
    ...summary,
    medianProfitPerHour:
      summary.medianProfitPerHour ?? historical.medianProfitPerHourAfterCosts ?? historical.medianProfitPerHour,
    medianIdleRatio: summary.medianIdleRatio ?? historical.medianIdleRatio,
    medianRouteKmPerMovingHour:
      summary.medianRouteKmPerMovingHour ?? historical.medianRouteEfficiencyKmPerMovingHour,
  };
}

export function pickTopStopZoneInsight(
  stopZones: StopZonePatterns | null,
): string | null {
  return stopZones?.insights[0]?.text ?? null;
}
