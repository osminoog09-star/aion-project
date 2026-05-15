/**
 * Autonomous execution runtime SoT + Cursor terminal logs.
 * Canonical file: src/content/execution-runtime.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_FILE = path.join(__dirname, "../src/content/execution-runtime.json");

const PHASE_LABELS = {
  idle: "IDLE",
  planning: "PLANNING",
  analyzing: "ANALYZING",
  coding: "CODING",
  validating: "VALIDATING",
  reviewing: "REVIEWING",
  deploying: "DEPLOYING",
  blocked: "BLOCKED",
  recovering: "RECOVERING",
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

function readDoc() {
  return JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8"));
}

function writeDoc(doc) {
  fs.writeFileSync(RUNTIME_FILE, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}

function logPhase(phase, message) {
  const label = PHASE_LABELS[phase] ?? String(phase).toUpperCase();
  console.log(`[${label}] ${message}`);
}

const now = new Date().toISOString();
const doc = readDoc();
const prev = doc.runtime ?? doc.state;

if (!doc.runtime && doc.state) {
  doc.runtime = doc.state;
  delete doc.state;
}

if (hasFlag("--heartbeat")) {
  doc.heartbeats = [{ at: now }, ...(doc.heartbeats ?? [])].slice(0, 48);
  doc.runtime = { ...prev, updatedAt: now, heartbeatAt: now };
  writeDoc(doc);
  logPhase(prev.phase ?? prev.status, `heartbeat · ${prev.currentTask || "—"}`);
  process.exit(0);
}

const waitingReview = hasFlag("--waiting-review");
const phase = waitingReview
  ? "waiting_review"
  : (arg("--phase") ?? arg("--status") ?? prev.phase ?? prev.status);

const currentTask = arg("--task") ?? prev.currentTask;
const summary =
  arg("--summary") ??
  (waitingReview
    ? `Ожидание Apply/Review (${arg("--pending") ?? prev.pendingReviewCount ?? "?"} файлов)`
    : `${phase}: ${currentTask}`);

const lastValidation = { ...(prev.lastValidation ?? { typecheck: "idle", build: "idle", deploy: "idle" }) };
if (arg("--typecheck")) lastValidation.typecheck = arg("--typecheck");
if (arg("--build")) lastValidation.build = arg("--build");
if (arg("--deploy")) lastValidation.deploy = arg("--deploy");
if (arg("--routes")) lastValidation.routes = arg("--routes");

doc.runtime = {
  ...prev,
  status: phase,
  phase,
  currentTask,
  subsystem: arg("--subsystem") ?? prev.subsystem,
  reasoning: arg("--reasoning") ?? prev.reasoning,
  confidence: arg("--confidence") ? Number.parseFloat(arg("--confidence")) : prev.confidence,
  files: arg("--files") ? arg("--files").split(",").map((s) => s.trim()) : prev.files,
  commitCandidate: arg("--commit") ?? prev.commitCandidate,
  blocker:
    arg("--blocker") ??
    (phase === "blocked" ? arg("--reasoning") ?? prev.reasoning : null) ??
    (phase === "blocked" ? prev.blocker : null),
  nextStep: arg("--next") ?? prev.nextStep,
  branch: arg("--branch") ?? prev.branch,
  dependencyTarget: arg("--dependency") ?? prev.dependencyTarget,
  pendingReviewCount: arg("--pending")
    ? Number.parseInt(arg("--pending"), 10)
    : prev.pendingReviewCount,
  updatedAt: now,
  heartbeatAt: now,
  startedAt: phase !== (prev.phase ?? prev.status) ? now : prev.startedAt,
  lastValidation,
  lastFailure:
    phase === "blocked" && arg("--failure-kind")
      ? { kind: arg("--failure-kind"), message: arg("--failure-msg") ?? summary, at: now }
      : phase === "recovering"
        ? prev.lastFailure
        : phase === "completed"
          ? null
          : prev.lastFailure,
};

doc.timeline = [{ at: now, phase, summary }, ...(doc.timeline ?? [])].slice(0, 64);
doc.heartbeats = [{ at: now }, ...(doc.heartbeats ?? [])].slice(0, 48);
doc.lastUpdated = now.slice(0, 10);

writeDoc(doc);
logPhase(phase, summary);
