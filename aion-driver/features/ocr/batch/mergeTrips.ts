import type { OcrTripRow } from "../types";

function tripKey(t: OcrTripRow): string {
  const amt = Math.round(t.amount * 100) / 100;
  const time = (t.occurredAt ?? "").slice(0, 16);
  const raw = (t.rawLine ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\d+[.,]?\d*/g, "#")
    .slice(0, 56);
  return `${amt}|${time}|${raw}`;
}

/** Same payout line captured twice across screenshots (minute precision). */
function minuteBucketKey(t: OcrTripRow): string {
  const amt = Math.round(t.amount * 100) / 100;
  const iso = t.occurredAt;
  if (!iso) return `${amt}|${t.currencyCode}|x`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `${amt}|${t.currencyCode}|x`;
  return `${amt}|${t.currencyCode}|${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
}

/** Merge multi-screenshot batches: collapse same-minute same-amount duplicates, then strict keys. */
export function mergeTripLists(batches: OcrTripRow[][]): OcrTripRow[] {
  const flat = batches.flat();
  const byMinute = new Map<string, OcrTripRow>();
  for (const t of flat) {
    const mk = minuteBucketKey(t);
    const prev = byMinute.get(mk);
    if (!prev || t.confidence > prev.confidence) byMinute.set(mk, t);
  }
  const seen = new Set<string>();
  const out: OcrTripRow[] = [];
  for (const t of byMinute.values()) {
    const k = tripKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  out.sort((a, b) => {
    const ta = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
    const tb = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
    return ta - tb;
  });
  return out;
}
