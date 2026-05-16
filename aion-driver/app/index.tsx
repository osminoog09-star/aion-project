import { Redirect, type Href } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useShift } from "../hooks/useShift";
import { useTheme } from "../contexts/ThemeContext";
import { useDevice } from "../hooks/useDevice";

export default function Index() {
  const { ready: authReady } = useAuth();
  const { hydrated, profile } = useShift();
  const { hydrated: deviceHydrated, settings } = useDevice();
  const theme = useTheme();

  if (!authReady || !hydrated || !deviceHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.canvas,
        }}
      >
        <ActivityIndicator color="#22d3ee" size="large" />
        <Text className="mt-5 text-xs uppercase tracking-[0.35em] text-slate-500">
          AION
        </Text>
      </View>
    );
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  if (profile && settings.aionLinkMode) {
    return <Redirect href={"/link" as Href} />;
  }

  return <Redirect href="/home" />;
}
