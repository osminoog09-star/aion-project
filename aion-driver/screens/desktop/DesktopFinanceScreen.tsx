import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, Platform, Pressable, ScrollView, Text, View, type ListRenderItemInfo } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useShift } from "../../hooks/useShift";
import { useResolvedCurrency } from "../../hooks/useResolvedCurrency";
import type { Shift } from "../../types";
import { formatCurrencyDisplay } from "../../utils/formatting";
import { getCompletedShiftProfit, pickProfitFromLive } from "../../utils/shiftDisplayEconomics";

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h <= 0) return `${m} мин`;
  return `${h} ч ${m} мин`;
}

/**
 * Finance overview from persisted shift history (same storage as mobile history tab).
 */
export function DesktopFinanceScreen() {
  const { semantic: s } = useTheme();
  const { history, activeShift, liveMetrics, refreshHistory } = useShift();
  const currency = useResolvedCurrency();

  const rows = useMemo(() => history.slice(0, 200), [history]);

  const activeSummary = useMemo(() => {
    if (!activeShift || !liveMetrics) return null;
    return {
      income: liveMetrics.income,
      net: pickProfitFromLive(liveMetrics).profit,
      durationMs: liveMetrics.durationMs,
    };
  }, [activeShift, liveMetrics]);

  const renderRow = useCallback(
    ({ item: sh }: ListRenderItemInfo<Shift>) => (
      <View
        style={{
          flexDirection: "row",
          paddingVertical: 10,
          paddingHorizontal: 10,
          borderBottomWidth: 1,
          borderBottomColor: s.border,
          backgroundColor: s.surface,
        }}
      >
        <Text style={{ flex: 2.2, fontSize: 12, color: s.textPrimary }} numberOfLines={1}>
          {new Date(sh.startedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
        </Text>
        <Text style={{ flex: 1.2, fontSize: 12, color: s.textSecondary }}>{formatDuration(sh.durationMs)}</Text>
        <Text style={{ flex: 1.3, fontSize: 12, color: s.textPrimary }} numberOfLines={1}>
          {formatCurrencyDisplay(sh.income, currency)}
        </Text>
        <Text style={{ flex: 1.3, fontSize: 12, fontWeight: "700", color: s.success }} numberOfLines={1}>
          {formatCurrencyDisplay(getCompletedShiftProfit(sh), currency)}
        </Text>
      </View>
    ),
    [s, currency],
  );

  const listHeader = useMemo(
    () => (
      <View style={{ gap: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: "900", color: s.textTertiary, letterSpacing: 3 }}>FINANCE</Text>
        <Text style={{ fontSize: 24, fontWeight: "900", color: s.textPrimary }}>Финансы</Text>
        <Text style={{ fontSize: 14, color: s.textSecondary, lineHeight: 22, maxWidth: 720 }}>
          Сводка по завершённым сменам из локального журнала. Валюта отображения — из профиля / региона.
        </Text>

        {activeSummary ? (
          <View
            style={{
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: s.borderStrong,
              backgroundColor: s.surface,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: s.textTertiary }}>АКТИВНАЯ СМЕНА (ОЦЕНКА)</Text>
            <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              <View>
                <Text style={{ fontSize: 11, color: s.textTertiary }}>Доход</Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: s.textPrimary }}>
                  {formatCurrencyDisplay(activeSummary.income, currency)}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, color: s.textTertiary }}>Чистая (оценка)</Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: s.success }}>
                  {formatCurrencyDisplay(activeSummary.net, currency)}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, color: s.textTertiary }}>Время</Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: s.textPrimary }}>
                  {formatDuration(activeSummary.durationMs)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <Pressable
            onPress={() => void refreshHistory()}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: s.borderStrong,
              backgroundColor: s.surface,
            }}
          >
            <Text style={{ color: s.accent, fontWeight: "800" }}>Обновить журнал</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/driver/history")}>
            <Text style={{ color: s.textSecondary, fontSize: 13 }}>Открыть историю в кокпите →</Text>
          </Pressable>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "800", color: s.textSecondary }}>Завершённые смены</Text>
        {rows.length === 0 ? (
          <Text style={{ fontSize: 13, color: s.textTertiary }}>Пока нет записей в истории.</Text>
        ) : (
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
                paddingHorizontal: 10,
                borderBottomWidth: 1,
                borderBottomColor: s.border,
                backgroundColor: s.surfaceMuted,
              }}
            >
              <Text style={{ flex: 2.2, fontSize: 10, fontWeight: "800", color: s.textTertiary }}>НАЧАЛО</Text>
              <Text style={{ flex: 1.2, fontSize: 10, fontWeight: "800", color: s.textTertiary }}>ВРЕМЯ</Text>
              <Text style={{ flex: 1.3, fontSize: 10, fontWeight: "800", color: s.textTertiary }}>ДОХОД</Text>
              <Text style={{ flex: 1.3, fontSize: 10, fontWeight: "800", color: s.textTertiary }}>ЧИСТАЯ</Text>
            </View>
          </View>
        )}
      </View>
    ),
    [s, activeSummary, currency, refreshHistory, rows.length],
  );

  if (rows.length === 0) {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} style={{ backgroundColor: s.canvas }}>
        {listHeader}
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
      ListHeaderComponent={listHeader}
      initialNumToRender={14}
      maxToRenderPerBatch={20}
      windowSize={7}
      removeClippedSubviews={Platform.OS !== "web"}
      contentContainerStyle={{ paddingBottom: 48 }}
      style={{ backgroundColor: s.canvas }}
    />
  );
}
