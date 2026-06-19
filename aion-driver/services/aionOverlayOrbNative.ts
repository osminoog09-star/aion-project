import { NativeModules, Platform } from "react-native";
import * as Sentry from "@sentry/react-native";
import { diagLog } from "../lib/diagnosticLog";
import { isSentryEnabled } from "../lib/sentry";

/** Не включать в маркетинг без полевой приёмки (OEM, батарея, жизненный цикл). */
export const OVERLAY_ORB_NATIVE_PRODUCTION_READY = false as const;

type OrbNative = {
  isOverlayPermissionGranted(): Promise<boolean>;
  showOrb(opts: { state: string; shiftId?: string }): Promise<boolean>;
  hideOrb(): Promise<boolean>;
  updateOrbState(state: string): Promise<boolean>;
  updateOrbHud?(title: string, body: string): Promise<boolean>;
  pulseOrb?(kind: string): Promise<boolean>;
};

export type OrbPulseKind =
  | "upload"
  | "gps"
  | "error"
  | "recovery"
  | "ai_think"
  | "sync"
  | "profit";

const heatWindows: Record<string, { start: number; n: number; logged: boolean }> =
  {};

function noteOrbHeat(op: string, softLimit: number): void {
  const now = Date.now();
  let w = heatWindows[op];
  if (!w || now - w.start > 30_000) {
    w = { start: now, n: 0, logged: false };
    heatWindows[op] = w;
  }
  w.n++;
  if (w.n > softLimit && !w.logged) {
    w.logged = true;
    diagLog("warn", "orb_heat", `Частые вызовы нативной орбиты: ${op}`, {
      count: w.n,
      windowS: 30,
    });
    if (isSentryEnabled()) {
      Sentry.captureMessage(
        `Orb native heat: ${op} (${w.n} calls / 30s)`,
        "warning",
      );
    }
  }
}

async function runOrb<T>(op: string, fn: () => Promise<T>, heatLimit = 25): Promise<T> {
  noteOrbHeat(op, heatLimit);
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    diagLog("error", "orb_native", op, { message: msg });
    if (isSentryEnabled()) {
      Sentry.addBreadcrumb({
        category: "orb",
        message: op,
        level: "error",
        data: { error: msg },
      });
      Sentry.captureException(err instanceof Error ? err : new Error(msg), {
        tags: { area: "orb" },
        extra: { op },
      });
    }
    throw err;
  }
}

function getOrbNative(): OrbNative | null {
  if (Platform.OS !== "android") return null;
  const m = NativeModules.AionOverlayOrb as OrbNative | undefined;
  return m ?? null;
}

export function isAionOverlayOrbNativeAvailable(): boolean {
  return getOrbNative() != null;
}

export async function orbNativeIsPermissionGranted(): Promise<boolean> {
  const m = getOrbNative();
  if (!m) return false;
  try {
    return await runOrb("isOverlayPermissionGranted", () => m.isOverlayPermissionGranted(), 80);
  } catch {
    return false;
  }
}

export async function orbNativeShow(
  state: string,
  shiftId?: string | null,
): Promise<void> {
  const m = getOrbNative();
  if (!m) return;
  const opts: { state: string; shiftId?: string } = { state };
  if (shiftId) opts.shiftId = shiftId;
  await runOrb("showOrb", () => m.showOrb(opts), 15);
}

export async function orbNativeHide(): Promise<void> {
  const m = getOrbNative();
  if (!m) return;
  await runOrb("hideOrb", () => m.hideOrb(), 40);
}

export async function orbNativeUpdateState(state: string): Promise<void> {
  const m = getOrbNative();
  if (!m) return;
  await runOrb("updateOrbState", () => m.updateOrbState(state), 24);
}

/** FGS-уведомление орбиты: метрики смены (без отдельного расчёта на стороне Kotlin). */
export async function orbNativeUpdateHud(title: string, body: string): Promise<void> {
  const m = getOrbNative();
  if (!m?.updateOrbHud) return;
  await runOrb("updateOrbHud", () => m.updateOrbHud!(title, body), 36);
}

/** Короткий «вспых» цветным RadialGradient (200ms) поверх постоянной анимации. */
export async function orbNativePulse(kind: OrbPulseKind): Promise<void> {
  const m = getOrbNative();
  if (!m?.pulseOrb) return;
  await runOrb("pulseOrb", () => m.pulseOrb!(kind), 48);
}
