import type { FuelEntry } from "../types";
import type { DualFuelShiftMetrics } from "./calculations";

/**
 * Если есть подтверждённые заправки, стоимость топлива смены = сумма чеков
 * (оценка по GPS/профилю не смешивается, чтобы не двойничать).
 */
export function mergeConfirmedFuelCosts(
  base: DualFuelShiftMetrics,
  income: number,
  durationMs: number,
  fuelEntries: FuelEntry[] | undefined,
): DualFuelShiftMetrics {
  const entries = fuelEntries ?? [];
  const confirmed = entries.reduce(
    (s, e) => s + (Number.isFinite(e.totalCost) && e.totalCost > 0 ? e.totalCost : 0),
    0,
  );
  if (confirmed <= 0) return base;

  const distanceKm = base.distanceKm;
  const hours = durationMs > 0 ? durationMs / 3_600_000 : 0;
  const netProfit = income - confirmed;
  const profitPerHour = hours > 0 ? netProfit / hours : 0;
  const profitPerKm = distanceKm > 0 ? netProfit / distanceKm : 0;
  const shareP = distanceKm > 0 ? base.distanceKmPetrol / distanceKm : 1;
  const shareG = Math.max(0, 1 - shareP);

  return {
    ...base,
    fuelCostPetrol: confirmed * shareP,
    fuelCostGas: confirmed * shareG,
    fuelCostTotal: confirmed,
    gasSavingsRub: 0,
    netProfit,
    profitPerHour,
    profitPerKm,
  };
}
