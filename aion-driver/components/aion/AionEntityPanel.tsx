import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDevice } from "../../hooks/useDevice";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { loadAionLinkLocalState } from "../../features/aion-link/storage/linkLocalState";
import type { AionLinkLocalPersisted } from "../../features/aion-link/types";
import { useAionCore } from "../../src/core/aion/system/AionCoreContext";
import type { AionEntityState } from "../../src/core/aion/diagnostics/types";
import { useAionEntityStore } from "../../src/core/aion/entity/aionEntityStore";
import { colors, spacing } from "../../tokens";

function formatRelative(ts: number | null): string {
  if (ts == null) return "—";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "только что";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} ч`;
  return `${Math.floor(h / 24)} дн`;
}

function stateTitleRu(s: AionEntityState): string {
  const map: Record<AionEntityState, string> = {
    idle: "Спокойный режим",
    thinking: "Обработка",
    success: "Готово",
    warning: "Нужно внимание",
    critical: "Важно",
    offline: "Офлайн",
    syncing: "Синхронизация",
    updating: "Обновление",
  };
  return map[s];
}

function stateDetailRu(s: AionEntityState): string {
  const map: Record<AionEntityState, string> = {
    idle: "Система на связи, без активных задач.",
    thinking: "Распознавание или фоновая работа.",
    success: "Операция завершена успешно.",
    warning: "Проверьте сеть или очередь отправки.",
    critical: "Синхронизация или вход требуют действий.",
    offline: "Данные на устройстве, отправка позже.",
    syncing: "Очередь отправляется в облако.",
    updating: "Получаем обновление платформы.",
  };
  return map[s];
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export function AionEntityPanel() {
  const insets = useSafeAreaInsets();
  const open = useAionEntityStore((x) => x.panelOpen);
  const ocrActive = useAionEntityStore((x) => x.ocrActive);
  const closePanel = useAionEntityStore((x) => x.closePanel);
  const { snapshot, entityState, recommendations, refreshing, refresh } = useAionCore();
  const { session, isGuest, isConfigured } = useAuth();
  const { settings } = useDevice();
  const [linkLocal, setLinkLocal] = useState<AionLinkLocalPersisted | null>(null);

  useEffect(() => {
    if (!open) return;
    void loadAionLinkLocalState().then(setLinkLocal);
  }, [open]);

  const onClose = useCallback(() => closePanel(), [closePanel]);

  if (!snapshot) return null;

  const cloudLine =
    !isConfigured || isGuest
      ? "Локальный режим"
      : session
        ? "Аккаунт активен"
        : "Войдите для облака";

  const ocrLine = ocrActive ? "Идёт распознавание" : "Нет активного OCR";

  const pending =
    snapshot.ota.pendingUpdateId || snapshot.ota.phase === "ready" || snapshot.ota.phase === "prompt"
      ? "Есть обновление"
      : "Нет ожидающих обновлений";

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <BlurView intensity={42} tint="dark" style={styles.blur}>
            <LinearGradient
              colors={["rgba(15,23,42,0.92)", "rgba(3,7,18,0.96)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.sheetInner}>
              <View style={styles.handle} />
              <Text style={styles.title}>AION</Text>
              <Text style={styles.subtitle}>{stateTitleRu(entityState)}</Text>
              <Text style={styles.detail}>{stateDetailRu(entityState)}</Text>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: spacing.md }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.section}>Состояние</Text>
                <Row label="Режим" value={entityState.toUpperCase()} />
                <Row label="Сеть" value={snapshot.networkOnline ? "В сети" : "Нет сети"} />
                <Row label="Облако" value={cloudLine} />
                <Row label="OCR" value={ocrLine} />
                <Row label="Очередь синка" value={String(snapshot.syncQueueLength)} />
                <Row label="Последний синк" value={formatRelative(snapshot.lastSyncFlushAt)} />
                <Row label="Обновления" value={pending} />

                <Text style={styles.section}>Версии</Text>
                <Row label="Приложение" value={snapshot.appVersion} />
                <Row label="Runtime" value={snapshot.ota.runtimeVersion ?? "—"} />
                <Row label="Канал" value={snapshot.ota.channel ?? snapshot.channelTier} />

                {snapshot.ota.phase === "error" && snapshot.ota.errorMessage ? (
                  <>
                    <Text style={styles.section}>Обновление</Text>
                    <Text style={styles.softError}>{snapshot.ota.errorMessage}</Text>
                  </>
                ) : null}

                <Text style={styles.section}>Устройства</Text>
                <Row
                  label="Это устройство"
                  value={linkLocal?.thisDeviceLabel ?? "—"}
                />
                <Row
                  label="Режим Link"
                  value={settings.aionLinkMode ? "Включён" : "Выключен"}
                />
                <Row
                  label="Связанные"
                  value={
                    linkLocal && linkLocal.remoteSlots.length > 0
                      ? linkLocal.remoteSlots.map((x) => x.label).join(", ")
                      : "Пока нет — настройка на личном телефоне"
                  }
                />

                {recommendations.length > 0 ? (
                  <>
                    <Text style={styles.section}>Рекомендации</Text>
                    {recommendations.slice(0, 4).map((r) => (
                      <Text key={r.id} style={styles.rec}>
                        • {r.title}
                      </Text>
                    ))}
                  </>
                ) : null}

                <Text style={styles.section}>Действия</Text>
                <Pressable
                  style={styles.action}
                  onPress={() => {
                    onClose();
                    router.push("/driver/import" as Href);
                  }}
                >
                  <Text style={styles.actionText}>Импорт выплаты</Text>
                </Pressable>
                <Pressable
                  style={styles.action}
                  onPress={() => {
                    onClose();
                    router.push("/settings" as Href);
                  }}
                >
                  <Text style={styles.actionText}>Настройки</Text>
                </Pressable>
                {settings.aionLinkMode ? (
                  <Pressable
                    style={styles.action}
                    onPress={() => {
                      onClose();
                      router.push("/link" as Href);
                    }}
                  >
                    <Text style={styles.actionText}>Экран Link</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.actionGhost}
                  onPress={() => {
                    onClose();
                    router.push("/aion-diagnostics" as Href);
                  }}
                >
                  <Text style={styles.actionGhostText}>Диагностика</Text>
                </Pressable>
                <Pressable
                  style={styles.actionGhost}
                  onPress={() => {
                    void refresh();
                  }}
                >
                  <Text style={styles.actionGhostText}>
                    Обновить данные{refreshing ? "…" : ""}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheetWrap: {
    maxHeight: "88%",
    paddingHorizontal: spacing.md,
  },
  blur: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  sheetInner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.slate100,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 4,
    color: colors.cyan400,
    fontSize: 15,
    fontWeight: "700",
  },
  detail: {
    marginTop: 6,
    color: colors.slate400,
    fontSize: 13,
    lineHeight: 18,
  },
  scroll: {
    marginTop: spacing.md,
    maxHeight: 420,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: 6,
    color: colors.slate500,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowLabel: { color: colors.slate500, fontSize: 12, marginBottom: 2 },
  rowValue: { color: colors.slate100, fontSize: 14, fontWeight: "600" },
  softError: {
    color: "#fca5a5",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  rec: { color: colors.slate300, fontSize: 13, marginBottom: 6, lineHeight: 18 },
  action: {
    backgroundColor: "rgba(34,211,238,0.12)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  actionText: { color: colors.slate100, fontSize: 15, fontWeight: "700", textAlign: "center" },
  actionGhost: {
    paddingVertical: 12,
    marginBottom: 4,
  },
  actionGhostText: {
    color: colors.slate500,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
