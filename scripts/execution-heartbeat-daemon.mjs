/**
 * Heartbeat daemon — prevents silent idle during long autonomous work.
 *
 *   node scripts/execution-heartbeat-daemon.mjs
 *   node scripts/execution-heartbeat-daemon.mjs --interval 12 --max 7200
 */
import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const intervalArg = process.argv.indexOf("--interval");
const maxArg = process.argv.indexOf("--max");
const intervalMs =
  intervalArg >= 0 && process.argv[intervalArg + 1]
    ? Number.parseInt(process.argv[intervalArg + 1], 10) * 1000
    : 12_000;
const maxMs =
  maxArg >= 0 && process.argv[maxArg + 1]
    ? Number.parseInt(process.argv[maxArg + 1], 10) * 1000
    : 7_200_000;

const started = Date.now();

function tick() {
  execSync("node scripts/execution-runtime.mjs --heartbeat --no-hint", {
    cwd: root,
    stdio: "inherit",
  });
}

console.log(`[AION DAEMON] heartbeat every ${intervalMs / 1000}s (max ${maxMs / 1000}s)`);
tick();

const timer = setInterval(() => {
  if (Date.now() - started >= maxMs) {
    console.log("[AION DAEMON] max duration reached — stopping");
    clearInterval(timer);
    process.exit(0);
  }
  tick();
}, intervalMs);

process.on("SIGINT", () => {
  clearInterval(timer);
  process.exit(0);
});

process.on("SIGTERM", () => {
  clearInterval(timer);
  process.exit(0);
});
