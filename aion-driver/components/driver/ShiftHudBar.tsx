import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Platform, Text, View, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  type AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LiveShiftMetrics } from "../../features/shift/runtime/liveShiftTypes";
import type { ShiftOperationalCosts } from "../../types/rental";
import {
  formatOperationalCostsBrief,
  pickProfitFromLive,
} from "../../utils/shiftDisplayEconomics";
import type { MotionState } from "../../services/locationPolicy";
import type { AppCurrencyCode } from "../../types/device";
import {
  formatCurrencyDisplay,
  formatDuration,
  formatPerHour,
} from "../../utils/formatting";
import { AnimatedCounter } from "../ui/AnimatedCounter";

type Props = {
  metrics: LiveShiftMetrics;
  currency: AppCurrencyCode;
  paused: boolean;
  motionState: MotionState;
  tripStreak: number;
  medianProfitPerHour: number;
};

/**
 * Плавающий HUD активной смены: премиальный слой с пульсом, дельтой и моментумом.
 */
export function ShiftHudBar({
  metrics,
  currency,
  paused,
  motionState,
  tripStreak,
  medianProfitPerHour,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12) + 56;
  const display = pickProfitFromLive(metrics);
  const prevProfit = useRef(display.profit);
  const delta = display.profit - prevProfit.current;
  useEffect(() => {
    prevProfit.current = display.profit;
  }, [display.profit]);

  const momentum =
    medianProfitPerHour > 0
      ? Math.max(0, Math.min(1.65, display.profitPerHour / medianProfitPerHour))
      : 1;

  const intensity =
    motionState === "moving"
      ? Math.min(
          1,
          0.32 + metrics.distanceKm / 48 + metrics.durationMs / (11 * 3_600_000),
        )
      : 0.26;

  const glow = useSharedValue(0.38);
  useEffect(() => {
    if (paused) {
      cancelAnimation(glow);
      glow.value = withTiming(0.22, { duration: 400 });
      return;
    }
    cancelAnimation(glow);
    glow.value = withRepeat(
      withSequence(
        withTiming(0.52 + momentum * 0.22, {
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0.34 + intensity * 0.18, {
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      true,
    );
  }, [glow, momentum, intensity, paused]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const profitStr = formatCurrencyDisplay(display.profit, currency);
  const deltaVisible = !paused && Math.abs(delta) > 0.4;
  const deltaStr =
    delta >= 0
      ? `+${formatCurrencyDisplay(delta, currency)}`
      : formatCurrencyDisplay(delta, currency);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: bottomPad,
      }}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={38}
          tint="dark"
          className="overflow-hidden rounded-2xl border border-cyan-500/30"
        >
          <HudInner
            pulseStyle={pulseStyle}
            profitStr={profitStr}
            profitPerHourStr={formatPerHour(display.profitPerHour, currency)}
            deltaVisible={deltaVisible}
            deltaStr={deltaStr}
            metrics={metrics}
            currency={currency}
            paused={paused}
            motionState={motionState}
            tripStreak={tripStreak}
            momentum={momentum}
            usesAfterCosts={display.usesAfterCosts}
            operationalCosts={display.operationalCosts}
          />
        </BlurView>
      ) : (
        <LinearGradient
          colors={["rgba(12,18,38,0.96)", "rgba(3,7,18,0.94)"]}
          className="rounded-2xl border border-cyan-500/25"
        >
          <HudInner
            pulseStyle={pulseStyle}
            profitStr={profitStr}
            profitPerHourStr={formatPerHour(display.profitPerHour, currency)}
            deltaVisible={deltaVisible}
            deltaStr={deltaStr}
            metrics={metrics}
            currency={currency}
            paused={paused}
            motionState={motionState}
            tripStreak={tripStreak}
            momentum={momentum}
            usesAfterCosts={display.usesAfterCosts}
            operationalCosts={display.operationalCosts}
          />
        </LinearGradient>
      )}
    </View>
  );
}

type InnerProps = {
  pulseStyle: AnimatedStyle<ViewStyle>;
  profitStr: string;
  profitPerHourStr: string;
  deltaVisible: boolean;
  deltaStr: string;
  metrics: LiveShiftMetrics;
  currency: AppCurrencyCode;
  paused: boolean;
  motionState: MotionState;
  tripStreak: number;
  momentum: number;
  usesAfterCosts: boolean;
  operationalCosts: ShiftOperationalCosts | null;
};

function HudInner({
  pulseStyle,
  profitStr,
  profitPerHourStr,
  deltaVisible,
  deltaStr,
  metrics,
  currency,
  paused,
  motionState,
  tripStreak,
  momentum,
  usesAfterCosts,
  operationalCosts,
}: InnerProps) {
  const momPct = Math.round(Math.min(160, momentum * 100));
  return (
    <View className="px-4 py-3">
      <Animated.View
        style={[
          pulseStyle,
          {
            height: 3,
            borderRadius: 3,
            marginBottom: 8,
            backgroundColor: "rgba(34,211,238,0.9)",
          },
        ]}
      />
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[9px] uppercase tracking-[0.35em] text-cyan-300/90">
            {paused ? "pause" : "live"}
            {usesAfterCosts ? " · нетто" : ""}
          </Text>
          <AnimatedCounter
            value={profitStr}
            className="text-xl font-bold text-white"
            style={{ textShadowColor: "rgba(34,211,238,0.45)", textShadowRadius: 14 }}
          />
          {deltaVisible ? (
            <Text
              className={`mt-0.5 text-[11px] font-semibold ${deltaStr.startsWith("+") ? "text-emerald-400" : "text-rose-300"}`}
            >
              Δ {deltaStr}
            </Text>
          ) : null}
          <Text className="mt-1 text-[11px] text-slate-400">
            {profitPerHourStr} · {formatDuration(metrics.durationMs)}
          </Text>
          {operationalCosts ? (
            <Text className="mt-1 text-[10px] text-violet-300/85">
              {formatOperationalCostsBrief(operationalCosts, currency)}
            </Text>
          ) : null}
        </View>
        <View className="items-end">
          <Text className="text-[9px] uppercase tracking-widest text-slate-500">интенсивность</Text>
          <Text className="text-sm font-semibold text-cyan-200">
            {paused ? "—" : motionState === "moving" ? "drive" : "idle"}
          </Text>
          <Text className="mt-2 text-[9px] uppercase text-slate-500">серия · моментум</Text>
          <Text className="text-xs font-semibold text-slate-200">
            {tripStreak} · {momPct}%
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t border-white/10 pt-2">
        <Text className="text-[10px] uppercase text-slate-500">топливо Σ</Text>
        <Text className="text-sm font-semibold text-slate-200">
          {formatCurrencyDisplay(metrics.fuelCostTotal, currency)}
        </Text>
      </View>
    </View>
  );
}
