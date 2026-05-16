import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";

type Props = {
  children: ReactNode;
  /** nightDrive — ниже яркость акцентов */
  variant?: "cockpit" | "nightDrive";
};

export function CockpitBackground({
  children,
  variant = "cockpit",
}: Props) {
  const { semantic, resolved, visualEffects, motionTiming, reducedMotion } = useTheme();
  const pulse = useSharedValue(0.35);
  const scanY = useSharedValue(0);

  const orbDuration = Math.max(3200, motionTiming.orbPulseMs);

  useEffect(() => {
    const peak =
      variant === "nightDrive"
        ? resolved === "light"
          ? 0.2
          : 0.22
        : resolved === "light"
          ? 0.4
          : 0.45;
    pulse.value = withRepeat(
      withTiming(peak, {
        duration: orbDuration,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [pulse, variant, resolved, orbDuration]);

  useEffect(() => {
    if (reducedMotion || visualEffects.scanLineOpacity <= 0 || motionTiming.scanLineCycleMs <= 0) {
      scanY.value = 0;
      return;
    }
    scanY.value = withRepeat(
      withTiming(1, {
        duration: motionTiming.scanLineCycleMs,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [scanY, reducedMotion, visualEffects.scanLineOpacity, motionTiming.scanLineCycleMs]);

  const orbStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * 520 }],
    opacity: visualEffects.scanLineOpacity * (reducedMotion ? 0 : 1),
  }));

  const accentOpacity =
    variant === "nightDrive" ? (resolved === "light" ? 0.03 : 0.04) : resolved === "light" ? 0.05 : 0.07;
  const vignette =
    resolved === "light" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";

  const orbLarge = visualEffects.orbRingCount >= 3 ? 320 : 280;
  const orbSmall = visualEffects.orbRingCount >= 3 ? 240 : 220;

  const gridCount = useMemo(() => {
    const n = Math.min(14, Math.max(0, Math.round(visualEffects.particleBudget)));
    return n;
  }, [visualEffects.particleBudget]);

  return (
    <View className="flex-1" style={{ backgroundColor: semantic.canvas }}>
      <LinearGradient
        colors={[...semantic.gradientCanvas]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {gridCount > 0 && visualEffects.gridLineOpacity > 0 ? (
        <View className="absolute inset-0" pointerEvents="none">
          {Array.from({ length: gridCount }).map((_, i) => (
            <View
              key={`g_${i}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${(i + 1) * 6.5}%`,
                height: 1,
                backgroundColor: semantic.accent,
                opacity: visualEffects.gridLineOpacity * 0.35,
              }}
            />
          ))}
        </View>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            right: -80,
            top: "10%",
            width: orbLarge,
            height: orbLarge,
            borderRadius: orbLarge / 2,
            backgroundColor: semantic.orbCyan,
          },
          orbStyle,
        ]}
      />
      {visualEffects.orbRingCount > 1 ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -40,
            top: "12%",
            width: orbLarge - 40,
            height: orbLarge - 40,
            borderRadius: (orbLarge - 40) / 2,
            borderWidth: 1,
            borderColor: semantic.accent,
            opacity: 0.22,
          }}
        />
      ) : null}
      {visualEffects.orbRingCount > 2 ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -20,
            top: "14%",
            width: orbLarge - 80,
            height: orbLarge - 80,
            borderRadius: (orbLarge - 80) / 2,
            borderWidth: 1,
            borderColor: semantic.violet,
            opacity: 0.2,
          }}
        />
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: -60,
            bottom: "8%",
            width: orbSmall,
            height: orbSmall,
            borderRadius: orbSmall / 2,
            backgroundColor: semantic.orbViolet,
          },
          orbStyle,
        ]}
      />
      {visualEffects.scanLineOpacity > 0 && !reducedMotion && motionTiming.scanLineCycleMs > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              top: -40,
              height: 3,
              backgroundColor: semantic.accent,
            },
            scanStyle,
          ]}
        />
      ) : null}
      <View
        className="absolute inset-0"
        style={{ backgroundColor: semantic.heatTint }}
        pointerEvents="none"
      />
      <View
        className="absolute inset-0"
        style={{ backgroundColor: vignette }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
