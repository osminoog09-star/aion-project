import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import { useOnline } from "../../sync/hooks/useNetworkStatus";
import { flushSyncQueue } from "../../sync/services/syncEngine";
import { enqueueSyncOperation } from "../../sync/services/offlineQueue";
import { onShiftRecorded } from "../../trips/services/shiftRecordedBus";
import { qk } from "../../../lib/queryKeys";
import { supabase } from "../../../lib/supabase";
import { ensureProfileRow } from "./ensureProfileRow";
import { captureSyncError } from "../../../lib/sentry";
import { runCloudRestoreAndBackfill } from "../services/driverCloudSync";
import {
  markCloudRestoreReady,
  resetCloudRestoreReady,
} from "../state/cloudRestoreReady";
import {
  scheduleCloudBackupPush,
  setCloudBackupUserId,
} from "../services/scheduleCloudBackup";

export function CloudSyncBootstrap() {
  const { session, isGuest } = useAuth();
  const online = useOnline();
  const queryClient = useQueryClient();
  const userId = session?.user.id && !isGuest ? session.user.id : null;
  const ensuredRef = useRef<string | null>(null);
  const restoredRef = useRef<string | null>(null);

  useEffect(() => {
    setCloudBackupUserId(userId);
    if (!userId) {
      resetCloudRestoreReady();
      markCloudRestoreReady();
      restoredRef.current = null;
      return;
    }
    if (restoredRef.current === userId) return;
    resetCloudRestoreReady();
    restoredRef.current = userId;
    void (async () => {
      try {
        await runCloudRestoreAndBackfill(userId);
        if (online) {
          await flushSyncQueue(userId);
          await queryClient.invalidateQueries({ queryKey: qk.trips(userId) });
        }
      } catch (e) {
        captureSyncError(e, { phase: "cloud_restore", userId });
      } finally {
        markCloudRestoreReady();
      }
    })();
  }, [userId, online, queryClient]);

  useEffect(() => {
    return onShiftRecorded((shift) => {
      if (!userId) return;
      void (async () => {
        await enqueueSyncOperation({
          type: "trip_upsert",
          payload: shift,
          dedupeKey: `trip:${shift.id}`,
        });
        scheduleCloudBackupPush();
        if (online) {
          await flushSyncQueue(userId);
          await queryClient.invalidateQueries({ queryKey: qk.trips(userId) });
        }
      })();
    });
  }, [userId, online, queryClient]);

  useEffect(() => {
    if (!userId || !supabase) return;
    if (ensuredRef.current === userId) return;
    void (async () => {
      try {
        await ensureProfileRow(supabase, userId);
        ensuredRef.current = userId;
      } catch (e) {
        captureSyncError(e, { phase: "ensure_profile", userId });
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!online || !userId) return;
    void (async () => {
      await flushSyncQueue(userId);
      await queryClient.invalidateQueries({ queryKey: qk.trips(userId) });
    })();
  }, [online, userId, queryClient]);

  return null;
}
