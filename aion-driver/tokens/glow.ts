/** Неоновые акценты (совместно с tailwind cyan/violet) */
export const glow = {
  cyan: {
    border: "rgba(34,211,238,0.2)",
    softBg: "rgba(34,211,238,0.08)",
    text: "#67e8f9",
  },
  violet: {
    border: "rgba(167,139,250,0.2)",
    softBg: "rgba(139,92,246,0.1)",
    text: "#c4b5fd",
  },
  neutral: {
    border: "rgba(255,255,255,0.1)",
    softBg: "rgba(255,255,255,0.05)",
    text: "#94a3b8",
  },
} as const;

export type GlowVariant = keyof typeof glow;
