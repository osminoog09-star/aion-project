import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";

export type BreakpointTier = "compact" | "tablet" | "desktop" | "ultrawide";

/**
 * Shared layout breakpoints for web + native (tablet / foldables).
 * Desktop shell treats tablet as narrow sidebar layout.
 */
export function useBreakpoints() {
  const { width, height } = useWindowDimensions();

  const tier = useMemo<BreakpointTier>(() => {
    if (width >= 1600) return "ultrawide";
    if (width >= 1024) return "desktop";
    if (width >= 768) return "tablet";
    return "compact";
  }, [width]);

  const isWeb = Platform.OS === "web";
  const isWide = width >= 1024;
  const isUltrawide = width >= 1600;

  return {
    width,
    height,
    tier,
    isWeb,
    isWide,
    isUltrawide,
    /** Prefer dense tables and smaller gutters */
    preferDense: tier === "compact" || tier === "tablet",
  };
}
