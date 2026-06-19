import type { OcrParseResult } from "../types";
import type { OcrQueueItem, OcrQueueJobPayload } from "./ocrQueueTypes";
import { loadOcrQueue, saveOcrQueue, updateOcrQueue } from "./ocrQueueStorage";
import { recoverInterruptedOcrItems } from "./recoverInterruptedOcrItems";
import { pulseSyncOk } from "../../../src/core/aion/runtime/runtimePulseBus";
import {
  getLinkRelayUserId,
  relayOcrSnapshotToLink,
} from "../../aion-link/relay/linkSnapshotRelay";

const BASE_BACKOFF_MS = 4_000;
const MAX_BACKOFF_MS = 5 * 60_000;

function createId(): string {
  return `ocrq_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function backoffMs(attemptCount: number): number {
  return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** Math.max(0, attemptCount - 1));
}

export function buildOcrDedupeKey(payload: OcrQueueJobPayload): string {
  if (payload.imageUris.length === 1) return `uri:${payload.imageUris[0]}`;
  if (payload.imageUris.length > 1) {
    return `uris:${payload.imageUris.slice().sort().join("|")}`;
  }
  const t = (payload.pastedText ?? "").trim().slice(0, 4000);
  let h = 0;
  for (let i = 0; i < t.length; i += 1) h = (h * 31 + t.charCodeAt(i)) | 0;
  return `paste:${h}:${t.length}:${payload.platform}`;
}

export async function getOcrJob(jobId: string): Promise<OcrQueueItem | null> {
  const cur = await loadOcrQueue();
  return cur.find((x) => x.id === jobId) ?? null;
}

export async function getOcrQueueStats(): Promise<{
  pending: number;
  processing: number;
  failed: number;
  done: number;
}> {
  const cur = await loadOcrQueue();
  return {
    pending: cur.filter((x) => x.status === "pending").length,
    processing: cur.filter((x) => x.status === "processing").length,
    failed: cur.filter((x) => x.status === "failed").length,
    done: cur.filter((x) => x.status === "done").length,
  };
}

export type EnqueueOcrResult = {
  id: string;
  dedupe: boolean;
  alreadyDone?: boolean;
};

/** Primary entry: all import OCR jobs go through the queue. */
export async function enqueueOcrJob(payload: OcrQueueJobPayload): Promise<EnqueueOcrResult> {
  const dedupeKey = buildOcrDedupeKey(payload);
  let createdNew = false;
  const next = await updateOcrQueue((cur) => {
    const existing = cur.find((x) => x.dedupeKey === dedupeKey);
    const now = Date.now();
    if (existing?.status === "done" && existing.resultParse) {
      return cur;
    }
    if (existing && (existing.status === "pending" || existing.status === "processing")) {
      return cur;
    }
    if (existing?.status === "failed") {
      return cur.map((x) =>
        x.id === existing.id
          ? {
              ...x,
              status: "pending" as const,
              attemptCount: 0,
              updatedAtMs: now,
              nextRetryAtMs: now,
              lastError: undefined,
              payload,
            }
          : x,
      );
    }
    createdNew = true;
    const item: OcrQueueItem = {
      id: createId(),
      dedupeKey,
      status: "pending",
      attemptCount: 0,
      maxAttempts: 5,
      createdAtMs: now,
      updatedAtMs: now,
      nextRetryAtMs: now,
      payload,
    };
    return [item, ...cur];
  });
  const hit = next.find((x) => x.dedupeKey === dedupeKey);
  if (!hit) throw new Error("OCR enqueue failed");
  return {
    id: hit.id,
    dedupe: !createdNew,
    alreadyDone: hit.status === "done" && Boolean(hit.resultParse),
  };
}

/** @deprecated Use enqueueOcrJob — kept for compatibility. */
export async function pushFailedOcrReplay(
  payload: OcrQueueJobPayload,
  err: string,
): Promise<void> {
  await enqueueOcrJob(payload);
  await updateOcrQueue((cur) =>
    cur.map((x) => {
      const key = buildOcrDedupeKey(payload);
      if (x.dedupeKey !== key && x.dedupeKey !== `${key}:retry`) return x;
      if (x.status !== "pending") return x;
      return { ...x, lastError: err.slice(0, 500) };
    }),
  );
}

type ProgressCb = (label: string, phase?: number) => void;

function pickNextPending(items: OcrQueueItem[]): number {
  const now = Date.now();
  return items.findIndex(
    (x) =>
      x.status === "pending" &&
      (x.nextRetryAtMs == null || x.nextRetryAtMs <= now),
  );
}

export async function processNextOcrQueueItem(onProgress?: ProgressCb): Promise<boolean> {
  const cur = await loadOcrQueue();
  const idx = pickNextPending(cur);
  if (idx < 0) return false;

  const item = cur[idx]!;
  const now = Date.now();
  const processingId = item.id;

  await saveOcrQueue(
    cur.map((x, i) =>
      i === idx
        ? {
            ...x,
            status: "processing" as const,
            updatedAtMs: now,
            attemptCount: x.attemptCount + 1,
          }
        : x,
    ),
  );

  try {
    const { runOcrPipeline } = await import("../services/ocrPipeline");
    const out = await runOcrPipeline(
      {
        imageUris: item.payload.imageUris,
        pastedText: item.payload.pastedText,
        platform: item.payload.platform,
        currencyCode: item.payload.currencyCode,
      },
      (label, phase) => onProgress?.(label, typeof phase === "number" ? phase : 0),
    );

    await updateOcrQueue((fresh) => {
      const j = fresh.findIndex((x) => x.id === processingId);
      if (j < 0) return fresh;
      const u = [...fresh];
      u[j] = {
        ...u[j]!,
        status: "done",
        updatedAtMs: Date.now(),
        resultParse: out as OcrParseResult,
        lastError: undefined,
        nextRetryAtMs: undefined,
      };
      return u;
    });
    pulseSyncOk(1);
    void getLinkRelayUserId().then((uid) => {
      if (uid) void relayOcrSnapshotToLink(uid, out);
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await updateOcrQueue((fresh) => {
      const j = fresh.findIndex((x) => x.id === processingId);
      if (j < 0) return fresh;
      const u = [...fresh];
      const prev = u[j]!;
      const failed = prev.attemptCount >= prev.maxAttempts;
      const retryAt = Date.now() + backoffMs(prev.attemptCount);
      u[j] = {
        ...prev,
        status: failed ? "failed" : "pending",
        updatedAtMs: Date.now(),
        lastError: msg.slice(0, 500),
        nextRetryAtMs: failed ? undefined : retryAt,
      };
      return u;
    });
  }
  return true;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** UI primary path: enqueue then wait (drives processor inline). */
export async function runOcrThroughQueue(
  payload: OcrQueueJobPayload,
  opts?: { timeoutMs?: number; onProgress?: ProgressCb },
): Promise<OcrParseResult> {
  const enq = await enqueueOcrJob(payload);
  if (enq.alreadyDone) {
    const done = await getOcrJob(enq.id);
    if (done?.resultParse) return done.resultParse;
  }

  const deadline = Date.now() + (opts?.timeoutMs ?? 120_000);
  while (Date.now() < deadline) {
    const item = await getOcrJob(enq.id);
    if (!item) throw new Error("OCR job missing from queue");
    if (item.status === "done" && item.resultParse) return item.resultParse;
    if (item.status === "failed") {
      throw new Error(item.lastError ?? "OCR failed");
    }
    if (
      item.status === "pending" &&
      (item.nextRetryAtMs == null || item.nextRetryAtMs <= Date.now())
    ) {
      await processNextOcrQueueItem(opts?.onProgress);
    } else if (item.status === "processing") {
      opts?.onProgress?.("Очередь OCR…", 1);
    }
    await delay(350);
  }
  throw new Error("OCR timeout — job remains in queue for replay");
}

export async function replayFailedOcrJobs(): Promise<number> {
  let n = 0;
  await updateOcrQueue((cur) =>
    cur.map((x) => {
      if (x.status !== "failed") return x;
      n += 1;
      return {
        ...x,
        status: "pending" as const,
        attemptCount: 0,
        nextRetryAtMs: Date.now(),
        lastError: undefined,
      };
    }),
  );
  return n;
}

/** On a fresh app runtime no previous in-process OCR worker can still own these jobs. */
export async function recoverInterruptedOcrJobs(): Promise<number> {
  let recoveredCount = 0;
  await updateOcrQueue((cur) => {
    const recovered = recoverInterruptedOcrItems(cur, Date.now());
    recoveredCount = recovered.recoveredCount;
    return recovered.items;
  });
  return recoveredCount;
}
