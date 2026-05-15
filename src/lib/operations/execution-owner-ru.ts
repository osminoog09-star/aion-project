import type {
  ExecutionHealth,
  ExecutionRuntimeCore,
  ExecutionRuntimeStatus,
  ExecutionRuntimeTimelineEvent,
  ValidationStepStatus,
} from "@/contracts/execution-runtime";

/** Owner-facing Russian — internal code stays English. */

export type OwnerControlMode =
  | "ai_active"
  | "ai_waiting"
  | "ai_blocked"
  | "ai_repairing"
  | "ai_validating"
  | "ai_deploying"
  | "ai_idle"
  | "ai_stale";

export const PHASE_OWNER: Record<
  ExecutionRuntimeStatus,
  { icon: string; label: string; mode: OwnerControlMode; verb: string }
> = {
  idle: { icon: "⚪", label: "AI в режиме ожидания", mode: "ai_idle", verb: "ожидает новую задачу" },
  planning: { icon: "📋", label: "AI планирует работу", mode: "ai_active", verb: "составляет план" },
  analyzing: { icon: "🔍", label: "AI анализирует систему", mode: "ai_active", verb: "изучает контекст" },
  coding: { icon: "⚡", label: "AI пишет и улучшает код", mode: "ai_active", verb: "вносит изменения" },
  validating: { icon: "✅", label: "AI проверяет качество", mode: "ai_validating", verb: "запускает проверки" },
  reviewing: { icon: "👁", label: "AI готовит ревью", mode: "ai_active", verb: "готовит обзор" },
  deploying: { icon: "🚀", label: "AI выкладывает на production", mode: "ai_deploying", verb: "обновляет сайт" },
  blocked: { icon: "🛑", label: "AI заблокирован", mode: "ai_blocked", verb: "нужна помощь владельца" },
  recovering: { icon: "🛠", label: "AI исправляет проблему", mode: "ai_repairing", verb: "пытается восстановить автоматически" },
  waiting_approval: { icon: "⏸", label: "AI ждёт вашего решения", mode: "ai_waiting", verb: "ожидает подтверждения" },
  waiting_review: { icon: "📝", label: "AI ждёт Apply в Cursor", mode: "ai_waiting", verb: "ждёт принятия изменений" },
  completed: { icon: "✨", label: "AI завершил этап", mode: "ai_idle", verb: "этап выполнен" },
};

export const HEALTH_OWNER: Record<
  ExecutionHealth,
  { icon: string; title: string; subtitle: (sec: number) => string }
> = {
  active: {
    icon: "🟢",
    title: "AI активно работает",
    subtitle: (s) => `последний сигнал ${s} сек назад`,
  },
  idle: {
    icon: "⚪",
    title: "AI на паузе",
    subtitle: (s) => `без активности ${s} сек`,
  },
  waiting_review: {
    icon: "🟡",
    title: "AI ждёт вас в Cursor",
    subtitle: () => "нажмите Apply, чтобы продолжить",
  },
  blocked: {
    icon: "🔴",
    title: "AI не может продолжить",
    subtitle: () => "требуется ваше вмешательство",
  },
  stale: {
    icon: "🟠",
    title: "Связь с AI просрочена",
    subtitle: (s) => `нет обновлений ${s} сек — возможна задержка`,
  },
};

const VALIDATION_STEP_RU: Record<string, string> = {
  typecheck: "Проверка типов TypeScript",
  build: "Сборка приложения",
  deploy: "Проверка production-деплоя",
  routes: "Проверка маршрутов сайта",
};

export function validationHuman(
  step: keyof typeof VALIDATION_STEP_RU,
  status: ValidationStepStatus,
): string {
  const name = VALIDATION_STEP_RU[step] ?? step;
  switch (status) {
    case "passed":
      return `${name} — успешно`;
    case "failed":
      return `${name} — обнаружена проблема`;
    case "running":
      return `${name} — выполняется сейчас`;
    case "pending":
      return `${name} — в очереди`;
    default:
      return `${name} — ещё не запускалась`;
  }
}

const FAILURE_KIND_RU: Record<string, string> = {
  typecheck: "ошибка проверки типов",
  build: "сборка не прошла",
  deploy_validation: "production не прошёл проверку",
  routes_manifest: "маршрут отсутствует в сборке",
  route_validation: "страница недоступна на сайте",
};

export function failureHuman(kind: string, message: string): string {
  const label = FAILURE_KIND_RU[kind] ?? kind;
  return message ? `${label}: ${message}` : label;
}

const FILE_ABSTRACT: [RegExp, string][] = [
  [/execution-runtime|execution-owner-ru/i, "Улучшена система видимости AI-исполнения"],
  [/LiveExecutionPanel|HumanTimeline/i, "Обновлён экран «Живое исполнение» для владельца"],
  [/execution-self-heal|execution-heal/i, "Улучшена автоматическая самовосстановление"],
  [/execution-heartbeat|heartbeat-daemon/i, "Добавлена система heartbeat — AI не «замирает»"],
  [/execution-feed|ecosystem-implementation-feed/i, "Обновлена лента изменений экосистемы"],
  [/deploy:validate|post-deploy-validate/i, "Улучшена проверка production-маршрутов"],
  [/route-timeline|RouteTimeline/i, "Улучшена аналитика маршрутов водителя"],
  [/backfill|stopZone|StopZone/i, "Улучшена историческая аналитика GPS"],
  [/strategic-priorities/i, "Обновлены стратегические приоритеты"],
  [/architecture-review/i, "Обновлена очередь архитектурных ревью"],
];

export function abstractFileChange(filePath: string): string {
  for (const [re, desc] of FILE_ABSTRACT) {
    if (re.test(filePath)) return desc;
  }
  const base = filePath.split("/").pop() ?? filePath;
  return `Изменён файл: ${base}`;
}

export function abstractFileChanges(files: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of files) {
    const a = abstractFileChange(f);
    if (!seen.has(a)) {
      seen.add(a);
      out.push(a);
    }
  }
  return out;
}

export function ownerControlMode(runtime: ExecutionRuntimeCore, health: ExecutionHealth): OwnerControlMode {
  if (health === "blocked" || runtime.status === "blocked") return "ai_blocked";
  if (health === "waiting_review" || runtime.status === "waiting_review") return "ai_waiting";
  if (health === "stale") return "ai_stale";
  if (runtime.status === "recovering") return "ai_repairing";
  if (runtime.status === "validating") return "ai_validating";
  if (runtime.status === "deploying") return "ai_deploying";
  if (health === "active") return "ai_active";
  return PHASE_OWNER[runtime.phase]?.mode ?? "ai_idle";
}

export const CONTROL_MODE_RU: Record<OwnerControlMode, string> = {
  ai_active: "AI работает",
  ai_waiting: "AI ждёт вас",
  ai_blocked: "AI заблокирован",
  ai_repairing: "AI чинит автоматически",
  ai_validating: "AI проверяет",
  ai_deploying: "AI выкладывает на сайт",
  ai_idle: "AI свободен",
  ai_stale: "Связь с AI устарела",
};

export function deployStatusHuman(status: string | undefined, allRoutesOk: boolean | undefined): string {
  if (allRoutesOk === false) return "На сайте есть недоступные страницы";
  switch (status) {
    case "ok":
      return "Сайт на production работает нормально";
    case "stale":
      return "Деплой устарел — нужно обновление";
    case "failed":
      return "Последний деплой завершился с ошибкой";
    default:
      return "Статус production проверяется";
  }
}

export type HumanTimelineCard = {
  icon: string;
  title: string;
  explanation: string;
  result: string;
  confidence: number | null;
  durationSec: number | null;
  at: string;
};

export function buildHumanTimelineCard(
  ev: ExecutionRuntimeTimelineEvent,
  prevAt: string | null,
  defaultConfidence?: number,
): HumanTimelineCard {
  const phase = ev.phase as ExecutionRuntimeStatus;
  const meta = PHASE_OWNER[phase] ?? PHASE_OWNER.idle;
  const durationSec =
    prevAt && ev.at
      ? Math.max(0, Math.round((Date.parse(ev.at) - Date.parse(prevAt)) / 1000))
      : null;

  let title = ev.titleRu ?? meta.label;
  let explanation = ev.explanationRu ?? ev.summary;
  let result = ev.resultRu ?? "В процессе";

  if (phase === "recovering") {
    title = ev.titleRu ?? "AI исправляет проблему";
    result = ev.resultRu ?? "Автовосстановление запущено";
  } else if (phase === "blocked") {
    title = ev.titleRu ?? "AI остановлен — нужна помощь";
    result = ev.resultRu ?? "Требуется вмешательство владельца";
  } else if (phase === "completed") {
    title = ev.titleRu ?? "AI завершил этап";
    result = ev.resultRu ?? "Этап выполнен успешно";
  } else if (phase === "validating") {
    title = ev.titleRu ?? "AI проверяет качество";
    result = ev.resultRu ?? "Идут проверки сборки и маршрутов";
  } else if (phase === "deploying") {
    title = ev.titleRu ?? "AI обновляет production";
    result = ev.resultRu ?? "Ожидается подтверждение Vercel";
  }

  if (ev.summary.includes("404") || ev.summary.includes("/operations/live")) {
    explanation = "Маршрут /operations/live был недоступен на production";
    if (phase === "recovering" || phase === "completed") {
      result = "Проверка маршрутов прошла успешно";
    }
  }

  return {
    icon: ev.icon ?? meta.icon,
    title,
    explanation,
    result,
    confidence: ev.confidence ?? defaultConfidence ?? null,
    durationSec,
    at: ev.at,
  };
}

export function selfHealOwnerCard(runtime: ExecutionRuntimeCore): {
  broken: string;
  action: string;
  attempts: string;
  risk: string;
  needsOwner: boolean;
} | null {
  if (runtime.status !== "recovering" && runtime.status !== "blocked") return null;
  const retries = runtime.retryCount ?? 0;
  const conf = runtime.recoveryConfidence ?? runtime.confidence;
  const needsOwner = conf < 0.45 || runtime.status === "blocked";

  return {
    broken: runtime.blocker ?? runtime.lastFailure?.message ?? "Обнаружена техническая проблема",
    action:
      runtime.status === "recovering"
        ? "AI пытается автоматически исправить: проверка типов → сборка → production"
        : "AI остановился и ждёт вашего решения",
    attempts: retries > 0 ? `Попытка восстановления: ${retries}` : "Первая попытка восстановления",
    risk: needsOwner ? "Высокий — может понадобиться ваше действие" : "Низкий — AI справится сам",
    needsOwner,
  };
}

export function narrateAionActiveRu(runtime: {
  phase: string;
  task: string;
  reasoning?: string;
  next?: string;
  confidence?: number;
  progress?: string | null;
}): string[] {
  const meta = PHASE_OWNER[runtime.phase as ExecutionRuntimeStatus] ?? PHASE_OWNER.coding;
  const lines = [
    "",
    "[AION АКТИВЕН]",
    "",
    "Сейчас:",
    runtime.task || meta.label,
    "",
    "Причина:",
    runtime.reasoning || meta.verb,
    "",
    "Действие:",
    runtime.progress || meta.verb,
    "",
    "Следующий шаг:",
    runtime.next || "продолжить по roadmap",
    "",
  ];
  if (runtime.confidence != null) {
    lines.push(`Уверенность: ${Math.round(runtime.confidence * 100)}%`, "");
  }
  return lines;
}
