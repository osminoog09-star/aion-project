import type { FuelEntry } from "../types";

export type ManualFuelInput = {
  totalCost: number;
  liters: number;
  fuelType: string;
};

/** Сумма + литры → цена за литр и запись для смены. */
export function buildManualFuelEntry(input: ManualFuelInput): FuelEntry | null {
  const totalCost = Number(input.totalCost);
  const liters = Number(input.liters);
  if (!Number.isFinite(totalCost) || totalCost <= 0) return null;
  if (!Number.isFinite(liters) || liters <= 0) return null;

  const unitPrice = Math.round((totalCost / liters) * 1000) / 1000;
  const fuelType = input.fuelType.trim() || "АИ-95";

  return {
    id: `fuel_manual_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    addedAtMs: Date.now(),
    fuelType,
    liters,
    totalCost,
    unitPrice,
    source: "manual",
  };
}

export function sumFuelEntriesTotal(entries: FuelEntry[] | undefined): number {
  return (entries ?? []).reduce(
    (s, e) => s + (Number.isFinite(e.totalCost) && e.totalCost > 0 ? e.totalCost : 0),
    0,
  );
}

export function sumFuelEntriesLiters(entries: FuelEntry[] | undefined): number {
  return (entries ?? []).reduce(
    (s, e) => s + (Number.isFinite(e.liters) && e.liters > 0 ? e.liters : 0),
    0,
  );
}

/** Стоимость на 100 км по фактическим заправкам и пройденным км смены. */
export function fuelCostPer100Km(totalCost: number, distanceKm: number): number | null {
  if (totalCost <= 0 || distanceKm <= 0) return null;
  return Math.round((totalCost / distanceKm) * 100 * 10) / 10;
}
