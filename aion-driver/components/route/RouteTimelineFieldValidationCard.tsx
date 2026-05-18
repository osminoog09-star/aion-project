import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
  formatFieldValidationBlockersRu,
  formatFieldValidationReportRu,
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

  const blockers = !validation.ready ? formatFieldValidationBlockersRu(validation) : "";
  const bgGate = backgroundTrackingProductionGate(validation.ready);
  const tier = getFieldValidationTier(validation);

  const copyReport = useCallback(async () => {
    await Clipboard.setStringAsync(formatFieldValidationReportRu(validation));
    Alert.alert(
      "Отчёт скопирован",
      validation.ready
        ? "8/8 — можно отправить в чат и запускать OTA smoke"
        : `Сейчас ${validation.passedCount}/${validation.totalCount} — доведите чеклист`,
    );
  }, [validation]);

  const border = validation.ready
    ? "border-emerald-500/35 bg-emerald-500/8"
    : "border-amber-500/30 bg-amber-500/6";

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
        {validation.ready
          ? "✓ 8/8 — можно OTA smoke test"
          : tier === "core_ready"
            ? `База готова ${validation.passedCount}/${validation.totalCount} · 8/8 только для production gate`
            : `Чеклист: ${validation.passedCount}/${validation.totalCount}`}
        {validation.coveragePercent != null
          ? ` · покрытие ${validation.coveragePercent}%`
          : ""}
      </Text>
      {!validation.ready ? (
        <Text className="mt-2 text-[10px] leading-4 text-slate-500">
          {tier === "core_ready"
            ? "Приложением уже можно пользоваться. 8/8 — не обязательно каждый день: это gate для фона (FGS) и OTA signoff. Остальное — по мере реальных смен."
            : "Потяните вниз для обновления · FGS обновляется каждые 30 сек на этом экране"}
        </Text>
      ) : null}
      {blockers ? (
        <Text className="mt-2 text-[10px] leading-4 text-amber-200/75">{blockers}</Text>
      ) : null}
      {validation.ready ? (
        <Text className="mt-2 text-[10px] leading-4 text-slate-400">
          Фон (production): {bgGate.reasonRu}
        </Text>
      ) : null}
      <View className="mt-2 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => void copyReport()}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
        >
          <Text className="text-[10px] font-semibold text-cyan-300">Скопировать отчёт</Text>
        </Pressable>
        {validation.ready ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/ota-debug", params: { fromValidation: "1" } })
            }
            className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5"
          >
            <Text className="text-[10px] font-semibold text-emerald-200">OTA smoke →</Text>
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
