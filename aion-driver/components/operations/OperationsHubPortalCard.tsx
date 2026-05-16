import * as Updates from "expo-updates";
import { Linking, Pressable, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { aionPortalControlUrl } from "../../lib/aionPortalUrl";

type Props = {
  /** OTA channel name when known */
  otaChannel?: string | null;
  /** Short APK eval headline from manifest hook */
  apkHeadline?: string | null;
};

/**
 * Compact link to the web Operations Hub + local runtime/channel snapshot.
 */
export function OperationsHubPortalCard({ otaChannel, apkHeadline }: Props) {
  const { semantic: s } = useTheme();
  const url = aionPortalControlUrl();
  const channel = otaChannel ?? Updates.channel ?? "—";
  const runtime = Updates.runtimeVersion ?? "—";
  const updateId = Updates.updateId ?? "—";

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: s.borderStrong,
        backgroundColor: s.surface,
        padding: 14,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: "900", color: s.accent, letterSpacing: 2 }}>OPERATIONS HUB</Text>
      <Text style={{ fontSize: 15, fontWeight: "800", color: s.textPrimary }}>Экосистемный центр (web)</Text>
      <Text style={{ fontSize: 12, color: s.textSecondary, lineHeight: 18 }}>
        APK + OTA + релизы + roadmap + облако — одна страница на портале. Локально: канал {channel}, runtime{" "}
        {runtime}, updateId {updateId}.
      </Text>
      {apkHeadline ? (
        <Text style={{ fontSize: 11, color: s.textTertiary }} numberOfLines={2}>
          APK: {apkHeadline}
        </Text>
      ) : null}
      <Pressable
        onPress={() => void Linking.openURL(url)}
        style={{
          alignSelf: "flex-start",
          marginTop: 4,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: s.surface,
          borderWidth: 1,
          borderColor: s.accent,
        }}
      >
        <Text style={{ color: s.accent, fontWeight: "800", fontSize: 13 }}>Открыть /control →</Text>
      </Pressable>
      <Text style={{ fontSize: 10, color: s.textTertiary }} numberOfLines={1}>
        {url}
      </Text>
    </View>
  );
}
