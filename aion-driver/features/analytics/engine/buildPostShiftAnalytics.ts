import type { ActiveShift, Shift } from "../../../types";
import type { ShiftGpsSession } from "../../gps/tripStore/gpsTripTypes";
import type { GpsTripSessionSummary } from "../../gps/storage/gpsStorageAdapter";
import { buildRouteSessionSummary } from "../../gps/tripStore/buildRouteSummary";
import type {
  IdleAnalyticsSnapshot,
  ProfitAnalyticsSnapshot,
  RouteAnalyticsSnapshot,
  ShiftAnalyticsSnapshot,
  ShiftTimingSnapshot,
  TimeAnalyticsSnapshot,
} from "../types/shiftAnalyticsTypes";
import { SHIFT_ANALYTICS_VERSION } from "../types/shiftAnalyticsTypes";
import {
  computeHourlyWorkBuckets,
  pickBottomWindows,
  pickTopWindows,
} from "./computeTimeBuckets";

function kmPerMovingHour(distanceMeters: number, movingMs: number): number {
  if (movingMs <= 0) return 0;
  return distanceMeters / 1000 / (movingMs / 3_600_000);
}

function resolveMotionTiming(
  durationMs: number,
  route: RouteAnalyticsSnapshot | null,
  motionMovingMs: number,
  motionIdleMs: number,
): { movingMs: number; idleMs: number } {
  if (route && route.pointCount >= 5) {
    return { movingMs: route.movingMs, idleMs: route.idleMs };
  }
  const motionTotal = motionMovingMs + motionIdleMs;
  if (motionTotal > 0) {
    return {
      movingMs: Math.min(durationMs, motionMovingMs),
      idleMs: Math.min(durationMs, motionIdleMs),
    };
  }
  return { movingMs: durationMs, idleMs: 0 };
}

function buildRouteSnapshot(
  session: ShiftGpsSession | null,
  gpsSummary: GpsTripSessionSummary | null,
  startedAtMs: number,
  endedAtMs: number,
): RouteAnalyticsSnapshot {
  const routeSummary =
    gpsSummary?.routeSummary ??
    session?.routeSummary ??
    (session?.points.length
      ? buildRouteSessionSummary({
          points: session.points,
          stops: session.stops,
          startedAtMs,
          endedAtMs,
        })
      : null);

  if (!routeSummary) {
    return {
      distanceMeters: 0,
      durationMs: Math.max(0, endedAtMs - startedAtMs),
      movingMs: 0,
      idleMs: 0,
      idleRatio: 0,
      stopCount: 0,
      stopDurationMs: 0,
      routeEfficiencyKmPerMovingHour: 0,
      bounds: null,
      pointCount: 0,
    };
  }

  return {
    distanceMeters: routeSummary.distanceMeters,
    durationMs: routeSummary.durationMs,
    movingMs: routeSummary.movingMs,
    idleMs: routeSummary.idleMs,
    idleRatio: routeSummary.idleRatio,
    stopCount: routeSummary.stopCount,
    stopDurationMs: routeSummary.stopDurationMs,
    routeEfficiencyKmPerMovingHour: kmPerMovingHour(
      routeSummary.distanceMeters,
      routeSummary.movingMs,
    ),
    bounds: routeSummary.bounds,
    pointCount: routeSummary.pointCount,
  };
}

function buildIdleSnapshot(
  route: RouteAnalyticsSnapshot,
  stops: { durationMs: number }[],
): IdleAnalyticsSnapshot {
  const stopDurations = stops.map((s) => s.durationMs);
  const longestStopMs = stopDurations.length ? Math.max(...stopDurations) : 0;
  const averageStopMs =
    stopDurations.length > 0
      ? stopDurations.reduce((a, b) => a + b, 0) / stopDurations.length
      : 0;

  return {
    totalIdleMs: route.idleMs,
    longestStopMs,
    averageStopMs,
    idleRatio: route.idleRatio,
    stopCount: route.stopCount,
    movingMs: route.movingMs,
    waitingMs: route.idleMs,
  };
}

function buildProfitSnapshot(shift: Shift): ProfitAnalyticsSnapshot {
  const liters =
    (shift.fuelUsedPetrolLiters ?? 0) + (shift.fuelUsedGasLiters ?? 0);
  const fuelEfficiencyLPer100Km =
    shift.distanceKm > 0.1 ? (liters / shift.distanceKm) * 100 : null;

  return {
    income: shift.income,
    netProfit: shift.netProfit,
    netProfitAfterCosts: shift.netProfitAfterCosts ?? null,
    profitPerHour: shift.profitPerHour,
    profitPerHourAfterCosts: shift.profitPerHourAfterCosts ?? null,
    profitPerKm: shift.profitPerKm,
    fuelCostTotal: shift.fuelCostTotal,
    fuelEfficiencyLPer100Km,
    rentalCostAccrued: shift.rentalCostAccrued ?? null,
  };
}

export function buildPostShiftAnalytics(input: {
  shift: Shift;
  activeShift: ActiveShift;
  gpsSummary: GpsTripSessionSummary | null;
  gpsSession: ShiftGpsSession | null;
}): ShiftAnalyticsSnapshot {
  const { shift, activeShift, gpsSummary, gpsSession } = input;
  const startedAtMs = Date.parse(shift.startedAt);
  const endedAtMs = Date.parse(shift.endedAt);
  const safeStart = Number.isFinite(startedAtMs) ? startedAtMs : Date.now();
  const safeEnd = Number.isFinite(endedAtMs) ? endedAtMs : Date.now();

  const route = buildRouteSnapshot(gpsSession, gpsSummary, safeStart, safeEnd);
  const motion = resolveMotionTiming(
    shift.durationMs,
    route,
    activeShift.motionMovingMs ?? 0,
    activeShift.motionIdleMs ?? 0,
  );

  const pausedMs = activeShift.accumulatedPauseMs ?? 0;
  const shiftTiming: ShiftTimingSnapshot = {
    totalDurationMs: shift.durationMs,
    movingDurationMs: motion.movingMs,
    idleDurationMs: motion.idleMs,
    idleRatio: shift.durationMs > 0 ? motion.idleMs / shift.durationMs : 0,
    pausedMs,
  };

  const stops = gpsSession?.stops ?? [];
  const idle = buildIdleSnapshot(route, stops);
  const profit = buildProfitSnapshot(shift);

  const hourlyBuckets = computeHourlyWorkBuckets({
    startedAtMs: safeStart,
    endedAtMs: safeEnd,
    incomeLedger: activeShift.incomeLedger ?? [],
    points: gpsSession?.points ?? [],
    stops,
  });

  const strongestWorkWindows = pickTopWindows(
    hourlyBuckets,
    (b) => b.profitPerHourProxy,
  );
  const weakestWorkWindows = pickBottomWindows(
    hourlyBuckets,
    (b) => b.profitPerHourProxy,
  );
  const highestProfitPerHourWindow =
    pickTopWindows(hourlyBuckets, (b) => b.profitPerHourProxy, 1)[0] ?? null;
  const highestMovementEfficiencyWindow =
    pickTopWindows(hourlyBuckets, (b) => b.movementEfficiencyKmPerH, 1)[0] ?? null;
  const highestIdleWindow =
    pickTopWindows(hourlyBuckets, (b) => b.idleRatio, 1)[0] ?? null;

  const activeWorkWindows = hourlyBuckets.filter(
    (b) => b.distanceMeters > 200 || b.incomeInWindow > 0,
  );

  const time: TimeAnalyticsSnapshot = {
    shiftStartedAtMs: safeStart,
    shiftEndedAtMs: safeEnd,
    hourlyBuckets,
    strongestWorkWindows,
    weakestWorkWindows,
    highestProfitPerHourWindow,
    highestMovementEfficiencyWindow,
    highestIdleWindow,
  };

  return {
    version: SHIFT_ANALYTICS_VERSION,
    shiftId: shift.id,
    computedAtMs: Date.now(),
    shift: shiftTiming,
    route,
    idle,
    time,
    profit,
    activeWorkWindows,
  };
}
