import type { AionSemantic } from "../../../tokens/semantic";
import type { VisualStyleDefinition, VisualStyleId, ThemeVisualEffects, MotionIntensity } from "../visualTypes";
import { cyberpunkStyle } from "./cyberpunk";
import { coreDevStyle } from "./coreDev";
import { midnightProStyle } from "./midnightPro";
import { minimalLightStyle } from "./minimalLight";
import { neoLuxStyle } from "./neoLux";
import { synthwaveStyle } from "./synthwave";

const DEFINITIONS: Record<VisualStyleId, VisualStyleDefinition> = {
  core_dev: coreDevStyle,
  cyberpunk: cyberpunkStyle,
  neo_lux: neoLuxStyle,
  minimal_light: minimalLightStyle,
  midnight_pro: midnightProStyle,
  synthwave: synthwaveStyle,
};

export const VISUAL_STYLE_IDS = Object.keys(DEFINITIONS) as VisualStyleId[];

export function isVisualStyleId(value: string): value is VisualStyleId {
  return value in DEFINITIONS;
}

export function resolveVisualSemantic(
  id: VisualStyleId,
  resolved: "light" | "dark",
): AionSemantic {
  return DEFINITIONS[id]?.semantic(resolved) ?? DEFINITIONS.core_dev.semantic(resolved);
}

export function resolveVisualEffects(
  id: VisualStyleId,
  reducedMotion: boolean,
): ThemeVisualEffects {
  return DEFINITIONS[id]?.effects({ reducedMotion }) ?? DEFINITIONS.core_dev.effects({ reducedMotion });
}

export function defaultMotionForStyle(id: VisualStyleId): MotionIntensity {
  return DEFINITIONS[id]?.defaultMotion ?? "subtle";
}
