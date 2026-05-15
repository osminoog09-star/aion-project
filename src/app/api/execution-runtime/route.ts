import { NextResponse } from "next/server";
import {
  buildLiveExecutionView,
  getLocalExecutionRuntime,
} from "@/lib/execution-runtime";
import { patchExecutionRuntime } from "@/lib/operations/execution-runtime-persist";
import { canWriteArchitectureReviews } from "@/lib/operations/review-agent-auth";
import type { ExecutionRuntimeStatus } from "@/lib/execution-runtime";
import { EXECUTION_RUNTIME_STATUSES } from "@/lib/execution-runtime";

export const runtime = "nodejs";

export async function GET() {
  const payload = getLocalExecutionRuntime();
  const view = buildLiveExecutionView(payload);
  return NextResponse.json({
    meta: {
      kind: "execution_runtime",
      version: payload.version,
      orchestrationVersion: payload.orchestrationVersion,
      agentId: payload.agentId,
      lastUpdated: payload.lastUpdated,
      health: view.health.health,
      heartbeatAgeMs: view.health.heartbeatAgeMs,
      persistedVia: process.env.VERCEL ? "build_snapshot" : "filesystem",
    },
    ...view,
  });
}

type PatchBody = {
  status?: ExecutionRuntimeStatus;
  currentTask?: string;
  subsystem?: string;
  reasoning?: string;
  confidence?: number;
  files?: string[];
  commitCandidate?: string | null;
  blocker?: string | null;
  nextStep?: string;
  branch?: string;
  dependencyTarget?: string;
  validationStatus?: "pending" | "running" | "passed" | "failed";
  pendingReviewCount?: number;
  timelineSummary?: string;
  heartbeatOnly?: boolean;
};

export async function PATCH(req: Request) {
  if (!(await canWriteArchitectureReviews(req))) {
    return NextResponse.json(
      { ok: false, error: "Agent key or owner session required" },
      { status: 401 },
    );
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (body.status && !EXECUTION_RUNTIME_STATUSES.includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
  }

  try {
    const payload = await patchExecutionRuntime(body);
    const view = buildLiveExecutionView(payload);
    return NextResponse.json({ ok: true, ...view });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Patch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
