import { NextResponse } from "next/server";
import {
  computeReviewQueueStats,
  filterActiveQueue,
  getArchitectureReviewQueue,
  sortRequestsNewest,
} from "@/lib/architecture-reviews";
import { canWriteArchitectureReviews } from "@/lib/operations/review-agent-auth";
import { createArchitectureReviewRequest } from "@/lib/operations/review-queue-persist";
import type { CreateReviewInput } from "@/lib/architecture-reviews";
import type { ArchitectureReviewTemplateId } from "@/lib/ecosystem-types";

export const runtime = "nodejs";

export async function GET() {
  const queue = getArchitectureReviewQueue();
  const sorted = sortRequestsNewest(queue.requests);
  return NextResponse.json({
    meta: {
      kind: "architecture_review_queue",
      lastUpdated: queue.lastUpdated,
      orchestrationVersion: queue.orchestrationVersion,
    },
    payload: queue,
    stats: computeReviewQueueStats(queue.requests),
    activeQueue: filterActiveQueue(sorted),
    history: sorted,
  });
}

export async function POST(req: Request) {
  if (!(await canWriteArchitectureReviews(req))) {
    return NextResponse.json(
      { ok: false, error: "Agent key or owner session required" },
      { status: 401 },
    );
  }

  let body: CreateReviewInput;
  try {
    body = (await req.json()) as CreateReviewInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const required = [
    "templateId",
    "title",
    "subsystem",
    "reasoning",
    "architectureConcern",
    "proposedDirection",
    "confidence",
  ] as const;
  for (const key of required) {
    if (!body[key]?.toString().trim()) {
      return NextResponse.json({ ok: false, error: `Missing ${key}` }, { status: 400 });
    }
  }

  if (!body.subsystemIds?.length) {
    body.subsystemIds = [body.subsystem.replace(/\s+/g, "-").toLowerCase()];
  }
  if (!body.affectedSystems?.length) {
    body.affectedSystems = body.subsystemIds;
  }

  try {
    const { request, feedEventId } = await createArchitectureReviewRequest({
      ...body,
      templateId: body.templateId as ArchitectureReviewTemplateId,
    });
    return NextResponse.json({
      ok: true,
      request,
      feedEventId,
      reviewPacketMarkdown: request.reviewPacket.markdown,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
