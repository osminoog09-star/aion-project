import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ExecutionRuntimeDocument,
  ExecutionRuntimeCore,
  ExecutionRuntimeStatus,
} from "@/contracts/execution-runtime";
import { writeExecutionRuntimeToSupabase } from "@/lib/operations/execution-runtime-live-persist";

const RUNTIME_FILE = path.join(process.cwd(), "src/content/execution-runtime.json");
const FEED_FILE = path.join(process.cwd(), "src/content/ecosystem-implementation-feed.json");
const MAX_TIMELINE = 64;
const MAX_HEARTBEATS = 48;

const PHASE_FEED_MAP: Partial<Record<ExecutionRuntimeStatus, string>> = {
  planning: "execution_started",
  validating: "execution_validating",
  recovering: "execution_recovering",
  blocked: "execution_blocked",
  deploying: "execution_deploy_passed",
  coding: "execution_resumed",
  completed: "execution_completed",
};

async function readPayload(): Promise<ExecutionRuntimeDocument> {
  const raw = await readFile(RUNTIME_FILE, "utf8");
  return JSON.parse(raw) as ExecutionRuntimeDocument;
}

async function writePayload(payload: ExecutionRuntimeDocument): Promise<void> {
  await writeFile(RUNTIME_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function appendRuntimeFeedEvent(input: {
  eventType: string;
  title: string;
  summary: string;
}): Promise<string | null> {
  if (!input.eventType.startsWith("execution_")) {
    return null;
  }
  try {
    const raw = await readFile(FEED_FILE, "utf8");
    const feed = JSON.parse(raw) as { lastUpdated: string; items: unknown[] };
    const id = `evt-${new Date().toISOString().slice(0, 10)}-runtime-${Math.random().toString(36).slice(2, 8)}`;
    feed.items = [
      {
        id,
        occurredAt: new Date().toISOString().slice(0, 10),
        title: input.title,
        summary: input.summary,
        subsystemIds: ["operations-center"],
        eventType: input.eventType,
        reasoning: input.summary,
        confidence: "high",
        repository: "aion-project",
        rollup: { fullyDone: ["✅ Runtime transition"], partiallyDone: [], notStarted: [], technicalDebt: [] },
        stillMissing: [],
        blocked: [],
        impacts: { release: "low", otaApk: "none", backend: "none", realtime: "medium", ux: "high", cloud: "low" },
        validation: { web_build: "pending" },
      },
      ...(feed.items ?? []),
    ];
    feed.lastUpdated = new Date().toISOString().slice(0, 10);
    await writeFile(FEED_FILE, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
    return id;
  } catch {
    return null;
  }
}

export type PatchExecutionRuntimeInput = Partial<ExecutionRuntimeCore> & {
  status?: ExecutionRuntimeStatus;
  phase?: ExecutionRuntimeStatus;
  timelineSummary?: string;
  heartbeatOnly?: boolean;
  skipFeed?: boolean;
  feedEventType?: string;
};

export async function patchExecutionRuntime(
  input: PatchExecutionRuntimeInput,
): Promise<ExecutionRuntimeDocument> {
  const payload = await readPayload();
  const now = new Date().toISOString();
  const prev = payload.runtime;

  if (input.heartbeatOnly) {
    payload.heartbeats = [{ at: now }, ...payload.heartbeats].slice(0, MAX_HEARTBEATS);
    payload.runtime = { ...prev, updatedAt: now, heartbeatAt: now };
  } else {
    const nextStatus = input.status ?? prev.status;
    const nextPhase = input.phase ?? input.status ?? prev.phase;
    const timelineSummary =
      input.timelineSummary ??
      (input.currentTask ? `${nextPhase}: ${input.currentTask}` : `Phase ${nextPhase}`);

    payload.runtime = {
      ...prev,
      ...input,
      status: nextStatus,
      phase: nextPhase,
      updatedAt: now,
      heartbeatAt: now,
      startedAt:
        nextStatus !== prev.status && nextStatus !== "idle" ? now : prev.startedAt || now,
    };

    const feedType =
      input.feedEventType ?? PHASE_FEED_MAP[nextStatus] ?? (nextStatus === "blocked" ? "execution_blocked" : null);

    let feedEventId: string | null = null;
    if (!input.skipFeed && feedType) {
      feedEventId = await appendRuntimeFeedEvent({
        eventType: feedType,
        title: `Runtime: ${nextStatus}`,
        summary: timelineSummary,
      });
    }

    payload.timeline = [
      { at: now, phase: nextPhase, summary: timelineSummary, feedEventId },
      ...payload.timeline,
    ].slice(0, MAX_TIMELINE);
    payload.heartbeats = [{ at: now }, ...payload.heartbeats].slice(0, MAX_HEARTBEATS);
  }

  payload.lastUpdated = now.slice(0, 10);
  const allowFs =
    process.env.OPERATIONS_ALLOW_FS_WRITE !== "0" &&
    (!process.env.VERCEL || process.env.OPERATIONS_ALLOW_FS_WRITE === "1");
  if (allowFs) {
    await writePayload(payload);
  }
  await writeExecutionRuntimeToSupabase(payload);
  return payload;
}

export async function saveExecutionRuntimeDocument(
  doc: ExecutionRuntimeDocument,
): Promise<{ persistedTo: ("filesystem" | "supabase")[] }> {
  const persistedTo: ("filesystem" | "supabase")[] = [];
  const allowFs =
    process.env.OPERATIONS_ALLOW_FS_WRITE !== "0" &&
    (!process.env.VERCEL || process.env.OPERATIONS_ALLOW_FS_WRITE === "1");
  if (allowFs) {
    await writePayload(doc);
    persistedTo.push("filesystem");
  }
  if (await writeExecutionRuntimeToSupabase(doc)) {
    persistedTo.push("supabase");
  }
  return { persistedTo };
}
