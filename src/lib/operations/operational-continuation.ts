import type { ExecutionConfidence } from "@/lib/operations/execution-confidence";
import {
  AUTONOMOUS_ACTIONS,
  HUMAN_REQUIRED_ACTIONS,
  type AutonomousAction,
  type HumanRequiredAction,
} from "@/lib/operations/human-boundary-policy";

export type BlockerKind = "autonomous" | "human_required";

export type BlockerId =
  | "apk_manifest_incompatible"
  | "local_eas_ssl_blocked"
  | "no_ci_credentials"
  | "eas_build_in_progress"
  | "device_heartbeat_missing"
  | "device_heartbeat_stale"
  | "release_safety_failed"
  | "runtime_activation_blocked"
  | "governance_safe_mode"
  | "transient_api_failure";

export type RecoveryStrategy =
  | "trigger_gha_eas_build"
  | "poll_eas_until_finished"
  | "sync_apk_manifest"
  | "run_release_safety"
  | "deploy_portal_manifest"
  | "push_live_runtime"
  | "activate_runtime"
  | "retry_with_backoff"
  | "wait_human_device";

export type ClassifiedBlocker = {
  id: BlockerId;
  kind: BlockerKind;
  strategy: RecoveryStrategy;
  summaryRu: string;
  autonomousAction?: AutonomousAction;
  humanAction?: HumanRequiredAction;
};

export type ContinuationStep = {
  order: number;
  action: RecoveryStrategy | HumanRequiredAction;
  kind: BlockerKind;
  command?: string;
  descriptionRu: string;
};

export type ContinuationPlan = {
  blockers: ClassifiedBlocker[];
  steps: ContinuationStep[];
  stopAtHuman: boolean;
  humanPromptRu: string | null;
};

export function classifyBlocker(
  id: BlockerId,
  context?: { hasGithubToken?: boolean; hasExpoToken?: boolean },
): ClassifiedBlocker {
  const creds = context?.hasGithubToken || context?.hasExpoToken;

  const map: Record<BlockerId, Omit<ClassifiedBlocker, "id">> = {
    apk_manifest_incompatible: {
      kind: creds ? "autonomous" : "human_required",
      strategy: creds ? "trigger_gha_eas_build" : "wait_human_device",
      summaryRu: creds
        ? "APK устарел — автозапуск GHA preview build"
        : "APK устарел — нужен EXPO_TOKEN/GITHUB_TOKEN или ручной GHA",
      autonomousAction: creds ? "github_workflow_dispatch" : undefined,
      humanAction: creds ? undefined : "credentials_bootstrap_no_token",
    },
    local_eas_ssl_blocked: {
      kind: "autonomous",
      strategy: "trigger_gha_eas_build",
      summaryRu: "Local EAS SSL fail → fallback GitHub Actions",
      autonomousAction: "github_workflow_dispatch",
    },
    no_ci_credentials: {
      kind: "human_required",
      strategy: "wait_human_device",
      summaryRu: "Нет CI токенов — bootstrap или ручной workflow dispatch",
      humanAction: "credentials_bootstrap_no_token",
    },
    eas_build_in_progress: {
      kind: "autonomous",
      strategy: "poll_eas_until_finished",
      summaryRu: "Ожидание EAS FINISHED",
      autonomousAction: "eas_build_monitor",
    },
    device_heartbeat_missing: {
      kind: "human_required",
      strategy: "wait_human_device",
      summaryRu: "Установите APK и откройте Driver",
      humanAction: "physical_apk_install",
    },
    device_heartbeat_stale: {
      kind: "human_required",
      strategy: "wait_human_device",
      summaryRu: "Heartbeat устарел — откройте Driver на устройстве",
      humanAction: "open_driver_app_first_launch",
    },
    release_safety_failed: {
      kind: "autonomous",
      strategy: "sync_apk_manifest",
      summaryRu: "Release safety fail → sync manifest после EAS",
      autonomousAction: "manifest_sync",
    },
    runtime_activation_blocked: {
      kind: "autonomous",
      strategy: "run_release_safety",
      summaryRu: "Runtime activation blocked — пройти gates",
      autonomousAction: "governance_checks",
    },
    governance_safe_mode: {
      kind: "autonomous",
      strategy: "sync_apk_manifest",
      summaryRu: "SAFE MODE — закрыть APK loop",
      autonomousAction: "manifest_sync",
    },
    transient_api_failure: {
      kind: "autonomous",
      strategy: "retry_with_backoff",
      summaryRu: "Временная ошибка API — retry",
      autonomousAction: "github_workflow_monitor",
    },
  };

  return { id, ...map[id] };
}

export function buildContinuationPlan(input: {
  blockers: BlockerId[];
  confidence: ExecutionConfidence;
  buildId?: string | null;
  hasGithubToken?: boolean;
}): ContinuationPlan {
  const classified = input.blockers.map((id) =>
    classifyBlocker(id, { hasGithubToken: input.hasGithubToken }),
  );

  const steps: ContinuationStep[] = [];
  let order = 1;
  let stopAtHuman = false;
  let humanPromptRu: string | null = null;

  const autonomousChain: { strategy: RecoveryStrategy; cmd?: string; desc: string }[] = [];

  if (input.blockers.includes("apk_manifest_incompatible") || input.blockers.includes("local_eas_ssl_blocked")) {
    if (input.hasGithubToken) {
      autonomousChain.push({
        strategy: "trigger_gha_eas_build",
        cmd: "node scripts/autonomous-github-eas.mjs --trigger",
        desc: "Запуск GHA EAS Build Android (preview)",
      });
      autonomousChain.push({
        strategy: "poll_eas_until_finished",
        cmd: input.buildId
          ? `node scripts/wait-eas-build.mjs ${input.buildId}`
          : "node scripts/autonomous-github-eas.mjs --wait-artifact",
        desc: "Ожидание FINISHED + BUILD_ID",
      });
      autonomousChain.push({
        strategy: "sync_apk_manifest",
        cmd: input.buildId ? `npm run apk:complete-loop -- ${input.buildId}` : undefined,
        desc: "Sync manifest + validate + release:safety",
      });
      autonomousChain.push({
        strategy: "deploy_portal_manifest",
        cmd: "node scripts/autonomous-github-eas.mjs --commit-manifest",
        desc: "Commit/push manifest (if git allowed)",
      });
    }
  }

  if (input.blockers.includes("device_heartbeat_missing") || input.blockers.includes("device_heartbeat_stale")) {
    stopAtHuman = true;
    humanPromptRu =
      "Установите preview APK на телефон (полная установка, не OTA) и откройте Driver один раз.";
    steps.push({
      order: order++,
      action: "physical_apk_install",
      kind: "human_required",
      descriptionRu: humanPromptRu,
    });
  } else if (input.confidence.nextAutonomousAction === "release_orchestrate_activate_runtime") {
    autonomousChain.push({
      strategy: "activate_runtime",
      cmd: "npm run release:orchestrate -- --activate-runtime",
      desc: "Runtime activation после green gates",
    });
    autonomousChain.push({
      strategy: "push_live_runtime",
      cmd: "npm run execution:push-live",
      desc: "Push live runtime to Supabase",
    });
  }

  for (const link of autonomousChain) {
    if (link.cmd) {
      steps.push({
        order: order++,
        action: link.strategy,
        kind: "autonomous",
        command: link.cmd,
        descriptionRu: link.desc,
      });
    }
  }

  return {
    blockers: classified,
    steps,
    stopAtHuman,
    humanPromptRu,
  };
}

export function detectBlockersFromSnapshot(snapshot: {
  apkManifestCompatible: boolean;
  localEasBlocked: boolean;
  hasCiCredentials: boolean;
  deviceHeartbeatFresh: boolean;
  deviceHeartbeatPresent: boolean;
  releaseSafetyGreen: boolean;
}): BlockerId[] {
  const ids: BlockerId[] = [];
  if (!snapshot.apkManifestCompatible) ids.push("apk_manifest_incompatible");
  if (snapshot.localEasBlocked) ids.push("local_eas_ssl_blocked");
  if (!snapshot.hasCiCredentials && !snapshot.apkManifestCompatible) ids.push("no_ci_credentials");
  if (snapshot.apkManifestCompatible && !snapshot.deviceHeartbeatPresent) ids.push("device_heartbeat_missing");
  if (snapshot.apkManifestCompatible && snapshot.deviceHeartbeatPresent && !snapshot.deviceHeartbeatFresh) {
    ids.push("device_heartbeat_stale");
  }
  if (!snapshot.releaseSafetyGreen && snapshot.apkManifestCompatible) ids.push("release_safety_failed");
  return ids;
}
