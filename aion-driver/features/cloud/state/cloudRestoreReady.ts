let ready = true;
const waiters: Array<() => void> = [];

export function resetCloudRestoreReady(): void {
  ready = false;
}

export function markCloudRestoreReady(): void {
  ready = true;
  for (const w of waiters) w();
  waiters.length = 0;
}

export function isCloudRestoreReady(): boolean {
  return ready;
}

export function waitCloudRestoreReady(): Promise<void> {
  if (ready) return Promise.resolve();
  return new Promise((resolve) => waiters.push(resolve));
}
