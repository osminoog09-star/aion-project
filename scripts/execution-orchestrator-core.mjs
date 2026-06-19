/**
 * Shared continuous orchestration — task queue, safety limits, action stream.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export const RUNTIME_FILE = path.join(root, "src/content/execution-runtime.json");
export const LOOP_STATE_FILE = path.join(root, "src/content/execution-loop-state.json");
export const PRIORITIES_FILE = path.join(root, "src/content/strategic-priorities.json");
export const ROADMAP_FILE = path.join(root, "src/content/roadmap-execution.json");

export const ACTION_TAGS = {
  ANALYZE: "[ANALYZE]",
  PLAN: "[PLAN]",
  CODE: "[CODE]",
  VALIDATE: "[VALIDATE]",
  DEPLOY: "[DEPLOY]",
  HEAL: "[HEAL]",
  RETRY: "[RETRY]",
  REVIEW: "[REVIEW]",
  NEXT: "[NEXT TASK]",
  OPTIMIZE: "[OPTIMIZE]",
  AUDIT: "[AUDIT]",
  HEARTBEAT: "[HEARTBEAT]",
};

export const RESTING_PHASES = new Set(["idle", "completed"]);
export const CONTINUOUS_ACTIVE_PHASES = new Set([
  "planning",
  "analyzing",
  "coding",
  "validating",
  "deploying",
  "reviewing",
  "recovering",
  "optimizing",
  "auditing",
  "waiting_review",
  "waiting_approval",
  "blocked",
]);

export const RUNTIME_GRAPH = {
  active: "ACTIVE",
  validating: "VALIDATING",
  deploying: "DEPLOYING",
  recovering: "HEALING",
  blocked: "BLOCKED",
  waiting_review: "WAITING REVIEW",
  waiting_approval: "WAITING REVIEW",
  planning: "ACTIVE",
  analyzing: "ACTIVE",
  coding: "ACTIVE",
  reviewing: "ACTIVE",
  optimizing: "OPTIMIZING",
  auditing: "OPTIMIZING",
  completed: "ACTIVE",
  idle: "ACTIVE",
};

export const SAFETY = {
  maxSameTaskRepeats: 5,
  maxHealPerHour: 3,
  deployCooldownMs: 120_000,
  maxAutonomousDepth: 48,
  humanReviewConfidenceThreshold: 0.35,
};

/** Mirrors owner-ru-constitution AUTONOMOUS_QUEUE_RU */
export const AUTONOMOUS_QUEUE = [
  {
    key: "route-field-validation",
    task: "Route intelligence UX + field validation",
    subsystem: "driver-intelligence",
    reasoning: "Проверка backfill и stop-zone на реальном устройстве",
    next: "OTA тест Driver",
    progressPercent: 68,
    etaMinutes: 45,
  },
  {
    key: "stop-zone-device",
    task: "Stop-zone validation на устройстве",
    subsystem: "driver-intelligence",
    reasoning: "Подтвердить GPS cluster insights после 2+ смен",
    next: "Стабилизация runtime",
    progressPercent: 52,
    etaMinutes: 60,
  },
  {
    key: "runtime-stabilization",
    task: "Runtime stabilization (FGS + unified shift)",
    subsystem: "background-drive",
    reasoning: "Production gate для фоновой смены",
    next: "Overlay HUD v2",
    progressPercent: 40,
    etaMinutes: 90,
  },
  {
    key: "overlay-hud-v2",
    task: "Overlay HUD v2",
    subsystem: "overlay-hud",
    reasoning: "Улучшение оверлея без дублирования логики",
    next: "APK release loop",
    progressPercent: 25,
    etaMinutes: 120,
  },
  {
    key: "apk-release",
    task: "Надёжность APK / release loop",
    subsystem: "runtime-apk",
    reasoning: "Device-verified release path",
    next: "Heatmaps после GPS SoT",
    progressPercent: 30,
    etaMinutes: 180,
  },
  {
    key: "heatmaps",
    task: "Тепловые карты (после GPS SoT)",
    subsystem: "gps-route",
    reasoning: "Визуализация после стабилизации маршрутов",
    next: "AI recommendations engine",
    progressPercent: 15,
    etaMinutes: 240,
  },
  {
    key: "ai-recommendations",
    task: "Движок AI-рекомендаций",
    subsystem: "driver-intelligence",
    reasoning: "Следующий слой интеллекта водителя",
    next: "Architecture audit",
    progressPercent: 10,
    etaMinutes: 300,
  },
];

export const BACKGROUND_TASKS = [
  {
    key: "arch-audit",
    task: "Architecture audit — ecosystem cohesion",
    subsystem: "ecosystem-ai",
    phase: "auditing",
    reasoning: "Нет прямой roadmap-задачи — проверяю границы подсистем и дубли",
    next: "Technical debt scan",
    progressPercent: 12,
    etaMinutes: 30,
  },
  {
    key: "tech-debt-scan",
    task: "Technical debt scan",
    subsystem: "ecosystem-ai",
    phase: "analyzing",
    reasoning: "Сканирую TODO, дубли и orphan-экраны",
    next: "Runtime hardening",
    progressPercent: 18,
    etaMinutes: 25,
  },
  {
    key: "runtime-hardening",
    task: "Runtime hardening + observability",
    subsystem: "operations-center",
    phase: "optimizing",
    reasoning: "Укрепляю heartbeat, feed и live execution",
    next: "Validation sweep",
    progressPercent: 22,
    etaMinutes: 20,
  },
  {
    key: "validation-sweep",
    task: "Validation sweep (typecheck + routes)",
    subsystem: "operations-center",
    phase: "validating",
    reasoning: "Проактивная проверка качества без ожидания владельца",
    next: "Следующая roadmap-задача",
    progressPercent: 35,
    etaMinutes: 15,
  },
];

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function readRuntimeDoc() {
  return readJson(RUNTIME_FILE);
}

export function readLoopState() {
  try {
    return readJson(LOOP_STATE_FILE);
  } catch {
    return {
      version: "1.0",
      loopStartedAt: null,
      lastTaskKey: null,
      sameTaskCount: 0,
      lastAutonomousAt: null,
      lastHealAt: null,
      healCountHour: 0,
      healHourStarted: null,
      deployCooldownUntil: null,
      totalAutonomousTicks: 0,
      autonomousDepth: 0,
    };
  }
}

export function writeLoopState(state) {
  writeJson(LOOP_STATE_FILE, state);
}

export function logAction(tag, message) {
  const t = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  console.log(`${tag} [${t}] ${message}`);
}

export function taskKey(task) {
  return task.toLowerCase().replace(/\s+/g, "-").slice(0, 48);
}

export function pickNextTask(priorities, loopState) {
  const target = (
    priorities.nextImplementationTarget ||
    priorities.ownerDirective ||
    ""
  ).toLowerCase();

  const blocked = new Set(
    (priorities.blockers ?? priorities.priorities ?? [])
      .filter((p) => p.status === "blocked")
      .map((p) => (p.id ?? p.title ?? "").toLowerCase()),
  );

  const roadmapOnlyIds = (priorities.priorities ?? [])
    .filter((p) => p.status === "roadmap_only" || p.level === "strategic")
    .map((p) => (p.id ?? "").toLowerCase())
    .filter(Boolean);

  let pick =
    AUTONOMOUS_QUEUE.find((q) => target.includes(q.key.replace(/-/g, " ").slice(0, 8))) ??
    AUTONOMOUS_QUEUE.find((q) => target.includes(q.task.slice(0, 14).toLowerCase())) ??
    AUTONOMOUS_QUEUE[0];

  for (const q of AUTONOMOUS_QUEUE) {
    if (blocked.has(q.subsystem)) continue;
    if (target.includes(q.subsystem) || target.includes(q.task.slice(0, 10).toLowerCase())) {
      pick = q;
      break;
    }
  }

  if (roadmapOnlyIds.some((id) => target.includes(id) || target.includes(id.replace(/-/g, " ")))) {
    logAction(
      ACTION_TAGS.AUDIT,
      "Стратегический roadmap-only приоритет — удерживаем field validation / production gate",
    );
    pick = AUTONOMOUS_QUEUE[0];
  }

  const key = pick.key;
  if (loopState.lastTaskKey === key && loopState.sameTaskCount >= SAFETY.maxSameTaskRepeats) {
    const bg = BACKGROUND_TASKS[loopState.totalAutonomousTicks % BACKGROUND_TASKS.length];
    logAction(ACTION_TAGS.AUDIT, `Anti-loop: переключаюсь на фоновую задачу «${bg.task}»`);
    return { ...bg, fromBackground: true };
  }

  return { ...pick, fromBackground: false };
}

export function resolveRuntimeGraph(phase) {
  return RUNTIME_GRAPH[phase] ?? "ACTIVE";
}

export function heartbeatAgeMs(runtime) {
  const ms = Date.parse(runtime.heartbeatAt || runtime.updatedAt);
  return Number.isFinite(ms) ? Math.max(0, Date.now() - ms) : 999_999;
}

const STALE_RECOVER_PHASES = new Set([
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

export function shouldRunStaleRecover(runtime) {
  const phase = runtime.phase ?? runtime.status;
  if (RESTING_PHASES.has(phase)) return false;
  if (phase === "waiting_review" || phase === "waiting_approval" || phase === "blocked") {
    return false;
  }
  return STALE_RECOVER_PHASES.has(phase) && heartbeatAgeMs(runtime) >= 60_000;
}

export function canHeal(loopState) {
  const hourStart = loopState.healHourStarted
    ? Date.parse(loopState.healHourStarted)
    : 0;
  const hourElapsed = Date.now() - hourStart > 3_600_000;
  const count = hourElapsed ? 0 : (loopState.healCountHour ?? 0);
  return count < SAFETY.maxHealPerHour;
}

export function isDeployCooldown(loopState) {
  if (!loopState.deployCooldownUntil) return false;
  return Date.parse(loopState.deployCooldownUntil) > Date.now();
}
