import type {
  OcrAnalyticsSummary,
  OcrTextSource,
  OcrTripRow,
  PayoutPlatform,
} from "../import/types";

/** Результат движка до маппинга в OcrParseResult (хранение / UI). */
export interface OcrEngineResult {
  platform: PayoutPlatform;
  trips: OcrTripRow[];
  globalConfidence: number;
  needsEditMode: boolean;
  analytics: OcrAnalyticsSummary | null;
  tips: number;
  bonus: number;
  hoursOnline: number | null;
  currencyCode: string;
  modelVersion: string;
  textSource: OcrTextSource;
  notes: string[];
}

export type { OcrAnalyticsSummary, OcrTextSource, OcrTripRow } from "../import/types";
