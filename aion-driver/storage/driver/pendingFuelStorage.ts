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

export async function replacePendingFuelEntries(entries: FuelEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_FUEL_ENTRIES, JSON.stringify(entries));
}

export async function updatePendingFuelEntry(
  id: string,
  patch: Partial<FuelEntry>,
): Promise<FuelEntry | null> {
  const prev = await loadPendingFuelEntries();
  let updated: FuelEntry | null = null;
  const next = prev.map((e) => {
    if (e.id !== id) return e;
    updated = { ...e, ...patch };
    return updated;
  });
  if (!updated) return null;
  await replacePendingFuelEntries(next);
  return updated;
}

export async function removePendingFuelEntry(id: string): Promise<boolean> {
  const prev = await loadPendingFuelEntries();
  const next = prev.filter((e) => e.id !== id);
  if (next.length === prev.length) return false;
  await replacePendingFuelEntries(next);
  return true;
}
