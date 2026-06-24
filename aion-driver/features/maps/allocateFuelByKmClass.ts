/**
 * Задел под «Fuel: распределение по классам км» (roadmap Maps/Fuel).
 *
 * Чистая, детерминированная математика — БЕЗ движка карт и БЕЗ показа выдуманных
 * чисел в UI. Запускается только когда есть реальные классифицированные километры
 * (заказ / подача / порожняк / личное), полученные из GPS. Модель — первого порядка:
 * топливные деньги распределяются пропорционально пройденному расстоянию каждого класса.
 *
 * Польза, которую даёт результат: видно, сколько топливных денег ушло на «порожняк»
 * и «личное» (неоплачиваемые км) — реальная утечка прибыли.
 *
 * Тест: scripts/ci/test-fuel-allocation.mjs
 */

export type KmClass = "order" | "pickup" | "empty" | "personal";

export type KmByClass = Record<KmClass, number>;

export type FuelClassSlice = {
  km: number;
  /** Доля класса в общем пробеге, 0..100 (округлено до целого). */
  sharePercent: number;
  /** Распределённые топливные деньги на этот класс. */
  fuelCost: number;
};

export type FuelAllocationResult = {
  totalKm: number;
  totalFuelCost: number;
  /** Средняя стоимость топлива на км по всей смене. */
  fuelCostPerKm: number;
  byClass: Record<KmClass, FuelClassSlice>;
  /** Оплачиваемые км (заказ + подача). */
  billableKm: number;
  /** Неоплачиваемые км (порожняк + личное). */
  unpaidKm: number;
  /** Топливные деньги на оплачиваемых км. */
  billableFuelCost: number;
  /** Топливные деньги, «сгоревшие» на неоплачиваемых км — потеря. */
  unpaidFuelCost: number;
};

const CLASSES: KmClass[] = ["order", "pickup", "empty", "personal"];
const BILLABLE: KmClass[] = ["order", "pickup"];

function safe(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function allocateFuelByKmClass(input: {
  classKm: Partial<KmByClass>;
  totalFuelCost: number;
}): FuelAllocationResult {
  const km: KmByClass = {
    order: safe(input.classKm.order ?? 0),
    pickup: safe(input.classKm.pickup ?? 0),
    empty: safe(input.classKm.empty ?? 0),
    personal: safe(input.classKm.personal ?? 0),
  };
  const totalFuelCost = safe(input.totalFuelCost);
  const totalKm = CLASSES.reduce((sum, c) => sum + km[c], 0);

  const byClass = {} as Record<KmClass, FuelClassSlice>;
  for (const c of CLASSES) {
    const share = totalKm > 0 ? km[c] / totalKm : 0;
    byClass[c] = {
      km: round2(km[c]),
      sharePercent: Math.round(share * 100),
      fuelCost: round2(totalFuelCost * share),
    };
  }

  const billableKm = BILLABLE.reduce((s, c) => s + km[c], 0);
  const unpaidKm = totalKm - billableKm;
  // Считаем по классам (а не total - billable), чтобы при 0 км ничего не приписывать.
  const billableFuelCost = round2(byClass.order.fuelCost + byClass.pickup.fuelCost);
  const unpaidFuelCost = round2(byClass.empty.fuelCost + byClass.personal.fuelCost);

  return {
    totalKm: round2(totalKm),
    totalFuelCost: round2(totalFuelCost),
    fuelCostPerKm: totalKm > 0 ? round2(totalFuelCost / totalKm) : 0,
    byClass,
    billableKm: round2(billableKm),
    unpaidKm: round2(unpaidKm),
    billableFuelCost,
    unpaidFuelCost,
  };
}
