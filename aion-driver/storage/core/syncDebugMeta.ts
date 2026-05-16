import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@aion/sync_last_flush_at";

/** Вызывается после прохода flush (успешный цикл синхронизации очереди). */
export async function touchLastSyncFlushAt(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export async function getLastSyncFlushAt(): Promise<number | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
