/** Период аренды для пропорционального начисления на смену. */
export type RentalPeriod = "day" | "week" | "month";

/**
 * Аренда и фиксированные операционные расходы (парковка и т.п.).
 * deposit — только учёт, не входит в profitAfterCosts смены.
 */
export type RentalEconomicsConfig = {
  enabled: boolean;
  period: RentalPeriod;
  /** Сумма за полный period (день / неделя / месяц). */
  amount: number;
  /** Залог (информативно, не амортизируется на смену). */
  depositAmount?: number;
  /** Фикс. расходы в день (парковка и т.д.), пропорционально длительности смены. */
  fixedOpsPerDay?: number;
};

export type ShiftOperationalCosts = {
  rentalAccrued: number;
  fixedOpsAccrued: number;
  totalOperationalCost: number;
  profitAfterCosts: number;
  profitPerHourAfterCosts: number;
};
