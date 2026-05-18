/**
 * Облачный relay «рабочий телефон → аккаунт → личное устройство».
 *
 * Фаза 1: офлайн-очередь без сети (см. syncEngine) — оставлено для обратной совместимости.
 * Фаза 2: таблицы link_pair_tokens + link_snapshots с RLS, Supabase Realtime publication.
 *
 * См. modules:
 *  - linkPairTokens.ts — короткоживущий QR-токен (issue/claim/revoke)
 *  - linkSnapshots.ts  — push/fetch + realtime subscription
 */
export const LINK_RELAY_PHASE = 2 as const;
