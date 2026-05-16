import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export type StatCardVariant = "default" | "petrol" | "gas" | "savings" | "total";

const VARIANT_GRADIENT: Record<
  StatCardVariant,
  readonly [string, string]
> = {
  default: ["rgba(56,189,248,0.12)", "rgba(15,23,42,0.2)"],
  petrol: ["rgba(251,191,36,0.16)", "rgba(15,23,42,0.22)"],
  gas: ["rgba(52,211,153,0.16)", "rgba(15,23,42,0.22)"],
  savings: ["rgba(167,139,250,0.18)", "rgba(15,23,42,0.24)"],
  total: ["rgba(56,189,248,0.1)", "rgba(99,102,241,0.14)"],
};

const VARIANT_BORDER: Record<StatCardVariant, string> = {
  default: "border-white/10",
  petrol: "border-amber-400/25",
  gas: "border-emerald-400/25",
  savings: "border-violet-400/25",
  total: "border-cyan-400/20",
};

type Props = {
  label: string;
  value: string;
  hint?: string;
  delay?: number;
  accent?: ReactNode;
  variant?: StatCardVariant;
};

export function StatCard({
  label,
  value,
  hint,
  delay = 0,
  accent,
  variant = "default",
}: Props) {
  const colors = VARIANT_GRADIENT[variant];
  const border = VARIANT_BORDER[variant];

  return (
    <Animated.View entering={FadeInDown.duration(520).delay(delay)}>
      <View className={`overflow-hidden rounded-2xl border bg-slate-900/60 ${border}`}>
        <LinearGradient
          colors={[colors[0], colors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16, borderRadius: 16 }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {label}
            </Text>
            {accent}
          </View>
          <Text className="mt-2 text-2xl font-semibold text-white">{value}</Text>
          {hint ? (
            <Text className="mt-1 text-xs text-slate-500">{hint}</Text>
          ) : null}
        </LinearGradient>
      </View>
    </Animated.View>
  );
}
