import { WeekFuelSpark } from "../charts/WeekFuelSpark";
import { MonthWeekProfitSpark } from "../charts/MonthWeekProfitSpark";
import { WeekProfitSpark } from "../charts/WeekProfitSpark";
import type { SparkVariant } from "../charts/sparkTypes";
import type { AppCurrencyCode } from "../../types/device";

export type DashboardSparkChartsProps = {
  weekSpark: number[];
  weekFuelSpark: number[];
  monthWeekSpark: number[];
  currency: AppCurrencyCode;
  chartVariant: SparkVariant;
};

export function DashboardSparkCharts({
  weekSpark,
  weekFuelSpark,
  monthWeekSpark,
  currency,
  chartVariant,
}: DashboardSparkChartsProps) {
  return (
    <>
      <WeekProfitSpark values={weekSpark} currency={currency} variant={chartVariant} />
      <WeekFuelSpark values={weekFuelSpark} currency={currency} variant={chartVariant} />
      <MonthWeekProfitSpark values={monthWeekSpark} currency={currency} variant={chartVariant} />
    </>
  );
}
