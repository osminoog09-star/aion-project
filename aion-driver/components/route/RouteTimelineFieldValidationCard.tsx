import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
  formatFieldValidationBlockersRu,
  formatFieldValidationReportRu,
  getNextFieldValidationActionRu,
  getFieldValidationTier,
  isFieldValidationProductionGateEnabled,
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

  const gateOn = isFieldValidationProductionGateEnabled();
  const blockers =
    gateOn && !validation.ready ? formatFieldValidationBlockersRu(validation) : "";
  const bgGate = backgroundTrackingProductionGate(validation.ready);
  const tier = getFieldValidationTier(validation);
  const showOtaSmoke = gateOn ? validation.ready : true;
  const nextAction = getNextFieldValidationActionRu(validation);

  const copyReport = useCallback(async () => {
    await Clipboard.setStringAsync(formatFieldValidationReportRu(validation));
    Alert.alert(
      "Отчёт скопирован",
      gateOn && validation.ready
        ? "8/8 — можно отправить в чат и запускать OTA smoke"
        : `Чеклист ${validation.passedCount}/${validation.totalCount} (информационно)`,
    );
  }, [validation]);

  const border =
    gateOn && validation.ready
      ? "border-emerald-500/35 bg-emerald-500/8"
      : "border-slate-500/25 bg-slate-500/5";

  return (
    <View className={`mx-4 mb-3 rounded-xl border px-3 py-3 ${border}`}>
      <Text className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90">
        проверка на устройстве
        {loading ? " · загрузка…" : ""}
      </Text>
      <Text className="mt-0.5 text-[10px] text-slate-500">
        APK {getInstalledAppVersion()} · rv {getInstalledRuntimeVersion()}
      </Text>
      <Text className="mt-1 text-sm font-medium text-white">
        {gateOn && validation.ready
          ? "✓ 8/8 — production gate"
          : tier === "core_ready"
            ? `База ${validation.passedCount}/${validation.totalCount}${gateOn ? " · до 8/8 для gate" : ""}`
            : `Прогресс: ${validation.passedCount}/${validation.totalCount}`}
        {validation.coveragePercent != null
          ? ` · покрытие ${validation.coveragePercent}%`
          : ""}
      </Text>
      {!gateOn || !validation.ready ? (
        <Text className="mt-2 text-[10px] leading-4 text-slate-500">
          {gateOn
            ? tier === "core_ready"
              ? "8/8 нужен только для production gate. Остальное — по мере смен."
              : "Потяните вниз для обновления · FGS обновляется каждые 30 сек"
            : "Режим без gate: чеклист для диагностики. Полный 8/8 включим позже."}
        </Text>
      ) : null}
      {blockers ? (
        <Text className="mt-2 text-[10px] leading-4 text-amber-200/75">{blockers}</Text>
      ) : null}
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
        {showOtaSmoke ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/ota-debug", params: { fromValidation: "1" } })
            }
            className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5"
          >
            <Text className="text-[10px] font-semibold text-cyan-200">OTA / обновления →</Text>
          </Pressable>
        ) : null}
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
