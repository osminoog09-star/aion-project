import { useCallback, useEffect, useState } from "react";
import {
  loadGarageCatalogUx,
  setGarageCatalogUx,
  toggleFavoriteCatalogId,
  touchRecentCatalogId,
  type GarageCatalogUxState,
} from "../storage/garageCatalogUxStorage";

export function useGarageCatalogUx() {
  const [state, setState] = useState<GarageCatalogUxState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadGarageCatalogUx().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    const s = await loadGarageCatalogUx();
    setState(s);
    return s;
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const next = await toggleFavoriteCatalogId(id);
    setState(next);
    return next;
  }, []);

  const touchRecent = useCallback(async (id: string) => {
    const next = await touchRecentCatalogId(id);
    setState(next);
    return next;
  }, []);

  const replace = useCallback(async (next: GarageCatalogUxState) => {
    await setGarageCatalogUx(next);
    setState(next);
  }, []);

  return {
    hydrated: state !== null,
    favoriteIds: state?.favoriteIds ?? [],
    recentIds: state?.recentIds ?? [],
    toggleFavorite,
    touchRecent,
    refresh,
    replace,
  };
}
