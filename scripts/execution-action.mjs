/**
 * Log a live action to terminal + execution-runtime.json (owner stream).
 *
 *   npm run execution:action -- CODE "описание на русском" --file src/foo.ts
 *   npm run execution:action -- VALIDATE "typecheck portal"
 */
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
const message = (tagIdx >= 0 ? positionalMessage(tagIdx) : "") || "работа в процессе";
const file = arg("--file");
const repo = arg("--repo") ?? "aion-project";
const now = new Date().toISOString();

const doc = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8"));
const prev = doc.runtime ?? {};

const entry = {
  at: now,
  tag: tagKey,
  message,
  file: file ?? undefined,
  repo,
};

const recentActions = [entry, ...(prev.recentActions ?? [])].slice(0, 32);

doc.runtime = {
  ...prev,
  updatedAt: now,
  heartbeatAt: now,
  orchestrationMode: prev.orchestrationMode ?? "continuous",
  lastAction: tagKey,
  currentFile: file ?? prev.currentFile ?? null,
  validationProgress: message,
  recentActions,
};

doc.heartbeats = [{ at: now }, ...(doc.heartbeats ?? [])].slice(0, 48);
fs.writeFileSync(RUNTIME_FILE, `${JSON.stringify(doc, null, 2)}\n`, "utf8");

console.log("");
console.log("[AION ACTION]");
logAction(tag, message);
if (file) console.log(`  файл: ${file}`);
if (repo !== "aion-project") console.log(`  репо: ${repo}`);
console.log("");

if (tagKey === "CODE" || tagKey === "VALIDATE" || tagKey === "DEPLOY") {
  narrateAionActiveRu({
    phase: prev.phase ?? prev.status ?? "coding",
    task: prev.currentTask ?? message,
    subsystem: prev.subsystem,
    reasoning: prev.reasoning ?? message,
    next: prev.nextStep,
    confidence: prev.confidence,
    progress: message,
    progressPercent: prev.progressPercent,
    etaMinutes: prev.etaMinutes,
    runtimeGraph: prev.runtimeGraph,
    autonomousDepth: prev.autonomousDepth,
    currentFile: file ?? prev.currentFile,
    lastAction: tagKey,
  });
}
