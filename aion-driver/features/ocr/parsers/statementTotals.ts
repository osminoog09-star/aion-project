/**
 * Detects app payout "statement" totals (Bolt/Uber style) for reconciliation with line-item trips.
 * Returns null when no reliable match — never invents amounts.
 */
const TOTAL_PATTERNS: RegExp[] = [
  /(?:^|\n)\s*(?:gross|total\s+payout|total\s+earnings|payout|balance|amount\s+paid)\s*[:\s]+(-?\d{1,5}(?:[.,]\d{1,2})?)\s*(€|eur|\$|usd|£|gbp|₽|rub)?/gim,
  /(?:^|\n)\s*(?:итого|всего|выплат[аы]|баланс|сумм[аы])\s*[:\s]+(-?\d{1,5}(?:[.,]\d{1,2})?)\s*(€|eur|\$|usd|£|gbp|₽|rub)?/gim,
  /(?:^|\n)\s*(?:net|nett)\s+(?:income|earnings|payout)\s*[:\s]+(-?\d{1,5}(?:[.,]\d{1,2})?)\s*(€|eur|\$|usd|£|gbp|₽|rub)?/gim,
];

function parseNum(s: string): number | null {
  const t = s.replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n > 0 && n < 500_000 ? n : null;
}

export type StatementTotalHit = {
  label: string;
  amount: number;
  raw: string;
};

export function extractStatementTotalHits(text: string): StatementTotalHit[] {
  const hits: StatementTotalHit[] = [];
  for (const re of TOTAL_PATTERNS) {
    const r = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = r.exec(text)) !== null) {
      const n = parseNum(m[1] ?? "");
      if (n == null) continue;
      hits.push({
        label: (m[0] ?? "").trim().slice(0, 48),
        amount: n,
        raw: m[0] ?? "",
      });
    }
  }
  return hits;
}

/** Largest plausible statement total (screens often show multiple subtotals). */
export function pickPrimaryStatementTotal(text: string): number | null {
  const hits = extractStatementTotalHits(text);
  if (!hits.length) return null;
  const sorted = [...hits].sort((a, b) => b.amount - a.amount);
  return sorted[0]!.amount;
}
