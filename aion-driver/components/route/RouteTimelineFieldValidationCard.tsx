import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
  formatFieldValidationReportRu,
  getNextFieldValidationActionRu,
  getFieldValidationTier,
  type RouteFieldValidationStatus,
} from "../../features/route/computeRouteFieldValidation";
import { backgroundTrackingProductionGate } from "../../services/backgroundTracking";
import {
  getInstalledAppVersion,
  getInstalledRuntimeVersion,
} from "../../lib/driverBuildCapabilities";

type Props = {
  validation: RouteFieldValidationStatus;
  loading: boolean;
};

export function RouteTimelineFieldValidationCard({ validation, loading }: Props) {
  const router = useRouter();
  if (!validation.checks.length && !loading) return null;

  const bgGate = backgroundTrackingProductionGate(validation.ready);
  const tier = getFieldValidationTier(validation);
  const nextAction = getNextFieldValidationActionRu(validation);

  const copyReport = useCallback(async () => {
    await Clipboard.setStringAsync(formatFieldValidationReportRu(validation));
    Alert.alert(
      "Отчёт скопирован",
      `Диагностика ${validation.passedCount}/${validation.totalCount}. Она не блокирует работу приложения.`,
    );
  }, [validation]);

  const border =
    validation.ready
      ? "border-emerald-500/35 bg-emerald-500/8"
      : "border-slate-500/25 bg-slate-500/5";

  return (
    <View className={`mx-4 mb-3 rounded-xl border px-3 py-3 ${border}`}>
      <Text className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90">
        диагностика маршрута
        {loading ? " · загрузка…" : ""}
      </Text>
      <Text className="mt-0.5 text-[10px] text-slate-500">
        APK {getInstalledAppVersion()} · rv {getInstalledRuntimeVersion()}
      </Text>
      <Text className="mt-1 text-sm font-medium text-white">
        {validation.ready
          ? "✓ Диагностика 8/8"
          : tier === "core_ready"
            ? `База ${validation.passedCount}/${validation.totalCount}`
            : `Прогресс: ${validation.passedCount}/${validation.totalCount}`}
        {validation.coveragePercent != null
          ? ` · покрытие ${validation.coveragePercent}%`
          : ""}
      </Text>
      <Text className="mt-2 text-[10px] leading-4 text-slate-500">
        Информационный чеклист: помогает оценить GPS и фон, но не блокирует смену или обновления.
      </Text>
      <Text className="mt-2 text-[10px] leading-4 text-cyan-200/85">
        Следующее: {nextAction}
      </Text>
      <Text className="mt-2 text-[10px] leading-4 text-slate-400">
        Фон: {bgGate.reasonRu}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => void copyReport()}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
        >
          <Text className="text-[10px] font-semibold text-cyan-300">Скопировать отчёт</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({ pathname: "/ota-debug", params: { fromValidation: "1" } })
          }
          className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5"
        >
          <Text className="text-[10px] font-semibold text-cyan-200">OTA / обновления →</Text>
        </Pressable>
      </View>
      <View className="mt-2 gap-1.5">
        {validation.checks.map((c) => (
          <View key={c.id} className="flex-row gap-2">
            <Text className="text-xs">{c.passed ? "✓" : "○"}</Text>
            <View className="min-w-0 flex-1">
              <Text
                className={`text-xs font-medium ${c.passed ? "text-emerald-200/90" : "text-slate-300"}`}
              >
                {c.labelRu}
              </Text>
              <Text className="text-[10px] text-slate-500">{c.detailRu}</Text>
              {!c.passed && c.actionRu ? (
                <Text className="mt-0.5 text-[10px] text-amber-300/85">→ {c.actionRu}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
