import type { PayoutPlatform } from "../../import/types";
import type { OcrTripRow } from "../types";

const SYM: Record<string, string> = {
  "€": "EUR",
  eur: "EUR",
  "₽": "RUB",
  rub: "RUB",
  "£": "GBP",
  gbp: "GBP",
  $: "USD",
  usd: "USD",
  zł: "PLN",
  pln: "PLN",
  "₺": "TRY",
  try: "TRY",
  "₴": "UAH",
  uah: "UAH",
  chf: "CHF",
};

const AMOUNT_RE =
  /(?:^|\s)(-?\d{1,4}(?:[.,]\d{1,2})?)\s*(€|EUR|eur|₽|RUB|rub|£|GBP|gbp|\$|USD|usd|zł|PLN|pln|₺|TRY|try|₴|UAH|uah|CHF|chf)?(?:\s|$)/i;

const AMOUNT_AFTER_CURRENCY_RE =
  /\b(€|EUR|eur)\s*(-?\d{1,4}(?:[.,]\d{1,2})?)\b/i;

function pickCurrency(sym: string | undefined, fallback: string): string {
  if (!sym) return fallback.toUpperCase();
  const k = sym.trim();
  const mapped = SYM[k] ?? SYM[k.toLowerCase()];
  if (mapped) return mapped;
  if (/^[A-Z]{3}$/i.test(k)) return k.toUpperCase();
  return fallback.toUpperCase();
}

function parseNum(s: string): number | null {
  const t = s.replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export function extractHoursOnline(text: string): number | null {
  const patterns = [
    /(\d+[.,]?\d*)\s*(?:ч|ч\.|h|hr|hrs|hours?)\b/i,
    /online[:\s]+(\d+[.,]?\d*)\s*h/i,
    /(\d+[.,]?\d*)\s*h\s*online/i,
    /час(?:ов|а)?[:\s]+(\d+[.,]?\d*)/i,
    /онлайн[:\s]+(\d+[.,]?\d*)\s*(?:ч|h)?/i,
    /(\d+[.,]?\d*)\s*(?:ч|h)\s*онлайн/i,
    /в\s+сети[:\s]+(\d+[.,]?\d*)\s*(?:ч|h)?/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const n = parseNum(m[1]);
      if (n != null && n > 0 && n < 72) return Math.round(n * 10) / 10;
    }
  }
  return null;
}

export function extractTipsBonus(text: string): { tips: number; bonus: number } {
  let tips = 0;
  let bonus = 0;
  const tipRes = [
    /tips?[:\s]+(?:[^\d\n]*?)(-?\d+[.,]\d{2})/gi,
    /чаевые[:\s]+(?:[^\d\n]*?)(-?\d+[.,]\d{2})/gi,
  ];
  const bonusRes = [
    /bonus[:\s]+(?:[^\d\n]*?)(-?\d+[.,]\d{2})/gi,
    /бонус[:\s]+(?:[^\d\n]*?)(-?\d+[.,]\d{2})/gi,
  ];
  for (const re of tipRes) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      const n = parseNum(m[1]);
      if (n != null) tips += n;
    }
  }
  for (const re of bonusRes) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      const n = parseNum(m[1]);
      if (n != null) bonus += n;
    }
  }
  return { tips, bonus };
}

function parseIsoishDateTime(line: string): string | undefined {
  const iso = line.match(
    /\b(20\d{2}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?)\b/,
  );
  if (iso?.[1]) {
    const d = new Date(iso[1].replace(" ", "T"));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const dmy = line.match(
    /\b(\d{1,2})[./](\d{1,2})[./](\d{2,4})\D+(\d{1,2}):(\d{2})\b/,
  );
  if (dmy) {
    const dd = Number(dmy[1]);
    const mm = Number(dmy[2]);
    let yy = Number(dmy[3]);
    if (yy < 100) yy += 2000;
    const hh = Number(dmy[4]);
    const mi = Number(dmy[5]);
    const d = new Date(yy, mm - 1, dd, hh, mi);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const hm = line.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hm) {
    const d = new Date();
    d.setHours(Number(hm[1]), Number(hm[2]), 0, 0);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return undefined;
}

function parseKm(line: string): number | undefined {
  const m = line.match(/\b(\d+[.,]?\d*)\s*(km|км)\b/i);
  if (!m?.[1]) return undefined;
  const n = parseNum(m[1]);
  if (n == null || n <= 0 || n > 800) return undefined;
  return n;
}

function guessStatus(line: string): string | undefined {
  const l = line.toLowerCase();
  if (/cancel|отмен/i.test(l)) return "cancelled";
  if (/complet|заверш|выполн/i.test(l)) return "completed";
  if (/pending|ожид/i.test(l)) return "pending";
  return undefined;
}

function guessAddress(line: string): string | undefined {
  const withoutAmount = line
    .replace(AMOUNT_RE, " ")
    .replace(AMOUNT_AFTER_CURRENCY_RE, " ")
    .trim();
  if (withoutAmount.length < 8) return undefined;
  if (/^\d+[.:]\d+/.test(withoutAmount)) {
    const tail = withoutAmount.replace(/^\d{1,2}[.:]\d{2}\s*/, "").trim();
    return tail.length >= 6 ? tail.slice(0, 120) : undefined;
  }
  if (
    /\p{L}{4,}/u.test(withoutAmount) &&
    !/^(trip|order|поезд|заказ)/i.test(withoutAmount)
  ) {
    return withoutAmount.slice(0, 120);
  }
  return undefined;
}

/**
 * Пытается извлечь поездку из одной строки выписки.
 */
export function parseTripLine(
  line: string,
  _platform: PayoutPlatform,
  currencyFallback: string,
): OcrTripRow | null {
  let m = line.match(AMOUNT_RE);
  let amountStr = m?.[1];
  let sym = m?.[2];
  let fromPrefixCurrency = false;
  if (!amountStr) {
    const m2 = line.match(AMOUNT_AFTER_CURRENCY_RE);
    if (m2?.[2]) {
      amountStr = m2[2];
      sym = m2[1];
      m = m2;
      fromPrefixCurrency = true;
    }
  }
  if (!amountStr) return null;
  const amount = parseNum(amountStr);
  if (amount == null || amount <= 0 || amount > 50000) return null;

  const cur = pickCurrency(sym, currencyFallback);
  let conf = 0.42;
  if (/[\u0400-\u04FF]/.test(line)) conf += 0.07;
  if (/[\u0100-\u024F]/.test(line)) conf += 0.04;
  const occurredAt = parseIsoishDateTime(line);
  if (occurredAt) conf += 0.18;
  const address = guessAddress(line);
  if (address) conf += 0.12;
  const status = guessStatus(line);
  if (status) conf += 0.08;
  const distanceKm = parseKm(line);
  if (distanceKm != null) conf += 0.1;
  if (/trip|ride|поезд|заказ|order|fare/i.test(line)) conf += 0.1;
  if (fromPrefixCurrency) conf += 0.03;
  conf = Math.min(0.97, conf);

  return {
    id: `trip_${Math.random().toString(36).slice(2, 10)}`,
    amount,
    currencyCode: cur,
    occurredAt,
    address,
    status,
    confidence: conf,
    rawLine: line.slice(0, 240),
    distanceKm,
  };
}

/**
 * Сканирует все строки; фильтрует дубликаты по (amount, occurredAt, raw prefix).
 */
export function scanTripsFromLines(
  text: string,
  platform: PayoutPlatform,
  currencyFallback: string,
): OcrTripRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const trips: OcrTripRow[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const trip = parseTripLine(line, platform, currencyFallback);
    if (!trip) continue;
    const key = `${trip.amount}|${trip.occurredAt ?? ""}|${(trip.rawLine ?? "").slice(0, 24)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    trips.push(trip);
  }
  return trips;
}
