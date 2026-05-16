import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OcrQueueItem } from "./ocrQueueTypes";
import { STORAGE_KEYS } from "../../../storage/core/keys";
import { notifyOcrQueueChanged } from "./ocrQueueEvents";

const MAX = 40;
const STUCK_MS = 8 * 60_000;

let serializedChain: Promise<unknown> = Promise.resolve();

function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = serializedChain.then(fn, fn);
  serializedChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function safeParse(raw: string | null): OcrQueueItem[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x) => x && typeof x === "object" && typeof (x as OcrQueueItem).id === "string",
    ) as OcrQueueItem[];
  } catch {
    return [];
  }
}

function recoverStuckProcessing(list: OcrQueueItem[]): OcrQueueItem[] {
  const now = Date.now();
  return list.map((it) => {
    if (it.status !== "processing") return it;
    if (now - it.updatedAtMs > STUCK_MS) {
      return {
        ...it,
        status: "pending" as const,
        updatedAtMs: now,
        nextRetryAtMs: now,
      };
    }
    return it;
  });
}

async function readQueue(): Promise<OcrQueueItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.OCR_QUEUE);
  return recoverStuckProcessing(safeParse(raw));
}

async function writeQueue(items: OcrQueueItem[]): Promise<void> {
  const next = items.slice(0, MAX);
  await AsyncStorage.setItem(STORAGE_KEYS.OCR_QUEUE, JSON.stringify(next));
  notifyOcrQueueChanged();
}

export function loadOcrQueue(): Promise<OcrQueueItem[]> {
  return runSerialized(() => readQueue());
}

export function saveOcrQueue(items: OcrQueueItem[]): Promise<void> {
  return runSerialized(() => writeQueue(items));
}

export function updateOcrQueue(
  mutator: (items: OcrQueueItem[]) => OcrQueueItem[],
): Promise<OcrQueueItem[]> {
  return runSerialized(async () => {
    const cur = await readQueue();
    const next = mutator(cur);
    await writeQueue(next);
    return next;
  });
}
