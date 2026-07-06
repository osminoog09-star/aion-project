import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
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
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { useResolvedDistanceUnits } from "../hooks/useResolvedDistanceUnits";

const FUEL_TYPES = ["АИ-95", "АИ-92", "ДТ", "Газ"] as const;

export default function AddFuelModal() {
  const params = useLocalSearchParams<{ total?: string }>();
  const { activeShift, addConfirmedFuelEntry, liveMetrics } = useShift();
  const currency = useResolvedCurrency();
  const distanceUnits = useResolvedDistanceUnits();
  const [totalStr, setTotalStr] = useState(params.total ?? "");
  const [litersStr, setLitersStr] = useState("");
  const [fuelType, setFuelType] = useState<string>(FUEL_TYPES[0]);
  const [busy, setBusy] = useState(false);

  const close = () => router.back();

  const preview = useMemo(() => {
    const total = parseFloat(totalStr.replace(",", "."));
    const liters = parseFloat(litersStr.replace(",", "."));
    const entry = buildManualFuelEntry({
      totalCost: total,
      liters,
      fuelType,
    });
    if (!entry) return null;
    const km =
      liveMetrics?.distanceKm ??
      (activeShift ? activeShift.distanceMeters / 1000 : 0);
    const per100 = fuelCostPer100Km(entry.totalCost, km);
    return { entry, per100, km };
  }, [totalStr, litersStr, fuelType, liveMetrics, activeShift]);

  const submit = async () => {
    if (!preview?.entry) return;
    setBusy(true);
    await addConfirmedFuelEntry(preview.entry);
    setBusy(false);
    close();
  };

  const canSave = Boolean(preview?.entry && !busy);

  return (
    <Pressable className="flex-1 justify-end bg-black/75" onPress={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="rounded-t-3xl border border-white/10 border-b-0 bg-slate-950/95">
            <SafeAreaView edges={["bottom"]} className="px-4 pb-6 pt-4">
              <View className="mb-4 h-1 w-12 self-center rounded-full bg-white/20" />
              <Text className="text-center text-lg font-semibold text-white">
                Заправка
              </Text>
              <Text className="mt-1 text-center text-xs text-slate-500">
                {activeShift
                  ? "Сумма и литры → расход смены и чистая прибыль пересчитаются автоматически"
                  : "Без смены запись сохранится и попадёт в учёт при следующем старте смены"}
              </Text>

              <GlassCard className="mt-5" glow="cyan">
                <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {currencyAmountFieldLabel(currency)}
                </Text>
                <TextInput
                  value={totalStr}
                  onChangeText={setTotalStr}
                  keyboardType="decimal-pad"
                  placeholder="3500"
                  placeholderTextColor="#64748b"
                  className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-2xl font-semibold text-white"
                />
                <Text className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Литры
                </Text>
                <TextInput
                  value={litersStr}
                  onChangeText={setLitersStr}
                  keyboardType="decimal-pad"
                  placeholder="45"
                  placeholderTextColor="#64748b"
                  className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xl font-semibold text-white"
                />
                <Text className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Тип топлива
                </Text>
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
                      <Text
                        className={`text-xs font-semibold ${
                          fuelType === t ? "text-amber-100" : "text-slate-400"
                        }`}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </GlassCard>

              {preview ? (
                <View className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-3">
                  <Text className="text-[10px] uppercase tracking-widest text-emerald-300/90">
                    Расчёт
                  </Text>
                  <Text className="mt-1 text-sm text-slate-200">
                    {formatLiters(preview.entry.liters)} ·{" "}
                    {formatCurrencyDisplay(preview.entry.unitPrice, currency)}/л
                  </Text>
                  <Text className="mt-1 text-sm font-medium text-white">
                    {activeShift ? "К смене: " : "К учёту: "}
                    {formatCurrencyDisplay(preview.entry.totalCost, currency)}
                  </Text>
                  {preview.per100 != null && preview.km > 0 ? (
                    <Text className="mt-1 text-xs text-slate-400">
                      ≈ {formatFuelCostPer100Km(preview.per100, currency, distanceUnits)} при{" "}
                      {preview.km.toFixed(1)} км смены
                    </Text>
                  ) : activeShift ? (
                    <Text className="mt-1 text-xs text-slate-500">
                      Расход на 100 км появится после километража в смене
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View className="mt-6 flex-row gap-3">
                <View className="flex-1">
                  <PrimaryButton title="Отмена" variant="ghost" onPress={close} />
                </View>
                <View className="flex-1">
                  <PrimaryButton
                    title="Сохранить"
                    onPress={submit}
                    loading={busy}
                    disabled={!canSave}
                  />
                </View>
              </View>
            </SafeAreaView>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  );
}
