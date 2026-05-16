import type { Shift } from "../../../types";
import type { RentalEconomicsConfig } from "../../../types/rental";
import { computeShiftOperationalCosts } from "../../../utils/rentalEconomics";
import { pickProfitFromRouteRow } from "../../../utils/shiftDisplayEconomics";
import type { ActiveShiftRuntime } from "../../shift/runtime/activeShiftRuntimeTypes";

export type DriverIntelligenceSnapshot = {
  /** Средние по завершённым сменам (последние N), без выдуманных значений. */
  avgIncomePerHour: number | null;
  avgIncomePerKm: number | null;
  avgFuelPerKm: number | null;
  avgShiftEfficiency: number | null;
  /** Только при активной смене: доля «стоим» по motion-тикам. */
  liveIdleRatio: number | null;
  liveMovementRatio: number | null;
  liveFuelBurnPerHour: number | null;
  onlineIntensity: number | null;
  /** Только факт: последняя смена ≥8ч. */
  fatigueLongShiftHint: boolean;
  /** Дисперсия profit/hour по последним сменам (нормализованная 0..1), нужно ≥3 смены. */
  drivingConsistencySpread: number | null;
  /** Сколько смен вошло в средние. */
  sampleShifts: number;
  /** Средняя прибыль/час после аренды и фикс. расходов (если rental включён). */
  avgProfitAfterCostsPerHour: number | null;
};

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function shiftProfitPerHourAfterCosts(
  s: Shift,
  rental: RentalEconomicsConfig | undefined,
): number | null {
  const row = pickProfitFromRouteRow({ shift: s });
  if (row.usesAfterCosts) return row.profitPerHour;
  if (!rental?.enabled) return null;
  const costs = computeShiftOperationalCosts(s.netProfit, s.durationMs, rental);
  return costs?.profitPerHourAfterCosts ?? row.profitPerHour;
}

/**
 * Интеллект только из реальных смен + текущего runtime (без случайных score).
 */
export function computeDriverIntelligence(
  history: Shift[],
  runtime: ActiveShiftRuntime | null,
  motion: { movingMs: number; idleMs: number } | null,
  rental: RentalEconomicsConfig | undefined,
  sampleMax = 14,
): DriverIntelligenceSnapshot {
  const sample = history.slice(0, sampleMax);
  const hours = sample.map((s) => Math.max(s.durationMs / 3_600_000, 0.05));
  const incPerH = sample.map((s, i) => s.income / hours[i]!);
  const incPerKm = sample
    .filter((s) => s.distanceKm > 0.1)
    .map((s) => s.income / s.distanceKm);
  const fuelPerKm = sample
    .filter((s) => s.distanceKm > 0.1)
    .map((s) => s.fuelCostTotal / s.distanceKm);
  const eff = sample
    .filter((s) => s.income > 0)
    .map((s) => s.netProfit / s.income);

  const pph = sample.map((s) => s.profitPerHour);
  let spread: number | null = null;
  if (pph.length >= 3) {
    const m = mean(pph)!;
    const variance = pph.reduce((s, x) => s + (x - m) ** 2, 0) / pph.length;
    const sd = Math.sqrt(variance);
    spread = Math.min(1, sd / Math.max(Math.abs(m), 1));
  }

  const afterCostsPph = sample
    .map((s) => shiftProfitPerHourAfterCosts(s, rental))
    .filter((v): v is number => v != null);

  const last = history[0];
  const fatigueLongShiftHint = Boolean(last && last.durationMs >= 8 * 3_600_000);

  let liveIdleRatio: number | null = null;
  let liveMovementRatio: number | null = null;
  if (motion && motion.movingMs + motion.idleMs > 0) {
    const t = motion.movingMs + motion.idleMs;
    liveIdleRatio = motion.idleMs / t;
    liveMovementRatio = motion.movingMs / t;
  }

  let avgProfitAfterCostsPerHour: number | null = mean(afterCostsPph);
  if (
    avgProfitAfterCostsPerHour == null &&
    runtime?.operationalCosts &&
    rental?.enabled
  ) {
    avgProfitAfterCostsPerHour = runtime.operationalCosts.profitPerHourAfterCosts;
  }

  return {
    avgIncomePerHour: mean(incPerH),
    avgIncomePerKm: mean(incPerKm),
    avgFuelPerKm: mean(fuelPerKm),
    avgShiftEfficiency: mean(eff),
    liveIdleRatio,
    liveMovementRatio,
    liveFuelBurnPerHour: runtime ? runtime.metrics.avgFuelBurn : null,
    onlineIntensity: runtime ? runtime.metrics.intensity : null,
    fatigueLongShiftHint,
    drivingConsistencySpread: spread,
    sampleShifts: sample.length,
    avgProfitAfterCostsPerHour,
  };
}
