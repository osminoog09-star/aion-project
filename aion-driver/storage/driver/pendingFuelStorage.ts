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

function writeAll(entries: FuelEntry[]): Promise<void> {
  return AsyncStorage.setItem(STORAGE_KEYS.PENDING_FUEL_ENTRIES, JSON.stringify(entries));
}

// Сериализация записей: очередь pending-заправок имеет ДВУХ независимых писателей
// (ручное подтверждение из UI и восстановление из облака при логине/возврате в foreground).
// Без сериализации два read-modify-write накладываются и теряют запись = реальные деньги
// за топливо. Паттерн скопирован из features/gps/tripStore/gpsTripStorage.ts.
let serialized: Promise<unknown> = Promise.resolve();

function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = serialized.then(fn, fn);
  serialized = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function loadPendingFuelEntries(): Promise<FuelEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_FUEL_ENTRIES);
  return parseEntries(raw);
}

export function appendPendingFuelEntry(entry: FuelEntry): Promise<void> {
  return runSerialized(async () => {
    const prev = await loadPendingFuelEntries();
    await writeAll([...prev, entry]);
  });
}

export function clearPendingFuelEntries(): Promise<void> {
  return runSerialized(() => AsyncStorage.removeItem(STORAGE_KEYS.PENDING_FUEL_ENTRIES));
}

export function replacePendingFuelEntries(entries: FuelEntry[]): Promise<void> {
  return runSerialized(() => writeAll(entries));
}

export function updatePendingFuelEntry(
  id: string,
  patch: Partial<FuelEntry>,
): Promise<FuelEntry | null> {
  return runSerialized(async () => {
    const prev = await loadPendingFuelEntries();
    let updated: FuelEntry | null = null;
    const next = prev.map((e) => {
      if (e.id !== id) return e;
      updated = { ...e, ...patch };
      return updated;
    });
    if (!updated) return null;
    await writeAll(next);
    return updated;
  });
}

export function removePendingFuelEntry(id: string): Promise<boolean> {
  return runSerialized(async () => {
    const prev = await loadPendingFuelEntries();
    const next = prev.filter((e) => e.id !== id);
    if (next.length === prev.length) return false;
    await writeAll(next);
    return true;
  });
}
