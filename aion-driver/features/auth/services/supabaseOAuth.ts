import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../lib/database.types";
import { getAuthRedirectUrl } from "./authRedirect";
import { translateAuthError } from "./authErrorRu";

WebBrowser.maybeCompleteAuthSession();

export function getOAuthRedirectUri(): string {
  return getAuthRedirectUrl();
}

/**
 * OAuth через PKCE: открыть системный браузер и обменять code на сессию.
 */
export async function signInWithOAuthRedirect(
  client: SupabaseClient<Database>,
  provider: "google" | "apple",
): Promise<{ ok: true } | { ok: false; message: string }> {
  const redirectTo = getOAuthRedirectUri();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      ...(provider === "google"
        ? {
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          }
        : {}),
    },
  });
  if (error || !data?.url) {
    return {
      ok: false,
      message: translateAuthError(error?.message ?? "OAuth URL недоступен"),
    };
  }
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: false,
  });
  if (result.type === "cancel" || result.type === "dismiss") {
    const { data: sess } = await client.auth.getSession();
    if (sess.session) return { ok: true };
    return { ok: false, message: "Вход отменён" };
  }
  if (result.type !== "success" || !("url" in result) || !result.url) {
    const { data: sess } = await client.auth.getSession();
    if (sess.session) return { ok: true };
    return { ok: false, message: "Вход отменён" };
  }
  const url = result.url;
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get("code");
    if (code) {
      const { error: ex } = await client.auth.exchangeCodeForSession(code);
      if (ex) return { ok: false, message: translateAuthError(ex.message) };
      return { ok: true };
    }
    const hash = parsed.hash?.replace(/^#/, "");
    if (hash) {
      const hp = new URLSearchParams(hash);
      const access_token = hp.get("access_token");
      const refresh_token = hp.get("refresh_token");
      if (access_token && refresh_token) {
        const { error: se } = await client.auth.setSession({
          access_token,
          refresh_token,
        });
        if (se) return { ok: false, message: se.message };
        return { ok: true };
      }
    }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Не удалось разобрать ответ OAuth",
    };
  }
  return {
    ok: false,
    message:
      "Нет code в redirect. Добавьте redirect URI в Supabase Auth: " + redirectTo,
  };
}

export async function signInWithAppleNative(
  client: SupabaseClient<Database>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (Platform.OS !== "ios") {
    return { ok: false, message: "Apple Sign-In только на iOS" };
  }
  try {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return { ok: false, message: "Apple Sign-In недоступен на устройстве" };
    }
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return { ok: false, message: "Apple не вернул identityToken" };
    }
    const { error } = await client.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Apple Sign-In ошибка",
    };
  }
}
