import "react-native-url-polyfill/auto";
import Constants from "expo-constants";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseAuthStorage } from "./supabaseSecureStorage";
import { AION_SUPABASE_ANON_KEY, AION_SUPABASE_URL } from "./supabaseDefaults";

const extra = Constants.expoConfig?.extra as
  | { supabaseUrl?: string; supabaseAnonKey?: string }
  | undefined;

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ||
  extra?.supabaseUrl?.trim() ||
  AION_SUPABASE_URL;
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  extra?.supabaseAnonKey?.trim() ||
  AION_SUPABASE_ANON_KEY;

/**
 * Typed Supabase client. Сессия: chunked SecureStore, auto refresh, persist.
 * Никогда не кладите service_role в клиент.
 */
export const supabase: SupabaseClient<Database> | null =
  url && anonKey
    ? createClient<Database>(url, anonKey, {
        auth: {
          storage: supabaseAuthStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: "pkce",
        },
      })
    : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error("Supabase не настроен: задайте EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }
  return supabase;
}
