import type { AionDevOpsStub } from "../diagnostics/types";

/**
 * Заглушка CI/CD до интеграции с GitHub API / badges.
 * Контракт зафиксирован — подмена реализацией без смены UI.
 */
export function getDevOpsStatusStub(): AionDevOpsStub {
  return {
    ciStatus: "unknown",
    lastWorkflowRun: null,
    otaPublishHint: "Статус GitHub Actions — в репозитории; см. docs/PIPELINE.md",
  };
}
