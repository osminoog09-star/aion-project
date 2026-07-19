import { isSupabaseConfigured, requireSupabase } from "../lib/supabase";
import {
  isNotifCaptureAvailable,
  notifCaptureDrain,
  type CapturedRawNotif,
} from "./aionNotifCaptureNative";

/**
 * Полный автомат захвата заказов Bolt: единственный дренёр нативного буфера.
 * Пойманные тексты (уведомления + читалка экрана) заливаются в облако
 * (`bolt_capture_samples`), откуда их читает помощник для настройки авто-записи.
 * Плюс держим последние в памяти для показа в бете. Заливка best-effort:
 * ошибки (нет таблицы/сети) не критичны — локальный показ работает.
 */
const MAX_RECENT = 30;
type Listener = () => void;

let recent: CapturedRawNotif[] = [];
const listeners = new Set<Listener>();

export function getRecentBoltCaptures(): CapturedRawNotif[] {
  return recent;
}

export function subscribeBoltCaptures(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

let uploading = false;

export async function drainAndUploadBoltCapture(): Promise<void> {
  if (uploading || !isNotifCaptureAvailable()) return;
  uploading = true;
  try {
    const rows = await notifCaptureDrain();
    if (rows.length === 0) return;

    recent = [...rows.slice().reverse(), ...recent].slice(0, MAX_RECENT);
    listeners.forEach((l) => l());

    if (!isSupabaseConfigured()) return;
    try {
      // Табличка не в типах Database (диагностическая) → каст.
      const client = requireSupabase() as unknown as {
        from: (t: string) => {
          insert: (rows: unknown[]) => Promise<{ error: unknown }>;
        };
      };
      await client.from("bolt_capture_samples").insert(
        rows.map((r) => ({
          source: r.source ?? "notif",
          title: r.title,
          text: r.text,
          captured_at: new Date(r.postedAtMs).toISOString(),
        })),
      );
    } catch {
      /* нет таблицы/сети — best-effort, локальный показ уже обновлён */
    }
  } finally {
    uploading = false;
  }
}
