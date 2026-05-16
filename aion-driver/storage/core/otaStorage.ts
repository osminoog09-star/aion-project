import AsyncStorage from "@react-native-async-storage/async-storage";

const SNOOZE_KEY = "@aion/ota_snooze_until";

export async function getOtaSnoozeUntil(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(SNOOZE_KEY);
    if (v == null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function setOtaSnoozeUntil(untilMs: number): Promise<void> {
  try {
    await AsyncStorage.setItem(SNOOZE_KEY, String(untilMs));
  } catch {
    /* graceful: snooze only UX hint */
  }
}

export async function clearOtaSnooze(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SNOOZE_KEY);
  } catch {
    /* ignore */
  }
}
