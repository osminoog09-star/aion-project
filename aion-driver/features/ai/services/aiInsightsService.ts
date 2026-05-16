import type { Shift } from "../../../types";

/**
 * Локальные эвристики до подключения edge-модели / OpenAI через Supabase Edge.
 * Не отправляет данные на сервер.
 */
export function buildLocalShiftInsight(history: Shift[]): string {
  if (history.length === 0) {
    return "Накопите несколько смен — появятся персональные советы по времени и расходу.";
  }
  const last = history[0];
  const avgPph =
    history.reduce((s, x) => s + x.profitPerHour, 0) / history.length;
  if (last.profitPerHour >= avgPph * 1.1) {
    return "Последняя смена заметно эффективнее вашей средней — зафиксируйте условия (район, время).";
  }
  if (last.profitPerHour < avgPph * 0.85) {
    return "Ниже средней эффективности: проверьте простой, переключение топлива и длину смены.";
  }
  return "Стабильный профиль смен. Подключите облако и AI Premium для прогнозов и сравнения с рынком.";
}
