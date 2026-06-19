import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "aion-offline-sync-queue-v1";
const DEAD_LETTER_KEY = "aion-offline-sync-dead-letter-v1";

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
  | "cloud_backup_upsert"
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

export type SyncDeadLetterReason =
  | "max_attempts"
  | "not_implemented"
  | "terminal_error";

export type SyncDeadLetter = {
  id: string;
  op: SyncOperation;
  failedAt: number;
  reason: SyncDeadLetterReason;
  message?: string;
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

async function readDeadLetters(): Promise<SyncDeadLetter[]> {
  const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SyncDeadLetter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeDeadLetters(items: SyncDeadLetter[]): Promise<void> {
  await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(items.slice(-200)));
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

export async function moveToDeadLetter(
  op: SyncOperation,
  reason: SyncDeadLetterReason,
  message?: string,
): Promise<void> {
  return runSerializedQueue(async () => {
    const queue = (await readQueue()).filter((x) => x.id !== op.id);
    await writeQueue(queue);
    const dead = await readDeadLetters();
    dead.push({
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      op,
      failedAt: Date.now(),
      reason,
      message,
    });
    await writeDeadLetters(dead);
  });
}

export async function peekSyncDeadLetters(): Promise<SyncDeadLetter[]> {
  return runSerializedQueue(() => readDeadLetters());
}

export async function clearSyncDeadLetters(): Promise<void> {
  return runSerializedQueue(async () => {
    await AsyncStorage.removeItem(DEAD_LETTER_KEY);
  });
}

export async function getSyncQueueDiagnostics(): Promise<{
  queueLength: number;
  deadLetterLength: number;
  queueTypes: SyncOperationType[];
  deadLetterReasons: SyncDeadLetterReason[];
}> {
  return runSerializedQueue(async () => {
    const [queue, dead] = await Promise.all([readQueue(), readDeadLetters()]);
    return {
      queueLength: queue.length,
      deadLetterLength: dead.length,
      queueTypes: queue.map((x) => x.type),
      deadLetterReasons: dead.map((x) => x.reason),
    };
  });
}

/** QA / debug: очистить офлайн-очередь */
export async function clearSyncQueue(): Promise<void> {
  return runSerializedQueue(async () => {
    await AsyncStorage.removeItem(QUEUE_KEY);
  });
}
