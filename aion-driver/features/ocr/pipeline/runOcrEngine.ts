import type { OcrTripRow, PayoutPlatform } from "../../import/types";
import { mergeTripLists } from "../batch/mergeTrips";
import { detectPlatformFromText } from "../platforms/detectPlatform";
import {
  scanTripsFromLines,
  extractHoursOnline,
  extractTipsBonus,
} from "../parsers/common";
import { pickPrimaryStatementTotal } from "../parsers/statementTotals";
import type {
  OcrAnalyticsSummary,
  OcrEngineResult,
  OcrTextSource,
} from "../types";

function aggregate(
  trips: OcrTripRow[],
  hoursOnline: number | null,
  _tips: number,
  _bonus: number,
): OcrAnalyticsSummary | null {
  if (!trips.length) return null;
  const totalIncome = trips.reduce((s, t) => s + t.amount, 0);
  const n = trips.length;
  const bestOrder = trips.reduce((m, t) => Math.max(m, t.amount), 0);
  const avgTripConf =
    trips.reduce((s, t) => s + t.confidence, 0) / Math.max(1, n);
  let estimatedKm: number | null = null;
  const kmSum = trips.reduce((s, t) => s + (t.distanceKm ?? 0), 0);
  if (kmSum > 0) estimatedKm = Math.round(kmSum * 10) / 10;
  const earningsPerHour =
    hoursOnline != null && hoursOnline > 0.05
      ? Math.round((totalIncome / hoursOnline) * 100) / 100
      : null;
  return {
    tripCount: n,
    totalIncome: Math.round(totalIncome * 100) / 100,
    avgOrder: Math.round((totalIncome / n) * 100) / 100,
    bestOrder: Math.round(bestOrder * 100) / 100,
    earningsPerHour,
    estimatedKm,
    avgTripConfidence: Math.round(avgTripConf * 1000) / 1000,
  };
}

function globalConfidence(trips: OcrTripRow[]): number {
  if (!trips.length) return 0;
  const avg = trips.reduce((s, t) => s + t.confidence, 0) / trips.length;
  return Math.min(0.99, Math.round(avg * 1000) / 1000);
}

export interface RunOcrEngineInput {
  normalizedText: string;
  platformHint?: PayoutPlatform;
  currencyFallback: string;
  textSource: OcrTextSource;
}

/**
 * Полный разбор: детект платформы → поездки → аналитика.
 */
export function runOcrEngineOnText(input: RunOcrEngineInput): OcrEngineResult {
  const platform = detectPlatformFromText(
    input.normalizedText,
    input.platformHint,
  );
  const trips = scanTripsFromLines(
    input.normalizedText,
    platform,
    input.currencyFallback,
  );
  const { tips, bonus } = extractTipsBonus(input.normalizedText);
  const hoursOnline = extractHoursOnline(input.normalizedText);
  let g = globalConfidence(trips);
  const analytics = aggregate(trips, hoursOnline, tips, bonus);
  const lowTripConfidence = g < 0.55 || trips.some((t) => t.confidence < 0.5);
  let needsEditMode = lowTripConfidence;
  const notes: string[] = [];
  if (!trips.length) {
    notes.push(
      "Поездки не найдены: проверьте, что текст содержит суммы по строкам (после OCR или вставки из буфера).",
    );
  }
  if (trips.length >= 2) {
    const cents = trips.map((t) => Math.round(t.amount * 100));
    const freq = new Map<number, number>();
    for (const c of cents) {
      freq.set(c, (freq.get(c) ?? 0) + 1);
    }
    let maxSame = 0;
    for (const c of freq.values()) maxSame = Math.max(maxSame, c);
    if (maxSame >= 2) {
      notes.push("Повторяющиеся суммы в строках — проверьте дубликаты поездок.");
      needsEditMode = true;
    }
  }
  const tripSum = Math.round(trips.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const statementTotal = pickPrimaryStatementTotal(input.normalizedText);
  if (trips.length && tripSum > 0.5 && statementTotal != null && statementTotal > 0.5) {
    const ratio = statementTotal / tripSum;
    if (ratio < 0.74 || ratio > 1.32) {
      notes.push(
        `Итог в тексте (~${statementTotal.toFixed(2)}) заметно расходится с суммой поездок (${tripSum.toFixed(2)}). Проверьте дубликаты и фильтры.`,
      );
      needsEditMode = true;
      g = Math.max(0.12, Math.round((g - 0.12) * 1000) / 1000);
    } else if (ratio >= 0.94 && ratio <= 1.07) {
      g = Math.min(0.96, Math.round((g + 0.05) * 1000) / 1000);
    }
  }
  if (lowTripConfidence && trips.length) {
    notes.push("Низкая уверенность строк: проверьте суммы и количество поездок.");
  }
  const primaryCurrency =
    trips[0]?.currencyCode ?? input.currencyFallback.toUpperCase();

  return {
    platform,
    trips,
    globalConfidence: g,
    needsEditMode,
    analytics,
    tips,
    bonus,
    hoursOnline,
    currencyCode: primaryCurrency,
    modelVersion: "aion-ocr-engine/2.1",
    textSource: input.textSource,
    notes,
  };
}

/**
 * Объединяет результаты разбора по нескольким скриншотам: дедуп поездок, консервативный max по
 * чаевым/бонусам/часам онлайн между кадрами (снижает двойной учёт одних и тех же итогов).
 */
export function mergeOcrEngineBatch(parts: OcrEngineResult[]): OcrEngineResult | null {
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0]!;
  const trips = mergeTripLists(parts.map((p) => p.trips));
  const tips = Math.max(0, ...parts.map((p) => p.tips));
  const bonus = Math.max(0, ...parts.map((p) => p.bonus));
  const hourCandidates = parts
    .map((p) => p.hoursOnline)
    .filter((h): h is number => h != null && Number.isFinite(h) && h > 0);
  const hoursOnline = hourCandidates.length ? Math.max(...hourCandidates) : null;
  const lead = parts.reduce((a, b) => (a.trips.length >= b.trips.length ? a : b));
  const platform = lead.platform;
  const g = globalConfidence(trips);
  const analytics = aggregate(trips, hoursOnline, tips, bonus);
  const needsEditMode = g < 0.55 || trips.some((t) => t.confidence < 0.5);
  const noteSet = new Set<string>();
  for (const p of parts) {
    for (const n of p.notes) noteSet.add(n);
  }
  noteSet.add(
    "Несколько снимков: поездки объединены и дедуплицированы; чаевые, бонусы и часы онлайн — max по кадрам (проверьте итог).",
  );
  const primaryCurrency = trips[0]?.currencyCode ?? lead.currencyCode;
  return {
    platform,
    trips,
    globalConfidence: g,
    needsEditMode,
    analytics,
    tips,
    bonus,
    hoursOnline,
    currencyCode: primaryCurrency,
    modelVersion: "aion-ocr-engine/2.1",
    textSource: "on_device_engine",
    notes: [...noteSet],
  };
}
