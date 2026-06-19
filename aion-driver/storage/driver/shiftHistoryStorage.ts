import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Shift } from "../../types";
import { normalizeShiftRecord } from "../../utils/migrations";
import { STORAGE_KEYS } from "../core/keys";

export async function loadShiftHistory(): Promise<Shift[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    const out: Shift[] = [];
    for (const item of parsed) {
      const s = normalizeShiftRecord(item);
      if (s) out.push(s);
    }
    return out;
  } catch {
    return [];
  }
}

export async function appendShift(shift: Shift): Promise<Shift[]> {
  const current = await loadShiftHistory();
  const next = [shift, ...current];
  await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(next));
  return next;
}

export async function replaceHistory(shifts: Shift[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(shifts));
}

/** Заменить одну смену в истории (тот же порядок). Возвращает новый массив или null, если id не найден. */
export async function updateShiftInHistory(
  shiftId: string,
  next: Shift,
): Promise<Shift[] | null> {
  const history = await loadShiftHistory();
  const idx = history.findIndex((s) => s.id === shiftId);
  if (idx < 0) return null;
  const merged = [...history];
  merged[idx] = next;
  await replaceHistory(merged);
  return merged;
}
