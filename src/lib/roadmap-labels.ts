import type { LegacySubsystemStatus, RoadmapSubsystemStatus, SubsystemStatus } from "@/lib/ecosystem-types";

const ROADMAP_RU: Record<RoadmapSubsystemStatus, string> = {
  fully_done: "Готово",
  partially_done: "Частично",
  not_started: "Не начато",
  needs_refactor: "Нужен рефакторинг",
  experimental: "Эксперимент",
  blocked: "Заблокировано",
};

const LEGACY_RU: Record<LegacySubsystemStatus, string> = {
  partial: "Частично",
  done: "Готово",
  planned: "Запланировано",
};

export function subsystemStatusLabel(s: SubsystemStatus): string {
  if (s in LEGACY_RU) return LEGACY_RU[s as LegacySubsystemStatus];
  return ROADMAP_RU[s as RoadmapSubsystemStatus] ?? s;
}

export function subsystemStatusTone(
  s: SubsystemStatus,
): "emerald" | "amber" | "slate" | "rose" | "violet" | "cyan" {
  switch (s) {
    case "fully_done":
    case "done":
      return "emerald";
    case "partially_done":
    case "partial":
      return "amber";
    case "not_started":
    case "planned":
      return "slate";
    case "needs_refactor":
      return "rose";
    case "experimental":
      return "violet";
    case "blocked":
      return "rose";
    default:
      return "cyan";
  }
}
