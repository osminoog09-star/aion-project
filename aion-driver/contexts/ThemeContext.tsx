import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AccessibilityInfo, useColorScheme } from "react-native";
import type { AionSemantic } from "../tokens/semantic";
import {
  defaultMotionForStyle,
  isVisualStyleId,
  motionForStyle,
  resolveVisualEffects,
  resolveVisualSemantic,
  type MotionIntensity,
  type MotionTimingPreset,
  type ThemeVisualEffects,
  type VisualStyleId,
} from "../src/theme";

const THEME_PREF_KEY = "AION_UI_THEME_V1";
const VISUAL_STYLE_KEY = "AION_VISUAL_STYLE_V1";
const MOTION_INTENSITY_KEY = "AION_MOTION_INTENSITY_V1";

export type ThemePreference = "system" | "light" | "dark";

type Ctx = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (p: ThemePreference) => void;
  canvas: string;
  statusBarStyle: "light" | "dark";
  semantic: AionSemantic;
  visualStyle: VisualStyleId;
  setVisualStyle: (id: VisualStyleId) => void;
  visualEffects: ThemeVisualEffects;
  motionIntensity: MotionIntensity;
  setMotionIntensity: (m: MotionIntensity) => void;
  motionTiming: MotionTimingPreset;
  reducedMotion: boolean;
};

const ThemeContext = createContext<Ctx | null>(null);

const defaultVisualStyleForBuild: VisualStyleId = __DEV__ ? "cyberpunk" : "core_dev";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPrefState] = useState<ThemePreference>("system");
  const [visualStyle, setVisualStyleState] = useState<VisualStyleId>(defaultVisualStyleForBuild);
  const [motionIntensity, setMotionIntensityState] = useState<MotionIntensity>("subtle");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [rawTheme, rawStyle, rawMotion] = await Promise.all([
        AsyncStorage.getItem(THEME_PREF_KEY),
        AsyncStorage.getItem(VISUAL_STYLE_KEY),
        AsyncStorage.getItem(MOTION_INTENSITY_KEY),
      ]);
      if (cancelled) return;
      if (rawTheme === "light" || rawTheme === "dark" || rawTheme === "system") {
        setPrefState(rawTheme);
      }
      if (rawStyle && isVisualStyleId(rawStyle)) {
        setVisualStyleState(rawStyle);
      } else {
        setVisualStyleState(defaultVisualStyleForBuild);
      }
      if (rawMotion === "subtle" || rawMotion === "cinematic" || rawMotion === "energetic") {
        setMotionIntensityState(rawMotion);
      } else {
        const sid =
          rawStyle && isVisualStyleId(rawStyle) ? rawStyle : defaultVisualStyleForBuild;
        setMotionIntensityState(defaultMotionForStyle(sid));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => {
      setReducedMotion(Boolean(v));
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => setReducedMotion(Boolean(v)));
    return () => {
      sub.remove();
    };
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPrefState(p);
    void AsyncStorage.setItem(THEME_PREF_KEY, p);
  }, []);

  const setVisualStyle = useCallback((id: VisualStyleId) => {
    setVisualStyleState(id);
    void AsyncStorage.setItem(VISUAL_STYLE_KEY, id);
    void AsyncStorage.getItem(MOTION_INTENSITY_KEY).then((m) => {
      if (m !== "subtle" && m !== "cinematic" && m !== "energetic") {
        setMotionIntensityState(defaultMotionForStyle(id));
      }
    });
  }, []);

  const setMotionIntensity = useCallback((m: MotionIntensity) => {
    setMotionIntensityState(m);
    void AsyncStorage.setItem(MOTION_INTENSITY_KEY, m);
  }, []);

  const resolved: "light" | "dark" = useMemo(() => {
    if (preference === "light") return "light";
    if (preference === "dark") return "dark";
    return system === "light" ? "light" : "dark";
  }, [preference, system]);

  const semantic = useMemo(
    () => resolveVisualSemantic(visualStyle, resolved),
    [visualStyle, resolved],
  );

  const visualEffects = useMemo(
    () => resolveVisualEffects(visualStyle, reducedMotion),
    [visualStyle, reducedMotion],
  );

  const motionTiming = useMemo(
    () => motionForStyle(motionIntensity, reducedMotion),
    [motionIntensity, reducedMotion],
  );

  const value = useMemo<Ctx>(
    () => ({
      preference,
      resolved,
      setPreference,
      canvas: semantic.canvas,
      statusBarStyle: resolved === "light" ? "dark" : "light",
      semantic,
      visualStyle,
      setVisualStyle,
      visualEffects,
      motionIntensity,
      setMotionIntensity,
      motionTiming,
      reducedMotion,
    }),
    [
      preference,
      resolved,
      setPreference,
      semantic,
      visualStyle,
      setVisualStyle,
      visualEffects,
      motionIntensity,
      setMotionIntensity,
      motionTiming,
      reducedMotion,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}