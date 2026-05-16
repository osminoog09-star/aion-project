import { memo, useMemo } from "react";
import { Text, View } from "react-native";
import { AnimatedSparkBar } from "./AnimatedSparkBar";
import type { SparkVariant } from "./sparkTypes";
import { formatCurrencyDisplay } from "../../utils/formatting";
import type { AppCurrencyCode } from "../../types/device";

type Props = {
  values: number[];
  currency: AppCurrencyCode;
  variant?: SparkVariant;
};

export const MonthWeekProfitSpark = memo(function MonthWeekProfitSpark({
  values,
  currency,
  variant = "premium",
}: Props) {
  const max = useMemo(() => Math.max(1, ...values.map((v) => Math.abs(v))), [values]);
  const barMax = 56;
  const glow = variant === "cyber" ? "#e879f9" : "#a78bfa";
  const glowOp = variant === "cyber" ? 0.42 : 0.32;

  return (
    <View className="mt-3">
      <View className="flex-row items-end justify-between gap-2" style={{ height: 58 }}>
        {values.map((v, i) => {
          const h = Math.max(4, (Math.abs(v) / max) * barMax);
          const active = v > 0;
          return (
            <AnimatedSparkBar
              key={String(i)}
              hTarget={h}
              delayMs={i * 55}
              active={active}
              variant={variant}
              activeClass="bg-violet-500/60"
              inactiveClass="bg-slate-700/35"
              glow={glow}
              glowOp={glowOp}
              cyberRadius={11}
              premiumRadius={8}
            />
          );
        })}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-[9px] uppercase tracking-widest text-slate-600">−28д</Text>
        <Text className="text-[9px] uppercase tracking-widest text-slate-600">неделя</Text>
      </View>
      <Text className="mt-1 text-center text-[10px] text-slate-500">
        Месяц · сумма за неделю · {formatCurrencyDisplay(values[3] ?? 0, currency)} последняя
      </Text>
    </View>
  );
});
