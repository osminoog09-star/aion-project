/**
 * Производители снапшотов Maps/Fuel intelligence из РЕАЛЬНЫХ данных смены.
 * Реализует контракт ./contracts/mapsFuelIntelligence (roadmap: maps-gps-intelligence).
 *
 * Принцип роудмапа — «absent data stays absent», без выдуманных метрик:
 *  - дистанция берётся из реальных GPS-точек (поле dM), иначе null;
 *  - классы км (заказ/подача/порожняк/личное) остаются "unclassified", пока нет
 *    driver-событий / platform-импорта (такого сигнала в рантайме пока нет);
 *  - ₽/100 км публикуем, только если есть и подтверждённое топливо, и реальная дистанция;
 *  - per-class распределение топлива остаётся "unallocated" (нет evidence по классам).
 *
 * Чистые функции — тест scripts/ci/test-maps-fuel-intelligence.mjs.
 */
import type {
  FuelCostAllocation,
  FuelIntelligenceSnapshot,
  KilometerClassification,
  MapsIntelligenceSnapshot,
  RealDataProvenance,
} from "./contracts/mapsFuelIntelligence";

type GpsPointLike = { dM?: number | null };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function finitePositive(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

function provenance(input: {
  shiftId: string;
  gpsPointCount: number;
  fuelEntryIds?: readonly string[];
  nowMs?: number;
}): RealDataProvenance {
  return {
    shiftId: input.shiftId,
    gpsPointCount: input.gpsPointCount,
    fuelEntryIds: [...(input.fuelEntryIds ?? [])],
    generatedAtMs: input.nowMs ?? Date.now(),
  };
}

export function buildMapsIntelligenceSnapshot(input: {
  shiftId: string;
  points?: readonly GpsPointLike[] | null;
  fuelEntryIds?: readonly string[];
  nowMs?: number;
}): MapsIntelligenceSnapshot {
  const points = input.points ?? [];
  const gpsPointCount = points.length;
  const summed = points.reduce(
    (sum, p) => sum + (finitePositive(p.dM ?? null) ?? 0),
    0,
  );
  const routeDistanceMeters = gpsPointCount > 0 && summed > 0 ? round2(summed) : null;

  // Нет потока driver-событий/импорта классов → классификация недоступна, не выдумываем.
  const kilometerClasses: KilometerClassification[] =
    routeDistanceMeters != null
      ? [
          {
            status: "unclassified",
            class: null,
            distanceMeters: routeDistanceMeters,
            evidence: null,
          },
        ]
      : [];

  return {
    schemaVersion: 1,
    provenance: provenance({ ...input, gpsPointCount }),
    routeDistanceMeters,
    kilometerClasses,
    // Публиковать классы пока нечего (всё unclassified).
    publishable: false,
  };
}

export function buildFuelIntelligenceSnapshot(input: {
  shiftId: string;
  gpsPointCount: number;
  fuelEntryIds?: readonly string[];
  confirmedFuelCost?: number | null;
  routeDistanceMeters?: number | null;
  nowMs?: number;
}): FuelIntelligenceSnapshot {
  const confirmedFuelCost = finitePositive(input.confirmedFuelCost ?? null);
  const routeDistanceMeters = finitePositive(input.routeDistanceMeters ?? null);
  const costPer100Km =
    confirmedFuelCost != null && routeDistanceMeters != null
      ? round2((confirmedFuelCost / (routeDistanceMeters / 1000)) * 100)
      : null;

  // Реальное ₽/100км публикуем; разбивку по классам — нет (нет evidence по классам).
  const allocations: FuelCostAllocation[] =
    confirmedFuelCost != null
      ? [
          {
            status: "unallocated",
            kilometerClass: null,
            fuelEntryIds: [...(input.fuelEntryIds ?? [])],
            distanceMeters: routeDistanceMeters,
            allocatedCost: null,
          },
        ]
      : [];

  return {
    schemaVersion: 1,
    provenance: provenance(input),
    confirmedFuelCost,
    allocations,
    costPer100Km,
    publishable: costPer100Km != null,
  };
}
