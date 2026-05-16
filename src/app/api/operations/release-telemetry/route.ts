import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function readJson(name: string) {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "src/content", name), "utf8"));
  } catch {
    return null;
  }
}

export async function GET() {
  const autonomous = readJson("autonomous-execution-state.json");
  const trace = readJson("release-execution-trace.json");
  const diagnostic = readJson("ci-eas-diagnostic.json");
  const orchestration = readJson("release-orchestration-state.json");

  const phase = autonomous?.phase ?? "idle";
  const easStatus = autonomous?.easStatus ?? null;
  const buildId = autonomous?.buildId ?? null;

  let pipelineStatus: string = "idle";
  if (phase === "release_failed") pipelineStatus = "failed";
  else if (phase === "expo_finished" || phase === "build_id_resolved") pipelineStatus = "eas_completed";
  else if (phase === "expo_building" || phase === "gha_completed") pipelineStatus = "eas_building";
  else if (phase === "gha_running" || phase === "gha_triggered") pipelineStatus = "workflow_running";
  else if (phase === "gha_triggered") pipelineStatus = "workflow_queued";

  return NextResponse.json({
    meta: { kind: "release_telemetry", at: new Date().toISOString() },
    pipelineStatus,
    autonomous,
    orchestration,
    diagnostic,
    recentTrace: (trace?.events ?? []).slice(0, 25),
    buildId,
    easStatus,
    workflowRunUrl: autonomous?.workflowRunUrl ?? null,
    expoBuildUrl: buildId
      ? `https://expo.dev/accounts/osminoog/projects/aion/builds/${buildId}`
      : null,
  });
}
