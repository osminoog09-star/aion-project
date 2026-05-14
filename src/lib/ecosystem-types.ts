/** Canonical roadmap / audit status (strict “done” rules live in methodology + definitionOfDone). */
export type RoadmapSubsystemStatus =
  | "fully_done"
  | "partially_done"
  | "not_started"
  | "needs_refactor"
  | "experimental"
  | "blocked";

/** Legacy JSON / older Supabase snapshots. */
export type LegacySubsystemStatus = "partial" | "done" | "planned";

export type SubsystemStatus = RoadmapSubsystemStatus | LegacySubsystemStatus;

export type PlatformSlice = {
  /** 0–100; omit if not applicable. */
  percent?: number;
  note?: string;
};

export type EcosystemSubsystem = {
  id: string;
  name: string;
  /** 0–100; set only when evidence-backed (see percentBasis). */
  percent: number;
  status: SubsystemStatus;
  note: string;
  /** One line: what evidence the % is based on (UI, backend, tests, etc.). */
  percentBasis?: string;
  currentPhase?: string;
  nextMilestone?: string;
  blockers?: string[];
  releaseReadiness?: "not_ready" | "preview" | "production_candidate";
  platforms?: {
    mobile?: PlatformSlice;
    web?: PlatformSlice;
    backend?: PlatformSlice;
  };
  priority?: "P0" | "P1" | "P2" | "P3";
};

export type TechnicalDebtItem = {
  id: string;
  subsystemId?: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  /** Observable signal (file, table, behavior) — not invented metrics. */
  evidence: string;
};

export type OperationsHealthRow = {
  id: string;
  label: string;
  percent: number;
  status: RoadmapSubsystemStatus | LegacySubsystemStatus;
  summary: string;
  lastSignal?: string;
};

export type ReleasePhase = {
  id: string;
  name: string;
  status: "past" | "active" | "planned";
  window?: string;
  description: string;
};

export type RoadmapMilestone = {
  id: string;
  title: string;
  target?: string;
  status: "done" | "in_progress" | "planned" | "blocked";
  subsystemIds: string[];
  note?: string;
};

export type EcosystemStatus = {
  lastUpdated: string;
  maintainedInRepository: boolean;
  methodology: string;
  /** How “fully_done” may be claimed; enforced by editorial process, not code. */
  definitionOfDone?: string[];
  sprint: { label: string; focus: string };
  readiness: Record<string, number>;
  subsystems: EcosystemSubsystem[];
  epics: { active: string[]; completed: string[] };
  operations?: OperationsHealthRow[];
  technicalDebt?: TechnicalDebtItem[];
  releasePhases?: ReleasePhase[];
  milestones?: RoadmapMilestone[];
};

export type ReleaseChannel = {
  id: string;
  label: string;
  description: string;
  appVersion: string;
  notes: string;
};

export type ReleasesPayload = {
  lastUpdated: string;
  maintainedInRepository: boolean;
  channels: ReleaseChannel[];
  apk: {
    latestKnownVersion: string;
    policy: string;
    publicManifestUrl: string | null;
    note: string;
  };
  history: { date: string; type: string; title: string; detail: string }[];
};
