import type { OcrParseResult, PayoutPlatform } from "../types";

export type OcrQueueItemStatus = "pending" | "processing" | "done" | "failed";

export type OcrQueueJobPayload = {
  imageUris: string[];
  pastedText: string | null;
  platform: PayoutPlatform;
  currencyCode: string;
};

export type OcrQueueItem = {
  id: string;
  dedupeKey: string;
  status: OcrQueueItemStatus;
  attemptCount: number;
  maxAttempts: number;
  createdAtMs: number;
  updatedAtMs: number;
  /** Exponential backoff — не обрабатывать до этого времени. */
  nextRetryAtMs?: number;
  lastError?: string;
  payload: OcrQueueJobPayload;
  resultParse?: OcrParseResult;
};
