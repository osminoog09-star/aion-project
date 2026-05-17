import { readFileSync } from "node:fs";
import path from "node:path";
import type { DeviceBuildInfo } from "@/lib/shared/runtime-compatibility";

export type DeviceHeartbeatRecord = {
  at: string;
  device: DeviceBuildInfo;
};

const HEARTBEAT_FILE = path.join(process.cwd(), "src/content/device-build-heartbeat.json");
const SUPABASE_KIND = "portal_device_build_heartbeat";

function readLocal(): DeviceHeartbeatRecord | null {
  try {
    const raw = JSON.parse(readFileSync(HEARTBEAT_FILE, "utf8")) as DeviceHeartbeatRecord;
    if (!raw?.at || !raw?.device?.runtimeVersion) return null;
    return raw;
  } catch {
    return null;
  }
}

async function readSupabaseWithKey(apiKey: string): Promise<DeviceHeartbeatRecord | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!apiKey || !url) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, apiKey, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("ecosystem_public_snapshots")
      .select("payload, updated_at")
      .eq("kind", SUPABASE_KIND)
      .limit(1)
      .maybeSingle();
    if (error || !data?.payload) return null;
    const payload = data.payload as DeviceHeartbeatRecord;
    if (!payload?.device?.runtimeVersion) return null;
    return {
      at: payload.at ?? data.updated_at ?? new Date().toISOString(),
      device: payload.device,
    };
  } catch {
    return null;
  }
}

/** Service role (writes + reads) or anon (public SELECT on is_public rows). */
async function readSupabase(): Promise<DeviceHeartbeatRecord | null> {
  const serviceKey = process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) return readSupabaseWithKey(serviceKey);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return readSupabaseWithKey(anonKey ?? "");
}

/** Newest heartbeat: Supabase (prod) then local FS (dev). */
export async function resolveDeviceHeartbeatRecord(): Promise<DeviceHeartbeatRecord | null> {
  const remote = await readSupabase();
  const local = readLocal();
  if (remote && local) {
    const rMs = Date.parse(remote.at);
    const lMs = Date.parse(local.at);
    return rMs >= lMs ? remote : local;
  }
  return remote ?? local;
}

export function getLocalDeviceHeartbeatRecord(): DeviceHeartbeatRecord | null {
  return readLocal();
}
