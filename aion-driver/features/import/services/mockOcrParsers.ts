import type { OcrParseResult, OcrTripRow, PayoutPlatform } from "../types";

function hash(uri: string): number {
  let h = 2166136261;
  for (let i = 0; i < uri.length; i++) {
    h ^= uri.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function scale(n: number, min: number, max: number): number {
  const t = (n % 1000) / 1000;
  return Math.round(min + t * (max - min));
}

function makeTrips(
  h: number,
  platform: PayoutPlatform,
  currencyCode: string,
): OcrTripRow[] {
  const n = 3 + (h % 5);
  const trips: OcrTripRow[] = [];
  for (let i = 0; i < n; i++) {
    const seed = h + i * 997;
    const amount = scale(seed, 350, 2800) / 100;
    trips.push({
      id: `mock_${i}_${seed}`,
      amount,
      currencyCode,
      confidence: 0.55 + ((seed >> 2) % 35) / 100,
      rawLine: `Mock trip ${i + 1} · ${amount} ${currencyCode}`,
      status: "completed",
    });
  }
  return trips;
}

/**
 * Только для QA: детерминированные поездки. Выключается в production по умолчанию.
 */
export function mockParsePayout(
  imageUri: string,
  platform: PayoutPlatform,
  currencyCode: string,
): OcrParseResult {
  const h = hash(`${platform}:${imageUri}`);
  const tips = scale(h, 50, 420) / 100;
  const bonus = scale(h >> 3, 0, 350) / 100;
  const hours = 4 + (h % 50) / 10;
  const trips = makeTrips(h, platform, currencyCode);
  const totalIncome = trips.reduce((s, t) => s + t.amount, 0);
  const g =
    trips.reduce((s, t) => s + t.confidence, 0) / Math.max(1, trips.length);
  const analytics = {
    tripCount: trips.length,
    totalIncome: Math.round(totalIncome * 100) / 100,
    avgOrder: Math.round((totalIncome / trips.length) * 100) / 100,
    bestOrder: Math.round(Math.max(...trips.map((t) => t.amount)) * 100) / 100,
    earningsPerHour:
      Math.round((totalIncome / Math.max(0.1, hours)) * 100) / 100,
    estimatedKm: null,
    avgTripConfidence: Math.round(g * 1000) / 1000,
  };
  const earnings = totalIncome + tips + bonus;
  const fuel = scale(h >> 5, 120, 890) / 100;
  return {
    platform,
    trips,
    globalConfidence: Math.min(0.97, g),
    needsEditMode: g < 0.62,
    analytics,
    textSource: "dev_mock",
    notes: ["Режим OCR_DEV_MOCK: только для тестов, не использовать как реальные выплаты."],
    earnings: Math.round(earnings * 100) / 100,
    tips,
    bonus,
    hoursOnline: Math.round(hours * 10) / 10,
    tripCount: trips.length,
    estimatedFuelCost: fuel,
    netProfit: Math.round((earnings - fuel) * 100) / 100,
    currencyCode,
    confidence: Math.min(0.97, g),
    modelVersion: "aion-ocr-mock/2.0",
  };
}
