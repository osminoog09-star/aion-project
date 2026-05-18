import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { AionEntityState } from "../../src/core/aion/diagnostics/types";
import { useRuntimePulse } from "../../src/core/aion/runtime/runtimePulseBus";
import { colors } from "../../tokens";

/**
 * AION Runtime Sphere — живой центр Control Room.
 *
 * НЕ просто кружок: 6 слоёв + орбитальные частицы + flow-дуги.
 * Реагирует на entityState + runtimePulse (sync/network/gps/upload/error/recovery).
 * Использует только Reanimated + LinearGradient (без Skia / SVG).
 *
 * Слои изнутри наружу:
 *   1. core gradient          — основное тело сферы со specular
 *   2. inner rim              — тонкое внутреннее свечение по краю
 *   3. orbit particles (8 шт) — мелкие частицы, вращающиеся по орбитам
 *   4. energy ring            — кольцо энергии (видно при syncing/thinking/updating)
 *   5. flow arcs (3 шт)       — дуги-потоки данных (видны при синхронизации/успехе)
 *   6. halo                   — мягкое наружное свечение, дышит
 */

type SphereTheme = {
  glow: string;
  coreA: string;
  coreB: string;
  rim: string;
  particle: string;
  flow: string;
};

const STATE_THEME: Record<AionEntityState, SphereTheme> = {
  idle: {
    glow: "rgba(34,211,238,0.28)",
    coreA: "#0e7490",
    coreB: "#22d3ee",
    rim: "rgba(125,211,252,0.55)",
    particle: "rgba(186,230,253,0.7)",
    flow: "rgba(34,211,238,0)",
  },
  thinking: {
    glow: "rgba(167,139,250,0.45)",
    coreA: "#4c1d95",
    coreB: "#a78bfa",
    rim: "rgba(196,181,253,0.75)",
    particle: "rgba(221,214,254,0.9)",
    flow: "rgba(167,139,250,0.7)",
  },
  syncing: {
    glow: "rgba(99,102,241,0.45)",
    coreA: "#312e81",
    coreB: "#818cf8",
    rim: "rgba(165,180,252,0.7)",
    particle: "rgba(199,210,254,0.85)",
    flow: "rgba(129,140,248,0.85)",
  },
  updating: {
    glow: "rgba(251,191,36,0.5)",
    coreA: "#92400e",
    coreB: "#fbbf24",
    rim: "rgba(254,215,170,0.8)",
    particle: "rgba(254,243,199,0.9)",
    flow: "rgba(251,191,36,0.85)",
  },
  success: {
    glow: "rgba(52,211,153,0.45)",
    coreA: "#065f46",
    coreB: "#34d399",
    rim: "rgba(167,243,208,0.85)",
    particle: "rgba(220,252,231,0.95)",
    flow: "rgba(52,211,153,0.7)",
  },
  warning: {
    glow: "rgba(251,191,36,0.4)",
    coreA: "#78350f",
    coreB: "#f59e0b",
    rim: "rgba(253,224,71,0.75)",
    particle: "rgba(254,240,138,0.85)",
    flow: "rgba(245,158,11,0.7)",
  },
  critical: {
    glow: "rgba(251,113,133,0.5)",
    coreA: "#7f1d1d",
    coreB: "#fb7185",
    rim: "rgba(254,205,211,0.85)",
    particle: "rgba(254,226,226,0.95)",
    flow: "rgba(251,113,133,0.85)",
  },
  offline: {
    glow: "rgba(100,116,139,0.18)",
    coreA: "#0f172a",
    coreB: "#475569",
    rim: "rgba(148,163,184,0.35)",
    particle: "rgba(148,163,184,0.5)",
    flow: "rgba(100,116,139,0)",
  },
};

const PARTICLE_COUNT = 8;
const FLOW_COUNT = 3;

type Props = {
  state: AionEntityState;
  size?: number;
};

function isEnergized(state: AionEntityState): boolean {
  return state === "syncing" || state === "thinking" || state === "updating";
}

function rotationDurationMs(state: AionEntityState): number {
  if (state === "thinking" || state === "syncing") return 4200;
  if (state === "updating") return 5200;
  if (state === "success") return 2400;
  return 12000;
}

function breathDurationMs(state: AionEntityState): number {
  if (state === "thinking" || state === "syncing") return 1500;
  if (state === "critical") return 900;
  if (state === "success") return 1100;
  return 2600;
}

function centered(layerSize: number, parentSize: number) {
  const offset = (parentSize - layerSize) / 2;
  return {
    position: "absolute" as const,
    top: offset,
    left: offset,
    width: layerSize,
    height: layerSize,
  };
}

/** Главный элемент Control Room. Не loader. Это AI CORE. */
export function AionRuntimeSphere({ state, size = 188 }: Props) {
  const reduced = useReducedMotion();
  const theme = STATE_THEME[state];
  const energized = isEnergized(state);
  const showFlow = energized || state === "success";

  const syncBusy = useRuntimePulse((s) => s.syncBusy);
  const uploadTick = useRuntimePulse((s) => s.uploadTick);
  const errorTick = useRuntimePulse((s) => s.errorTick);
  const recoveryTick = useRuntimePulse((s) => s.recoveryTick);

  const breath = useSharedValue(1);
  const haloOpacity = useSharedValue(0.55);
  const rotation = useSharedValue(0);
  const ringPulse = useSharedValue(0.35);
  const burst = useSharedValue(1);
  const shake = useSharedValue(0);
  const recoveryWave = useSharedValue(0);
  const flowPhase = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(breath);
    const br = breathDurationMs(state);
    breath.value = withRepeat(
      withSequence(
        withTiming(1.045, { duration: br, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: br, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [breath, state]);

  useEffect(() => {
    cancelAnimation(haloOpacity);
    if (reduced) {
      haloOpacity.value = 0.55;
      return;
    }
    haloOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.45, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [haloOpacity, reduced]);

  useEffect(() => {
    cancelAnimation(rotation);
    if (reduced) {
      rotation.value = 0;
      return;
    }
    const dur = rotationDurationMs(state);
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: dur, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation, state, reduced]);

  useEffect(() => {
    cancelAnimation(ringPulse);
    if (!energized || reduced) {
      ringPulse.value = withTiming(0.25, { duration: 360 });
      return;
    }
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [ringPulse, energized, reduced]);

  useEffect(() => {
    cancelAnimation(flowPhase);
    if (!showFlow || reduced) {
      flowPhase.value = 0;
      return;
    }
    flowPhase.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) }),
      -1,
      false,
    );
  }, [flowPhase, showFlow, reduced]);

  useEffect(() => {
    if (state === "success" || syncBusy || uploadTick > 0) {
      burst.value = 1;
      burst.value = withSequence(
        withTiming(1.1, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [burst, state, syncBusy, uploadTick]);

  useEffect(() => {
    if (state !== "warning" && state !== "critical") {
      shake.value = withTiming(0, { duration: 200 });
      return;
    }
    if (reduced) return;
    shake.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 90 }),
        withTiming(-1, { duration: 90 }),
        withTiming(0, { duration: 120 }),
      ),
      -1,
      false,
    );
  }, [shake, state, errorTick, reduced]);

  useEffect(() => {
    if (recoveryTick === 0) return;
    recoveryWave.value = 0;
    recoveryWave.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [recoveryWave, recoveryTick]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value * 1.2 },
      { scale: reduced ? 1 : breath.value * burst.value },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: reduced ? 0.55 : haloOpacity.value,
    transform: [{ scale: reduced ? 1 : 1 + (breath.value - 1) * 2.2 }],
  }));

  const recoveryStyle = useAnimatedStyle(() => {
    const v = recoveryWave.value;
    return {
      opacity: 0.7 * (1 - v),
      transform: [{ scale: 1 + v * 0.6 }],
    };
  });

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringPulse.value,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: 1 + ringPulse.value * 0.04 },
    ],
  }));

  const counterRingStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + ringPulse.value * 0.2,
    transform: [{ rotate: `${-rotation.value * 0.7}deg` }],
  }));

  const particleAngles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => (i * 360) / PARTICLE_COUNT),
    [],
  );
  const flowOffsets = useMemo(
    () => Array.from({ length: FLOW_COUNT }, (_, i) => i / FLOW_COUNT),
    [],
  );

  const s = size;
  const halo = s * 1.6;
  const ringSize = s * 1.18;
  const counterRingSize = s * 1.34;
  const orbitRadius = s * 0.46;
  const particleSize = Math.max(3, Math.round(s * 0.028));

  return (
    <View style={{ width: halo, height: halo }}>
      <Animated.View
        pointerEvents="none"
        style={[
          centered(halo, halo),
          {
            borderRadius: halo / 2,
            backgroundColor: theme.glow,
          },
          haloStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          centered(halo * 0.92, halo),
          {
            borderRadius: (halo * 0.92) / 2,
            borderWidth: 1,
            borderColor: theme.glow,
          },
          recoveryStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          centered(counterRingSize, halo),
          {
            borderRadius: counterRingSize / 2,
            borderWidth: 1,
            borderColor: theme.rim,
            borderStyle: "dashed",
          },
          counterRingStyle,
        ]}
      />
      {energized || showFlow ? (
        <Animated.View
          pointerEvents="none"
          style={[
            centered(ringSize, halo),
            {
              borderRadius: ringSize / 2,
              borderWidth: 2,
              borderColor: theme.rim,
            },
            ringStyle,
          ]}
        />
      ) : null}
      {!reduced
        ? particleAngles.map((angle, i) => (
            <OrbitParticle
              key={i}
              baseAngleDeg={angle}
              radius={orbitRadius + (i % 3) * 4}
              size={particleSize + (i % 2)}
              color={theme.particle}
              rotation={rotation}
              speed={0.6 + (i % 4) * 0.2}
              wobble={(i % 2) * 0.3}
              parentSize={halo}
            />
          ))
        : null}
      {showFlow && !reduced
        ? flowOffsets.map((off, i) => (
            <FlowArc
              key={i}
              radius={s * (0.34 + i * 0.08)}
              color={theme.flow}
              phase={flowPhase}
              offset={off}
              thickness={1.4}
              parentSize={halo}
            />
          ))
        : null}
      <Animated.View
        style={[
          centered(s, halo),
          {
            borderRadius: s / 2,
            overflow: "hidden",
          },
          coreStyle,
        ]}
      >
        <LinearGradient
          colors={[theme.coreB, theme.coreA, "#020617"]}
          start={{ x: 0.2, y: 0.05 }}
          end={{ x: 0.85, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: s / 2 }]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: s / 2,
              borderWidth: 1,
              borderColor: theme.rim,
              opacity: state === "offline" ? 0.3 : 0.65,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: s * 0.16,
            top: s * 0.12,
            width: s * 0.42,
            height: s * 0.28,
            borderRadius: s * 0.42,
            backgroundColor: "rgba(255,255,255,0.18)",
            opacity: 0.55,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: s * 0.08,
            left: s * 0.08,
            width: s * 0.84,
            height: s * 0.84,
            borderRadius: (s * 0.84) / 2,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.35)",
            opacity: 0.4,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: (s - s * 0.62) / 2,
            left: (s - s * 0.62) / 2,
            width: s * 0.62,
            height: s * 0.62,
            borderRadius: (s * 0.62) / 2,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: (s - s * 0.32) / 2,
            left: (s - s * 0.32) / 2,
            width: s * 0.32,
            height: s * 0.32,
            borderRadius: (s * 0.32) / 2,
            backgroundColor: colors.canvas,
            opacity: 0.45,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: (s - s * 0.12) / 2,
            left: (s - s * 0.12) / 2,
            width: s * 0.12,
            height: s * 0.12,
            borderRadius: (s * 0.12) / 2,
            backgroundColor: theme.coreB,
            opacity: 0.85,
            shadowColor: theme.coreB,
            shadowOpacity: 0.8,
            shadowRadius: 12,
          }}
        />
      </Animated.View>
    </View>
  );
}

type OrbitParticleProps = {
  baseAngleDeg: number;
  radius: number;
  size: number;
  color: string;
  rotation: SharedValue<number>;
  speed: number;
  wobble: number;
  parentSize: number;
};

function OrbitParticle({
  baseAngleDeg,
  radius,
  size,
  color,
  rotation,
  speed,
  wobble,
  parentSize,
}: OrbitParticleProps) {
  const style = useAnimatedStyle(() => {
    const a = ((baseAngleDeg + rotation.value * speed) * Math.PI) / 180;
    const r = radius + Math.sin(rotation.value / 30) * wobble * 4;
    const tx = Math.cos(a) * r;
    const ty = Math.sin(a) * r;
    return {
      transform: [{ translateX: tx }, { translateY: ty }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        centered(size, parentSize),
        {
          borderRadius: size,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: 6,
        },
        style,
      ]}
    />
  );
}

type FlowArcProps = {
  radius: number;
  color: string;
  phase: SharedValue<number>;
  offset: number;
  thickness: number;
  parentSize: number;
};

function FlowArc({ radius, color, phase, offset, thickness, parentSize }: FlowArcProps) {
  const style = useAnimatedStyle(() => {
    const t = (phase.value + offset) % 1;
    const angle = t * 360;
    const fade = Math.sin(t * Math.PI);
    return {
      opacity: 0.25 + fade * 0.65,
      transform: [{ rotate: `${angle}deg` }],
    };
  });
  const arcSize = radius * 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        centered(arcSize, parentSize),
        {
          borderRadius: arcSize / 2,
          borderTopWidth: thickness,
          borderRightWidth: thickness,
          borderColor: color,
          borderLeftWidth: 0,
          borderBottomWidth: 0,
        },
        style,
      ]}
    />
  );
}
