import { readFileSync } from "node:fs";
import path from "node:path";

export type OwnerAutonomousMandate = {
  active: boolean;
  labelRu: string;
  startedAt: string;
  endsAt: string;
  durationMs: number;
};

export type OwnerAutonomousMandateView = OwnerAutonomousMandate & {
  remainingMs: number;
  progressPercent: number;
};

const LOOP_STATE_FILE = path.join(process.cwd(), "src/content/execution-loop-state.json");

export function getOwnerAutonomousMandate(nowMs = Date.now()): OwnerAutonomousMandateView | null {
  try {
    const raw = JSON.parse(readFileSync(LOOP_STATE_FILE, "utf8")) as {
      ownerMandate?: OwnerAutonomousMandate;
    };
    const m = raw.ownerMandate;
    if (!m?.active) return null;

    const endsMs = Date.parse(m.endsAt);
    const startsMs = Date.parse(m.startedAt);
    if (!Number.isFinite(endsMs) || !Number.isFinite(startsMs)) return null;

    const remainingMs = Math.max(0, endsMs - nowMs);
    if (remainingMs <= 0) return null;

    const elapsed = Math.max(0, nowMs - startsMs);
    const progressPercent = Math.min(
      100,
      Math.round((elapsed / Math.max(m.durationMs, 1)) * 100),
    );

    return {
      ...m,
      remainingMs,
      progressPercent,
    };
  } catch {
    return null;
  }
}
