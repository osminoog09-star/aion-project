import type { ShiftAnalyticsSnapshot } from "../analytics/types/shiftAnalyticsTypes";
import { pickProfitFromRouteRow } from "../../utils/shiftDisplayEconomics";
import type { RouteTimelineRow } from "./useRouteTimeline";

function routeRowProfitPerHour(
  row: RouteTimelineRow,
  analytics?: ShiftAnalyticsSnapshot,
): number {
  return pickProfitFromRouteRow({ analytics, shift: row.shift }).profitPerHour ?? 0;
}

export type RouteTimelineGroupId =
  | "recent"
  | "idleHeavy"
  | "strongProfit"
  | "weakProfit";

export type RouteTimelineGroup = {
  id: RouteTimelineGroupId;
  title: string;
  subtitle: string;
  rows: RouteTimelineRow[];
};

const IDLE_HEAVY_RATIO = 0.35;

function groupSubtitleStats(
  rows: RouteTimelineRow[],
  analyticsByShift: Map<string, ShiftAnalyticsSnapshot>,
): string {
  if (!rows.length) return "";
  let idleSum = 0;
  let pphSum = 0;
  let pphCount = 0;
  for (const row of rows) {
    const analytics = analyticsByShift.get(row.shiftId) ?? row.analytics;
    idleSum += analytics?.idle.idleRatio ?? row.summary.idleRatio;
    const pph = routeRowProfitPerHour(row, analytics);
    if (pph > 0) {
      pphSum += pph;
      pphCount += 1;
    }
  }
  const avgIdle = Math.round((idleSum / rows.length) * 100);
  const avgPph = pphCount > 0 ? Math.round(pphSum / pphCount) : null;
  return avgPph != null ? `${rows.length} смен · idle ср. ${avgIdle}% · €/ч ср. ${avgPph}` : `${rows.length} смен · idle ср. ${avgIdle}%`;
}

export function groupRouteTimelineRows(
  rows: RouteTimelineRow[],
  analyticsByShift: Map<string, ShiftAnalyticsSnapshot>,
): RouteTimelineGroup[] {
  if (!rows.length) return [];

  const withAnalytics = rows.map((row) => ({
    row,
    analytics: analyticsByShift.get(row.shiftId) ?? row.analytics,
  }));

  const profitValues = withAnalytics
    .map(({ analytics, row }) => routeRowProfitPerHour(row, analytics))
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  const medianPph =
    profitValues.length > 0
      ? profitValues[Math.floor(profitValues.length / 2)]!
      : 0;
  const strongThreshold = medianPph * 1.15;
  const weakThreshold = medianPph * 0.85;

  const idleHeavy: RouteTimelineRow[] = [];
  const strongProfit: RouteTimelineRow[] = [];
  const weakProfit: RouteTimelineRow[] = [];
  const recent: RouteTimelineRow[] = [];

  for (const { row, analytics } of withAnalytics) {
    recent.push(row);
    const idleRatio =
      analytics?.idle.idleRatio ?? row.summary.idleRatio;
    const pph = routeRowProfitPerHour(row, analytics);

    if (idleRatio >= IDLE_HEAVY_RATIO) idleHeavy.push(row);
    if (pph >= strongThreshold && pph > 0) strongProfit.push(row);
    if (pph > 0 && pph <= weakThreshold) weakProfit.push(row);
  }

  const recentSlice = recent.slice(0, 20);

  const groups: RouteTimelineGroup[] = [
    {
      id: "recent",
      title: "Недавние смены",
      subtitle: groupSubtitleStats(recentSlice, analyticsByShift),
      rows: recentSlice,
    },
  ];

  if (idleHeavy.length) {
    const slice = idleHeavy.slice(0, 12);
    groups.push({
      id: "idleHeavy",
      title: "Много простоя",
      subtitle: `idle ≥ ${Math.round(IDLE_HEAVY_RATIO * 100)}% · ${groupSubtitleStats(slice, analyticsByShift)}`,
      rows: slice,
    });
  }

  if (strongProfit.length) {
    const slice = strongProfit.slice(0, 12);
    groups.push({
      id: "strongProfit",
      title: "Сильные смены",
      subtitle: `выше медианы €/ч · ${groupSubtitleStats(slice, analyticsByShift)}`,
      rows: slice,
    });
  }

  if (weakProfit.length) {
    const slice = weakProfit.slice(0, 12);
    groups.push({
      id: "weakProfit",
      title: "Слабые смены",
      subtitle: `ниже медианы €/ч · ${groupSubtitleStats(slice, analyticsByShift)}`,
      rows: slice,
    });
  }

  return groups;
}
