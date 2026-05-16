import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_DEVICE_SETTINGS,
  type DeviceSettings,
} from "../types/device";
import {
  loadDeviceSettings,
  mergeDeviceSettings,
  saveDeviceSettings,
} from "../services/deviceModeService";

type DeviceContextValue = {
  hydrated: boolean;
  settings: DeviceSettings;
  setCompanionMode: (v: boolean) => Promise<void>;
  setAionLinkMode: (v: boolean) => Promise<void>;
  setBatteryOptimization: (v: boolean) => Promise<void>;
  setGpsUpdateIntervalMs: (ms: number) => Promise<void>;
  setNightContrast: (mode: DeviceSettings["nightContrast"]) => Promise<void>;
  updateSettings: (partial: Partial<DeviceSettings>) => Promise<void>;
};

const DeviceContext = createContext<DeviceContextValue | undefined>(
  undefined
);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<DeviceSettings>({
    ...DEFAULT_DEVICE_SETTINGS,
  });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await loadDeviceSettings();
      if (!cancelled) {
        setSettings(s);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<DeviceSettings>) => {
      const next = mergeDeviceSettings({
        ...settingsRef.current,
        ...partial,
      });
      await saveDeviceSettings(next);
      setSettings(next);
    },
    []
  );

  const setCompanionMode = useCallback(
    async (v: boolean) => updateSettings({ companionMode: v }),
    [updateSettings]
  );
  const setAionLinkMode = useCallback(
    async (v: boolean) => updateSettings({ aionLinkMode: v }),
    [updateSettings]
  );
  const setBatteryOptimization = useCallback(
    async (v: boolean) => updateSettings({ batteryOptimization: v }),
    [updateSettings]
  );
  const setGpsUpdateIntervalMs = useCallback(
    async (ms: number) => updateSettings({ gpsUpdateIntervalMs: ms }),
    [updateSettings]
  );
  const setNightContrast = useCallback(
    async (mode: DeviceSettings["nightContrast"]) =>
      updateSettings({ nightContrast: mode }),
    [updateSettings]
  );

  const value = useMemo<DeviceContextValue>(
    () => ({
      hydrated,
      settings,
      setCompanionMode,
      setAionLinkMode,
      setBatteryOptimization,
      setGpsUpdateIntervalMs,
      setNightContrast,
      updateSettings,
    }),
    [
      hydrated,
      settings,
      setCompanionMode,
      setAionLinkMode,
      setBatteryOptimization,
      setGpsUpdateIntervalMs,
      setNightContrast,
      updateSettings,
    ]
  );

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
  return ctx;
}
