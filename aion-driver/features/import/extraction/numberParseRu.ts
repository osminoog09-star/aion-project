/** Число из фрагмента с русской запятой как десятичным разделителем. */
export function parseRuDecimal(raw: string): number | null {
  const t = raw.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  if (!t || t === "-" || t === ".") return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}
