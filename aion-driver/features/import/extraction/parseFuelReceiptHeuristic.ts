import type { FuelFamily, FuelReceiptExtraction, FuelReceiptFields } from "./fuelReceiptTypes";
import { parseRuDecimal } from "./numberParseRu";

function detectFamily(text: string): FuelFamily {
  const t = text.toUpperCase();
  if (/\b(ЭЛЕКТР|КВТ|KWH|КВТ\.?\s*Ч)\b/i.test(text)) return "ev";
  if (/\b(CNG|КПГ|МЕТАН)\b/i.test(t)) return "cng";
  if (/\b(LPG|ПБА|ПРОПАН|БУТАН)\b/i.test(t)) return "lpg";
  if (/\b(ДТ|DIESEL|ДИЗЕЛ)\b/i.test(t)) return "diesel";
  if (/\b(АИ[- ]?\d{2}|AI[- ]?\d{2}|92|95|98|100)\b/i.test(t)) return "petrol";
  return "unknown";
}

/**
 * Эвристики по нормализованному тексту чека. Только явные паттерны; иначе null.
 */
export function parseFuelReceiptHeuristic(normalizedText: string): FuelReceiptExtraction | null {
  const text = normalizedText.trim();
  if (text.length < 8) return null;

  const fields: FuelReceiptFields = {};
  const matched: string[] = [];
  const fam = detectFamily(text);
  if (fam !== "unknown") {
    fields.fuelFamily = fam;
    matched.push("fuel_family_keyword");
  }

  const totalPatterns: RegExp[] = [
    /(?:ИТОГО|ВСЕГО|К\s+ОПЛАТЕ|СУММА|ИТОГ)\s*[:\s]*([\d\s]+[,.]?\d*)\s*(?:₽|Р\.?|RUB)?/i,
    /(?:₽|Р\.?)\s*([\d\s]+[,.]?\d*)\s*$/im,
  ];
  for (const re of totalPatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const v = parseRuDecimal(m[1].replace(/\s/g, ""));
      if (v != null && v > 10 && v < 500_000) {
        fields.totalPrice = Math.round(v * 100) / 100;
        matched.push("total_price");
        break;
      }
    }
  }

  const literMatch = text.match(
    /([\d\s]+[,.]?\d*)\s*(?:л\.?|литр|L)\b/i,
  );
  if (literMatch?.[1]) {
    const v = parseRuDecimal(literMatch[1].replace(/\s/g, ""));
    if (v != null && v > 0.05 && v < 5000) {
      fields.liters = Math.round(v * 1000) / 1000;
      matched.push("liters");
    }
  }

  const kgMatch = text.match(/([\d\s]+[,.]?\d*)\s*(?:кг|KG)\b/i);
  if (kgMatch?.[1]) {
    const v = parseRuDecimal(kgMatch[1].replace(/\s/g, ""));
    if (v != null && v > 0.01 && v < 10_000) {
      fields.kg = Math.round(v * 1000) / 1000;
      matched.push("kg");
    }
  }

  const ppl = text.match(
    /([\d\s]+[,.]?\d*)\s*(?:₽|Р\.?)\s*\/\s*(?:л|L)\b/i,
  );
  if (ppl?.[1]) {
    const v = parseRuDecimal(ppl[1].replace(/\s/g, ""));
    if (v != null && v > 1 && v < 5000) {
      fields.pricePerLiter = Math.round(v * 100) / 100;
      matched.push("price_per_liter");
    }
  }

  const ppkg = text.match(/([\d\s]+[,.]?\d*)\s*(?:₽|Р\.?)\s*\/\s*(?:кг|KG)\b/i);
  if (ppkg?.[1]) {
    const v = parseRuDecimal(ppkg[1].replace(/\s/g, ""));
    if (v != null && v > 1 && v < 50_000) {
      fields.pricePerKg = Math.round(v * 100) / 100;
      matched.push("price_per_kg");
    }
  }

  const timeFrag = text.match(
    /\b(\d{1,2}[./:-]\d{1,2}[./:-]\d{2,4}[,\s]\d{1,2}:\d{2})\b/,
  );
  if (timeFrag?.[1]) {
    fields.timestampNote = timeFrag[1].slice(0, 80);
    matched.push("timestamp_fragment");
  }

  const station = text.match(
    /(?:АЗС|AZS|SHELL|LUKOIL|ROSNEFT|GAZPROM|BP|TATNEFT|NIS|EVRO)\s+.{0,40}/i,
  );
  if (station?.[0]) {
    fields.stationNote = station[0].replace(/\s+/g, " ").trim().slice(0, 120);
    matched.push("station_fragment");
  }

  if (matched.length === 0) return null;

  const confidence = Math.min(
    1,
    0.25 + matched.length * 0.12 + (fields.totalPrice != null ? 0.15 : 0),
  );

  return { confidence, fields, matchedPatterns: matched };
}
