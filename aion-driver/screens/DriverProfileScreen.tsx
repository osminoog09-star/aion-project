import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { EfficiencyScoreRing } from "../components/driver/EfficiencyScoreRing";
import { SkeletonBlock } from "../components/ui/SkeletonBlock";
import { useTheme } from "../contexts/ThemeContext";
import type { AionSemantic } from "../tokens/semantic";
import { useDriverAnalytics } from "../features/driver/analytics/useDriverAnalytics";
import { useMergedShiftHistory } from "../features/trips/hooks/useMergedShiftHistory";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { useResolvedDistanceUnits } from "../hooks/useResolvedDistanceUnits";
import type { Shift } from "../types";
import {
  formatCurrencyDisplay,
  formatKm,
  formatPerHour,
} from "../utils/formatting";

function startOfLocalDayMs(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeekMondayMs(t: number): number {
  const d = new Date(t);
  const dow = d.getDay();
  const monOffset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + monOffset);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function bestCalendarWeekProfitRub(shifts: Shift[]): number {
  const byWeek = new Map<number, number>();
  for (const s of shifts) {
    const end = new Date(s.endedAt).getTime();
    if (Number.isNaN(end)) continue;
    const wk = startOfWeekMondayMs(end);
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + s.netProfit);
  }
  let max = 0;
  for (const v of byWeek.values()) max = Math.max(max, v);
  return max;
}

function activeDayStreak(shifts: Shift[]): number {
  const days = new Set<number>();
  for (const s of shifts) {
    const end = new Date(s.endedAt).getTime();
    if (Number.isNaN(end)) continue;
    days.add(startOfLocalDayMs(end));
  }
  const sorted = [...days].sort((a, b) => b - a);
  if (sorted.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i - 1]! - sorted[i]! === 86_400_000) streak += 1;
    else break;
  }
  return streak;
}

export function DriverProfileScreen() {
  const insets = useSafeAreaInsets();
  const { semantic, resolved } = useTheme();
  const currency = useResolvedCurrency();
  const distanceUnits = useResolvedDistanceUnits();
  const { merged, isLoading } = useMergedShiftHistory();
  const analytics = useDriverAnalytics(merged);

  const totals = useMemo(() => {
    let net = 0;
    let km = 0;
    let fuelL = 0;
    let durMs = 0;
    for (const s of merged) {
      net += s.netProfit;
      km += s.distanceKm;
      fuelL += s.fuelUsedPetrolLiters + s.fuelUsedGasLiters;
      durMs += s.durationMs;
    }
    const hours = Math.max(durMs / 3_600_000, 0.01);
    const avgHourly = net / hours;
    const lPer100 =
      km > 0.01 ? (fuelL / km) * 100 : null;
    return {
      trips: merged.length,
      net,
      km,
      fuelL,
      avgHourly,
      lPer100,
      bestWeek: bestCalendarWeekProfitRub(merged),
      streak: activeDayStreak(merged),
    };
  }, [merged]);

  /** XP только из фактических смен: минуты в линии + бонус за чистый результат (прозрачная формула). */
  const progression = useMemo(() => {
    let xp = 0;
    for (const s of merged) {
      xp += Math.max(0, Math.round(s.durationMs / 60_000));
      xp += Math.min(120, Math.floor(Math.max(0, s.netProfit) / 500));
    }
    const level = Math.max(1, 1 + Math.floor(xp / 800));
    const prevThreshold = (level - 1) * 800;
    const nextThreshold = level * 800;
    const span = Math.max(1, nextThreshold - prevThreshold);
    const inLevel = Math.max(0, xp - prevThreshold);
    return { xp, level, nextThreshold, span, inLevel };
  }, [merged]);

  const achievements = useMemo(() => {
    const { trips, net, km, streak } = totals;
    const eff = analytics.efficiencyScore;
    const cons = analytics.consistencyScore;
    return [
      {
        id: "first",
        title: "Первый выход",
        done: trips >= 1,
        detail: "Завершите первую смену в AION.",
      },
      {
        id: "ten",
        title: "Десять смен",
        done: trips >= 10,
        detail: "Накопите 10 завершённых смен.",
      },
      {
        id: "km100",
        title: "100 км в базе",
        done: km >= 100,
        detail: "Суммарный пробег по завершённым сменам.",
      },
      {
        id: "profit50k",
        title: "50k чистыми",
        done: net >= 50_000,
        detail: "Суммарный net по истории.",
      },
      {
        id: "streak3",
        title: "Серия ×3",
        done: streak >= 3,
        detail: "Три дня подряд с завершённой сменой.",
      },
      {
        id: "eff80",
        title: "Эффективность 80+",
        done: eff >= 80,
        detail: "Оценка эффективности из ваших смен.",
      },
      {
        id: "cons70",
        title: "Стабильность 70+",
        done: cons >= 70,
        detail: "Низкий разброс прибыли/час на последних сменах.",
      },
    ];
  }, [totals, analytics.efficiencyScore, analytics.consistencyScore]);

  const doneCount = achievements.filter((a) => a.done).length;

  return (
    <CockpitBackground variant="cockpit">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="flex-row items-center rounded-2xl px-2 py-2 active:opacity-70"
            style={{ backgroundColor: semantic.surfaceMuted }}
          >
            <MaterialIcons name="arrow-back" size={22} color={semantic.textPrimary} />
            <Text className="ml-1 text-sm font-semibold" style={{ color: semantic.textPrimary }}>
              Назад
            </Text>
          </Pressable>
          <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: semantic.textTertiary }}>
            Профиль водителя
          </Text>
        </View>

        <Text className="mb-1 text-2xl font-bold" style={{ color: semantic.textPrimary }}>
          Ваши метрики
        </Text>
        <Text className="mb-6 text-sm leading-5" style={{ color: semantic.textSecondary }}>
          Только данные из завершённых смен. Без выдуманных поездок.
        </Text>

        {isLoading ? (
          <View className="gap-3">
            <SkeletonBlock className="h-36 w-full rounded-3xl" />
            <SkeletonBlock className="h-24 w-full rounded-3xl" />
          </View>
        ) : merged.length === 0 ? (
          <View
            className="mb-6 rounded-3xl border p-5"
            style={{ borderColor: semantic.border, backgroundColor: semantic.surfaceMuted }}
          >
            <Text className="text-base font-semibold" style={{ color: semantic.textPrimary }}>
              Пока пусто
            </Text>
            <Text className="mt-2 text-sm leading-5" style={{ color: semantic.textSecondary }}>
              Завершите смены на пульте — здесь появятся заработок, километраж, расход и AI driver score.
            </Text>
          </View>
        ) : (
          <>
            <View className="mb-6 flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <Text className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: semantic.accent }}>
                  AI driver score
                </Text>
                <Text className="text-sm leading-5" style={{ color: semantic.textSecondary }}>
                  {analytics.driverScoreEvolution}
                </Text>
                <Text className="mt-2 text-xs leading-4" style={{ color: semantic.textTertiary }}>
                  Маршрут: {analytics.routeEfficiencyScore}/100 · Стабильность: {analytics.consistencyScore}/100
                </Text>
              </View>
              <EfficiencyScoreRing score={analytics.efficiencyScore} size={112} />
            </View>

            <View
              className="mb-6 rounded-3xl border p-4"
              style={{ borderColor: semantic.border, backgroundColor: semantic.surfaceMuted }}
            >
              <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: semantic.violet }}>
                Прогресс водителя
              </Text>
              <Text className="mt-2 text-2xl font-bold" style={{ color: semantic.textPrimary }}>
                Уровень {progression.level}
              </Text>
              <Text className="mt-1 text-xs leading-4" style={{ color: semantic.textSecondary }}>
                XP = минуты в завершённых сменах + до 120 XP за смену (1 XP на каждые 500 {currency} чистыми).
                Уровень = 1 + ⌊XP / 800⌋.
              </Text>
              <Text className="mt-2 text-sm font-semibold" style={{ color: semantic.textPrimary }}>
                {progression.xp} XP
              </Text>
              <View className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: semantic.border }}>
                <View
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((progression.inLevel / progression.span) * 100))}%`,
                    backgroundColor: semantic.accent,
                  }}
                />
              </View>
              <Text className="mt-1 text-[10px]" style={{ color: semantic.textTertiary }}>
                До уровня {progression.level + 1}: {Math.max(0, progression.nextThreshold - progression.xp)} XP
              </Text>
            </View>

            <View className="mb-4 flex-row flex-wrap gap-3">
              <MetricTile
                semantic={semantic}
                label="Всего чистыми"
                value={formatCurrencyDisplay(totals.net, currency)}
              />
              <MetricTile
                semantic={semantic}
                label="Смен"
                value={String(totals.trips)}
              />
              <MetricTile
                semantic={semantic}
                label="Километраж"
                value={formatKm(totals.km, distanceUnits)}
              />
              <MetricTile
                semantic={semantic}
                label="Средняя / час"
                value={formatPerHour(totals.avgHourly, currency)}
              />
            </View>

            <View
              className="mb-4 gap-3 rounded-3xl border p-4"
              style={{ borderColor: semantic.border, backgroundColor: semantic.surfaceMuted }}
            >
              <Text className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: semantic.textTertiary }}>
                Рекорды и ритм
              </Text>
              <Row label="Лучшая календарная неделя" value={formatCurrencyDisplay(totals.bestWeek, currency)} semantic={semantic} />
              <Row
                label="Сильные часы старта"
                value={
                  analytics.bestStartHours.length
                    ? analytics.bestStartHours.map((h) => `${h}:00`).join(", ")
                    : "—"
                }
                semantic={semantic}
              />
              <Row label="Серия дней со сменой" value={`${totals.streak}`} semantic={semantic} />
              <Row
                label="Средний расход (факт)"
                value={
                  totals.lPer100 != null
                    ? `${totals.lPer100.toLocaleString(undefined, { maximumFractionDigits: 1 })} л / 100 км`
                    : "—"
                }
                semantic={semantic}
              />
            </View>
          </>
        )}

        {!isLoading && merged.length > 0 ? (
          <View
            className="mb-4 rounded-3xl border p-4"
            style={{ borderColor: semantic.border, backgroundColor: semantic.surfaceMuted }}
          >
            <Text className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: semantic.violet }}>
              AI coach
            </Text>
            <Text className="text-sm leading-5" style={{ color: semantic.textSecondary }}>
              {analytics.bestHoursLabel}
            </Text>
            {analytics.fuelWasteHint ? (
              <Text className="mt-2 text-sm leading-5" style={{ color: semantic.textSecondary }}>
                {analytics.fuelWasteHint}
              </Text>
            ) : null}
            {analytics.momentumInsight ? (
              <Text className="mt-2 text-sm leading-5" style={{ color: semantic.textSecondary }}>
                {analytics.momentumInsight}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View
          className="rounded-3xl border p-4"
          style={{ borderColor: semantic.border, backgroundColor: semantic.surfaceMuted }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: semantic.textTertiary }}>
              Достижения
            </Text>
            <Text className="text-xs font-semibold" style={{ color: semantic.accent }}>
              {doneCount}/{achievements.length}
            </Text>
          </View>
          {achievements.map((a, i) => (
            <View
              key={a.id}
              className="flex-row items-start gap-3"
              style={{ marginBottom: i === achievements.length - 1 ? 0 : 12 }}
            >
              <MaterialIcons
                name={a.done ? "verified" : "radio-button-unchecked"}
                size={22}
                color={a.done ? semantic.success : semantic.textTertiary}
              />
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: semantic.textPrimary }}>
                  {a.title}
                </Text>
                <Text className="mt-0.5 text-xs leading-4" style={{ color: semantic.textSecondary }}>
                  {a.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {resolved === "dark" ? (
          <Text className="mt-6 text-center text-[10px]" style={{ color: semantic.textTertiary }}>
            AION Driver · локальная аналитика
          </Text>
        ) : null}
      </ScrollView>
    </CockpitBackground>
  );
}

function MetricTile({
  semantic,
  label,
  value,
}: {
  semantic: AionSemantic;
  label: string;
  value: string;
}) {
  return (
    <View
      className="min-w-[46%] flex-1 rounded-2xl border p-3"
      style={{ borderColor: semantic.border, backgroundColor: semantic.surface }}
    >
      <Text className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: semantic.textTertiary }}>
        {label}
      </Text>
      <Text className="text-lg font-bold" style={{ color: semantic.textPrimary }}>
        {value}
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  semantic,
}: {
  label: string;
  value: string;
  semantic: AionSemantic;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="flex-1 text-xs" style={{ color: semantic.textSecondary }}>
        {label}
      </Text>
      <Text className="text-right text-xs font-semibold" style={{ color: semantic.textPrimary }}>
        {value}
      </Text>
    </View>
  );
}
