export type DriverVoiceCommand =
  | { kind: "income"; amount: number; count: number; total: number; currencyCode: "EUR" | "USD" | "RUB" | null; transcript: string }
  | { kind: "fuel"; amount: number; currencyCode: "EUR" | "USD" | "RUB" | null; transcript: string };

function detectCurrency(raw: string): "EUR" | "USD" | "RUB" | null {
  if (/евро|\beur\b/.test(raw)) return "EUR";
  if (/доллар|\busd\b/.test(raw)) return "USD";
  if (/рубл|рублей|\brub\b/.test(raw)) return "RUB";
  return null;
}

const NUMBER_WORDS: Record<string, number> = {
  один: 1, одна: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9,
  десять: 10, одиннадцать: 11, двенадцать: 12, тринадцать: 13, четырнадцать: 14, пятнадцать: 15,
  шестнадцать: 16, семнадцать: 17, восемнадцать: 18, девятнадцать: 19, двадцать: 20, тридцать: 30,
  сорок: 40, пятьдесят: 50, шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90,
  сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500, шестьсот: 600,
  семьсот: 700, восемьсот: 800, девятьсот: 900,
};

function firstAmount(raw: string): number | null {
  const match = raw.match(/(\d+(?:[.,]\d{1,2})?)/);
  let value = match ? Number(match[1].replace(",", ".")) : 0;
  if (!match) {
    let current = 0;
    for (const token of raw.split(/[^а-я]+/)) {
      if (token === "тысяча" || token === "тысячи" || token === "тысяч") { value += Math.max(1, current) * 1000; current = 0; continue; }
      const part = NUMBER_WORDS[token];
      if (part == null) { if (current > 0) break; continue; }
      current += part;
    }
    value += current;
  }
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

export function parseDriverVoiceCommand(transcript: string): DriverVoiceCommand | null {
  const normalized = transcript.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  const currencyCode = detectCurrency(normalized);
  if (/заправ|топлив|бензин|дизел/.test(normalized)) {
    const amount = firstAmount(normalized);
    return amount == null ? null : { kind: "fuel", amount, currencyCode, transcript: transcript.trim() };
  }
  if (/заказ|доход|заработ/.test(normalized)) {
    const counted = normalized.match(/(.+?)\s+заказ[а-я]*\s+по\s+(.+)/);
    if (counted) {
      const count = firstAmount(counted[1]) ?? 0;
      const amount = firstAmount(counted[2]) ?? 0;
      if (Number.isInteger(count) && count > 0 && count <= 50 && amount > 0) {
        return { kind: "income", amount, count, total: Math.round(amount * count * 100) / 100, currencyCode, transcript: transcript.trim() };
      }
      return null;
    }
    const amount = firstAmount(normalized);
    return amount == null ? null : { kind: "income", amount, count: 1, total: amount, currencyCode, transcript: transcript.trim() };
  }
  return null;
}
