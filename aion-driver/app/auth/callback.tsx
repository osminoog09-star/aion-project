import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../../lib/supabase";
import { establishSessionFromCallbackUrl } from "../../features/auth/services/establishSessionFromCallback";

type Phase = "loading" | "done" | "error";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Deep link `aion-driver://auth/callback` — OAuth, подтверждение email, сброс пароля.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error_description?: string | string[];
    token_hash?: string | string[];
    type?: string | string[];
  }>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const oauthErr = firstParam(params.error_description);
      if (oauthErr) {
        setMessage(decodeURIComponent(oauthErr.replace(/\+/g, " ")));
        setPhase("error");
        return;
      }
      if (!supabase) {
        setMessage("Сервер авторизации недоступен");
        setPhase("error");
        return;
      }

      let url = Linking.createURL("auth/callback");
      const q = new URLSearchParams();
      const code = firstParam(params.code);
      const tokenHash = firstParam(params.token_hash);
      const type = firstParam(params.type);
      if (code) q.set("code", code);
      if (tokenHash) q.set("token_hash", tokenHash);
      if (type) q.set("type", type);
      const qs = q.toString();
      if (qs) url = `${url}?${qs}`;

      const initial = await Linking.getInitialURL();
      if (initial?.includes("auth/callback")) {
        url = initial;
      }

      const res = await establishSessionFromCallbackUrl(supabase, url);
      if (!res.ok) {
        setMessage(res.message);
        setPhase("error");
        return;
      }
      setPhase("done");
    };
    void run();
  }, [params.code, params.error_description, params.token_hash, params.type]);

  useEffect(() => {
    if (phase !== "error") return;
    const t = setTimeout(() => {
      router.replace({
        pathname: "/(auth)/login",
        params: { authError: message ?? "Ошибка входа" },
      });
    }, 2800);
    return () => clearTimeout(t);
  }, [phase, router, message]);

  if (phase === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <ActivityIndicator color="#22d3ee" size="large" />
        <Text className="mt-5 text-center text-sm text-slate-400">
          Подключение к облаку AION…
        </Text>
      </View>
    );
  }

  if (phase === "error") {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <Text className="text-center text-base text-rose-300">{message ?? "Ошибка входа"}</Text>
        <Text className="mt-4 text-center text-xs text-slate-500">Перенаправление на экран входа…</Text>
      </View>
    );
  }

  return <Redirect href="/home" />;
}
