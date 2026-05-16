import { HEARTBEAT_IDLE_MS } from "@/contracts/execution-runtime";
import type { ExecutionRuntimeCore, ExecutionRuntimeStatus } from "@/contracts/execution-runtime";
import {
  assertRuntimeTransition,
  canTransitionRuntime,
} from "@/lib/operations/runtime-state-machine";
import { evaluateRuntimeWatchdog } from "@/lib/operations/runtime-watchdog";
import { evaluateReleaseIntelligence, type ReleaseIntelligence } from "@/lib/operations/release-intelligence";

export type GovernancePhase =
  | "idle"
  | "planning"
  | "coding"
  | "testing"
  | "building"
  | "deploying"
  | "waiting_validation"
  | "blocked"
  | "stale"
  | "failed"
  | "completed";

const PHASE_MAP: Record<GovernancePhase, ExecutionRuntimeStatus> = {
  idle: "idle",
  planning: "planning",
  coding: "coding",
  testing: "validating",
  building: "deploying",
  deploying: "deploying",
  waiting_validation: "waiting_approval",
  blocked: "blocked",
  stale: "recovering",
  failed: "blocked",
  completed: "completed",
};

export function toExecutionPhase(g: GovernancePhase): ExecutionRuntimeStatus {
  return PHASE_MAP[g];
}

export function fromExecutionPhase(p: ExecutionRuntimeStatus): GovernancePhase {
  const entry = Object.entries(PHASE_MAP).find(([, v]) => v === p);
  return (entry?.[0] as GovernancePhase) ?? "coding";
}

export type GovernanceDecision = {
  allowed: boolean;
  safeMode: boolean;
  automationLocked: boolean;
  reasonRu: string;
  release: ReleaseIntelligence;
  watchdogStale: boolean;
};

export async function evaluateEngineeringGovernance(
  runtime: ExecutionRuntimeCore,
): Promise<GovernanceDecision> {
  const release = await evaluateReleaseIntelligence();
  const watchdog = evaluateRuntimeWatchdog(runtime);

  const safeMode = release.safeMode || watchdog.shouldLockAutomation;
  const automationLocked = safeMode;

  let reasonRu = release.headlineRu;
  if (watchdog.stale) {
    reasonRu = watchdog.reasonRu ?? "Heartbeat устарел — automation paused";
  }

  return {
    allowed: !automationLocked,
    safeMode,
    automationLocked,
    reasonRu,
    release,
    watchdogStale: watchdog.stale,
  };
}

export async function canActivateRuntimePhase(
  target: ExecutionRuntimeStatus,
  current: ExecutionRuntimeCore,
): Promise<{ allowed: boolean; reasonRu: string }> {
  const gov = await evaluateEngineeringGovernance(current);

  if (gov.watchdogStale) {
    return {
      allowed: false,
      reasonRu: "Нельзя активировать фазу: heartbeat stale — сначала recovery",
    };
  }

  const validationPhases = new Set<ExecutionRuntimeStatus>([
    "waiting_approval",
    "validating",
  ]);
  if (validationPhases.has(target) && !gov.release.validationFlowsAllowed) {
    return {
      allowed: false,
      reasonRu: "Нельзя validation/waiting без compatible APK на устройстве",
    };
  }

  if (
    (target === "deploying" || target === "completed") &&
    !gov.release.runtimeActivationAllowed
  ) {
    return {
      allowed: false,
      reasonRu: "Runtime activation запрещён до release orchestration green",
    };
  }

  if (!canTransitionRuntime(current.phase, target)) {
    return {
      allowed: false,
      reasonRu: `Invalid transition ${current.phase} → ${target}`,
    };
  }

  return { allowed: true, reasonRu: "OK" };
}

export function assertGovernedTransition(
  from: ExecutionRuntimeStatus,
  to: ExecutionRuntimeStatus,
): { ok: true } | { ok: false; reason: string } {
  return assertRuntimeTransition(from, to);
}

/** Uncertainty → SAFE MODE (governance rule). */
export function uncertaintyToSafeMode(reason: string): {
  phase: ExecutionRuntimeStatus;
  blocker: string;
  validationProgress: string;
} {
  return {
    phase: "blocked",
    blocker: reason,
    validationProgress: `SAFE MODE: ${reason}`,
  };
}

export { HEARTBEAT_IDLE_MS };
