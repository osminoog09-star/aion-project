import type { OcrParseResult } from "../../import/types";
import { diagLog } from "../../../lib/diagnosticLog";
import { supabase } from "../../../lib/supabase";
import { ensureCloudDevice } from "../cloud/ensureCloudDevice";
import { pushLinkSnapshot } from "../cloud/linkSnapshots";

export async function getLinkRelayUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** Best-effort: не блокирует OCR pipeline при сетевых сбоях. */
export async function relayOcrSnapshotToLink(
  userId: string,
  parse: OcrParseResult,
): Promise<void> {
  try {
    const { deviceId } = await ensureCloudDevice(userId);
    await pushLinkSnapshot({
      userId,
      sourceDeviceId: deviceId,
      kind: "ocr_snapshot",
      payload: {
        at: Date.now(),
        platform: parse.platform,
        tripCount: parse.tripCount,
        totalIncome: parse.earnings,
        netProfit: parse.netProfit,
        earningsPerHour: parse.analytics?.earningsPerHour ?? null,
      },
    });
    diagLog("info", "link_relay", "OCR snapshot в облако", {
      deviceId,
      trips: parse.tripCount,
    });
  } catch (e) {
    diagLog("warn", "link_relay", "OCR relay не удался", {
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
