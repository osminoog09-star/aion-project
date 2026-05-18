import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json } from "../../../lib/database.types";
import { requireSupabase } from "../../../lib/supabase";

export type LinkSnapshotKind =
  | "ocr_snapshot"
  | "orb_state"
  | "sync_event"
  | "heartbeat";

export type LinkSnapshotRow = {
  id: string;
  user_id: string;
  source_device_id: string;
  kind: LinkSnapshotKind;
  payload: unknown;
  created_at: string;
};

export type LinkSnapshotInput = {
  userId: string;
  sourceDeviceId: string;
  kind: LinkSnapshotKind;
  payload: Record<string, unknown>;
};

/**
 * Push снапшот в облачный relay (две точки одного владельца).
 * Realtime publication уже включена миграцией — другие девайсы получат INSERT через канал.
 */
export async function pushLinkSnapshot(input: LinkSnapshotInput): Promise<LinkSnapshotRow> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("link_snapshots")
    .insert({
      user_id: input.userId,
      source_device_id: input.sourceDeviceId,
      kind: input.kind,
      payload: input.payload as unknown as Json,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as LinkSnapshotRow;
}

export async function fetchRecentLinkSnapshots(
  userId: string,
  kind?: LinkSnapshotKind,
  limit = 50,
): Promise<LinkSnapshotRow[]> {
  const client = requireSupabase();
  let q = client
    .from("link_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as LinkSnapshotRow[];
}

export type LinkSnapshotListener = (row: LinkSnapshotRow) => void;

/**
 * Подписка на live INSERT-ы в link_snapshots для owner-а.
 * Подписки в Supabase Realtime автоматически фильтруются RLS, но мы ещё явно
 * фильтруем по user_id для надёжности.
 *
 * Возвращает unsubscribe.
 */
export function subscribeToLinkSnapshots(
  userId: string,
  onInsert: LinkSnapshotListener,
  opts: { excludeDeviceId?: string; kinds?: LinkSnapshotKind[] } = {},
): () => void {
  const client = requireSupabase();
  const channel: RealtimeChannel = client
    .channel(`link-snapshots-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "link_snapshots",
        filter: `user_id=eq.${userId}`,
      },
      (msg) => {
        const row = msg.new as LinkSnapshotRow;
        if (opts.excludeDeviceId && row.source_device_id === opts.excludeDeviceId) {
          return;
        }
        if (opts.kinds && opts.kinds.length > 0 && !opts.kinds.includes(row.kind)) {
          return;
        }
        try {
          onInsert(row);
        } catch {
          // intentionally ignored: subscriber error isolation
        }
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
