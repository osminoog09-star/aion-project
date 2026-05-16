import type { OcrEngineResult } from "../../ocr/types";
import type {
  OcrAnalyticsSummary,
  OcrParseResult,
  OcrTripRow,
} from "../types";

function analyticsFromTrips(
  trips: OcrTripRow[],
  hoursOnline: number,
): OcrAnalyticsSummary | null {
  if (!trips.length) return null;
  const totalIncome = Math.round(trips.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const n = trips.length;
  const bestOrder = trips.reduce((m, t) => Math.max(m, t.amount), 0);
  const avgTripConf =
    trips.reduce((s, t) => s + t.confidence, 0) / Math.max(1, n);
  let estimatedKm: number | null = null;
  const kmSum = trips.reduce((s, t) => s + (t.distanceKm ?? 0), 0);
  if (kmSum > 0) estimatedKm = Math.round(kmSum * 10) / 10;
  const earningsPerHour =
    hoursOnline > 0.05
      ? Math.round((totalIncome / hoursOnline) * 100) / 100
      : null;
  return {
    tripCount: n,
    totalIncome,
    avgOrder: Math.round((totalIncome / n) * 100) / 100,
    bestOrder: Math.round(bestOrder * 100) / 100,
    earningsPerHour,
    estimatedKm,
    avgTripConfidence: Math.round(avgTripConf * 1000) / 1000,
  };
}

/** После ручной правки сумм в ленте поездок — пересчитать агрегаты без повторного OCR. */
export function recomputeOcrParseTotals(
  base: OcrParseResult,
  trips: OcrTripRow[],
): OcrParseResult {
  const tripSum = Math.round(trips.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const totalIncome = Math.round((tripSum + base.tips + base.bonus) * 100) / 100;
  const netProfit =
    Math.round((totalIncome - base.estimatedFuelCost) * 100) / 100;
  const analytics = analyticsFromTrips(trips, base.hoursOnline);
  const origAmounts = base.trips.map((t) => t.amount).join(",");
  const nextAmounts = trips.map((t) => t.amount).join(",");
  const amountsChanged = origAmounts !== nextAmounts;
  return {
    ...base,
    trips,
    tripCount: trips.length,
    analytics,
    earnings: totalIncome,
    netProfit,
    tripAmountsAdjustedByUser: amountsChanged ? true : base.tripAmountsAdjustedByUser,
    normalizedSourceText: base.normalizedSourceText,
    fuelReceipt: base.fuelReceipt,
    dashboardCluster: base.dashboardCluster,
  };
}

export function ocrEngineResultToParse(
  e: OcrEngineResult,
  batchSourceUris?: string[],
): OcrParseResult {
  const tripSum =
    e.analytics?.totalIncome ??
    Math.round(e.trips.reduce((s: number, t: OcrTripRow) => s + t.amount, 0) * 100) / 100;
  const totalIncome = Math.round((tripSum + e.tips + e.bonus) * 100) / 100;
  const hoursOnline = e.hoursOnline ?? 0;
  const estimatedFuelCost = 0;
  const netProfit =
    Math.round((totalIncome - estimatedFuelCost) * 100) / 100;

  return {
    platform: e.platform,
    trips: e.trips,
    globalConfidence: e.globalConfidence,
    needsEditMode: e.needsEditMode,
    analytics: e.analytics,
    textSource: e.textSource,
    notes: e.notes,
    batchSourceUris,
    earnings: totalIncome,
    tips: e.tips,
    bonus: e.bonus,
    hoursOnline,
    tripCount: e.trips.length,
    estimatedFuelCost,
    netProfit,
    currencyCode: e.currencyCode,
    confidence: e.globalConfidence,
    modelVersion: e.modelVersion,
  };
}
