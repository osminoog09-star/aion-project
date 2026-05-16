export const WEEKDAY_LABELS_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;

export type WeekdayPatternRollup = {
  dayIndex: number;
  label: string;
  shiftCount: number;
  avgProfitPerHour: number | null;
  avgProfitPerHourAfterCosts: number | null;
  avgIdleRatio: number | null;
};

export type HourOfDayPatternRollup = {
  hour: number;
  windowCount: number;
  avgProfitPerHourProxy: number;
  avgIdleRatio: number;
};

export type HistoricalDriverRollups = {
  windowDays: number;
  sampleSnapshots: number;
  medianIdleRatio: number | null;
  medianProfitPerHour: number | null;
  medianProfitPerHourAfterCosts: number | null;
  weekdayPatterns: WeekdayPatternRollup[];
  bestWeekday: WeekdayPatternRollup | null;
  worstWeekday: WeekdayPatternRollup | null;
  bestHoursOfDay: HourOfDayPatternRollup[];
  worstHoursOfDay: HourOfDayPatternRollup[];
  /** км/ч движения по GPS (медиана по сменам с ≥5 точками). */
  medianRouteEfficiencyKmPerMovingHour: number | null;
};
