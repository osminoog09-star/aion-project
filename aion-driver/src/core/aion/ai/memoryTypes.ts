/**
 * Фундамент «памяти» AION: локальные записи и рекомендации без облачного LLM.
 * Позже: синк в edge / cloud, embeddings, персональные приоритеты.
 */
export type AionMemoryKind = "insight" | "preference" | "system_note";

export type AionMemoryEntry = {
  id: string;
  kind: AionMemoryKind;
  title: string;
  body: string;
  createdAt: number;
  /** Модуль-источник, если применимо */
  moduleId?: string;
};

export type AionRecommendation = {
  id: string;
  title: string;
  detail: string;
  priority: "low" | "medium" | "high";
  /** Действие в UI: маршрут или ключ */
  action?: "open_driver" | "open_settings" | "open_diagnostics" | "open_ota_debug";
};
