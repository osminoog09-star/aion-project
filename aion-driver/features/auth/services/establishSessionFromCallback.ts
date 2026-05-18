import * as Linking from "expo-linking";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../lib/database.types";
import { translateAuthError } from "./authErrorRu";

function queryParam(
  params: Linking.QueryParams | null | undefined,
  key: string,
): string | undefined {
  if (!params) return undefined;
  const v = params[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function hashParams(url: string): URLSearchParams {
  const i = url.indexOf("#");
  if (i < 0) return new URLSearchParams();
  return new URLSearchParams(url.slice(i + 1));
}

/**
 * Обмен deep link / OAuth redirect на сессию Supabase.
 */
export async function establishSessionFromCallbackUrl(
  client: SupabaseClient<Database>,
  url: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const parsed = Linking.parse(url);
    const code = queryParam(parsed.queryParams, "code");
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) return { ok: false, message: translateAuthError(error.message) };
      return { ok: true };
    }

    const tokenHash = queryParam(parsed.queryParams, "token_hash");
    const otpType = queryParam(parsed.queryParams, "type");
    if (tokenHash) {
      const type =
        otpType === "recovery"
          ? "recovery"
          : otpType === "signup" || otpType === "email"
            ? "email"
            : "email";
      const { error } = await client.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (error) return { ok: false, message: translateAuthError(error.message) };
      return { ok: true };
    }

    const hp = hashParams(url);
    const access_token = hp.get("access_token");
    const refresh_token = hp.get("refresh_token");
    if (access_token && refresh_token) {
      const { error } = await client.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) return { ok: false, message: translateAuthError(error.message) };
      return { ok: true };
    }

    return { ok: false, message: "Ссылка входа не содержит данных сессии." };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Не удалось обработать ссылку входа",
    };
  }
}
