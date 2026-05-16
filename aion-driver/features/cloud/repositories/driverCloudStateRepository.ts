import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../../lib/database.types";

export async function fetchDriverCloudState(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<Database["public"]["Tables"]["driver_cloud_state"]["Row"] | null> {
  const { data, error } = await client
    .from("driver_cloud_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertDriverCloudStatePayload(
  client: SupabaseClient<Database>,
  userId: string,
  payload: Json,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client.from("driver_cloud_state").upsert(
    {
      user_id: userId,
      payload,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

