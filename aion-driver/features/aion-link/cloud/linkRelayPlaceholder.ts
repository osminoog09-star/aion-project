/**
 * Облачный relay «рабочий телефон → аккаунт → личное устройство».
 * Фаза 1: тип операции в офлайн-очереди + снятие без вызова Supabase (см. syncEngine).
 * Следующий шаг: таблица paired_devices, signed upload URL, Realtime.
 */
export const LINK_RELAY_PHASE = 1 as const;
