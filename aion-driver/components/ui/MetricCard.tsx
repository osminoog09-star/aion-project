import { Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GlowCard } from "./GlowCard";

type Props = {
  label: string;
  value: string;
  hint?: string;
  delay?: number;
  size?: "hero" | "large" | "medium";
  glow?: "cyan" | "violet" | "neutral";
};

export function MetricCard({
  label,
  value,
  hint,
  delay = 0,
  size = "medium",
  glow = "neutral",
}: Props) {
  const valueClass =
    size === "hero"
      ? "text-5xl font-bold tracking-tight text-white"
      : size === "large"
        ? "text-3xl font-semibold text-white"
        : "text-2xl font-semibold text-white";

  return (
    <Animated.View entering={FadeInDown.duration(480).delay(delay)}>
      <GlowCard glow={glow}>
        <Text className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
          {label}
        </Text>
        <Text className={`mt-2 ${valueClass}`}>{value}</Text>
        {hint ? (
          <Text className="mt-1.5 text-xs text-slate-500">{hint}</Text>
        ) : null}
      </GlowCard>
    </Animated.View>
  );
}
