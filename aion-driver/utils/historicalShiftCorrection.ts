import type { Shift, UserProfile } from "../types";
import { computeShiftOperationalCosts } from "./rentalEconomics";

/** Ручная коррекция агрегатов завершённой смены (история). */
export type HistoricalShiftPatch = {
  income?: number;
  fuelCostTotal?: number;
  distanceKm?: number;
  durationMs?: number;
};

function splitByRatio(
  total: number,
  prevTotal: number,
  prevA: number,
  prevB: number,
): { a: number; b: number } {
  if (prevTotal > 0) {
    return {
      a: total * (prevA / prevTotal),
      b: total * (prevB / prevTotal),
    };
  }
  return { a: total, b: 0 };
}

/**
 * Пересчитывает чистую прибыль, ₽/ч, ₽/км и блок аренды по текущему профилю.
 * Пропорции бензин/газ по сумме топлива и по км сохраняются от записи смены.
 */
export function applyHistoricalShiftCorrection(
  shift: Shift,
  profile: UserProfile | null,
  patch: HistoricalShiftPatch,
): Shift {
  const income = patch.income ?? shift.income;
  const fuelCostTotal = patch.fuelCostTotal ?? shift.fuelCostTotal;
  let distanceKm = patch.distanceKm ?? shift.distanceKm;
  let durationMs = patch.durationMs ?? shift.durationMs;

  const safeIncome = Math.max(0, Number.isFinite(income) ? income : 0);
  const safeFuel = Math.max(0, Number.isFinite(fuelCostTotal) ? fuelCostTotal : 0);
  distanceKm = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  durationMs = Math.max(0, Number.isFinite(durationMs) ? durationMs : 0);

  const fuelSplit = splitByRatio(
    safeFuel,
    shift.fuelCostTotal,
    shift.fuelCostPetrol,
    shift.fuelCostGas,
  );
  let distanceKmPetrol = shift.distanceKmPetrol;
  let distanceKmGas = shift.distanceKmGas;
  if (patch.distanceKm !== undefined && shift.distanceKm > 0) {
    const { a, b } = splitByRatio(
      distanceKm,
      shift.distanceKm,
      shift.distanceKmPetrol,
      shift.distanceKmGas,
    );
    distanceKmPetrol = a;
    distanceKmGas = b;
  }

  let fuelUsedPetrolLiters = shift.fuelUsedPetrolLiters;
  let fuelUsedGasLiters = shift.fuelUsedGasLiters;
  if (patch.distanceKm !== undefined && shift.distanceKm > 0) {
    const scale = distanceKm / shift.distanceKm;
    if (Number.isFinite(scale) && scale > 0) {
      fuelUsedPetrolLiters = shift.fuelUsedPetrolLiters * scale;
      fuelUsedGasLiters = shift.fuelUsedGasLiters * scale;
    }
  }

  const gasSavingsRub =
    patch.fuelCostTotal !== undefined ? 0 : shift.gasSavingsRub;

  const netProfit = safeIncome - safeFuel;
  const hours = durationMs > 0 ? durationMs / 3_600_000 : 0;
  const profitPerHour = hours > 0 ? netProfit / hours : 0;
  const profitPerKm = distanceKm > 0 ? netProfit / distanceKm : 0;

  const base: Shift = {
    ...shift,
    income: safeIncome,
    fuelCostPetrol: fuelSplit.a,
    fuelCostGas: fuelSplit.b,
    fuelCostTotal: safeFuel,
    gasSavingsRub,
    distanceKm,
    distanceKmPetrol,
    distanceKmGas,
    durationMs,
    fuelUsedPetrolLiters,
    fuelUsedGasLiters,
    netProfit,
    profitPerHour,
    profitPerKm,
  };

  const oc = computeShiftOperationalCosts(
    netProfit,
    durationMs,
    profile?.rentalEconomics,
  );

  if (!oc) {
    return {
      ...base,
      rentalCostAccrued: undefined,
      fixedOpsCost: undefined,
      netProfitAfterCosts: undefined,
      profitPerHourAfterCosts: undefined,
    };
  }

  return {
    ...base,
    rentalCostAccrued: oc.rentalAccrued,
    fixedOpsCost: oc.fixedOpsAccrued,
    netProfitAfterCosts: oc.profitAfterCosts,
    profitPerHourAfterCosts: oc.profitPerHourAfterCosts,
  };
}
