/**
 * Detect stale heartbeat during active phases → recovering → self-heal.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME_FILE = path.join(root, "src/content/execution-runtime.json");

const ACTIVE = new Set(["planning", "analyzing", "coding", "validating", "deploying", "recovering"]);
const STALE_MS = 60_000;

const doc = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8"));
const r = doc.runtime;
const age = Date.now() - Date.parse(r.heartbeatAt || r.updatedAt);

if (!ACTIVE.has(r.phase) && !ACTIVE.has(r.status)) {
  console.log(`[AION] phase ${r.phase} — not active, skip stale recovery`);
  process.exit(0);
}

if (age < STALE_MS) {
  console.log(`[AION] heartbeat fresh (${Math.round(age / 1000)}s) — OK`);
  process.exit(0);
}

console.log(`[AION] STALE heartbeat ${Math.round(age / 1000)}s — entering recovery`);
execSync(
  `node scripts/execution-runtime.mjs --phase recovering --task "Stale heartbeat recovery" --subsystem operations-center --reasoning "No heartbeat for ${Math.round(age / 1000)}s during ${r.phase}" --recovery-confidence 0.55 --progress "stale-detect → self-heal" --next "npm run execution:heal"`,
  { cwd: root, stdio: "inherit" },
);
execSync("node scripts/execution-self-heal.mjs", { cwd: root, stdio: "inherit" });
