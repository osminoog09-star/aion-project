import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import type { SparkVariant } from "./sparkTypes";

type Props = {
  hTarget: number;
  delayMs: number;
  active: boolean;
  variant: SparkVariant;
  activeClass: string;
  inactiveClass: string;
  glow: string;
  glowOp: number;
  cyberRadius: number;
  premiumRadius: number;
};

export function AnimatedSparkBar({
  hTarget,
  delayMs,
  active,
  variant,
  activeClass,
  inactiveClass,
  glow,
  glowOp,
  cyberRadius,
  premiumRadius,
}: Props) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = 0;
    h.value = withDelay(
      delayMs,
      withTiming(hTarget, {
        duration: variant === "cyber" ? 520 : 380,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [h, hTarget, delayMs, variant]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return (
    <View className="flex-1 items-center justify-end">
      <Animated.View
        className={`w-full ${active ? activeClass : inactiveClass}`}
        style={[
          style,
          {
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            shadowColor: active ? glow : "transparent",
            shadowOpacity: active ? glowOp : 0,
            shadowRadius: variant === "cyber" ? cyberRadius : premiumRadius,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />
    </View>
  );
}
