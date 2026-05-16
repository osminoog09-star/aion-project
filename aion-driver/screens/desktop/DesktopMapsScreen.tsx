import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export function DesktopMapsScreen() {
  const { semantic: s } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48, gap: 14 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 3 }}>MAPS</Text>
      <Text style={{ fontSize: 24, fontWeight: "900", color: s.textPrimary }}>Карты и зоны</Text>
      <Text style={{ fontSize: 14, color: s.textSecondary, lineHeight: 22, maxWidth: 720 }}>
        Полноэкранная карта OSM и АЗС уже в мобильном модуле. Здесь позже появятся тепловые слои и история маршрутов на
        тех же данных.
      </Text>
      <Pressable
        onPress={() => router.push("/map")}
        style={{
          alignSelf: "flex-start",
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: s.borderStrong,
          backgroundColor: s.surface,
        }}
      >
        <Text style={{ color: s.accent, fontWeight: "800" }}>Открыть карту →</Text>
      </Pressable>
    </ScrollView>
  );
}
