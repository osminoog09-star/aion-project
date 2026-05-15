/**
 * Select next dependency-safe task and transition runtime (autonomous loop).
 *   node scripts/execution-autonomous-next.mjs
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTION_TAGS,
  logAction,
  pickNextTask,
  readJson,
  readLoopState,
  resolveRuntimeGraph,
  taskKey,
  writeLoopState,
  PRIORITIES_FILE,
} from "./execution-orchestrator-core.mjs";
import { narrateAionActiveRu } from "./execution-owner-ru.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const priorities = readJson(PRIORITIES_FILE);
const loopState = readLoopState();
const pick = pickNextTask(priorities, loopState);
const depth = (loopState.autonomousDepth ?? 0) + 1;
const sameKey = taskKey(pick.task);
const phase = pick.phase ?? "coding";
const graph = resolveRuntimeGraph(phase);

writeLoopState({
  ...loopState,
  lastTaskKey: sameKey,
  sameTaskCount: loopState.lastTaskKey === sameKey ? (loopState.sameTaskCount ?? 0) + 1 : 1,
  lastAutonomousAt: new Date().toISOString(),
  autonomousDepth: depth,
  totalAutonomousTicks: (loopState.totalAutonomousTicks ?? 0) + 1,
});

logAction(ACTION_TAGS.NEXT, pick.task);

const args = [
  "--phase",
  phase,
  "--task",
  `"${pick.task}"`,
  "--subsystem",
  pick.subsystem,
  "--reasoning",
  `"${pick.reasoning}"`,
  "--next",
  `"${pick.next}"`,
  "--confidence",
  "0.88",
  "--progress-pct",
  String(pick.progressPercent ?? 55),
  "--eta",
  String(pick.etaMinutes ?? 60),
  "--depth",
  String(depth),
  "--runtime-graph",
  graph,
  "--action",
  "NEXT",
  "--mode",
  "continuous",
].join(" ");

execSync(`node scripts/execution-runtime.mjs ${args}`, { cwd: root, stdio: "inherit" });

console.log("\n[AION AUTONOMOUS] Следующая задача выбрана — непрерывный цикл без запроса владельцу.\n");
narrateAionActiveRu({
  phase,
  task: pick.task,
  subsystem: pick.subsystem,
  reasoning: pick.reasoning,
  next: pick.next,
  confidence: 0.88,
  progress: `Автономно: ${pick.task}`,
  progressPercent: pick.progressPercent,
  etaMinutes: pick.etaMinutes,
  runtimeGraph: graph,
  autonomousDepth: depth,
  lastAction: "NEXT",
});
