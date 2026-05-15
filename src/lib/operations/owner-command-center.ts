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
import { getLocalStrategicPriorities } from "@/lib/strategic-priorities";
import { buildHumanTimelineCard, PHASE_OWNER, validationHuman } from "@/lib/operations/execution-owner-ru";
import {
  AUTONOMOUS_QUEUE_RU,
  humanizeNextStepRu,
  humanizeTaskRu,
  SUBSYSTEM_TITLES_RU,
} from "@/lib/operations/owner-ru-constitution";
import { getLocalEcosystemStatus } from "@/lib/ecosystem-data";
import { averageReadiness, averageSubsystemPercent } from "@/lib/readiness";

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

export type ProjectReadinessMetrics = {
  mvpPercent: number;
  productionPercent: number;
  runtimeStabilityPercent: number;
  driverIntelligencePercent: number;
  ecosystemMaturityPercent: number;
};

export type DependencyGraphNodeView = {
  id: string;
  titleRu: string;
  statusRu: string;
  dependsOnRu: string[];
  isBlocked: boolean;
  isActive: boolean;
};

export type ValidationMatrixRu = {
  typecheck: string;
  build: string;
  deploy: string;
  routes: string;
};

export type ContinuousRuntimePanel = {
  progressPercent: number;
  etaMinutes: number | null;
  autonomousDepth: number;
  currentFile: string | null;
  runtimeGraph: string;
  heartbeatAgeSec: number;
  orchestrationModeRu: string;
  currentTaskRu: string;
  reasoningRu: string;
  lastAction: string | null;
};

export type OwnerCommandCenterView = {
  overallReadinessPercent: number;
  readiness: ProjectReadinessMetrics;
  currentPhaseRu: string;
  lastCompletedRu: string | null;
  aiActivityRu: string;
  activeSubsystemRu: string;
  confidencePercent: number;
  blockers: string[];
  retryCount: number;
  nextActionRu: string;
  primaryObjectiveRu: string;
  continuousRuntime: ContinuousRuntimePanel;
  subsystems: OwnerSubsystemBlock[];
  taskQueue: TaskQueueItem[];
  dependencyGraph: DependencyGraphNodeView[];
  narration: { icon: string; title: string; explanation: string; result: string; at: string }[];
  health: ProjectHealthSnapshot;
  validationMatrix: ValidationMatrixRu;
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
    titleRu: SUBSYSTEM_TITLES_RU["driver-intelligence"],
    icon: "🧠",
    priorityIds: ["driver-intelligence-core", "unified-shift-runtime"],
    dependencyIds: ["post-shift-analytics", "time-intelligence"],
    feedKeywords: ["driver", "analytics", "rollup", "backfill", "intelligence"],
  },
  {
    id: "gps-route",
    titleRu: SUBSYSTEM_TITLES_RU["gps-route"],
    icon: "🛰",
    priorityIds: ["route-heatmap-future"],
    dependencyIds: ["route-gps-store", "time-intelligence", "heatmap-analytics"],
    feedKeywords: ["gps", "route", "timeline", "маршрут", "headless", "trip"],
  },
  {
    id: "ocr",
    titleRu: SUBSYSTEM_TITLES_RU.ocr,
    icon: "📷",
    priorityIds: ["ocr-production-queue"],
    dependencyIds: [],
    feedKeywords: ["ocr", "fuel", "queue", "чек"],
  },
  {
    id: "overlay-hud",
    titleRu: SUBSYSTEM_TITLES_RU["overlay-hud"],
    icon: "💠",
    priorityIds: ["overlay-hud-evolution"],
    dependencyIds: ["overlay-hud-full"],
    feedKeywords: ["overlay", "hud", "orb"],
  },
  {
    id: "runtime-apk",
    titleRu: SUBSYSTEM_TITLES_RU["runtime-apk"],
    icon: "📱",
    priorityIds: ["apk-release-loop", "background-runtime-production"],
    dependencyIds: ["route-gps-store"],
    feedKeywords: ["apk", "eas", "runtime", "background", "shift"],
  },
  {
    id: "ecosystem-ai",
    titleRu: SUBSYSTEM_TITLES_RU["ecosystem-ai"],
    icon: "🌐",
    priorityIds: ["ecosystem-control-portal"],
    dependencyIds: [],
    feedKeywords: ["portal", "operations", "live", "owner", "orchestr", "review"],
  },
  {
    id: "deployment",
    titleRu: SUBSYSTEM_TITLES_RU.deployment,
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
  const statuses: TaskQueueItem["status"][] = [
    "active",
    "next",
    "queued",
    "queued",
    "blocked",
    "queued",
    "queued",
  ];
  const queue: TaskQueueItem[] = AUTONOMOUS_QUEUE_RU.map((q, i) => ({
    order: q.order,
    titleRu: q.titleRu,
    status: statuses[i] ?? "queued",
    subsystemId: q.subsystemId,
  }));

  const activeTitle = humanizeTaskRu(
    runtimeTask || priorities.nextImplementationTarget || queue[0]!.titleRu,
  );
  queue[0] = { ...queue[0]!, titleRu: activeTitle, status: "active" };
  return queue;
}

function buildDependencyGraph(
  graph: ExecutionDependencyNode[],
  activePhase: string,
): DependencyGraphNodeView[] {
  return graph.map((node) => ({
    id: node.id,
    titleRu: humanizeTaskRu(node.title),
    statusRu: statusRu(node.status),
    dependsOnRu: node.dependsOn,
    isBlocked: node.status === "blocked",
    isActive: node.status === "in_progress" || activePhase.includes(node.id),
  }));
}

function buildReadinessMetrics(
  subsystems: OwnerSubsystemBlock[],
  routesOk: boolean | undefined,
): ProjectReadinessMetrics {
  const byId = Object.fromEntries(subsystems.map((s) => [s.id, s]));
  const eco = getLocalEcosystemStatus();
  const pillarAvg = Math.round(averageReadiness(eco.readiness));
  const subAvg = Math.round(averageSubsystemPercent(eco.subsystems));

  return {
    mvpPercent: Math.round(
      ((byId["driver-intelligence"]?.progressPercent ?? 0) +
        (byId["gps-route"]?.progressPercent ?? 0) +
        (byId.ocr?.progressPercent ?? 0)) /
        3,
    ),
    productionPercent: routesOk ? 94 : 48,
    runtimeStabilityPercent: byId["runtime-apk"]?.progressPercent ?? 35,
    driverIntelligencePercent: byId["driver-intelligence"]?.progressPercent ?? 0,
    ecosystemMaturityPercent: Math.round(
      (pillarAvg + subAvg + (byId["ecosystem-ai"]?.progressPercent ?? 0)) / 3,
    ),
  };
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

  const v = r.lastValidation;

  return {
    overallReadinessPercent,
    readiness: buildReadinessMetrics(subsystems, routesOk),
    currentPhaseRu: phaseMeta?.label ?? "AI работает",
    lastCompletedRu: r.lastCompletedAction ? humanizeTaskRu(r.lastCompletedAction) : null,
    aiActivityRu: phaseMeta?.label ?? "AI работает",
    activeSubsystemRu:
      subsystems.find((s) => s.id === activeBlockId)?.titleRu ?? SUBSYSTEM_TITLES_RU["ecosystem-ai"],
    confidencePercent: Math.round((r.confidence ?? 0.5) * 100),
    blockers,
    retryCount: r.retryCount ?? 0,
    nextActionRu: humanizeNextStepRu(
      r.nextStep || priorities.nextImplementationTarget || "Продолжить автоматически",
    ),
    primaryObjectiveRu: priorities.ownerDirective ?? priorities.nextImplementationTarget ?? "",
    continuousRuntime: {
      progressPercent: r.progressPercent ?? 50,
      etaMinutes: r.etaMinutes ?? null,
      autonomousDepth: r.autonomousDepth ?? 0,
      currentFile: r.currentFile ?? null,
      runtimeGraph: r.runtimeGraph ?? "ACTIVE",
      heartbeatAgeSec: Math.round(
        Math.max(
          0,
          Date.now() - Date.parse(r.heartbeatAt || r.updatedAt || new Date().toISOString()),
        ) / 1000,
      ),
      orchestrationModeRu:
        r.orchestrationMode === "continuous"
          ? "Непрерывный автономный режим"
          : "Ручной режим (запустите execution:runtime-loop)",
      currentTaskRu: humanizeTaskRu(r.currentTask),
      reasoningRu: r.reasoning,
      lastAction: r.lastAction ?? null,
    },
    subsystems,
    taskQueue: buildTaskQueue(priorities, r.currentTask),
    dependencyGraph: buildDependencyGraph(priorities.dependencyGraph, r.currentTask),
    narration,
    health: {
      productionRu: routesOk
        ? "Сайт доступен — все ключевые страницы отвечают"
        : "На production есть недоступные страницы",
      deploymentRu:
        deployment.lastProductionDeploy?.status === "ok"
          ? "Последний выклад на сайт прошёл успешно"
          : "Требуется обновление сайта на production",
      runtimeRu:
        r.status === "blocked"
          ? "AI приостановлен — требуется внимание"
          : r.status === "recovering"
            ? "AI восстанавливает систему"
            : r.orchestrationMode === "continuous"
              ? "Непрерывный цикл исполнения активен"
              : "Цикл исполнения активен",
      aiExecutionRu: phaseMeta?.label ?? "—",
      validationRu:
        v.build === "passed" && v.deploy === "passed"
          ? "Все проверки пройдены"
          : "AI обнаружил проблему в проверках",
    },
    validationMatrix: {
      typecheck: validationHuman("typecheck", v.typecheck),
      build: validationHuman("build", v.build),
      deploy: validationHuman("deploy", v.deploy),
      routes: validationHuman("routes", v.routes ?? "idle"),
    },
    runtime: r,
  };
}
