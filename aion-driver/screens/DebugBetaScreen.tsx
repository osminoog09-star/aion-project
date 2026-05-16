import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientButton } from "../components/ui/GradientButton";
import { useUpdates } from "../hooks/useUpdates";
import { clearSyncQueue } from "../features/sync/services/offlineQueue";
import { STORAGE_KEYS } from "../storage/core/keys";
import { captureMessage, isSentryEnabled, refreshSentryAppContext } from "../lib/sentry";
import { getOtaDebugInfo } from "../services/updateService";
import { colors, spacing } from "../tokens";

export function DebugBetaScreen() {
  const ota = useUpdates();
  const [msg, setMsg] = useState<string | null>(null);

  const toast = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: colors.slate200, fontSize: 22, fontWeight: "700" }}>Beta / QA</Text>
        <Text style={{ color: colors.slate500, marginTop: 6, fontSize: 13 }}>
          Не показывать инвесторам как основной UI. Только для внутренних тестов.
        </Text>

        {msg ? (
          <Text style={{ color: colors.cyan400, marginTop: spacing.md, fontSize: 13 }}>{msg}</Text>
        ) : null}

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <Row label="Sentry" value={isSentryEnabled() ? "DSN задан" : "нет DSN"} />
          <Row label="OTA channel" value={getOtaDebugInfo().channel ?? "—"} />
          <Row label="Update status" value={ota.updateStatus} />
          <Row label="App version" value={Constants.expoConfig?.version ?? "—"} />
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <GradientButton title="Проверить OTA (checkNow)" onPress={() => ota.checkNow()} size="cockpit" />
          <GradientButton
            title="Экран OTA testing"
            variant="glass"
            onPress={() => router.push("/ota-debug")}
            size="cockpit"
          />
          <GradientButton
            title="Sentry: тестовое событие"
            variant="glass"
            onPress={() => {
              captureMessage("AION debug ping", "info");
              void refreshSentryAppContext("/debug");
              toast("Событие отправлено (если DSN задан)");
            }}
            size="cockpit"
          />
          <GradientButton
            title="Очистить офлайн-очередь синка"
            variant="ghost"
            onPress={async () => {
              await clearSyncQueue();
              toast("Очередь синка очищена");
            }}
            size="cockpit"
          />
          <GradientButton
            title="Сбросить историю смен (локально)"
            variant="ghost"
            onPress={async () => {
              await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
              toast("История смен очищена");
            }}
            size="cockpit"
          />
          <GradientButton
            title="Сбросить OCR импорты"
            variant="ghost"
            onPress={async () => {
              await AsyncStorage.removeItem(STORAGE_KEYS.OCR_IMPORTS);
              toast("OCR импорты очищены");
            }}
            size="cockpit"
          />
          <GradientButton title="Закрыть" variant="glass" onPress={() => router.back()} size="cockpit" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        paddingVertical: spacing.xs,
      }}
    >
      <Text style={{ color: colors.slate500, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.slate200, fontSize: 12, fontWeight: "600", marginLeft: 12 }}>
        {value}
      </Text>
    </View>
  );
}
