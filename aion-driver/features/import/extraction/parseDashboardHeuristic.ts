import type { DashboardExtraction, DashboardFields } from "./fuelReceiptTypes";
import { parseRuDecimal } from "./numberParseRu";

/**
 * Панель приборов / бортовой компьютер — только явные паттерны (км, l/100 и т.д.).
 */
export function parseDashboardHeuristic(normalizedText: string): DashboardExtraction | null {
  const text = normalizedText.trim();
  if (text.length < 6) return null;

  const fields: DashboardFields = {};
  const matched: string[] = [];

  const odo = text.match(
    /(?:ОДОМЕТР|ПРОБЕГ|ODO)\s*[:\s]*([\d\s]+)\s*(?:КМ|KM)?/i,
  );
  if (odo?.[1]) {
    const v = parseRuDecimal(odo[1].replace(/\s/g, ""));
    if (v != null && v > 100 && v < 9_999_999) {
      fields.odometerKm = Math.round(v);
      matched.push("odometer");
    }
  }

  const trip = text.match(
    /(?:ПОЕЗДКА|TRIP|РАССТОЯНИЕ)\s*[:\s]*([\d\s]+[,.]?\d*)\s*(?:КМ|KM)?/i,
  );
  if (trip?.[1]) {
    const v = parseRuDecimal(trip[1].replace(/\s/g, ""));
    if (v != null && v > 0 && v < 5000) {
      fields.tripDistanceKm = Math.round(v * 10) / 10;
      matched.push("trip_km");
    }
  }

  const cons = text.match(
    /([\d\s]+[,.]?\d*)\s*(?:L|Л)\s*\/\s*100\s*(?:КМ|KM)?/i,
  );
  if (cons?.[1]) {
    const v = parseRuDecimal(cons[1].replace(/\s/g, ""));
    if (v != null && v > 0.5 && v < 80) {
      fields.avgConsumptionLPer100 = Math.round(v * 100) / 100;
      matched.push("l_per_100");
    }
  }

  const range = text.match(
    /(?:ЗАПАС\s+ХОДА|RANGE|ДО\s+ЗАПРАВКИ)\s*[:\s]*([\d\s]+)\s*(?:КМ|KM)?/i,
  );
  if (range?.[1]) {
    const v = parseRuDecimal(range[1].replace(/\s/g, ""));
    if (v != null && v > 0 && v < 3000) {
      fields.rangeRemainingKm = Math.round(v);
      matched.push("range_km");
    }
  }

  const move = text.match(/(?:В\s+ДВИЖЕНИИ|MOVING|ВРЕМЯ)\s*[:\s]*([\d:]+)/i);
  if (move?.[1]) {
    fields.movingTimeNote = move[1].slice(0, 40);
    matched.push("moving_time");
  }

  if (matched.length === 0) return null;

  const confidence = Math.min(1, 0.22 + matched.length * 0.14);

  return { confidence, fields, matchedPatterns: matched };
}
