import type { ShiftAnalyticsSnapshot } from "../types/shiftAnalyticsTypes";
import {
  WEEKDAY_LABELS_RU,
  type HistoricalDriverRollups,
  type HourOfDayPatternRollup,
  type WeekdayPatternRollup,
} from "../types/historicalDriverRollupsTypes";

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function filterByWindow(
  snapshots: ShiftAnalyticsSnapshot[],
  windowDays: number,
  nowMs = Date.now(),
): ShiftAnalyticsSnapshot[] {
  const cutoff = nowMs - windowDays * 86_400_000;
  return snapshots.filter((s) => s.time.shiftEndedAtMs >= cutoff);
}

function buildWeekdayPatterns(snapshots: ShiftAnalyticsSnapshot[]): WeekdayPatternRollup[] {
  const buckets = new Map<
    number,
    { profit: number[]; profitAfter: number[]; idle: number[] }
  >();

  for (const s of snapshots) {
    const day = new Date(s.time.shiftStartedAtMs).getDay();
    const b = buckets.get(day) ?? { profit: [], profitAfter: [], idle: [] };
    b.profit.push(s.profit.profitPerHour);
    if (s.profit.profitPerHourAfterCosts != null) {
      b.profitAfter.push(s.profit.profitPerHourAfterCosts);
    }
    b.idle.push(s.idle.idleRatio);
    buckets.set(day, b);
  }

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const b = buckets.get(dayIndex);
    return {
      dayIndex,
      label: WEEKDAY_LABELS_RU[dayIndex]!,
      shiftCount: b ? b.profit.length : 0,
      avgProfitPerHour: b ? mean(b.profit) : null,
      avgProfitPerHourAfterCosts: b?.profitAfter.length ? mean(b.profitAfter) : null,
      avgIdleRatio: b ? mean(b.idle) : null,
    };
  });
}

function pickWeekdayExtreme(
  patterns: WeekdayPatternRollup[],
  pick: "best" | "worst",
): WeekdayPatternRollup | null {
  const eligible = patterns.filter((p) => p.shiftCount >= 2 && p.avgProfitPerHour != null);
  if (!eligible.length) return null;
  return [...eligible].sort((a, b) => {
    const av = a.avgProfitPerHour!;
    const bv = b.avgProfitPerHour!;
    return pick === "best" ? bv - av : av - bv;
  })[0]!;
}

function buildHourOfDayPatterns(snapshots: ShiftAnalyticsSnapshot[]): HourOfDayPatternRollup[] {
  const byHour = new Map<number, { profit: number[]; idle: number[]; weight: number[] }>();

  for (const s of snapshots) {
    for (const bucket of s.time.hourlyBuckets) {
      if (bucket.durationMs < 5 * 60_000) continue;
      const hour = new Date(bucket.startMs).getHours();
      const row = byHour.get(hour) ?? { profit: [], idle: [], weight: [] };
      row.profit.push(bucket.profitPerHourProxy);
      row.idle.push(bucket.idleRatio);
      row.weight.push(bucket.durationMs);
      byHour.set(hour, row);
    }
  }

  return Array.from(byHour.entries())
    .map(([hour, row]) => ({
      hour,
      windowCount: row.profit.length,
      avgProfitPerHourProxy: mean(row.profit) ?? 0,
      avgIdleRatio: mean(row.idle) ?? 0,
    }))
    .filter((r) => r.windowCount >= 2);
}

function pickHourExtremes(
  hours: HourOfDayPatternRollup[],
  n: number,
  pick: "best" | "worst",
): HourOfDayPatternRollup[] {
  return [...hours]
    .sort((a, b) => {
      const av = a.avgProfitPerHourProxy;
      const bv = b.avgProfitPerHourProxy;
      return pick === "best" ? bv - av : av - bv;
    })
    .slice(0, n);
}

/**
 * Агрегация только из persisted ShiftAnalyticsSnapshot — без выдуманных score.
 */
export function computeHistoricalDriverRollups(
  snapshots: ShiftAnalyticsSnapshot[],
  windowDays = 30,
  nowMs = Date.now(),
): HistoricalDriverRollups | null {
  const inWindow = filterByWindow(snapshots, windowDays, nowMs);
  if (inWindow.length < 2) return null;

  const idleRatios = inWindow.map((s) => s.idle.idleRatio);
  const profitPerHour = inWindow.map((s) => s.profit.profitPerHour);
  const profitAfter = inWindow
    .map((s) => s.profit.profitPerHourAfterCosts)
    .filter((v): v is number => v != null);

  const weekdayPatterns = buildWeekdayPatterns(inWindow);
  const hourPatterns = buildHourOfDayPatterns(inWindow);
  const routeEfficiencies = inWindow
    .filter((s) => s.route.pointCount >= 5 && s.route.routeEfficiencyKmPerMovingHour > 0)
    .map((s) => s.route.routeEfficiencyKmPerMovingHour);

  return {
    windowDays,
    sampleSnapshots: inWindow.length,
    medianIdleRatio: median(idleRatios),
    medianProfitPerHour: median(profitPerHour),
    medianProfitPerHourAfterCosts: profitAfter.length ? median(profitAfter) : null,
    weekdayPatterns,
    bestWeekday: pickWeekdayExtreme(weekdayPatterns, "best"),
    worstWeekday: pickWeekdayExtreme(weekdayPatterns, "worst"),
    bestHoursOfDay: pickHourExtremes(hourPatterns, 2, "best"),
    worstHoursOfDay: pickHourExtremes(hourPatterns, 2, "worst"),
    medianRouteEfficiencyKmPerMovingHour: routeEfficiencies.length
      ? median(routeEfficiencies)
      : null,
  };
}
