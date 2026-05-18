import Constants from "expo-constants";
import { Platform } from "react-native";
import type { Json } from "../../../lib/database.types";
import { requireSupabase } from "../../../lib/supabase";
import { loadAionLinkLocalState } from "../storage/linkLocalState";

/**
 * Гарантирует строку в public.devices для пары (user_id, install_id) и возвращает её uuid.
 * Используется в Pair flow (device_a_id) и в push снапшотов (source_device_id).
 *
 * install_id берётся из local AionLink state (стабильный per-install).
 * platform/app_version — из expo-constants + Platform.
 */
export async function ensureCloudDevice(userId: string): Promise<{
  deviceId: string;
  installId: string;
}> {
  const local = await loadAionLinkLocalState();
  const installId = local.thisDeviceId;
  const client = requireSupabase();
  const appVersion =
    typeof Constants.expoConfig?.version === "string"
      ? Constants.expoConfig.version
      : null;
  const deviceModel =
    typeof Constants.deviceName === "string" ? Constants.deviceName : null;

  const payload: Json = {
    label: local.thisDeviceLabel,
    platform_os: Platform.OS,
    platform_version: String(Platform.Version),
  };

  const { data, error } = await client
    .from("devices")
    .upsert(
      {
        user_id: userId,
        install_id: installId,
        platform: Platform.OS,
        device_model: deviceModel,
        app_version: appVersion,
        last_seen_at: new Date().toISOString(),
        payload,
      },
      { onConflict: "user_id,install_id", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (error) {
    const { data: existing, error: selErr } = await client
      .from("devices")
      .select("id")
      .eq("user_id", userId)
      .eq("install_id", installId)
      .maybeSingle();
    if (selErr || !existing) throw error;
    return { deviceId: existing.id, installId };
  }
  return { deviceId: data.id, installId };
}

export async function touchCloudDeviceLastSeen(
  userId: string,
  deviceId: string,
): Promise<void> {
  const client = requireSupabase();
  await client
    .from("devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", deviceId)
    .eq("user_id", userId);
}
