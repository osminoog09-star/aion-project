/**
 * Autonomous execution runtime + Russian owner narration [AION АКТИВЕН]
 */
import { execSync } from "node:child_process";
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
  optimizing: "execution_analyzing",
  auditing: "execution_analyzing",
};

const ACTIVE_PHASES = new Set([
  "planning",
  "analyzing",
  "coding",
  "validating",
  "deploying",
  "recovering",
  "reviewing",
  "optimizing",
  "auditing",
]);

const RESTING_PHASES = new Set(["idle", "completed"]);

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return null;
  return process.argv[i + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

const CONTINUOUS_MODE = arg("--mode") === "continuous" || process.env.AION_CONTINUOUS === "1";

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
    phase: prev.phase ?? prev.status ?? "analyzing",
    task: prev.currentTask,
    subsystem: prev.subsystem,
    reasoning: prev.reasoning,
    next: prev.nextStep,
    confidence: prev.confidence,
    progress: prev.validationProgress,
    progressPercent: prev.progressPercent,
    etaMinutes: prev.etaMinutes,
    runtimeGraph: prev.runtimeGraph,
    autonomousDepth: prev.autonomousDepth,
    currentFile: prev.currentFile,
    lastAction: prev.lastAction,
  });
  process.exit(0);
}

if (hasFlag("--heartbeat")) {
  doc.heartbeats = [{ at: now }, ...(doc.heartbeats ?? [])].slice(0, 48);
  doc.runtime = { ...prev, updatedAt: now, heartbeatAt: now };
  writeDoc(doc);
  narrateAionActiveRu({
    phase: prev.phase ?? prev.status ?? "coding",
    task: prev.currentTask || "Продолжаю работу…",
    subsystem: prev.subsystem,
    reasoning: prev.reasoning,
    next: prev.nextStep ?? "продолжить",
    confidence: prev.confidence,
    progress: prev.validationProgress ?? prev.currentTask ?? "heartbeat",
    progressPercent: prev.progressPercent,
    etaMinutes: prev.etaMinutes,
    runtimeGraph: prev.runtimeGraph ?? "ACTIVE",
    autonomousDepth: prev.autonomousDepth,
    currentFile: prev.currentFile,
    lastAction: prev.lastAction ?? "HEARTBEAT",
  });
  try {
    execSync("node scripts/execution-push-live.mjs", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
  } catch {
    /* optional — needs OPERATIONS_OWNER_SECRET */
  }
  process.exit(0);
}

const waitingReview = hasFlag("--waiting-review");
let phase = waitingReview
  ? "waiting_review"
  : (arg("--phase") ?? arg("--status") ?? prev.phase ?? prev.status);

if (CONTINUOUS_MODE && RESTING_PHASES.has(phase) && !waitingReview && !hasFlag("--allow-rest")) {
  phase = "analyzing";
}

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

if (phaseChanged && !hasFlag("--force") && !hasFlag("--skip-governance")) {
  try {
    execSync(
      `node scripts/execution-governance-gate.mjs --from ${prevPhase} --to ${phase}`,
      { cwd: path.join(__dirname, ".."), stdio: "inherit" },
    );
  } catch {
    console.error(`[GOVERNANCE] Phase transition blocked: ${prevPhase} → ${phase}`);
    console.error("[GOVERNANCE] Use --force only for emergency recovery");
    process.exit(1);
  }
}

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

const progressPct = arg("--progress-pct")
  ? Number.parseInt(arg("--progress-pct"), 10)
  : prev.progressPercent;
const etaMinutes = arg("--eta") ? Number.parseInt(arg("--eta"), 10) : prev.etaMinutes;
const autonomousDepth = arg("--depth")
  ? Number.parseInt(arg("--depth"), 10)
  : prev.autonomousDepth;
const runtimeGraph = arg("--runtime-graph") ?? prev.runtimeGraph ?? "ACTIVE";
const currentFile = arg("--file") ?? prev.currentFile ?? null;
const lastAction = arg("--action") ?? prev.lastAction ?? null;
const orchestrationMode = CONTINUOUS_MODE ? "continuous" : (prev.orchestrationMode ?? "manual");

doc.runtime = {
  ...prev,
  status: phase,
  phase,
  currentTask,
  subsystem: arg("--subsystem") ?? prev.subsystem,
  reasoning,
  confidence,
  progressPercent: Number.isFinite(progressPct) ? progressPct : prev.progressPercent ?? 50,
  etaMinutes: Number.isFinite(etaMinutes) ? etaMinutes : prev.etaMinutes ?? null,
  autonomousDepth: Number.isFinite(autonomousDepth) ? autonomousDepth : prev.autonomousDepth ?? 0,
  runtimeGraph,
  currentFile,
  lastAction,
  orchestrationMode,
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
if (arg("--action")) {
  const tag = `[${arg("--action")}]`;
  console.log(`${tag} ${currentTask}`);
}

narrateAionActiveRu({
  phase,
  task: currentTask,
  subsystem: doc.runtime.subsystem,
  reasoning,
  next: nextStep,
  confidence,
  progress: doc.runtime.validationProgress,
  progressPercent: doc.runtime.progressPercent,
  etaMinutes: doc.runtime.etaMinutes,
  runtimeGraph: doc.runtime.runtimeGraph,
  autonomousDepth: doc.runtime.autonomousDepth,
  currentFile: doc.runtime.currentFile,
  lastAction: doc.runtime.lastAction,
});

if (CONTINUOUS_MODE && !hasFlag("--no-hint")) {
  console.log("[AION] Непрерывный цикл: npm run execution:runtime-loop");
} else if (ACTIVE_PHASES.has(phase) && !hasFlag("--no-hint")) {
  console.log("[AION] Подсказка: npm run execution:runtime-loop — непрерывный orchestration");
}

doc.orchestrationVersion = "3.0";
