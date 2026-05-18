import { isSupabaseConfigured } from "../../../lib/supabase";
import { enqueueSyncOperation } from "../../sync/services/offlineQueue";
import { pushDriverCloudBackup } from "./driverCloudSync";

let activeUserId: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function setCloudBackupUserId(userId: string | null): void {
  activeUserId = userId;
  if (!userId && timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export function scheduleCloudBackupPush(): void {
  if (!activeUserId || !isSupabaseConfigured()) return;
  const userId = activeUserId;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void (async () => {
      try {
        await enqueueSyncOperation({
          type: "cloud_backup_upsert",
          payload: { userId },
          dedupeKey: "cloud_backup",
        });
        await pushDriverCloudBackup(userId);
      } catch {
        /* offline queue will retry */
      }
    })();
  }, 1500);
}
