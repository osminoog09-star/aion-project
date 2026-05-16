import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@aion_driver/fuel_favorites_v1";

export async function loadFuelFavoriteIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export async function saveFuelFavoriteIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(ids.slice(0, 80)));
}

export async function toggleFuelFavoriteId(id: string): Promise<string[]> {
  const cur = await loadFuelFavoriteIds();
  const set = new Set(cur);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const next = [...set];
  await saveFuelFavoriteIds(next);
  return next;
}
