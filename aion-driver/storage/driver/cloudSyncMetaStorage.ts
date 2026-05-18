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

export async function saveCloudSyncMeta(
  userId: string,
  patch: Partial<CloudSyncMeta>,
): Promise<void> {
  const prev = await loadCloudSyncMeta(userId);
  await AsyncStorage.setItem(
    key(userId),
    JSON.stringify({ ...prev, ...patch }),
  );
}
