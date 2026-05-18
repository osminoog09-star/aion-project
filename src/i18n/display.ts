import { t } from "./get-translations";

/** UI-лейблы для enum-ключей SoT (значения в JSON/API остаются на английском). */

const reviewStatusKeys = [
  "pending",
  "reviewing",
  "approved",
  "risky",
  "blocked",
  "resolved",
] as const;

const deployStatusKeys = ["ok", "in_progress", "failed", "stale"] as const;

const validationKeys = ["passed", "failed", "pending", "unknown"] as const;

const priorityLevelKeys = [
  "strategic",
  "critical",
  "high",
  "medium",
  "low",
  "blocked",
  "experimental",
] as const;

const priorityStatusKeys = [
  "not_started",
  "in_progress",
  "done",
  "blocked",
  "roadmap_only",
] as const;

const confidenceKeys = ["high", "medium", "low", "unknown"] as const;

export function reviewStatusLabel(status: string): string {
  const key = reviewStatusKeys.includes(status as (typeof reviewStatusKeys)[number])
    ? status
    : null;
  return key ? t(`display.reviewStatus.${key}`) : status;
}

export function deployStatusLabel(status: string): string {
  const key = deployStatusKeys.includes(status as (typeof deployStatusKeys)[number])
    ? status
    : null;
  return key ? t(`display.deployStatus.${key}`) : status;
}

export function validationLabel(key: string): string {
  return validationKeys.includes(key as (typeof validationKeys)[number])
    ? t(`display.validation.${key}`)
    : key;
}

export function priorityLevelLabel(level: string): string {
  return priorityLevelKeys.includes(level as (typeof priorityLevelKeys)[number])
    ? t(`display.priorityLevel.${level}`)
    : level;
}

export function priorityStatusLabel(status: string): string {
  return priorityStatusKeys.includes(status as (typeof priorityStatusKeys)[number])
    ? t(`display.priorityStatus.${status}`)
    : status;
}

export function confidenceLabel(confidence: string): string {
  return confidenceKeys.includes(confidence as (typeof confidenceKeys)[number])
    ? t(`display.confidence.${confidence}`)
    : confidence;
}

export function routeCheckLabel(passed: boolean): string {
  return passed ? t("display.routeCheck.pass") : t("display.routeCheck.fail");
}

export function renderCheckLabel(ok: boolean | undefined): string {
  return ok ? t("display.renderCheck.ok") : t("display.renderCheck.fail");
}
