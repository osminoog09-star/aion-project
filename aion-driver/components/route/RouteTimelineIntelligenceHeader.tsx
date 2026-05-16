import { Text, View } from "react-native";
import type { HistoricalDriverRollups } from "../../features/analytics/types/historicalDriverRollupsTypes";
import type { ShiftAnalyticsBackfillResult } from "../../features/analytics/engine/backfillShiftAnalyticsSnapshots";
import { formatStopZoneProgressRu } from "../../features/analytics/engine/computeStopZonePatterns";
import type { StopZonePatterns } from "../../features/analytics/types/stopZonePatternsTypes";
import type { RouteTimelineSummary } from "../../features/route/computeRouteTimelineSummary";
import type { AppCurrencyCode } from "../../types/device";
import { formatPerHour } from "../../utils/formatting";

type Props = {
  summary: RouteTimelineSummary;
  historical: HistoricalDriverRollups | null;
  topZoneInsight: string | null;
  stopZones?: StopZonePatterns | null;
  backfill?: ShiftAnalyticsBackfillResult | null;
  loading: boolean;
  currency: AppCurrencyCode;
};

export function RouteTimelineIntelligenceHeader({
  summary,
  historical,
  topZoneInsight,
  stopZones,
  backfill,
  loading,
  currency,
}: Props) {
  const coverage =
    summary.totalSessions > 0
      ? `${summary.withAnalytics}/${summary.totalSessions} снимков аналитики`
      : null;

  const lines: string[] = [];
  if (summary.medianProfitPerHour != null) {
    lines.push(`Медиана €/ч: ${formatPerHour(summary.medianProfitPerHour, currency)}`);
  }
  if (summary.medianIdleRatio != null) {
    lines.push(`Медиана простоя: ${Math.round(summary.medianIdleRatio * 100)}%`);
  }
  if (summary.medianRouteKmPerMovingHour != null) {
    lines.push(
      `Маршрут (медиана): ${summary.medianRouteKmPerMovingHour.toFixed(1)} км/ч движения`,
    );
  }
  if (historical?.bestWeekday?.avgProfitPerHour != null) {
    lines.push(
      `Лучший день (${historical.bestWeekday.label}): ${formatPerHour(historical.bestWeekday.avgProfitPerHour, currency)}/ч`,
    );
  }
  const bestHour = historical?.bestHoursOfDay[0];
  if (bestHour) {
    lines.push(
      `Сильное окно ~${String(bestHour.hour).padStart(2, "0")}:00 (${bestHour.windowCount} ч)`,
    );
  }

  const stopZoneProgress = formatStopZoneProgressRu(stopZones ?? null);

  if (!coverage && !lines.length && !topZoneInsight && !stopZoneProgress && !loading) return null;

  return (
    <View className="mx-4 mb-3 rounded-xl border border-violet-500/25 bg-violet-500/5 px-3 py-3">
      <Text className="text-[10px] font-bold uppercase tracking-widest text-violet-300/90">
        route intelligence
        {historical ? ` · ${historical.windowDays}д · ${historical.sampleSnapshots} снимков` : ""}
      </Text>
      {coverage ? (
        <Text className="mt-1 text-xs text-slate-400">
          {coverage}
          {loading ? " · обновление…" : ""}
        </Text>
      ) : null}
      {backfill && backfill.attempted > 0 ? (
        <Text className="mt-1 text-xs text-slate-500">
          дозаполнение аналитики: +{backfill.created} новых · {backfill.skippedExisting} уже есть ·{" "}
          {backfill.skippedNoGps} без GPS
        </Text>
      ) : null}
      {lines.map((line) => (
        <Text key={line} className="mt-1 text-xs text-slate-300">
          {line}
        </Text>
      ))}
      {stopZoneProgress ? (
        <Text className="mt-2 text-xs text-violet-300/75">stop-zone: {stopZoneProgress}</Text>
      ) : null}
      {topZoneInsight ? (
        <Text className="mt-2 text-xs text-cyan-300/80">{topZoneInsight}</Text>
      ) : null}
      <Text className="mt-2 text-[10px] text-slate-600">
        Только GPS и снимки смен · без AI-рекомендаций
      </Text>
    </View>
  );
}
