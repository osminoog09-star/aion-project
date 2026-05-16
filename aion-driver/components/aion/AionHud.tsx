import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AionEntityState } from "../../src/core/aion/diagnostics/types";
import { useAionEntityStore } from "../../src/core/aion/entity/aionEntityStore";
import { useAionCore } from "../../src/core/aion/system/AionCoreContext";
import { colors, spacing } from "../../tokens";

const chip = (
  label: string,
  value: string,
  tone: "cyan" | "violet" | "slate" | "amber" | "rose",
) => {
  const c =
    tone === "cyan"
      ? colors.cyan400
      : tone === "violet"
        ? colors.violet400
        : tone === "amber"
          ? "#fbbf24"
          : tone === "rose"
            ? colors.rose400
            : colors.slate500;
  return (
    <View style={styles.chipRow} key={label}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, { color: c }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

function aiChipTone(s: AionEntityState): "cyan" | "violet" | "amber" | "rose" {
  if (s === "idle" || s === "success") return "cyan";
  if (s === "warning" || s === "updating") return "amber";
  if (s === "critical" || s === "offline") return "rose";
  return "violet";
}

type Props = {
  compact?: boolean;
  /** Долгое нажатие — расширенная диагностика */
  onLongPressDiagnostics?: () => void;
};

/**
 * Лёгкий overlay: тап открывает панель AION, долгое нажатие — диагностика.
 */
export function AionHud({ compact = true, onLongPressDiagnostics }: Props) {
  const insets = useSafeAreaInsets();
  const openPanel = useAionEntityStore((x) => x.openPanel);
  const { snapshot, entityState, refreshing } = useAionCore();

  if (!snapshot) return null;

  const net = snapshot.networkOnline ? "ON" : "OFF";
  const sync = String(snapshot.syncQueueLength);
  const ota = snapshot.ota.phase.toUpperCase();
  const cloud = snapshot.ota.enabled ? snapshot.channelTier.slice(0, 4) : "—";
  const ai = entityState.toUpperCase().slice(0, 4);

  return (
    <Pressable
      onPress={() => openPanel()}
      onLongPress={onLongPressDiagnostics}
      delayLongPress={480}
      style={[styles.container, { top: insets.top + spacing.sm }]}
      hitSlop={8}
    >
      <BlurView intensity={compact ? 28 : 36} tint="dark" style={styles.blur}>
        <LinearGradient
          colors={["rgba(15,23,42,0.75)", "rgba(3,7,18,0.55)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.inner}>
          {compact ? (
            <Text style={styles.compact}>
              {net} · Q{sync} · {ota}
              {refreshing ? " · …" : ""}
            </Text>
          ) : (
            <View style={{ gap: 4 }}>
              {chip("NET", net, snapshot.networkOnline ? "cyan" : "rose")}
              {chip("SYNC", sync, snapshot.syncQueueLength > 5 ? "amber" : "slate")}
              {chip("OTA", ota, snapshot.ota.phase === "error" ? "rose" : "violet")}
              {chip("CLD", cloud, "cyan")}
              {chip("AI", ai, aiChipTone(entityState))}
            </View>
          )}
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: spacing.md,
    zIndex: 50,
    maxWidth: "46%",
  },
  blur: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  inner: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compact: {
    color: colors.slate300,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  chipLabel: { color: colors.slate500, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  chipValue: { fontSize: 10, fontWeight: "800", flexShrink: 1, textAlign: "right" },
});
