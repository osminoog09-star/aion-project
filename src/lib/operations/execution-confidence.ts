import type { ReleaseIntelligence } from "@/lib/operations/release-intelligence";
import type { GovernanceDecision } from "@/lib/operations/runtime-governance";

export type ExecutionConfidenceInput = {
  governance: GovernanceDecision;
  release: ReleaseIntelligence;
  credentials: {
    githubToken: boolean;
    expoToken: boolean;
    ownerSecret: boolean;
    supabaseServiceRole: boolean;
  };
  deviceHeartbeatFresh: boolean;
  apkManifestCompatible: boolean;
  ciAvailable: boolean;
  localEasBlocked: boolean;
};

export type ExecutionConfidence = {
  autonomousAllowed: boolean;
  requiresHuman: boolean;
  confidence: number;
  reason: string;
  reasonRu: string;
  nextAutonomousAction: string | null;
  humanBoundary: string | null;
};

export function evaluateExecutionConfidence(
  input: ExecutionConfidenceInput,
): ExecutionConfidence {
  const {
    governance,
    release,
    credentials,
    deviceHeartbeatFresh,
    apkManifestCompatible,
    ciAvailable,
    localEasBlocked,
  } = input;

  let score = 0.5;
  const reasons: string[] = [];

  if (credentials.githubToken || credentials.expoToken) {
    score += 0.15;
    reasons.push("CI credentials available");
  } else {
    score -= 0.2;
    reasons.push("No GITHUB_TOKEN/EXPO_TOKEN — GHA trigger needs bootstrap");
  }

  if (apkManifestCompatible) {
    score += 0.2;
  } else if (release.apkBuildRequired) {
    score -= 0.05;
    if (credentials.githubToken || credentials.expoToken) {
      reasons.push("APK build can proceed via GHA autonomously");
    }
  }

  if (deviceHeartbeatFresh) {
    score += 0.15;
  } else if (apkManifestCompatible) {
    reasons.push("Manifest OK — human: install APK + open Driver");
  }

  if (governance.watchdogStale) {
    score -= 0.25;
    reasons.push("Runtime heartbeat stale");
  }

  if (governance.safeMode && !apkManifestCompatible) {
    score -= 0.1;
    reasons.push("SAFE MODE active (expected until compatible APK)");
  }

  if (ciAvailable) score += 0.05;
  if (localEasBlocked && (credentials.githubToken || credentials.expoToken)) {
    score += 0.1;
    reasons.push("Local EAS blocked — GHA fallback viable");
  }

  if (credentials.ownerSecret && credentials.supabaseServiceRole) {
    score += 0.1;
  }

  score = Math.max(0, Math.min(1, score));

  const humanBoundary = !deviceHeartbeatFresh && apkManifestCompatible
    ? "physical_apk_install_and_open_driver"
    : !credentials.githubToken && !credentials.expoToken && release.apkBuildRequired
      ? "credentials_bootstrap_or_manual_gha_trigger"
      : null;

  const requiresHuman = humanBoundary != null;

  let nextAutonomousAction: string | null = null;
  if (!apkManifestCompatible && (credentials.githubToken || credentials.expoToken)) {
    nextAutonomousAction = "trigger_gha_eas_preview_build";
  } else if (apkManifestCompatible && !deviceHeartbeatFresh) {
    nextAutonomousAction = null;
  } else if (apkManifestCompatible && deviceHeartbeatFresh && release.runtimeActivationAllowed) {
    nextAutonomousAction = "release_orchestrate_activate_runtime";
  } else if (apkManifestCompatible) {
    nextAutonomousAction = "stabilization_signoff_strict";
  }

  const autonomousAllowed =
    !governance.watchdogStale &&
    (Boolean(nextAutonomousAction) || (!requiresHuman && score >= 0.45));

  const reasonRu = requiresHuman
    ? humanBoundary === "physical_apk_install_and_open_driver"
      ? "Автономия до установки APK на устройство; далее — открыть Driver"
      : "Нужен GITHUB_TOKEN или ручной запуск GHA workflow"
    : autonomousAllowed
      ? "Можно продолжать оркестрацию автономно"
      : governance.reasonRu;

  return {
    autonomousAllowed,
    requiresHuman,
    confidence: score,
    reason: reasons.join("; ") || governance.reasonRu,
    reasonRu,
    nextAutonomousAction,
    humanBoundary,
  };
}
