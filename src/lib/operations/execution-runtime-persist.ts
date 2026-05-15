import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ExecutionRuntimePayload,
  ExecutionRuntimeState,
  ExecutionRuntimeStatus,
  ExecutionRuntimeTimelineEvent,
} from "@/lib/execution-runtime";

const STATE_FILE = path.join(process.cwd(), "src/content/execution-runtime-state.json");
const MAX_TIMELINE = 64;
const MAX_HEARTBEATS = 24;

async function readPayload(): Promise<ExecutionRuntimePayload> {
  const raw = await readFile(STATE_FILE, "utf8");
  return JSON.parse(raw) as ExecutionRuntimePayload;
}

async function writePayload(payload: ExecutionRuntimePayload): Promise<void> {
  await writeFile(STATE_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export type PatchExecutionRuntimeInput = Partial<ExecutionRuntimeState> & {
  status?: ExecutionRuntimeStatus;
  timelineSummary?: string;
  heartbeatOnly?: boolean;
};

export async function patchExecutionRuntime(
  input: PatchExecutionRuntimeInput,
): Promise<ExecutionRuntimePayload> {
  const payload = await readPayload();
  const now = new Date().toISOString();
  const prev = payload.state;

  if (input.heartbeatOnly) {
    payload.heartbeats = [{ at: now }, ...payload.heartbeats].slice(0, MAX_HEARTBEATS);
    payload.state = { ...prev, updatedAt: now };
  } else {
    const nextStatus = input.status ?? prev.status;
    const timelineSummary =
      input.timelineSummary ??
      (input.currentTask ? `${nextStatus}: ${input.currentTask}` : `Phase ${nextStatus}`);

    payload.state = {
      ...prev,
      ...input,
      status: nextStatus,
      updatedAt: now,
      startedAt:
        nextStatus !== prev.status && nextStatus !== "idle" ? now : prev.startedAt || now,
    };

    const timelineEvent: ExecutionRuntimeTimelineEvent = {
      at: now,
      phase: nextStatus,
      summary: timelineSummary,
    };
    payload.timeline = [timelineEvent, ...payload.timeline].slice(0, MAX_TIMELINE);
    payload.heartbeats = [{ at: now }, ...payload.heartbeats].slice(0, MAX_HEARTBEATS);
  }

  payload.lastUpdated = now.slice(0, 10);
  await writePayload(payload);
  return payload;
}
