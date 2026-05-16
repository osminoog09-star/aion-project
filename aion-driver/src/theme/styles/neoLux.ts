import type { AionSemantic } from "../../../tokens/semantic";
import type { ThemeVisualEffects, VisualStyleDefinition } from "../visualTypes";

function semantic(resolved: "light" | "dark"): AionSemantic {
  if (resolved === "light") {
    return {
      canvas: "#faf8f5",
      surface: "#ffffff",
      surfaceMuted: "#f3efe8",
      textPrimary: "#1c1917",
      textSecondary: "#57534e",
      textTertiary: "#a8a29e",
      border: "rgba(28,25,23,0.08)",
      borderStrong: "rgba(180,83,9,0.2)",
      accent: "#b45309",
      accentMuted: "rgba(180,83,9,0.12)",
      violet: "#7c3aed",
      success: "#15803d",
      danger: "#be123c",
      gradientCanvas: ["#fffdfb", "#faf5ef", "#f8fafc"],
      orbCyan: "rgba(14,165,233,0.12)",
      orbViolet: "rgba(124,58,237,0.1)",
      heatTint: "rgba(180,83,9,0.04)",
    };
  }
  return {
    canvas: "#0c0a09",
    surface: "rgba(28,25,23,0.92)",
    surfaceMuted: "rgba(41,37,36,0.88)",
    textPrimary: "#fafaf9",
    textSecondary: "#d6d3d1",
    textTertiary: "#78716c",
    border: "rgba(251,191,36,0.15)",
    borderStrong: "rgba(252,211,77,0.28)",
    accent: "#fbbf24",
    accentMuted: "rgba(251,191,36,0.14)",
    violet: "#c4b5fd",
    success: "#86efac",
    danger: "#fda4af",
    gradientCanvas: ["#0c0a09", "#1c1410", "#0f0b09"],
    orbCyan: "rgba(56,189,248,0.18)",
    orbViolet: "rgba(196,181,253,0.22)",
    heatTint: "rgba(251,191,36,0.06)",
  };
}

function effects(opts: { reducedMotion: boolean }): ThemeVisualEffects {
  return {
    scanLineOpacity: opts.reducedMotion ? 0 : 0.03,
    gridLineOpacity: opts.reducedMotion ? 0 : 0.02,
    orbRingCount: opts.reducedMotion ? 1 : 2,
    particleBudget: opts.reducedMotion ? 0 : 5,
    useHeavyBlur: false,
  };
}

export const neoLuxStyle: VisualStyleDefinition = {
  id: "neo_lux",
  semantic,
  effects,
  defaultMotion: "cinematic",
};
