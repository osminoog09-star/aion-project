export type FuelKind = "petrol" | "gas";

import type { AppCurrencyCode } from "./device";
import type { RentalEconomicsConfig } from "./rental";

/** Подтверждённая заправка (OCR / ручной ввод), влияет на fuelTotal смены. */
export type FuelEntrySource = "ocr" | "manual";

export interface FuelEntry {
  id: string;
  addedAtMs: number;
  fuelType: string;
  liters: number;
  totalCost: number;
  unitPrice: number;
  confidence?: number;
  source: FuelEntrySource;
}

export interface IncomeEntry {
  id: string;
  atMs: number;
  amount: number;
}

export interface GPSPoint {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: number;
}

/** Бензин + газ (LPG/CNG), л/100 км и цена за литр (символ валюты — из настроек). */
export interface UserProfile {
  name: string;
  carModel: string;
  petrolConsumptionLPer100Km: number;
  petrolPricePerLiter: number;
  gasConsumptionLPer100Km: number;
  gasPricePerLiter: number;
  /** ISO 3166-1 alpha-2, дублирует device при онбординге */
  countryCode?: string;
  /** ISO 4217 (полный набор из гео-датасета) */
  currencyCode?: AppCurrencyCode;
  /** Аренда и фикс. расходы — влияют на profitAfterCosts при включении. */
  rentalEconomics?: RentalEconomicsConfig;
}

export interface Shift {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  distanceKm: number;
  distanceKmPetrol: number;
  distanceKmGas: number;
  income: number;
  fuelUsedPetrolLiters: number;
  fuelUsedGasLiters: number;
  fuelCostPetrol: number;
  fuelCostGas: number;
  fuelCostTotal: number;
  /** Экономия на км, пройденных на газу: стоимость тех же км на бензине минус фактический газ */
  gasSavingsRub: number;
  netProfit: number;
  profitPerHour: number;
  profitPerKm: number;
  /** Снимок на конец смены (если rental был включён). */
  rentalCostAccrued?: number;
  fixedOpsCost?: number;
  netProfitAfterCosts?: number;
  profitPerHourAfterCosts?: number;
  /** GPS trip store (реальные точки смены). */
  gpsPointCount?: number;
  gpsStopCount?: number;
}

export interface ActiveShift {
  id: string;
  startedAt: string;
  /** Суммарный пробег по GPS (м) */
  distanceMeters: number;
  distanceMetersPetrol: number;
  distanceMetersGas: number;
  activeFuelType: FuelKind;
  totalIncome: number;
  lastAcceptedLat: number | null;
  lastAcceptedLng: number | null;
  /** Пауза смены: GPS и «живое» время останавливаются */
  paused?: boolean;
  /** Когда началась текущая пауза (epoch ms), если paused */
  pauseStartedAtMs?: number | null;
  /** Накопленная длительность завершённых пауз (ms) */
  accumulatedPauseMs?: number;
  /** Сколько раз добавляли доход за сессию (прокси «трипов» / серий) */
  incomeEventsCount?: number;
  /** Id вех, уже зафиксированных в этой смене */
  milestonesHit?: string[];
  /** Фактические заправки за смену (сумма totalCost идёт в топливо при расчёте прибыли). */
  fuelEntries?: FuelEntry[];
  /** Гранулярные начисления дохода (дублирует агрегат totalIncome). */
  incomeLedger?: IncomeEntry[];
  /** Накопленное время в движении по тику motionState (мс). */
  motionMovingMs?: number;
  /** Накопленное время «стоим» по тику motionState (мс). */
  motionIdleMs?: number;
}

export interface AppState {
  profile: UserProfile | null;
  activeShift: ActiveShift | null;
  shiftHistory: Shift[];
}
