import { Text, View } from "react-native";
import type { HistoricalDriverRollups } from "../../features/analytics/types/historicalDriverRollupsTypes";
import type { StopZonePatterns } from "../../features/analytics/types/stopZonePatternsTypes";
import { formatStopZoneProgressRu } from "../../features/analytics/stopZoneProgressRu";
import type { DriverIntelligenceSnapshot } from "../../features/driver/intelligence/computeDriverIntelligence";
import type { RentalEconomicsConfig } from "../../types/rental";
import { formatCurrencyDisplay, formatPerHour } from "../../utils/formatting";
import type { AppCurrencyCode } from "../../types/device";

type Props = {
  intel: DriverIntelligenceSnapshot;
  historical?: HistoricalDriverRollups | null;
  stopZones?: StopZonePatterns | null;
  rental?: RentalEconomicsConfig;
  currency: AppCurrencyCode;
};

export function DriverIntelligenceStrip({
  intel,
  historical,
  stopZones,
  rental,
  currency,
}: Props) {
  if (intel.sampleShifts < 1 && intel.liveIdleRatio == null && !historical && !stopZones) {
    return null;
  }

  const rows: string[] = [];
  if (intel.avgIncomePerHour != null) {
    rows.push(`Доход/ч (ср.): ${formatPerHour(intel.avgIncomePerHour, currency)}`);
  }
  if (rental?.enabled && intel.avgProfitAfterCostsPerHour != null) {
    rows.push(
      `Чистая после аренды/ч: ${formatPerHour(intel.avgProfitAfterCostsPerHour, currency)}`,
    );
  }
  if (intel.avgFuelPerKm != null) {
    rows.push(`Топливо/км (ср.): ${formatCurrencyDisplay(intel.avgFuelPerKm, currency)}`);
  }
  if (intel.liveIdleRatio != null) {
    rows.push(`Простой сейчас: ${Math.round(intel.liveIdleRatio * 100)}%`);
  }
  if (intel.fatigueLongShiftHint) {
    rows.push("Последняя смена ≥8 ч — отдых");
  }

  if (historical) {
    if (historical.medianProfitPerHour != null) {
      rows.push(
        `${historical.windowDays}д · медиана €/ч: ${formatPerHour(historical.medianProfitPerHour, currency)}`,
      );
    }
    if (rental?.enabled && historical.medianProfitPerHourAfterCosts != null) {
      rows.push(
        `${historical.windowDays}д · чистая медиана €/ч: ${formatPerHour(historical.medianProfitPerHourAfterCosts, currency)}`,
      );
    }
    if (historical.medianIdleRatio != null) {
      rows.push(
        `${historical.windowDays}д · простой (медиана): ${Math.round(historical.medianIdleRatio * 100)}%`,
      );
    }
    if (historical.bestWeekday && historical.bestWeekday.avgProfitPerHour != null) {
      rows.push(
        `Лучший день (${historical.bestWeekday.label}, ${historical.bestWeekday.shiftCount} смен): ${formatPerHour(historical.bestWeekday.avgProfitPerHour, currency)}/ч`,
      );
    }
    const bestHour = historical.bestHoursOfDay[0];
    if (bestHour) {
      rows.push(
        `Сильное окно ~${String(bestHour.hour).padStart(2, "0")}:00 (${bestHour.windowCount} ч)`,
      );
    }
    if (historical.medianRouteEfficiencyKmPerMovingHour != null) {
      rows.push(
        `${historical.windowDays}д · маршрут (медиана): ${historical.medianRouteEfficiencyKmPerMovingHour.toFixed(1)} км/ч движения`,
      );
    }
  }

  const stopProgress = formatStopZoneProgressRu(stopZones ?? null);
  if (stopProgress) {
    rows.push(`Stop-zone: ${stopProgress}`);
  }
  if (stopZones) {
    for (const insight of stopZones.insights) {
      rows.push(`${insight.text} (${insight.evidence})`);
    }
  }

  if (!rows.length) return null;

  return (
    <View className="mt-3 rounded-xl border border-violet-500/25 bg-violet-500/5 px-3 py-2">
      <Text className="text-[10px] font-bold uppercase tracking-widest text-violet-300/90">
        Driver intelligence · {intel.sampleShifts} смен
        {historical ? ` · ${historical.sampleSnapshots} снимков` : ""}
      </Text>
      {rows.map((line) => (
        <Text key={line} className="mt-1 text-xs text-slate-300">
          {line}
        </Text>
      ))}
    </View>
  );
}
