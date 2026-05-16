import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "aion-offline-sync-queue-v1";

let queueChain: Promise<unknown> = Promise.resolve();

function runSerializedQueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = queueChain.then(fn, fn);
  queueChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export type SyncOperationType =
  | "profile_upsert"
  | "vehicle_upsert"
  | "trip_upsert"
  | "analytics_event"
  /** Payload снимка/OCR с рабочего телефона — relay в облаке (фаза 1: очередь + снятие без сети) */
  | "link_ocr_snapshot";

export type SyncOperation = {
  id: string;
  type: SyncOperationType;
  payload: unknown;
  createdAt: number;
  attempts: number;
  /** Идемпотентность: повторный enqueue с тем же ключом заменяет pending-операцию */
  dedupeKey?: string;
};

async function readQueue(): Promise<SyncOperation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SyncOperation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: SyncOperation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function enqueueSyncOperation(
  op: Omit<SyncOperation, "id" | "createdAt" | "attempts"> & { dedupeKey?: string },
): Promise<void> {
  return runSerializedQueue(async () => {
    const queue = await readQueue();
    const dedupeKey = op.dedupeKey;
    const nextOp: SyncOperation = {
      ...op,
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: Date.now(),
      attempts: 0,
    };
    if (dedupeKey) {
      const idx = queue.findIndex((x) => x.dedupeKey === dedupeKey);
      if (idx >= 0) {
        const copy = [...queue];
        copy[idx] = { ...nextOp, attempts: 0 };
        await writeQueue(copy);
        return;
      }
    }
    queue.push(nextOp);
    await writeQueue(queue);
  });
}

export async function peekSyncQueue(): Promise<SyncOperation[]> {
  return runSerializedQueue(() => readQueue());
}

export async function dequeueSucceeded(id: string): Promise<void> {
  return runSerializedQueue(async () => {
    const queue = (await readQueue()).filter((x) => x.id !== id);
    await writeQueue(queue);
  });
}

export async function markAttempt(id: string): Promise<void> {
  return runSerializedQueue(async () => {
    const queue = (await readQueue()).map((x) =>
      x.id === id ? { ...x, attempts: x.attempts + 1 } : x,
    );
    await writeQueue(queue);
  });
}

/** QA / debug: очистить офлайн-очередь */
export async function clearSyncQueue(): Promise<void> {
  return runSerializedQueue(async () => {
    await AsyncStorage.removeItem(QUEUE_KEY);
  });
}
