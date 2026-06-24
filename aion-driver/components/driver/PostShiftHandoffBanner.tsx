import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { loadShiftAnalytics } from "../../features/analytics/storage/shiftAnalyticsStorage";
import type { ShiftAnalyticsSnapshot } from "../../features/analytics/types/shiftAnalyticsTypes";
import { useShift } from "../../hooks/useShift";
import { useResolvedCurrency } from "../../hooks/useResolvedCurrency";
import { formatCurrencyDisplay, formatPerHour } from "../../utils/formatting";
import { pickProfitFromRouteRow } from "../../utils/shiftDisplayEconomics";

export function PostShiftHandoffBanner() {
  const { shiftState, postShiftHandoff, dismissPostShiftHandoff } = useShift();
  const currency = useResolvedCurrency();
  const [analytics, setAnalytics] = useState<ShiftAnalyticsSnapshot | null>(null);

  useEffect(() => {
    if (!postShiftHandoff?.id) {
      setAnalytics(null);
      return;
    }
    let alive = true;
    void loadShiftAnalytics(postShiftHandoff.id).then((snap) => {
      if (alive) setAnalytics(snap);
    });
    return () => {
      alive = false;
    };
  }, [postShiftHandoff?.id]);

  if (shiftState !== "ended" || !postShiftHandoff) return null;

  const { profit, profitPerHour: pph, usesAfterCosts } = pickProfitFromRouteRow({
    analytics: analytics ?? undefined,
    shift: postShiftHandoff,
  });

  return (
    <View className="border-b border-emerald-500/25 bg-emerald-950/90 px-4 py-3">
      <Text className="text-[10px] uppercase tracking-widest text-emerald-400/90">
        Смена завершена
      </Text>
      <Text className="mt-1 text-sm text-slate-200">
        {profit != null ? formatCurrencyDisplay(profit, currency) : "—"}
        {usesAfterCosts ? " (после расходов)" : ""} · {postShiftHandoff.distanceKm.toFixed(1)} км ·{" "}
        {Math.round(postShiftHandoff.durationMs / 60_000)} мин
      </Text>
      {analytics && pph != null ? (
        <Text className="mt-1 text-xs text-slate-400">
          простой {Math.round(analytics.idle.idleRatio * 100)}% · {formatPerHour(pph, currency)} · стопы{" "}
          {analytics.idle.stopCount} · маршрут{" "}
          {analytics.route.routeEfficiencyKmPerMovingHour.toFixed(1)} км/ч
        </Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => void dismissPostShiftHandoff()}
          className="rounded-full border border-white/15 bg-white/10 px-4 py-2"
        >
          <Text className="text-xs font-semibold text-white">Закрыть</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void dismissPostShiftHandoff();
            router.push("/driver");
          }}
          className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-2"
        >
          <Text className="text-xs font-semibold text-emerald-200">На пульт</Text>
        </Pressable>
      </View>
    </View>
  );
}
