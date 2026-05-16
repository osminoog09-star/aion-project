import { NativeModules, Platform } from "react-native";

/** Не включать в маркетинг без полевой приёмки (OEM, батарея, жизненный цикл). */
export const OVERLAY_ORB_NATIVE_PRODUCTION_READY = false as const;

type OrbNative = {
  isOverlayPermissionGranted(): Promise<boolean>;
  showOrb(opts: { state: string; shiftId?: string }): Promise<boolean>;
  hideOrb(): Promise<boolean>;
  updateOrbState(state: string): Promise<boolean>;
  updateOrbHud?(title: string, body: string): Promise<boolean>;
};

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
  return m.isOverlayPermissionGranted();
}

export async function orbNativeShow(
  state: string,
  shiftId?: string | null,
): Promise<void> {
  const m = getOrbNative();
  if (!m) return;
  const opts: { state: string; shiftId?: string } = { state };
  if (shiftId) opts.shiftId = shiftId;
  await m.showOrb(opts);
}

export async function orbNativeHide(): Promise<void> {
  const m = getOrbNative();
  if (!m) return;
  await m.hideOrb();
}

export async function orbNativeUpdateState(state: string): Promise<void> {
  const m = getOrbNative();
  if (!m) return;
  await m.updateOrbState(state);
}

/** FGS-уведомление орбиты: метрики смены (без отдельного расчёта на стороне Kotlin). */
export async function orbNativeUpdateHud(title: string, body: string): Promise<void> {
  const m = getOrbNative();
  if (!m?.updateOrbHud) return;
  await m.updateOrbHud(title, body);
}
