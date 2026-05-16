/**
 * Engineering governance gate — blocks unsafe runtime phase transitions.
 * Usage: node scripts/execution-governance-gate.mjs --from coding --to deploying
 * Exit 0 = allowed, 1 = blocked
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function semverGte(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return true;
}

const from = arg("--from");
const to = arg("--to");
const force = process.argv.includes("--force");

if (!from || !to) {
  console.error("Usage: execution-governance-gate.mjs --from <phase> --to <phase> [--force]");
  process.exit(2);
}

const ALLOWED = {
  idle: ["planning", "analyzing", "coding", "blocked"],
  planning: ["analyzing", "coding", "blocked", "idle"],
  analyzing: ["coding", "planning", "validating", "blocked", "idle"],
  coding: ["validating", "deploying", "blocked", "waiting_approval", "waiting_review", "analyzing", "recovering"],
  validating: ["coding", "deploying", "blocked", "recovering", "completed"],
  deploying: ["validating", "completed", "blocked", "recovering", "coding"],
  blocked: ["coding", "analyzing", "recovering", "waiting_approval", "idle"],
  waiting_approval: ["coding", "blocked", "idle"],
  recovering: ["coding", "analyzing", "blocked", "validating"],
  completed: ["analyzing", "coding", "planning", "idle"],
};

if (from !== to) {
  const list = ALLOWED[from];
  if (!list?.includes(to)) {
    console.error(`[GOVERNANCE] Invalid transition ${from} → ${to}`);
    if (!force) process.exit(1);
  }
}

const req = readJson(path.join(root, "src/content/portal-runtime-requirements.json"));
const apkPath = path.join(root, "public/apk-manifest.preview.json");
const apk = fs.existsSync(apkPath) ? readJson(apkPath) : null;
const runtime = readJson(path.join(root, "src/content/execution-runtime.json")).runtime;

const STALE_MS = 60_000;
const age = Date.now() - Date.parse(runtime.heartbeatAt || runtime.updatedAt || 0);
const activePhases = new Set(["planning", "analyzing", "coding", "validating", "deploying", "recovering"]);
const heartbeatStale = activePhases.has(runtime.phase) && age > STALE_MS;

const apkOk = apk?.runtimeVersion && semverGte(apk.runtimeVersion, req.minRuntimeVersion);
const activationPhases = new Set(["deploying", "completed", "validating", "waiting_approval"]);
const validationPhases = new Set(["waiting_approval", "validating"]);

if (heartbeatStale && activationPhases.has(to) && !force) {
  console.error(`[GOVERNANCE] BLOCK: heartbeat stale (${Math.round(age / 1000)}s) — cannot → ${to}`);
  process.exit(1);
}

if (!apkOk && (activationPhases.has(to) || validationPhases.has(to)) && !force) {
  console.error(
    `[GOVERNANCE] BLOCK: APK manifest ${apk?.runtimeVersion ?? "missing"} < required ${req.minRuntimeVersion}`,
  );
  console.error("→ EAS build + release:apk-manifest:sync + release:orchestrate");
  process.exit(1);
}

console.log(`[GOVERNANCE] OK ${from} → ${to} (apk=${apk?.runtimeVersion ?? "n/a"}, heartbeat=${Math.round(age / 1000)}s)`);
process.exit(0);
