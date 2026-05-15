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
  /** All must be satisfied before claiming subsystem `fully_done` in JSON. */
  trustedFullyDoneRequires?: string[];
  /** How ChatGPT ↔ Cursor ↔ roadmap stay aligned after shipping work. */
  collaborationWorkflow?: string[];
};

/** Validation hooks tracked in implementation feed + matrix. */
export type ValidationSignalId =
  | "typecheck"
  | "lint"
  | "web_build"
  | "apk_build"
  | "ota_publish"
  | "realtime_tests"
  | "cloud_tests"
  | "ocr_tests"
  | "eas_apk_manifest_sync";

export type ValidationSignalStatus = "passed" | "failed" | "skipped" | "pending" | "unknown";

/** Rollup lines for agent/report consumers (emoji + short fact). */
export type ImplementationRollup = {
  fullyDone: string[];
  partiallyDone: string[];
  notStarted: string[];
  technicalDebt: string[];
};

export type ImplementationFeedImpacts = {
  release?: "none" | "low" | "medium" | "high";
  otaApk?: "none" | "low" | "medium" | "high";
  backend?: "none" | "low" | "medium" | "high";
  realtime?: "none" | "low" | "medium" | "high";
  ux?: "none" | "low" | "medium" | "high";
  cloud?: "none" | "low" | "medium" | "high";
};

/** AI execution audit event kinds (portal + feed). */
export type ExecutionEventType =
  | "implementation_started"
  | "implementation_finished"
  | "architecture_change"
  | "runtime_change"
  | "apk_required"
  | "ota_safe"
  | "blocker_detected"
  | "validation_failed"
  | "validation_passed"
  | "technical_debt_added"
  | "technical_debt_removed"
  | "roadmap_updated"
  | "release_created"
  | "overlay_changed"
  | "ocr_pipeline_changed"
  | "priority_changed"
  | "architecture_review_requested"
  | "architecture_review_resolved";

export type AiConfidenceLevel = "high" | "medium" | "experimental" | "unstable" | "blocked";

/** @deprecated Use ArchitectureReviewRequest — kept for feed backward compat */
export type ArchitectureReviewRecord = {
  requestedAt: string;
  topic: string;
  requestReason: string;
  outcome?: "approved" | "warnings" | "rejected" | "pending";
  summary?: string;
  warnings?: string[];
};

export type ArchitectureReviewTemplateId =
  | "android-runtime"
  | "ocr-architecture"
  | "gps-storage"
  | "overlay-lifecycle"
  | "scaling"
  | "dependency"
  | "production-readiness"
  | "general";

export type ArchitectureReviewStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "blocked"
  | "risky"
  | "resolved";

export type ArchitectureReviewPacket = {
  generatedAt: string;
  markdown: string;
  sections: {
    context: string;
    concern: string;
    constraints: string;
    proposedDirection: string;
    questionsForReviewer: string[];
  };
};

export type ArchitectureReviewResult = {
  reviewedAt: string;
  reviewedBy: "chatgpt" | "owner" | "cursor";
  status: ArchitectureReviewStatus;
  approvedDirection?: string;
  warnings: string[];
  architectureNotes: string[];
  blockedReasons?: string[];
};

export type ArchitectureReviewRequest = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ArchitectureReviewStatus;
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
  confidence: AiConfidenceLevel;
  affectedSystems: string[];
  roadmapItemId?: string;
  dependencyNodeIds?: string[];
  blockerIds?: string[];
  technicalDebtRefs?: string[];
  linkedCommitHashes?: string[];
  linkedFeedEventIds?: string[];
  reviewPacket: ArchitectureReviewPacket;
  result?: ArchitectureReviewResult;
};

export type ArchitectureReviewTemplate = {
  id: ArchitectureReviewTemplateId;
  title: string;
  description: string;
  escalationTriggers: string[];
};

export type ArchitectureReviewQueuePayload = {
  lastUpdated: string;
  policy: string;
  orchestrationVersion: string;
  templates: ArchitectureReviewTemplate[];
  requests: ArchitectureReviewRequest[];
};

export type ImplementationFeedItem = {
  id: string;
  occurredAt: string;
  title: string;
  summary: string;
  subsystemIds: string[];
  activeEpicLabel?: string;
  commitHash?: string | null;
  repository?: string;
  rollup: ImplementationRollup;
  stillMissing: string[];
  blocked: string[];
  impacts: ImplementationFeedImpacts;
  validation: Partial<Record<ValidationSignalId, ValidationSignalStatus>>;
  /** AI execution audit (optional on legacy events). */
  eventType?: ExecutionEventType;
  task?: string;
  reasoning?: string;
  changedFiles?: string[];
  runtimeImpact?: string;
  apkImpact?: string;
  technicalDebtIntroduced?: string[];
  confidence?: AiConfidenceLevel;
  architectureReview?: ArchitectureReviewRecord;
  priorityAudit?: PriorityChangeAudit;
};

export type ValidationMatrixRow = {
  id: ValidationSignalId;
  label: string;
  lastKnown: ValidationSignalStatus;
  lastSignalAt?: string;
  evidence?: string;
};

export type ImplementationFeedPayload = {
  lastUpdated: string;
  maintainedInRepository: boolean;
  policy: string;
  items: ImplementationFeedItem[];
  validationMatrix: ValidationMatrixRow[];
};

/** Strategic priority control (MASTER §9). */
export type StrategicPriorityLevel =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "blocked"
  | "experimental";

export type StrategicPriorityStatus =
  | "not_started"
  | "in_progress"
  | "done"
  | "blocked";

export type StrategicPriorityItem = {
  id: string;
  title: string;
  level: StrategicPriorityLevel;
  subsystemIds: string[];
  status: StrategicPriorityStatus;
  rationale: string;
  nextAction: string;
  setAt: string;
  setBy: string;
  executionNotes?: string;
};

export type PriorityChangeRecord = {
  path: string;
  previousValue: string;
  newValue: string;
  affectedSubsystemIds?: string[];
};

export type PriorityChangeAudit = {
  reason: string;
  changedAt: string;
  changedBy: string;
  changes: PriorityChangeRecord[];
};

export type ExecutionDependencyNode = {
  id: string;
  title: string;
  dependsOn: string[];
  status: StrategicPriorityStatus | "blocked";
  reason: string;
};

export type StrategicPrioritiesPayload = {
  lastUpdated: string;
  constitutionVersion: string;
  ownerDirective: string;
  editPolicy: string;
  executionNotes?: string;
  nextImplementationTarget?: string;
  priorities: StrategicPriorityItem[];
  dependencyGraph: ExecutionDependencyNode[];
  cursorAdaptationRules: string[];
};

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
