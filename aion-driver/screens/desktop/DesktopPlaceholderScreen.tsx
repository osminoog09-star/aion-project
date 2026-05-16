import { Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

type Props = {
  title: string;
  subtitle: string;
};

/** Placeholder for desktop modules until wired to shared repositories. */
export function DesktopPlaceholderScreen({ title, subtitle }: Props) {
  const s = useTheme().semantic;
  return (
    <View style={{ flex: 1, maxWidth: 720 }}>
      <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 3 }}>MODULE</Text>
      <Text style={{ marginTop: 8, fontSize: 24, fontWeight: "900", color: s.textPrimary }}>{title}</Text>
      <Text style={{ marginTop: 12, fontSize: 15, color: s.textSecondary, lineHeight: 24 }}>{subtitle}</Text>
      <View
        style={{
          marginTop: 20,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: s.border,
          backgroundColor: s.surface,
        }}
      >
        <Text style={{ fontSize: 13, color: s.textTertiary, lineHeight: 20 }}>
          Раздел зарезервирован под общую доменную логику с мобильным приложением (Supabase, sync, отчёты). UI будет
          расширен таблицами и графиками без дублирования бизнес-правил.
        </Text>
      </View>
    </View>
  );
}
