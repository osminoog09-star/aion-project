import { Redirect, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../features/auth/hooks/useAuth";
import {
  isCloudRestoreReady,
  waitCloudRestoreReady,
} from "../features/cloud/state/cloudRestoreReady";
import { useShift } from "../hooks/useShift";
import { useTheme } from "../contexts/ThemeContext";
import { useDevice } from "../hooks/useDevice";

export default function Index() {
  const { ready: authReady, session, isGuest } = useAuth();
  const { hydrated, profile } = useShift();
  const { hydrated: deviceHydrated, settings } = useDevice();
  const theme = useTheme();
  const [cloudReady, setCloudReady] = useState(() => isCloudRestoreReady());

  useEffect(() => {
    if (!authReady) return;
    if (!session || isGuest) {
      setCloudReady(true);
      return;
    }
    let cancelled = false;
    void waitCloudRestoreReady().then(() => {
      if (!cancelled) setCloudReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [authReady, session?.user.id, isGuest]);

  if (!authReady || !hydrated || !deviceHydrated || !cloudReady) {
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
          {session && !isGuest ? "Восстановление из облака…" : "AION"}
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
