import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { navigateFromAionRecommendation } from "../../src/core/aion/ai/recommendationNavigation";
import { useAionCore } from "../../src/core/aion/system/AionCoreContext";

/**
 * AI operations surface: recommendations only (no synthetic scores until backed by real aggregates).
 */
export function DesktopAiRoomScreen() {
  const { semantic: s } = useTheme();
  const { recommendations, entityState, refresh, refreshing } = useAionCore();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48, gap: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 3 }}>AI OPS</Text>
      <Text style={{ fontSize: 24, fontWeight: "900", color: s.textPrimary }}>ИИ-центр</Text>
      <Text style={{ fontSize: 14, color: s.textSecondary, lineHeight: 22, maxWidth: 720 }}>
        Состояние сущности: <Text style={{ fontWeight: "800", color: s.textPrimary }}>{entityState}</Text>.
        Ниже — рекомендации из локальной логики AION Core (без фиктивных рейтингов).
      </Text>
      <Pressable onPress={() => void refresh()}>
        <Text style={{ color: s.accent, fontWeight: "800" }}>{refreshing ? "Обновление…" : "Обновить"}</Text>
      </Pressable>

      {recommendations.length === 0 ? (
        <Text style={{ fontSize: 13, color: s.textTertiary }}>Нет активных рекомендаций.</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {recommendations.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => navigateFromAionRecommendation(router.push, r)}
              style={{
                padding: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: s.border,
                backgroundColor: s.surface,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: s.textPrimary }}>{r.title}</Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: s.textSecondary, lineHeight: 22 }}>{r.detail}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
