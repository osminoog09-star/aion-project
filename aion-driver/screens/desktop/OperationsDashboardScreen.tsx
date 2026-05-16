import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AnalyticsTile } from "../../components/desktop/AnalyticsTile";
import { useTheme } from "../../contexts/ThemeContext";
import { useAionCore } from "../../src/core/aion/system/AionCoreContext";
import { useShift } from "../../hooks/useShift";
import { useBreakpoints } from "../../hooks/useBreakpoints";
import { useWorkspaceDensity } from "../../hooks/useWorkspaceDensity";

/**
 * First desktop operations surface: live diagnostics + shift facts (no fabricated KPIs).
 */
export function OperationsDashboardScreen() {
  const theme = useTheme();
  const s = theme.semantic;
  const { snapshot, refreshing, refresh } = useAionCore();
  const { activeShift, profile } = useShift();
  const { width, tier, isUltrawide } = useBreakpoints();
  const { density } = useWorkspaceDensity();

  const sectionGap = density === "compact" ? 10 : density === "cinematic" ? 20 : 14;

  const tileMin = Math.max(160, Math.floor(width * (isUltrawide ? 0.22 : tier === "desktop" ? 0.3 : 0.44)));

  const incomeLine = useMemo(() => {
    if (!activeShift) return "Нет активной смены";
    const n = activeShift.totalIncome;
    return `${n.toFixed(2)} · событий дохода: ${activeShift.incomeEventsCount ?? 0}`;
  }, [activeShift]);

  const distanceLine = useMemo(() => {
    if (!activeShift) return "—";
    const km = activeShift.distanceMeters / 1000;
    return `${km.toFixed(1)} км · ${activeShift.paused ? "пауза" : "онлайн"}`;
  }, [activeShift]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32, gap: sectionGap }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 240, maxWidth: 720 }}>
          <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 3 }}>OPERATIONS</Text>
          <Text style={{ marginTop: 6, fontSize: 26, fontWeight: "900", color: s.textPrimary }}>
            Пульт управления
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: s.textSecondary, lineHeight: 22 }}>
            Плотные метрики и отчёты для веб-рабочего места. Данные ниже — из текущей сессии и диагностики AION, без
            синтетической аналитики.
          </Text>
        </View>

        <Pressable
          onPress={() => void refresh()}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: s.borderStrong,
            backgroundColor: s.surface,
          }}
        >
          <Text style={{ color: s.accent, fontWeight: "800", fontSize: 13 }}>{refreshing ? "Обновление…" : "Обновить"}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <View style={{ flexGrow: 1, minWidth: tileMin, borderWidth: 1, borderColor: s.border, borderRadius: 14, backgroundColor: s.surface }}>
          <AnalyticsTile title="ПРОФИЛЬ" value={profile?.name ?? "—"} hint={profile?.carModel} />
        </View>
        <View style={{ flexGrow: 1, minWidth: tileMin, borderWidth: 1, borderColor: s.border, borderRadius: 14, backgroundColor: s.surface }}>
          <AnalyticsTile title="СЕТЬ" value={snapshot ? (snapshot.networkOnline ? "Онлайн" : "Офлайн") : "…"} hint={snapshot?.networkType} />
        </View>
        <View style={{ flexGrow: 1, minWidth: tileMin, borderWidth: 1, borderColor: s.border, borderRadius: 14, backgroundColor: s.surface }}>
          <AnalyticsTile
            title="ОЧЕРЕДЬ СИНХРОНИЗАЦИИ"
            value={snapshot ? String(snapshot.syncQueueLength) : "…"}
            hint="Локальные операции до flush"
          />
        </View>
        <View style={{ flexGrow: 1, minWidth: tileMin, borderWidth: 1, borderColor: s.border, borderRadius: 14, backgroundColor: s.surface }}>
          <AnalyticsTile
            title="OTA"
            value={snapshot ? snapshot.ota.phase.toUpperCase() : "…"}
            hint={snapshot?.ota.channel ? `Канал: ${snapshot.ota.channel}` : undefined}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <View style={{ flexGrow: 1, minWidth: tileMin, borderWidth: 1, borderColor: s.border, borderRadius: 14, backgroundColor: s.surface }}>
          <AnalyticsTile title="АКТИВНАЯ СМЕНА" value={activeShift ? "Да" : "Нет"} hint={incomeLine} />
        </View>
        <View style={{ flexGrow: 1, minWidth: tileMin, borderWidth: 1, borderColor: s.border, borderRadius: 14, backgroundColor: s.surface }}>
          <AnalyticsTile title="ПРОБЕГ СМЕНЫ" value={activeShift ? `${(activeShift.distanceMeters / 1000).toFixed(1)} км` : "—"} hint={distanceLine} />
        </View>
        <View style={{ flexGrow: 1, minWidth: tileMin, borderWidth: 1, borderColor: s.border, borderRadius: 14, backgroundColor: s.surface }}>
          <AnalyticsTile
            title="RUNTIME"
            value={snapshot?.ota.runtimeVersion ?? "—"}
            hint={`Версия приложения ${snapshot?.appVersion ?? "—"}`}
          />
        </View>
        <View style={{ flexGrow: 1, minWidth: tileMin, borderWidth: 1, borderColor: s.border, borderRadius: 14, backgroundColor: s.surface }}>
          <AnalyticsTile
            title="ПОСЛЕДНИЙ FLUSH"
            value={
              snapshot?.lastSyncFlushAt
                ? new Date(snapshot.lastSyncFlushAt).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"
            }
            hint="Метка времени синка (если была)"
          />
        </View>
      </View>

      <View style={{ borderWidth: 1, borderColor: s.border, borderRadius: 14, padding: 16, backgroundColor: s.surface }}>
        <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 2 }}>СЛЕДУЮЩИЕ ШАГИ</Text>
        <Text style={{ marginTop: 10, fontSize: 14, color: s.textSecondary, lineHeight: 22 }}>
          Модули «Финансы», «Карты», «ИИ» подключатся к тем же репозиториям, что и мобильное приложение. Сейчас —
          каркас маршрутов и плотная сетка.
        </Text>
        <Pressable onPress={() => router.push("/desktop/control-center")} style={{ marginTop: 14, alignSelf: "flex-start" }}>
          <Text style={{ color: s.accent, fontWeight: "800" }}>Центр управления →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
