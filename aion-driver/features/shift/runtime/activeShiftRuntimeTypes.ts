import type { ActiveShift, FuelEntry, IncomeEntry, Shift } from "../../../types";
import type { ShiftOperationalCosts } from "../../../types/rental";
import type { MotionState } from "../../../services/locationPolicy";
import type { LiveShiftMetrics } from "./liveShiftTypes";

export type ShiftState = "inactive" | "active" | "paused" | "ended";

/**
 * Единый runtime-срез активной смены: все KPI читаются отсюда (после гидрации).
 */
export type ActiveShiftRuntime = {
  id: string;
  startedAt: number;
  paused: boolean;
  ended: boolean;
  distanceMeters: number;
  durationMs: number;
  incomeTotal: number;
  fuelTotal: number;
  profitNet: number;
  profitPerHour: number;
  profitPerKm: number;
  operationalCosts: ShiftOperationalCosts | null;
  fuelEntries: FuelEntry[];
  incomeEntries: IncomeEntry[];
  metrics: {
    avgFuelBurn: number;
    routeEfficiency: number;
    intensity: number;
    streak: number;
  };
  sync: {
    pending: number;
    lastFlush: number | null;
  };
  uiShiftState: ShiftState;
  motionState: MotionState;
};

export function deriveShiftState(input: {
  hydrated: boolean;
  activeShift: { paused?: boolean } | null;
  postShiftHandoff: Shift | null;
}): ShiftState {
  if (!input.hydrated) return "inactive";
  if (input.postShiftHandoff) return "ended";
  if (!input.activeShift) return "inactive";
  if (input.activeShift.paused) return "paused";
  return "active";
}

export function buildActiveShiftRuntime(input: {
  activeShift: ActiveShift;
  live: LiveShiftMetrics;
  syncPending: number;
  syncLastFlush: number | null;
  motionState: MotionState;
}): ActiveShiftRuntime {
  const { activeShift, live, syncPending, syncLastFlush, motionState } = input;
  const startedAt = Date.parse(activeShift.startedAt);
  const safeStart = Number.isFinite(startedAt) ? startedAt : Date.now();
  const hours = live.durationMs > 0 ? live.durationMs / 3_600_000 : 0;
  const fuelEntries = activeShift.fuelEntries ?? [];
  const incomeEntries = activeShift.incomeLedger ?? [];
  const distKm = live.distanceKm;
  const routeEfficiency = distKm > 0 ? live.income / distKm : 0;
  const intensity =
    motionState === "moving"
      ? Math.min(
          1,
          0.32 + distKm / 48 + live.durationMs / (11 * 3_600_000),
        )
      : 0.26;

  return {
    id: activeShift.id,
    startedAt: safeStart,
    paused: Boolean(activeShift.paused),
    ended: false,
    distanceMeters: activeShift.distanceMeters,
    durationMs: live.durationMs,
    incomeTotal: live.income,
    fuelTotal: live.fuelCostTotal,
    profitNet: live.netProfit,
    profitPerHour: live.profitPerHour,
    profitPerKm: live.profitPerKm,
    operationalCosts: live.operationalCosts,
    fuelEntries,
    incomeEntries,
    metrics: {
      avgFuelBurn: hours > 0 ? live.fuelCostTotal / hours : 0,
      routeEfficiency,
      intensity,
      streak: activeShift.incomeEventsCount ?? 0,
    },
    sync: { pending: syncPending, lastFlush: syncLastFlush },
    uiShiftState: activeShift.paused ? "paused" : "active",
    motionState,
  };
}
