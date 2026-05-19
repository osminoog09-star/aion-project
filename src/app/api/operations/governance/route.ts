import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getExecutionRuntimeForLive } from "@/lib/execution-runtime";
import { evaluateEngineeringGovernance } from "@/lib/operations/runtime-governance";
import { evaluateReleaseIntelligence } from "@/lib/operations/release-intelligence";
import { getRuntimeEvents } from "@/lib/operations/runtime-event-log";
import { getLocalDeploymentStatus } from "@/lib/execution-runtime";
import { evaluateExecutionConfidence } from "@/lib/operations/execution-confidence";
import {
  buildContinuationPlan,
  detectBlockersFromSnapshot,
} from "@/lib/operations/operational-continuation";
import { semverGte } from "@/lib/shared/runtime-compatibility";
import { resolveDeviceHeartbeatRecord } from "@/lib/operations/device-heartbeat-persist";
import { bugReportNotifyConfigured, bugReportNotifyStatus } from "@/lib/operations/notify-bug-report-owner";

function getSignoffStatus() {
  try {
    return JSON.parse(
      readFileSync(path.join(process.cwd(), "src/content/stabilization-signoff-status.json"), "utf8"),
    );
  } catch {
    return { signedOff: false, summary: "Sign-off report not generated" };
  }
}

export const runtime = "nodejs";

export async function GET() {
  const { document, persistedVia } = await getExecutionRuntimeForLive();
  const governance = await evaluateEngineeringGovernance(document.runtime);
  const release = await evaluateReleaseIntelligence();
  const events = getRuntimeEvents(30);
  const deployment = getLocalDeploymentStatus();

  const credentials = {
    githubToken: Boolean(process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim()),
    expoToken: Boolean(process.env.EXPO_TOKEN?.trim()),
    ownerSecret: Boolean(process.env.OPERATIONS_OWNER_SECRET?.trim()),
    supabaseServiceRole: Boolean(process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim()),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    bugReportNotify: bugReportNotifyConfigured(),
    bugReportNotifyChannels: bugReportNotifyStatus(),
  };

  let hbFresh = false;
  let hbPresent = false;
  try {
    const hb =
      (await resolveDeviceHeartbeatRecord()) ??
      JSON.parse(
        readFileSync(path.join(process.cwd(), "src/content/device-build-heartbeat.json"), "utf8"),
      );
    const at = hb?.at ?? hb?.device?.reportedAt;
    hbPresent = Boolean(hb?.device?.runtimeVersion);
    hbFresh = at ? Date.now() - Date.parse(at) < 300_000 : false;
  } catch {
    /* */
  }

  const apkOk =
    release.publishedApkVersion != null &&
    semverGte(release.publishedApkVersion, release.portalMinVersion);

  const blockers = detectBlockersFromSnapshot({
    apkManifestCompatible: apkOk,
    localEasBlocked: true,
    hasCiCredentials: credentials.githubToken || credentials.expoToken,
    deviceHeartbeatFresh: hbFresh,
    deviceHeartbeatPresent: hbPresent,
    releaseSafetyGreen: release.runtimeActivationAllowed,
  });

  const executionConfidence = evaluateExecutionConfidence({
    governance,
    release,
    credentials,
    deviceHeartbeatFresh: hbFresh,
    apkManifestCompatible: apkOk,
    ciAvailable: credentials.githubToken || credentials.expoToken,
    localEasBlocked: true,
  });

  const continuation = buildContinuationPlan({
    blockers,
    confidence: executionConfidence,
    hasGithubToken: credentials.githubToken,
  });

  return NextResponse.json({
    meta: { kind: "engineering_governance", at: new Date().toISOString() },
    persistedVia,
    governance,
    release,
    runtime: {
      phase: document.runtime.phase,
      status: document.runtime.status,
      heartbeatAt: document.runtime.heartbeatAt,
      blocker: document.runtime.blocker,
      currentTask: document.runtime.currentTask,
    },
    deployment: {
      status: deployment.lastProductionDeploy?.status,
      deployedAt: deployment.lastProductionDeploy?.deployedAt,
      routesOk: deployment.routeValidation?.allPassed,
    },
    recentEvents: events,
    stabilizationSignoff: getSignoffStatus(),
    executionConfidence,
    continuation,
  });
}
