import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useUpdates } from "../../hooks/useUpdates";
import { peekSyncQueue, type SyncOperation } from "../../features/sync/services/offlineQueue";
import { useAionCore } from "../../src/core/aion/system/AionCoreContext";

function syncTypeLabel(t: SyncOperation["type"]): string {
  switch (t) {
    case "profile_upsert":
      return "Профиль";
    case "vehicle_upsert":
      return "Транспорт";
    case "trip_upsert":
      return "Поездка";
    case "analytics_event":
      return "Аналитика";
    case "link_ocr_snapshot":
      return "AION Link";
    default:
      return t;
  }
}

const ROW_H = 44;

/**
 * Cloud & sync diagnostics for desktop: offline queue preview + OTA controller state (shared services).
 */
export function DesktopCloudScreen() {
  const { semantic: s } = useTheme();
  const { snapshot, refresh, refreshing } = useAionCore();
  const updates = useUpdates();
  const [queue, setQueue] = useState<SyncOperation[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const q = await peekSyncQueue();
      setQueue(q);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadQueue();
      const id = setInterval(() => void loadQueue(), 5000);
      return () => clearInterval(id);
    }, [loadQueue]),
  );

  const renderItem = useCallback(
    ({ item: op }: ListRenderItemInfo<SyncOperation>) => (
      <View
        style={{
          flexDirection: "row",
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderBottomWidth: 1,
          borderBottomColor: s.border,
          backgroundColor: s.surface,
          minHeight: ROW_H,
        }}
      >
        <Text style={{ flex: 2, fontSize: 13, color: s.textPrimary }}>{syncTypeLabel(op.type)}</Text>
        <Text style={{ flex: 1, fontSize: 13, color: s.textSecondary }}>{op.attempts}</Text>
        <Text style={{ flex: 2, fontSize: 12, color: s.textTertiary }}>
          {new Date(op.createdAt).toLocaleString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          })}
        </Text>
      </View>
    ),
    [s],
  );

  const listHeader = useMemo(
    () => (
      <View style={{ gap: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 3 }}>CLOUD</Text>
        <Text style={{ fontSize: 24, fontWeight: "900", color: s.textPrimary }}>Облако и синхронизация</Text>
        <Text style={{ fontSize: 14, color: s.textSecondary, lineHeight: 22, maxWidth: 720 }}>
          Снимок очереди офлайн-синка и состояние OTA из тех же сервисов, что и мобильное приложение.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <View
            style={{
              flex: 1,
              minWidth: 200,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: s.border,
              backgroundColor: s.surface,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: s.textTertiary }}>ОЧЕРЕДЬ (SNAPSHOT)</Text>
            <Text style={{ marginTop: 8, fontSize: 28, fontWeight: "900", color: s.textPrimary }}>
              {snapshot ? String(snapshot.syncQueueLength) : "…"}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 200,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: s.border,
              backgroundColor: s.surface,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: s.textTertiary }}>OTA UI PHASE</Text>
            <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "900", color: s.accent }}>{updates.phase}</Text>
            <Text style={{ marginTop: 6, fontSize: 12, color: s.textSecondary }}>Версия: {updates.currentVersion}</Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 200,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: s.border,
              backgroundColor: s.surface,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: s.textTertiary }}>ПОСЛЕДНЯЯ ПРОВЕРКА OTA</Text>
            <Text style={{ marginTop: 8, fontSize: 14, fontWeight: "700", color: s.textPrimary }}>
              {updates.lastOtaCheckAtMs
                ? new Date(updates.lastOtaCheckAtMs).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <Pressable
            onPress={() => {
              void refresh();
              void loadQueue();
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: s.borderStrong,
              backgroundColor: s.surfaceMuted,
            }}
          >
            <Text style={{ color: s.accent, fontWeight: "800" }}>{refreshing ? "Обновление…" : "Обновить снимок"}</Text>
          </Pressable>
          <Pressable
            onPress={() => updates.checkNow()}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: s.border,
              backgroundColor: s.surface,
            }}
          >
            <Text style={{ color: s.textPrimary, fontWeight: "800" }}>Проверить OTA</Text>
          </Pressable>
        </View>

        {updates.errorMessage ? <Text style={{ fontSize: 13, color: s.danger }}>{updates.errorMessage}</Text> : null}
      {updates.pendingUpdateId ? (
        <Text style={{ fontSize: 12, color: s.textTertiary }}>
          Доступно обновление: {updates.pendingUpdateId.slice(0, 14)}…
        </Text>
      ) : null}

        <Text style={{ marginTop: 8, fontSize: 13, fontWeight: "800", color: s.textSecondary }}>
          Очередь синхронизации
        </Text>
        {queue.length > 0 ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: s.border,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderBottomWidth: 1,
                borderBottomColor: s.border,
                backgroundColor: s.surfaceMuted,
              }}
            >
              <Text style={{ flex: 2, fontSize: 11, fontWeight: "800", color: s.textTertiary }}>ТИП</Text>
              <Text style={{ flex: 1, fontSize: 11, fontWeight: "800", color: s.textTertiary }}>ПОПЫТКИ</Text>
              <Text style={{ flex: 2, fontSize: 11, fontWeight: "800", color: s.textTertiary }}>ВРЕМЯ</Text>
            </View>
          </View>
        ) : null}
      </View>
    ),
    [s, snapshot, updates, refreshing, queue.length, refresh, loadQueue],
  );

  const listEmpty = useMemo(
    () =>
      queueLoading ? (
        <ActivityIndicator color={s.accent} style={{ marginTop: 16 }} />
      ) : (
        <Text style={{ fontSize: 13, color: s.textTertiary, marginTop: 8 }}>Очередь пуста.</Text>
      ),
    [queueLoading, s.accent, s.textTertiary],
  );

  return (
    <FlatList
      data={queue}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={queue.length === 0 ? listEmpty : null}
      contentContainerStyle={{ paddingBottom: 48, flexGrow: 1 }}
      style={{ backgroundColor: s.canvas }}
      initialNumToRender={12}
      maxToRenderPerBatch={24}
      windowSize={8}
      getItemLayout={(_, index) => ({
        length: ROW_H,
        offset: ROW_H * index,
        index,
      })}
    />
  );
}
