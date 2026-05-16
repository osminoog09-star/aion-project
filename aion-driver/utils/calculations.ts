import type { UserProfile } from "../types";

export function litersForDistance(
  distanceKm: number,
  consumptionLPer100Km: number
): number {
  return (distanceKm * consumptionLPer100Km) / 100;
}

export type DualFuelShiftMetrics = {
  distanceKm: number;
  distanceKmPetrol: number;
  distanceKmGas: number;
  fuelUsedPetrolLiters: number;
  fuelUsedGasLiters: number;
  fuelCostPetrol: number;
  fuelCostGas: number;
  fuelCostTotal: number;
  gasSavingsRub: number;
  netProfit: number;
  profitPerHour: number;
  profitPerKm: number;
};

/**
 * Расходы по видам топлива, общая стоимость, чистая прибыль и экономия на газу
 * (сколько сэкономили относительно поездки тех же км на бензине).
 */
/** Выравнивает км по видам топлива под суммарный пробег GPS (погрешность округления). */
export function reconcileFuelSplitKm(input: {
  totalKm: number;
  kmPetrol: number;
  kmGas: number;
}): { kmPetrol: number; kmGas: number } {
  const { totalKm, kmPetrol, kmGas } = input;
  if (totalKm <= 0) return { kmPetrol: 0, kmGas: 0 };
  const sum = kmPetrol + kmGas;
  if (sum <= 0) return { kmPetrol: totalKm, kmGas: 0 };
  if (Math.abs(sum - totalKm) < 0.0005) return { kmPetrol, kmGas };
  const scale = totalKm / sum;
  return { kmPetrol: kmPetrol * scale, kmGas: kmGas * scale };
}

export function computeDualFuelShiftMetrics(
  profile: UserProfile,
  input: {
    kmPetrol: number;
    kmGas: number;
    income: number;
    durationMs: number;
  }
): DualFuelShiftMetrics {
  const { kmPetrol, kmGas, income, durationMs } = input;
  const fuelUsedPetrolLiters = litersForDistance(
    kmPetrol,
    profile.petrolConsumptionLPer100Km
  );
  const fuelUsedGasLiters = litersForDistance(
    kmGas,
    profile.gasConsumptionLPer100Km
  );
  const fuelCostPetrol =
    fuelUsedPetrolLiters * profile.petrolPricePerLiter;
  const fuelCostGas = fuelUsedGasLiters * profile.gasPricePerLiter;
  const fuelCostTotal = fuelCostPetrol + fuelCostGas;

  const petrolCostIfGasKmOnPetrol =
    litersForDistance(kmGas, profile.petrolConsumptionLPer100Km) *
    profile.petrolPricePerLiter;
  const gasSavingsRub = petrolCostIfGasKmOnPetrol - fuelCostGas;

  const netProfit = income - fuelCostTotal;
  const distanceKm = kmPetrol + kmGas;
  const hours = durationMs > 0 ? durationMs / 3_600_000 : 0;
  const profitPerHour = hours > 0 ? netProfit / hours : 0;
  const profitPerKm = distanceKm > 0 ? netProfit / distanceKm : 0;

  return {
    distanceKm,
    distanceKmPetrol: kmPetrol,
    distanceKmGas: kmGas,
    fuelUsedPetrolLiters,
    fuelUsedGasLiters,
    fuelCostPetrol,
    fuelCostGas,
    fuelCostTotal,
    gasSavingsRub,
    netProfit,
    profitPerHour,
    profitPerKm,
  };
}
