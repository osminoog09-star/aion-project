import { memo, useMemo } from "react";
import { Text, View } from "react-native";
import { AnimatedSparkBar } from "./AnimatedSparkBar";
import type { SparkVariant } from "./sparkTypes";
import { formatCurrencyDisplay } from "../../utils/formatting";
import type { AppCurrencyCode } from "../../types/device";

export type { SparkVariant } from "./sparkTypes";

type WeekProfitSparkProps = {
  values: number[];
  currency: AppCurrencyCode;
  variant?: SparkVariant;
};

export const WeekProfitSpark = memo(function WeekProfitSpark({
  values,
  currency,
  variant = "premium",
}: WeekProfitSparkProps) {
  const max = useMemo(() => Math.max(1, ...values.map((v) => Math.abs(v))), [values]);
  const barMax = 52;
  const glow = variant === "cyber" ? "#22d3ee" : "#38bdf8";
  const glowOp = variant === "cyber" ? 0.45 : 0.28;

  return (
    <View className="mt-3">
      <View className="flex-row items-end justify-between gap-1" style={{ height: 56 }}>
        {values.map((v, i) => {
          const h = Math.max(3, (Math.abs(v) / max) * barMax);
          const active = v > 0;
          return (
            <AnimatedSparkBar
              key={String(i)}
              hTarget={h}
              delayMs={i * 42}
              active={active}
              variant={variant}
              activeClass="bg-cyan-500/55"
              inactiveClass="bg-slate-700/40"
              glow={glow}
              glowOp={glowOp}
              cyberRadius={10}
              premiumRadius={6}
            />
          );
        })}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-[9px] uppercase tracking-widest text-slate-600">−6д</Text>
        <Text className="text-[9px] uppercase tracking-widest text-slate-600">сегодня</Text>
      </View>
      <Text className="mt-1 text-center text-[10px] text-slate-500">
        Кривая прибыли за неделю · {formatCurrencyDisplay(values[6] ?? 0, currency)} сегодня
      </Text>
    </View>
  );
});
