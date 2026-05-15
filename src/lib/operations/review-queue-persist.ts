import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildArchitectureReviewPacket } from "@/lib/architecture-review-packet";
import type {
  ArchitectureReviewQueuePayload,
  ArchitectureReviewRequest,
  ArchitectureReviewResult,
  ArchitectureReviewStatus,
} from "@/lib/ecosystem-types";
import type { CreateReviewInput } from "@/lib/architecture-reviews";
import { buildReviewQueueContext } from "@/lib/architecture-reviews";

const CONTENT = path.join(process.cwd(), "src/content");
const QUEUE_FILE = path.join(CONTENT, "architecture-review-queue.json");
const FEED_FILE = path.join(CONTENT, "ecosystem-implementation-feed.json");

async function readQueue(): Promise<ArchitectureReviewQueuePayload> {
  const raw = await readFile(QUEUE_FILE, "utf8");
  return JSON.parse(raw) as ArchitectureReviewQueuePayload;
}

async function writeQueue(payload: ArchitectureReviewQueuePayload): Promise<void> {
  await writeFile(QUEUE_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function appendReviewFeedEvent(input: {
  title: string;
  summary: string;
  eventType: "architecture_review_requested" | "architecture_review_resolved";
  reviewId: string;
  subsystemIds: string[];
  confidence?: string;
}): Promise<string> {
  const raw = await readFile(FEED_FILE, "utf8");
  const feed = JSON.parse(raw) as { lastUpdated: string; items: unknown[] };
  const id = `evt-${new Date().toISOString().slice(0, 10)}-review-${Math.random().toString(36).slice(2, 8)}`;
  const occurredAt = new Date().toISOString().slice(0, 10);
  feed.items = [
    {
      id,
      occurredAt,
      title: input.title,
      summary: input.summary,
      subsystemIds: input.subsystemIds,
      eventType: input.eventType,
      task: `architecture-review:${input.reviewId}`,
      reasoning: input.summary,
      confidence: input.confidence ?? "medium",
      repository: "aion-project",
      rollup: {
        fullyDone: [`✅ Review queue ${input.eventType}`],
        partiallyDone: [],
        notStarted: [],
        technicalDebt: [],
      },
      stillMissing: [],
      blocked: [],
      impacts: {
        release: "low",
        otaApk: "none",
        backend: "low",
        realtime: "none",
        ux: "medium",
        cloud: "low",
      },
      validation: { web_build: "pending" },
    },
    ...(feed.items ?? []),
  ];
  feed.lastUpdated = occurredAt;
  await writeFile(FEED_FILE, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
  return id;
}

function newReviewId(): string {
  return `ar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createArchitectureReviewRequest(
  input: CreateReviewInput,
): Promise<{ request: ArchitectureReviewRequest; feedEventId: string }> {
  if (process.env.OPERATIONS_ALLOW_FS_WRITE === "0") {
    throw new Error("Filesystem write disabled (OPERATIONS_ALLOW_FS_WRITE=0)");
  }

  const queue = await readQueue();
  const ctx = await buildReviewQueueContext();
  const template = queue.templates.find((t) => t.id === input.templateId);
  const now = new Date().toISOString();
  const status: ArchitectureReviewStatus = input.status ?? "pending";

  const base = {
    ...input,
    status,
    templateId: input.templateId,
  };

  const reviewPacket = buildArchitectureReviewPacket({
    request: base,
    template,
    roadmapTarget: ctx.roadmapTarget,
    ownerDirective: ctx.ownerDirective,
  });

  const request: ArchitectureReviewRequest = {
    ...input,
    id: newReviewId(),
    createdAt: now,
    updatedAt: now,
    status,
    reviewPacket,
  };

  queue.requests = [request, ...queue.requests];
  queue.lastUpdated = now.slice(0, 10);
  await writeQueue(queue);

  const feedEventId = await appendReviewFeedEvent({
    title: `Architecture review requested: ${request.title}`,
    summary: request.architectureConcern,
    eventType: "architecture_review_requested",
    reviewId: request.id,
    subsystemIds: request.subsystemIds,
    confidence: request.confidence,
  });

  return { request, feedEventId };
}

export type UpdateReviewInput = {
  status?: ArchitectureReviewStatus;
  result?: ArchitectureReviewResult;
  linkedCommitHashes?: string[];
  linkedFeedEventIds?: string[];
};

export async function updateArchitectureReviewRequest(
  id: string,
  input: UpdateReviewInput,
): Promise<{ request: ArchitectureReviewRequest; feedEventId?: string }> {
  if (process.env.OPERATIONS_ALLOW_FS_WRITE === "0") {
    throw new Error("Filesystem write disabled");
  }

  const queue = await readQueue();
  const idx = queue.requests.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Review request not found");

  const prev = queue.requests[idx]!;
  const now = new Date().toISOString();
  const nextStatus = input.status ?? input.result?.status ?? prev.status;

  const request: ArchitectureReviewRequest = {
    ...prev,
    status: nextStatus,
    updatedAt: now,
    result: input.result ?? prev.result,
    linkedCommitHashes: input.linkedCommitHashes
      ? [...new Set([...(prev.linkedCommitHashes ?? []), ...input.linkedCommitHashes])]
      : prev.linkedCommitHashes,
    linkedFeedEventIds: input.linkedFeedEventIds
      ? [...new Set([...(prev.linkedFeedEventIds ?? []), ...input.linkedFeedEventIds])]
      : prev.linkedFeedEventIds,
  };

  queue.requests[idx] = request;
  queue.lastUpdated = now.slice(0, 10);
  await writeQueue(queue);

  let feedEventId: string | undefined;
  const terminal = ["approved", "blocked", "risky", "resolved"].includes(nextStatus);
  if (terminal && prev.status !== nextStatus) {
    feedEventId = await appendReviewFeedEvent({
      title: `Architecture review ${nextStatus}: ${request.title}`,
      summary:
        input.result?.approvedDirection ??
        input.result?.architectureNotes?.join("; ") ??
        request.architectureConcern,
      eventType: "architecture_review_resolved",
      reviewId: request.id,
      subsystemIds: request.subsystemIds,
      confidence: request.confidence,
    });
    if (feedEventId) {
      request.linkedFeedEventIds = [...(request.linkedFeedEventIds ?? []), feedEventId];
      queue.requests[idx] = request;
      await writeQueue(queue);
    }
  }

  return { request, feedEventId };
}
