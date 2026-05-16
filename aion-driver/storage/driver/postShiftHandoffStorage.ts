import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Shift } from "../../types";
import { normalizeShiftRecord } from "../../utils/migrations";
import { STORAGE_KEYS } from "../core/keys";

export async function loadPostShiftHandoff(): Promise<Shift | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.POST_SHIFT_HANDOFF);
  if (!raw) return null;
  try {
    return normalizeShiftRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function savePostShiftHandoff(shift: Shift | null): Promise<void> {
  if (!shift) {
    await AsyncStorage.removeItem(STORAGE_KEYS.POST_SHIFT_HANDOFF);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.POST_SHIFT_HANDOFF, JSON.stringify(shift));
}
