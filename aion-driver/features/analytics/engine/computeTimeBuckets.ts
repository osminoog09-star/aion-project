import type { IncomeEntry } from "../../../types";
import type { GpsStopPoint, GpsTripPointRecord } from "../../gps/tripStore/gpsTripTypes";
import type { AnalyticsWorkWindow } from "../types/shiftAnalyticsTypes";

const BUCKET_MS = 60 * 60_000;

function overlapMs(a0: number, a1: number, b0: number, b1: number): number {
  const start = Math.max(a0, b0);
  const end = Math.min(a1, b1);
  return Math.max(0, end - start);
}

export function computeHourlyWorkBuckets(input: {
  startedAtMs: number;
  endedAtMs: number;
  incomeLedger: IncomeEntry[];
  points: GpsTripPointRecord[];
  stops: GpsStopPoint[];
}): AnalyticsWorkWindow[] {
  const { startedAtMs, endedAtMs, incomeLedger, points, stops } = input;
  if (endedAtMs <= startedAtMs) return [];

  const buckets: AnalyticsWorkWindow[] = [];
  for (let t = startedAtMs; t < endedAtMs; t += BUCKET_MS) {
    const startMs = t;
    const endMs = Math.min(t + BUCKET_MS, endedAtMs);
    const durationMs = endMs - startMs;
    if (durationMs <= 0) continue;

    let incomeInWindow = 0;
    for (const e of incomeLedger) {
      if (e.atMs >= startMs && e.atMs < endMs) incomeInWindow += e.amount;
    }

    let distanceMeters = 0;
    for (const p of points) {
      if (p.t >= startMs && p.t < endMs && p.dM != null && p.dM > 0) {
        distanceMeters += p.dM;
      }
    }

    let idleMs = 0;
    for (const s of stops) {
      idleMs += overlapMs(s.startedAtMs, s.endedAtMs, startMs, endMs);
    }
    idleMs = Math.min(durationMs, idleMs);
    const movingMs = Math.max(0, durationMs - idleMs);
    const idleRatio = durationMs > 0 ? idleMs / durationMs : 0;
    const hours = durationMs / 3_600_000;
    const profitPerHourProxy = hours > 0 ? incomeInWindow / hours : 0;
    const movementEfficiencyKmPerH =
      movingMs > 0 ? distanceMeters / 1000 / (movingMs / 3_600_000) : 0;

    buckets.push({
      startMs,
      endMs,
      durationMs,
      incomeInWindow,
      profitPerHourProxy,
      idleRatio,
      distanceMeters,
      movementEfficiencyKmPerH,
    });
  }

  return buckets;
}

export function pickTopWindows(
  buckets: AnalyticsWorkWindow[],
  sortKey: (b: AnalyticsWorkWindow) => number,
  n = 3,
): AnalyticsWorkWindow[] {
  return [...buckets]
    .filter((b) => b.durationMs >= 5 * 60_000)
    .sort((a, b) => sortKey(b) - sortKey(a))
    .slice(0, n);
}

export function pickBottomWindows(
  buckets: AnalyticsWorkWindow[],
  sortKey: (b: AnalyticsWorkWindow) => number,
  n = 3,
): AnalyticsWorkWindow[] {
  return [...buckets]
    .filter((b) => b.durationMs >= 5 * 60_000 && sortKey(b) > 0)
    .sort((a, b) => sortKey(a) - sortKey(b))
    .slice(0, n);
}
