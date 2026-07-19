import "react-native-url-polyfill/auto";
import * as Sentry from "@sentry/react-native";
import "react-native-gesture-handler";
import "../global.css";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SentryRouteListener } from "../components/SentryRouteListener";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { GlobalSyncBanner } from "../components/sync/GlobalSyncBanner";
import { ApkUpdateGate } from "../components/update/ApkUpdateGate";
import { UpdateGate } from "../components/update/UpdateGate";
import { UpdatesProvider } from "../contexts/UpdatesContext";
import { ApkUpdatesProvider } from "../contexts/ApkUpdatesContext";
import { DeviceProvider } from "../contexts/DeviceContext";
import { ShiftProvider } from "../contexts/ShiftContext";
import { OcrQueueProcessor } from "../components/import/OcrQueueProcessor";
import { PostShiftHandoffBanner } from "../components/driver/PostShiftHandoffBanner";
import { useTheme } from "../contexts/ThemeContext";
import { CloudSyncBootstrap } from "../features/cloud/bootstrap/CloudSyncBootstrap";
import { AuthDeepLinkListener } from "../features/auth/components/AuthDeepLinkListener";
import { AppProviders } from "../platform/providers/AppProviders";
import { useDevice } from "../hooks/useDevice";
import { useShift } from "../hooks/useShift";
import { BetaWatermark } from "../components/debug/BetaWatermark";
import { QaDebugHud } from "../components/debug/QaDebugHud";
import { featureFlags } from "../lib/featureFlags";
import { initSentry } from "../lib/sentry";
import { initDiagnosticLog } from "../lib/diagnosticLog";
import { colors } from "../tokens";
import { AionCoreProvider } from "../src/core/aion/system/AionCoreContext";
import { AionBootSequence } from "../components/aion/AionBootSequence";
import { AionHud } from "../components/aion/AionHud";
import { AionEntityPanel } from "../components/aion/AionEntityPanel";
import { AionOverlayOrbPulseBridge } from "../components/aion/AionOverlayOrbPulseBridge";
import { BoltCaptureUploaderBridge } from "../components/aion/BoltCaptureUploaderBridge";
import { LinkSnapshotRelayBridge } from "../components/aion-link/LinkSnapshotRelayBridge";

import "../tasks/shiftLocationTask";
import { ensureAndroidShiftRuntimeInstalled } from "../services/androidShiftRuntimeBootstrap";

ensureAndroidShiftRuntimeInstalled();

void SplashScreen.preventAutoHideAsync();

void SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => undefined);

initSentry();
void initDiagnosticLog();

function SplashUnlock() {
  const { hydrated: deviceReady } = useDevice();
  const { hydrated: shiftReady } = useShift();

  useEffect(() => {
    if (deviceReady && shiftReady) {
      void SplashScreen.hideAsync();
      void import("../services/portalDeviceHeartbeat").then((m) =>
        m.sendPortalDeviceHeartbeat(),
      );
    }
  }, [deviceReady, shiftReady]);

  return null;
}

function AionHudGate() {
  const router = useRouter();
  const pathname = usePathname();
  if (!featureFlags.aionHud) return null;
  if (pathname?.startsWith("/desktop") || pathname?.startsWith("/link")) return null;
  return (
    <>
      <AionHud onLongPressDiagnostics={() => router.push("/aion-diagnostics")} />
      <AionEntityPanel />
    </>
  );
}

function ThemedAppTree() {
  const theme = useTheme();
  const [aionBootDone, setAionBootDone] = useState(() => !featureFlags.aionBoot);
  const onAionBootDone = useCallback(() => setAionBootDone(true), []);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.canvas);
    if (Platform.OS !== "android") return;
    void import("expo-navigation-bar").then((NavigationBar) => {
      void NavigationBar.setBackgroundColorAsync(theme.canvas);
      void NavigationBar.setButtonStyleAsync(
        theme.resolved === "light" ? "dark" : "light",
      );
    });
  }, [theme.canvas, theme.resolved]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.canvas }}>
      {/* ErrorBoundary ОБЁРНУТ ВОКРУГ провайдеров: падение при гидратации
          ShiftContext/DeviceContext ловится и показывает fallback, а не белый
          экран («выкидывает из приложения»). */}
      <ErrorBoundary>
      <UpdatesProvider>
        <ApkUpdatesProvider>
          <AionCoreProvider>
          <DeviceProvider>
            <ShiftProvider>
                <OcrQueueProcessor />
                <LinkSnapshotRelayBridge />
              <PostShiftHandoffBanner />
              <CloudSyncBootstrap />
              <AionOverlayOrbPulseBridge />
              <BoltCaptureUploaderBridge />
              <AuthDeepLinkListener />
              <GlobalSyncBanner />
              <UpdateGate />
              <ApkUpdateGate />
              {featureFlags.betaWatermark ? <BetaWatermark /> : null}
              {featureFlags.qaHud ? <QaDebugHud /> : null}
              <SplashUnlock />
              <StatusBar style={theme.statusBarStyle} />
                <SentryRouteListener />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.canvas },
                    animation: "fade",
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(aion)" />
                  <Stack.Screen name="map" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="debug" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="ota-debug" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="aion-diagnostics" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="voice-control" options={{ animation: "slide_from_bottom" }} />
                  <Stack.Screen
                    name="add-income"
                    options={{
                      presentation: "transparentModal",
                      animation: "slide_from_bottom",
                      contentStyle: { backgroundColor: "transparent" },
                    }}
                  />
                  <Stack.Screen
                    name="add-fuel"
                    options={{
                      presentation: "transparentModal",
                      animation: "slide_from_bottom",
                      contentStyle: { backgroundColor: "transparent" },
                    }}
                  />
                  <Stack.Screen name="fuel-journal" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="edit-fuel" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="statistics-manage" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="edit-shift-history" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="update-center" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="desktop" options={{ animation: "fade" }} />
                  <Stack.Screen name="link" options={{ animation: "fade" }} />
                </Stack>
                <AionHudGate />
                {featureFlags.aionBoot && !aionBootDone ? (
                  <AionBootSequence onDone={onAionBootDone} />
                ) : null}
            </ShiftProvider>
          </DeviceProvider>
        </AionCoreProvider>
        </ApkUpdatesProvider>
      </UpdatesProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function RootLayoutContent() {
  return (
    <AppProviders>
      <ThemedAppTree />
    </AppProviders>
  );
}

export default Sentry.wrap(RootLayoutContent);
