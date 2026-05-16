import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getExecutionRuntimeForLive } from "@/lib/execution-runtime";
import { evaluateEngineeringGovernance } from "@/lib/operations/runtime-governance";
import { evaluateReleaseIntelligence } from "@/lib/operations/release-intelligence";
import { evaluateExecutionConfidence } from "@/lib/operations/execution-confidence";
import {
  buildContinuationPlan,
  detectBlockersFromSnapshot,
} from "@/lib/operations/operational-continuation";
import { semverGte } from "@/lib/shared/runtime-compatibility";

export const runtime = "nodejs";

function envCredentials() {
  return {
    githubToken: Boolean(process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim()),
    expoToken: Boolean(process.env.EXPO_TOKEN?.trim()),
    ownerSecret: Boolean(process.env.OPERATIONS_OWNER_SECRET?.trim()),
    supabaseServiceRole: Boolean(process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim()),
  };
}

function readAutonomousState() {
  try {
    return JSON.parse(
      readFileSync(path.join(process.cwd(), "src/content/autonomous-execution-state.json"), "utf8"),
    );
  } catch {
    return { phase: "idle" };
  }
}

function readDeviceHeartbeat() {
  try {
    const hb = JSON.parse(
      readFileSync(path.join(process.cwd(), "src/content/device-build-heartbeat.json"), "utf8"),
    );
    const at = hb?.at ?? hb?.device?.reportedAt;
    const ageSec = at ? Math.round((Date.now() - Date.parse(at)) / 1000) : null;
    return { present: Boolean(hb?.device?.runtimeVersion), fresh: ageSec != null && ageSec < 60, ageSec };
  } catch {
    return { present: false, fresh: false, ageSec: null };
  }
}

export async function GET() {
  const { document } = await getExecutionRuntimeForLive();
  const governance = await evaluateEngineeringGovernance(document.runtime);
  const release = await evaluateReleaseIntelligence();
  const credentials = envCredentials();
  const hb = readDeviceHeartbeat();
  const apk = release.publishedApkVersion;
  const min = release.portalMinVersion;
  const apkManifestCompatible = apk != null && semverGte(apk, min);

  const blockers = detectBlockersFromSnapshot({
    apkManifestCompatible,
    localEasBlocked: true,
    hasCiCredentials: credentials.githubToken || credentials.expoToken,
    deviceHeartbeatFresh: hb.fresh,
    deviceHeartbeatPresent: hb.present,
    releaseSafetyGreen: release.runtimeActivationAllowed,
  });

  const confidence = evaluateExecutionConfidence({
    governance,
    release,
    credentials,
    deviceHeartbeatFresh: hb.fresh,
    apkManifestCompatible,
    ciAvailable: credentials.githubToken || credentials.expoToken,
    localEasBlocked: true,
  });

  const autonomousState = readAutonomousState();
  const continuation = buildContinuationPlan({
    blockers,
    confidence,
    buildId: autonomousState.buildId ?? null,
    hasGithubToken: credentials.githubToken,
  });

  return NextResponse.json({
    meta: { kind: "autonomous_execution", at: new Date().toISOString() },
    confidence,
    continuation,
    autonomousState,
    deviceHeartbeat: hb,
    policy: {
      autonomous: "github_workflows, manifest_sync, deploy, governance, runtime_activation_when_green",
      humanOnly: "physical_apk_install, open_driver, credential_bootstrap_if_no_tokens",
    },
  });
}
