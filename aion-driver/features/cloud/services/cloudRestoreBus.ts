type Listener = () => void;

const listeners = new Set<Listener>();

export function onCloudDataRestored(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitCloudDataRestored(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}
