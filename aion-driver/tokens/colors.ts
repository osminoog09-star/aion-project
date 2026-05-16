/**
 * Единая палитра AION (dark cockpit). Используйте в StyleSheet / inline style;
 * для Tailwind оставляйте className, но подбирайте те же hex при новых экранах.
 */
export const colors = {
  canvas: "#030712",
  slate950: "#020617",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  white: "#ffffff",
  cyan400: "#22d3ee",
  cyan500: "#06b6d4",
  violet500: "#8b5cf6",
  violet400: "#a78bfa",
  emerald400: "#34d399",
  rose400: "#fb7185",
  rose500: "#f43f5e",
  /** Полупрозрачные */
  glassBorder: "rgba(255,255,255,0.1)",
  glassBorderCyan: "rgba(34,211,238,0.2)",
  glassBorderViolet: "rgba(167,139,250,0.2)",
  overlay: "rgba(0,0,0,0.7)",
} as const;

export const gradients = {
  buttonPrimary: ["#22d3ee", "#6366f1"] as const,
  buttonDanger: ["#fb7185", "#e11d48"] as const,
  buttonGhost: ["rgba(148,163,184,0.2)", "rgba(71,85,105,0.12)"] as const,
  buttonGlass: ["rgba(56,189,248,0.35)", "rgba(99,102,241,0.25)"] as const,
  cardSurface: ["rgba(15,23,42,0.88)", "rgba(3,7,18,0.55)"] as const,
  cardSurfaceElevated: ["rgba(15,23,42,0.96)", "rgba(3,7,18,0.92)"] as const,
  iconHalo: ["rgba(34,211,238,0.35)", "rgba(99,102,241,0.2)"] as const,
} as const;

export type ColorKey = keyof typeof colors;
