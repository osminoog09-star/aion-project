import { HEARTBEAT_IDLE_MS } from "@/contracts/execution-runtime";
import type { ExecutionRuntimeCore, ExecutionRuntimeDocument } from "@/contracts/execution-runtime";
import { STALE_FORCED_PHASE } from "@/lib/operations/runtime-state-machine";

export type WatchdogResult = {
  stale: boolean;
  heartbeatAgeMs: number;
  shouldLockAutomation: boolean;
  suggestedPhase: typeof STALE_FORCED_PHASE | null;
  reasonRu: string | null;
};

export function evaluateRuntimeWatchdog(
  runtime: ExecutionRuntimeCore,
  nowMs = Date.now(),
): WatchdogResult {
  const heartbeatMs = Date.parse(runtime.heartbeatAt || runtime.updatedAt);
  const heartbeatAgeMs = Number.isFinite(heartbeatMs)
    ? Math.max(0, nowMs - heartbeatMs)
    : HEARTBEAT_IDLE_MS + 1;

  const stale = heartbeatAgeMs > HEARTBEAT_IDLE_MS;
  const activePhases = new Set([
    "coding",
    "validating",
    "deploying",
    "analyzing",
    "planning",
    "recovering",
  ]);

  if (!stale) {
    return {
      stale: false,
      heartbeatAgeMs,
      shouldLockAutomation: false,
      suggestedPhase: null,
      reasonRu: null,
    };
  }

  const looksActive = activePhases.has(runtime.phase) || activePhases.has(runtime.status);
  return {
    stale: true,
    heartbeatAgeMs,
    shouldLockAutomation: true,
    suggestedPhase: looksActive ? STALE_FORCED_PHASE : null,
    reasonRu: `Heartbeat устарел (${Math.round(heartbeatAgeMs / 1000)} сек) — live-связь потеряна.`,
  };
}

export function applyWatchdogToDocument(
  doc: ExecutionRuntimeDocument,
  watchdog: WatchdogResult,
): ExecutionRuntimeDocument {
  if (!watchdog.stale || !watchdog.suggestedPhase) return doc;

  const now = new Date().toISOString();
  return {
    ...doc,
    runtime: {
      ...doc.runtime,
      phase: watchdog.suggestedPhase,
      status: watchdog.suggestedPhase,
      validationProgress: watchdog.reasonRu,
      blocker: doc.runtime.blocker ?? "stale_heartbeat",
      updatedAt: now,
    },
    timeline: [
      {
        at: now,
        phase: watchdog.suggestedPhase,
        summary: `Watchdog: ${watchdog.reasonRu}`,
      },
      ...doc.timeline,
    ].slice(0, 64),
  };
}
