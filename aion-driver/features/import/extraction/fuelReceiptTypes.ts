/** Семейство топлива по тексту чека (эвристика). */
export type FuelFamily = "petrol" | "diesel" | "cng" | "lpg" | "ev" | "unknown";

export type FuelReceiptFields = {
  totalPrice?: number;
  liters?: number;
  kg?: number;
  pricePerLiter?: number;
  pricePerKg?: number;
  fuelFamily?: FuelFamily;
  /** Не ISO — только фрагмент из текста, если есть. */
  timestampNote?: string;
  stationNote?: string;
};

/**
 * Структурированное извлечение из чека АЗС. Без совпадений — null (не подставляем числа «от себя»).
 */
export type FuelReceiptExtraction = {
  confidence: number;
  fields: FuelReceiptFields;
  /** Внутренние метки паттернов (диагностика). */
  matchedPatterns: string[];
};

export type DashboardFields = {
  odometerKm?: number;
  tripDistanceKm?: number;
  avgConsumptionLPer100?: number;
  rangeRemainingKm?: number;
  movingTimeNote?: string;
};

export type DashboardExtraction = {
  confidence: number;
  fields: DashboardFields;
  matchedPatterns: string[];
};
