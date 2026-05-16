import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@aion_driver/post_update_celebration_v1";

export type PostUpdateCelebrationPayload = {
  v: 1;
  at: number;
  previousUpdateId: string | null;
  /** Снимок манифеста OTA (JSON-safe). */
  summary: unknown;
};

export async function markPostUpdateCelebrationPending(
  payload: Omit<PostUpdateCelebrationPayload, "v" | "at">,
): Promise<void> {
  const row: PostUpdateCelebrationPayload = { v: 1, at: Date.now(), ...payload };
  await AsyncStorage.setItem(KEY, JSON.stringify(row));
}

export async function peekPostUpdateCelebrationPending(): Promise<PostUpdateCelebrationPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as PostUpdateCelebrationPayload;
    if (j?.v !== 1) return null;
    return j;
  } catch {
    return null;
  }
}

export async function clearPostUpdateCelebrationPending(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
