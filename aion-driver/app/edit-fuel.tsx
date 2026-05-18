import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard } from "../components/GlassCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { useShift } from "../hooks/useShift";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import {
  buildManualFuelEntry,
  fuelCostPer100Km,
} from "../utils/fuelEntryFromManual";
import {
  currencyAmountFieldLabel,
  formatCurrencyDisplay,
  formatFuelCostPer100Km,
  formatLiters,
} from "../utils/formatting";
import { useResolvedDistanceUnits } from "../hooks/useResolvedDistanceUnits";

const FUEL_TYPES = ["АИ-95", "АИ-92", "ДТ", "Газ"] as const;

export default function EditFuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    activeShift,
    pendingFuelEntries,
    updateFuelEntry,
    removeFuelEntry,
    liveMetrics,
  } = useShift();
  const currency = useResolvedCurrency();
  const distanceUnits = useResolvedDistanceUnits();

  const existing = useMemo(() => {
    const list = [
      ...(activeShift?.fuelEntries ?? []),
      ...pendingFuelEntries,
    ];
    return list.find((e) => e.id === id) ?? null;
  }, [activeShift, pendingFuelEntries, id]);

  const [totalStr, setTotalStr] = useState(() =>
    existing ? String(existing.totalCost) : "",
  );
  const [litersStr, setLitersStr] = useState(() =>
    existing ? String(existing.liters) : "",
  );
  const [fuelType, setFuelType] = useState(existing?.fuelType ?? FUEL_TYPES[0]);
  const [busy, setBusy] = useState(false);

  if (!existing) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 px-4 justify-center">
        <Text className="text-center text-white">Запись не найдена</Text>
        <PrimaryButton title="Назад" className="mt-4" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const preview = useMemo(() => {
    const total = parseFloat(totalStr.replace(",", "."));
    const liters = parseFloat(litersStr.replace(",", "."));
    const entry = buildManualFuelEntry({ totalCost: total, liters, fuelType });
    if (!entry) return null;
    const km =
      liveMetrics?.distanceKm ??
      (activeShift ? activeShift.distanceMeters / 1000 : 0);
    return { entry, per100: fuelCostPer100Km(entry.totalCost, km), km };
  }, [totalStr, litersStr, fuelType, liveMetrics, activeShift]);

  const save = async () => {
    if (!preview?.entry || !id) return;
    setBusy(true);
    const r = await updateFuelEntry(id, {
      totalCost: preview.entry.totalCost,
      liters: preview.entry.liters,
      fuelType: preview.entry.fuelType,
    });
    setBusy(false);
    if (!r.ok) {
      Alert.alert("Ошибка", r.error ?? "Не удалось сохранить");
      return;
    }
    router.back();
  };

  const onDelete = () => {
    Alert.alert(
      "Удалить заправку?",
      `${existing.fuelType} · ${formatCurrencyDisplay(existing.totalCost, currency)}`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const r = await removeFuelEntry(id!);
              if (!r.ok) Alert.alert("Ошибка", r.error ?? "Не удалось");
              else router.back();
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 px-4"
      >
        <Text className="mt-2 text-xl font-semibold text-white">Исправить заправку</Text>
        <Text className="mt-1 text-sm text-slate-500">
          Прибыль и расход пересчитаются сразу после сохранения.
        </Text>

        <GlassCard className="mt-5" glow="violet">
          <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {currencyAmountFieldLabel(currency)}
          </Text>
          <TextInput
            value={totalStr}
            onChangeText={setTotalStr}
            keyboardType="decimal-pad"
            className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-2xl font-semibold text-white"
          />
          <Text className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">Литры</Text>
          <TextInput
            value={litersStr}
            onChangeText={setLitersStr}
            keyboardType="decimal-pad"
            className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xl font-semibold text-white"
          />
          <Text className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">Тип</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {FUEL_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setFuelType(t)}
                className={`rounded-full border px-3 py-1.5 ${
                  fuelType === t
                    ? "border-amber-400/50 bg-amber-500/15"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <Text className="text-xs font-semibold text-slate-200">{t}</Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {preview ? (
          <Text className="mt-3 text-sm text-slate-400">
            {formatLiters(preview.entry.liters)} ·{" "}
            {formatCurrencyDisplay(preview.entry.totalCost, currency)}
            {preview.per100 != null && preview.km > 0
              ? ` · ≈ ${formatFuelCostPer100Km(preview.per100, currency, distanceUnits)}`
              : ""}
          </Text>
        ) : null}

        <View className="mt-6 gap-3">
          <PrimaryButton title="Сохранить" onPress={save} loading={busy} disabled={!preview} />
          <PrimaryButton title="Удалить запись" variant="ghost" onPress={onDelete} />
          <PrimaryButton title="Отмена" variant="ghost" onPress={() => router.back()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
