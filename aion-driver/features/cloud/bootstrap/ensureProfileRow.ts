import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../lib/database.types";

/**
 * Гарантирует строку public.profiles для текущего auth-пользователя (после sign-in / OAuth).
 */
export async function ensureProfileRow(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client.from("profiles").upsert(
    {
      id: userId,
      display_name: null,
      default_currency: "EUR",
      region: null,
      locale: null,
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}
