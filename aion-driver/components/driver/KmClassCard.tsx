import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import {
  allocateFuelByKmClass,
  buildMapsIntelligenceSnapshot,
} from "../../features/intelligence/buildMapsFuelIntelligence";
import { finalizeOrderWindows } from "../../features/intelligence/orderWindowReducer";
import type { OrderActivityWindow } from "../../features/intelligence/classifyKilometers";
import type { KilometerClass } from "../../features/intelligence/contracts/mapsFuelIntelligence";
import { loadOrderWindowState } from "../../storage/driver/orderWindowStorage";
import { formatCurrencyDisplay } from "../../utils/formatting";
import type { AppCurrencyCode } from "../../types/device";

const CLASS_LABEL: Record<KilometerClass, string> = {
  on_order: "Заказ",
  pickup: "Подача",
  empty: "Порожняк",
  personal: "Личное",
};

type Pt = { t: number; dM?: number | null };

/**
 * Разбивка километров (и топливных денег) смены по классам заказ/подача/порожняк/личное
 * на основе ручных отметок заказа. Только реальные данные: нет отметок → честная подсказка.
 */
export function KmClassCard({
  shiftId,
  points,
  shiftStartMs,
  shiftEndMs,
  fuelCost,
  currency,
}: {
  shiftId: string;
  points: readonly Pt[];
  shiftStartMs: number;
  shiftEndMs: number;
  fuelCost?: number | null;
  currency: AppCurrencyCode;
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

  const classified = useMemo(
    () =>
      (snapshot?.kilometerClasses ?? []).filter(
        (k) => k.status === "classified" && k.class != null,
      ),
    [snapshot],
  );

  const costByClass = useMemo(() => {
    const map: Partial<Record<KilometerClass, number>> = {};
    for (const a of allocateFuelByKmClass(classified, fuelCost ?? null)) {
      if (a.kilometerClass != null && a.allocatedCost != null) {
        map[a.kilometerClass] = a.allocatedCost;
      }
    }
    return map;
  }, [classified, fuelCost]);

  if (!snapshot) return null;

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
      <View className="mt-1 gap-0.5">
        {classified.map((k) => {
          const cost = costByClass[k.class!];
          return (
            <Text key={k.class} className="text-[10px] text-slate-400">
              {CLASS_LABEL[k.class!]}: {((k.distanceMeters ?? 0) / 1000).toFixed(1)} км
              {cost != null ? ` · ${formatCurrencyDisplay(cost, currency)}` : ""}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
