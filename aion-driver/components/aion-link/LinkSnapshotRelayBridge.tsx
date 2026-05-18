import { useEffect, useRef } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import {
  subscribeToLinkSnapshots,
  type LinkSnapshotRow,
} from "../../features/aion-link/cloud/linkSnapshots";
import { ensureCloudDevice } from "../../features/aion-link/cloud/ensureCloudDevice";
import { appendAionTimelineEvent } from "../../storage/core/aionTimelineStorage";
import { diagLog } from "../../lib/diagnosticLog";

function labelForKind(row: LinkSnapshotRow): string {
  if (row.kind === "ocr_snapshot") {
    const p = row.payload as Record<string, unknown> | null;
    const income = typeof p?.totalIncome === "number" ? p.totalIncome : null;
    const trips = typeof p?.tripCount === "number" ? p.tripCount : null;
    if (income != null && trips != null) {
      return `OCR с другого устройства: ${trips} поездок · ${Math.round(income)}`;
    }
    return "OCR с другого устройства";
  }
  if (row.kind === "sync_event") return "Синхронизация с другого устройства";
  if (row.kind === "heartbeat") return "Второе устройство онлайн";
  return "Событие AION Link";
}

/**
 * Realtime: показываем в ленте AION события с paired устройств (INSERT link_snapshots).
 */
export function LinkSnapshotRelayBridge() {
  const { session, isGuest } = useAuth();
  const userId = session?.user?.id && !isGuest ? session.user.id : null;
  const excludeDeviceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      excludeDeviceRef.current = null;
      return;
    }
    let unsub: (() => void) | undefined;
    let alive = true;
    void (async () => {
      try {
        const { deviceId } = await ensureCloudDevice(userId);
        if (!alive) return;
        excludeDeviceRef.current = deviceId;
        unsub = subscribeToLinkSnapshots(
          userId,
          (row) => {
            void appendAionTimelineEvent({
              type: "link_snapshot",
              title: "AION Link",
              detail: labelForKind(row),
              moduleId: "aion-link",
            });
            diagLog("info", "link_relay", "Получен snapshot", { kind: row.kind });
          },
          { excludeDeviceId: deviceId },
        );
      } catch (e) {
        diagLog("warn", "link_relay", "Подписка не удалась", {
          message: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return () => {
      alive = false;
      unsub?.();
    };
  }, [userId]);

  return null;
}
