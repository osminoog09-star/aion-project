import type { OcrQueueJobPayload } from "./ocrQueueTypes";

export function buildOcrDedupeKey(payload: OcrQueueJobPayload): string {
  const context = `${payload.platform}:${payload.currencyCode.toUpperCase()}`;
  if (payload.imageUris.length === 1) {
    return `uri:${payload.imageUris[0]}:${context}`;
  }
  if (payload.imageUris.length > 1) {
    return `uris:${payload.imageUris.slice().sort().join("|")}:${context}`;
  }
  const text = (payload.pastedText ?? "").trim().slice(0, 4000);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return `paste:${hash}:${text.length}:${context}`;
}
