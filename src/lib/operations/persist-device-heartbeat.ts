import type { DeviceBuildInfo } from "@/lib/shared/runtime-compatibility";

export type DeviceHeartbeatRecord = {
  at: string;
  device: DeviceBuildInfo;
};

const KIND = "portal_device_build_heartbeat";

/** Persist heartbeat to Supabase (service role or anon with RLS). */
export async function persistDeviceHeartbeatToSupabase(
  record: DeviceHeartbeatRecord,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const apiKey = serviceKey || anonKey;
  if (!url || !apiKey) return false;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, apiKey, { auth: { persistSession: false } });
    const row = {
      kind: KIND,
      payload: record,
      is_public: true,
      updated_at: record.at,
    };
    const { data: existing } = await supabase
      .from("ecosystem_public_snapshots")
      .select("id")
      .eq("kind", KIND)
      .limit(1)
      .maybeSingle();
    const write = existing?.id
      ? await supabase.from("ecosystem_public_snapshots").update(row).eq("id", existing.id)
      : await supabase.from("ecosystem_public_snapshots").insert(row);
    if (write.error) {
      console.error("[device-heartbeat] Supabase write failed:", write.error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[device-heartbeat] Supabase error:", e);
    return false;
  }
}
