import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useCallback, useMemo } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AionCoreOrb } from "../components/aion/AionCoreOrb";
import { GlowCard } from "../components/ui/GlowCard";
import { deriveAdaptiveUiHints } from "../src/core/aion/ai/adaptiveUi";
import {
  AION_MODULES,
  readinessLabel,
  type AionModuleDefinition,
} from "../src/core/modules/registry";
import { navigateFromAionRecommendation } from "../src/core/aion/ai/recommendationNavigation";
import type { AionEntityState } from "../src/core/aion/diagnostics/types";
import { useAionCore } from "../src/core/aion/system/AionCoreContext";
import { useAionEntityStore } from "../src/core/aion/entity/aionEntityStore";
import { AION_PERSONA } from "../src/core/aion/personality/persona";
import { colors, spacing } from "../tokens";

const accentIcon: Record<AionModuleDefinition["accent"], string> = {
  cyan: "#22d3ee",
  violet: "#a78bfa",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
  sky: "#38bdf8",
};

function mapAccentToGlow(m: AionModuleDefinition): "cyan" | "violet" | "neutral" {
  if (m.accent === "cyan" || m.accent === "sky") return "cyan";
  if (m.accent === "violet") return "violet";
  return "neutral";
}

function moduleInteractive(m: AionModuleDefinition): boolean {
  return !!m.href && (m.readiness === "live" || m.readiness === "beta");
}

function healthDot(h: AionModuleDefinition["health"]): string {
  if (h === "ok") return "●";
  if (h === "degraded") return "◐";
  return "○";
}

function healthColor(h: AionModuleDefinition["health"]): string {
  if (h === "ok") return colors.emerald400;
  if (h === "degraded") return "#fbbf24";
  return colors.slate600;
}

function entityStateLabelRu(s: AionEntityState): string {
  const m: Record<string, string> = {
    idle: "Спокойствие",
    thinking: "Думаю",
    success: "Готово",
    warning: "Внимание",
    critical: "Срочно",
    offline: "Офлайн",
    syncing: "Синк",
    updating: "Обновление",
  };
  return m[s] ?? s;
}

/**
 * Главный хаб экосистемы AION: орб, статусы, модули, рекомендации и лента событий.
 */
export function AionHomeHubScreen() {
  const insets = useSafeAreaInsets();
  const openPanel = useAionEntityStore((x) => x.openPanel);
  const { snapshot, entityState, recommendations, timeline, refresh, refreshing } = useAionCore();

  const hints = useMemo(
    () => (snapshot ? deriveAdaptiveUiHints(snapshot) : null),
    [snapshot],
  );

  const onModulePress = useCallback((m: AionModuleDefinition) => {
    if (!moduleInteractive(m) || !m.href) return;
    router.push(m.href as Href);
  }, []);

  const statusLine = useMemo(() => {
    if (!snapshot) return "…";
    const net = snapshot.networkOnline ? "NET" : "NET · OFF";
    const q = `Q${snapshot.syncQueueLength}`;
    const ota = snapshot.ota.phase.toUpperCase();
    const ch = snapshot.channelTier.slice(0, 3).toUpperCase();
    return `${net} · ${q} · OTA ${ota} · ${ch}`;
  }, [snapshot]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <LinearGradient
        colors={["#020617", "#0f172a", "#030712"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xxxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: colors.slate500, fontSize: 10, fontWeight: "800", letterSpacing: 4 }}>
                AION CORE
              </Text>
              <Text
                style={{
                  color: colors.slate100,
                  fontSize: hints?.preferDenseHub ? 24 : 28,
                  fontWeight: "800",
                  marginTop: 4,
                  letterSpacing: -0.5,
                }}
              >
                Control room
              </Text>
              <Text style={{ color: colors.slate500, fontSize: 13, marginTop: 8, lineHeight: 20, maxWidth: 340 }}>
                {AION_PERSONA.missionShort}
              </Text>
            </View>
            <Pressable
              onPress={() => void refresh()}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "rgba(15,23,42,0.6)",
              }}
            >
              <Text style={{ color: colors.cyan400, fontSize: 11, fontWeight: "800" }}>
                {refreshing ? "…" : "SYNC"}
              </Text>
            </Pressable>
          </View>

          {Platform.OS === "web" ? (
            <Pressable
              onPress={() => router.push("/desktop")}
              style={{
                marginTop: spacing.md,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(34,211,238,0.35)",
                backgroundColor: "rgba(15,23,42,0.75)",
              }}
            >
              <Text style={{ color: colors.cyan400, fontSize: 12, fontWeight: "900" }}>
                Веб-центр операций
              </Text>
              <Text style={{ color: colors.slate500, fontSize: 11, marginTop: 6, lineHeight: 16 }}>
                Аналитика, облако, финансы — плотный интерфейс для большого экрана (PWA / браузер).
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => openPanel()}
            accessibilityRole="button"
            accessibilityLabel="Открыть панель AION"
            style={{ alignItems: "center", marginTop: spacing.xl }}
          >
            <AionCoreOrb state={entityState} size={158} />
            <Text style={{ marginTop: spacing.md, color: colors.slate400, fontSize: 12, letterSpacing: 2 }}>
              {entityStateLabelRu(entityState)}
            </Text>
            <Text style={{ marginTop: 6, color: colors.slate500, fontSize: 11, fontWeight: "700" }}>
              {statusLine}
            </Text>
            <Text style={{ marginTop: 8, color: colors.slate600, fontSize: 10 }}>Нажмите на сферу — статус и действия</Text>
          </Pressable>

          <GlowCard glow="cyan" className="mt-6">
            <Text style={{ color: colors.slate500, fontSize: 10, fontWeight: "800", letterSpacing: 2 }}>
              СИСТЕМА
            </Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              <Pressable
                onPress={() => router.push("/aion-diagnostics")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: pressed ? "rgba(255,255,255,0.05)" : "rgba(3,7,18,0.35)",
                  borderWidth: 1,
                  borderColor: "rgba(34,211,238,0.2)",
                })}
              >
                <Text style={{ color: colors.slate200, fontWeight: "700" }}>Диагностика Core</Text>
                <MaterialIcons name="analytics" size={20} color={colors.cyan400} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/ota-debug")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: pressed ? "rgba(255,255,255,0.05)" : "rgba(3,7,18,0.35)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                })}
              >
                <Text style={{ color: colors.slate300, fontWeight: "600" }}>OTA · каналы · runtime</Text>
                <MaterialIcons name="system-update" size={20} color={colors.slate500} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/settings")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: pressed ? "rgba(255,255,255,0.05)" : "rgba(3,7,18,0.35)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                })}
              >
                <Text style={{ color: colors.slate300, fontWeight: "600" }}>Настройки экосистемы</Text>
                <MaterialIcons name="tune" size={20} color={colors.slate500} />
              </Pressable>
            </View>
          </GlowCard>

          {recommendations.length > 0 ? (
            <GlowCard glow="violet" className="mt-4">
              <Text style={{ color: colors.slate500, fontSize: 10, fontWeight: "800", letterSpacing: 2 }}>
                AI · РЕКОМЕНДАЦИИ
              </Text>
              {recommendations.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => navigateFromAionRecommendation(router.push, r)}
                  style={({ pressed }) => ({
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: pressed ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.45)",
                    borderWidth: 1,
                    borderColor: "rgba(167,139,250,0.15)",
                  })}
                >
                  <Text style={{ color: colors.slate100, fontWeight: "700" }}>{r.title}</Text>
                  <Text style={{ color: colors.slate500, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                    {r.detail}
                  </Text>
                  {r.action ? (
                    <Text style={{ color: colors.violet400, fontSize: 11, marginTop: 8, fontWeight: "700" }}>
                      Открыть действие →
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </GlowCard>
          ) : null}

          {timeline.length > 0 ? (
            <GlowCard glow="neutral" className="mt-4">
              <Text style={{ color: colors.slate500, fontSize: 10, fontWeight: "800", letterSpacing: 2 }}>
                НЕДАВНЯЯ АКТИВНОСТЬ
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {timeline.slice(0, 8).map((e) => (
                    <View
                      key={e.id}
                      style={{
                        width: 148,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: "rgba(15,23,42,0.75)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Text style={{ color: colors.slate500, fontSize: 9, fontWeight: "800" }}>{e.type}</Text>
                      <Text style={{ color: colors.slate200, fontSize: 13, fontWeight: "700", marginTop: 4 }} numberOfLines={2}>
                        {e.title}
                      </Text>
                      <Text style={{ color: colors.slate600, fontSize: 10, marginTop: 6 }}>
                        {new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </GlowCard>
          ) : null}

          <Text style={{ color: colors.slate600, fontSize: 10, fontWeight: "700", letterSpacing: 2, marginTop: spacing.xl }}>
            МОДУЛИ
          </Text>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {AION_MODULES.map((m) => {
              const open = moduleInteractive(m);
              const iconColor = accentIcon[m.accent];
              const badge = readinessLabel(m.readiness);
              return (
                <GlowCard key={m.id} glow={mapAccentToGlow(m)} onPress={open ? () => onModulePress(m) : undefined}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: open ? "rgba(34,211,238,0.1)" : "rgba(148,163,184,0.06)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: open ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <MaterialIcons name={m.icon as "apps"} size={26} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Text style={{ color: colors.slate100, fontSize: 17, fontWeight: "700" }}>{m.title}</Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: "rgba(148,163,184,0.12)",
                          }}
                        >
                          <Text style={{ color: colors.slate400, fontSize: 10, fontWeight: "800" }}>{badge}</Text>
                        </View>
                        <Text style={{ color: healthColor(m.health), fontSize: 11, fontWeight: "800" }}>
                          {healthDot(m.health)} {m.health}
                        </Text>
                      </View>
                      <Text style={{ color: colors.slate500, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                        {m.subtitle}
                      </Text>
                      {m.dependsOn.length > 0 ? (
                        <Text style={{ color: colors.slate600, fontSize: 11, marginTop: 6 }}>
                          deps: {m.dependsOn.join(", ")}
                        </Text>
                      ) : null}
                    </View>
                    {open ? (
                      <MaterialIcons name="chevron-right" size={22} color={colors.slate500} />
                    ) : (
                      <MaterialIcons name="lock-outline" size={20} color={colors.slate600} />
                    )}
                  </View>
                </GlowCard>
              );
            })}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
