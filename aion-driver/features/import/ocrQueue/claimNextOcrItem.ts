import type { OcrQueueItem } from "./ocrQueueTypes";

export function claimNextOcrItem(
  items: OcrQueueItem[],
  nowMs: number,
): { items: OcrQueueItem[]; claimed: OcrQueueItem | null } {
  const index = items.findIndex(
    (item) =>
      item.status === "pending" &&
      (item.nextRetryAtMs == null || item.nextRetryAtMs <= nowMs),
  );
  if (index < 0) return { items, claimed: null };

  const claimed: OcrQueueItem = {
    ...items[index]!,
    status: "processing",
    updatedAtMs: nowMs,
    attemptCount: items[index]!.attemptCount + 1,
  };
  const next = [...items];
  next[index] = claimed;
  return { items: next, claimed };
}
