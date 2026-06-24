/**
 * Классификатор километров по классам заказ/подача/порожняк/личное
 * (roadmap maps-gps-intelligence, этап «GPS Intelligence»).
 *
 * Чистая функция. Источник истины — окна активности заказа (`OrderActivityWindow`),
 * которые рантайм формирует из driver-событий (взял заказ / подача / высадка).
 * Принцип роудмапа: нет сигнала заказов → честно `unclassified`, ничего не выдумываем.
 *
 * Тест: scripts/ci/test-classify-kilometers.mjs
 */
import type {
  KilometerClass,
  KilometerClassification,
} from "./contracts/mapsFuelIntelligence";

export type OrderActivityWindow = {
  /** on_order — пассажир в машине; pickup — едем за пассажиром. */
  kind: "on_order" | "pickup";
  startMs: number;
  endMs: number;
};

type PointLike = { t: number; dM?: number | null };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function segMeters(p: PointLike): number {
  const d = p.dM;
  return typeof d === "number" && Number.isFinite(d) && d > 0 ? d : 0;
}

function classOf(
  tMs: number,
  windows: readonly OrderActivityWindow[],
  shiftStartMs: number,
  shiftEndMs: number,
): KilometerClass {
  for (const w of windows) {
    if (tMs >= w.startMs && tMs < w.endMs) return w.kind;
  }
  if (tMs >= shiftStartMs && tMs <= shiftEndMs) return "empty";
  return "personal";
}

const CLASS_ORDER: KilometerClass[] = ["on_order", "pickup", "empty", "personal"];

export function classifyKilometers(input: {
  points: readonly PointLike[];
  orderWindows: readonly OrderActivityWindow[];
  shiftStartMs: number;
  shiftEndMs: number;
}): KilometerClassification[] {
  const { points, orderWindows, shiftStartMs, shiftEndMs } = input;

  // Без окон заказов нельзя честно отделить заказ/подачу/порожняк — отдаём unclassified.
  if (!orderWindows.length) {
    const total = points.reduce((sum, p) => sum + segMeters(p), 0);
    return total > 0
      ? [
          {
            status: "unclassified",
            class: null,
            distanceMeters: round2(total),
            evidence: null,
          },
        ]
      : [];
  }

  const byClass = new Map<KilometerClass, number>();
  for (const p of points) {
    const meters = segMeters(p);
    if (meters <= 0) continue;
    const cls = classOf(p.t, orderWindows, shiftStartMs, shiftEndMs);
    byClass.set(cls, (byClass.get(cls) ?? 0) + meters);
  }

  return CLASS_ORDER.filter((c) => (byClass.get(c) ?? 0) > 0).map((c) => ({
    status: "classified",
    class: c,
    distanceMeters: round2(byClass.get(c)!),
    evidence: "driver_event",
  }));
}
