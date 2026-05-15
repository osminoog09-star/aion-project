import type {
  AiConfidenceLevel,
  EcosystemStatus,
  EcosystemSubsystem,
  ExecutionEventType,
  ImplementationFeedItem,
  ImplementationFeedPayload,
  RoadmapSubsystemStatus,
  ValidationMatrixRow,
} from "@/lib/ecosystem-types";
import { buildRoadmapExecutionPayload } from "@/lib/roadmap-execution";

export type SubsystemConfidenceRow = {
  id: string;
  name: string;
  status: RoadmapSubsystemStatus | string;
  percent: number;
  confidence: AiConfidenceLevel;
  note: string;
  blockers: string[];
  nextStep?: string;
};

export type RiskArea = {
  id: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  detail: string;
  subsystemIds?: string[];
};

export type ExecutionAuditView = {
  feed: ImplementationFeedPayload;
  eco: EcosystemStatus;
  nextTarget: string;
  blockedTasks: string[];
  subsystemConfidence: SubsystemConfidenceRow[];
  riskAreas: RiskArea[];
  recentDecisions: { at: string; title: string; reasoning: string; eventType?: string }[];
  plannedNext: string[];
};

function statusToConfidence(s: EcosystemSubsystem): AiConfidenceLevel {
  if (s.status === "blocked") return "blocked";
  if (s.status === "experimental" || s.status === "needs_refactor") return "experimental";
  if (s.status === "not_started") return "unstable";
  if (s.status === "partially_done" || s.status === "partial") return "medium";
  if (s.status === "fully_done" || s.status === "done") {
    return s.percent >= 85 ? "high" : "medium";
  }
  return "medium";
}

export function buildSubsystemConfidenceRows(subsystems: EcosystemSubsystem[]): SubsystemConfidenceRow[] {
  return subsystems.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    percent: s.percent,
    confidence: statusToConfidence(s),
    note: s.note,
    blockers: s.blockers ?? [],
    nextStep: s.nextRecommendedStep,
  }));
}

export function buildRiskAreas(eco: EcosystemStatus): RiskArea[] {
  const risks: RiskArea[] = [];
  for (const s of eco.subsystems) {
    if (s.status === "experimental" || s.status === "blocked") {
      risks.push({
        id: `risk-${s.id}`,
        label: s.name,
        severity: s.status === "blocked" ? "high" : "medium",
        detail: s.note,
        subsystemIds: [s.id],
      });
    }
    if (s.requiresApk?.length) {
      risks.push({
        id: `apk-${s.id}`,
        label: `${s.name}: APK scope`,
        severity: "medium",
        detail: s.requiresApk.join("; "),
        subsystemIds: [s.id],
      });
    }
  }
  for (const d of eco.technicalDebt ?? []) {
    if (d.severity === "high" || d.severity === "critical") {
      risks.push({
        id: d.id,
        label: d.title,
        severity: d.severity === "critical" ? "critical" : "high",
        detail: d.evidence,
        subsystemIds: d.subsystemId ? [d.subsystemId] : undefined,
      });
    }
  }
  const overlay = eco.subsystems.find((x) => x.id.includes("overlay") || x.name.toLowerCase().includes("orb"));
  if (overlay && overlay.percent < 70) {
    risks.push({
      id: "risk-overlay-oem",
      label: "Android overlay / OEM",
      severity: "high",
      detail: "SYSTEM_ALERT_WINDOW, battery, lifecycle — field validation required.",
      subsystemIds: [overlay.id],
    });
  }
  return risks;
}

export function buildExecutionAuditView(
  feed: ImplementationFeedPayload,
  eco: EcosystemStatus,
): ExecutionAuditView {
  const ex = buildRoadmapExecutionPayload(eco);
  const q = ex.executionQueue;
  const recentDecisions = feed.items
    .filter((ev) => ev.reasoning || ev.eventType)
    .slice(0, 12)
    .map((ev) => ({
      at: ev.occurredAt,
      title: ev.title,
      reasoning: ev.reasoning ?? ev.summary,
      eventType: ev.eventType,
    }));

  const plannedNext: string[] = [];
  if (q?.nextImplementationTarget) plannedNext.push(q.nextImplementationTarget);
  if (eco.execution?.nextPriority) plannedNext.push(eco.execution.nextPriority);
  for (const s of eco.subsystems) {
    if (s.nextRecommendedStep && s.priority === "P0") plannedNext.push(`${s.id}: ${s.nextRecommendedStep}`);
  }

  return {
    feed,
    eco,
    nextTarget: q?.nextImplementationTarget ?? eco.execution?.currentPriority ?? "—",
    blockedTasks: [
      ...(q?.blockedTasks ?? []),
      ...(eco.execution?.blockedTasks ?? []),
      ...(q?.releaseBlockers ?? []),
    ],
    subsystemConfidence: buildSubsystemConfidenceRows(eco.subsystems),
    riskAreas: buildRiskAreas(eco),
    recentDecisions,
    plannedNext: [...new Set(plannedNext)].slice(0, 8),
  };
}

export function confidenceBadgeClass(c: AiConfidenceLevel): string {
  switch (c) {
    case "high":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "medium":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
    case "experimental":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "unstable":
      return "border-orange-500/40 bg-orange-500/10 text-orange-200";
    case "blocked":
      return "border-rose-500/40 bg-rose-500/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export function filterFeedByEventType(
  items: ImplementationFeedItem[],
  types: ExecutionEventType[],
): ImplementationFeedItem[] {
  return items.filter((ev) => ev.eventType && types.includes(ev.eventType));
}

export function validationSummary(matrix: ValidationMatrixRow[]): {
  passed: number;
  failed: number;
  pending: number;
  unknown: number;
} {
  let passed = 0;
  let failed = 0;
  let pending = 0;
  let unknown = 0;
  for (const r of matrix) {
    if (r.lastKnown === "passed") passed += 1;
    else if (r.lastKnown === "failed") failed += 1;
    else if (r.lastKnown === "pending") pending += 1;
    else unknown += 1;
  }
  return { passed, failed, pending, unknown };
}
