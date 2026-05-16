import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../tokens";

const DURATION_MS = 900;

type Props = {
  onDone: () => void;
};

/**
 * Одноразовый заставочный слой за сессию: тонкая линия прогресса + подпись Core.
 */
export function AionBootSequence({ onDone }: Props) {
  const [visible, setVisible] = useState(true);
  const doneRef = useRef(false);
  const progress = useSharedValue(0);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: DURATION_MS, easing: Easing.out(Easing.cubic) }),
      withDelay(80, withTiming(1, { duration: 1 })),
    );
    const t = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setVisible(false);
      onDone();
    }, DURATION_MS + 120);
    return () => clearTimeout(t);
  }, [onDone, progress]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={["#020617", "#030712", "#0f172a"]} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Text style={styles.label}>AION</Text>
        <Text style={styles.sub}>Core · инициализация</Text>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, barStyle]}>
            <LinearGradient
              colors={["#22d3ee", "#6366f1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
  },
  label: {
    color: colors.slate200,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 6,
  },
  sub: {
    marginTop: 8,
    color: colors.slate500,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  track: {
    marginTop: 28,
    height: 3,
    width: "100%",
    maxWidth: 220,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
});
