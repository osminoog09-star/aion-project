import type { EcosystemStatus, EcosystemSubsystem } from "@/lib/ecosystem-types";

export type SubsystemNextBestAction = {
  id: string;
  name: string;
  status: EcosystemSubsystem["status"];
  readinessPercent: number;
  architectureState: string | null;
  missingUx: string[];
  missingBackend: string[];
  missingRealtime: string[];
  biggestWeakness: string | null;
  highestValueImprovement: string | null;
  requiredDependencies: string[];
  recommendedNextPhase: string | null;
  nextRecommendedStep: string | null;
  blockers: string[];
  nextMilestone: string | null;
};

function subsystemNextAction(s: EcosystemSubsystem): SubsystemNextBestAction {
  return {
    id: s.id,
    name: s.name,
    status: s.status,
    readinessPercent: s.percent,
    architectureState: s.architectureState ?? null,
    missingUx: s.missingUx ?? [],
    missingBackend: s.missingBackend ?? [],
    missingRealtime: s.missingRealtime ?? [],
    biggestWeakness: s.biggestWeakness ?? null,
    highestValueImprovement: s.highestValueImprovement ?? null,
    requiredDependencies: s.requiredDependencies ?? [],
    recommendedNextPhase: s.recommendedNextPhase ?? null,
    nextRecommendedStep: s.nextRecommendedStep ?? null,
    blockers: s.blockers ?? [],
    nextMilestone: s.nextMilestone ?? null,
  };
}

/** Roadmap-as-execution-engine payload for agents and /api/roadmap/execution. */
export function buildRoadmapExecutionPayload(eco: EcosystemStatus) {
  const queue = eco.executionQueue;
  const notes = eco.aiExecutionNotes;
  const nextBestActions = eco.subsystems.map(subsystemNextAction);
  return {
    meta: {
      kind: "roadmap_execution",
      ecosystemLastUpdated: eco.lastUpdated,
      source:
        "ecosystem-status.json + roadmap-subsystem-extensions.json + roadmap-execution.json (+ optional Supabase snapshots)",
    },
    aiExecutionNotes: notes ?? null,
    executionQueue: queue ?? null,
    executionPriorities: eco.execution ?? null,
    sprint: eco.sprint,
    epics: eco.epics,
    cursorExecutionRules: eco.cursorExecutionRules ?? [],
    definitionOfDone: eco.definitionOfDone ?? [],
    releaseQualityBar: eco.releaseQualityBar ?? [],
    milestones: eco.milestones ?? [],
    releasePhases: eco.releasePhases ?? [],
    technicalDebt: eco.technicalDebt ?? [],
    nextBestActions,
  };
}
