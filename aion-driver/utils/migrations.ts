import { KNOWN_ISO4217_CURRENCIES } from "../features/geo/generatedAlpha2ToCurrency";
import type { AppCurrencyCode } from "../types/device";
import type { ActiveShift, FuelEntry, IncomeEntry, Shift, UserProfile } from "../types";
import type { RentalEconomicsConfig, RentalPeriod } from "../types/rental";

const KNOWN_CUR = new Set<string>(KNOWN_ISO4217_CURRENCIES);

function parseStoredCurrency(raw: unknown): AppCurrencyCode | undefined {
  if (typeof raw !== "string") return undefined;
  const u = raw.toUpperCase();
  return KNOWN_CUR.has(u) ? (u as AppCurrencyCode) : undefined;
}

/** Миграция профиля с одного поля fuel* на бензин+газ */
function parseFuelEntries(raw: unknown): FuelEntry[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: FuelEntry[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    const addedAtMs = Number(o.addedAtMs);
    const fuelType = typeof o.fuelType === "string" ? o.fuelType : "unknown";
    const liters = Number(o.liters);
    const totalCost = Number(o.totalCost);
    const unitPrice = Number(o.unitPrice);
    const source = o.source === "manual" ? "manual" : "ocr";
    const conf = o.confidence == null ? undefined : Number(o.confidence);
    if (!id || !Number.isFinite(addedAtMs)) continue;
    if (!Number.isFinite(totalCost) || totalCost <= 0) continue;
    out.push({
      id,
      addedAtMs,
      fuelType,
      liters: Number.isFinite(liters) ? liters : 0,
      totalCost,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      confidence: conf != null && Number.isFinite(conf) ? conf : undefined,
      source,
    });
  }
  return out.length ? out : undefined;
}

function parseIncomeLedger(raw: unknown): IncomeEntry[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: IncomeEntry[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    const atMs = Number(o.atMs);
    const amount = Number(o.amount);
    if (!id || !Number.isFinite(atMs) || !Number.isFinite(amount) || amount <= 0) continue;
    out.push({ id, atMs, amount });
  }
  return out.length ? out : undefined;
}

function parseRentalEconomics(raw: unknown): RentalEconomicsConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const period: RentalPeriod =
    o.period === "week" || o.period === "month" ? o.period : "day";
  const amount = Number(o.amount);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  const depositAmount =
    o.depositAmount == null ? undefined : Number(o.depositAmount);
  const fixedOpsPerDay =
    o.fixedOpsPerDay == null ? undefined : Number(o.fixedOpsPerDay);
  return {
    enabled: o.enabled === true,
    period,
    amount,
    depositAmount:
      depositAmount != null && Number.isFinite(depositAmount)
        ? depositAmount
        : undefined,
    fixedOpsPerDay:
      fixedOpsPerDay != null && Number.isFinite(fixedOpsPerDay)
        ? fixedOpsPerDay
        : undefined,
  };
}

export function normalizeUserProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name : "";
  const carModel = typeof o.carModel === "string" ? o.carModel : "";

  if (
    typeof o.petrolConsumptionLPer100Km === "number" &&
    typeof o.petrolPricePerLiter === "number" &&
    typeof o.gasConsumptionLPer100Km === "number" &&
    typeof o.gasPricePerLiter === "number"
  ) {
    return {
      name,
      carModel,
      petrolConsumptionLPer100Km: o.petrolConsumptionLPer100Km,
      petrolPricePerLiter: o.petrolPricePerLiter,
      gasConsumptionLPer100Km: o.gasConsumptionLPer100Km,
      gasPricePerLiter: o.gasPricePerLiter,
      countryCode:
        typeof o.countryCode === "string" ? o.countryCode : undefined,
      currencyCode: parseStoredCurrency(o.currencyCode),
      rentalEconomics: parseRentalEconomics(o.rentalEconomics),
    };
  }

  const legacyC = Number(o.fuelConsumptionLPer100Km);
  const legacyP = Number(o.fuelPricePerLiter);
  if (
    !Number.isFinite(legacyC) ||
    legacyC <= 0 ||
    !Number.isFinite(legacyP) ||
    legacyP <= 0
  ) {
    return null;
  }

  return {
    name,
    carModel,
    petrolConsumptionLPer100Km: legacyC,
    petrolPricePerLiter: legacyP,
    gasConsumptionLPer100Km: Math.round(legacyC * 1.12 * 10) / 10,
    gasPricePerLiter: Math.max(1, Math.round(legacyP * 0.5 * 10) / 10),
  };
}

export function normalizeActiveShift(raw: unknown): ActiveShift | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const id = typeof s.id === "string" ? s.id : "";
  const startedAt = typeof s.startedAt === "string" ? s.startedAt : "";
  const distanceMeters = Number(s.distanceMeters) || 0;
  const totalIncome = Number(s.totalIncome) || 0;
  const lastAcceptedLat =
    s.lastAcceptedLat === null || s.lastAcceptedLat === undefined
      ? null
      : Number(s.lastAcceptedLat);
  const lastAcceptedLng =
    s.lastAcceptedLng === null || s.lastAcceptedLng === undefined
      ? null
      : Number(s.lastAcceptedLng);

  if (!id || !startedAt) return null;

  const paused = Boolean(s.paused);
  const pauseStartedAtMs =
    s.pauseStartedAtMs === null || s.pauseStartedAtMs === undefined
      ? null
      : Number(s.pauseStartedAtMs);
  const accumulatedPauseMs = Number(s.accumulatedPauseMs) || 0;
  const incomeEventsCount = Number(s.incomeEventsCount) || 0;
  const milestonesHit = Array.isArray(s.milestonesHit)
    ? (s.milestonesHit as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const fuelEntries = parseFuelEntries(s.fuelEntries);
  const incomeLedger = parseIncomeLedger(s.incomeLedger);
  const motionMovingMs = Number(s.motionMovingMs) || 0;
  const motionIdleMs = Number(s.motionIdleMs) || 0;

  const extras = {
    paused,
    pauseStartedAtMs:
      paused && pauseStartedAtMs != null && Number.isFinite(pauseStartedAtMs)
        ? pauseStartedAtMs
        : null,
    accumulatedPauseMs: Number.isFinite(accumulatedPauseMs) ? accumulatedPauseMs : 0,
    incomeEventsCount: Math.max(0, Math.floor(incomeEventsCount)),
    milestonesHit,
    fuelEntries,
    incomeLedger,
    motionMovingMs: Number.isFinite(motionMovingMs) ? Math.max(0, motionMovingMs) : 0,
    motionIdleMs: Number.isFinite(motionIdleMs) ? Math.max(0, motionIdleMs) : 0,
  };

  if (
    typeof s.distanceMetersPetrol === "number" &&
    typeof s.distanceMetersGas === "number" &&
    (s.activeFuelType === "petrol" || s.activeFuelType === "gas")
  ) {
    return {
      id,
      startedAt,
      distanceMeters,
      distanceMetersPetrol: s.distanceMetersPetrol,
      distanceMetersGas: s.distanceMetersGas,
      activeFuelType: s.activeFuelType,
      totalIncome,
      lastAcceptedLat:
        lastAcceptedLat !== null && Number.isFinite(lastAcceptedLat)
          ? lastAcceptedLat
          : null,
      lastAcceptedLng:
        lastAcceptedLng !== null && Number.isFinite(lastAcceptedLng)
          ? lastAcceptedLng
          : null,
      ...extras,
    };
  }

  return {
    id,
    startedAt,
    distanceMeters,
    distanceMetersPetrol: distanceMeters,
    distanceMetersGas: 0,
    activeFuelType: "petrol",
    totalIncome,
    lastAcceptedLat:
      lastAcceptedLat !== null && Number.isFinite(lastAcceptedLat)
        ? lastAcceptedLat
        : null,
    lastAcceptedLng:
      lastAcceptedLng !== null && Number.isFinite(lastAcceptedLng)
        ? lastAcceptedLng
        : null,
    ...extras,
  };
}

export function normalizeShiftRecord(raw: unknown): Shift | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  if (!id) return null;
  const startedAt = typeof o.startedAt === "string" ? o.startedAt : "";
  const endedAt = typeof o.endedAt === "string" ? o.endedAt : "";
  const durationMs = Number(o.durationMs) || 0;
  const distanceKm = Number(o.distanceKm) || 0;
  const income = Number(o.income) || 0;
  const netProfit = Number(o.netProfit) || 0;
  const profitPerHour = Number(o.profitPerHour) || 0;
  const profitPerKm = Number(o.profitPerKm) || 0;

  const gpsExtras = {
    rentalCostAccrued:
      o.rentalCostAccrued == null ? undefined : Number(o.rentalCostAccrued),
    fixedOpsCost: o.fixedOpsCost == null ? undefined : Number(o.fixedOpsCost),
    netProfitAfterCosts:
      o.netProfitAfterCosts == null ? undefined : Number(o.netProfitAfterCosts),
    profitPerHourAfterCosts:
      o.profitPerHourAfterCosts == null ? undefined : Number(o.profitPerHourAfterCosts),
    gpsPointCount: o.gpsPointCount == null ? undefined : Number(o.gpsPointCount),
    gpsStopCount: o.gpsStopCount == null ? undefined : Number(o.gpsStopCount),
  };

  if (typeof o.fuelCostTotal === "number") {
    return {
      id,
      startedAt,
      endedAt,
      durationMs,
      distanceKm: Number(o.distanceKm) || 0,
      distanceKmPetrol: Number(o.distanceKmPetrol) || 0,
      distanceKmGas: Number(o.distanceKmGas) || 0,
      income,
      fuelUsedPetrolLiters: Number(o.fuelUsedPetrolLiters) || 0,
      fuelUsedGasLiters: Number(o.fuelUsedGasLiters) || 0,
      fuelCostPetrol: Number(o.fuelCostPetrol) || 0,
      fuelCostGas: Number(o.fuelCostGas) || 0,
      fuelCostTotal: Number(o.fuelCostTotal) || 0,
      gasSavingsRub: Number(o.gasSavingsRub) || 0,
      netProfit,
      profitPerHour,
      profitPerKm,
      ...gpsExtras,
    };
  }

  const legacyFuel = Number(o.fuelUsedLiters) || 0;
  const legacyCost = Number(o.fuelCost) || 0;

  return {
    id,
    startedAt,
    endedAt,
    durationMs,
    distanceKm,
    distanceKmPetrol: distanceKm,
    distanceKmGas: 0,
    income,
    fuelUsedPetrolLiters: legacyFuel,
    fuelUsedGasLiters: 0,
    fuelCostPetrol: legacyCost,
    fuelCostGas: 0,
    fuelCostTotal: legacyCost,
    gasSavingsRub: 0,
    netProfit,
    profitPerHour,
    profitPerKm,
    ...gpsExtras,
  };
}
