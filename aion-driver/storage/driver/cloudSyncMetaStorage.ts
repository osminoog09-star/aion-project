import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "@aion_driver/cloud_sync_meta_v1:";

export type CloudSyncMeta = {
  lastPullAtMs: number;
  lastPushAtMs: number;
  backfillDone: boolean;
};

const DEFAULT_META: CloudSyncMeta = {
  lastPullAtMs: 0,
  lastPushAtMs: 0,
  backfillDone: false,
};

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export async function loadCloudSyncMeta(userId: string): Promise<CloudSyncMeta> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return { ...DEFAULT_META };
    const parsed = JSON.parse(raw) as Partial<CloudSyncMeta>;
    return {
      lastPullAtMs: Number(parsed.lastPullAtMs) || 0,
      lastPushAtMs: Number(parsed.lastPushAtMs) || 0,
      backfillDone: Boolean(parsed.backfillDone),
    };
  } catch {
    return { ...DEFAULT_META };
  }
}

// Сериализация: saveCloudSyncMeta делает read-modify-write по ключу пользователя;
// два одновременных частичных патча без неё затирают друг друга.
let serialized: Promise<unknown> = Promise.resolve();

function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = serialized.then(fn, fn);
  serialized = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function saveCloudSyncMeta(
  userId: string,
  patch: Partial<CloudSyncMeta>,
): Promise<void> {
  return runSerialized(async () => {
    const prev = await loadCloudSyncMeta(userId);
    await AsyncStorage.setItem(
      key(userId),
      JSON.stringify({ ...prev, ...patch }),
    );
  });
}
