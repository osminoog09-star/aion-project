import { enqueueSyncOperation } from "../../sync/services/offlineQueue";
import { loadAionLinkLocalState } from "../storage/linkLocalState";
import type { LinkOcrSnapshotPayload } from "../types";

/** Поставить в офлайн-очередь payload снимка/OCR с этого устройства (relay в облаке — позже). */
export async function enqueueLinkOcrSnapshot(
  note?: string,
): Promise<LinkOcrSnapshotPayload> {
  const st = await loadAionLinkLocalState();
  const payload: LinkOcrSnapshotPayload = {
    sourceDeviceId: st.thisDeviceId,
    createdAt: Date.now(),
    note,
  };
  await enqueueSyncOperation({
    type: "link_ocr_snapshot",
    payload,
    dedupeKey: `link_ocr_snapshot:${st.thisDeviceId}`,
  });
  return payload;
}
