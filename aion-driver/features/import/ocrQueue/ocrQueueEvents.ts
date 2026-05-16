type OcrQueueListener = () => void;

const listeners = new Set<OcrQueueListener>();

export function subscribeOcrQueue(listener: OcrQueueListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyOcrQueueChanged(): void {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}
