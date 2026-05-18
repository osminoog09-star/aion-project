import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { GlowCard } from "../components/ui/GlowCard";
import { GradientButton } from "../components/ui/GradientButton";
import { useShift } from "../hooks/useShift";
import { useResolvedCurrency } from "../hooks/useResolvedCurrency";
import { formatCurrencyDisplay, formatLiters } from "../utils/formatting";

export default function FuelJournalScreen() {
  const {
    activeShift,
    pendingFuelEntries,
    removeFuelEntry,
    refreshPendingFuel,
  } = useShift();
  const currency = useResolvedCurrency();

  const shiftEntries = activeShift?.fuelEntries ?? [];
  const hasPending = pendingFuelEntries.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "left", "right"]}>
      <CockpitBackground>
        <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 48 }}>
          <Text className="text-xl font-semibold text-white">Журнал заправок</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Все записи можно исправить или удалить — расчёт прибыли обновится автоматически.
          </Text>

          {shiftEntries.length > 0 ? (
            <GlowCard glow="cyan" className="mt-5">
              <Text className="text-xs uppercase tracking-widest text-slate-500">Текущая смена</Text>
              {shiftEntries.map((e) => (
                <FuelRow
                  key={e.id}
                  entry={e}
                  currency={currency}
                  onEdit={() => router.push({ pathname: "/edit-fuel", params: { id: e.id } })}
                  onDelete={() => void deleteEntry(e.id, e.fuelType, removeFuelEntry, refreshPendingFuel)}
                />
              ))}
            </GlowCard>
          ) : null}

          {hasPending ? (
            <GlowCard glow="violet" className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-slate-500">
                До старта смены
              </Text>
              {pendingFuelEntries.map((e) => (
                <FuelRow
                  key={e.id}
                  entry={e}
                  currency={currency}
                  onEdit={() => router.push({ pathname: "/edit-fuel", params: { id: e.id } })}
                  onDelete={() => void deleteEntry(e.id, e.fuelType, removeFuelEntry, refreshPendingFuel)}
                />
              ))}
            </GlowCard>
          ) : null}

          {!shiftEntries.length && !hasPending ? (
            <Text className="mt-8 text-center text-slate-500">Заправок пока нет</Text>
          ) : null}

          <View className="mt-6">
            <GradientButton title="+ Добавить заправку" onPress={() => router.push("/add-fuel")} />
            <GradientButton
              title="Назад"
              variant="ghost"
              className="mt-2"
              onPress={() => router.back()}
            />
          </View>
        </ScrollView>
      </CockpitBackground>
    </SafeAreaView>
  );
}

function FuelRow({
  entry,
  currency,
  onEdit,
  onDelete,
}: {
  entry: { id: string; fuelType: string; totalCost: number; liters: number; source: string };
  currency: ReturnType<typeof useResolvedCurrency>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable onPress={onEdit} onLongPress={onDelete} className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <View className="flex-row justify-between">
        <Text className="font-semibold text-white">{entry.fuelType}</Text>
        <Text className="font-bold text-amber-200">
          {formatCurrencyDisplay(entry.totalCost, currency)}
        </Text>
      </View>
      <Text className="mt-0.5 text-xs text-slate-500">
        {formatLiters(entry.liters)} · {entry.source === "ocr" ? "OCR" : "вручную"} · нажмите чтобы
        изменить
      </Text>
    </Pressable>
  );
}

function deleteEntry(
  id: string,
  label: string,
  remove: (id: string) => Promise<{ ok: boolean; error?: string }>,
  refresh: () => Promise<void>,
) {
  Alert.alert("Удалить?", label, [
    { text: "Отмена", style: "cancel" },
    {
      text: "Удалить",
      style: "destructive",
      onPress: () => {
        void (async () => {
          const r = await remove(id);
          if (!r.ok) Alert.alert("Ошибка", r.error ?? "Не удалось");
          else await refresh();
        })();
      },
    },
  ]);
}
