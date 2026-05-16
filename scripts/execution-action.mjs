/**
 * Log a live action to terminal + execution-runtime.json (owner stream).
 *
 *   npm run execution:action -- CODE "описание на русском" --file src/foo.ts
 *   npm run execution:action -- VALIDATE "typecheck portal"
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ACTION_TAGS, logAction } from "./execution-orchestrator-core.mjs";
import { narrateAionActiveRu } from "./execution-owner-ru.mjs";

const RUNTIME_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/content/execution-runtime.json",
);

const TAG_MAP = {
  ANALYZE: ACTION_TAGS.ANALYZE,
  PLAN: ACTION_TAGS.PLAN,
  CODE: ACTION_TAGS.CODE,
  VALIDATE: ACTION_TAGS.VALIDATE,
  DEPLOY: ACTION_TAGS.DEPLOY,
  HEAL: ACTION_TAGS.HEAL,
  RETRY: ACTION_TAGS.RETRY,
  REVIEW: ACTION_TAGS.REVIEW,
  NEXT: ACTION_TAGS.NEXT,
  OPTIMIZE: ACTION_TAGS.OPTIMIZE,
  AUDIT: ACTION_TAGS.AUDIT,
  HEARTBEAT: ACTION_TAGS.HEARTBEAT,
};

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return null;
  return process.argv[i + 1];
}

function positionalMessage(tagIdx) {
  const parts = [];
  for (let i = tagIdx + 1; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith("--")) break;
    parts.push(a);
  }
  return parts.join(" ").trim();
}

const tagIdx = process.argv.findIndex((a) => TAG_MAP[a]);
const tagKey = tagIdx >= 0 ? process.argv[tagIdx] : "CODE";
const tag = TAG_MAP[tagKey] ?? `[${tagKey}]`;
const messageRaw = tagIdx >= 0 ? positionalMessage(tagIdx) : "";
const message = messageRaw || null;
const file = arg("--file");
const repo = arg("--repo") ?? "aion-project";
const now = new Date().toISOString();

const doc = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8"));
const prev = doc.runtime ?? {};

const actionMessage =
  message ??
  (file ? `Правка: ${path.basename(file.replace(/\\/g, "/"))}` : prev.validationProgress) ??
  prev.currentTask ??
  "Автономная работа";

const entry = {
  at: now,
  tag: tagKey,
  message: actionMessage,
  file: file ?? undefined,
  repo,
};

const recentActions = [entry, ...(prev.recentActions ?? [])].slice(0, 32);

doc.runtime = {
  ...prev,
  status: prev.status === "waiting_approval" ? "coding" : prev.status,
  phase: prev.phase === "waiting_approval" ? "coding" : prev.phase,
  updatedAt: now,
  heartbeatAt: now,
  orchestrationMode: prev.orchestrationMode ?? "continuous",
  lastAction: tagKey,
  currentFile: file ?? prev.currentFile ?? null,
  validationProgress: actionMessage,
  recentActions,
  blocker: prev.phase === "waiting_approval" ? null : prev.blocker,
};

doc.timeline = [
  {
    at: now,
    phase: doc.runtime.phase,
    summary: `[${tagKey}] ${actionMessage}`,
  },
  ...(doc.timeline ?? []),
].slice(0, 64);

doc.heartbeats = [{ at: now }, ...(doc.heartbeats ?? [])].slice(0, 48);
fs.writeFileSync(RUNTIME_FILE, `${JSON.stringify(doc, null, 2)}\n`, "utf8");

console.log("");
console.log("[AION ACTION]");
logAction(tag, actionMessage);
if (file) console.log(`  файл: ${file}`);
if (repo !== "aion-project") console.log(`  репо: ${repo}`);
console.log("");

try {
  execSync("node scripts/execution-push-live.mjs", {
    cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
    stdio: "inherit",
  });
} catch {
  console.warn("[AION] Live push skipped (no secret or network)");
}

if (tagKey === "CODE" || tagKey === "VALIDATE" || tagKey === "DEPLOY") {
  narrateAionActiveRu({
    phase: doc.runtime.phase ?? prev.status ?? "coding",
    task: prev.currentTask ?? actionMessage,
    subsystem: prev.subsystem,
    reasoning: prev.reasoning ?? message,
    next: prev.nextStep,
    confidence: prev.confidence,
    progress: actionMessage,
    progressPercent: prev.progressPercent,
    etaMinutes: prev.etaMinutes,
    runtimeGraph: prev.runtimeGraph,
    autonomousDepth: prev.autonomousDepth,
    currentFile: file ?? prev.currentFile,
    lastAction: tagKey,
  });
}
