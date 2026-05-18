import type {
  ExecutionDependencyNode,
  StrategicPrioritiesPayload,
  StrategicPriorityItem,
  StrategicPriorityLevel,
} from "@/lib/ecosystem-types";

export type PriorityValidationIssue = {
  id: string;
  severity: "warning" | "error";
  message: string;
  priorityId?: string;
};

const LEVEL_RANK: Record<StrategicPriorityLevel, number> = {
  strategic: -1,
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  blocked: 4,
  experimental: 5,
};

/** Hard blocks: cannot set overlay HUD above background runtime readiness. */
const DEPENDENCY_HARD_RULES: {
  priorityId: string;
  requiresDoneOrActive: string[];
  minLevelBlocked: StrategicPriorityLevel;
}[] = [
  {
    priorityId: "overlay-hud-evolution",
    requiresDoneOrActive: ["background-runtime-production", "unified-shift-runtime"],
    minLevelBlocked: "high",
  },
];

function priorityRank(level: StrategicPriorityLevel): number {
  return LEVEL_RANK[level] ?? 9;
}

function isSatisfied(
  depId: string,
  priorities: StrategicPriorityItem[],
  graph: ExecutionDependencyNode[],
): boolean {
  const p = priorities.find((x) => x.id === depId);
  if (p) return p.status === "done" || p.status === "in_progress";
  const node = graph.find((n) => n.id === depId);
  return node?.status === "done";
}

export function validateStrategicPriorities(
  payload: StrategicPrioritiesPayload,
): { ok: boolean; issues: PriorityValidationIssue[] } {
  const issues: PriorityValidationIssue[] = [];

  for (const rule of DEPENDENCY_HARD_RULES) {
    const target = payload.priorities.find((p) => p.id === rule.priorityId);
    if (!target) continue;
    const tooHigh =
      priorityRank(target.level) <= priorityRank(rule.minLevelBlocked) &&
      target.level !== "blocked" &&
      target.level !== "experimental";
    if (!tooHigh) continue;
    const unmet = rule.requiresDoneOrActive.filter(
      (dep) => !isSatisfied(dep, payload.priorities, payload.dependencyGraph),
    );
    if (unmet.length) {
      issues.push({
        id: `hard-${rule.priorityId}`,
        severity: "error",
        priorityId: rule.priorityId,
        message: `«${target.title}» не может быть ${target.level}: сначала ${unmet.join(", ")}.`,
      });
    }
  }

  for (const node of payload.dependencyGraph) {
    if (node.status !== "blocked") continue;
    const promoted = payload.priorities.find(
      (p) =>
        p.id.includes("overlay") ||
        (p.title.toLowerCase().includes("overlay") &&
          priorityRank(p.level) <= priorityRank("high")),
    );
    if (promoted && node.id.includes("overlay")) {
      issues.push({
        id: `dep-${node.id}`,
        severity: "warning",
        message: `Dependency «${node.title}» blocked: ${node.reason}`,
      });
    }
  }

  for (const p of payload.priorities) {
    if (p.level === "critical" && p.status === "blocked") {
      issues.push({
        id: `conflict-${p.id}`,
        severity: "error",
        priorityId: p.id,
        message: `«${p.title}»: level critical несовместим со status blocked.`,
      });
    }
    if (p.level === "strategic" && p.status !== "roadmap_only" && p.status !== "not_started") {
      issues.push({
        id: `strategic-status-${p.id}`,
        severity: "warning",
        priorityId: p.id,
        message: `«${p.title}»: стратегический приоритет должен оставаться roadmap_only до явного go владельца.`,
      });
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  return { ok: errors.length === 0, issues };
}

export function validateDependencyPromotion(
  priorityId: string,
  newLevel: StrategicPriorityLevel,
  payload: StrategicPrioritiesPayload,
): PriorityValidationIssue[] {
  const draft: StrategicPrioritiesPayload = {
    ...payload,
    priorities: payload.priorities.map((p) =>
      p.id === priorityId ? { ...p, level: newLevel } : p,
    ),
  };
  return validateStrategicPriorities(draft).issues.filter((i) => i.priorityId === priorityId);
}
