import { NativeModules, Platform } from "react-native";

/**
 * JS-мост к нативному захвату уведомлений Bolt (NotificationListenerService).
 * Все методы безопасны при отсутствии модуля (старый APK) — возвращают пустое/false,
 * не бросают. Захват инертен, пока пользователь не дал «Доступ к уведомлениям».
 *
 * На этом этапе — ТОЛЬКО показ сырых уведомлений (для сверки реальных текстов
 * Bolt). Авто-запись дохода подключается отдельным шагом после сверки паттернов.
 */
export type CapturedRawNotif = {
  /** "notif" — из уведомления; "screen" — с экрана Bolt (Accessibility). */
  source?: "notif" | "screen";
  packageName: string;
  title: string | null;
  text: string | null;
  postedAtMs: number;
};

type NotifCaptureNative = {
  isAccessGranted(): Promise<boolean>;
  openAccessSettings(): Promise<boolean>;
  isAccessibilityGranted(): Promise<boolean>;
  openAccessibilitySettings(): Promise<boolean>;
  drainBuffer(): Promise<CapturedRawNotif[]>;
};

function getNative(): NotifCaptureNative | null {
  if (Platform.OS !== "android") return null;
  const m = NativeModules.AionNotifCapture as NotifCaptureNative | undefined;
  return m ?? null;
}

/** Нативный модуль есть в этой сборке? (false на старом APK без него.) */
export function isNotifCaptureAvailable(): boolean {
  return getNative() != null;
}

export async function notifCaptureAccessGranted(): Promise<boolean> {
  const m = getNative();
  if (!m) return false;
  try {
    return await m.isAccessGranted();
  } catch {
    return false;
  }
}

export async function notifCaptureOpenSettings(): Promise<void> {
  const m = getNative();
  if (!m) return;
  try {
    await m.openAccessSettings();
  } catch {
    /* ignore */
  }
}

export async function screenReaderAccessGranted(): Promise<boolean> {
  const m = getNative();
  if (!m?.isAccessibilityGranted) return false;
  try {
    return await m.isAccessibilityGranted();
  } catch {
    return false;
  }
}

export async function screenReaderOpenSettings(): Promise<void> {
  const m = getNative();
  if (!m?.openAccessibilitySettings) return;
  try {
    await m.openAccessibilitySettings();
  } catch {
    /* ignore */
  }
}

export async function notifCaptureDrain(): Promise<CapturedRawNotif[]> {
  const m = getNative();
  if (!m) return [];
  try {
    const rows = await m.drainBuffer();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
