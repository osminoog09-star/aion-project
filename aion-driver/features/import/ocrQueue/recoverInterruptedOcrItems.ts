import type { OcrQueueItem } from "./ocrQueueTypes";

export function recoverInterruptedOcrItems(
  items: OcrQueueItem[],
  nowMs: number,
): { items: OcrQueueItem[]; recoveredCount: number } {
  let recoveredCount = 0;
  const recovered = items.map((item) => {
    if (item.status !== "processing") return item;
    recoveredCount += 1;
    return {
      ...item,
      status: "pending" as const,
      updatedAtMs: nowMs,
      nextRetryAtMs: nowMs,
      lastError: "OCR был прерван перезапуском приложения и поставлен в очередь повторно.",
    };
  });
  return { items: recovered, recoveredCount };
}
