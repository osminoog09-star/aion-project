import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientButton } from "../components/ui/GradientButton";
import { GlowCard } from "../components/ui/GlowCard";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useShift } from "../hooks/useShift";
import { qk } from "../lib/queryKeys";
import { applyHistoricalShiftCorrection } from "../utils/historicalShiftCorrection";
import {
  formatCurrencyDisplay,
  formatDuration,
  formatKm,
} from "../utils/formatting";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { useResolvedDistanceUnits } from "../hooks/useResolvedDistanceUnits";

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

export default function EditShiftHistoryScreen() {
  const { shiftId } = useLocalSearchParams<{ shiftId: string }>();
  const { history, profile, correctHistoryShift } = useShift();
  const currency = useResolvedCurrency();
  const distanceUnits = useResolvedDistanceUnits();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const uid = session?.user?.id;

  const shift = useMemo(
    () => history.find((s) => s.id === shiftId) ?? null,
    [history, shiftId],
  );

  const [incomeStr, setIncomeStr] = useState("");
  const [fuelStr, setFuelStr] = useState("");
  const [kmStr, setKmStr] = useState("");
  const [minStr, setMinStr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!shift) return;
    setIncomeStr(String(shift.income));
    setFuelStr(String(shift.fuelCostTotal));
    setKmStr(String(shift.distanceKm));
    setMinStr(String(Math.max(1, Math.round(shift.durationMs / 60_000))));
  }, [shift]);

  const patch = useMemo(() => {
    if (!shift) return null;
    const income = parseNum(incomeStr);
    const fuelCostTotal = parseNum(fuelStr);
    const distanceKm = parseNum(kmStr);
    const minutes = parseNum(minStr);
    const durationMs =
      minutes != null ? Math.max(0, Math.round(minutes * 60_000)) : null;
    const p: {
      income?: number;
      fuelCostTotal?: number;
      distanceKm?: number;
      durationMs?: number;
    } = {};
    if (income != null && income !== shift.income) p.income = income;
    if (fuelCostTotal != null && fuelCostTotal !== shift.fuelCostTotal) {
      p.fuelCostTotal = fuelCostTotal;
    }
    if (distanceKm != null && Math.abs(distanceKm - shift.distanceKm) > 0.0001) {
      p.distanceKm = distanceKm;
    }
    if (durationMs != null && durationMs !== shift.durationMs) p.durationMs = durationMs;
    return Object.keys(p).length ? p : null;
  }, [shift, incomeStr, fuelStr, kmStr, minStr]);

  const preview = useMemo(() => {
    if (!shift || !profile) return null;
    const toApply = patch ?? {};
    return applyHistoricalShiftCorrection(shift, profile, toApply);
  }, [shift, profile, patch, incomeStr, fuelStr, kmStr, minStr]);

  const save = async () => {
    if (!shift || !shiftId || !patch) {
      Alert.alert("Нет изменений", "Измените хотя бы одно поле.");
      return;
    }
    setBusy(true);
    const r = await correctHistoryShift(shiftId, patch);
    setBusy(false);
    if (!r.ok) {
      Alert.alert("Ошибка", r.error ?? "Не удалось сохранить");
      return;
    }
    if (uid) {
      await queryClient.invalidateQueries({ queryKey: qk.trips(uid) });
    }
    router.back();
  };

  if (!shiftId || !shift) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-slate-950 px-4">
        <Text className="text-center text-white">
          {!shiftId ? "Не указана смена" : "Смена не найдена в локальной истории"}
        </Text>
        <GradientButton
          title="Назад"
          variant="ghost"
          className="mt-6"
          onPress={() => router.back()}
          size="cockpit"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between py-3">
            <Pressable
              onPress={() => router.back()}
              className="rounded-xl bg-white/10 px-3 py-2"
            >
              <Text className="text-sm font-semibold text-white">← Назад</Text>
            </Pressable>
            <Text className="text-xs uppercase tracking-widest text-slate-500">
              правка смены
            </Text>
            <View style={{ width: 72 }} />
          </View>

          <Text className="text-2xl font-bold text-white">Исправить данные</Text>
          <Text className="mt-2 text-sm leading-5 text-slate-400">
            Меняются только сохранённые итоги смены. Пропорции бензин/газ по сумме топлива и по
            километражу сохраняются. При включённой аренде в профиле чистая после расходов
            пересчитается автоматически.
          </Text>

          <GlowCard glow="neutral" className="mt-5">
            <LField label="Доход (грязь)" value={incomeStr} onChangeText={setIncomeStr} />
            <LField
              label="Топливо Σ (фактические расходы)"
              value={fuelStr}
              onChangeText={setFuelStr}
              className="mt-4"
            />
            <LField label="Пробег, км" value={kmStr} onChangeText={setKmStr} className="mt-4" />
            <LField label="Длительность (мин)" value={minStr} onChangeText={setMinStr} className="mt-4" />
          </GlowCard>

          {preview ? (
            <GlowCard glow="cyan" className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-cyan-300/80">
                Предпросмотр
              </Text>
              <Text className="mt-2 text-lg font-semibold text-white">
                {formatCurrencyDisplay(preview.netProfit, currency)} чистыми
              </Text>
              <Text className="mt-1 text-sm text-slate-400">
                {formatDuration(preview.durationMs)} ·{" "}
                {formatKm(preview.distanceKm, distanceUnits)} ·{" "}
                {formatCurrencyDisplay(preview.income, currency)} доход
              </Text>
            </GlowCard>
          ) : null}

          <GradientButton
            title="Сохранить"
            variant="glass"
            className="mt-6"
            disabled={busy || !patch}
            loading={busy}
            onPress={() => void save()}
            size="cockpit"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LField({
  label,
  value,
  onChangeText,
  className = "",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  className?: string;
}) {
  return (
    <View className={className}>
      <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-white"
        placeholderTextColor="#64748b"
      />
    </View>
  );
}
