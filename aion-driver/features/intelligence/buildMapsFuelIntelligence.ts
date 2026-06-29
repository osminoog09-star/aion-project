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
import { classifyKilometers, type OrderActivityWindow } from "./classifyKilometers";

type GpsPointLike = { t?: number; dM?: number | null };

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
  /** Окна активности заказа из рантайма (driver-события). Без них классы = unclassified. */
  classification?: {
    orderWindows: readonly OrderActivityWindow[];
    shiftStartMs: number;
    shiftEndMs: number;
  };
  nowMs?: number;
}): MapsIntelligenceSnapshot {
  const points = input.points ?? [];
  const gpsPointCount = points.length;
  const summed = points.reduce(
    (sum, p) => sum + (finitePositive(p.dM ?? null) ?? 0),
    0,
  );
  const routeDistanceMeters = gpsPointCount > 0 && summed > 0 ? round2(summed) : null;

  const kilometerClasses: KilometerClassification[] = input.classification
    ? classifyKilometers({
        points: points.map((p) => ({ t: p.t ?? 0, dM: p.dM ?? null })),
        orderWindows: input.classification.orderWindows,
        shiftStartMs: input.classification.shiftStartMs,
        shiftEndMs: input.classification.shiftEndMs,
      })
    : routeDistanceMeters != null
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
    // Публикуемо, только если есть реально классифицированные км.
    publishable: kilometerClasses.some((k) => k.status === "classified"),
  };
}

/**
 * Распределение подтверждённого топлива по классам км — пропорционально дистанции класса.
 * Только реальные классифицированные км; без топлива/классов — "unallocated" (не выдумываем).
 */
export function allocateFuelByKmClass(
  kilometerClasses: readonly KilometerClassification[],
  confirmedFuelCost: number | null | undefined,
  fuelEntryIds: readonly string[] = [],
): FuelCostAllocation[] {
  const classified = kilometerClasses.filter(
    (k) => k.status === "classified" && k.class != null && (k.distanceMeters ?? 0) > 0,
  );
  const cost = finitePositive(confirmedFuelCost ?? null);
  const totalKm = classified.reduce((sum, k) => sum + (k.distanceMeters ?? 0), 0);
  const canAllocate = classified.length > 0 && cost != null && totalKm > 0;
  return classified.map((k) => ({
    status: canAllocate ? "allocated" : "unallocated",
    kilometerClass: k.class,
    fuelEntryIds: [...fuelEntryIds],
    distanceMeters: k.distanceMeters,
    allocatedCost: canAllocate
      ? round2(cost! * ((k.distanceMeters ?? 0) / totalKm))
      : null,
  }));
}

export function buildFuelIntelligenceSnapshot(input: {
  shiftId: string;
  gpsPointCount: number;
  fuelEntryIds?: readonly string[];
  confirmedFuelCost?: number | null;
  routeDistanceMeters?: number | null;
  /** Классифицированные км (из buildMapsIntelligenceSnapshot) — для разбивки топлива по классам. */
  kilometerClasses?: readonly KilometerClassification[];
  nowMs?: number;
}): FuelIntelligenceSnapshot {
  const confirmedFuelCost = finitePositive(input.confirmedFuelCost ?? null);
  const routeDistanceMeters = finitePositive(input.routeDistanceMeters ?? null);
  const costPer100Km =
    confirmedFuelCost != null && routeDistanceMeters != null
      ? round2((confirmedFuelCost / (routeDistanceMeters / 1000)) * 100)
      : null;

  // ₽/100км — из реальных данных. Разбивка по классам — только если есть классы заказа.
  const hasClasses =
    input.kilometerClasses?.some((k) => k.status === "classified") ?? false;
  const allocations: FuelCostAllocation[] = hasClasses
    ? allocateFuelByKmClass(
        input.kilometerClasses ?? [],
        confirmedFuelCost,
        input.fuelEntryIds ?? [],
      )
    : confirmedFuelCost != null
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
