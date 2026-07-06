import { router, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
const DashboardSparkCharts = lazy(() =>
  import("../components/dashboard/DashboardSparkCharts").then((m) => ({ default: m.DashboardSparkCharts })),
);
import { AppConfirmModal } from "../components/feedback/AppConfirmModal";
import { AiInsightStrip } from "../components/ai/AiInsightStrip";
import { FuelTypeToggle } from "../components/FuelTypeToggle";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { AnimatedCounter } from "../components/ui/AnimatedCounter";
import { GlowCard } from "../components/ui/GlowCard";
import { GlowMeter } from "../components/ui/GlowMeter";
import { GradientButton } from "../components/ui/GradientButton";
import { MetricCard } from "../components/ui/MetricCard";
import { SkeletonBlock } from "../components/ui/SkeletonBlock";
import { DriverBriefTimeline } from "../components/driver/DriverBriefTimeline";
import { DriverSyncStrip } from "../components/driver/DriverSyncStrip";
import { FuelEntriesCard } from "../components/fuel/FuelEntriesCard";
import { BugReportModal } from "../features/feedback/BugReportModal";
import { ApkUpdateBanner } from "../components/update/ApkUpdateBanner";
import { EfficiencyScoreRing } from "../components/driver/EfficiencyScoreRing";
import { ShiftHudBar } from "../components/driver/ShiftHudBar";
import { DriverIntelligenceStrip } from "../components/driver/DriverIntelligenceStrip";
import { OrderActivityControl } from "../components/driver/OrderActivityControl";
import { buildDashboardAiBlocks } from "../features/ai/services/dashboardAiBlocks";
import { useDriverAnalytics } from "../features/driver/analytics/useDriverAnalytics";
import { useTimelineEntries } from "../features/history/useTimelineEntries";
import { useMergedShiftHistory } from "../features/trips/hooks/useMergedShiftHistory";
import { useHistoricalDriverRollups } from "../features/analytics/hooks/useHistoricalDriverRollups";
import { usePeriodShiftStats } from "../features/analytics/hooks/usePeriodShiftStats";
import { useCompanionMode } from "../hooks/useCompanionMode";
import { useDevice } from "../hooks/useDevice";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { useResolvedDistanceUnits } from "../hooks/useResolvedDistanceUnits";
import { useShift } from "../hooks/useShift";
import { useTheme } from "../contexts/ThemeContext";
import { appendAionTimelineEvent } from "../storage/core/aionTimelineStorage";
import {
  formatCurrencyDisplay,
  formatDuration,
  formatKm,
  formatLiters,
  formatFuelCostPer100Km,
  formatPerHour,
  formatPerKm,
} from "../utils/formatting";
import { pickProfitFromLive, pickProfitFromRuntime } from "../utils/shiftDisplayEconomics";
import { sumFuelEntriesLiters, sumFuelEntriesTotal } from "../utils/fuelEntryFromManual";

export function DashboardScreen() {
  const companion = useCompanionMode();
  const { settings } = useDevice();
  const { visualStyle, reducedMotion } = useTheme();
  const currency = useResolvedCurrency();
  const distanceUnits = useResolvedDistanceUnits();
  const {
    profile,
    hydrated,
    activeShift,
    liveMetrics,
    activeShiftRuntime,
    driverIntelligence,
    shiftState,
    motionState,
    startShift,
    endShift,
    pauseShift,
    resumeShift,
    setActiveFuelType,
  } = useShift();
  const { merged: mergedHistory, isLoading: cloudHistoryLoading } =
    useMergedShiftHistory();
  const period = usePeriodShiftStats(mergedHistory);
  const {
    rollups: historicalRollups,
    stopZones: stopZonePatterns,
    refresh: refreshHistoricalRollups,
  } = useHistoricalDriverRollups(30);
  const driverAnalytics = useDriverAnalytics(mergedHistory);
  const { entries: timelineEntries } = useTimelineEntries(mergedHistory);
  useEffect(() => {
    void refreshHistoricalRollups();
  }, [mergedHistory.length, refreshHistoricalRollups]);

  const aiBlocks = useMemo(
    () =>
      profile
        ? buildDashboardAiBlocks(mergedHistory, profile, profile.carModel, driverAnalytics)
        : [],
    [mergedHistory, profile, driverAnalytics],
  );
  const [busy, setBusy] = useState<"start" | "end" | "pause" | "resume" | null>(null);
  const [endShiftOpen, setEndShiftOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [bugOpen, setBugOpen] = useState(false);

  const bgVariant =
    settings.nightContrast === "nightDrive" ? "nightDrive" : "cockpit";

  const enterDur = visualStyle === "cyberpunk" ? 520 : 360;
  const fadeSection = (delayMs: number) =>
    reducedMotion ? FadeIn.duration(40) : FadeInDown.duration(enterDur).delay(delayMs);

  const cyberDev = visualStyle === "cyberpunk";

  const coachTipSent = useRef(false);
  useEffect(() => {
    if (coachTipSent.current) return;
    const tip = driverAnalytics.fatigueHint || driverAnalytics.weakZonesLabel;
    if (!tip || mergedHistory.length < 3) return;
    coachTipSent.current = true;
    void appendAionTimelineEvent({
      type: "ai_recommendation",
      title: "AI Driver Coach",
      detail: tip.slice(0, 160),
      moduleId: "driver",
    });
  }, [driverAnalytics.fatigueHint, driverAnalytics.weakZonesLabel, mergedHistory.length]);

  // try/finally: setBusy(null) ОБЯЗАН выполниться даже при сбое операции —
  // иначе кнопки смены залипают (disabled навсегда до перезахода).
  const onStart = async () => {
    setBusy("start");
    try {
      const res = await startShift();
      if (res.ok) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          /* ignore */
        }
      } else if (res.error) {
        setErrorText(res.error);
        setErrorOpen(true);
      }
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : "Не удалось начать смену.");
      setErrorOpen(true);
    } finally {
      setBusy(null);
    }
  };

  const onPause = async () => {
    setBusy("pause");
    try {
      await pauseShift();
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(null);
    }
  };

  const onResume = async () => {
    setBusy("resume");
    try {
      await resumeShift();
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(null);
    }
  };

  const onEnd = () => {
    setEndShiftOpen(true);
  };

  const confirmEndShift = async () => {
    setEndShiftOpen(false);
    setBusy("end");
    try {
      await endShift();
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(null);
    }
  };

  const hasChartSignal = useMemo(() => {
    const w = period.weekSpark.reduce((a, b) => a + Math.abs(b), 0);
    const m = period.monthWeekSpark.reduce((a, b) => a + Math.abs(b), 0);
    return w + m > 0.5;
  }, [period.weekSpark, period.monthWeekSpark]);

  const canStart = shiftState === "inactive";
  const canPause = shiftState === "active";
  const canResume = shiftState === "paused";
  const canEnd = shiftState === "active" || shiftState === "paused";

  const m = liveMetrics;
  const profitDisplay = m ? pickProfitFromLive(m) : null;
  const runtimeProfitDisplay = activeShiftRuntime
    ? pickProfitFromRuntime(activeShiftRuntime)
    : null;
  const displayProfit = profitDisplay?.profit ?? null;
  const profitStr =
    displayProfit != null ? formatCurrencyDisplay(displayProfit, currency) : "—";
  const shiftProgress = m
    ? Math.min(1, m.durationMs / (8 * 3_600_000))
    : 0;
  const fuelEfficiency = m
    ? Math.min(
        1,
        m.income / Math.max(m.fuelCostTotal * 2.2, m.fuelCostTotal + 1)
      )
    : 0;

  const statusLine = useMemo(() => {
    if (!activeShift) return "Смена не запущена";
    if (activeShift.paused) return "Пауза · GPS off";
    return motionState === "idle" ? "Стоим · GPS эконом" : "В движении";
  }, [activeShift, motionState]);

  const shiftFuelSpent = useMemo(
    () => sumFuelEntriesTotal(activeShift?.fuelEntries),
    [activeShift?.fuelEntries],
  );
  const shiftFuelLiters = useMemo(
    () => sumFuelEntriesLiters(activeShift?.fuelEntries),
    [activeShift?.fuelEntries],
  );

  const chartVariant = useMemo(
    () => (visualStyle === "cyberpunk" ? "cyber" : "premium"),
    [visualStyle],
  );

  const ocrPlaceholder = () => router.push("/driver/import");

  if (!profile) return null;

  if (!hydrated) {
    return (
      <CockpitBackground variant={bgVariant}>
        <SafeAreaView className="flex-1 justify-center px-6" edges={["top", "left", "right"]}>
          <Text className="mb-3 text-center text-sm text-slate-400">Загрузка смены…</Text>
          <SkeletonBlock className="h-24 w-full rounded-2xl" />
        </SafeAreaView>
      </CockpitBackground>
    );
  }

  return (
    <CockpitBackground variant={bgVariant}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: companion ? 120 : activeShift && m && !companion ? 220 : 160 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(420)}>
            <View className="mb-5 flex-row items-start justify-between pt-1">
              <View className="flex-1 pr-2">
                <Text className="text-[10px] uppercase tracking-[0.4em] text-cyan-400/80">
                  AION · {companion ? "companion" : "cockpit"}
                </Text>
                <Text className="mt-1 text-2xl font-semibold text-white">
                  {profile.name}
                </Text>
                <Text className="text-sm text-slate-500">{profile.carModel}</Text>
              </View>
              <GradientButton
                title="⚙"
                variant="ghost"
                onPress={() => router.push("/settings")}
                className="min-w-[52px]"
              />
            </View>
          </Animated.View>

          <Animated.View entering={fadeSection(24)}>
            <ApkUpdateBanner />
            <DriverSyncStrip />
            <Pressable onPress={() => setBugOpen(true)} className="mt-2 self-start">
              <Text className="text-[11px] font-semibold text-rose-300/90">
                Сообщить о проблеме →
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={fadeSection(52)}>
          <GlowCard glow="cyan" className="mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Чистая прибыль
              </Text>
              <View className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5">
                <Text className="text-[10px] font-semibold uppercase text-emerald-300">
                  {statusLine}
                </Text>
              </View>
            </View>
            <View className="mt-2 min-h-[56px] justify-center">
              <AnimatedCounter
                value={profitStr}
                className="text-5xl font-bold tracking-tight text-white"
                style={{
                  textShadowColor:
                    visualStyle === "cyberpunk" ? "rgba(232,121,249,0.45)" : "rgba(34,211,238,0.35)",
                  textShadowRadius: visualStyle === "cyberpunk" ? 22 : 16,
                }}
              />
            </View>
            <View className="mt-4 flex-row gap-4">
              <View className="flex-1">
                <Text className="text-[10px] uppercase text-slate-500">Смена</Text>
                <GlowMeter progress={shiftProgress} className="mt-2" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] uppercase text-slate-500">
                  Эффективность
                </Text>
                <GlowMeter progress={fuelEfficiency} className="mt-2" />
              </View>
            </View>
            {activeShiftRuntime ? (
              <View className="mt-4 border-t border-white/10 pt-3">
                <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                  Смена · показатели
                </Text>
                <Text className="mt-2 text-xs text-slate-300">
                  {formatPerHour(runtimeProfitDisplay?.profitPerHour ?? 0, currency)}
                  {runtimeProfitDisplay?.usesAfterCosts ? " (после расходов)" : ""} ·{" "}
                  {formatPerKm(runtimeProfitDisplay?.profitPerKm ?? activeShiftRuntime.profitPerKm, currency)}
                </Text>
                {runtimeProfitDisplay?.operationalCosts ? (
                  <Text className="mt-1 text-[10px] text-violet-300/80">
                    Аренда{" "}
                    {formatCurrencyDisplay(
                      runtimeProfitDisplay.operationalCosts.rentalAccrued,
                      currency,
                    )}{" "}
                    · фикс.{" "}
                    {formatCurrencyDisplay(
                      runtimeProfitDisplay.operationalCosts.fixedOpsAccrued,
                      currency,
                    )}
                  </Text>
                ) : null}
                {shiftFuelSpent > 0 ? (
                  <Text className="mt-1 text-[10px] text-amber-300/85">
                    Заправки за смену: {formatCurrencyDisplay(shiftFuelSpent, currency)}
                    {shiftFuelLiters > 0 ? ` · ${formatLiters(shiftFuelLiters)}` : ""}
                    {m && m.distanceKm > 0
                      ? ` · ≈ ${formatFuelCostPer100Km(
                          Math.round((shiftFuelSpent / m.distanceKm) * 100),
                          currency,
                          distanceUnits,
                        )}`
                      : ""}
                  </Text>
                ) : null}
                <Text className="mt-1 text-xs text-slate-400">
                  Топливо {formatCurrencyDisplay(activeShiftRuntime.fuelTotal, currency)} ·{" "}
                  {formatKm(activeShiftRuntime.distanceMeters / 1000, distanceUnits)} · онлайн{" "}
                  {formatDuration(activeShiftRuntime.durationMs)}
                </Text>
                {activeShiftRuntime.metrics.avgFuelBurn > 0 ? (
                  <Text className="mt-1 text-[10px] text-slate-500">
                    Средний расход денег на топливо:{" "}
                    {formatCurrencyDisplay(activeShiftRuntime.metrics.avgFuelBurn, currency)}/ч
                  </Text>
                ) : null}
                {activeShiftRuntime.sync.pending > 0 ? (
                  <Text className="mt-2 text-[10px] text-amber-300/90">
                    В очереди синхронизации: {activeShiftRuntime.sync.pending}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <DriverIntelligenceStrip
              intel={driverIntelligence}
              historical={historicalRollups}
              stopZones={stopZonePatterns}
              rental={profile?.rentalEconomics}
              currency={currency}
            />
            <Pressable
              className="mt-3 self-start rounded-lg border border-cyan-500/30 px-3 py-2"
              onPress={() => router.push("/driver/route-timeline" as Href)}
            >
              <Text className="text-sm text-cyan-300">
                {mergedHistory.length > 0
                  ? "Маршруты GPS · аналитика →"
                  : "Маршруты · GPS →"}
              </Text>
            </Pressable>
          </GlowCard>
          </Animated.View>

          {!companion ? (
            <Animated.View entering={fadeSection(68)}>
            <View className="mb-4 flex-row items-center gap-4">
              {mergedHistory.length >= 3 ? (
                <EfficiencyScoreRing score={driverAnalytics.efficiencyScore} />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Text className="px-2 text-center text-[10px] leading-4 text-slate-500">—</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Качество смен
                </Text>
                {mergedHistory.length >= 3 ? (
                  <>
                    <Text className="mt-1 text-2xl font-bold text-white">
                      {driverAnalytics.shiftQualityAvg.toFixed(0)}
                      <Text className="text-base font-semibold text-slate-500"> /100</Text>
                    </Text>
                    <Text className="mt-2 text-xs leading-5 text-slate-400">
                      Месяц (30д): {formatCurrencyDisplay(period.monthProfit, currency)} · топливо{" "}
                      {formatCurrencyDisplay(period.monthFuel, currency)} · {period.monthTrips} смен
                    </Text>
                    <Text className="mt-2 text-[11px] leading-4 text-cyan-500/85">
                      Route {driverAnalytics.routeEfficiencyScore}/100 · rhythm {driverAnalytics.consistencyScore}/100
                    </Text>
                  </>
                ) : (
                  <Text className="mt-2 text-sm leading-5 text-slate-400">
                    Недостаточно данных для оценки качества (нужно ≥3 завершённых смены).
                  </Text>
                )}
              </View>
            </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={fadeSection(88)}>
          <GlowCard glow="cyan" className="mb-4">
            <View className="flex-row flex-wrap gap-3">
            <View className="min-w-[47%] flex-1">
              <MetricCard
                label="Доход"
                value={m ? formatCurrencyDisplay(m.income, currency) : "—"}
                size="large"
                glow="violet"
                delay={60}
              />
            </View>
            <View className="min-w-[47%] flex-1">
              <MetricCard
                label="Километры"
                value={m ? formatKm(m.distanceKm, distanceUnits) : "—"}
                size="large"
                delay={100}
              />
            </View>
            <View className="min-w-[47%] flex-1">
              <MetricCard
                label="Время"
                value={m ? formatDuration(m.durationMs) : "—"}
                size="large"
                glow="cyan"
                delay={140}
              />
            </View>
            <View className="min-w-[47%] flex-1">
              <MetricCard
                label="Топливо Σ"
                value={m ? formatCurrencyDisplay(m.fuelCostTotal, currency) : "—"}
                hint={m ? formatLiters(m.fuelUsedPetrolLiters + m.fuelUsedGasLiters) : undefined}
                size="large"
                delay={180}
              />
            </View>
            {!companion ? (
              <>
                <View className="min-w-[47%] flex-1">
                  <MetricCard
                    label="Прибыль / ч"
                    value={
                      profitDisplay
                        ? formatPerHour(profitDisplay.profitPerHour, currency)
                        : "—"
                    }
                    delay={220}
                  />
                </View>
                <View className="min-w-[47%] flex-1">
                  <MetricCard
                    label="Прибыль / км"
                    value={
                      profitDisplay ? formatPerKm(profitDisplay.profitPerKm, currency) : "—"
                    }
                    delay={260}
                  />
                </View>
              </>
            ) : (
              <View className="w-full">
                <MetricCard
                  label="Прибыль / час"
                  value={
                    profitDisplay
                      ? formatPerHour(profitDisplay.profitPerHour, currency)
                      : "—"
                  }
                  size="large"
                  glow="cyan"
                  delay={220}
                />
              </View>
            )}
            </View>
          </GlowCard>
          </Animated.View>

          {activeShift && !companion ? (
            <GlowCard glow="violet" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Топливо сейчас
              </Text>
              <View className="mt-3">
                <FuelTypeToggle
                  value={activeShift.activeFuelType}
                  onChange={(k) => void setActiveFuelType(k)}
                />
              </View>
            </GlowCard>
          ) : activeShift && companion ? (
            <GlowCard glow="violet" className="mb-4">
              <FuelTypeToggle
                value={activeShift.activeFuelType}
                onChange={(k) => void setActiveFuelType(k)}
              />
            </GlowCard>
          ) : null}

          {activeShift ? (
            <OrderActivityControl shiftId={activeShift.id} />
          ) : null}

          <FuelEntriesCard />

          {!companion && m ? (
            <View className="mb-4 flex-row flex-wrap gap-3">
              <View className="min-w-[47%] flex-1">
                <MetricCard
                  label="Км · бензин"
                  value={formatKm(m.distanceKmPetrol, distanceUnits)}
                  hint={`${formatLiters(m.fuelUsedPetrolLiters)} · ${formatCurrencyDisplay(m.fuelCostPetrol, currency)}`}
                  delay={300}
                  glow="neutral"
                />
              </View>
              <View className="min-w-[47%] flex-1">
                <MetricCard
                  label="Км · газ"
                  value={formatKm(m.distanceKmGas, distanceUnits)}
                  hint={`${formatLiters(m.fuelUsedGasLiters)} · ${formatCurrencyDisplay(m.fuelCostGas, currency)}`}
                  delay={340}
                  glow="neutral"
                />
              </View>
              <View className="w-full">
                <MetricCard
                  label="Экономия на газу"
                  value={formatCurrencyDisplay(m.gasSavingsRub, currency)}
                  delay={380}
                  glow="neutral"
                />
              </View>
            </View>
          ) : null}

          <GlowCard glow="neutral" className="mb-4">
            <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Период · облако + устройство
            </Text>
            {cloudHistoryLoading ? (
              <View className="mt-4 gap-3">
                <SkeletonBlock height={48} />
                <SkeletonBlock height={48} />
                <SkeletonBlock height={48} />
              </View>
            ) : (
              <View className="mt-3 flex-row flex-wrap gap-3">
                <MetricCard
                  label="Сегодня"
                  value={formatCurrencyDisplay(period.todayProfit, currency)}
                  delay={40}
                  glow="cyan"
                />
                <MetricCard
                  label="7 дней прибыль"
                  value={formatCurrencyDisplay(period.weekProfit, currency)}
                  delay={80}
                  glow="violet"
                />
                <MetricCard
                  label="7 дней топливо"
                  value={formatCurrencyDisplay(period.weekFuel, currency)}
                  delay={120}
                  glow="neutral"
                />
                <MetricCard
                  label="Смен за 7 дн."
                  value={String(period.weekTrips)}
                  delay={160}
                  glow="neutral"
                />
                <MetricCard
                  label="30 дн прибыль"
                  value={formatCurrencyDisplay(period.monthProfit, currency)}
                  delay={170}
                  glow="violet"
                />
                <MetricCard
                  label="30 дн топливо"
                  value={formatCurrencyDisplay(period.monthFuel, currency)}
                  delay={180}
                  glow="neutral"
                />
                <MetricCard
                  label="Смен за 30 дн."
                  value={String(period.monthTrips)}
                  delay={190}
                  glow="neutral"
                />
              </View>
            )}
            {!cloudHistoryLoading && mergedHistory.length > 0 && hasChartSignal ? (
              <Animated.View entering={fadeSection(120)}>
                <Suspense
                  fallback={
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                      <SkeletonBlock className="h-14 w-full rounded-xl" />
                    </View>
                  }
                >
                  <DashboardSparkCharts
                    weekSpark={period.weekSpark}
                    weekFuelSpark={period.weekFuelSpark}
                    monthWeekSpark={period.monthWeekSpark}
                    currency={currency}
                    chartVariant={chartVariant}
                  />
                </Suspense>
              </Animated.View>
            ) : !cloudHistoryLoading && mergedHistory.length === 0 ? (
              <Text className="mt-4 text-center text-sm text-slate-500">
                Нет завершённых смен — графики появятся после первых записей в истории.
              </Text>
            ) : !cloudHistoryLoading && mergedHistory.length > 0 && !hasChartSignal ? (
              <Text className="mt-4 text-center text-sm text-slate-500">
                Пока нет данных для недельных графиков (нулевая активность в выбранном окне).
              </Text>
            ) : null}
          </GlowCard>

          <DriverBriefTimeline entries={timelineEntries} currency={currency} />

          <View className="mb-4">
            <Text className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-600">
              AI инсайты
            </Text>
            <AiInsightStrip items={aiBlocks} />
          </View>

          <Text className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-600">
            Быстрые действия
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {canStart ? (
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Начать смену"
                size="cockpit"
                onPress={onStart}
                disabled={busy !== null}
                loading={busy === "start"}
              />
            </View>
            ) : null}
            {canEnd ? (
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Закончить"
                variant="danger"
                size="cockpit"
                onPress={onEnd}
                disabled={busy !== null}
                loading={busy === "end"}
              />
            </View>
            ) : null}
            {(canPause || canResume || canEnd) ? (
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Доход +"
                variant="glass"
                size="cockpit"
                onPress={() => router.push("/add-income")}
                disabled={busy !== null}
              />
            </View>
            ) : null}
            {(canStart || canPause || canResume || canEnd) ? (
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Заправка"
                variant="glass"
                size="cockpit"
                onPress={() => router.push("/add-fuel")}
                disabled={busy !== null}
              />
            </View>
            ) : null}
            {(canStart || canPause || canResume || canEnd) ? (
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Карта"
                variant="glass"
                size="cockpit"
                onPress={() => router.push("/map" as Href)}
                disabled={busy !== null}
              />
            </View>
            ) : null}
            {(canPause || canResume || canEnd) ? (
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Голос"
                variant="glass"
                size="cockpit"
                onPress={() => router.push("/voice-control" as Href)}
                disabled={busy !== null}
              />
            </View>
            ) : null}
            {canPause ? (
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Пауза"
                variant="glass"
                size="cockpit"
                onPress={() => void onPause()}
                disabled={busy !== null}
                loading={busy === "pause"}
              />
            </View>
            ) : null}
            {canResume ? (
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Продолжить"
                size="cockpit"
                onPress={() => void onResume()}
                disabled={busy !== null}
                loading={busy === "resume"}
              />
            </View>
            ) : null}
            <View className="min-w-[47%] flex-1">
              <GradientButton
                title="Скрин OCR"
                variant="ghost"
                size="cockpit"
                onPress={ocrPlaceholder}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      {activeShift && m && !companion ? (
        <ShiftHudBar
          metrics={m}
          currency={currency}
          paused={Boolean(activeShift.paused)}
          motionState={motionState}
          tripStreak={activeShift.incomeEventsCount ?? 0}
          medianProfitPerHour={driverAnalytics.medianProfitPerHour}
        />
      ) : null}
      <AppConfirmModal
        visible={endShiftOpen}
        title="Завершить смену?"
        message="Данные сохранятся в историю и синхронизируются с облаком при входе."
        confirmLabel="Завершить"
        cancelLabel="Отмена"
        destructive
        onConfirm={() => void confirmEndShift()}
        onCancel={() => setEndShiftOpen(false)}
      />
      <AppConfirmModal
        visible={errorOpen}
        title="Не удалось запустить смену"
        message={errorText || "Попробуйте ещё раз."}
        confirmLabel="Понятно"
        cancelLabel={null}
        onConfirm={() => setErrorOpen(false)}
        onCancel={() => setErrorOpen(false)}
      />
      <BugReportModal visible={bugOpen} onClose={() => setBugOpen(false)} />
    </CockpitBackground>
  );
}
