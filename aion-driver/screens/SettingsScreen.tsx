import { router, useFocusEffect, type Href } from "expo-router";
import Constants from "expo-constants";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { GlowCard } from "../components/ui/GlowCard";
import { GradientButton } from "../components/ui/GradientButton";
import { useAuth } from "../features/auth/hooks/useAuth";
import { BugReportModal } from "../features/feedback/BugReportModal";
import { syncLocalUserProfileToCloud } from "../features/cloud/repositories/profileRepository";
import { enqueueSyncOperation, peekSyncQueue } from "../features/sync/services/offlineQueue";
import { flushSyncQueue } from "../features/sync/services/syncEngine";
import { useTheme } from "../contexts/ThemeContext";
import type { MotionIntensity, VisualStyleId } from "../src/theme";
import { VISUAL_STYLE_IDS } from "../src/theme";
import { useDevice } from "../hooks/useDevice";
import { useShift } from "../hooks/useShift";
import { AppConfirmModal } from "../components/feedback/AppConfirmModal";
import { isSupabaseConfigured, requireSupabase } from "../lib/supabase";
import { featureFlags } from "../lib/featureFlags";
import { useUpdates } from "../hooks/useUpdates";
import { getOtaDebugInfo, manualOtaCheckForSettings } from "../services/updateService";
import { APP_CURRENCIES, getCurrencySymbol } from "../core/constants/currencies";
import { GPS_INTERVAL_PRESETS_MS } from "../types/device";
import type { AppCurrencyCode } from "../types/device";
import type { UserProfile } from "../types";
import type { RentalPeriod } from "../types/rental";

export function SettingsScreen() {
  const { session, isGuest } = useAuth();
  const {
    settings,
    setCompanionMode,
    setAionLinkMode,
    setBatteryOptimization,
    setGpsUpdateIntervalMs,
    setNightContrast,
    updateSettings,
  } = useDevice();
  const { profile, saveUserProfile, activeShift, resetStatistics } = useShift();
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [name, setName] = useState("");
  const [carModel, setCarModel] = useState("");
  const [petrolConsumption, setPetrolConsumption] = useState("");
  const [petrolPrice, setPetrolPrice] = useState("");
  const [gasConsumption, setGasConsumption] = useState("");
  const [gasPrice, setGasPrice] = useState("");
  const [rentalEnabled, setRentalEnabled] = useState(false);
  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>("day");
  const [rentalAmount, setRentalAmount] = useState("");
  const [rentalDeposit, setRentalDeposit] = useState("");
  const [fixedOpsPerDay, setFixedOpsPerDay] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncQueueLen, setSyncQueueLen] = useState(0);
  const [syncBusy, setSyncBusy] = useState(false);
  const [otaBusy, setOtaBusy] = useState(false);
  const [otaDialog, setOtaDialog] = useState<string | null>(null);
  const [bugOpen, setBugOpen] = useState(false);
  const [secretTap, setSecretTap] = useState(0);
  const [resetStatsOpen, setResetStatsOpen] = useState(false);
  const [resetCloudToo, setResetCloudToo] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const otaInfo = getOtaDebugInfo();
  const updates = useUpdates();
  const theme = useTheme();

  const visualStyleLabels: Record<VisualStyleId, string> = {
    core_dev: "Core / Dev",
    cyberpunk: "Киберпанк",
    neo_lux: "Neo Lux",
    minimal_light: "Минимализм",
    midnight_pro: "Полночь",
    synthwave: "Синтвейв",
  };

  const motionLabels: Record<MotionIntensity, string> = {
    subtle: "Сдержанно",
    cinematic: "Кино",
    energetic: "Энергично",
  };

  const filteredCurrencies = useMemo(() => {
    const q = currencyQuery.trim().toUpperCase();
    if (!q) return APP_CURRENCIES.slice(0, 48);
    return APP_CURRENCIES.filter((c) => c.includes(q)).slice(0, 64);
  }, [currencyQuery]);

  const onPickCurrency = useCallback(
    async (code: AppCurrencyCode) => {
      await updateSettings({ currencyCode: code, fuelRegionAuto: false });
      if (profile) {
        await saveUserProfile({ ...profile, currencyCode: code });
      }
      setCurrencyModalOpen(false);
      setCurrencyQuery("");
    },
    [profile, saveUserProfile, updateSettings],
  );

  const refreshSyncQueue = useCallback(async () => {
    const q = await peekSyncQueue();
    setSyncQueueLen(q.length);
  }, []);

  const runSyncNow = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid || isGuest || !isSupabaseConfigured()) {
      await refreshSyncQueue();
      return;
    }
    setSyncBusy(true);
    try {
      await flushSyncQueue(uid);
    } finally {
      await refreshSyncQueue();
      setSyncBusy(false);
    }
  }, [session?.user?.id, isGuest, refreshSyncQueue]);

  useFocusEffect(
    useCallback(() => {
      void refreshSyncQueue();
      const id = setInterval(() => void refreshSyncQueue(), 5000);
      return () => clearInterval(id);
    }, [refreshSyncQueue]),
  );

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setCarModel(profile.carModel);
    setPetrolConsumption(String(profile.petrolConsumptionLPer100Km));
    setPetrolPrice(String(profile.petrolPricePerLiter));
    setGasConsumption(String(profile.gasConsumptionLPer100Km));
    setGasPrice(String(profile.gasPricePerLiter));
    const r = profile.rentalEconomics;
    setRentalEnabled(Boolean(r?.enabled));
    setRentalPeriod(r?.period ?? "day");
    setRentalAmount(r?.amount != null ? String(r.amount) : "");
    setRentalDeposit(r?.depositAmount != null ? String(r.depositAmount) : "");
    setFixedOpsPerDay(r?.fixedOpsPerDay != null ? String(r.fixedOpsPerDay) : "");
  }, [profile]);

  const onManualOta = async () => {
    setOtaBusy(true);
    const r = await manualOtaCheckForSettings();
    setOtaBusy(false);
    if (r.kind === "dev") {
      setOtaDialog("OTA доступны только в production-сборке (EAS Build), не в режиме разработки.");
      return;
    }
    if (r.kind === "disabled") {
      setOtaDialog("Обновления отключены в этой сборке.");
      return;
    }
    if (r.kind === "no_update") {
      setOtaDialog("Уже последняя версия на канале. Новых OTA нет.");
      return;
    }
    if (r.kind === "network") {
      setOtaDialog(`Сеть: ${r.message}`);
      return;
    }
    if (r.kind === "error") {
      setOtaDialog(r.message);
      return;
    }
    if (r.kind === "available") {
      const s = r.summary;
      const parts = [
        "Найдено обновление на сервере.",
        s.runtimeVersion ? `Runtime: ${s.runtimeVersion}` : null,
        s.updateId ? `Update: ${s.updateId.slice(0, 12)}…` : null,
        s.commitHash ? `Commit: ${s.commitHash}` : null,
        s.releaseMessage ? `\n${s.releaseMessage}` : null,
        "\nГлобальный экран OTA откроется при следующей фоновой проверке, либо перезапустите приложение.",
      ];
      setOtaDialog(parts.filter(Boolean).join("\n"));
    }
  };

  const parseNum = (s: string) => parseFloat(s.replace(",", "."));

  const onSaveProfile = async () => {
    const pc = parseNum(petrolConsumption);
    const pp = parseNum(petrolPrice);
    const gc = parseNum(gasConsumption);
    const gp = parseNum(gasPrice);
    if (!profile || !name.trim() || !carModel.trim()) return;
    if (
      !Number.isFinite(pc) ||
      pc <= 0 ||
      !Number.isFinite(pp) ||
      pp <= 0 ||
      !Number.isFinite(gc) ||
      gc <= 0 ||
      !Number.isFinite(gp) ||
      gp <= 0
    ) {
      return;
    }
    const ra = parseNum(rentalAmount);
    const rd = rentalDeposit.trim() ? parseNum(rentalDeposit) : undefined;
    const fo = fixedOpsPerDay.trim() ? parseNum(fixedOpsPerDay) : undefined;
    const rentalEconomics =
      rentalEnabled && Number.isFinite(ra) && ra >= 0
        ? {
            enabled: true,
            period: rentalPeriod,
            amount: ra,
            depositAmount:
              rd != null && Number.isFinite(rd) && rd >= 0 ? rd : undefined,
            fixedOpsPerDay:
              fo != null && Number.isFinite(fo) && fo >= 0 ? fo : undefined,
          }
        : { enabled: false, period: rentalPeriod, amount: 0 };
    const next: UserProfile = {
      name: name.trim(),
      carModel: carModel.trim(),
      petrolConsumptionLPer100Km: pc,
      petrolPricePerLiter: pp,
      gasConsumptionLPer100Km: gc,
      gasPricePerLiter: gp,
      rentalEconomics,
    };
    setSaving(true);
    await saveUserProfile(next);
    const uid = session?.user?.id;
    if (uid && isSupabaseConfigured()) {
      try {
        await syncLocalUserProfileToCloud(requireSupabase(), uid, next);
      } catch {
        await enqueueSyncOperation({
          type: "profile_upsert",
          payload: next,
        });
      }
    }
    setSaving(false);
  };

  if (!profile) return null;

  const profileValid =
    name.trim() &&
    carModel.trim() &&
    parseNum(petrolConsumption) > 0 &&
    parseNum(petrolPrice) > 0 &&
    parseNum(gasConsumption) > 0 &&
    parseNum(gasPrice) > 0;

  return (
    <CockpitBackground
      variant={settings.nightContrast === "nightDrive" ? "nightDrive" : "cockpit"}
    >
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.duration(400)}>
              <View className="mb-5 flex-row items-center justify-between pt-2">
                <Text className="text-3xl font-semibold text-white">Настройки</Text>
                <GradientButton
                  title="Назад"
                  variant="ghost"
                  onPress={() => router.back()}
                  className="px-2"
                />
              </View>
            </Animated.View>

            <GlowCard glow="violet" className="mb-4" onPress={() => router.push("/home")}>
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">Экосистема</Text>
              <Text className="mt-2 text-base font-semibold text-slate-100">AION Home</Text>
              <Text className="mt-1 text-sm text-slate-400">
                Модули Driver, Finance, AI и др. Откройте лаунчер платформы.
              </Text>
            </GlowCard>

            <GlowCard glow="cyan" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Облако AION
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                {session?.user?.email
                  ? `Вход: ${session.user.email}. Профиль, настройки и смены копируются на сервер — при переустановке APK войдите снова.`
                  : "Гость — данные только на телефоне. Зарегистрируйтесь, чтобы сохранить всё в облаке."}
              </Text>
              <Text className="mt-2 text-xs text-slate-500">
                Регион {settings.regionCountryCode} · {settings.currencyCode} (
                {getCurrencySymbol(settings.currencyCode)})
                {settings.fuelRegionAuto ? " · авто из локали" : ""}
              </Text>
              <GradientButton
                title={`Валюта: ${settings.currencyCode} (${getCurrencySymbol(settings.currencyCode)})`}
                variant="ghost"
                className="mt-3"
                onPress={() => setCurrencyModalOpen(true)}
              />
              <GradientButton
                title={session ? "Управление аккаунтом" : "Войти / зарегистрироваться"}
                variant="glass"
                className="mt-4"
                onPress={() => router.push("/(auth)/login")}
              />
            </GlowCard>

            <GlowCard glow="neutral" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Синхронизация
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Очередь офлайн-операций:{" "}
                <Text className="font-semibold text-cyan-200">{syncQueueLen}</Text>
                {syncQueueLen > 0
                  ? session && !isGuest
                    ? " — смены и профиль ждут отправки в облако."
                    : " — войдите в аккаунт, чтобы отправить."
                  : " — всё синхронизировано."}
              </Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                <GradientButton
                  title={syncBusy ? "Синхронизация…" : "Синхронизировать сейчас"}
                  variant="glass"
                  className="min-w-[48%] flex-1"
                  loading={syncBusy}
                  disabled={syncBusy || !session || isGuest || syncQueueLen === 0}
                  onPress={() => void runSyncNow()}
                />
                <GradientButton
                  title="Обновить статус"
                  variant="ghost"
                  className="min-w-[48%] flex-1"
                  onPress={() => void refreshSyncQueue()}
                />
              </View>
            </GlowCard>

            <GlowCard glow="neutral" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">AION Core</Text>
              <Text className="mt-2 text-sm text-slate-400">
                Снимок сети, OTA, очереди синка и лента событий — для поддержки и power users.
              </Text>
              <GradientButton
                title="Диагностика Core"
                variant="glass"
                className="mt-4"
                onPress={() => router.push("/aion-diagnostics")}
              />
            </GlowCard>

            <GlowCard glow="violet" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Центр обновлений
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Версия, build, runtime, канал OTA, манифест APK, очередь синка и What&apos;s New — в одном месте, без догадок.
              </Text>
              <GradientButton
                title="Открыть центр обновлений"
                variant="glass"
                className="mt-4"
                onPress={() => router.push("/update-center" as Href)}
              />
            </GlowCard>

            <GlowCard glow="cyan" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                OTA (Expo Updates)
              </Text>
              <Pressable
                onPress={() => {
                  const n = secretTap + 1;
                  setSecretTap(n);
                  if (n >= 7) {
                    setSecretTap(0);
                    router.push("/debug");
                  }
                }}
              >
                <Text className="mt-2 text-xs text-slate-500">
                  Версия приложения: {Constants.expoConfig?.version ?? "—"}
                  {featureFlags.debugMenu ? (
                    <Text className="text-slate-600"> (тап ×7 — отладка)</Text>
                  ) : null}
                </Text>
              </Pressable>
              <Text className="mt-1 text-xs text-slate-500">
                Runtime: {otaInfo.runtimeVersion ?? "—"} · Канал: {otaInfo.channel ?? "—"}
              </Text>
              <Text className="mt-1 text-xs text-slate-500" selectable>
                Update ID: {otaInfo.updateId ?? "—"}
              </Text>
              <Text className="mt-1 text-xs text-slate-600">
                Фоновые проверки: старт, resume, сеть, каждые 4 ч.
              </Text>
              <Text className="mt-2 text-xs text-slate-600">
                Статус гейта: {updates.updateStatus}
                {updates.releaseNotes ? ` · ${updates.releaseNotes.slice(0, 48)}…` : ""}
              </Text>
              <GradientButton
                title="Проверить OTA (глобальная модалка)"
                variant="glass"
                className="mt-3"
                onPress={() => updates.checkNow()}
              />
              <GradientButton
                title="Подробный статус (текст)"
                variant="ghost"
                className="mt-2"
                loading={otaBusy}
                onPress={() => void onManualOta()}
              />
              <GradientButton
                title="Панель OTA testing"
                variant="ghost"
                className="mt-2"
                onPress={() => router.push("/ota-debug")}
              />
            </GlowCard>

            <GlowCard glow="violet" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Поддержка
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Отчёт с версией ОС, OTA и размером очереди синка — в один тап.
              </Text>
              <GradientButton
                title="Сообщить о проблеме"
                variant="glass"
                className="mt-4"
                onPress={() => setBugOpen(true)}
              />
            </GlowCard>

            {featureFlags.debugMenu ? (
              <GlowCard glow="neutral" className="mb-4">
                <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">Beta</Text>
                <Text className="mt-2 text-sm text-slate-400">
                  Карта OSM, сброс данных, тест Sentry — экран отладки.
                </Text>
                <GradientButton
                  title="Открыть отладку"
                  variant="glass"
                  className="mt-4"
                  onPress={() => router.push("/debug")}
                />
              </GlowCard>
            ) : null}

            <GlowCard glow="cyan" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Второй телефон
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Режим напарника: крупные кнопки, быстрые действия, вкладка «История» скрыта.
              </Text>
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-base text-white">Режим напарника</Text>
                <Switch
                  value={settings.companionMode}
                  onValueChange={(v) => void setCompanionMode(v)}
                  trackColor={{ false: "#334155", true: "#0891b2" }}
                  thumbColor="#f8fafc"
                />
              </View>
            </GlowCard>

            <GlowCard glow="violet" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                AION Link
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Режим рабочего телефона: короткий экран, синхронизация, импорт скриншотов без лишнего
                интерфейса.
              </Text>
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-base text-white">Режим Link</Text>
                <Switch
                  value={settings.aionLinkMode}
                  onValueChange={(v) => void setAionLinkMode(v)}
                  trackColor={{ false: "#334155", true: "#7c3aed" }}
                  thumbColor="#f8fafc"
                />
              </View>
              {settings.aionLinkMode ? (
                <GradientButton
                  title="Открыть экран Link"
                  variant="glass"
                  className="mt-4"
                  onPress={() => router.push("/link" as Href)}
                />
              ) : null}
            </GlowCard>

            <GlowCard glow="violet" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Батарея и GPS
              </Text>
              <View className="mt-4 flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base text-white">Экономия батареи</Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    Реже опрос GPS в простое + адаптивные интервалы
                  </Text>
                </View>
                <Switch
                  value={settings.batteryOptimization}
                  onValueChange={(v) => void setBatteryOptimization(v)}
                  trackColor={{ false: "#334155", true: "#7c3aed" }}
                  thumbColor="#f8fafc"
                />
              </View>

              <Text className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-500">
                Интервал GPS (мс), в движении
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {GPS_INTERVAL_PRESETS_MS.map((ms) => (
                  <Pressable
                    key={ms}
                    onPress={() => void setGpsUpdateIntervalMs(ms)}
                    className={`rounded-xl border px-3 py-2 ${
                      settings.gpsUpdateIntervalMs === ms
                        ? "border-cyan-400/60 bg-cyan-500/20"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <Text className="text-sm font-medium text-slate-200">
                      {ms / 1000}s
                    </Text>
                  </Pressable>
                ))}
              </View>
            </GlowCard>

            {Platform.OS === "android" ? (
              <GlowCard glow="violet" className="mb-4">
                <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Орбита поверх приложений
                </Text>
                <Text className="mt-2 text-sm text-slate-400">
                  Нативный слой TYPE_APPLICATION_OVERLAY: орбита при активной смене (перетаскивание, тап —
                  открыть AION). Требует разрешения «поверх других». OEM и батарея влияют на стабильность.
                </Text>
                <View className="mt-4 flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base text-white">Показывать орбиту</Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      Только при активной смене и выданном разрешении
                    </Text>
                  </View>
                  <Switch
                    value={settings.androidOverlayOrbEnabled}
                    onValueChange={(v) => void updateSettings({ androidOverlayOrbEnabled: v })}
                    trackColor={{ false: "#334155", true: "#7c3aed" }}
                    thumbColor="#f8fafc"
                  />
                </View>
                <GradientButton
                  title="Открыть настройки «Поверх других»"
                  variant="glass"
                  className="mt-4"
                  onPress={() =>
                    void import("../services/androidOverlayRuntime").then((m) =>
                      m.openAndroidOverlayPermissionSettings(),
                    )
                  }
                />
              </GlowCard>
            ) : null}

            <GlowCard glow="cyan" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Тема интерфейса
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Светлая / тёмная / как в системе — фон корня и статус-бар.
              </Text>
              <View className="mt-4 flex-row gap-2">
                {(
                  [
                    ["system", "Авто"],
                    ["light", "Светлая"],
                    ["dark", "Тёмная"],
                  ] as const
                ).map(([id, label]) => (
                  <Pressable
                    key={id}
                    onPress={() => theme.setPreference(id)}
                    className={`flex-1 rounded-xl border py-3 ${
                      theme.preference === id
                        ? "border-cyan-400/50 bg-cyan-500/15"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <Text className="text-center text-sm font-semibold text-white">
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </GlowCard>

            <GlowCard glow="violet" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Визуальный стиль
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Темы AION: цвета, свечение, фон кабины и карта. Сохраняется на устройстве; позже — в облачном
                профиле.
              </Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {VISUAL_STYLE_IDS.map((id) => (
                  <Pressable
                    key={id}
                    onPress={() => theme.setVisualStyle(id)}
                    className={`min-w-[48%] flex-1 rounded-xl border py-2.5 ${
                      theme.visualStyle === id
                        ? "border-violet-400/55 bg-violet-500/18"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <Text className="text-center text-xs font-semibold text-white" numberOfLines={2}>
                      {visualStyleLabels[id]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-500">
                Интенсивность анимаций
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Системное «уменьшить движение» отключает тяжёлые эффекты автоматически.
              </Text>
              <View className="mt-3 flex-row gap-2">
                {(["subtle", "cinematic", "energetic"] as const).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => theme.setMotionIntensity(m)}
                    className={`flex-1 rounded-xl border py-2.5 ${
                      theme.motionIntensity === m
                        ? "border-cyan-400/50 bg-cyan-500/15"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <Text className="text-center text-xs font-semibold text-white">{motionLabels[m]}</Text>
                  </Pressable>
                ))}
              </View>
            </GlowCard>

            <GlowCard glow="neutral" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Экран ночью
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Night Drive — ниже яркость неоновых акцентов.
              </Text>
              <View className="mt-4 flex-row gap-2">
                <Pressable
                  onPress={() => void setNightContrast("standard")}
                  className={`flex-1 rounded-xl border py-3 ${
                    settings.nightContrast === "standard"
                      ? "border-cyan-400/50 bg-cyan-500/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <Text className="text-center text-sm font-semibold text-white">
                    Стандарт
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void setNightContrast("nightDrive")}
                  className={`flex-1 rounded-xl border py-3 ${
                    settings.nightContrast === "nightDrive"
                      ? "border-violet-400/50 bg-violet-500/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <Text className="text-center text-sm font-semibold text-white">
                    Night Drive
                  </Text>
                </Pressable>
              </View>
            </GlowCard>

            <GlowCard glow="cyan" className="mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs uppercase tracking-[0.28em] text-cyan-200/90">
                  Аренда и расходы
                </Text>
                <Switch value={rentalEnabled} onValueChange={setRentalEnabled} />
              </View>
              <Text className="mt-2 text-sm text-slate-400">
                Пропорциональное начисление за смену: день / неделя / месяц + фикс. в день.
              </Text>
              <View className="mt-4 flex-row gap-2">
                {(["day", "week", "month"] as RentalPeriod[]).map((p) => (
                  <Pressable
                    key={p}
                    disabled={!rentalEnabled}
                    onPress={() => setRentalPeriod(p)}
                    className={`flex-1 rounded-xl border py-2 ${
                      rentalPeriod === p
                        ? "border-cyan-400/50 bg-cyan-500/15"
                        : "border-white/10 bg-white/5 opacity-80"
                    }`}
                  >
                    <Text className="text-center text-xs font-semibold text-white">
                      {p === "day" ? "День" : p === "week" ? "Неделя" : "Месяц"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Field
                label="Сумма аренды за период"
                value={rentalAmount}
                onChangeText={setRentalAmount}
                keyboardType="decimal-pad"
                className="mt-4"
              />
              <Field
                label="Залог (учёт, не в прибыль)"
                value={rentalDeposit}
                onChangeText={setRentalDeposit}
                keyboardType="decimal-pad"
                className="mt-4"
              />
              <Field
                label="Фикс. расходы / день (парковка и т.п.)"
                value={fixedOpsPerDay}
                onChangeText={setFixedOpsPerDay}
                keyboardType="decimal-pad"
                className="mt-4"
              />
            </GlowCard>

            <GlowCard glow="neutral" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Статистика и история
              </Text>
              <Text className="mt-2 text-sm text-slate-400">
                Управление по блокам: смены за день/неделю/месяц, GPS, чеки, облако, отдельные смены.
                Чтобы поправить цифры одной смены (доход, топливо, км), откройте «Исправить» в этом
                экране или тап по смене в «История». Профиль и настройки не меняются.
              </Text>
              {resetResult ? (
                <Text className="mt-2 text-xs text-cyan-300">{resetResult}</Text>
              ) : null}
              <GradientButton
                title="Открыть управление статистикой"
                variant="glass"
                className="mt-4"
                onPress={() => router.push("/statistics-manage")}
              />
              {session?.user?.id && !isGuest && isSupabaseConfigured() ? (
                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="flex-1 pr-3 text-sm text-slate-300">
                    Быстрый сброс: также облако
                  </Text>
                  <Switch
                    value={resetCloudToo}
                    onValueChange={setResetCloudToo}
                    trackColor={{ false: "#334155", true: "#f43f5e" }}
                    thumbColor="#f8fafc"
                  />
                </View>
              ) : null}
              <GradientButton
                title="Сбросить всё локально"
                variant="ghost"
                className="mt-3"
                disabled={Boolean(activeShift) || resetBusy}
                loading={resetBusy}
                onPress={() => setResetStatsOpen(true)}
              />
              {activeShift ? (
                <Text className="mt-2 text-xs text-amber-300">
                  Активная смена: полный сброс недоступен — завершите смену или сбросьте в
                  управлении статистикой.
                </Text>
              ) : null}
            </GlowCard>

            <GlowCard glow="violet" className="mb-4">
              <Text className="text-xs uppercase tracking-[0.28em] text-amber-200/90">
                Бензин
              </Text>
              <Field
                label="Расход, л / 100 км"
                value={petrolConsumption}
                onChangeText={setPetrolConsumption}
                keyboardType="decimal-pad"
                className="mt-2"
              />
              <Field
                label={`Цена, ${getCurrencySymbol(settings.currencyCode)} / л`}
                value={petrolPrice}
                onChangeText={setPetrolPrice}
                keyboardType="decimal-pad"
                className="mt-4"
              />
              <Text className="mt-6 text-xs uppercase tracking-[0.28em] text-emerald-200/90">
                Газ (LPG / CNG)
              </Text>
              <Field
                label="Расход, л-экв. / 100 км"
                value={gasConsumption}
                onChangeText={setGasConsumption}
                keyboardType="decimal-pad"
                className="mt-2"
              />
              <Field
                label={`Цена, ${getCurrencySymbol(settings.currencyCode)} / л-экв.`}
                value={gasPrice}
                onChangeText={setGasPrice}
                keyboardType="decimal-pad"
                className="mt-4"
              />
              <Field label="Имя" value={name} onChangeText={setName} className="mt-6" />
              <Field
                label="Модель авто"
                value={carModel}
                onChangeText={setCarModel}
                className="mt-4"
              />
            </GlowCard>

            <GradientButton
              title="Сохранить профиль"
              onPress={onSaveProfile}
              loading={saving}
              disabled={saving || !profileValid}
              size="cockpit"
              className="mt-2"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal visible={currencyModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="max-h-[85%] rounded-t-3xl border border-white/10 bg-slate-950 px-4 pb-8 pt-5">
            <Text className="text-lg font-semibold text-white">Валюта отображения</Text>
            <Text className="mt-1 text-sm text-slate-400">
              Все суммы в приложении — в выбранной валюте (доход, заправка, аналитика).
            </Text>
            <TextInput
              value={currencyQuery}
              onChangeText={setCurrencyQuery}
              placeholder="Поиск ISO…"
              placeholderTextColor="#64748b"
              className="mt-4 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base text-white"
            />
            <ScrollView className="mt-4" keyboardShouldPersistTaps="handled">
              <View className="flex-row flex-wrap gap-2 pb-4">
                {filteredCurrencies.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => void onPickCurrency(c)}
                    className={`rounded-xl border px-3 py-2 ${
                      settings.currencyCode === c
                        ? "border-violet-400/60 bg-violet-500/15"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <Text className="text-xs font-bold text-white">
                      {c} {getCurrencySymbol(c)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <GradientButton
              title="Закрыть"
              variant="ghost"
              onPress={() => setCurrencyModalOpen(false)}
            />
          </View>
        </View>
      </Modal>
      <Modal visible={otaDialog != null} transparent animationType="fade">
        <View className="flex-1 justify-center bg-black/70 px-6">
          <View className="rounded-3xl border border-white/10 bg-slate-950 p-5">
            <Text className="text-lg font-semibold text-white">OTA</Text>
            <ScrollView className="mt-3 max-h-64">
              <Text className="text-sm leading-5 text-slate-300">{otaDialog}</Text>
            </ScrollView>
            <GradientButton
              title="OK"
              className="mt-5"
              onPress={() => setOtaDialog(null)}
              size="cockpit"
            />
          </View>
        </View>
      </Modal>
      <BugReportModal visible={bugOpen} onClose={() => setBugOpen(false)} />
      <AppConfirmModal
        visible={resetStatsOpen}
        title="Сбросить всю статистику?"
        message={
          resetCloudToo && session?.user?.id
            ? "Все локальные блоки статистики и смены в облаке будут удалены без восстановления."
            : "Все локальные блоки статистики будут удалены. Облако не затрагивается."
        }
        confirmLabel="Да, сбросить"
        cancelLabel="Отмена"
        destructive
        onCancel={() => setResetStatsOpen(false)}
        onConfirm={() => {
          setResetStatsOpen(false);
          setResetBusy(true);
          setResetResult(null);
          void resetStatistics({
            includeCloud: resetCloudToo,
            userId: session?.user?.id ?? null,
          }).then((res) => {
            setResetBusy(false);
            if (res.ok) {
              setResetResult(res.message ?? "Статистика обнулена.");
            } else {
              setResetResult(res.error ?? "Ошибка сброса");
            }
          });
        }}
      />
    </CockpitBackground>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  className = "",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "decimal-pad";
  className?: string;
}) {
  return (
    <View className={className}>
      <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#64748b"
        keyboardType={keyboardType}
        className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white"
      />
    </View>
  );
}
