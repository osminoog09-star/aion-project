import { NextResponse } from "next/server";
import { getArchitectureReviewQueue } from "@/lib/architecture-reviews";
import { canWriteArchitectureReviews } from "@/lib/operations/review-agent-auth";
import { updateArchitectureReviewRequest } from "@/lib/operations/review-queue-persist";
import type { ArchitectureReviewResult, ArchitectureReviewStatus } from "@/lib/ecosystem-types";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const queue = getArchitectureReviewQueue();
  const request = queue.requests.find((r) => r.id === id);
  if (!request) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, request });
}

type PatchBody = {
  status?: ArchitectureReviewStatus;
  result?: ArchitectureReviewResult;
  linkedCommitHashes?: string[];
  linkedFeedEventIds?: string[];
};

export async function PATCH(req: Request, ctx: RouteCtx) {
  if (!(await canWriteArchitectureReviews(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { request, feedEventId } = await updateArchitectureReviewRequest(id, body);
    return NextResponse.json({ ok: true, request, feedEventId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
