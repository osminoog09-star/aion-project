/**
 * TRUE continuous autonomous execution loop.
 *
 *   node scripts/execution-runtime-loop.mjs
 *   node scripts/execution-runtime-loop.mjs --heartbeat 10 --autonomous 20
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  ACTION_TAGS,
  CONTINUOUS_ACTIVE_PHASES,
  RESTING_PHASES,
  SAFETY,
  canHeal,
  heartbeatAgeMs,
  isDeployCooldown,
  logAction,
  pickNextTask,
  readJson,
  readLoopState,
  readRuntimeDoc,
  resolveRuntimeGraph,
  shouldRunStaleRecover,
  taskKey,
  writeLoopState,
  PRIORITIES_FILE,
} from "./execution-orchestrator-core.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function argMs(flag, fallbackSec) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || !process.argv[i + 1]) return fallbackSec * 1000;
  return Number.parseInt(process.argv[i + 1], 10) * 1000;
}

const HEARTBEAT_MS = argMs("--heartbeat", 10);
const AUTONOMOUS_MS = argMs("--autonomous", 20);
const maxArg = process.argv.indexOf("--max");
const maxMs =
  maxArg >= 0 && process.argv[maxArg + 1]
    ? Number.parseInt(process.argv[maxArg + 1], 10) * 1000
    : 0;

const started = Date.now();
let lastHeartbeat = 0;
let lastAutonomous = 0;

function run(cmd, inherit = true) {
  execSync(cmd, { cwd: root, shell: true, stdio: inherit ? "inherit" : "pipe" });
}

function setPhase(args) {
  run(`node scripts/execution-runtime.mjs ${args} --no-hint --mode continuous`);
}

function advanceAutonomous() {
  const priorities = readJson(PRIORITIES_FILE);
  let loopState = readLoopState();
  const doc = readRuntimeDoc();
  const r = doc.runtime;
  const phase = r.phase ?? r.status;

  if (phase === "waiting_review" || phase === "waiting_approval") {
    logAction(ACTION_TAGS.REVIEW, "Ожидание Apply — цикл на паузе до принятия изменений");
    return;
  }

  if (phase === "blocked") {
    const conf = r.confidence ?? 0.5;
    if (conf < SAFETY.humanReviewConfidenceThreshold) {
      logAction(ACTION_TAGS.RETRY, "Блокировка — уверенность низкая, эскалация владельцу");
      return;
    }
    if (canHeal(loopState) && !isDeployCooldown(loopState)) {
      logAction(ACTION_TAGS.HEAL, "Блокировка — запуск self-heal");
      const now = new Date().toISOString();
      const hourStart = loopState.healHourStarted ?? now;
      const hourElapsed = Date.now() - Date.parse(hourStart) > 3_600_000;
      loopState = {
        ...loopState,
        lastHealAt: now,
        healHourStarted: hourElapsed ? now : hourStart,
        healCountHour: hourElapsed ? 1 : (loopState.healCountHour ?? 0) + 1,
        deployCooldownUntil: new Date(Date.now() + SAFETY.deployCooldownMs).toISOString(),
      };
      writeLoopState(loopState);
      try {
        run("node scripts/execution-self-heal.mjs", true);
      } catch {
        logAction(ACTION_TAGS.RETRY, "Self-heal завершился с ошибкой — продолжу цикл");
      }
    }
    return;
  }

  const pick = pickNextTask(priorities, loopState);
  const depth = Math.min(SAFETY.maxAutonomousDepth, (loopState.autonomousDepth ?? 0) + 1);
  const sameKey = taskKey(pick.task);
  const sameCount = loopState.lastTaskKey === sameKey ? (loopState.sameTaskCount ?? 0) + 1 : 1;
  const targetPhase = pick.phase ?? (pick.fromBackground ? pick.phase : "coding");

  loopState = {
    ...loopState,
    version: "1.0",
    loopStartedAt: loopState.loopStartedAt ?? new Date().toISOString(),
    lastTaskKey: sameKey,
    sameTaskCount: sameCount,
    lastAutonomousAt: new Date().toISOString(),
    totalAutonomousTicks: (loopState.totalAutonomousTicks ?? 0) + 1,
    autonomousDepth: depth,
  };
  writeLoopState(loopState);

  logAction(ACTION_TAGS.NEXT, `Следующая задача: ${pick.task}`);

  if (RESTING_PHASES.has(phase)) {
    logAction(ACTION_TAGS.PLAN, "Переход из завершённого этапа — непрерывный цикл");
    setPhase(
      `--phase analyzing --task "Анализ roadmap и приоритетов" --subsystem ecosystem-ai --reasoning "Непрерывный цикл: выбираю dependency-safe задачу" --next "${pick.task}" --confidence 0.85 --progress-pct 8 --depth ${depth} --runtime-graph ACTIVE --action ANALYZE`,
    );
  }

  const nextPhase = targetPhase || "coding";
  const graph = resolveRuntimeGraph(nextPhase);
  const tag =
    nextPhase === "validating"
      ? ACTION_TAGS.VALIDATE
      : nextPhase === "auditing" || nextPhase === "optimizing"
        ? ACTION_TAGS.OPTIMIZE
        : ACTION_TAGS.CODE;

  logAction(tag, pick.task);

  setPhase(
    [
      `--phase ${nextPhase}`,
      `--task "${pick.task}"`,
      `--subsystem ${pick.subsystem}`,
      `--reasoning "${pick.reasoning}"`,
      `--next "${pick.next}"`,
      `--confidence 0.88`,
      `--progress-pct ${pick.progressPercent ?? 50}`,
      `--eta ${pick.etaMinutes ?? 60}`,
      `--depth ${depth}`,
      `--runtime-graph ${graph}`,
      `--action ${tag.replace(/[[\]]/g, "")}`,
      `--last-completed "${r.lastCompletedAction ?? r.currentTask ?? ""}"`,
    ].join(" "),
  );
}

function tick() {
  const now = Date.now();
  const doc = readRuntimeDoc();
  const r = doc.runtime;
  const phase = r.phase ?? r.status;

  if (shouldRunStaleRecover(r)) {
    logAction(ACTION_TAGS.HEAL, `Stale heartbeat ${Math.round(heartbeatAgeMs(r) / 1000)}с — recovery`);
    try {
      run("node scripts/execution-stale-recover.mjs", true);
    } catch {
      run("node scripts/execution-runtime.mjs --heartbeat --no-hint --mode continuous", true);
    }
    return;
  }

  if (now - lastHeartbeat >= HEARTBEAT_MS) {
    lastHeartbeat = now;
    logAction(ACTION_TAGS.HEARTBEAT, `alive · ${phase} · ${Math.round(heartbeatAgeMs(r) / 1000)}с`);
    run("node scripts/execution-runtime.mjs --heartbeat --no-hint --mode continuous", true);
  }

  if (now - lastAutonomous >= AUTONOMOUS_MS) {
    lastAutonomous = now;
    if (RESTING_PHASES.has(phase) || !CONTINUOUS_ACTIVE_PHASES.has(phase)) {
      advanceAutonomous();
    } else if (phase === "completed") {
      advanceAutonomous();
    }
  }
}

console.log("");
console.log("[AION CONTINUOUS] TRUE AUTONOMOUS EXECUTION LOOP");
console.log(`  heartbeat: каждые ${HEARTBEAT_MS / 1000}с`);
console.log(`  autonomous-next: каждые ${AUTONOMOUS_MS / 1000}с`);
console.log(`  режим: непрерывный — idle/completed запрещены`);
console.log("");

const mandateHoursArg = process.argv.indexOf("--mandate-hours");
const mandateHours =
  mandateHoursArg >= 0 && process.argv[mandateHoursArg + 1]
    ? Number.parseFloat(process.argv[mandateHoursArg + 1])
    : 2;
const mandateMs = Math.round(mandateHours * 3_600_000);

let loopState = readLoopState();
const nowIso = new Date().toISOString();
if (!loopState.loopStartedAt) {
  loopState = { ...loopState, loopStartedAt: nowIso };
}
if (!loopState.ownerMandate?.active) {
  const endsAt = new Date(Date.now() + mandateMs).toISOString();
  loopState = {
    ...loopState,
    ownerMandate: {
      active: true,
      labelRu: `Владелец поручил: автономная работа ${mandateHours} ч по roadmap`,
      startedAt: nowIso,
      endsAt,
      durationMs: mandateMs,
    },
  };
}
writeLoopState(loopState);

const doc = readRuntimeDoc();
const phase = doc.runtime.phase ?? doc.runtime.status;
if (RESTING_PHASES.has(phase)) {
  logAction(ACTION_TAGS.NEXT, "Старт цикла — немедленный переход к следующей задаче");
  advanceAutonomous();
} else {
  setPhase(
    `--mode continuous --runtime-graph ${resolveRuntimeGraph(phase)} --depth ${loopState.autonomousDepth ?? 1} --no-hint`,
  );
}

tick();
const timer = setInterval(() => {
  if (maxMs > 0 && Date.now() - started >= maxMs) {
    console.log("[AION CONTINUOUS] max duration — loop stopping (restart with execution:runtime-loop)");
    clearInterval(timer);
    process.exit(0);
  }
  tick();
}, Math.min(HEARTBEAT_MS, AUTONOMOUS_MS));

process.on("SIGINT", () => {
  clearInterval(timer);
  process.exit(0);
});
