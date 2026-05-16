import type { RentalEconomicsConfig, RentalPeriod, ShiftOperationalCosts } from "../types/rental";

const MS_DAY = 86_400_000;

function periodMs(period: RentalPeriod): number {
  if (period === "day") return MS_DAY;
  if (period === "week") return 7 * MS_DAY;
  return 30 * MS_DAY;
}

/** Пропорциональное начисление аренды за длительность смены (без выдуманных коэффициентов). */
export function computeRentalAccrual(
  config: RentalEconomicsConfig,
  durationMs: number,
): number {
  if (!config.enabled || config.amount <= 0 || durationMs <= 0) return 0;
  const share = Math.min(1, durationMs / periodMs(config.period));
  return config.amount * share;
}

export function computeFixedOpsAccrual(
  config: RentalEconomicsConfig,
  durationMs: number,
): number {
  const perDay = config.fixedOpsPerDay ?? 0;
  if (!config.enabled || perDay <= 0 || durationMs <= 0) return 0;
  return perDay * (durationMs / MS_DAY);
}

export function computeShiftOperationalCosts(
  netProfit: number,
  durationMs: number,
  config: RentalEconomicsConfig | undefined | null,
): ShiftOperationalCosts | null {
  if (!config?.enabled) return null;
  const rentalAccrued = computeRentalAccrual(config, durationMs);
  const fixedOpsAccrued = computeFixedOpsAccrual(config, durationMs);
  const totalOperationalCost = rentalAccrued + fixedOpsAccrued;
  const profitAfterCosts = netProfit - totalOperationalCost;
  const hours = durationMs > 0 ? durationMs / 3_600_000 : 0;
  const profitPerHourAfterCosts = hours > 0 ? profitAfterCosts / hours : 0;
  return {
    rentalAccrued,
    fixedOpsAccrued,
    totalOperationalCost,
    profitAfterCosts,
    profitPerHourAfterCosts,
  };
}
