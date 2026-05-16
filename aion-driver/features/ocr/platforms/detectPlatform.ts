import type { PayoutPlatform } from "../../import/types";

const SCORES: { platform: PayoutPlatform; weight: number; needles: RegExp[] }[] = [
  {
    platform: "bolt",
    weight: 1,
    needles: [/bolt\s*driver/i, /bolt\s*tax/i, /\bbolt\b.*\b(trip|order|заказ)/i],
  },
  {
    platform: "uber",
    weight: 1,
    needles: [/uber\s*driver/i, /\buber\b.*\b(earnings|trip|delivery)\b/i, /uber\s*pro/i],
  },
  {
    platform: "yandex",
    weight: 1,
    needles: [
      /яндекс\.?про/i,
      /yandex\s*pro/i,
      /taximeter/i,
      /\bяндекс\b.*\b(заказ|поездк)/i,
    ],
  },
  {
    platform: "freenow",
    weight: 1.1,
    needles: [/free\s*now/i, /\bfreenow\b/i, /mytaxi/i],
  },
  {
    platform: "lyft",
    weight: 1,
    needles: [/lyft\s*driver/i, /\blyft\b.*\b(earnings|ride)\b/i],
  },
  {
    platform: "wolt",
    weight: 0.6,
    needles: [/wolt\s*partner/i, /\bwolt\b/i],
  },
];

/**
 * Автоопределение платформы по ключевым маркерам в тексте.
 */
export function detectPlatformFromText(
  normalized: string,
  hint?: PayoutPlatform,
): PayoutPlatform {
  const hay = normalized.toLowerCase();
  let best: PayoutPlatform | null = null;
  let bestScore = 0;
  for (const { platform, needles, weight } of SCORES) {
    let s = 0;
    for (const re of needles) {
      if (re.test(hay)) s += weight;
    }
    if (s > bestScore) {
      bestScore = s;
      best = platform;
    }
  }
  if (best && bestScore >= 1) return best;
  return hint ?? "bolt";
}
