import type { OcrParseResult } from "../types";
import { parseDashboardHeuristic } from "./parseDashboardHeuristic";
import { parseFuelReceiptHeuristic } from "./parseFuelReceiptHeuristic";

const MAX_SNIP = 8000;

/**
 * Добавляет структурированные извлечения (чек / панель) к результату OCR без изменения сумм поездок.
 */
export function enrichOcrStructuredExtracts(
  parse: OcrParseResult,
  normalizedSourceText: string | null | undefined,
): OcrParseResult {
  const raw = normalizedSourceText?.trim();
  if (!raw) {
    return {
      ...parse,
      normalizedSourceText: undefined,
      fuelReceipt: undefined,
      dashboardCluster: undefined,
    };
  }
  const nt = raw.length > MAX_SNIP ? raw.slice(0, MAX_SNIP) : raw;
  const fuel = parseFuelReceiptHeuristic(nt);
  const dashboard = parseDashboardHeuristic(nt);
  return {
    ...parse,
    normalizedSourceText: nt,
    fuelReceipt: fuel ?? undefined,
    dashboardCluster: dashboard ?? undefined,
  };
}
