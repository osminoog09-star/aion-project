import type { Shift, UserProfile } from "../../../types";
import { captureSyncError } from "../../../lib/sentry";
import { touchLastSyncFlushAt } from "../../../storage/core/syncDebugMeta";
import { upsertTripFromShift } from "../../cloud/repositories/tripsRepository";
import { syncLocalUserProfileToCloud } from "../../cloud/repositories/profileRepository";
import {
  dequeueSucceeded,
  markAttempt,
  peekSyncQueue,
  type SyncOperation,
} from "./offlineQueue";
import { requireSupabase } from "../../../lib/supabase";
import { appendAionTimelineEvent } from "../../../storage/core/aionTimelineStorage";
import { useAionEntityStore } from "../../../src/core/aion/entity/aionEntityStore";

const MAX_ATTEMPTS = 8;

function backoffMs(attempts: number): number {
  return Math.min(30_000, 400 * 2 ** Math.min(attempts, 10));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function processOperation(
  op: SyncOperation,
  userId: string,
): Promise<boolean> {
  switch (op.type) {
    case "link_ocr_snapshot":
      /** Фаза 1: relay в Supabase — позже; не трогаем requireSupabase, очередь просто очищается */
      return true;
    case "vehicle_upsert":
    case "analytics_event":
      return true;
    case "trip_upsert": {
      const client = requireSupabase();
      await upsertTripFromShift(
        client,
        userId,
        op.payload as Shift,
        null,
      );
      return true;
    }
    case "profile_upsert": {
      const client = requireSupabase();
      const p = op.payload as UserProfile;
      await syncLocalUserProfileToCloud(client, userId, p);
      return true;
    }
    default:
      return true;
  }
}

/**
 * Обработка офлайн-очереди: экспоненциальный backoff, снятие успешных и «мёртвых» операций.
 */
export async function flushSyncQueue(userId: string | null): Promise<void> {
  if (!userId) return;
  const queue = await peekSyncQueue();
  let flushed = 0;
  for (const op of queue) {
    if (op.attempts >= MAX_ATTEMPTS) {
      captureSyncError(new Error("sync_max_attempts"), {
        opType: op.type,
        opId: op.id,
        attempts: op.attempts,
      });
      await dequeueSucceeded(op.id);
      continue;
    }
    if (op.attempts > 0) {
      await sleep(backoffMs(op.attempts - 1));
    }
    try {
      const ok = await processOperation(op, userId);
      if (ok) {
        await dequeueSucceeded(op.id);
        flushed += 1;
      }
    } catch (e) {
      captureSyncError(e, { opType: op.type, opId: op.id, attempts: op.attempts });
      await markAttempt(op.id);
    }
  }
  await touchLastSyncFlushAt();
  if (flushed > 0) {
    const remaining = (await peekSyncQueue()).length;
    void appendAionTimelineEvent({
      type: "queue_flushed",
      title: "Очередь синка",
      detail: `Обработано ${flushed} · в очереди ${remaining}`,
    });
    if (remaining === 0) {
      void appendAionTimelineEvent({
        type: "sync_completed",
        title: "Синхронизация",
        detail: "Очередь пуста",
      });
    }
    useAionEntityStore.getState().triggerSuccess(2200);
  }
}
