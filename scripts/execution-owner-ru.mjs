/**
 * Russian owner-facing copy for Cursor terminal (mirrors src/lib/operations/execution-owner-ru.ts)
 */

export const PHASE_OWNER = {
  idle: { icon: "🔄", label: "AI анализирует roadmap", verb: "выбирает следующую задачу" },
  planning: { icon: "📋", label: "AI планирует работу", verb: "составляет план" },
  analyzing: { icon: "🔍", label: "AI анализирует систему", verb: "изучает контекст" },
  coding: { icon: "⚡", label: "AI пишет и улучшает код", verb: "вносит изменения" },
  validating: { icon: "✅", label: "AI проверяет качество", verb: "запускает проверки" },
  reviewing: { icon: "👁", label: "AI готовит ревью", verb: "готовит обзор" },
  deploying: { icon: "🚀", label: "AI выкладывает на production", verb: "обновляет сайт" },
  blocked: { icon: "🛑", label: "AI заблокирован", verb: "нужна помощь владельца" },
  recovering: { icon: "🛠", label: "AI исправляет проблему", verb: "пытается восстановить автоматически" },
  waiting_approval: { icon: "⏸", label: "AI ждёт вашего решения", verb: "ожидает подтверждения" },
  waiting_review: { icon: "📝", label: "AI ждёт Apply в Cursor", verb: "ждёт принятия изменений" },
  completed: { icon: "🔄", label: "AI переходит к следующей задаче", verb: "завершил этап — цикл продолжается" },
  optimizing: { icon: "⚙️", label: "AI оптимизирует систему", verb: "улучшает производительность и наблюдаемость" },
  auditing: { icon: "📊", label: "AI проводит аудит", verb: "проверяет архитектуру и технический долг" },
};

export function validationHuman(step, status) {
  const names = {
    typecheck: "Проверка типов",
    build: "Сборка приложения",
    deploy: "Проверка production",
    routes: "Проверка маршрутов",
  };
  const n = names[step] ?? step;
  if (status === "passed") return `${n} — успешно`;
  if (status === "failed") return `${n} — проблема`;
  if (status === "running") return `${n} — выполняется`;
  if (status === "pending") return `${n} — в очереди`;
  return `${n} — ещё не запускалась`;
}

export function narrateAionActiveRu({
  phase,
  task,
  subsystem,
  reasoning,
  next,
  confidence,
  progress,
  progressPercent,
  etaMinutes,
  runtimeGraph,
  autonomousDepth,
  currentFile,
  lastAction,
}) {
  const meta = PHASE_OWNER[phase] ?? PHASE_OWNER.coding;
  console.log("");
  console.log("[AION АКТИВЕН]");
  console.log("");
  console.log(`Фаза: ${phase}`);
  if (subsystem) console.log(`Подсистема: ${subsystem}`);
  console.log(`Задача: ${task || meta.label}`);
  if (progressPercent != null) console.log(`Прогресс: ${progressPercent}%`);
  if (etaMinutes != null) console.log(`ETA: ~${etaMinutes} мин`);
  console.log(`Следующее: ${next || "продолжить по roadmap"}`);
  if (progress) console.log(`Последнее действие: ${progress}`);
  if (lastAction) console.log(`Действие: [${lastAction}]`);
  if (currentFile) console.log(`Файл: ${currentFile}`);
  console.log("Heartbeat: alive");
  if (confidence != null) console.log(`Уверенность: ${Math.round(confidence * 100)}%`);
  if (runtimeGraph) console.log(`Runtime: ${runtimeGraph}`);
  if (autonomousDepth != null) console.log(`Глубина цикла: ${autonomousDepth}`);
  console.log("");
  console.log("Причина:");
  console.log(reasoning || meta.verb);
  console.log("");
}

export function buildTimelineRu(phase, task, reasoning) {
  const meta = PHASE_OWNER[phase] ?? PHASE_OWNER.coding;
  return {
    titleRu: meta.label,
    explanationRu: reasoning || task || meta.verb,
    resultRu:
      phase === "completed"
        ? "Переход к следующей задаче"
        : phase === "blocked"
          ? "Нужна помощь владельца"
          : phase === "recovering"
            ? "Автовосстановление"
            : "В процессе",
    icon: meta.icon,
  };
}
