import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraCaptureModal } from "../components/import/CameraCaptureModal";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { GlowCard } from "../components/ui/GlowCard";
import { GlowMeter } from "../components/ui/GlowMeter";
import { GradientButton } from "../components/ui/GradientButton";
import { useDevice } from "../hooks/useDevice";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import type { OcrParseResult, OcrTripRow, PayoutPlatform } from "../features/import/types";
import type { FuelReceiptExtraction } from "../features/import/extraction/fuelReceiptTypes";
import { recomputeOcrParseTotals } from "../features/import/services/ocrParseMapper";
import { validateOcrConfirmation } from "../features/import/confirmation/validateOcrConfirmation";
import { validateFuelOcrConfirmation } from "../features/import/confirmation/validateFuelOcrConfirmation";
import { captureOcrError } from "../lib/sentry";
import { appendOcrImport } from "../storage/driver/ocrImportStorage";
import {
  getOcrQueueStats,
  replayFailedOcrJobs,
  runOcrThroughQueue,
} from "../features/import/ocrQueue/ocrQueueEngine";
import { subscribeOcrQueue } from "../features/import/ocrQueue/ocrQueueEvents";
import type { OcrQueueStats } from "../features/import/ocrQueue/summarizeOcrQueue";
import { appendAionTimelineEvent } from "../storage/core/aionTimelineStorage";
import { useAionEntityStore } from "../src/core/aion/entity/aionEntityStore";
import { useShift } from "../hooks/useShift";
import type { FuelEntry } from "../types";
import { formatCurrencyDisplay } from "../utils/formatting";
import type { AppCurrencyCode } from "../types/device";

const PLATFORMS: { id: PayoutPlatform; label: string }[] = [
  { id: "bolt", label: "Bolt" },
  { id: "uber", label: "Uber" },
  { id: "yandex", label: "Yandex" },
  { id: "freenow", label: "FreeNow" },
  { id: "lyft", label: "Lyft" },
  { id: "wolt", label: "Wolt" },
];

function ScanPulse() {
  const o = useSharedValue(0.35);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.35, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={style}
      className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-cyan-400/80"
    />
  );
}

function OcrPhaseBar({ phase }: { phase: number }) {
  const labels = ["Подготовка", "Разбор", "Итог"];
  const active = Math.min(labels.length - 1, Math.max(0, phase));
  return (
    <View className="mb-2 flex-row gap-2">
      {labels.map((label, i) => (
        <View key={label} className="flex-1">
          <View
            className={`h-1 rounded-full ${i <= active ? "bg-cyan-400" : "bg-white/10"}`}
          />
          <Text className="mt-1 text-[9px] font-semibold uppercase tracking-tighter text-slate-500">
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ImportScreenshotScreen() {
  const { settings } = useDevice();
  const { activeShift, addConfirmedFuelEntry } = useShift();
  const currency = useResolvedCurrency();
  const [platform, setPlatform] = useState<PayoutPlatform>("bolt");
  const [images, setImages] = useState<string[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPhase, setProgressPhase] = useState(0);
  const [result, setResult] = useState<OcrParseResult | null>(null);
  const [editedTrips, setEditedTrips] = useState<OcrTripRow[] | null>(null);
  const [added, setAdded] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<OcrQueueStats | null>(null);
  const [replayingFailed, setReplayingFailed] = useState(false);
  const [fuelConfirmationError, setFuelConfirmationError] = useState<string | null>(null);
  const [savingFuel, setSavingFuel] = useState(false);
  const [fuelModal, setFuelModal] = useState<{
    open: boolean;
    extraction: FuelReceiptExtraction | null;
    editLiters: string;
    editTotal: string;
    editUnit: string;
    editFuelType: string;
  }>({
    open: false,
    extraction: null,
    editLiters: "",
    editTotal: "",
    editUnit: "",
    editFuelType: "",
  });

  const reset = useCallback(() => {
    setImages([]);
    setPastedText("");
    setResult(null);
    setEditedTrips(null);
    setParsing(false);
    setProgress("");
    setProgressPhase(0);
    setAdded(false);
    setSavingHistory(false);
    setConfirmationError(null);
    setFuelConfirmationError(null);
    setSavingFuel(false);
    setFuelModal({
      open: false,
      extraction: null,
      editLiters: "",
      editTotal: "",
      editUnit: "",
      editFuelType: "",
    });
  }, []);

  const invalidateParsedResult = useCallback(() => {
    setResult(null);
    setEditedTrips(null);
    setAdded(false);
    setSavingHistory(false);
    setConfirmationError(null);
    setFuelConfirmationError(null);
    setSavingFuel(false);
    setProgress("");
    setFuelModal((current) => ({ ...current, open: false }));
  }, []);

  const refreshQueueStats = useCallback(async () => {
    setQueueStats(await getOcrQueueStats());
  }, []);

  useEffect(() => {
    void refreshQueueStats();
    return subscribeOcrQueue(() => void refreshQueueStats());
  }, [refreshQueueStats]);

  const replayFailed = useCallback(async () => {
    if (replayingFailed) return;
    setReplayingFailed(true);
    try {
      await replayFailedOcrJobs();
      await refreshQueueStats();
    } finally {
      setReplayingFailed(false);
    }
  }, [refreshQueueStats, replayingFailed]);

  const pickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      const uri = res.assets[0].uri;
      setImages((prev) => [...prev, uri]);
      invalidateParsedResult();
    }
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    setImages((prev) => [...prev, res.assets[0].uri]);
    invalidateParsedResult();
  };

  useEffect(() => {
    if (!result) {
      setEditedTrips(null);
      return;
    }
    setEditedTrips(result.trips.map((t) => ({ ...t })));
  }, [result]);

  const displayResult = useMemo(() => {
    if (!result || !editedTrips) return null;
    return recomputeOcrParseTotals(result, editedTrips);
  }, [result, editedTrips]);

  const confirmation = useMemo(
    () =>
      displayResult
        ? validateOcrConfirmation({
            earnings: displayResult.earnings,
            trips: displayResult.trips,
          })
        : null,
    [displayResult],
  );

  const patchTripAmount = useCallback((tripId: string, amount: number) => {
    setConfirmationError(null);
    setEditedTrips((rows) =>
      rows?.map((row) => (row.id === tripId ? { ...row, amount } : row)) ?? null,
    );
  }, []);

  const onParse = async () => {
    if (!pastedText.trim() && images.length === 0) return;
    setParsing(true);
    setResult(null);
    setEditedTrips(null);
    setProgress("");
    const entityAct = useAionEntityStore.getState();
    entityAct.setOcrActive(true);
    try {
      const out = await runOcrThroughQueue(
        {
          imageUris: images,
          pastedText: pastedText.trim() || null,
          platform,
          currencyCode: currency,
        },
        {
          timeoutMs: 120_000,
          onProgress: (label, phase) => {
            setProgress(label);
            setProgressPhase(typeof phase === "number" ? phase : 0);
          },
        },
      );
      setResult(out);
      if (out.trips.length > 0) {
        entityAct.triggerSuccess(2600);
      }
      if (
        out.fuelReceipt &&
        (out.fuelReceipt.fields.totalPrice != null || out.fuelReceipt.fields.liters != null)
      ) {
        const f = out.fuelReceipt.fields;
        setFuelModal({
          open: true,
          extraction: out.fuelReceipt,
          editLiters: f.liters != null ? String(f.liters) : "",
          editTotal: f.totalPrice != null ? String(f.totalPrice) : "",
          editUnit: f.pricePerLiter != null ? String(f.pricePerLiter) : "",
          editFuelType:
            f.fuelFamily && f.fuelFamily !== "unknown" ? f.fuelFamily.toUpperCase() : "",
        });
        setFuelConfirmationError(null);
        setSavingFuel(false);
      }
    } catch (e) {
      captureOcrError(e, { platform, currency });
      setProgress(
        e instanceof Error
          ? e.message.slice(0, 200)
          : "Ошибка распознавания. Задача остаётся в очереди для повтора.",
      );
    } finally {
      entityAct.setOcrActive(false);
      setParsing(false);
    }
  };

  const onAddToHistory = async () => {
    const parse = displayResult;
    if (!parse || savingHistory || added) return;
    const validation = validateOcrConfirmation({
      earnings: parse.earnings,
      trips: parse.trips,
    });
    if (!validation.valid) {
      setConfirmationError(validation.message);
      return;
    }
    setSavingHistory(true);
    setConfirmationError(null);
    try {
      const rec = {
        id: `ocr_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        platform: parse.platform,
        parse,
        sourceUri: images[0] ?? undefined,
        shiftId: activeShift?.id,
      };
      await appendOcrImport(rec);
      void appendAionTimelineEvent({
        type: "ocr_imported",
        title: "Импорт в историю",
        detail: `${parse.platform.toUpperCase()} · ${formatCurrencyDisplay(parse.netProfit, currency)}`,
        moduleId: "driver",
      });
      setAdded(true);
    } catch (error) {
      captureOcrError(error, { platform: parse.platform, currency });
      setConfirmationError("Не удалось сохранить импорт. Проверьте хранилище и повторите.");
    } finally {
      setSavingHistory(false);
    }
  };

  const confirmFuelToShift = useCallback(async () => {
    const fr = fuelModal.extraction;
    if (!fr || !activeShift || savingFuel) return;
    const parsedTotal = parseAmountInput(fuelModal.editTotal);
    const total = parsedTotal ?? fr.fields.totalPrice ?? null;
    const liters = parseAmountInput(fuelModal.editLiters) ?? fr.fields.liters ?? 0;
    let unitPrice = parseAmountInput(fuelModal.editUnit) ?? fr.fields.pricePerLiter ?? 0;
    const validation = validateFuelOcrConfirmation({
      total,
      liters,
      unitPrice,
      confidence: fr.confidence,
      totalEditedByUser: parsedTotal != null,
    });
    if (!validation.valid) {
      setFuelConfirmationError(validation.message);
      return;
    }
    const confirmedTotal = total as number;
    if (unitPrice <= 0 && liters > 0) {
      unitPrice = Math.round((confirmedTotal / liters) * 1000) / 1000;
    }
    const fuelType =
      fuelModal.editFuelType.trim() ||
      (fr.fields.fuelFamily && fr.fields.fuelFamily !== "unknown"
        ? fr.fields.fuelFamily
        : "fuel");
    const entry: FuelEntry = {
      id: `fuel_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      addedAtMs: Date.now(),
      fuelType,
      liters,
      totalCost: confirmedTotal,
      unitPrice: unitPrice > 0 ? unitPrice : confirmedTotal,
      confidence: fr.confidence,
      source: "ocr",
    };
    setSavingFuel(true);
    setFuelConfirmationError(null);
    try {
      await addConfirmedFuelEntry(entry);
      void appendAionTimelineEvent({
        type: "fuel_ocr_attached",
        title: "Топливо из чека",
        detail: `${fuelType} · ${confirmedTotal.toFixed(2)} · распознано ${Math.round(fr.confidence * 100)}%`,
        moduleId: "driver",
      });
      setFuelModal((s) => ({ ...s, open: false }));
    } catch (error) {
      captureOcrError(error, { platform, currency });
      setFuelConfirmationError("Не удалось добавить заправку к смене. Повторите ещё раз.");
    } finally {
      setSavingFuel(false);
    }
  }, [fuelModal, activeShift, addConfirmedFuelEntry, savingFuel, platform, currency]);

  const bgVariant =
    settings.nightContrast === "nightDrive" ? "nightDrive" : "cockpit";
  const sourceLocked = parsing || savingHistory;

  return (
    <CockpitBackground variant={bgVariant}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4 flex-row items-center justify-between pt-2">
            <View className="flex-1 pr-3">
              <Text className="text-[10px] uppercase tracking-[0.35em] text-cyan-400/90">
                Распознавание
              </Text>
              <Text className="mt-1 text-2xl font-semibold text-white">
                Импорт выплаты
              </Text>
              <Text className="mt-1 text-sm leading-5 text-slate-500">
                Вставьте текст выплаты из буфера (удобнее всего после Google Lens / выделения на скрине) или
                добавьте скриншоты. Суммы и поездки берутся только из распознанного текста — без автоподстановки
                «от себя».
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/driver")}
              accessibilityRole="button"
              accessibilityLabel="Закрыть и вернуться на пульт"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-2"
            >
              <Text className="text-sm font-medium text-slate-200">Пульт</Text>
            </Pressable>
          </View>

          <GlowCard glow="violet" className="mb-4">
            <Text className="text-xs uppercase tracking-widest text-slate-500">
              Платформа
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ gap: 8 }}
            >
              {PLATFORMS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setPlatform(p.id);
                    invalidateParsedResult();
                  }}
                  disabled={sourceLocked}
                  className={`rounded-2xl border px-4 py-2.5 ${
                    platform === p.id
                      ? "border-cyan-400/60 bg-cyan-500/20"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <Text className="text-sm font-semibold text-white">{p.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </GlowCard>

          <GlowCard glow="cyan" className="mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs uppercase tracking-widest text-slate-500">
                Текст выплаты
              </Text>
              <Pressable
                onPress={() =>
                  void Clipboard.getStringAsync().then((text) => {
                    setPastedText(text);
                    invalidateParsedResult();
                  })
                }
                disabled={sourceLocked}
                className={`rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 ${
                  sourceLocked ? "opacity-50" : ""
                }`}
              >
                <Text className="text-xs font-semibold text-cyan-200">Вставить из буфера</Text>
              </Pressable>
            </View>
            <TextInput
              value={pastedText}
              onChangeText={(text) => {
                setPastedText(text);
                invalidateParsedResult();
              }}
              editable={!sourceLocked}
              placeholder="Вставьте сюда текст со скриншота (Bolt / Uber / …)"
              placeholderTextColor="#64748b"
              multiline
              className="min-h-[100px] rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100"
              textAlignVertical="top"
            />
          </GlowCard>

          <Text className="mb-2 text-xs uppercase tracking-widest text-slate-500">
            Источник
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-3">
            <ActionTile
              icon="photo-library"
              title="Галерея"
              subtitle="PNG / JPEG"
              onPress={() => void pickGallery()}
              disabled={sourceLocked}
            />
            <ActionTile
              icon="folder-open"
              title="Файл"
              subtitle="Документ"
              onPress={() => void pickFile()}
              disabled={sourceLocked}
            />
            <ActionTile
              icon="photo-camera"
              title="Камера"
              subtitle="Снимок"
              onPress={() => setCameraOpen(true)}
              disabled={sourceLocked}
            />
          </View>

          {queueStats &&
          (queueStats.pending > 0 || queueStats.processing > 0 || queueStats.failed > 0) ? (
            <GlowCard glow={queueStats.failed > 0 ? "violet" : "neutral"} className="mb-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-xs uppercase tracking-widest text-slate-500">
                    Очередь распознавания
                  </Text>
                  <Text className="mt-1 text-sm text-slate-200">
                    Ожидают: {queueStats.pending} · в работе: {queueStats.processing} · ошибок:{" "}
                    {queueStats.failed}
                  </Text>
                </View>
                {queueStats.failed > 0 ? (
                  <Pressable
                    onPress={() => void replayFailed()}
                    disabled={replayingFailed}
                    accessibilityRole="button"
                    accessibilityLabel="Повторить распознавание с ошибкой"
                    className={`h-10 flex-row items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 ${
                      replayingFailed ? "opacity-50" : ""
                    }`}
                  >
                    <MaterialIcons name="refresh" size={18} color="#c4b5fd" />
                    <Text className="text-xs font-semibold text-violet-200">Повторить</Text>
                  </Pressable>
                ) : null}
              </View>
            </GlowCard>
          ) : null}

          {(images.length > 0 || pastedText.trim()) ? (
            <Animated.View entering={FadeInDown.duration(400)}>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs uppercase tracking-widest text-slate-500">
                  Снимки ({images.length})
                </Text>
                <Pressable onPress={reset} hitSlop={12} disabled={sourceLocked}>
                  <Text className="text-sm font-semibold text-rose-300">Сбросить</Text>
                </Pressable>
              </View>
              {images.length > 0 ? (
                <FlatList
                  horizontal
                  data={images}
                  keyExtractor={(item, i) => `${item}-${i}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
                  renderItem={({ item }) => (
                    <GlowCard glow="cyan" className="w-28 overflow-hidden p-0">
                      <Image
                        source={{ uri: item }}
                        style={{ width: 112, height: 160 }}
                        contentFit="cover"
                      />
                    </GlowCard>
                  )}
                />
              ) : (
                <Text className="mb-3 text-xs text-slate-500">
                  Скриншоты опциональны, если текст уже вставлен выше.
                </Text>
              )}
              {images[0] ? (
                <GlowCard glow="cyan" className="mb-4 overflow-hidden p-0">
                  <Image
                    source={{ uri: images[0] }}
                    style={{ width: "100%", aspectRatio: 9 / 16, maxHeight: 360 }}
                    contentFit="contain"
                    transition={200}
                  />
                </GlowCard>
              ) : null}
              <GradientButton
                title={parsing ? "Разбор…" : "Запустить AI-разбор"}
                onPress={() => void onParse()}
                loading={parsing}
                disabled={sourceLocked}
                size="cockpit"
                className="mb-2"
              />
              {parsing ? (
                <View className="mb-6">
                  <ScanPulse />
                  <OcrPhaseBar phase={progressPhase} />
                  <View className="mt-3 flex-row items-center gap-2">
                    <ActivityIndicator color="#22d3ee" />
                    <Text className="flex-1 text-sm text-slate-300">{progress}</Text>
                  </View>
                </View>
              ) : progress && !result ? (
                <Text className="mb-6 text-sm text-rose-300">{progress}</Text>
              ) : null}
            </Animated.View>
          ) : (
            <GlowCard glow="neutral" className="mb-6 items-center py-10">
              <MaterialIcons name="content-paste" size={40} color="#64748b" />
              <Text className="mt-3 text-center text-sm text-slate-500">
                Вставьте текст или добавьте снимки. Пока нет текста, движок не заполняет суммы — это защита от
                ошибочных данных.
              </Text>
            </GlowCard>
          )}

          {displayResult ? (
            <Animated.View entering={FadeIn.duration(450)}>
              <Text className="mb-2 text-xs uppercase tracking-widest text-emerald-400/90">
                Результат
              </Text>
              <GlowCard glow="cyan" className="mb-4">
                <Text className="text-center text-lg font-semibold text-cyan-200">
                  AI · {displayResult.tripCount}{" "}
                  {displayResult.tripCount === 1 ? "поездка" : "поездок"}
                </Text>
                {displayResult.tripAmountsAdjustedByUser ? (
                  <Text className="mt-2 text-center text-xs text-cyan-200/90">
                    Суммы поездок скорректированы вручную — итоги пересчитаны.
                  </Text>
                ) : null}
                {displayResult.needsEditMode ? (
                  <Text className="mt-2 text-center text-xs text-amber-300">
                    Проверьте данные перед сохранением (низкая уверенность).
                  </Text>
                ) : null}
                {displayResult.analytics ? (
                  <View className="mt-4 border-t border-white/10 pt-4">
                    <Row
                      k="Σ доход"
                      v={formatCurrencyDisplay(
                        displayResult.analytics.totalIncome,
                        displayResult.currencyCode as AppCurrencyCode,
                      )}
                    />
                    <Row
                      k="Средний чек"
                      v={formatCurrencyDisplay(
                        displayResult.analytics.avgOrder,
                        displayResult.currencyCode as AppCurrencyCode,
                      )}
                    />
                    <Row
                      k="Лучший заказ"
                      v={formatCurrencyDisplay(
                        displayResult.analytics.bestOrder,
                        displayResult.currencyCode as AppCurrencyCode,
                      )}
                    />
                    <Row
                      k="Доход / ч"
                      v={
                        displayResult.analytics.earningsPerHour != null
                          ? formatCurrencyDisplay(
                              displayResult.analytics.earningsPerHour,
                              displayResult.currencyCode as AppCurrencyCode,
                            )
                          : "—"
                      }
                    />
                    <Row
                      k="Оценка км"
                      v={
                        displayResult.analytics.estimatedKm != null
                          ? `${displayResult.analytics.estimatedKm} км`
                          : "недоступно"
                      }
                    />
                  </View>
                ) : null}
                <Row k="Платформа" v={displayResult.platform.toUpperCase()} />
                <Row
                  k="Выплата (агрегат)"
                  v={formatCurrencyDisplay(displayResult.earnings, displayResult.currencyCode as AppCurrencyCode)}
                />
                <Row
                  k="Чаевые"
                  v={formatCurrencyDisplay(displayResult.tips, displayResult.currencyCode as AppCurrencyCode)}
                />
                <Row
                  k="Бонус"
                  v={formatCurrencyDisplay(displayResult.bonus, displayResult.currencyCode as AppCurrencyCode)}
                />
                <Row k="Часов онлайн" v={String(displayResult.hoursOnline)} />
                <Row
                  k="Топливо (оценка)"
                  v={
                    displayResult.estimatedFuelCost > 0
                      ? formatCurrencyDisplay(
                          displayResult.estimatedFuelCost,
                          displayResult.currencyCode as AppCurrencyCode,
                        )
                      : "нет данных"
                  }
                />
                <Row
                  k="Чистая прибыль"
                  v={formatCurrencyDisplay(
                    displayResult.netProfit,
                    displayResult.currencyCode as AppCurrencyCode,
                  )}
                  accent
                />
                {displayResult.fuelReceipt ? (
                  <View className="mt-4 border-t border-white/10 pt-4">
                    <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                      Чек АЗС (OCR, эвристика)
                    </Text>
                    <Text className="mt-1 text-xs text-amber-200/90">
                      Проверьте перед учётом · уверенность{" "}
                      {Math.round(displayResult.fuelReceipt.confidence * 100)}%
                    </Text>
                    {displayResult.fuelReceipt.fields.totalPrice != null ? (
                      <Row
                        k="Сумма"
                        v={formatCurrencyDisplay(
                          displayResult.fuelReceipt.fields.totalPrice,
                          displayResult.currencyCode as AppCurrencyCode,
                        )}
                      />
                    ) : null}
                    {displayResult.fuelReceipt.fields.liters != null ? (
                      <Row k="Литры" v={`${displayResult.fuelReceipt.fields.liters} л`} />
                    ) : null}
                    {displayResult.fuelReceipt.fields.kg != null ? (
                      <Row k="Кг" v={`${displayResult.fuelReceipt.fields.kg} кг`} />
                    ) : null}
                    {displayResult.fuelReceipt.fields.pricePerLiter != null ? (
                      <Row
                        k="Цена/л"
                        v={formatCurrencyDisplay(
                          displayResult.fuelReceipt.fields.pricePerLiter,
                          displayResult.currencyCode as AppCurrencyCode,
                        )}
                      />
                    ) : null}
                    {displayResult.fuelReceipt.fields.pricePerKg != null ? (
                      <Row
                        k="Цена/кг"
                        v={formatCurrencyDisplay(
                          displayResult.fuelReceipt.fields.pricePerKg,
                          displayResult.currencyCode as AppCurrencyCode,
                        )}
                      />
                    ) : null}
                    {displayResult.fuelReceipt.fields.fuelFamily &&
                    displayResult.fuelReceipt.fields.fuelFamily !== "unknown" ? (
                      <Row k="Тип" v={displayResult.fuelReceipt.fields.fuelFamily.toUpperCase()} />
                    ) : null}
                    {displayResult.fuelReceipt.fields.timestampNote ? (
                      <Row k="Время (фрагмент)" v={displayResult.fuelReceipt.fields.timestampNote} />
                    ) : null}
                    {displayResult.fuelReceipt.fields.stationNote ? (
                      <Row k="Станция (фрагмент)" v={displayResult.fuelReceipt.fields.stationNote} />
                    ) : null}
                  </View>
                ) : null}
                {displayResult.dashboardCluster ? (
                  <View className="mt-4 border-t border-white/10 pt-4">
                    <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                      Щиток приборов (OCR, эвристика)
                    </Text>
                    <Text className="mt-1 text-xs text-amber-200/90">
                      Проверьте перед учётом · уверенность{" "}
                      {Math.round(displayResult.dashboardCluster.confidence * 100)}%
                    </Text>
                    {displayResult.dashboardCluster.fields.odometerKm != null ? (
                      <Row k="Пробег" v={`${displayResult.dashboardCluster.fields.odometerKm} км`} />
                    ) : null}
                    {displayResult.dashboardCluster.fields.tripDistanceKm != null ? (
                      <Row k="Поездка" v={`${displayResult.dashboardCluster.fields.tripDistanceKm} км`} />
                    ) : null}
                    {displayResult.dashboardCluster.fields.avgConsumptionLPer100 != null ? (
                      <Row
                        k="Средний расход"
                        v={`${displayResult.dashboardCluster.fields.avgConsumptionLPer100} л/100км`}
                      />
                    ) : null}
                    {displayResult.dashboardCluster.fields.rangeRemainingKm != null ? (
                      <Row k="Запас хода" v={`${displayResult.dashboardCluster.fields.rangeRemainingKm} км`} />
                    ) : null}
                    {displayResult.dashboardCluster.fields.movingTimeNote ? (
                      <Row k="Время (фрагмент)" v={displayResult.dashboardCluster.fields.movingTimeNote} />
                    ) : null}
                  </View>
                ) : null}
                <View className="mt-4">
                  <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                    Уверенность (глобальная)
                  </Text>
                  <GlowMeter
                    progress={Math.min(1, Math.max(0, displayResult.globalConfidence))}
                    className="mt-2"
                  />
                </View>
                {displayResult.notes?.length ? (
                  <View className="mt-3">
                    {displayResult.notes.map((n, i) => (
                      <Text key={i} className="text-xs text-slate-500">
                        · {n}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <Text className="mt-3 text-xs text-slate-500">
                  Модель: {displayResult.modelVersion}
                  {displayResult.textSource ? ` · ${displayResult.textSource}` : ""}
                </Text>
              </GlowCard>
              {editedTrips && editedTrips.length > 0 ? (
                <GlowCard glow="neutral" className="mb-4">
                  <Text className="text-xs uppercase tracking-widest text-slate-500">
                    Лента поездок · правка суммы
                  </Text>
                  <ScrollView className="mt-2 max-h-72" nestedScrollEnabled>
                    {editedTrips.map((t) => (
                      <View
                        key={t.id}
                        className="mb-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                      >
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="text-[10px] uppercase tracking-wider text-slate-500">Сумма</Text>
                          <TripAmountEditor
                            trip={t}
                            onCommitted={(n) => patchTripAmount(t.id, n)}
                          />
                          <Text className="text-xs text-slate-500">
                            {Math.round(t.confidence * 100)}% строка
                          </Text>
                        </View>
                        <View className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-800/90">
                          <View
                            className="h-full rounded-full bg-cyan-500/75"
                            style={{ width: `${Math.min(100, Math.max(4, Math.round(t.confidence * 100)))}%` }}
                          />
                        </View>
                        {t.address ? (
                          <Text className="mt-1 text-xs text-slate-400">{t.address}</Text>
                        ) : null}
                        {t.rawLine ? (
                          <Text className="mt-1 text-[10px] text-slate-600" numberOfLines={2}>
                            {t.rawLine}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </ScrollView>
                </GlowCard>
              ) : null}
              <GradientButton
                title={added ? "Добавлено в ленту" : savingHistory ? "Сохраняю…" : "Добавить в историю"}
                variant={added ? "ghost" : "glass"}
                onPress={() => void onAddToHistory()}
                loading={savingHistory}
                disabled={added || savingHistory || confirmation?.valid === false}
                size="cockpit"
              />
              {confirmation?.valid === false || confirmationError ? (
                <Text className="mt-2 text-center text-sm text-amber-300">
                  {confirmationError ?? confirmation?.message}
                </Text>
              ) : null}
            </Animated.View>
          ) : null}
        </ScrollView>
        <Modal
          visible={fuelModal.open}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!savingFuel) setFuelModal((s) => ({ ...s, open: false }));
          }}
        >
          <Pressable
            className="flex-1 justify-end bg-black/70"
            onPress={() => {
              if (!savingFuel) setFuelModal((s) => ({ ...s, open: false }));
            }}
          >
            <Pressable
              className="rounded-t-3xl border border-white/10 bg-slate-950 px-4 pb-8 pt-4"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-center text-lg font-semibold text-white">⛽ Топливо распознано</Text>
              <Text className="mt-2 text-center text-xs text-slate-400">
                OCR confidence: {fuelModal.extraction ? Math.round(fuelModal.extraction.confidence * 100) : 0}%
                {fuelModal.extraction && fuelModal.extraction.confidence < 0.55
                  ? " · проверьте сумму вручную"
                  : ""}
              </Text>
              {!activeShift ? (
                <Text className="mt-4 text-center text-sm text-amber-300">
                  Начните смену на пульте, чтобы прикрепить чек к текущей сессии.
                </Text>
              ) : (
                <>
                  <TextInput
                    value={fuelModal.editFuelType}
                    onChangeText={(t) => {
                      setFuelConfirmationError(null);
                      setFuelModal((s) => ({ ...s, editFuelType: t }));
                    }}
                    placeholder="Тип топлива"
                    editable={!savingFuel}
                    placeholderTextColor="#64748b"
                    className="mt-4 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  />
                  <TextInput
                    value={fuelModal.editLiters}
                    onChangeText={(t) => {
                      setFuelConfirmationError(null);
                      setFuelModal((s) => ({ ...s, editLiters: t }));
                    }}
                    placeholder="Литры"
                    keyboardType="decimal-pad"
                    editable={!savingFuel}
                    placeholderTextColor="#64748b"
                    className="mt-2 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  />
                  <TextInput
                    value={fuelModal.editTotal}
                    onChangeText={(t) => {
                      setFuelConfirmationError(null);
                      setFuelModal((s) => ({ ...s, editTotal: t }));
                    }}
                    placeholder="Сумма"
                    keyboardType="decimal-pad"
                    editable={!savingFuel}
                    placeholderTextColor="#64748b"
                    className="mt-2 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  />
                  <TextInput
                    value={fuelModal.editUnit}
                    onChangeText={(t) => {
                      setFuelConfirmationError(null);
                      setFuelModal((s) => ({ ...s, editUnit: t }));
                    }}
                    placeholder="Цена за единицу (опционально)"
                    keyboardType="decimal-pad"
                    editable={!savingFuel}
                    placeholderTextColor="#64748b"
                    className="mt-2 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  />
                  <View className="mt-5 flex-row gap-3">
                    <GradientButton
                      title="Отмена"
                      variant="ghost"
                      className="flex-1"
                      disabled={savingFuel}
                      onPress={() => setFuelModal((s) => ({ ...s, open: false }))}
                    />
                    <GradientButton
                      title={savingFuel ? "Сохраняю…" : "Подтвердить"}
                      variant="glass"
                      className="flex-1"
                      loading={savingFuel}
                      disabled={savingFuel}
                      onPress={() => void confirmFuelToShift()}
                    />
                  </View>
                  {fuelConfirmationError ? (
                    <Text className="mt-3 text-center text-sm text-amber-300">
                      {fuelConfirmationError}
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
        <CameraCaptureModal
          visible={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCaptured={(uri) => {
            setImages((prev) => [...prev, uri]);
            invalidateParsedResult();
          }}
        />
      </SafeAreaView>
    </CockpitBackground>
  );
}

function parseAmountInput(raw: string): number | null {
  const s = raw.replace(/\s/g, "").replace(",", ".");
  if (!s || s === "-" || s === "." || s === "-.") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function TripAmountEditor({
  trip,
  onCommitted,
}: {
  trip: OcrTripRow;
  onCommitted: (n: number) => void;
}) {
  const [txt, setTxt] = useState(String(trip.amount));
  useEffect(() => {
    setTxt(String(trip.amount));
  }, [trip.id, trip.amount]);
  return (
    <TextInput
      value={txt}
      onChangeText={setTxt}
      onBlur={() => {
        const n = parseAmountInput(txt);
        if (n != null) onCommitted(n);
        else setTxt(String(trip.amount));
      }}
      keyboardType="decimal-pad"
      placeholderTextColor="#64748b"
      className="min-w-[100px] flex-1 rounded-lg border border-cyan-500/25 bg-slate-950/80 px-2 py-1.5 text-sm font-semibold text-white"
    />
  );
}

function ActionTile({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-w-[31%] flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-4 active:opacity-85 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <MaterialIcons name={icon} size={28} color="#67e8f9" />
      <Text className="mt-2 text-sm font-semibold text-white">{title}</Text>
      <Text className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
        {subtitle}
      </Text>
    </Pressable>
  );
}

function Row({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: boolean;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between border-b border-white/5 pb-2">
      <Text className="text-xs uppercase tracking-wider text-slate-500">{k}</Text>
      <Text
        className={`text-right text-sm font-semibold ${accent ? "text-emerald-300" : "text-white"}`}
      >
        {v}
      </Text>
    </View>
  );
}
