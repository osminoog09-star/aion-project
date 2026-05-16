import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "AION_GARAGE_CATALOG_UX_V1";

export type GarageCatalogUxState = {
  favoriteIds: string[];
  recentIds: string[];
};

const MAX_FAV = 48;
const MAX_RECENT = 24;

const defaultState: GarageCatalogUxState = {
  favoriteIds: [],
  recentIds: [],
};

export async function loadGarageCatalogUx(): Promise<GarageCatalogUxState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...defaultState };
    const p = JSON.parse(raw) as Partial<GarageCatalogUxState>;
    return {
      favoriteIds: Array.isArray(p.favoriteIds)
        ? p.favoriteIds.filter((x) => typeof x === "string").slice(0, MAX_FAV)
        : [],
      recentIds: Array.isArray(p.recentIds)
        ? p.recentIds.filter((x) => typeof x === "string").slice(0, MAX_RECENT)
        : [],
    };
  } catch {
    return { ...defaultState };
  }
}

async function persist(next: GarageCatalogUxState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function setGarageCatalogUx(next: GarageCatalogUxState): Promise<void> {
  await persist({
    favoriteIds: next.favoriteIds.slice(0, MAX_FAV),
    recentIds: next.recentIds.slice(0, MAX_RECENT),
  });
}

export async function toggleFavoriteCatalogId(id: string): Promise<GarageCatalogUxState> {
  const cur = await loadGarageCatalogUx();
  const set = new Set(cur.favoriteIds);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const next = { ...cur, favoriteIds: [...set] };
  await persist(next);
  return next;
}

export async function touchRecentCatalogId(id: string): Promise<GarageCatalogUxState> {
  const cur = await loadGarageCatalogUx();
  const rest = cur.recentIds.filter((x) => x !== id);
  const next = { ...cur, recentIds: [id, ...rest].slice(0, MAX_RECENT) };
  await persist(next);
  return next;
}
