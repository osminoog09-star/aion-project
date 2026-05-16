import type { DeviceBuildInfo } from "../shared/runtime-compatibility";
import { getAionPortalBaseUrl } from "../lib/aionPortalUrl";
import { collectDeviceBuildInfo } from "../lib/deviceBuildReport";

let lastSentAt = 0;
const MIN_INTERVAL_MS = 60_000;

export async function sendPortalDeviceHeartbeat(
  override?: Partial<DeviceBuildInfo>,
): Promise<{ ok: boolean; status: number }> {
  const now = Date.now();
  if (now - lastSentAt < MIN_INTERVAL_MS) {
    return { ok: true, status: 204 };
  }

  const device = { ...collectDeviceBuildInfo(), ...override };
  const base = getAionPortalBaseUrl().replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/api/operations/device-heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device }),
    });
    if (res.ok) lastSentAt = now;
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
