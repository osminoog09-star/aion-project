import type { DualFuelShiftMetrics } from "./calculations";

export type ProfitFuelRates = {
  fuelCostPerKm: number;
  fuelCostPerHour: number;
  netProfitPerKm: number;
  netProfitPerHour: number;
};

/**
 * Производные от уже посчитанных метрик смены (без новых «догадок» о топливе).
 */
export function deriveProfitFuelRates(
  m: DualFuelShiftMetrics,
  durationMs: number,
): ProfitFuelRates {
  const hours = durationMs > 0 ? durationMs / 3_600_000 : 0;
  const dkm = m.distanceKm > 0 ? m.distanceKm : 0;
  return {
    fuelCostPerKm: dkm > 0 ? m.fuelCostTotal / dkm : 0,
    fuelCostPerHour: hours > 0 ? m.fuelCostTotal / hours : 0,
    netProfitPerKm: dkm > 0 ? m.netProfit / dkm : 0,
    netProfitPerHour: hours > 0 ? m.netProfit / hours : 0,
  };
}
