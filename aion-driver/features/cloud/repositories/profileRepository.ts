import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../lib/database.types";
import type { UserProfile } from "../../../types";

export async function fetchProfile(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<Database["public"]["Tables"]["profiles"]["Row"] | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfileDisplayName(
  client: SupabaseClient<Database>,
  userId: string,
  displayName: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function syncLocalUserProfileToCloud(
  client: SupabaseClient<Database>,
  userId: string,
  profile: UserProfile,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client.from("profiles").upsert(
    {
      id: userId,
      display_name: profile.name,
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}
