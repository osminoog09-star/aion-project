import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  ExecutionHealth,
  ExecutionRuntimeCore,
  ExecutionRuntimeDocument,
  ExecutionRuntimeStatus,
  ExecutionLastValidation,
} from "@/contracts/execution-runtime";
import {
  EXECUTION_RUNTIME_STATUSES,
  HEARTBEAT_ACTIVE_MS,
  HEARTBEAT_IDLE_MS,
} from "@/contracts/execution-runtime";
import { getLocalStrategicPriorities } from "@/lib/strategic-priorities";
import deploymentJson from "@/content/deployment-status.json";
import type { DeploymentStatusPayload } from "@/contracts/deployment-status";

export {
  EXECUTION_RUNTIME_STATUSES,
  type ExecutionRuntimeStatus,
  type ExecutionRuntimeDocument,
  type ExecutionRuntimeCore,
  type ExecutionHealth,
};

const RUNTIME_FILE = path.join(process.cwd(), "src/content/execution-runtime.json");

function defaultValidation(): ExecutionLastValidation {
  return { typecheck: "idle", build: "idle", deploy: "idle", routes: "idle" };
}

function normalizeLegacy(raw: Record<string, unknown>): ExecutionRuntimeDocument {
  const state = raw.state as Record<string, unknown>;
  const status = (state.status as ExecutionRuntimeStatus) ?? "idle";
  const now = new Date().toISOString();
  return {
    version: String(raw.version ?? "1.0"),
    orchestrationVersion: String(raw.orchestrationVersion ?? "1.0"),
    agentId: String(raw.agentId ?? "cursor-autonomous"),
    lastUpdated: String(raw.lastUpdated ?? now.slice(0, 10)),
    runtime: {
      status,
      phase: status,
      currentTask: String(state.currentTask ?? ""),
      subsystem: String(state.subsystem ?? "operations-center"),
      reasoning: String(state.reasoning ?? ""),
      confidence: Number(state.confidence ?? 0.5),
      startedAt: String(state.startedAt ?? now),
      updatedAt: String(state.updatedAt ?? now),
      heartbeatAt: String(state.updatedAt ?? now),
      files: Array.isArray(state.files) ? (state.files as string[]) : [],
      commitCandidate: (state.commitCandidate as string | null) ?? null,
      blocker: (state.blocker as string | null) ?? null,
      nextStep: String(state.nextStep ?? ""),
      branch: state.branch as string | undefined,
      dependencyTarget: state.dependencyTarget as string | undefined,
      pendingReviewCount: state.pendingReviewCount as number | undefined,
      lastValidation: defaultValidation(),
    },
    timeline: Array.isArray(raw.timeline) ? (raw.timeline as ExecutionRuntimeDocument["timeline"]) : [],
    heartbeats: Array.isArray(raw.heartbeats)
      ? (raw.heartbeats as ExecutionRuntimeDocument["heartbeats"])
      : [],
  };
}

export function getLocalExecutionRuntime(): ExecutionRuntimeDocument {
  const raw = JSON.parse(readFileSync(RUNTIME_FILE, "utf8")) as Record<string, unknown>;
  if (raw.runtime && typeof raw.runtime === "object") {
    return raw as unknown as ExecutionRuntimeDocument;
  }
  return normalizeLegacy(raw);
}

export function getLocalDeploymentStatus(): DeploymentStatusPayload {
  return deploymentJson as DeploymentStatusPayload;
}

export function computeExecutionHealth(
  runtime: ExecutionRuntimeCore,
  nowMs = Date.now(),
): { health: ExecutionHealth; heartbeatAgeMs: number; label: string } {
  const heartbeatMs = Date.parse(runtime.heartbeatAt || runtime.updatedAt);
  const heartbeatAgeMs = Number.isFinite(heartbeatMs)
    ? Math.max(0, nowMs - heartbeatMs)
    : HEARTBEAT_IDLE_MS + 1;

  if (runtime.status === "blocked" || runtime.lastValidation.build === "failed") {
    return { health: "blocked", heartbeatAgeMs, label: "blocked" };
  }
  if (runtime.status === "waiting_review" || runtime.status === "waiting_approval") {
    return { health: "waiting_review", heartbeatAgeMs, label: "waiting_review" };
  }
  if (runtime.status === "recovering") {
    return { health: "active", heartbeatAgeMs, label: "recovering" };
  }
  if (runtime.status === "completed" || runtime.status === "idle") {
    return { health: "idle", heartbeatAgeMs, label: runtime.status };
  }
  if (heartbeatAgeMs < HEARTBEAT_ACTIVE_MS) {
    return { health: "active", heartbeatAgeMs, label: "active" };
  }
  if (heartbeatAgeMs < HEARTBEAT_IDLE_MS) {
    return { health: "idle", heartbeatAgeMs, label: "idle" };
  }
  return { health: "stale", heartbeatAgeMs, label: "stale" };
}

export function buildLiveExecutionView(doc: ExecutionRuntimeDocument) {
  const priorities = getLocalStrategicPriorities();
  const deployment = getLocalDeploymentStatus();
  const health = computeExecutionHealth(doc.runtime);

  return {
    document: doc,
    runtime: doc.runtime,
    health,
    deployment,
    dependencyTarget:
      doc.runtime.dependencyTarget ?? priorities.nextImplementationTarget ?? "—",
    primaryObjective: priorities.ownerDirective ?? priorities.nextImplementationTarget ?? "—",
    orchestrationNote: priorities.autonomousOrchestration ?? null,
  };
}

export type LiveExecutionView = ReturnType<typeof buildLiveExecutionView>;

/** @deprecated use ExecutionRuntimeDocument */
export type ExecutionRuntimePayload = ExecutionRuntimeDocument;
export type ExecutionRuntimeState = ExecutionRuntimeCore;
