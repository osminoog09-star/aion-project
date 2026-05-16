import type { RouteBounds } from "../../gps/tripStore/gpsTripTypes";

export const SHIFT_ANALYTICS_VERSION = 1 as const;

export type ShiftTimingSnapshot = {
  totalDurationMs: number;
  movingDurationMs: number;
  idleDurationMs: number;
  idleRatio: number;
  pausedMs: number;
};

export type RouteAnalyticsSnapshot = {
  distanceMeters: number;
  durationMs: number;
  movingMs: number;
  idleMs: number;
  idleRatio: number;
  stopCount: number;
  stopDurationMs: number;
  /** км / час движения (GPS). */
  routeEfficiencyKmPerMovingHour: number;
  bounds: RouteBounds | null;
  pointCount: number;
};

export type IdleAnalyticsSnapshot = {
  totalIdleMs: number;
  longestStopMs: number;
  averageStopMs: number;
  idleRatio: number;
  stopCount: number;
  movingMs: number;
  waitingMs: number;
};

export type AnalyticsWorkWindow = {
  startMs: number;
  endMs: number;
  durationMs: number;
  incomeInWindow: number;
  profitPerHourProxy: number;
  idleRatio: number;
  distanceMeters: number;
  movementEfficiencyKmPerH: number;
};

export type TimeAnalyticsSnapshot = {
  shiftStartedAtMs: number;
  shiftEndedAtMs: number;
  hourlyBuckets: AnalyticsWorkWindow[];
  strongestWorkWindows: AnalyticsWorkWindow[];
  weakestWorkWindows: AnalyticsWorkWindow[];
  highestProfitPerHourWindow: AnalyticsWorkWindow | null;
  highestMovementEfficiencyWindow: AnalyticsWorkWindow | null;
  highestIdleWindow: AnalyticsWorkWindow | null;
};

export type ProfitAnalyticsSnapshot = {
  income: number;
  netProfit: number;
  netProfitAfterCosts: number | null;
  profitPerHour: number;
  profitPerHourAfterCosts: number | null;
  profitPerKm: number;
  fuelCostTotal: number;
  fuelEfficiencyLPer100Km: number | null;
  rentalCostAccrued: number | null;
};

/** Производные снимки смены — не дублировать raw Shift в UI расчётах. */
export type ShiftAnalyticsSnapshot = {
  version: typeof SHIFT_ANALYTICS_VERSION;
  shiftId: string;
  computedAtMs: number;
  shift: ShiftTimingSnapshot;
  route: RouteAnalyticsSnapshot;
  idle: IdleAnalyticsSnapshot;
  time: TimeAnalyticsSnapshot;
  profit: ProfitAnalyticsSnapshot;
  activeWorkWindows: AnalyticsWorkWindow[];
};
