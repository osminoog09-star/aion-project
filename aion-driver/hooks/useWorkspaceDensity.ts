import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type WorkspaceDensity = "compact" | "analytics" | "cinematic";

const STORAGE_KEY = "AION_WORKSPACE_DENSITY_V1";

function isDensity(v: string | null): v is WorkspaceDensity {
  return v === "compact" || v === "analytics" || v === "cinematic";
}

/**
 * Desktop workspace density: affects padding and card scale (not separate themes).
 */
export function useWorkspaceDensity() {
  const [density, setDensityState] = useState<WorkspaceDensity>("analytics");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!cancelled) {
        if (isDensity(raw)) setDensityState(raw);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setDensity = useCallback((next: WorkspaceDensity) => {
    setDensityState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { density, setDensity, ready };
}
