/**
 * Append-only release execution trace for CI/EAS pipeline.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRACE = path.join(root, "src/content/release-execution-trace.json");

export function appendTrace(entry) {
  let log = { version: "1.0", events: [] };
  try {
    log = JSON.parse(fs.readFileSync(TRACE, "utf8"));
  } catch {
    /* */
  }
  const event = {
    id: `tr-${Date.now()}`,
    at: new Date().toISOString(),
    ...entry,
  };
  log.events = [event, ...(log.events ?? [])].slice(0, 150);
  fs.writeFileSync(TRACE, `${JSON.stringify(log, null, 2)}\n`, "utf8");
  console.log(`[TRACE] ${entry.stage}: ${entry.message}`);
  return event;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stage = process.argv[2] ?? "manual";
  const message = process.argv.slice(3).join(" ") || "trace";
  appendTrace({ stage, message, level: "info" });
}
