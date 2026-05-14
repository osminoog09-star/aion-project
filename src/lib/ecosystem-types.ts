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

export type OtaImpactLevel = "none" | "low" | "medium" | "high";

export type PlatformSlice = {
  /** 0–100; omit if not applicable. */
  percent?: number;
  note?: string;
};

/** Rich execution profile (merged from `roadmap-subsystem-extensions.json` + optional cloud). */
export type SubsystemExecutionProfile = {
  whatWorks?: string[];
  whatDoesNotWork?: string[];
  mocked?: string[];
  localOnly?: string[];
  cloudReady?: string[];
  requiresApk?: string[];
  otaSafe?: string[];
  subsystemDebt?: string[];
  otaImpact?: OtaImpactLevel;
  /** 0–100 editorial slices; omit if unknown. */
  realtimeReadiness?: number;
  backendReadiness?: number;
  productionReadiness?: number;
  /** One-line architecture / layering note for agents. */
  architectureState?: string;
  missingUx?: string[];
  missingBackend?: string[];
  missingRealtime?: string[];
  /** Single next implementation step (roadmap-driven). */
  nextRecommendedStep?: string;
  biggestWeakness?: string;
  highestValueImprovement?: string;
  requiredDependencies?: string[];
  recommendedNextPhase?: string;
};

/** Philosophy + collaboration contract (merged from `roadmap-execution.json`). */
export type AiExecutionNotes = {
  architecturePrinciples: string[];
  noFakeDoneRule: string;
  finishBeforeSwitchingRule: string;
  noPlaceholderUx: string;
  noDisconnectedSystems: string;
  noDuplicateLogic: string;
  ecosystemFirstArchitecture: string;
  cloudSourceOfTruthPolicy: string;
  realtimeFirstDirection: string;
  releaseQualityRequirements: string[];
  collaborationModel: {
    chatgpt: string[];
    cursor: string[];
  };
};

/** Prioritized execution queue — editorial; drives “what next”. */
export type ExecutionQueue = {
  currentActiveEpic: string;
  currentSubsystemFocus: string;
  nextImplementationTarget: string;
  blockedTasks: string[];
  releaseBlockers: string[];
  uxBlockers: string[];
  backendBlockers: string[];
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
} & SubsystemExecutionProfile;

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

export type VisionSection = {
  title: string;
  paragraphs: string[];
};

export type ExecutionPriorities = {
  currentPriority: string;
  nextPriority: string;
  blockedTasks: string[];
  activeEpics: string[];
  infrastructurePhase: string;
  frontendPhase: string;
  cloudPhase: string;
};

export type CloudSoTInfo = {
  /** Where the live merge reads from first when configured. */
  primary: "repository_json" | "supabase_snapshots";
  note: string;
  snapshotKinds: string[];
};

export type EcosystemStatus = {
  lastUpdated: string;
  maintainedInRepository: boolean;
  methodology: string;
  /** How “fully_done” may be claimed; enforced by editorial process, not code. */
  definitionOfDone?: string[];
  /** Explicit release / subsystem “really done” checklist. */
  releaseQualityBar?: string[];
  /** Shown on /operations — agent + human execution contract. */
  cursorExecutionRules?: string[];
  /** Agent philosophy + workflow; merged from roadmap-execution.json. */
  aiExecutionNotes?: AiExecutionNotes;
  /** Live prioritized queue for autonomous execution guidance. */
  executionQueue?: ExecutionQueue;
  vision?: VisionSection;
  execution?: ExecutionPriorities;
  cloudSoT?: CloudSoTInfo;
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
