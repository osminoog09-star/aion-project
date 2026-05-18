import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FuelEntry } from "../../types";
import { STORAGE_KEYS } from "../core/keys";

function parseEntries(raw: string | null): FuelEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is FuelEntry =>
        e != null &&
        typeof e === "object" &&
        typeof (e as FuelEntry).id === "string" &&
        Number.isFinite((e as FuelEntry).totalCost),
    );
  } catch {
    return [];
  }
}

export async function loadPendingFuelEntries(): Promise<FuelEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_FUEL_ENTRIES);
  return parseEntries(raw);
}

export async function appendPendingFuelEntry(entry: FuelEntry): Promise<void> {
  const prev = await loadPendingFuelEntries();
  await AsyncStorage.setItem(
    STORAGE_KEYS.PENDING_FUEL_ENTRIES,
    JSON.stringify([...prev, entry]),
  );
}

export async function clearPendingFuelEntries(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_FUEL_ENTRIES);
}
