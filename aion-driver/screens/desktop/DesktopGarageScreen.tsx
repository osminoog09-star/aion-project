import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useGarage } from "../../features/vehicles/hooks/useGarage";

/**
 * Read-only garage overview using shared useGarage (cloud or guest store).
 */
export function DesktopGarageScreen() {
  const { semantic: s } = useTheme();
  const { vehicles, mode, isBusy, remoteError } = useGarage();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48, gap: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 3 }}>GARAGE</Text>
      <Text style={{ fontSize: 24, fontWeight: "900", color: s.textPrimary }}>Гараж</Text>
      <Text style={{ fontSize: 14, color: s.textSecondary, lineHeight: 22, maxWidth: 720 }}>
        Режим: <Text style={{ fontWeight: "800", color: s.textPrimary }}>{mode === "cloud" ? "Облако" : "Гость"}</Text>
        . Добавление и правки — в мобильном модуле гаража.
      </Text>

      {remoteError ? (
        <Text style={{ fontSize: 13, color: s.danger }}>
          {remoteError instanceof Error ? remoteError.message : String(remoteError)}
        </Text>
      ) : null}

      {isBusy ? <ActivityIndicator color={s.accent} /> : null}

      {vehicles.length === 0 ? (
        <Text style={{ fontSize: 13, color: s.textTertiary }}>Список пуст.</Text>
      ) : (
        <View style={{ borderWidth: 1, borderColor: s.border, borderRadius: 12, overflow: "hidden" }}>
          <View
            style={{
              flexDirection: "row",
              paddingVertical: 10,
              paddingHorizontal: 10,
              borderBottomWidth: 1,
              borderBottomColor: s.border,
              backgroundColor: s.surfaceMuted,
            }}
          >
            <Text style={{ flex: 2, fontSize: 10, fontWeight: "800", color: s.textTertiary }}>ТС</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: "800", color: s.textTertiary }}>ГОД</Text>
            <Text style={{ flex: 1.2, fontSize: 10, fontWeight: "800", color: s.textTertiary }}>ТОПЛИВО</Text>
            <Text style={{ flex: 0.8, fontSize: 10, fontWeight: "800", color: s.textTertiary }}>★</Text>
          </View>
          {vehicles.map((v) => (
            <View
              key={v.localId}
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                paddingHorizontal: 10,
                borderBottomWidth: 1,
                borderBottomColor: s.border,
                backgroundColor: s.surface,
              }}
            >
              <Text style={{ flex: 2, fontSize: 13, color: s.textPrimary }} numberOfLines={2}>
                {v.brand} {v.model}
              </Text>
              <Text style={{ flex: 1, fontSize: 13, color: s.textSecondary }}>{v.year}</Text>
              <Text style={{ flex: 1.2, fontSize: 12, color: s.textSecondary }}>{v.fuelPrimary}</Text>
              <Text style={{ flex: 0.8, fontSize: 13, color: v.isPrimary ? s.accent : s.textTertiary }}>
                {v.isPrimary ? "★" : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={() => router.push("/driver/fleet")}>
        <Text style={{ color: s.accent, fontWeight: "800", fontSize: 14 }}>Открыть гараж в кокпите →</Text>
      </Pressable>
    </ScrollView>
  );
}
