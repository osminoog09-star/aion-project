import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { GlowCard } from "../components/ui/GlowCard";
import { GradientButton } from "../components/ui/GradientButton";
import { OperationsHubPortalCard } from "../components/operations/OperationsHubPortalCard";
import { useUpdates } from "../hooks/useUpdates";
import { useUpdateSystemState } from "../hooks/useUpdateSystemState";
import { useApkUpdates } from "../contexts/ApkUpdatesContext";
import { peekLastOtaCheckDebug } from "../services/updateService";
import { listAionTimeline, type AionTimelineEvent } from "../storage/core/aionTimelineStorage";
import { peekSyncQueue } from "../features/sync/services/offlineQueue";
import { getLastSyncFlushAt } from "../storage/core/syncDebugMeta";
import {
  getWhatsNewSeenOtaUpdateId,
  setWhatsNewSeenOtaUpdateId,
} from "../features/updates/storage/whatsNewAckStorage";
import { deriveRuntimeCompatibilityPanel } from "../services/runtimeCompatibility";
import { getApkManifestUrl } from "../lib/apkManifestUrl";
import { openApkDownload } from "../src/core/updates/openApkDownload";

const MANIFEST_CONFIGURED = Boolean(
  typeof process !== "undefined" && getApkManifestUrl().startsWith("http"),
);

function buildNumber(): string {
  if (Platform.OS === "android") {
    const vc = Constants.expoConfig?.android?.versionCode;
    return vc != null ? String(vc) : "—";
  }
  const bn = Constants.expoConfig?.ios?.buildNumber;
  return bn != null ? String(bn) : "—";
}

function formatTs(ms: number | null): string {
  if (ms == null) return "—";
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "—";
  }
}

export function UpdateCenterScreen() {
  const u = useUpdates();
  const engine = useUpdateSystemState();
  const apk = useApkUpdates();
  const [queueLen, setQueueLen] = useState(0);
  const [lastFlush, setLastFlush] = useState<number | null>(null);
  const [seenOta, setSeenOta] = useState<string | null>(null);
  const [showDiag, setShowDiag] = useState(false);

  const [timeline, setTimeline] = useState<AionTimelineEvent[]>([]);

  const refresh = useCallback(async () => {
    const [q, f, seen, tl] = await Promise.all([
      peekSyncQueue(),
      getLastSyncFlushAt(),
      getWhatsNewSeenOtaUpdateId(),
      listAionTimeline(32),
    ]);
    setQueueLen(q.length);
    setLastFlush(f);
    setSeenOta(seen);
    setTimeline(tl);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, u.phase, u.pendingUpdateId, engine.state]);

  const releaseTimeline = useMemo(
    () =>
      timeline.filter((e) =>
        [
          "ota_installed",
          "ota_updated",
          "ota_reload_scheduled",
          "apk_manifest_refresh",
          "module_updated",
        ].includes(e.type),
      ),
    [timeline],
  );

  const otaInstalledAt = Updates.createdAt != null ? Updates.createdAt.toISOString() : "—";
  const updateId = Updates.updateId ?? "—";
  const embedded = Updates.isEmbeddedLaunch;
  const emergency = Updates.isEmergencyLaunch;

  const whatsNewUnread = useMemo(() => {
    if (!Updates.isEnabled || __DEV__) return false;
    const cur = Updates.updateId;
    if (!cur) return false;
    if (!seenOta) return true;
    return seenOta !== cur;
  }, [seenOta]);

  const apkVerdict = useMemo(() => {
    if (!MANIFEST_CONFIGURED) {
      return {
        headline: "Манифест APK не подключён",
        detail:
          "Задайте EXPO_PUBLIC_APK_MANIFEST_URL на JSON (latestVersion, minimumSupported, apkUrl, runtimeVersion). Тогда приложение сравнит версию и runtime.",
        apkBlock: false,
      };
    }
    if (apk.loading && !apk.manifest) {
      return { headline: "Проверка манифеста APK…", detail: "", apkBlock: false };
    }
    if (!apk.manifest || !apk.evald) {
      return { headline: "Манифест APK недоступен", detail: "Проверьте сеть и URL.", apkBlock: false };
    }
    const { reason, critical } = apk.evald;
    if (reason === "none") {
      return {
        headline: "Полная сборка: актуально",
        detail: `Сервер: latest ${apk.manifest.latestVersion}, minimum ${apk.manifest.minimumSupported}.`,
        apkBlock: false,
      };
    }
    if (reason === "below_minimum") {
      return {
        headline: "Нужен новый APK",
        detail: `Версия приложения ниже minimumSupported (${apk.manifest.minimumSupported}). OTA не заменит нативный слой.`,
        apkBlock: true,
      };
    }
    if (reason === "newer_available") {
      return {
        headline: critical ? "Нужен новый APK (важно)" : "Доступна новая полная сборка",
        detail: `На сервере ${apk.manifest.latestVersion}. OTA обновляет только JS при совпадающем runtime.`,
        apkBlock: true,
      };
    }
    return {
      headline: "Несовпадение runtime",
      detail:
        "Установленный runtime не совпадает с манифестом — для выравнивания нужна полная сборка с нужным native/runtime.",
      apkBlock: true,
    };
  }, [apk.evald, apk.loading, apk.manifest]);

  const runtimeCompat = useMemo(
    () =>
      deriveRuntimeCompatibilityPanel({
        dev: __DEV__,
        otaEnabled: Boolean(Updates.isEnabled && !__DEV__),
        appVersion: Constants.expoConfig?.version ?? null,
        embeddedRuntimeVersion:
          Updates.runtimeVersion != null ? String(Updates.runtimeVersion) : null,
        manifestRuntimeVersion: apk.manifest?.runtimeVersion,
      }),
    [apk.manifest?.runtimeVersion],
  );

  const otaVerdict = useMemo(() => {
    if (__DEV__) {
      return {
        headline: "Режим разработки",
        detail: "OTA (expo-updates) в __DEV__ не применяется. Проверки — только в EAS-сборке.",
      };
    }
    if (!Updates.isEnabled) {
      return {
        headline: "OTA выключены",
        detail: "Сборка без expo-updates или отключено в конфигурации.",
      };
    }
    if (u.phase === "ready" || u.phase === "prompt") {
      return {
        headline: "Есть OTA-обновление",
        detail:
          "JS/UI можно обновить без нового APK, если runtime совпадает с каналом. Дальше — загрузка и перезапуск.",
      };
    }
    if (u.phase === "downloading") {
      return { headline: "Загружается OTA…", detail: "После загрузки потребуется перезапуск." };
    }
    if (u.phase === "error") {
      return { headline: "Ошибка OTA", detail: u.errorMessage ?? "Проверьте сеть и повторите." };
    }
    return {
      headline: "OTA: без ожидающих пакетов",
      detail: "Канал проверен; новых пакетов на сервере нет (или уже применено).",
    };
  }, [u.phase, u.errorMessage]);

  const updateTraffic = useMemo(() => {
    if (__DEV__) {
      return {
        emoji: "⚪",
        title: "Режим разработки",
        body: "OTA в __DEV__ не применяется — проверяйте обновления в релизной сборке.",
      };
    }
    if (apkVerdict.apkBlock) {
      return {
        emoji: "🔴",
        title: "Нужен новый APK",
        body: apkVerdict.detail || "Нативный слой, overlay или runtime требуют полной сборки.",
      };
    }
    if (u.phase === "ready" || u.phase === "prompt") {
      return {
        emoji: "🟡",
        title: "Доступно OTA-обновление",
        body: "Можно загрузить пакет JS/UI без нового APK при совпадении runtime.",
      };
    }
    return {
      emoji: "🟢",
      title: "Приложение актуально",
      body: "Нет ожидающих OTA; по манифесту APK критических требований нет.",
    };
  }, [apkVerdict.apkBlock, apkVerdict.detail, u.phase]);

  const lastDebug = peekLastOtaCheckDebug();

  const onAckWhatsNew = useCallback(async () => {
    const id = Updates.updateId;
    if (!id) return;
    await setWhatsNewSeenOtaUpdateId(id);
    setSeenOta(id);
  }, []);

  return (
    <CockpitBackground>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="mb-4 flex-row items-center justify-between pt-2">
            <Pressable onPress={() => router.back()} className="rounded-full border border-white/15 px-3 py-2">
              <Text className="text-sm text-slate-200">Назад</Text>
            </Pressable>
          </View>
          <Text className="text-[10px] uppercase tracking-[0.35em] text-cyan-400/90">Система</Text>
          <Text className="mt-1 text-2xl font-semibold text-white">Центр обновлений</Text>
          <Text className="mt-2 text-sm leading-5 text-slate-500">
            Все цифры — с устройства и expo-updates, без «оценочных» версий. OTA меняет JS при том же runtime; новый APK
            нужен при смене нативного слоя или несовпадении runtime.
          </Text>

          <GlowCard glow="neutral" className="mt-4 mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">Сводка</Text>
            <Text className="mt-2 text-xl font-semibold text-white">
              {updateTraffic.emoji} {updateTraffic.title}
            </Text>
            <Text className="mt-2 text-sm text-slate-400">{updateTraffic.body}</Text>
          </GlowCard>

          <View className="mt-4">
            <OperationsHubPortalCard
              otaChannel={typeof Updates.channel === "string" ? Updates.channel : null}
              apkHeadline={apkVerdict.headline}
            />
          </View>

          <GlowCard glow="violet" className="mt-6 mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">OTA vs APK / натив</Text>
            <Text className="mt-2 text-lg font-semibold text-white">{runtimeCompat.headline}</Text>
            {runtimeCompat.apkRequiredForRuntimeMismatch ? (
              <Text className="mt-2 text-sm text-amber-200/90">
                Несовпадение runtime: нужен APK с нужным native-слоем; OTA не заменит overlay, сервисы и manifest.
              </Text>
            ) : null}
            <View className="mt-3 gap-1.5">
              {runtimeCompat.bullets.map((b, i) => (
                <Text key={i} className="text-sm text-slate-400">
                  • {b}
                </Text>
              ))}
            </View>
          </GlowCard>

          <GlowCard glow="cyan" className="mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">Единый статус обновления</Text>
            <Text className="mt-2 text-lg font-semibold text-white">{engine.headline}</Text>
            <Text className="mt-2 text-sm text-slate-400">{engine.detail}</Text>
            <Text className="mt-3 font-mono text-[10px] text-slate-500">
              state={engine.state} · net={engine.netOnline ? "online" : "offline"} · ota={engine.otaPhase}
              {engine.badges.length ? ` · ${engine.badges.join(",")}` : ""}
            </Text>
            {apk.fromCache && apk.manifest ? (
              <Text className="mt-2 text-xs text-amber-300/90">Манифест APK из локального кэша (сеть недоступна).</Text>
            ) : null}
          </GlowCard>

          <GlowCard glow="cyan" className="mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">Установлено сейчас</Text>
            <Text className="mt-3 text-base text-slate-200">
              Версия приложения:{" "}
              <Text className="font-mono text-cyan-300">{Constants.expoConfig?.version ?? "—"}</Text>
            </Text>
            <Text className="mt-2 text-base text-slate-200">
              Build number: <Text className="font-mono text-cyan-300">{buildNumber()}</Text>
            </Text>
            <Text className="mt-2 text-base text-slate-200">
              Runtime:{" "}
              <Text className="font-mono text-cyan-300">
                {Updates.runtimeVersion != null ? String(Updates.runtimeVersion) : "—"}
              </Text>
            </Text>
            <Text className="mt-2 text-base text-slate-200">
              Канал OTA:{" "}
              <Text className="font-mono text-cyan-300">{(Updates.channel ?? "—").toString()}</Text>
            </Text>
            <Text className="mt-2 text-base text-slate-200">
              Текущий OTA updateId: <Text className="font-mono text-xs text-slate-300">{updateId}</Text>
            </Text>
            {__DEV__ ? (
              <>
                <Text className="mt-2 text-sm text-slate-500">
                  Встроенный запуск (без OTA): {embedded ? "да" : "нет"} · emergency: {emergency ? "да" : "нет"}
                </Text>
                <Text className="mt-2 text-sm text-slate-500">Время сборки текущего бандла (OTA): {otaInstalledAt}</Text>
              </>
            ) : null}
          </GlowCard>

          <GlowCard glow="violet" className="mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">Статус OTA</Text>
            <Text className="mt-3 text-lg font-semibold text-white">{otaVerdict.headline}</Text>
            <Text className="mt-2 text-sm text-slate-400">{otaVerdict.detail}</Text>
            <Text className="mt-3 text-sm text-slate-500">
              Фаза UI: <Text className="text-slate-300">{u.phase}</Text> · pendingUpdateId:{" "}
              <Text className="font-mono text-xs text-slate-400">{u.pendingUpdateId ?? "—"}</Text>
            </Text>
            <Text className="mt-2 text-sm text-slate-500">
              Последняя проверка сервера: {formatTs(u.lastOtaCheckAtMs)}
            </Text>
            <View className="mt-4 gap-2">
              <GradientButton title="Проверить обновления" variant="glass" onPress={() => u.checkNowForce()} />
              <GradientButton title="Открыть экран OTA" variant="ghost" onPress={() => router.push("/ota-debug" as Href)} />
            </View>
          </GlowCard>

          <GlowCard glow="neutral" className="mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">Полная сборка (APK)</Text>
            <Text className="mt-3 text-lg font-semibold text-white">{apkVerdict.headline}</Text>
            {apkVerdict.detail ? (
              <Text className="mt-2 text-sm text-slate-400">{apkVerdict.detail}</Text>
            ) : null}
            {apk.manifest ? (
              <View className="mt-3 border-t border-white/10 pt-3">
                <Text className="text-sm text-slate-400">
                  Сервер latest:{" "}
                  <Text className="font-mono text-slate-200">{apk.manifest.latestVersion}</Text>
                </Text>
                <Text className="mt-1 text-sm text-slate-400">
                  minimum:{" "}
                  <Text className="font-mono text-slate-200">{apk.manifest.minimumSupported}</Text>
                </Text>
                {apk.manifest.runtimeVersion ? (
                  <Text className="mt-1 text-sm text-slate-400">
                    runtime в манифесте:{" "}
                    <Text className="font-mono text-slate-200">{apk.manifest.runtimeVersion}</Text>
                  </Text>
                ) : null}
                {apk.manifest.releaseNotes ? (
                  <Text className="mt-2 text-sm text-slate-400">{apk.manifest.releaseNotes}</Text>
                ) : null}
                {apk.manifest.rolloutState ? (
                  <Text className="mt-1 text-xs text-slate-500">Rollout: {apk.manifest.rolloutState}</Text>
                ) : null}
                {apkVerdict.apkBlock && apk.manifest?.apkUrl ? (
                  <>
                    <GradientButton
                      title="Открыть ссылку на APK"
                      variant="glass"
                      className="mt-4"
                      onPress={() => {
                        const manifest = apk.manifest;
                        if (!manifest) return;
                        void openApkDownload(manifest).then((result) => {
                          if (!result.ok) {
                            Alert.alert(
                              "Не удалось открыть APK",
                              "Основная и резервная ссылки недоступны. Проверьте подключение и повторите позже.",
                            );
                          }
                        });
                      }}
                    />
                    <Text selectable className="mt-2 font-mono text-xs text-slate-500">
                      {apk.manifest?.apkUrl}
                    </Text>
                  </>
                ) : null}
              </View>
            ) : null}
            <GradientButton
              title={apk.loading ? "Проверяю манифест…" : "Обновить проверку манифеста"}
              variant="ghost"
              className="mt-3"
              loading={apk.loading}
              disabled={apk.loading}
              onPress={() => void apk.refresh()}
            />
          </GlowCard>

          <GlowCard glow="cyan" className="mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">Синхронизация</Text>
            <Text className="mt-3 text-sm text-slate-300">Очередь: {queueLen}</Text>
            <Text className="mt-1 text-sm text-slate-500">Последний flush: {formatTs(lastFlush)}</Text>
          </GlowCard>

          <GlowCard glow="violet" className="mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">What&apos;s New (OTA)</Text>
            {u.manifestSummary ? (
              <>
                <Text className="mt-2 text-sm text-slate-400">{u.manifestSummary.releaseMessage ?? u.releaseNotes}</Text>
                {u.manifestSummary.newFeatures?.length ? (
                  <Text className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-400/90">Новое</Text>
                ) : null}
                {u.manifestSummary.newFeatures?.map((x) => (
                  <Text key={x} className="mt-1 text-sm text-slate-300">
                    • {x}
                  </Text>
                ))}
                {u.manifestSummary.bugFixes?.length ? (
                  <Text className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-400/90">Фиксы</Text>
                ) : null}
                {u.manifestSummary.bugFixes?.map((x) => (
                  <Text key={x} className="mt-1 text-sm text-slate-300">
                    • {x}
                  </Text>
                ))}
              </>
            ) : (
              <Text className="mt-2 text-sm text-slate-500">
                Сообщение появится после успешной проверки OTA с манифестом (или откройте загрузку из баннера).
              </Text>
            )}
            {whatsNewUnread ? (
              <Text className="mt-3 text-xs text-amber-300/90">Есть непросмотренное применённое обновление (OTA id изменился).</Text>
            ) : (
              <Text className="mt-3 text-xs text-slate-600">Просмотрено для текущего updateId.</Text>
            )}
            <GradientButton
              title="Понятно, отметить просмотренным"
              variant="glass"
              className="mt-4"
              onPress={() => void onAckWhatsNew()}
            />
          </GlowCard>

          <GlowCard glow="neutral" className="mb-8">
            <Text className="text-xs uppercase tracking-widest text-slate-500">Лента релизов (локально)</Text>
            {releaseTimeline.length === 0 ? (
              <Text className="mt-2 text-sm text-slate-600">События OTA/APK появятся после операций на устройстве.</Text>
            ) : (
              <View className="mt-3 gap-2">
                {releaseTimeline.map((e) => (
                  <View key={e.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                    <Text className="text-[10px] uppercase tracking-wider text-slate-500">
                      {e.type} · {formatTs(e.at)}
                    </Text>
                    <Text className="mt-1 text-sm font-medium text-slate-200">{e.title}</Text>
                    {e.detail ? <Text className="mt-1 text-xs text-slate-500">{e.detail}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </GlowCard>

          {__DEV__ ? (
          <GlowCard glow="neutral" className="mb-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs uppercase tracking-widest text-slate-500">Диагностика последней проверки</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-slate-500">Показать JSON</Text>
                <Switch value={showDiag} onValueChange={setShowDiag} />
              </View>
            </View>
            {showDiag && lastDebug ? (
              <Text selectable className="mt-3 font-mono text-[10px] leading-4 text-slate-500">
                {lastDebug.json}
              </Text>
            ) : (
              <Text className="mt-2 text-sm text-slate-600">{showDiag ? "Нет данных (ещё не было проверки)." : null}</Text>
            )}
          </GlowCard>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </CockpitBackground>
  );
}
