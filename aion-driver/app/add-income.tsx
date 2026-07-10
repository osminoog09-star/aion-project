import { router } from "expo-router";
import { useState } from "react";
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
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { currencyAmountFieldLabel } from "../utils/formatting";

export default function AddIncomeModal() {
  const { addIncome, activeShift } = useShift();
  const currency = useResolvedCurrency();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => router.back();

  const submit = async () => {
    const amount = parseFloat(value.replace(",", "."));
    if (!activeShift || !Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    try {
      await addIncome(amount);
      close();
    } finally {
      setBusy(false);
    }
  };

  const parsed = parseFloat(value.replace(",", "."));
  const canSave =
    Boolean(activeShift) && Number.isFinite(parsed) && parsed > 0 && !busy;

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
                Добавить доход
              </Text>
              <Text className="mt-1 text-center text-xs text-slate-500">
                Сумма попадёт в текущую смену
              </Text>

              <GlassCard className="mt-6" glow="cyan">
                <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {currencyAmountFieldLabel(currency)}
                </Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  keyboardType="decimal-pad"
                  placeholder="1200"
                  placeholderTextColor="#64748b"
                  className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-2xl font-semibold text-white"
                />
              </GlassCard>

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
