import * as Updates from "expo-updates";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { OperationsHubPortalCard } from "../../components/operations/OperationsHubPortalCard";
import { useTheme } from "../../contexts/ThemeContext";
import { useApkUpdates } from "../../contexts/ApkUpdatesContext";
import { useUpdates } from "../../hooks/useUpdates";
import { navigateFromAionRecommendation } from "../../src/core/aion/ai/recommendationNavigation";
import { useAionCore } from "../../src/core/aion/system/AionCoreContext";

/**
 * Driver control center: same recommendations + timeline feed as AION Core (dense desktop layout).
 */
export function DesktopControlCenterScreen() {
  const { semantic: s } = useTheme();
  const { recommendations, timeline, refresh, refreshing } = useAionCore();
  const u = useUpdates();
  const apk = useApkUpdates();
  const apkLine =
    apk.manifest && apk.evald
      ? `${apk.manifest.latestVersion} · ${apk.evald.reason}`
      : apk.loading
        ? "APK…"
        : "APK манифест недоступен";

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48, gap: 16 }} showsVerticalScrollIndicator={false}>
      <OperationsHubPortalCard
        otaChannel={typeof Updates.channel === "string" ? Updates.channel : null}
        apkHeadline={apkLine}
      />

      <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 3 }}>CONTROL</Text>
      <Text style={{ fontSize: 24, fontWeight: "900", color: s.textPrimary }}>Центр управления</Text>
      <Text style={{ fontSize: 14, color: s.textSecondary, lineHeight: 22, maxWidth: 720 }}>
        Рекомендации и лента событий из AION Core — те же данные, что на хабе, в плотном виде для рабочего стола.
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Pressable
          onPress={() => void refresh()}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: s.borderStrong,
            backgroundColor: s.surface,
          }}
        >
          <Text style={{ color: s.accent, fontWeight: "800" }}>{refreshing ? "…" : "Обновить Core"}</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/driver")}>
          <Text style={{ color: s.textSecondary, fontWeight: "700" }}>Кокпит →</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/driver/import")}>
          <Text style={{ color: s.textSecondary, fontWeight: "700" }}>OCR импорт →</Text>
        </Pressable>
      </View>

      {recommendations.length > 0 ? (
        <View>
          <Text style={{ fontSize: 13, fontWeight: "800", color: s.textSecondary, marginBottom: 10 }}>Рекомендации</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {recommendations.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => navigateFromAionRecommendation(router.push, r)}
                style={{
                  flex: 1,
                  minWidth: 260,
                  maxWidth: 480,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: s.border,
                  backgroundColor: s.surface,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: s.violet }}>{r.priority.toUpperCase()}</Text>
                <Text style={{ marginTop: 6, fontSize: 16, fontWeight: "800", color: s.textPrimary }}>{r.title}</Text>
                <Text style={{ marginTop: 6, fontSize: 13, color: s.textSecondary, lineHeight: 20 }}>{r.detail}</Text>
                {r.action ? (
                  <Text style={{ marginTop: 10, fontSize: 12, fontWeight: "800", color: s.accent }}>Действие →</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Text style={{ fontSize: 13, color: s.textTertiary }}>Рекомендаций пока нет.</Text>
      )}

      {timeline.length > 0 ? (
        <View>
          <Text style={{ fontSize: 13, fontWeight: "800", color: s.textSecondary, marginBottom: 10 }}>Лента</Text>
          <View style={{ borderWidth: 1, borderColor: s.border, borderRadius: 12, overflow: "hidden" }}>
            {timeline.slice(0, 20).map((e) => (
              <View
                key={e.id}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: s.border,
                  backgroundColor: s.surface,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: s.textTertiary }}>{e.type}</Text>
                <Text style={{ marginTop: 4, fontSize: 15, fontWeight: "700", color: s.textPrimary }}>{e.title}</Text>
                {e.detail ? (
                  <Text style={{ marginTop: 4, fontSize: 12, color: s.textSecondary }}>{e.detail}</Text>
                ) : null}
                <Text style={{ marginTop: 6, fontSize: 11, color: s.textTertiary }}>
                  {new Date(e.at).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
