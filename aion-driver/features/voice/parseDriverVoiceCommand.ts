export type DriverVoiceCommand =
  | { kind: "income"; amount: number; count: number; total: number; transcript: string }
  | { kind: "fuel"; amount: number; transcript: string };

function firstAmount(raw: string): number | null {
  const match = raw.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

export function parseDriverVoiceCommand(transcript: string): DriverVoiceCommand | null {
  const normalized = transcript.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (/заправ|топлив|бензин|дизел/.test(normalized)) {
    const amount = firstAmount(normalized);
    return amount == null ? null : { kind: "fuel", amount, transcript: transcript.trim() };
  }
  if (/заказ|доход|заработ/.test(normalized)) {
    const counted = normalized.match(/(\d+)\s*заказ[а-я]*\s+по\s+(\d+(?:[.,]\d{1,2})?)/);
    if (counted) {
      const count = Number(counted[1]);
      const amount = Number(counted[2].replace(",", "."));
      if (Number.isInteger(count) && count > 0 && count <= 50 && amount > 0) {
        return { kind: "income", amount, count, total: Math.round(amount * count * 100) / 100, transcript: transcript.trim() };
      }
      return null;
    }
    const amount = firstAmount(normalized);
    return amount == null ? null : { kind: "income", amount, count: 1, total: amount, transcript: transcript.trim() };
  }
  return null;
}
