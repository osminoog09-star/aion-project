import type { DashboardExtraction, FuelReceiptExtraction } from "./extraction/fuelReceiptTypes";

export type PayoutPlatform =
  | "bolt"
  | "uber"
  | "wolt"
  | "yandex"
  | "lyft"
  | "freenow";

export type OcrTextSource = "pasted" | "on_device_engine" | "dev_mock";

export interface OcrTripRow {
  id: string;
  amount: number;
  currencyCode: string;
  /** ISO 8601 если удалось распарсить дату/время */
  occurredAt?: string;
  address?: string;
  status?: string;
  confidence: number;
  rawLine?: string;
  /** км по строке, если явно указано */
  distanceKm?: number;
}

export interface OcrAnalyticsSummary {
  tripCount: number;
  totalIncome: number;
  avgOrder: number;
  bestOrder: number;
  earningsPerHour: number | null;
  estimatedKm: number | null;
  avgTripConfidence: number | null;
}

export type OcrPipelinePhase =
  | "idle"
  | "preview"
  | "scanning"
  | "extracting"
  | "reconciling"
  | "done"
  | "error";

export interface OcrParseResult {
  platform: PayoutPlatform;
  /** Распознанные поездки (пусто, если текста не было или не найдено строк с суммами). */
  trips: OcrTripRow[];
  globalConfidence: number;
  needsEditMode: boolean;
  analytics: OcrAnalyticsSummary | null;
  textSource?: OcrTextSource;
  notes?: string[];
  batchSourceUris?: string[];
  earnings: number;
  tips: number;
  bonus: number;
  hoursOnline: number;
  tripCount: number;
  /** Оценка топлива: 0 если нет данных профиля / маршрута (не выдумываем). */
  estimatedFuelCost: number;
  netProfit: number;
  currencyCode: string;
  /** Дублирует globalConfidence для совместимости с UI v1. */
  confidence: number;
  modelVersion: string;
  /** Пользователь вручную поправил суммы поездок перед сохранением. */
  tripAmountsAdjustedByUser?: boolean;
  /** Нормализованный текст (усечённый) — для офлайн-повторов, не для «угадывания». */
  normalizedSourceText?: string;
  /** Чек АЗС: только эвристики с ненулевой уверенностью. */
  fuelReceipt?: FuelReceiptExtraction;
  /** Панель приборов: только эвристики. */
  dashboardCluster?: DashboardExtraction;
}

export interface OcrImportRecord {
  id: string;
  createdAt: string;
  platform: PayoutPlatform;
  parse: OcrParseResult;
  sourceUri?: string;
  /** Смена, к которой относится импорт (если известна при сохранении). */
  shiftId?: string;
  /** Связь с элементом OCR-очереди. */
  queueItemId?: string;
}
