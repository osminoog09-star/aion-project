/**
 * Russian owner-facing copy for Cursor terminal (mirrors src/lib/operations/execution-owner-ru.ts)
 */

export const PHASE_OWNER = {
  idle: { icon: "⚪", label: "AI в режиме ожидания", verb: "ожидает новую задачу" },
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
  completed: { icon: "✨", label: "AI завершил этап", verb: "этап выполнен" },
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

export function narrateAionActiveRu({ phase, task, reasoning, next, confidence, progress }) {
  const meta = PHASE_OWNER[phase] ?? PHASE_OWNER.coding;
  console.log("");
  console.log("[AION АКТИВЕН]");
  console.log("");
  console.log("Сейчас:");
  console.log(task || meta.label);
  console.log("");
  console.log("Причина:");
  console.log(reasoning || meta.verb);
  console.log("");
  console.log("Действие:");
  console.log(progress || meta.verb);
  console.log("");
  console.log("Следующий шаг:");
  console.log(next || "продолжить по roadmap");
  if (confidence != null) console.log(`\nУверенность: ${Math.round(confidence * 100)}%`);
  console.log("");
}

export function buildTimelineRu(phase, task, reasoning) {
  const meta = PHASE_OWNER[phase] ?? PHASE_OWNER.coding;
  return {
    titleRu: meta.label,
    explanationRu: reasoning || task || meta.verb,
    resultRu:
      phase === "completed"
        ? "Этап выполнен"
        : phase === "blocked"
          ? "Нужна помощь владельца"
          : phase === "recovering"
            ? "Автовосстановление"
            : "В процессе",
    icon: meta.icon,
  };
}
