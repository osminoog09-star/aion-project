import type { ShiftAnalyticsSnapshot } from "../features/analytics/types/shiftAnalyticsTypes";
import type { ActiveShiftRuntime } from "../features/shift/runtime/activeShiftRuntimeTypes";
import type { LiveShiftMetrics } from "../features/shift/runtime/liveShiftTypes";
import type { Shift } from "../types";
import type { AppCurrencyCode } from "../types/device";
import type { ShiftOperationalCosts } from "../types/rental";
import { formatCurrencyDisplay } from "./formatting";

export type ShiftProfitDisplay = {
  profit: number;
  profitPerHour: number;
  profitPerKm: number;
  usesAfterCosts: boolean;
  operationalCosts: ShiftOperationalCosts | null;
};

function fromOperational(
  oc: ShiftOperationalCosts,
  distanceKm: number,
  grossPerKm: number,
): ShiftProfitDisplay {
  const km = distanceKm > 0 ? distanceKm : 0;
  return {
    profit: oc.profitAfterCosts,
    profitPerHour: oc.profitPerHourAfterCosts,
    profitPerKm: km > 0 ? oc.profitAfterCosts / km : grossPerKm,
    usesAfterCosts: true,
    operationalCosts: oc,
  };
}

/** Единое правило отображения прибыли: после operationalCosts если есть, иначе gross. */
export function pickProfitFromLive(metrics: LiveShiftMetrics): ShiftProfitDisplay {
  const oc = metrics.operationalCosts;
  if (oc) return fromOperational(oc, metrics.distanceKm, metrics.profitPerKm);
  return {
    profit: metrics.netProfit,
    profitPerHour: metrics.profitPerHour,
    profitPerKm: metrics.profitPerKm,
    usesAfterCosts: false,
    operationalCosts: null,
  };
}

/** Маршруты / timeline: analytics profit, иначе shift — afterCosts приоритет. */
export function pickProfitFromRouteRow(input: {
  analytics?: ShiftAnalyticsSnapshot;
  shift?: Shift;
}): {
  profit: number | null;
  profitPerHour: number | null;
  usesAfterCosts: boolean;
} {
  const p = input.analytics?.profit;
  if (p?.netProfitAfterCosts != null && p.profitPerHourAfterCosts != null) {
    return {
      profit: p.netProfitAfterCosts,
      profitPerHour: p.profitPerHourAfterCosts,
      usesAfterCosts: true,
    };
  }
  if (p) {
    return {
      profit: p.netProfit,
      profitPerHour: p.profitPerHour,
      usesAfterCosts: false,
    };
  }
  const s = input.shift;
  if (s?.netProfitAfterCosts != null && s.profitPerHourAfterCosts != null) {
    return {
      profit: s.netProfitAfterCosts,
      profitPerHour: s.profitPerHourAfterCosts,
      usesAfterCosts: true,
    };
  }
  if (s?.netProfit != null && s.profitPerHour != null) {
    return {
      profit: s.netProfit,
      profitPerHour: s.profitPerHour,
      usesAfterCosts: false,
    };
  }
  return { profit: null, profitPerHour: null, usesAfterCosts: false };
}

/** Краткая строка аренда + фикс. для HUD / истории. */
export function formatOperationalCostsBrief(
  oc: ShiftOperationalCosts,
  currency: AppCurrencyCode,
): string {
  return `Аренда ${formatCurrencyDisplay(oc.rentalAccrued, currency)} · фикс. ${formatCurrencyDisplay(oc.fixedOpsAccrued, currency)}`;
}

export function pickProfitFromRuntime(runtime: ActiveShiftRuntime): ShiftProfitDisplay {
  const oc = runtime.operationalCosts;
  const km = runtime.distanceMeters / 1000;
  if (oc) return fromOperational(oc, km, runtime.profitPerKm);
  return {
    profit: runtime.profitNet,
    profitPerHour: runtime.profitPerHour,
    profitPerKm: runtime.profitPerKm,
    usesAfterCosts: false,
    operationalCosts: null,
  };
}
