import type { OcrQueueItem } from "./ocrQueueTypes";

export type OcrQueueStats = {
  pending: number;
  processing: number;
  failed: number;
  done: number;
};

export function summarizeOcrQueue(items: OcrQueueItem[]): OcrQueueStats {
  return {
    pending: items.filter((item) => item.status === "pending").length,
    processing: items.filter((item) => item.status === "processing").length,
    failed: items.filter((item) => item.status === "failed").length,
    done: items.filter((item) => item.status === "done").length,
  };
}
