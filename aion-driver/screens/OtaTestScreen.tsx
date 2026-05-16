import * as Updates from "expo-updates";
import { type Href, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientButton } from "../components/ui/GradientButton";
import { peekSyncQueue } from "../features/sync/services/offlineQueue";
import { useUpdates } from "../hooks/useUpdates";
import { getOtaChannelTier } from "../lib/otaTestMode";
import { getOtaDebugInfo, peekLastOtaCheckDebug } from "../services/updateService";
import {
  getOtaSimulateOffline,
  setOtaSimulateOffline,
  setOtaSimulateFetchFailOnce,
} from "../storage/core/otaTestFlags";
import { clearOtaSnooze } from "../storage/core/otaStorage";
import { getLastSyncFlushAt } from "../storage/core/syncDebugMeta";
import { backgroundTrackingProductionGate } from "../services/backgroundTracking";
import { colors, spacing } from "../tokens";

function formatAge(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 120) return `${sec} с`;
  const m = Math.floor(sec / 60);
  if (m < 120) return `${m} мин`;
  const h = Math.floor(m / 60);
  return `${h} ч`;
}

export function OtaTestScreen() {
  const { fromValidation } = useLocalSearchParams<{ fromValidation?: string }>();
  const u = useUpdates();
  const [logs, setLogs] = useState<string>("");
  const [offlineSim, setOfflineSim] = useState(false);
  const [payloadText, setPayloadText] = useState<string>("");
  const [lastFlushMs, setLastFlushMs] = useState<number | null>(null);
  const [queueLen, setQueueLen] = useState(0);

  const refreshLogs = useCallback(async () => {
    try {
      const entries = await Updates.readLogEntriesAsync(3600_000);
      const lines = entries
        .slice(-40)
        .map((e) => `${new Date(e.timestamp).toISOString()} [${e.level}] ${e.message}`)
        .join("\n");
      setLogs(lines || "Логи пусты.");
    } catch (e) {
      setLogs(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const refreshPayload = useCallback(() => {
    const snap = peekLastOtaCheckDebug();
    setPayloadText(snap != null ? `${new Date(snap.at).toISOString()}\n\n${snap.json}` : "Пока нет данных — выполните проверку OTA.");
  }, []);

  const refreshMeta = useCallback(async () => {
    const t = await getLastSyncFlushAt();
    setLastFlushMs(t);
    const q = await peekSyncQueue();
    setQueueLen(q.length);
  }, []);

  useEffect(() => {
    void getOtaSimulateOffline().then(setOfflineSim);
  }, []);

  useEffect(() => {
    void refreshLogs();
    void refreshMeta();
  }, [refreshLogs, refreshMeta, u.updateStatus]);

  const info = getOtaDebugInfo();
  const manifest = Updates.manifest as Record<string, unknown> | undefined;
  const lastUpdate =
    Updates.createdAt != null ? Updates.createdAt.toISOString() : "—";
  const tier = getOtaChannelTier();
  const pendingAge = useMemo(() => formatAge(u.manifestSummary?.createdAt ?? null), [u.manifestSummary?.createdAt]);
  const lastCheckStr =
    u.lastOtaCheckAtMs != null ? new Date(u.lastOtaCheckAtMs).toLocaleString() : "—";
  const lastFlushStr =
    lastFlushMs != null ? new Date(lastFlushMs).toLocaleString() : "—";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() =>
            fromValidation === "1"
              ? router.push("/driver/route-timeline" as Href)
              : router.back()
          }
          style={{ marginBottom: spacing.sm }}
        >
          <Text style={{ color: "#22d3ee", fontSize: 14 }}>
            {fromValidation === "1" ? "← Маршруты (чеклист)" : "← назад"}
          </Text>
        </Pressable>
        <Text style={{ color: colors.slate100, fontSize: 22, fontWeight: "700" }}>OTA testing</Text>
        <Text style={{ color: colors.slate500, marginTop: 6, fontSize: 13 }}>
          Release/preview APK (не Expo Go). Канал preview — beta OTA; production — только канал production в EAS.
        </Text>

        {fromValidation === "1" ? (
          <View
            style={{
              marginTop: spacing.md,
              padding: spacing.sm,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(52,211,153,0.35)",
              backgroundColor: "rgba(16,185,129,0.12)",
            }}
          >
            <Text style={{ color: "#6ee7b7", fontSize: 12, fontWeight: "600" }}>
              Field validation 8/8 — smoke test
            </Text>
            <Text style={{ color: colors.slate400, marginTop: 4, fontSize: 11 }}>
              Проверьте обновление на preview-канале и зафиксируйте результат в отчёте (Маршруты →
              Скопировать отчёт).
            </Text>
            <Text style={{ color: colors.slate500, marginTop: 6, fontSize: 10 }}>
              {backgroundTrackingProductionGate(true).reasonRu}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: spacing.lg, gap: 8 }}>
          <Row label="Канал (tier)" value={tier} />
          <Row label="Preview test mode" value={u.isOtaPreviewTest ? "ON (EXPO_PUBLIC_OTA_PREVIEW_TEST)" : "OFF"} />
          <Row label="Discrete banner UX" value={u.discreteBannerUx ? "ON" : "OFF"} />
          <Row label="OTA enabled" value={String(info.enabled)} />
          <Row label="EAS channel (raw)" value={info.channel ?? "—"} />
          <Row label="runtimeVersion" value={info.runtimeVersion ?? "—"} />
          <Row label="updateId (running)" value={info.updateId ?? "—"} />
          <Row label="embedded launch" value={String(Updates.isEmbeddedLaunch)} />
          <Row label="emergency launch (rollback)" value={String(Updates.isEmergencyLaunch)} />
          <Row label="last update (createdAt)" value={lastUpdate} />
          <Row label="App version" value={u.currentVersion} />
          <Row label="UI phase" value={u.updateStatus} />
          <Row label="Banner" value={String(u.bannerVisible)} />
          <Row label="Modal" value={String(u.visible)} />
          <Row label="Pending updateId" value={u.pendingUpdateId ?? "—"} />
          <Row label="Pending commit" value={u.manifestSummary?.commitHash ?? "—"} />
          <Row label="Возраст pending (с сервера)" value={pendingAge} />
          <Row label="Последняя проверка OTA" value={lastCheckStr} />
          <Row label="Последний sync flush" value={lastFlushStr} />
          <Row label="Очередь синка (ops)" value={String(queueLen)} />
        </View>

        {u.manifestSummary?.releaseMessage ? (
          <View style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.slate400, fontSize: 12, fontWeight: "700" }}>Release notes</Text>
            <Text selectable style={{ color: colors.slate300, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
              {u.manifestSummary.releaseMessage}
            </Text>
          </View>
        ) : null}

        <Text style={{ color: colors.slate400, marginTop: spacing.lg, fontSize: 12 }}>
          Manifest id: {String(manifest?.id ?? "—")}
        </Text>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <GradientButton title="Проверить обновления" onPress={() => u.checkNow()} size="cockpit" />
          <GradientButton
            title="Проверить (force, игнор gap)"
            variant="glass"
            onPress={() => u.checkNowForce()}
            size="cockpit"
          />
          <GradientButton title="Скачать update" onPress={() => void u.startDownload()} size="cockpit" />
          <GradientButton title="Применить / перезапустить app" onPress={() => void u.applyUpdate()} size="cockpit" />
          <GradientButton title="Сбросить snooze OTA" variant="ghost" onPress={() => void clearOtaSnooze()} size="cockpit" />
          <GradientButton
            title="Обновить мету (sync queue / flush)"
            variant="ghost"
            onPress={() => void refreshMeta()}
            size="cockpit"
          />
        </View>

        <View
          style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            backgroundColor: "rgba(15,23,42,0.5)",
          }}
        >
          <Text style={{ color: colors.slate300, fontWeight: "700", marginBottom: 8 }}>Симуляции</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: colors.slate400, flex: 1, fontSize: 13 }}>Офлайн при проверке/скачивании</Text>
            <Switch
              value={offlineSim}
              onValueChange={(v) => {
                setOfflineSim(v);
                void setOtaSimulateOffline(v);
              }}
              trackColor={{ false: "#334155", true: "#f59e0b" }}
            />
          </View>
          <GradientButton
            title="Симуляция: сбой загрузки (1 раз)"
            variant="ghost"
            className="mt-3"
            onPress={() => void setOtaSimulateFetchFailOnce()}
            size="cockpit"
          />
          <GradientButton
            title="Симуляция: UI баннера (без сервера)"
            variant="ghost"
            className="mt-2"
            onPress={() => u.runSimulatedUpdatePrompt()}
            size="cockpit"
          />
          <GradientButton
            title="Симуляция: rollback (инфо)"
            variant="ghost"
            className="mt-2"
            onPress={() =>
              Alert.alert(
                "Rollback OTA",
                "Полный откат делается на стороне EAS (например eas update:rollback). Клиент получит directive с сервера; признак emergency launch см. выше после перезапуска.",
              )
            }
            size="cockpit"
          />
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Text style={{ color: colors.slate300, fontWeight: "700" }}>Отладка payload</Text>
          <GradientButton title="Показать последний ответ check" variant="glass" onPress={refreshPayload} size="cockpit" />
          <ScrollView
            style={{
              maxHeight: 160,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(0,0,0,0.35)",
              padding: spacing.sm,
            }}
          >
            <Text selectable style={{ color: colors.slate400, fontSize: 10, fontFamily: "monospace" }}>
              {payloadText || "Нажмите кнопку выше после проверки OTA."}
            </Text>
          </ScrollView>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Text style={{ color: colors.slate300, fontWeight: "700", marginBottom: 8 }}>Логи expo-updates</Text>
          <GradientButton title="Обновить логи" variant="glass" onPress={() => void refreshLogs()} size="cockpit" />
          <GradientButton
            title="Очистить OTA логи (native log buffer)"
            variant="ghost"
            className="mt-2"
            onPress={() => {
              void (async () => {
                try {
                  await Updates.clearLogEntriesAsync();
                  await refreshLogs();
                  Alert.alert("Готово", "Буфер логов expo-updates очищен.");
                } catch (e) {
                  Alert.alert("Ошибка", e instanceof Error ? e.message : String(e));
                }
              })();
            }}
            size="cockpit"
          />
          <ScrollView
            style={{
              marginTop: spacing.sm,
              maxHeight: 220,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(0,0,0,0.35)",
              padding: spacing.sm,
            }}
          >
            <Text selectable style={{ color: colors.slate400, fontSize: 10, fontFamily: "monospace" }}>
              {logs}
            </Text>
          </ScrollView>
          <Text style={{ color: colors.slate600, fontSize: 10, marginTop: 6 }}>
            Полный сброс кэша загруженного JS-бандла из JS недоступен — для «чистого» теста переустановите APK или
            накатите новый update.
          </Text>
        </View>

        <GradientButton
          title="Назад"
          variant="ghost"
          className="mt-8"
          onPress={() => router.back()}
          size="cockpit"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: colors.slate500, fontSize: 12 }}>{label}</Text>
      <Text
        style={{ color: colors.slate200, fontSize: 12, fontWeight: "600", flexShrink: 1, textAlign: "right" }}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}
