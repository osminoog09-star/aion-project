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
  isContinuousOrchestration,
} from "@/contracts/execution-runtime";
import { CONTROL_MODE_RU, ownerControlMode } from "@/lib/operations/execution-owner-ru";
import { getLocalFieldValidationReport } from "@/lib/operations/field-validation-report";
import { getOwnerAutonomousMandate } from "@/lib/operations/owner-autonomous-mandate";
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
  orchestrationVersion?: string,
): { health: ExecutionHealth; heartbeatAgeMs: number; label: string } {
  const heartbeatMs = Date.parse(runtime.heartbeatAt || runtime.updatedAt);
  const heartbeatAgeMs = Number.isFinite(heartbeatMs)
    ? Math.max(0, nowMs - heartbeatMs)
    : HEARTBEAT_IDLE_MS + 1;

  let health: ExecutionHealth;
  if (runtime.status === "blocked" || runtime.lastValidation.build === "failed") {
    health = "blocked";
  } else if (runtime.status === "waiting_review" || runtime.status === "waiting_approval") {
    health = "waiting_review";
  } else if (runtime.status === "recovering") {
    health = "active";
  } else if (
    isContinuousOrchestration(runtime) ||
    runtime.status === "completed" ||
    runtime.status === "idle" ||
    Number.parseFloat(String(orchestrationVersion ?? "0")) >= 3
  ) {
    health = heartbeatAgeMs >= HEARTBEAT_IDLE_MS ? "continuous" : "continuous";
  } else if (heartbeatAgeMs < HEARTBEAT_ACTIVE_MS) {
    health = "active";
  } else if (heartbeatAgeMs < HEARTBEAT_IDLE_MS) {
    health = "continuous";
  } else {
    health = "stale";
  }

  const mode = ownerControlMode(runtime, health);
  return { health, heartbeatAgeMs, label: CONTROL_MODE_RU[mode] };
}

export function buildLiveExecutionView(doc: ExecutionRuntimeDocument) {
  const priorities = getLocalStrategicPriorities();
  const deployment = getLocalDeploymentStatus();
  const health = computeExecutionHealth(doc.runtime, Date.now(), doc.orchestrationVersion);
  const ownerMandate = getOwnerAutonomousMandate();
  const fieldValidationReport = getLocalFieldValidationReport();

  return {
    document: doc,
    runtime: doc.runtime,
    health,
    ownerMandate,
    fieldValidationReport,
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
