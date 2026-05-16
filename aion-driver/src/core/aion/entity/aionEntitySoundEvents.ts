/**
 * Заготовка под аудио-отклик (без реализации звука).
 * Подписчики UI / haptics могут слушать те же доменные события позже.
 */
export const AION_ENTITY_SOUND_EVENTS = [
  "entity_idle",
  "entity_thinking",
  "entity_success",
  "entity_warning",
  "entity_critical",
  "sync_completed",
  "ocr_completed",
  "update_ready",
] as const;

export type AionEntitySoundEventId = (typeof AION_ENTITY_SOUND_EVENTS)[number];
