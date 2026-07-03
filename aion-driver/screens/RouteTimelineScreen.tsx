import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteTimelineFieldValidationCard } from "../components/route/RouteTimelineFieldValidationCard";
import { RouteTimelineIntelligenceHeader } from "../components/route/RouteTimelineIntelligenceHeader";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { GlowCard } from "../components/ui/GlowCard";
import { KmClassCard } from "../components/driver/KmClassCard";
import { useHistoricalDriverRollups } from "../features/analytics/hooks/useHistoricalDriverRollups";
import { useDevice } from "../hooks/useDevice";
import { useMergedShiftHistory } from "../features/trips/hooks/useMergedShiftHistory";
import {
  computeRouteTimelineSummary,
  mergeRouteTimelineContext,
  pickTopStopZoneInsight,
} from "../features/route/computeRouteTimelineSummary";
import { formatStopZoneProgressRu } from "../features/analytics/stopZoneProgressRu";
import { computeRouteFieldValidation } from "../features/route/computeRouteFieldValidation";
import {
  isFgsHeartbeatFresh,
  readShiftBgMergeStatePresent,
  readShiftLocationHeartbeat,
} from "../storage/driver/readShiftLocationHeartbeat";
import { groupRouteTimelineRows } from "../features/route/groupRouteAnalytics";
import { useRouteTimeline, type RouteTimelineRow } from "../features/route/useRouteTimeline";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { useResolvedDistanceUnits } from "../hooks/useResolvedDistanceUnits";
import type { ShiftAnalyticsSnapshot } from "../features/analytics/types/shiftAnalyticsTypes";
import type { AppCurrencyCode, DistanceUnits } from "../types/device";
import {
  formatCurrencyDisplay,
  formatDuration,
  formatKm,
} from "../utils/formatting";
import { pickProfitFromRouteRow } from "../utils/shiftDisplayEconomics";

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function RouteRow({
  row,
  expanded,
  onToggle,
  currency,
  distanceUnits,
}: {
  row: RouteTimelineRow;
  expanded: boolean;
  onToggle: () => void;
  currency: AppCurrencyCode;
  distanceUnits: DistanceUnits;
}) {
  const { summary, session, shift, analytics } = row;
  const { profit, profitPerHour: pph, usesAfterCosts } = pickProfitFromRouteRow({
    analytics,
    shift,
  });

  return (
    <GlowCard glow="cyan" className="mb-3" onPress={onToggle}>
      <Text className="text-xs uppercase tracking-widest text-cyan-300/70">
        {analytics ? "аналитика смены" : "маршрут"}
      </Text>
      <Text className="mt-1 text-lg font-semibold text-white">{row.label}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Metric label="км" value={formatKm(summary.distanceMeters / 1000, distanceUnits)} />
        <Metric label="время" value={formatDuration(summary.durationMs)} />
        <Metric label="стопы" value={String(summary.stopCount)} />
        <Metric label="idle" value={pct(analytics?.idle.idleRatio ?? summary.idleRatio)} />
        {pph != null && pph > 0 ? (
          <Metric label="€/ч" value={Math.round(pph).toString()} />
        ) : null}
      </View>
      {profit != null ? (
        <Text className="mt-2 text-sm text-emerald-300/90">
          {usesAfterCosts ? "прибыль после расходов" : "прибыль"}:{" "}
          {formatCurrencyDisplay(profit, currency)}
        </Text>
      ) : null}
      {expanded && analytics ? <AnalyticsDetail analytics={analytics} /> : null}
      {expanded ? (
        <View className="mt-3 border-t border-white/10 pt-3">
          <Text className="text-xs text-slate-400">
            точек: {summary.pointCount} · движение:{" "}
            {formatDuration(analytics?.route.movingMs ?? summary.movingMs)} · простой:{" "}
            {formatDuration(analytics?.route.idleMs ?? summary.idleMs)}
          </Text>
          {analytics ? (
            <Text className="mt-1 text-xs text-slate-500">
              эффективность маршрута:{" "}
              {analytics.route.routeEfficiencyKmPerMovingHour.toFixed(1)} км/ч движения
              {analytics.profit.fuelEfficiencyLPer100Km != null
                ? ` · топливо ${analytics.profit.fuelEfficiencyLPer100Km.toFixed(1)} л/100км`
                : ""}
            </Text>
          ) : null}
          {session.stops.length > 0 ? (
            <View className="mt-2">
              {session.stops.slice(0, 3).map((s, i) => (
                <Text key={i} className="text-xs text-slate-500">
                  стоп {i + 1}: {formatDuration(s.durationMs)}
                </Text>
              ))}
            </View>
          ) : (
            <Text className="mt-2 text-xs text-slate-600">Остановки ≥3 мин не найдены</Text>
          )}
          {shift ? (
            <KmClassCard
              shiftId={shift.id}
              points={session.points}
              shiftStartMs={Date.parse(shift.startedAt)}
              shiftEndMs={Date.parse(shift.endedAt)}
              fuelCost={shift.fuelCostTotal}
              currency={currency}
            />
          ) : null}
        </View>
      ) : null}
    </GlowCard>
  );
}

function AnalyticsDetail({ analytics }: { analytics: ShiftAnalyticsSnapshot }) {
  const peak = analytics.time.highestProfitPerHourWindow;
  const idlePeak = analytics.time.highestIdleWindow;

  return (
    <View className="mt-3 rounded-lg bg-white/5 p-3">
      <Text className="text-xs uppercase text-slate-500">Аналитика простоя</Text>
      <Text className="mt-1 text-xs text-slate-300">
        простой {formatDuration(analytics.idle.totalIdleMs)} · макс. стоп{" "}
        {formatDuration(analytics.idle.longestStopMs)} · ср. стоп{" "}
        {formatDuration(analytics.idle.averageStopMs)}
      </Text>
      {peak ? (
        <Text className="mt-2 text-xs text-cyan-300/80">
          пик €/ч (прокси): {Math.round(peak.profitPerHourProxy)} ·{" "}
          {new Date(peak.startMs).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          –
          {new Date(peak.endMs).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      ) : null}
      {idlePeak && idlePeak.idleRatio > 0.2 ? (
        <Text className="mt-1 text-xs text-amber-300/70">
          макс. idle окно: {pct(idlePeak.idleRatio)} ·{" "}
          {formatDuration(idlePeak.durationMs)}
        </Text>
      ) : null}
      <Text className="mt-2 text-xs text-slate-500">
        активных окон: {analytics.activeWorkWindows.length} · без AI-рекомендаций
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-lg bg-white/5 px-2 py-1">
      <Text className="text-[10px] uppercase text-slate-500">{label}</Text>
      <Text className="text-sm font-medium text-white">{value}</Text>
    </View>
  );
}

export function RouteTimelineScreen() {
  const router = useRouter();
  const { settings } = useDevice();
  const currency = useResolvedCurrency();
  const distanceUnits = useResolvedDistanceUnits();
  const { merged: history } = useMergedShiftHistory();
  const { rows, analyticsByShift, loading, refresh } = useRouteTimeline(history);
  const {
    rollups: historicalRollups,
    stopZones,
    backfill: backfillStats,
    loading: historicalLoading,
    refresh: refreshHistorical,
  } = useHistoricalDriverRollups(30);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bgDiag, setBgDiag] = useState<{
    fgsHeartbeatAgeMs: number | null;
    hasBgMergeState: boolean;
  }>({ fgsHeartbeatAgeMs: null, hasBgMergeState: false });

  const groups = useMemo(
    () => groupRouteTimelineRows(rows, analyticsByShift),
    [rows, analyticsByShift],
  );

  const timelineSummary = useMemo(() => {
    const base = computeRouteTimelineSummary(rows, analyticsByShift);
    return mergeRouteTimelineContext(base, historicalRollups);
  }, [rows, analyticsByShift, historicalRollups]);

  const topZoneInsight = useMemo(() => pickTopStopZoneInsight(stopZones), [stopZones]);

  const loadBgDiag = useCallback(async () => {
    const [hb, hasMerge] = await Promise.all([
      readShiftLocationHeartbeat(),
      readShiftBgMergeStatePresent(),
    ]);
    setBgDiag({
      fgsHeartbeatAgeMs: hb?.ageMs ?? null,
      hasBgMergeState: hasMerge,
    });
  }, []);

  useEffect(() => {
    void loadBgDiag();
  }, [loadBgDiag]);

  useFocusEffect(
    useCallback(() => {
      void loadBgDiag();
    }, [loadBgDiag]),
  );

  useEffect(() => {
    const id = setInterval(() => {
      void loadBgDiag();
    }, 30_000);
    return () => clearInterval(id);
  }, [loadBgDiag]);

  const stopZoneProgressRu = useMemo(
    () => formatStopZoneProgressRu(stopZones),
    [stopZones],
  );

  const fieldValidation = useMemo(
    () =>
      computeRouteFieldValidation({
        summary: timelineSummary,
        backfill: backfillStats,
        stopZones,
        historical: historicalRollups,
        topZoneInsight,
        fgsHeartbeatAgeMs: bgDiag.fgsHeartbeatAgeMs,
        hasBgMergeState: bgDiag.hasBgMergeState,
        stopZoneProgressRu,
      }),
    [
      timelineSummary,
      backfillStats,
      stopZones,
      historicalRollups,
      topZoneInsight,
      bgDiag.fgsHeartbeatAgeMs,
      bgDiag.hasBgMergeState,
      stopZoneProgressRu,
    ],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshHistorical(), loadBgDiag()]);
    setRefreshing(false);
  }, [refresh, refreshHistorical, loadBgDiag]);

  const bgVariant =
    settings.nightContrast === "nightDrive" ? "nightDrive" : "cockpit";

  return (
    <CockpitBackground variant={bgVariant}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="px-4 pb-3 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-sm text-cyan-400">← назад</Text>
          </Pressable>
          <Text className="mt-2 text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            route intelligence
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-white">Маршруты</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Снимки аналитики · группировка · {rows.length} GPS-смен
            {bgDiag.fgsHeartbeatAgeMs != null
              ? ` · FGS ${Math.round(bgDiag.fgsHeartbeatAgeMs / 1000)}с${
                  isFgsHeartbeatFresh(bgDiag.fgsHeartbeatAgeMs) ? "" : " (устарел)"
                }`
              : ""}
            {loading || historicalLoading ? " · загрузка…" : ""}
          </Text>
        </View>
        <RouteTimelineFieldValidationCard
          validation={fieldValidation}
          loading={loading || historicalLoading}
        />
        <RouteTimelineIntelligenceHeader
          summary={timelineSummary}
          historical={historicalRollups}
          topZoneInsight={topZoneInsight}
          stopZones={stopZones}
          backfill={backfillStats}
          loading={loading || historicalLoading}
          currency={currency}
        />
        <SectionList
          sections={groups.map((g) => ({
            title: g.title,
            subtitle: g.subtitle,
            data: g.rows,
          }))}
          keyExtractor={(item) => item.shiftId}
          renderSectionHeader={({ section }) => (
            <View className="mb-2 mt-2 px-4">
              <Text className="text-sm font-semibold text-white">{section.title}</Text>
              <Text className="text-xs text-slate-500">{section.subtitle}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="px-4">
              <RouteRow
                row={item}
                expanded={expandedId === item.shiftId}
                onToggle={() =>
                  setExpandedId((id) => (id === item.shiftId ? null : item.shiftId))
                }
                currency={currency}
                distanceUnits={distanceUnits}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 110 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            !loading ? (
              <Text className="px-4 text-center text-slate-500">
                Нет GPS-сессий. Завершите смену с включённым трекингом.
              </Text>
            ) : null
          }
        />
      </SafeAreaView>
    </CockpitBackground>
  );
}
