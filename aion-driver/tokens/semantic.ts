/**
 * Семантические цвета AION (dark OLED / light Tesla-like).
 * Используйте через ThemeContext, не хардкодьте hex на экранах.
 */
export type AionSemantic = {
  canvas: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentMuted: string;
  violet: string;
  success: string;
  danger: string;
  /** Градиент фона [top, mid, bottom] */
  gradientCanvas: readonly [string, string, string];
  orbCyan: string;
  orbViolet: string;
  heatTint: string;
};

export function getAionSemantic(resolved: "light" | "dark"): AionSemantic {
  if (resolved === "light") {
    return {
      canvas: "#f1f5f9",
      surface: "#ffffff",
      surfaceMuted: "#e2e8f0",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textTertiary: "#94a3b8",
      border: "rgba(15,23,42,0.08)",
      borderStrong: "rgba(15,23,42,0.14)",
      accent: "#0284c7",
      accentMuted: "rgba(2,132,199,0.12)",
      violet: "#7c3aed",
      success: "#059669",
      danger: "#e11d48",
      gradientCanvas: ["#f8fafc", "#eef2ff", "#f1f5f9"],
      orbCyan: "rgba(14,165,233,0.18)",
      orbViolet: "rgba(124,58,237,0.14)",
      heatTint: "rgba(2,132,199,0.06)",
    };
  }
  return {
    canvas: "#030712",
    surface: "rgba(15,23,42,0.92)",
    surfaceMuted: "rgba(30,41,59,0.85)",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textTertiary: "#64748b",
    border: "rgba(255,255,255,0.1)",
    borderStrong: "rgba(255,255,255,0.16)",
    accent: "#22d3ee",
    accentMuted: "rgba(34,211,238,0.14)",
    violet: "#a78bfa",
    success: "#34d399",
    danger: "#fb7185",
    gradientCanvas: ["#030712", "#0c1222", "#050816"],
    orbCyan: "rgba(56,189,248,0.35)",
    orbViolet: "rgba(139,92,246,0.28)",
    heatTint: "rgba(6,182,212,0.07)",
  };
}
