import strategicPrioritiesJson from "@/content/strategic-priorities.json";
import type {
  ExecutionDependencyNode,
  StrategicPrioritiesPayload,
  StrategicPriorityItem,
  StrategicPriorityLevel,
} from "@/lib/ecosystem-types";

const LEVEL_ORDER: Record<StrategicPriorityLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  blocked: 4,
  experimental: 5,
};

export function getLocalStrategicPriorities(): StrategicPrioritiesPayload {
  return strategicPrioritiesJson as StrategicPrioritiesPayload;
}

export function sortPriorities(items: StrategicPriorityItem[]): StrategicPriorityItem[] {
  return [...items].sort((a, b) => {
    const la = LEVEL_ORDER[a.level] ?? 9;
    const lb = LEVEL_ORDER[b.level] ?? 9;
    if (la !== lb) return la - lb;
    return a.title.localeCompare(b.title);
  });
}

/** Nodes whose dependencies are all satisfied (in_progress or done), not blocked. */
export function getActionableDependencies(
  graph: ExecutionDependencyNode[],
  priorities: StrategicPriorityItem[],
): ExecutionDependencyNode[] {
  const doneOrActive = new Set(
    priorities
      .filter((p) => p.status === "done" || p.status === "in_progress")
      .map((p) => p.id),
  );
  return graph.filter((node) => {
    if (node.status === "done") return false;
    if (node.status === "blocked") return false;
    return node.dependsOn.every((dep) => doneOrActive.has(dep));
  });
}

export function getBlockedDependencies(graph: ExecutionDependencyNode[]): ExecutionDependencyNode[] {
  return graph.filter((n) => n.status === "blocked");
}

export function buildAutonomousNextTargets(payload: StrategicPrioritiesPayload): string[] {
  const sorted = sortPriorities(payload.priorities).filter(
    (p) => p.level !== "blocked" && p.status !== "done" && p.status !== "blocked",
  );
  const targets: string[] = [];
  if (payload.ownerDirective) targets.push(`Owner: ${payload.ownerDirective}`);
  for (const p of sorted.slice(0, 5)) {
    targets.push(`[${p.level}] ${p.title}: ${p.nextAction}`);
  }
  const actionable = getActionableDependencies(payload.dependencyGraph, payload.priorities);
  for (const d of actionable.slice(0, 3)) {
    targets.push(`Dep ready: ${d.title}`);
  }
  return targets;
}

export function priorityLevelBadgeClass(level: StrategicPriorityLevel): string {
  switch (level) {
    case "critical":
      return "border-rose-500/50 bg-rose-500/15 text-rose-100";
    case "high":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    case "medium":
      return "border-cyan-500/35 bg-cyan-500/10 text-cyan-100";
    case "low":
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
    case "blocked":
      return "border-rose-500/30 bg-rose-950/40 text-rose-200/80";
    case "experimental":
      return "border-violet-500/40 bg-violet-500/10 text-violet-200";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}
