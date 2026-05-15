import type { ExecutionRuntimeDocument } from "@/contracts/execution-runtime";
import type { DeploymentStatusPayload } from "@/contracts/deployment-status";
import type {
  ExecutionDependencyNode,
  ImplementationFeedItem,
  StrategicPrioritiesPayload,
  StrategicPriorityItem,
} from "@/lib/ecosystem-types";
import { getLocalExecutionRuntime, getLocalDeploymentStatus } from "@/lib/execution-runtime";
import { getLocalImplementationFeed } from "@/lib/ecosystem-data";
import { getLocalStrategicPriorities, getActionableDependencies } from "@/lib/strategic-priorities";
import { buildHumanTimelineCard, PHASE_OWNER } from "@/lib/operations/execution-owner-ru";

export type SubsystemGlow = "active" | "blocked" | "done" | "idle";

export type OwnerSubsystemBlock = {
  id: string;
  titleRu: string;
  icon: string;
  progressPercent: number;
  readinessLabel: string;
  currentAiTask: string | null;
  completed: string[];
  active: string[];
  blocked: string[];
  future: string[];
  dependencies: { id: string; title: string; statusRu: string }[];
  estimatedReadiness: string;
  glow: SubsystemGlow;
};

export type TaskQueueItem = {
  order: number;
  titleRu: string;
  status: "active" | "next" | "queued" | "blocked";
  subsystemId: string;
};

export type ProjectHealthSnapshot = {
  productionRu: string;
  deploymentRu: string;
  runtimeRu: string;
  aiExecutionRu: string;
  validationRu: string;
};

export type OwnerCommandCenterView = {
  overallReadinessPercent: number;
  aiActivityRu: string;
  activeSubsystemRu: string;
  confidencePercent: number;
  blockers: string[];
  retryCount: number;
  nextActionRu: string;
  primaryObjectiveRu: string;
  subsystems: OwnerSubsystemBlock[];
  taskQueue: TaskQueueItem[];
  narration: { icon: string; title: string; explanation: string; result: string; at: string }[];
  health: ProjectHealthSnapshot;
  runtime: ExecutionRuntimeDocument["runtime"];
};

const SUBSYSTEM_REGISTRY: {
  id: string;
  titleRu: string;
  icon: string;
  priorityIds: string[];
  dependencyIds: string[];
  feedKeywords: string[];
}[] = [
  {
    id: "driver-intelligence",
    titleRu: "Driver Intelligence",
    icon: "🧠",
    priorityIds: ["driver-intelligence-core", "unified-shift-runtime"],
    dependencyIds: ["post-shift-analytics", "time-intelligence"],
    feedKeywords: ["driver", "analytics", "rollup", "backfill", "intelligence"],
  },
  {
    id: "gps-route",
    titleRu: "GPS / Маршруты",
    icon: "🛰",
    priorityIds: ["route-heatmap-future"],
    dependencyIds: ["route-gps-store", "time-intelligence", "heatmap-analytics"],
    feedKeywords: ["gps", "route", "timeline", "маршрут", "headless", "trip"],
  },
  {
    id: "ocr",
    titleRu: "OCR Runtime",
    icon: "📷",
    priorityIds: ["ocr-production-queue"],
    dependencyIds: [],
    feedKeywords: ["ocr", "fuel", "queue", "чек"],
  },
  {
    id: "overlay-hud",
    titleRu: "Overlay HUD",
    icon: "💠",
    priorityIds: ["overlay-hud-evolution"],
    dependencyIds: ["overlay-hud-full"],
    feedKeywords: ["overlay", "hud", "orb"],
  },
  {
    id: "runtime-apk",
    titleRu: "Runtime / APK",
    icon: "📱",
    priorityIds: ["apk-release-loop", "background-runtime-production"],
    dependencyIds: ["route-gps-store"],
    feedKeywords: ["apk", "eas", "runtime", "background", "shift"],
  },
  {
    id: "ecosystem-ai",
    titleRu: "Экосистема / AI Control",
    icon: "🌐",
    priorityIds: ["ecosystem-control-portal"],
    dependencyIds: [],
    feedKeywords: ["portal", "operations", "live", "owner", "orchestr", "review"],
  },
  {
    id: "deployment",
    titleRu: "Deployment Pipeline",
    icon: "🚀",
    priorityIds: [],
    dependencyIds: [],
    feedKeywords: ["deploy", "vercel", "production", "validate"],
  },
];

function statusRu(status: string): string {
  const map: Record<string, string> = {
    done: "Готово",
    in_progress: "В работе",
    blocked: "Заблокировано",
    not_started: "Не начато",
    experimental: "Эксперимент",
  };
  return map[status] ?? status;
}

function priorityProgress(p: StrategicPriorityItem | undefined): number {
  if (!p) return 0;
  switch (p.status) {
    case "done":
      return 100;
    case "in_progress":
      return 65;
    case "blocked":
      return 15;
    default:
      return 8;
  }
}

function depProgress(d: ExecutionDependencyNode | undefined): number {
  if (!d) return 0;
  switch (d.status) {
    case "done":
      return 100;
    case "in_progress":
      return 55;
    case "blocked":
      return 10;
    default:
      return 20;
  }
}

function collectFeedLines(
  feed: ImplementationFeedItem[],
  keywords: string[],
  limit = 6,
): { done: string[]; partial: string[]; blocked: string[] } {
  const done: string[] = [];
  const partial: string[] = [];
  const blocked: string[] = [];
  for (const item of feed) {
    const blob = `${item.title} ${item.summary} ${item.subsystemIds?.join(" ")}`.toLowerCase();
    if (!keywords.some((k) => blob.includes(k.toLowerCase()))) continue;
    const r = item.rollup;
    if (!r) continue;
    for (const line of r.fullyDone.slice(0, 2)) if (done.length < limit) done.push(line.replace(/^✅\s*/, ""));
    for (const line of r.partiallyDone.slice(0, 2))
      if (partial.length < limit) partial.push(line.replace(/^🟨\s*/, ""));
    for (const line of item.blocked ?? []) if (blocked.length < limit) blocked.push(line);
  }
  return { done, partial, blocked };
}

function buildSubsystemBlock(
  reg: (typeof SUBSYSTEM_REGISTRY)[0],
  priorities: StrategicPriorityItem[],
  deps: ExecutionDependencyNode[],
  feed: ImplementationFeedItem[],
  activeRuntimeSubsystem: string,
): OwnerSubsystemBlock {
  const prioItems = reg.priorityIds
    .map((id) => priorities.find((p) => p.id === id))
    .filter((p): p is StrategicPriorityItem => !!p);
  const depItems = reg.dependencyIds
    .map((id) => deps.find((d) => d.id === id))
    .filter((d): d is ExecutionDependencyNode => !!d);

  const progressValues = [
    ...prioItems.map(priorityProgress),
    ...depItems.map(depProgress),
  ];
  const progressPercent =
    progressValues.length > 0
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : reg.id === "deployment"
        ? 85
        : 30;

  const feedLines = collectFeedLines(feed, reg.feedKeywords);
  const completed = [
    ...depItems.filter((d) => d.status === "done").map((d) => d.title),
    ...prioItems.filter((p) => p.status === "done").map((p) => p.title),
    ...feedLines.done,
  ].slice(0, 5);

  const active = [
    ...prioItems.filter((p) => p.status === "in_progress").map((p) => p.nextAction || p.title),
    ...depItems.filter((d) => d.status === "in_progress").map((d) => d.title),
    ...feedLines.partial,
  ].slice(0, 4);

  const blocked = [
    ...prioItems.filter((p) => p.status === "blocked").map((p) => p.nextAction || p.title),
    ...depItems.filter((d) => d.status === "blocked").map((d) => d.reason || d.title),
    ...feedLines.blocked,
  ].slice(0, 4);

  const future = [
    ...prioItems.filter((p) => p.status === "not_started").map((p) => p.title),
    ...depItems.filter((d) => d.status !== "done" && d.status !== "in_progress" && d.status !== "blocked").map((d) => d.title),
  ].slice(0, 4);

  const isActive =
    reg.id === activeRuntimeSubsystem ||
    prioItems.some((p) => p.status === "in_progress") ||
    depItems.some((d) => d.status === "in_progress");

  let glow: SubsystemGlow = "idle";
  if (blocked.length && !isActive) glow = "blocked";
  else if (blocked.length && isActive) glow = "blocked";
  else if (isActive) glow = "active";
  else if (progressPercent >= 90) glow = "done";

  const readinessLabel =
    progressPercent >= 85
      ? "Почти готово к production"
      : progressPercent >= 55
        ? "Активная разработка"
        : progressPercent >= 25
          ? "Фундамент заложен"
          : "Ранняя стадия";

  return {
    id: reg.id,
    titleRu: reg.titleRu,
    icon: reg.icon,
    progressPercent,
    readinessLabel,
    currentAiTask: isActive ? active[0] ?? prioItems[0]?.nextAction ?? null : null,
    completed,
    active,
    blocked,
    future,
    dependencies: depItems.map((d) => ({
      id: d.id,
      title: d.title,
      statusRu: statusRu(d.status),
    })),
    estimatedReadiness:
      progressPercent >= 80 ? "~1–2 недели до polish" : progressPercent >= 50 ? "~2–4 недели" : "~1–2 месяца",
    glow,
  };
}

function buildTaskQueue(
  priorities: StrategicPrioritiesPayload,
  runtimeTask: string,
): TaskQueueItem[] {
  const queue: TaskQueueItem[] = [
    {
      order: 1,
      titleRu: "Route intelligence UX + field validation",
      status: "active",
      subsystemId: "gps-route",
    },
    {
      order: 2,
      titleRu: "Stop-zone validation на устройстве",
      status: "next",
      subsystemId: "driver-intelligence",
    },
    {
      order: 3,
      titleRu: "Runtime stabilization (FGS + shift)",
      status: "queued",
      subsystemId: "runtime-apk",
    },
    {
      order: 4,
      titleRu: "Overlay HUD v2",
      status: "queued",
      subsystemId: "overlay-hud",
    },
    {
      order: 5,
      titleRu: "APK / release loop device-verified",
      status: "blocked",
      subsystemId: "runtime-apk",
    },
  ];

  const actionable = getActionableDependencies(priorities.dependencyGraph, priorities.priorities);
  if (actionable[0]) {
    queue[0] = {
      ...queue[0],
      titleRu: priorities.nextImplementationTarget || actionable[0].title,
    };
  }
  if (runtimeTask) {
    queue[0] = { ...queue[0], titleRu: runtimeTask, status: "active" };
  }
  return queue;
}

function mapRuntimeSubsystemToBlock(subsystem: string): string {
  if (subsystem.includes("driver")) return "driver-intelligence";
  if (subsystem.includes("route") || subsystem.includes("gps")) return "gps-route";
  if (subsystem.includes("ocr")) return "ocr";
  if (subsystem.includes("overlay")) return "overlay-hud";
  if (subsystem.includes("apk") || subsystem.includes("runtime")) return "runtime-apk";
  if (subsystem.includes("deploy")) return "deployment";
  return "ecosystem-ai";
}

export function buildOwnerCommandCenterView(
  priorities: StrategicPrioritiesPayload = getLocalStrategicPriorities(),
): OwnerCommandCenterView {
  const runtimeDoc = getLocalExecutionRuntime();
  const deployment = getLocalDeploymentStatus() as DeploymentStatusPayload;
  const feed = getLocalImplementationFeed().items ?? [];
  const r = runtimeDoc.runtime;
  const activeBlockId = mapRuntimeSubsystemToBlock(r.subsystem ?? "");

  const subsystems = SUBSYSTEM_REGISTRY.map((reg) =>
    buildSubsystemBlock(reg, priorities.priorities, priorities.dependencyGraph, feed, activeBlockId),
  );

  const overallReadinessPercent = Math.round(
    subsystems.reduce((s, b) => s + b.progressPercent, 0) / subsystems.length,
  );

  const phaseMeta = PHASE_OWNER[r.phase];
  const blockers = [
    ...(r.blocker ? [r.blocker] : []),
    ...priorities.priorities.filter((p) => p.status === "blocked").map((p) => `${p.title}: ${p.nextAction}`),
  ].slice(0, 5);

  const timeline = runtimeDoc.timeline ?? [];
  const narration = timeline.slice(0, 8).map((ev, i) => {
    const card = buildHumanTimelineCard(ev, timeline[i + 1]?.at ?? null, r.confidence);
    return {
      icon: card.icon,
      title: card.title,
      explanation: card.explanation,
      result: card.result,
      at: card.at,
    };
  });

  const routesOk = deployment.routeValidation?.allPassed;

  return {
    overallReadinessPercent,
    aiActivityRu: phaseMeta?.label ?? "AI работает",
    activeSubsystemRu: subsystems.find((s) => s.id === activeBlockId)?.titleRu ?? "Экосистема",
    confidencePercent: Math.round((r.confidence ?? 0.5) * 100),
    blockers,
    retryCount: r.retryCount ?? 0,
    nextActionRu: r.nextStep || priorities.nextImplementationTarget || "Продолжить roadmap",
    primaryObjectiveRu: priorities.ownerDirective ?? priorities.nextImplementationTarget,
    subsystems,
    taskQueue: buildTaskQueue(priorities, r.currentTask),
    narration,
    health: {
      productionRu: routesOk ? "Сайт доступен — все ключевые страницы отвечают" : "На production есть недоступные страницы",
      deploymentRu:
        deployment.lastProductionDeploy?.status === "ok"
          ? "Последний деплой успешен"
          : "Требуется обновление production",
      runtimeRu: r.status === "blocked" ? "Исполнение приостановлено" : "AI-цикл активен",
      aiExecutionRu: phaseMeta?.label ?? "—",
      validationRu: r.lastValidation.build === "passed" ? "Сборка и проверки в норме" : "Есть проблемы валидации",
    },
    runtime: r,
  };
}
