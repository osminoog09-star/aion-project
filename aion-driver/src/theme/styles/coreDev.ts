import { getAionSemantic, type AionSemantic } from "../../../tokens/semantic";
import type { ThemeVisualEffects, VisualStyleDefinition } from "../visualTypes";

function semantic(resolved: "light" | "dark"): AionSemantic {
  const base = getAionSemantic(resolved);
  if (resolved === "dark") {
    return {
      ...base,
      border: "rgba(148,163,184,0.14)",
      borderStrong: "rgba(186,230,253,0.22)",
      gradientCanvas: ["#020617", "#0b1224", "#050a14"],
      orbCyan: "rgba(56,189,248,0.38)",
      heatTint: "rgba(34,211,238,0.06)",
    };
  }
  return {
    ...base,
    surfaceMuted: "#e8eef5",
    borderStrong: "rgba(15,23,42,0.12)",
  };
}

function effects(opts: { reducedMotion: boolean }): ThemeVisualEffects {
  return {
    scanLineOpacity: opts.reducedMotion ? 0 : 0.02,
    gridLineOpacity: opts.reducedMotion ? 0 : 0.025,
    orbRingCount: opts.reducedMotion ? 1 : 2,
    particleBudget: opts.reducedMotion ? 0 : 4,
    useHeavyBlur: false,
  };
}

export const coreDevStyle: VisualStyleDefinition = {
  id: "core_dev",
  semantic,
  effects,
  defaultMotion: "subtle",
};
