/**
 * Cursor autonomous execution visibility — update runtime SoT + terminal progress log.
 *
 *   node scripts/execution-runtime.mjs --heartbeat
 *   node scripts/execution-runtime.mjs --phase coding --task "..." --subsystem operations-center \
 *     --reasoning "..." --confidence 0.86 --files "a.ts,b.ts" --next "typecheck"
 *   node scripts/execution-runtime.mjs --waiting-review --pending 5
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "../src/content/execution-runtime-state.json");

const PHASE_LABELS = {
  idle: "IDLE",
  planning: "PLANNING",
  analyzing: "ANALYZING",
  coding: "CODING",
  validating: "VALIDATING",
  reviewing: "REVIEWING",
  deploying: "DEPLOYING",
  blocked: "BLOCKED",
  waiting_approval: "WAITING_APPROVAL",
  waiting_review: "WAITING_REVIEW",
  completed: "COMPLETED",
};

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return null;
  return process.argv[i + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function readState() {
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

function writeState(payload) {
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function logPhase(status, message) {
  const label = PHASE_LABELS[status] ?? String(status).toUpperCase();
  console.log(`[${label}] ${message}`);
}

const now = new Date().toISOString();
const payload = readState();
const prev = payload.state;

if (hasFlag("--heartbeat")) {
  payload.heartbeats = [{ at: now }, ...(payload.heartbeats ?? [])].slice(0, 24);
  payload.state = { ...prev, updatedAt: now };
  writeState(payload);
  logPhase(prev.status, `heartbeat · ${prev.currentTask || "—"}`);
  process.exit(0);
}

const waitingReview = hasFlag("--waiting-review");
const phase = waitingReview
  ? "waiting_review"
  : (arg("--phase") ?? arg("--status") ?? prev.status);

const currentTask = arg("--task") ?? prev.currentTask;
const summary =
  arg("--summary") ??
  (waitingReview
    ? `Ожидание Apply/Review (${arg("--pending") ?? prev.pendingReviewCount ?? "?"} файлов)`
    : `${phase}: ${currentTask}`);

payload.state = {
  ...prev,
  status: phase,
  currentTask,
  subsystem: arg("--subsystem") ?? prev.subsystem,
  reasoning: arg("--reasoning") ?? prev.reasoning,
  confidence: arg("--confidence") ? Number.parseFloat(arg("--confidence")) : prev.confidence,
  files: arg("--files") ? arg("--files").split(",").map((s) => s.trim()) : prev.files,
  commitCandidate: arg("--commit") ?? prev.commitCandidate,
  blocker: arg("--blocker") ?? (phase === "blocked" ? arg("--reasoning") : null),
  nextStep: arg("--next") ?? prev.nextStep,
  branch: arg("--branch") ?? prev.branch,
  dependencyTarget: arg("--dependency") ?? prev.dependencyTarget,
  validationStatus: arg("--validation") ?? prev.validationStatus,
  pendingReviewCount: arg("--pending")
    ? Number.parseInt(arg("--pending"), 10)
    : prev.pendingReviewCount,
  updatedAt: now,
  startedAt: phase !== prev.status ? now : prev.startedAt,
};

payload.timeline = [{ at: now, phase, summary }, ...(payload.timeline ?? [])].slice(0, 64);
payload.heartbeats = [{ at: now }, ...(payload.heartbeats ?? [])].slice(0, 24);
payload.lastUpdated = now.slice(0, 10);

writeState(payload);
logPhase(phase, summary);
