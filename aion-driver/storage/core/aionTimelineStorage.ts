import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@aion/core/timeline_v1";
const MAX = 80;

export type AionTimelineEventType =
  | "ota_installed"
  | "ota_updated"
  | "sync_completed"
  | "queue_flushed"
  | "ocr_imported"
  | "shift_completed"
  | "shift_paused"
  | "shift_resumed"
  | "crash_detected"
  | "offline_entered"
  | "reconnected"
  | "reconnect_completed"
  | "module_updated"
  | "system_note"
  | "ai_recommendation"
  | "fuel_warning"
  | "milestone_reached"
  | "new_best_hour"
  | "ota_reload_scheduled"
  | "apk_manifest_refresh"
  | "efficiency_improved"
  | "fuel_ocr_attached";

export type AionTimelineEvent = {
  id: string;
  type: AionTimelineEventType;
  title: string;
  detail?: string;
  at: number;
  moduleId?: string;
};

async function readAll(): Promise<AionTimelineEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as AionTimelineEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: AionTimelineEvent[]): Promise<void> {
  const trimmed = items.slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
}

export async function appendAionTimelineEvent(
  e: Omit<AionTimelineEvent, "id" | "at"> & { id?: string; at?: number },
): Promise<void> {
  const all = await readAll();
  const ev: AionTimelineEvent = {
    id: e.id ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type: e.type,
    title: e.title,
    detail: e.detail,
    at: e.at ?? Date.now(),
    moduleId: e.moduleId,
  };
  await writeAll([ev, ...all]);
}

export async function listAionTimeline(limit = 24): Promise<AionTimelineEvent[]> {
  const all = await readAll();
  return all.slice(0, limit);
}
