import type { AionDiagnosticsSnapshot } from "../diagnostics/types";
import type { AionRecommendation } from "./memoryTypes";

/** Эвристики без ML: production-ready заглушка до cloud AI. */
export function deriveRecommendations(s: AionDiagnosticsSnapshot): AionRecommendation[] {
  const out: AionRecommendation[] = [];
  if (!s.networkOnline) {
    out.push({
      id: "net-off",
      title: "Офлайн",
      detail: "Синк и OTA возобновятся при подключении.",
      priority: "high",
    });
  }
  if (s.syncQueueLength > 0) {
    out.push({
      id: "sync-q",
      title: "Очередь синка",
      detail: `${s.syncQueueLength} операций ждут сеть или сервер.`,
      priority: s.syncQueueLength > 8 ? "high" : "medium",
      action: s.syncQueueLength > 8 ? "open_diagnostics" : "open_settings",
    });
  }
  if (s.ota.phase === "error") {
    out.push({
      id: "ota-err",
      title: "Обновление",
      detail: s.ota.errorMessage ?? "Проверьте сеть и повторите OTA.",
      priority: "high",
      action: "open_ota_debug",
    });
  }
  if (s.ota.phase === "ready" || s.ota.bannerVisible) {
    out.push({
      id: "ota-ready",
      title: "Доступно обновление",
      detail: "Можно применить без переустановки APK.",
      priority: "medium",
      action: "open_ota_debug",
    });
  }
  if (s.auth.isConfigured && !s.auth.isGuest && !s.auth.sessionPresent) {
    out.unshift({
      id: "auth-cloud",
      title: "Войдите в аккаунт",
      detail: "Так синхронизация и устройства работают надёжнее.",
      priority: "high",
      action: "open_settings",
    });
  }
  if (out.length === 0) {
    out.push({
      id: "all-clear",
      title: "Паттерн стабилен",
      detail: "Модули в пределах нормы. Откройте Driver для смены.",
      priority: "low",
      action: "open_driver",
    });
  }
  return out.slice(0, 4);
}
