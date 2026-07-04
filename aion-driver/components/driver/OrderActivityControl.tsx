import { Pressable, Text, View } from "react-native";
import { useOrderActivity } from "../../hooks/useOrderActivity";

type PillKind = "pickup" | "on_order" | "end";

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-1 rounded-xl border px-3 py-2 active:opacity-80 ${
        active
          ? "border-cyan-400/50 bg-cyan-500/15"
          : "border-white/10 bg-white/5"
      }`}
    >
      <Text
        className={`text-center text-xs font-semibold ${
          active ? "text-cyan-100" : "text-slate-300"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Ручная отметка заказа на дашборде: подача → везу → высадил.
 * Пишет окна активности в orderWindowStorage; их потом читает классификатор км.
 */
export function OrderActivityControl({ shiftId }: { shiftId: string | null }) {
  const { activeKind, windowCount, beginPickup, beginOnOrder, endActivity } =
    useOrderActivity(shiftId);

  const status: Record<PillKind | "idle", string> = {
    idle: "Нет активного заказа",
    pickup: "Еду за пассажиром",
    on_order: "Везу пассажира",
    end: "",
  };

  return (
    <View className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Заказ
        </Text>
        <Text className="text-[10px] text-slate-500">
          {activeKind ? status[activeKind] : status.idle}
        </Text>
      </View>
      <View className="mt-2 flex-row gap-2">
        <Pill label="Подача" active={activeKind === "pickup"} onPress={beginPickup} />
        <Pill label="Везу" active={activeKind === "on_order"} onPress={beginOnOrder} />
        <Pill label="Высадил" active={false} onPress={endActivity} />
      </View>
      <Text className="mt-2 text-[10px] text-slate-500">
        {windowCount > 0
          ? `Отмечено отрезков за смену: ${windowCount}`
          : "Можно голосом: кнопка «Голос» → скажите «подача», «везу» или «высадил»."}
      </Text>
    </View>
  );
}
