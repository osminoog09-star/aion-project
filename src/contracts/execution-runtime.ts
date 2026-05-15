/** Canonical execution runtime contracts — single source for portal + scripts. */

export const EXECUTION_RUNTIME_STATUSES = [
  "idle",
  "planning",
  "analyzing",
  "coding",
  "validating",
  "reviewing",
  "deploying",
  "blocked",
  "waiting_approval",
  "waiting_review",
  "recovering",
  "completed",
] as const;

export type ExecutionRuntimeStatus = (typeof EXECUTION_RUNTIME_STATUSES)[number];

export type ValidationStepStatus = "idle" | "pending" | "running" | "passed" | "failed";

export type ExecutionLastValidation = {
  typecheck: ValidationStepStatus;
  build: ValidationStepStatus;
  deploy: ValidationStepStatus;
  routes?: ValidationStepStatus;
};

export type ExecutionRuntimeCore = {
  status: ExecutionRuntimeStatus;
  phase: ExecutionRuntimeStatus;
  currentTask: string;
  subsystem: string;
  reasoning: string;
  confidence: number;
  startedAt: string;
  updatedAt: string;
  heartbeatAt: string;
  files: string[];
  commitCandidate: string | null;
  blocker: string | null;
  nextStep: string;
  lastCompletedAction?: string | null;
  retryCount?: number;
  validationProgress?: string | null;
  recoveryConfidence?: number;
  branch?: string;
  dependencyTarget?: string;
  pendingReviewCount?: number;
  lastValidation: ExecutionLastValidation;
  lastFailure?: {
    kind: string;
    message: string;
    at: string;
  } | null;
};

export type ExecutionRuntimeTimelineEvent = {
  at: string;
  phase: string;
  summary: string;
  feedEventId?: string | null;
  /** Owner-facing Russian (human mode) */
  titleRu?: string;
  explanationRu?: string;
  resultRu?: string;
  icon?: string;
  confidence?: number;
};

export type ExecutionRuntimeHeartbeat = { at: string };

export type ExecutionRuntimeDocument = {
  version: string;
  orchestrationVersion: string;
  agentId: string;
  lastUpdated: string;
  runtime: ExecutionRuntimeCore;
  timeline: ExecutionRuntimeTimelineEvent[];
  heartbeats: ExecutionRuntimeHeartbeat[];
};

export type ExecutionHealth = "active" | "idle" | "waiting_review" | "blocked" | "stale";

export const HEARTBEAT_ACTIVE_MS = 15_000;
export const HEARTBEAT_IDLE_MS = 60_000;
