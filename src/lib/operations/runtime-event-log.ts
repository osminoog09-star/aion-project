import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type RuntimeEventType =
  | "runtime_started"
  | "runtime_phase_changed"
  | "deploy_started"
  | "deploy_passed"
  | "deploy_failed"
  | "validation_received"
  | "stale_detected"
  | "runtime_failed"
  | "execution_resumed"
  | "safe_mode_entered"
  | "device_heartbeat"
  | "compatibility_failed";

export type RuntimeEvent = {
  id: string;
  at: string;
  type: RuntimeEventType;
  summary: string;
  payload?: Record<string, unknown>;
};

const LOG_FILE = path.join(process.cwd(), "src/content/runtime-event-log.json");
const MAX_EVENTS = 200;

type LogFile = { version: string; events: RuntimeEvent[] };

function readLog(): LogFile {
  try {
    return JSON.parse(readFileSync(LOG_FILE, "utf8")) as LogFile;
  } catch {
    return { version: "1.0", events: [] };
  }
}

export function appendRuntimeEvent(
  type: RuntimeEventType,
  summary: string,
  payload?: Record<string, unknown>,
): RuntimeEvent {
  const log = readLog();
  const event: RuntimeEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    type,
    summary,
    payload,
  };
  log.events = [event, ...log.events].slice(0, MAX_EVENTS);
  writeFileSync(LOG_FILE, `${JSON.stringify(log, null, 2)}\n`, "utf8");
  return event;
}

export function getRuntimeEvents(limit = 40): RuntimeEvent[] {
  return readLog().events.slice(0, limit);
}
