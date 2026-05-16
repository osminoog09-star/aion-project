import type { AionSemantic } from "../../../tokens/semantic";
import type { ThemeVisualEffects, VisualStyleDefinition } from "../visualTypes";

function semantic(resolved: "light" | "dark"): AionSemantic {
  if (resolved === "light") {
    return {
      canvas: "#f1f5f9",
      surface: "#ffffff",
      surfaceMuted: "#e2e8f0",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textTertiary: "#94a3b8",
      border: "rgba(15,23,42,0.08)",
      borderStrong: "rgba(30,58,138,0.18)",
      accent: "#1d4ed8",
      accentMuted: "rgba(29,78,216,0.1)",
      violet: "#5b21b6",
      success: "#047857",
      danger: "#be123c",
      gradientCanvas: ["#f8fafc", "#e0e7ff", "#f1f5f9"],
      orbCyan: "rgba(59,130,246,0.16)",
      orbViolet: "rgba(91,33,182,0.12)",
      heatTint: "rgba(29,78,216,0.05)",
    };
  }
  return {
    canvas: "#020617",
    surface: "rgba(15,23,42,0.94)",
    surfaceMuted: "rgba(30,41,59,0.9)",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textTertiary: "#64748b",
    border: "rgba(59,130,246,0.12)",
    borderStrong: "rgba(96,165,250,0.22)",
    accent: "#60a5fa",
    accentMuted: "rgba(96,165,250,0.14)",
    violet: "#a78bfa",
    success: "#34d399",
    danger: "#fb7185",
    gradientCanvas: ["#020617", "#0f172a", "#020c1f"],
    orbCyan: "rgba(59,130,246,0.32)",
    orbViolet: "rgba(129,140,248,0.26)",
    heatTint: "rgba(37,99,235,0.07)",
  };
}

function effects(opts: { reducedMotion: boolean }): ThemeVisualEffects {
  return {
    scanLineOpacity: opts.reducedMotion ? 0 : 0.03,
    gridLineOpacity: opts.reducedMotion ? 0 : 0.03,
    orbRingCount: opts.reducedMotion ? 1 : 2,
    particleBudget: opts.reducedMotion ? 0 : 4,
    useHeavyBlur: false,
  };
}

export const midnightProStyle: VisualStyleDefinition = {
  id: "midnight_pro",
  semantic,
  effects,
  defaultMotion: "subtle",
};
