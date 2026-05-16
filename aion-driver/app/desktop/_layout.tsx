import { Redirect, Slot, usePathname } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { DesktopShell } from "../../components/desktop/DesktopShell";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useShift } from "../../hooks/useShift";

/**
 * Desktop / web workspace: same auth and providers as mobile; dense shell, no duplicated domain logic here.
 */
export default function DesktopWorkspaceLayout() {
  const pathname = usePathname() ?? "";
  const theme = useTheme();
  const { ready: authReady } = useAuth();
  const { hydrated, profile } = useShift();

  if (!authReady || !hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.canvas }}>
        <ActivityIndicator color={theme.semantic.accent} />
      </View>
    );
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <DesktopShell pathname={pathname}>
      <Slot />
    </DesktopShell>
  );
}
