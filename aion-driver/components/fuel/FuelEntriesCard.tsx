import { router } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { GlowCard } from "../ui/GlowCard";
import { GradientButton } from "../ui/GradientButton";
import { useShift } from "../../hooks/useShift";
import { useResolvedCurrency } from "../../hooks/useResolvedCurrency";
import { formatCurrencyDisplay, formatLiters } from "../../utils/formatting";

export function FuelEntriesCard() {
  const {
    activeShift,
    pendingFuelEntries,
    removeFuelEntry,
    refreshPendingFuel,
  } = useShift();
  const currency = useResolvedCurrency();

  const entries = activeShift?.fuelEntries?.length
    ? activeShift.fuelEntries
    : pendingFuelEntries;

  if (!entries?.length) return null;

  const scope = activeShift ? "смена" : "ожидает смены";

  return (
    <GlowCard glow="violet" className="mb-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Заправки · {scope}
        </Text>
        <Pressable onPress={() => router.push("/fuel-journal")}>
          <Text className="text-[11px] font-semibold text-amber-300">Все →</Text>
        </Pressable>
      </View>
      <Text className="mt-1 text-[11px] text-slate-500">
        Ошиблись с суммой? Нажмите запись — исправить или удалить.
      </Text>
      <View className="mt-3 gap-2">
        {entries.slice(0, 4).map((e) => (
          <Pressable
            key={e.id}
            onPress={() =>
              router.push({ pathname: "/edit-fuel", params: { id: e.id } })
            }
            onLongPress={() => {
              Alert.alert("Удалить заправку?", `${e.fuelType} · ${e.totalCost}`, [
                { text: "Отмена", style: "cancel" },
                {
                  text: "Удалить",
                  style: "destructive",
                  onPress: () => {
                    void (async () => {
                      const r = await removeFuelEntry(e.id);
                      if (!r.ok) Alert.alert("Ошибка", r.error ?? "Не удалось");
                      else await refreshPendingFuel();
                    })();
                  },
                },
              ]);
            }}
            className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-white">{e.fuelType}</Text>
              <Text className="text-sm font-bold text-amber-200">
                {formatCurrencyDisplay(e.totalCost, currency)}
              </Text>
            </View>
            <Text className="mt-0.5 text-xs text-slate-500">
              {formatLiters(e.liters)} · {e.source === "ocr" ? "OCR" : "вручную"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-3 flex-row gap-2">
        <View className="flex-1">
          <GradientButton
            title="+ Заправка"
            variant="glass"
            onPress={() => router.push("/add-fuel")}
          />
        </View>
        <View className="flex-1">
          <GradientButton
            title="Журнал"
            variant="ghost"
            onPress={() => router.push("/fuel-journal")}
          />
        </View>
      </View>
    </GlowCard>
  );
}
