import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { AionEntityState } from "../../src/core/aion/diagnostics/types";
import { colors } from "../../tokens";

const STATE_THEME: Record<
  AionEntityState,
  { inner: [string, string]; ring: [string, string]; glow: string }
> = {
  idle: {
    inner: ["#0e7490", "#22d3ee"],
    ring: ["rgba(34,211,238,0.45)", "rgba(99,102,241,0.15)"],
    glow: "rgba(34,211,238,0.32)",
  },
  thinking: {
    inner: ["#5b21b6", "#22d3ee"],
    ring: ["rgba(167,139,250,0.55)", "rgba(34,211,238,0.2)"],
    glow: "rgba(167,139,250,0.42)",
  },
  success: {
    inner: ["#047857", "#34d399"],
    ring: ["rgba(52,211,153,0.55)", "rgba(16,185,129,0.15)"],
    glow: "rgba(52,211,153,0.38)",
  },
  syncing: {
    inner: ["#5b21b6", "#a78bfa"],
    ring: ["rgba(167,139,250,0.5)", "rgba(34,211,238,0.12)"],
    glow: "rgba(167,139,250,0.4)",
  },
  updating: {
    inner: ["#b45309", "#fbbf24"],
    ring: ["rgba(251,191,36,0.55)", "rgba(245,158,11,0.1)"],
    glow: "rgba(251,191,36,0.45)",
  },
  offline: {
    inner: ["#1e293b", "#475569"],
    ring: ["rgba(71,85,105,0.35)", "rgba(15,23,42,0.2)"],
    glow: "rgba(100,116,139,0.2)",
  },
  warning: {
    inner: ["#a16207", "#fbbf24"],
    ring: ["rgba(251,191,36,0.5)", "rgba(239,68,68,0.12)"],
    glow: "rgba(251,191,36,0.35)",
  },
  critical: {
    inner: ["#9f1239", "#fb7185"],
    ring: ["rgba(251,113,133,0.55)", "rgba(190,18,60,0.2)"],
    glow: "rgba(251,113,133,0.45)",
  },
};

type Props = {
  state: AionEntityState;
  size?: number;
};

function breathDuration(state: AionEntityState): number {
  if (state === "thinking" || state === "syncing") return 1400;
  if (state === "critical" || state === "warning") return 900;
  if (state === "success") return 1000;
  return 2400;
}

/**
 * Центральная сущность AION: дыхание, кольца, импульсы по машине состояний.
 */
export function AionCoreOrb({ state, size = 168 }: Props) {
  const reduced = useReducedMotion();
  const theme = STATE_THEME[state];
  const breath = useSharedValue(1);
  const pulse = useSharedValue(1);
  const drift = useSharedValue(0);
  const glitch = useSharedValue(0);
  const burst = useSharedValue(1);
  const ringPulse = useSharedValue(0.45);

  useEffect(() => {
    if (reduced) {
      ringPulse.value = 0.45;
      return;
    }
    const spin =
      state === "thinking" || state === "syncing" || state === "updating";
    if (!spin) {
      ringPulse.value = withTiming(0.35, { duration: 400 });
      return;
    }
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(0.78, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.38, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [ringPulse, state, reduced]);

  useEffect(() => {
    const br = breathDuration(state);
    breath.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: br, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: br, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [breath, state]);

  useEffect(() => {
    const fast = state === "thinking" || state === "critical";
    pulse.value = withRepeat(
      withSequence(
        withTiming(fast ? 1.1 : 1.07, { duration: fast ? 520 : 900, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: fast ? 700 : 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [pulse, state]);

  useEffect(() => {
    if (reduced) {
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        withTiming(-4, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [drift, reduced]);

  useEffect(() => {
    if (reduced || state !== "warning") {
      glitch.value = 0;
      return;
    }
    glitch.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 140 }),
      ),
      -1,
      true,
    );
  }, [glitch, state, reduced]);

  useEffect(() => {
    if (state !== "success") return;
    burst.value = 1;
    burst.value = withSequence(
      withTiming(1.14, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
  }, [burst, state]);

  const outerStyle = useAnimatedStyle(() => {
    const g = glitch.value;
    const gx = g ? (g > 0.5 ? 1 : -1) * 0.8 : 0;
    const scale = reduced ? 1 : breath.value * pulse.value * burst.value;
    return {
      transform: [
        { translateX: reduced ? 0 : drift.value * 0.25 + gx },
        { scale },
      ],
    };
  });

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.1,
    transform: [{ scale: reduced ? 1 : breath.value * 1.1 }],
  }));

  const ringGlowStyle = useAnimatedStyle(() => ({
    opacity: ringPulse.value,
  }));

  const s = size;
  const halo = s * 1.38;
  const showEnergyRing =
    state === "thinking" || state === "syncing" || state === "updating";

  return (
    <View style={[styles.wrap, { width: halo, height: halo }]}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: halo,
            height: halo,
            borderRadius: halo / 2,
            backgroundColor: theme.glow,
          },
          haloStyle,
        ]}
      />
      {showEnergyRing && !reduced ? (
        <Animated.View
          style={[
            styles.energyRing,
            {
              width: s * 1.22,
              height: s * 1.22,
              borderRadius: (s * 1.22) / 2,
              borderColor: theme.ring[0],
            },
            ringGlowStyle,
          ]}
        />
      ) : null}
      <Animated.View style={[styles.core, outerStyle, { width: s, height: s, borderRadius: s / 2 }]}>
        <LinearGradient
          colors={theme.ring}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: s / 2, padding: 3 }]}
        >
          <LinearGradient
            colors={theme.inner}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{
              flex: 1,
              borderRadius: s / 2 - 3,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          />
        </LinearGradient>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: s / 2,
              borderWidth: 1,
              borderColor: colors.glassBorderCyan,
              opacity: state === "offline" ? 0.22 : state === "idle" ? 0.45 : 0.58,
            },
          ]}
        />
        {state === "thinking" && !reduced ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: s / 2, overflow: "hidden" }]}>
            <LinearGradient
              colors={["transparent", "rgba(34,211,238,0.18)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  halo: {
    position: "absolute",
    alignSelf: "center",
  },
  energyRing: {
    position: "absolute",
    alignSelf: "center",
    borderWidth: 1.5,
  },
  core: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
