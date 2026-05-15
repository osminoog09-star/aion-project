/**
 * Autonomous execution runtime + Russian owner narration [AION АКТИВЕН]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendExecutionFeed } from "./execution-feed.mjs";
import { buildTimelineRu, narrateAionActiveRu, PHASE_OWNER } from "./execution-owner-ru.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_FILE = path.join(__dirname, "../src/content/execution-runtime.json");

const PHASE_FEED_TYPES = {
  planning: "execution_started",
  analyzing: "execution_analyzing",
  validating: "execution_validating",
  deploying: "execution_deploying",
  recovering: "execution_recovering",
  blocked: "execution_blocked",
  completed: "execution_completed",
  coding: "execution_resumed",
};

const ACTIVE_PHASES = new Set([
  "planning",
  "analyzing",
  "coding",
  "validating",
  "deploying",
  "recovering",
  "reviewing",
]);

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

function logPhaseRu(phase, message) {
  const meta = PHASE_OWNER[phase] ?? { label: phase };
  console.log(`[${meta.icon} ${meta.label}] ${message}`);
}

const now = new Date().toISOString();
const doc = readDoc();
const prev = doc.runtime ?? doc.state;

if (!doc.runtime && doc.state) {
  doc.runtime = doc.state;
  delete doc.state;
}

if (hasFlag("--banner")) {
  narrateAionActiveRu({
    phase: prev.phase ?? prev.status ?? "idle",
    task: prev.currentTask,
    reasoning: prev.reasoning,
    next: prev.nextStep,
    confidence: prev.confidence,
    progress: prev.validationProgress,
  });
  process.exit(0);
}

if (hasFlag("--heartbeat")) {
  doc.heartbeats = [{ at: now }, ...(doc.heartbeats ?? [])].slice(0, 48);
  doc.runtime = { ...prev, updatedAt: now, heartbeatAt: now };
  writeDoc(doc);
  narrateAionActiveRu({
    phase: prev.phase ?? prev.status,
    task: prev.currentTask || "Продолжаю работу…",
    reasoning: prev.reasoning,
    next: prev.nextStep ?? "продолжить",
    confidence: prev.confidence,
    progress: prev.validationProgress ?? "работа в процессе",
  });
  process.exit(0);
}

const waitingReview = hasFlag("--waiting-review");
const phase = waitingReview
  ? "waiting_review"
  : (arg("--phase") ?? arg("--status") ?? prev.phase ?? prev.status);

const currentTask = arg("--task") ?? prev.currentTask;
const reasoning = arg("--reasoning") ?? prev.reasoning;
const nextStep = arg("--next") ?? prev.nextStep;
const confidence = arg("--confidence") ? Number.parseFloat(arg("--confidence")) : prev.confidence;

const summary =
  arg("--summary") ??
  (waitingReview
    ? `Ожидание Apply в Cursor (${arg("--pending") ?? prev.pendingReviewCount ?? "?"} изменений)`
    : `${PHASE_OWNER[phase]?.label ?? phase}: ${currentTask}`);

const prevPhase = prev.phase ?? prev.status;
const phaseChanged = phase !== prevPhase;

const lastValidation = { ...(prev.lastValidation ?? { typecheck: "idle", build: "idle", deploy: "idle", routes: "idle" }) };
if (arg("--typecheck")) lastValidation.typecheck = arg("--typecheck");
if (arg("--build")) lastValidation.build = arg("--build");
if (arg("--deploy")) lastValidation.deploy = arg("--deploy");
if (arg("--routes")) lastValidation.routes = arg("--routes");

const lastCompleted =
  arg("--last-completed") ??
  (phaseChanged && prevPhase !== "idle"
    ? `${PHASE_OWNER[prevPhase]?.label ?? prevPhase}: ${prev.currentTask}`
    : prev.lastCompletedAction);

const retryCount = arg("--retry")
  ? Number.parseInt(arg("--retry"), 10)
  : phase === "recovering"
    ? (prev.retryCount ?? 0) + (phaseChanged ? 1 : 0)
    : phase === "completed"
      ? 0
      : (prev.retryCount ?? 0);

const timelineRu = buildTimelineRu(phase, currentTask, reasoning);

doc.runtime = {
  ...prev,
  status: phase,
  phase,
  currentTask,
  subsystem: arg("--subsystem") ?? prev.subsystem,
  reasoning,
  confidence,
  files: arg("--files") ? arg("--files").split(",").map((s) => s.trim()) : prev.files,
  commitCandidate: arg("--commit") ?? prev.commitCandidate,
  blocker:
    arg("--blocker") === "null" || arg("--blocker") === ""
      ? null
      : (arg("--blocker") ??
        (phase === "blocked" ? reasoning : null) ??
        (phase === "blocked" ? prev.blocker : null)),
  nextStep,
  lastCompletedAction: lastCompleted ?? prev.lastCompletedAction ?? null,
  retryCount,
  validationProgress:
    arg("--progress") === "null" || arg("--progress") === ""
      ? null
      : (arg("--progress") ?? (phase === "completed" ? null : prev.validationProgress)),
  recoveryConfidence: arg("--recovery-confidence")
    ? Number.parseFloat(arg("--recovery-confidence"))
    : prev.recoveryConfidence,
  branch: arg("--branch") ?? prev.branch,
  dependencyTarget: arg("--dependency") ?? prev.dependencyTarget,
  pendingReviewCount: arg("--pending")
    ? Number.parseInt(arg("--pending"), 10)
    : prev.pendingReviewCount,
  updatedAt: now,
  heartbeatAt: now,
  startedAt: phaseChanged ? now : prev.startedAt,
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

let feedEventId = null;
if (phaseChanged && !hasFlag("--skip-feed")) {
  const feedType = PHASE_FEED_TYPES[phase];
  if (feedType) {
    feedEventId = appendExecutionFeed({
      title: timelineRu.titleRu,
      summary,
      eventType: feedType,
      reasoning,
      files: doc.runtime.files,
    });
  }
}

doc.timeline = [
  {
    at: now,
    phase,
    summary,
    feedEventId,
    ...timelineRu,
    confidence: confidence ?? undefined,
  },
  ...(doc.timeline ?? []),
].slice(0, 64);
doc.heartbeats = [{ at: now }, ...(doc.heartbeats ?? [])].slice(0, 48);
doc.lastUpdated = now.slice(0, 10);

writeDoc(doc);
logPhaseRu(phase, summary);
narrateAionActiveRu({
  phase,
  task: currentTask,
  reasoning,
  next: nextStep,
  confidence,
  progress: doc.runtime.validationProgress,
});

if (ACTIVE_PHASES.has(phase) && !hasFlag("--no-hint")) {
  console.log("[AION] Подсказка: npm run execution:daemon — сигнал каждые 12 сек, чтобы AI не казался «замёрзшим»");
}
