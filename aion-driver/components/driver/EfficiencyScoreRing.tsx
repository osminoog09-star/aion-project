import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

type Props = {
  score: number;
  size?: number;
};

/** Кольцо «индекс эффективности» 0–100 — без тяжёлого SVG. */
export function EfficiencyScoreRing({ score, size = 96 }: Props) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const hue = clamped >= 70 ? "cyan" : clamped >= 45 ? "violet" : "amber";
  const border =
    hue === "cyan"
      ? "border-cyan-400/50 bg-cyan-500/10"
      : hue === "violet"
        ? "border-violet-400/45 bg-violet-500/10"
        : "border-amber-400/45 bg-amber-500/10";

  return (
    <Animated.View style={wrapStyle} className={`items-center justify-center rounded-full border-2 ${border}`}>
      <View
        className="items-center justify-center rounded-full"
        style={{ width: size, height: size }}
      >
        <Text className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Оценка</Text>
        <Text className="mt-1 text-3xl font-bold text-white">{clamped}</Text>
        <Text className="text-[9px] text-slate-500">эффективность</Text>
      </View>
    </Animated.View>
  );
}
