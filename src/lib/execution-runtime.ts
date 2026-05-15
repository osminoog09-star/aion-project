import { readFileSync } from "node:fs";
import path from "node:path";
import { getLocalStrategicPriorities } from "@/lib/strategic-priorities";

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
  "completed",
] as const;

export type ExecutionRuntimeStatus = (typeof EXECUTION_RUNTIME_STATUSES)[number];

export type ExecutionRuntimeState = {
  status: ExecutionRuntimeStatus;
  currentTask: string;
  subsystem: string;
  reasoning: string;
  confidence: number;
  startedAt: string;
  updatedAt: string;
  files: string[];
  commitCandidate: string | null;
  blocker: string | null;
  nextStep: string;
  branch?: string;
  dependencyTarget?: string;
  validationStatus?: "pending" | "running" | "passed" | "failed";
  pendingReviewCount?: number;
};

export type ExecutionRuntimeTimelineEvent = {
  at: string;
  phase: ExecutionRuntimeStatus | string;
  summary: string;
};

export type ExecutionRuntimeHeartbeat = {
  at: string;
};

export type ExecutionRuntimePayload = {
  version: string;
  orchestrationVersion: string;
  agentId: string;
  lastUpdated: string;
  state: ExecutionRuntimeState;
  timeline: ExecutionRuntimeTimelineEvent[];
  heartbeats: ExecutionRuntimeHeartbeat[];
};

export type ExecutionHealth = "active" | "waiting_review" | "blocked" | "stale" | "idle";

const CONTENT_FILE = path.join(
  process.cwd(),
  "src/content/execution-runtime-state.json",
);

const ACTIVE_MS = 45_000;
const STALE_MS = 120_000;

export function getLocalExecutionRuntime(): ExecutionRuntimePayload {
  const raw = readFileSync(CONTENT_FILE, "utf8");
  return JSON.parse(raw) as ExecutionRuntimePayload;
}

export function computeExecutionHealth(
  state: ExecutionRuntimeState,
  nowMs = Date.now(),
): { health: ExecutionHealth; heartbeatAgeMs: number; label: string } {
  const updatedMs = Date.parse(state.updatedAt);
  const heartbeatAgeMs = Number.isFinite(updatedMs) ? Math.max(0, nowMs - updatedMs) : STALE_MS + 1;

  if (state.status === "blocked") {
    return { health: "blocked", heartbeatAgeMs, label: "blocked" };
  }
  if (state.status === "waiting_review" || state.status === "waiting_approval") {
    return { health: "waiting_review", heartbeatAgeMs, label: "waiting_review" };
  }
  if (state.status === "completed" || state.status === "idle") {
    return { health: "idle", heartbeatAgeMs, label: state.status };
  }
  if (heartbeatAgeMs <= ACTIVE_MS) {
    return { health: "active", heartbeatAgeMs, label: "active" };
  }
  if (heartbeatAgeMs <= STALE_MS) {
    return { health: "stale", heartbeatAgeMs, label: "stale" };
  }
  return { health: "stale", heartbeatAgeMs, label: "stale" };
}

export function buildLiveExecutionView(payload: ExecutionRuntimePayload) {
  const priorities = getLocalStrategicPriorities();
  const health = computeExecutionHealth(payload.state);

  return {
    payload,
    health,
    dependencyTarget:
      payload.state.dependencyTarget ?? priorities.nextImplementationTarget ?? "—",
    primaryObjective: priorities.ownerDirective ?? priorities.nextImplementationTarget,
    orchestrationNote: priorities.autonomousOrchestration ?? null,
  };
}

export type LiveExecutionView = ReturnType<typeof buildLiveExecutionView>;
