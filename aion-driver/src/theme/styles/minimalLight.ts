import type { AionSemantic } from "../../../tokens/semantic";
import type { ThemeVisualEffects, VisualStyleDefinition } from "../visualTypes";

/** Nothing / Apple-like light; dark mode uses calm graphite (not inverted neon). */
function semantic(resolved: "light" | "dark"): AionSemantic {
  if (resolved === "light") {
    return {
      canvas: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#f4f4f5",
      textPrimary: "#09090b",
      textSecondary: "#52525b",
      textTertiary: "#a1a1aa",
      border: "rgba(9,9,11,0.06)",
      borderStrong: "rgba(9,9,11,0.1)",
      accent: "#18181b",
      accentMuted: "rgba(24,24,27,0.06)",
      violet: "#6366f1",
      success: "#16a34a",
      danger: "#dc2626",
      gradientCanvas: ["#ffffff", "#fafafa", "#f4f4f5"],
      orbCyan: "rgba(24,24,27,0.06)",
      orbViolet: "rgba(99,102,241,0.08)",
      heatTint: "rgba(24,24,27,0.03)",
    };
  }
  return {
    canvas: "#18181b",
    surface: "rgba(39,39,42,0.94)",
    surfaceMuted: "rgba(63,63,70,0.88)",
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    textTertiary: "#71717a",
    border: "rgba(250,250,250,0.08)",
    borderStrong: "rgba(250,250,250,0.14)",
    accent: "#fafafa",
    accentMuted: "rgba(250,250,250,0.08)",
    violet: "#a78bfa",
    success: "#4ade80",
    danger: "#fb7185",
    gradientCanvas: ["#09090b", "#18181b", "#27272a"],
    orbCyan: "rgba(250,250,250,0.06)",
    orbViolet: "rgba(167,139,250,0.12)",
    heatTint: "rgba(250,250,250,0.04)",
  };
}

function effects(opts: { reducedMotion: boolean }): ThemeVisualEffects {
  return {
    scanLineOpacity: 0,
    gridLineOpacity: opts.reducedMotion ? 0 : 0.015,
    orbRingCount: 1,
    particleBudget: 0,
    useHeavyBlur: false,
  };
}

export const minimalLightStyle: VisualStyleDefinition = {
  id: "minimal_light",
  semantic,
  effects,
  defaultMotion: "subtle",
};
