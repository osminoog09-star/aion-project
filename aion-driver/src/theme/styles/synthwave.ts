import type { AionSemantic } from "../../../tokens/semantic";
import type { ThemeVisualEffects, VisualStyleDefinition } from "../visualTypes";

function semantic(resolved: "light" | "dark"): AionSemantic {
  if (resolved === "light") {
    return {
      canvas: "#fdf4ff",
      surface: "#ffffff",
      surfaceMuted: "#fae8ff",
      textPrimary: "#4a044e",
      textSecondary: "#86198f",
      textTertiary: "#a855f7",
      border: "rgba(131,24,67,0.08)",
      borderStrong: "rgba(219,39,119,0.2)",
      accent: "#db2777",
      accentMuted: "rgba(219,39,119,0.1)",
      violet: "#7c3aed",
      success: "#059669",
      danger: "#e11d48",
      gradientCanvas: ["#ffffff", "#fdf2f8", "#faf5ff"],
      orbCyan: "rgba(236,72,153,0.14)",
      orbViolet: "rgba(168,85,247,0.12)",
      heatTint: "rgba(219,39,119,0.05)",
    };
  }
  return {
    canvas: "#1a0520",
    surface: "rgba(59,7,46,0.92)",
    surfaceMuted: "rgba(88,28,72,0.88)",
    textPrimary: "#ffe4f3",
    textSecondary: "#f9a8d4",
    textTertiary: "#9d174d",
    border: "rgba(244,114,182,0.25)",
    borderStrong: "rgba(34,211,238,0.3)",
    accent: "#22d3ee",
    accentMuted: "rgba(34,211,238,0.15)",
    violet: "#f0abfc",
    success: "#4ade80",
    danger: "#fda4af",
    gradientCanvas: ["#1a0520", "#2e0b24", "#120618"],
    orbCyan: "rgba(34,211,238,0.35)",
    orbViolet: "rgba(240,171,252,0.32)",
    heatTint: "rgba(236,72,153,0.09)",
  };
}

function effects(opts: { reducedMotion: boolean }): ThemeVisualEffects {
  return {
    scanLineOpacity: opts.reducedMotion ? 0 : 0.055,
    gridLineOpacity: opts.reducedMotion ? 0 : 0.04,
    orbRingCount: opts.reducedMotion ? 1 : 3,
    particleBudget: opts.reducedMotion ? 0 : 8,
    useHeavyBlur: !opts.reducedMotion,
  };
}

export const synthwaveStyle: VisualStyleDefinition = {
  id: "synthwave",
  semantic,
  effects,
  defaultMotion: "energetic",
};
