import { NextResponse } from "next/server";
import {
  buildLiveExecutionView,
  getExecutionRuntimeForLive,
  EXECUTION_RUNTIME_STATUSES,
} from "@/lib/execution-runtime";
import { patchExecutionRuntime } from "@/lib/operations/execution-runtime-persist";
import { canWriteArchitectureReviews } from "@/lib/operations/review-agent-auth";
import type { ExecutionRuntimeStatus } from "@/contracts/execution-runtime";
import type { ExecutionLastValidation } from "@/contracts/execution-runtime";

export const runtime = "nodejs";

export async function GET() {
  const { document, persistedVia } = await getExecutionRuntimeForLive();
  const view = buildLiveExecutionView(document);
  const staleSnapshot =
    persistedVia === "build_snapshot" && view.health.heartbeatAgeMs > 60_000;
  return NextResponse.json({
    meta: {
      kind: "execution_runtime",
      version: document.version,
      orchestrationVersion: document.orchestrationVersion,
      agentId: document.agentId,
      lastUpdated: document.lastUpdated,
      health: view.health.health,
      heartbeatAgeMs: view.health.heartbeatAgeMs,
      persistedVia,
      staleSnapshot,
      liveConfigured: Boolean(
        process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim() &&
          process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
      ),
      ownerMandateActive: Boolean(view.ownerMandate?.active),
    },
    ...view,
  });
}

type PatchBody = Partial<{
  status: ExecutionRuntimeStatus;
  phase: ExecutionRuntimeStatus;
  currentTask: string;
  subsystem: string;
  reasoning: string;
  confidence: number;
  files: string[];
  commitCandidate: string | null;
  blocker: string | null;
  nextStep: string;
  branch: string;
  dependencyTarget: string;
  pendingReviewCount: number;
  lastValidation: ExecutionLastValidation;
  timelineSummary: string;
  heartbeatOnly: boolean;
  skipFeed: boolean;
  feedEventType: string;
}>;

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
    const document = await patchExecutionRuntime(body);
    const view = buildLiveExecutionView(document);
    return NextResponse.json({ ok: true, ...view });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Patch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
