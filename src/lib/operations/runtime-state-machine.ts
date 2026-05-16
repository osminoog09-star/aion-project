import type { ExecutionRuntimeStatus } from "@/contracts/execution-runtime";

/** Formal runtime phases for stabilization — invalid transitions rejected in patch layer. */
export const RUNTIME_PHASES = [
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
  "optimizing",
  "auditing",
] as const satisfies readonly ExecutionRuntimeStatus[];

const ALLOWED: Record<ExecutionRuntimeStatus, ExecutionRuntimeStatus[]> = {
  idle: ["planning", "analyzing", "coding", "blocked"],
  planning: ["analyzing", "coding", "blocked", "idle"],
  analyzing: ["coding", "planning", "validating", "blocked", "idle"],
  coding: ["validating", "deploying", "blocked", "waiting_approval", "waiting_review", "analyzing", "recovering"],
  validating: ["coding", "deploying", "blocked", "recovering", "completed"],
  reviewing: ["coding", "waiting_review", "blocked", "completed"],
  deploying: ["validating", "completed", "blocked", "recovering", "coding"],
  blocked: ["coding", "analyzing", "recovering", "waiting_approval", "idle"],
  waiting_approval: ["coding", "blocked", "idle"],
  waiting_review: ["coding", "blocked", "completed"],
  recovering: ["coding", "analyzing", "blocked", "validating"],
  completed: ["analyzing", "coding", "planning", "idle"],
  optimizing: ["coding", "auditing", "completed", "blocked"],
  auditing: ["coding", "optimizing", "completed", "blocked"],
};

export function canTransitionRuntime(
  from: ExecutionRuntimeStatus,
  to: ExecutionRuntimeStatus,
): boolean {
  if (from === to) return true;
  const allowed = ALLOWED[from];
  return allowed?.includes(to) ?? false;
}

export function assertRuntimeTransition(
  from: ExecutionRuntimeStatus,
  to: ExecutionRuntimeStatus,
): { ok: true } | { ok: false; reason: string } {
  if (canTransitionRuntime(from, to)) return { ok: true };
  return {
    ok: false,
    reason: `Invalid runtime transition: ${from} → ${to}`,
  };
}

/** Watchdog may force these transitions when heartbeat stale. */
export const STALE_FORCED_PHASE: ExecutionRuntimeStatus = "recovering";
