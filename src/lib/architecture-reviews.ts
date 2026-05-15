import queueJson from "@/content/architecture-review-queue.json";
import type {
  ArchitectureReviewQueuePayload,
  ArchitectureReviewRequest,
  ArchitectureReviewStatus,
  ArchitectureReviewTemplateId,
} from "@/lib/ecosystem-types";
import { getLocalStrategicPriorities } from "@/lib/strategic-priorities";
import { buildRoadmapExecutionPayload } from "@/lib/roadmap-execution";
import { getEcosystemStatus } from "@/lib/ecosystem-data";

export function getArchitectureReviewQueue(): ArchitectureReviewQueuePayload {
  return queueJson as ArchitectureReviewQueuePayload;
}

export type ReviewQueueStats = {
  pending: number;
  reviewing: number;
  approved: number;
  blocked: number;
  risky: number;
  resolved: number;
  total: number;
};

export function computeReviewQueueStats(
  requests: ArchitectureReviewRequest[],
): ReviewQueueStats {
  const stats: ReviewQueueStats = {
    pending: 0,
    reviewing: 0,
    approved: 0,
    blocked: 0,
    risky: 0,
    resolved: 0,
    total: requests.length,
  };
  for (const r of requests) {
    stats[r.status] += 1;
  }
  return stats;
}

export function filterActiveQueue(
  requests: ArchitectureReviewRequest[],
): ArchitectureReviewRequest[] {
  return requests.filter((r) => r.status === "pending" || r.status === "reviewing");
}

export function sortRequestsNewest(
  requests: ArchitectureReviewRequest[],
): ArchitectureReviewRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function buildReviewQueueContext(): Promise<{
  roadmapTarget: string;
  ownerDirective: string;
  blockedTasks: string[];
}> {
  const strategic = getLocalStrategicPriorities();
  const eco = await getEcosystemStatus();
  const ex = buildRoadmapExecutionPayload(eco);
  return {
    roadmapTarget:
      strategic.nextImplementationTarget ??
      ex.executionQueue?.nextImplementationTarget ??
      "—",
    ownerDirective: strategic.ownerDirective ?? "—",
    blockedTasks: [
      ...(ex.executionQueue?.blockedTasks ?? []),
      ...(eco.execution?.blockedTasks ?? []),
    ],
  };
}

export function statusBadgeClass(status: ArchitectureReviewStatus): string {
  switch (status) {
    case "pending":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "reviewing":
      return "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
    case "approved":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "blocked":
      return "border-rose-500/40 bg-rose-500/10 text-rose-200";
    case "risky":
      return "border-orange-500/40 bg-orange-500/10 text-orange-200";
    case "resolved":
      return "border-slate-500/40 bg-slate-500/10 text-slate-300";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export function shouldEscalateToReview(input: {
  confidence?: string;
  architectureUncertain?: boolean;
  runtimeRiskHigh?: boolean;
  dependencyConflict?: boolean;
  scalingRisk?: boolean;
}): boolean {
  if (input.confidence === "blocked" || input.confidence === "unstable") return true;
  if (input.confidence === "experimental") return true;
  return Boolean(
    input.architectureUncertain ||
      input.runtimeRiskHigh ||
      input.dependencyConflict ||
      input.scalingRisk,
  );
}

export type CreateReviewInput = {
  templateId: ArchitectureReviewTemplateId;
  title: string;
  subsystem: string;
  subsystemIds: string[];
  reasoning: string;
  architectureConcern: string;
  scalingConcern?: string;
  runtimeConcern?: string;
  dependencyConcern?: string;
  proposedDirection: string;
  confidence: ArchitectureReviewRequest["confidence"];
  affectedSystems: string[];
  roadmapItemId?: string;
  dependencyNodeIds?: string[];
  blockerIds?: string[];
  technicalDebtRefs?: string[];
  linkedCommitHashes?: string[];
  linkedFeedEventIds?: string[];
  status?: ArchitectureReviewStatus;
};
