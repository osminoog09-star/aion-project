import type { AionSemantic } from "../../../tokens/semantic";
import type { ThemeVisualEffects, VisualStyleDefinition } from "../visualTypes";

function semanticDark(): AionSemantic {
  return {
    canvas: "#05030f",
    surface: "rgba(12,6,28,0.92)",
    surfaceMuted: "rgba(24,12,42,0.88)",
    textPrimary: "#f0e9ff",
    textSecondary: "#c4b5fd",
    textTertiary: "#7c73a8",
    border: "rgba(236,72,153,0.22)",
    borderStrong: "rgba(34,211,238,0.35)",
    accent: "#22d3ee",
    accentMuted: "rgba(34,211,238,0.16)",
    violet: "#e879f9",
    success: "#4ade80",
    danger: "#fb7185",
    gradientCanvas: ["#080418", "#12081f", "#050312"],
    orbCyan: "rgba(34,211,238,0.42)",
    orbViolet: "rgba(232,121,249,0.35)",
    heatTint: "rgba(168,85,247,0.08)",
  };
}

function semanticLight(): AionSemantic {
  return {
    canvas: "#f8fafc",
    surface: "#ffffff",
    surfaceMuted: "#eef2ff",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textTertiary: "#94a3b8",
    border: "rgba(15,23,42,0.08)",
    borderStrong: "rgba(99,102,241,0.2)",
    accent: "#0891b2",
    accentMuted: "rgba(8,145,178,0.12)",
    violet: "#a855f7",
    success: "#059669",
    danger: "#e11d48",
    gradientCanvas: ["#faf5ff", "#ecfeff", "#f8fafc"],
    orbCyan: "rgba(6,182,212,0.2)",
    orbViolet: "rgba(168,85,247,0.16)",
    heatTint: "rgba(99,102,241,0.05)",
  };
}

function semantic(resolved: "light" | "dark"): AionSemantic {
  return resolved === "light" ? semanticLight() : semanticDark();
}

function effects(opts: { reducedMotion: boolean }): ThemeVisualEffects {
  return {
    scanLineOpacity: opts.reducedMotion ? 0 : 0.07,
    gridLineOpacity: opts.reducedMotion ? 0 : 0.045,
    orbRingCount: opts.reducedMotion ? 1 : 3,
    particleBudget: opts.reducedMotion ? 0 : 10,
    useHeavyBlur: !opts.reducedMotion,
  };
}

export const cyberpunkStyle: VisualStyleDefinition = {
  id: "cyberpunk",
  semantic,
  effects,
  defaultMotion: "cinematic",
};
