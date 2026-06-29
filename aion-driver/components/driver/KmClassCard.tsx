import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { buildMapsIntelligenceSnapshot } from "../../features/intelligence/buildMapsFuelIntelligence";
import { finalizeOrderWindows } from "../../features/intelligence/orderWindowReducer";
import type { OrderActivityWindow } from "../../features/intelligence/classifyKilometers";
import type { KilometerClass } from "../../features/intelligence/contracts/mapsFuelIntelligence";
import { loadOrderWindowState } from "../../storage/driver/orderWindowStorage";

const CLASS_LABEL: Record<KilometerClass, string> = {
  on_order: "Заказ",
  pickup: "Подача",
  empty: "Порожняк",
  personal: "Личное",
};

type Pt = { t: number; dM?: number | null };

/**
 * Разбивка километров смены по классам (заказ/подача/порожняк/личное) на основе
 * ручных отметок заказа. Только реальные данные: нет отметок → честная подсказка.
 */
export function KmClassCard({
  shiftId,
  points,
  shiftStartMs,
  shiftEndMs,
}: {
  shiftId: string;
  points: readonly Pt[];
  shiftStartMs: number;
  shiftEndMs: number;
}) {
  const [windows, setWindows] = useState<OrderActivityWindow[] | null>(null);

  useEffect(() => {
    let alive = true;
    void loadOrderWindowState(shiftId).then((s) => {
      if (alive) setWindows(finalizeOrderWindows(s, shiftEndMs));
    });
    return () => {
      alive = false;
    };
  }, [shiftId, shiftEndMs]);

  const snapshot = useMemo(
    () =>
      windows == null
        ? null
        : buildMapsIntelligenceSnapshot({
            shiftId,
            points,
            classification: windows.length
              ? { orderWindows: windows, shiftStartMs, shiftEndMs }
              : undefined,
          }),
    [windows, shiftId, points, shiftStartMs, shiftEndMs],
  );

  if (!snapshot) return null;
  const classified = snapshot.kilometerClasses.filter(
    (k) => k.status === "classified" && k.class != null,
  );

  if (!classified.length) {
    return (
      <Text className="mt-2 text-[10px] text-slate-600">
        Классы км появятся, если в смене отмечать «Подача / Везу / Высадил».
      </Text>
    );
  }

  return (
    <View className="mt-2">
      <Text className="text-[10px] uppercase tracking-widest text-cyan-300/70">
        Километры по классам
      </Text>
      <View className="mt-1 flex-row flex-wrap gap-x-3 gap-y-0.5">
        {classified.map((k) => (
          <Text key={k.class} className="text-[10px] text-slate-400">
            {CLASS_LABEL[k.class!]}: {((k.distanceMeters ?? 0) / 1000).toFixed(1)} км
          </Text>
        ))}
      </View>
    </View>
  );
}
