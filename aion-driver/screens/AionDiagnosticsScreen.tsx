import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlowCard } from "../components/ui/GlowCard";
import { useAionCore } from "../src/core/aion/system/AionCoreContext";
import { colors, spacing } from "../tokens";

function row(label: string, value: string) {
  return (
    <View
      key={label}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Text style={{ color: colors.slate500, fontSize: 13 }}>{label}</Text>
      <Text
        style={{ color: colors.slate200, fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right" }}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

export function AionDiagnosticsScreen() {
  const insets = useSafeAreaInsets();
  const { snapshot, devops, refresh, refreshing, timeline, refreshTimeline } = useAionCore();

  if (!snapshot) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + 24, paddingHorizontal: spacing.md }}>
        <Text style={{ color: colors.slate400 }}>Сбор телеметрии…</Text>
        <Pressable onPress={() => void refresh()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.cyan400 }}>{refreshing ? "Обновление…" : "Повторить"}</Text>
        </Pressable>
      </View>
    );
  }

  const ota = snapshot.ota;
  const flush = snapshot.lastSyncFlushAt
    ? new Date(snapshot.lastSyncFlushAt).toLocaleString()
    : "—";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <LinearGradient colors={["#030712", "#0f172a", "#020617"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xxxl,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <MaterialIcons name="arrow-back" size={24} color={colors.slate300} />
            </Pressable>
            <Pressable onPress={() => void refresh()} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ color: colors.cyan400, fontWeight: "700", fontSize: 13 }}>
                {refreshing ? "…" : "Обновить"}
              </Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: "700", letterSpacing: 3, marginTop: 8 }}>
            AION CORE
          </Text>
          <Text style={{ color: colors.slate100, fontSize: 24, fontWeight: "800", marginTop: 4 }}>Диагностика</Text>
          <Text style={{ color: colors.slate500, fontSize: 13, marginTop: 8, lineHeight: 18 }}>
            Снимок состояния: память процесса (очередь), OTA, синк, сеть, канал, DevOps-заглушка.
          </Text>

          <View style={{ marginTop: spacing.lg }}>
          <GlowCard glow="cyan">
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>СЕТЬ</Text>
            {row("Статус", snapshot.networkOnline ? "online" : "offline")}
            {row("Тип", snapshot.networkType)}
          </GlowCard>
          </View>

          <View style={{ marginTop: spacing.md }}>
          <GlowCard glow="neutral">
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>АККАУНТ</Text>
            {row("Supabase", snapshot.auth.isConfigured ? "настроен" : "не настроен")}
            {row("Сессия", snapshot.auth.sessionPresent ? "есть" : "нет")}
            {row("Гость", snapshot.auth.isGuest ? "да" : "нет")}
          </GlowCard>
          </View>

          <View style={{ marginTop: spacing.md }}>
          <GlowCard glow="violet">
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>СИНК</Text>
            {row("Очередь", String(snapshot.syncQueueLength))}
            {row("Последний flush", flush)}
          </GlowCard>
          </View>

          <View style={{ marginTop: spacing.md }}>
          <GlowCard glow="neutral">
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>OTA</Text>
            {row("Включено", ota.enabled ? "да" : "нет")}
            {row("Фаза", ota.phase)}
            {row("Канал", ota.channel ?? "—")}
            {row("Runtime", ota.runtimeVersion ?? "—")}
            {row("Update ID", ota.updateId ?? "—")}
            {row("Pending", ota.pendingUpdateId ?? "—")}
            {row("Баннер", ota.bannerVisible ? "visible" : "hidden")}
            {row("Ошибка", ota.errorMessage ?? "—")}
            {row("Канал (tier)", snapshot.channelTier)}
          </GlowCard>
          </View>

          <View style={{ marginTop: spacing.md }}>
          <GlowCard glow="violet">
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>ПРИЛОЖЕНИЕ</Text>
            {row("Версия", snapshot.appVersion)}
            {row("Снимок (UTC ms)", String(snapshot.capturedAt))}
          </GlowCard>
          </View>

          <View style={{ marginTop: spacing.md }}>
          <GlowCard glow="cyan">
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>DEVOPS (STUB)</Text>
            {row("CI", devops.ciStatus)}
            {row("Последний workflow", devops.lastWorkflowRun ?? "—")}
            <Text style={{ color: colors.slate500, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
              {devops.otaPublishHint}
            </Text>
          </GlowCard>
          </View>

          <View style={{ marginTop: spacing.md }}>
          <GlowCard glow="neutral">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>
                AI TIMELINE
              </Text>
              <Pressable onPress={() => void refreshTimeline()}>
                <Text style={{ color: colors.cyan400, fontSize: 12, fontWeight: "600" }}>Обновить ленту</Text>
              </Pressable>
            </View>
            {timeline.length === 0 ? (
              <Text style={{ color: colors.slate600, fontSize: 13, marginTop: 8 }}>Событий пока нет.</Text>
            ) : (
              timeline.map((e) => (
                <View key={e.id} style={{ marginTop: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" }}>
                  <Text style={{ color: colors.slate300, fontSize: 13, fontWeight: "600" }}>{e.title}</Text>
                  {e.detail ? (
                    <Text style={{ color: colors.slate500, fontSize: 12, marginTop: 2 }}>{e.detail}</Text>
                  ) : null}
                  <Text style={{ color: colors.slate600, fontSize: 10, marginTop: 4 }}>
                    {new Date(e.at).toLocaleString()} · {e.type}
                  </Text>
                </View>
              ))
            )}
          </GlowCard>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
