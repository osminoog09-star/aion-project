import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../../lib/supabase";

type Phase = "loading" | "done" | "error";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Deep link `aion-driver://auth/callback?code=…` после Google OAuth (PKCE).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error_description?: string | string[];
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
        setMessage("Supabase не настроен");
        setPhase("error");
        return;
      }
      let code = firstParam(params.code);
      if (!code) {
        const initial = await Linking.getInitialURL();
        if (initial) {
          const parsed = Linking.parse(initial);
          const q = parsed.queryParams?.code;
          code = Array.isArray(q) ? q[0] : q;
        }
      }
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          setPhase("error");
          return;
        }
      }
      setPhase("done");
    };
    void run();
  }, [params.code, params.error_description]);

  useEffect(() => {
    if (phase !== "error") return;
    const t = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 2800);
    return () => clearTimeout(t);
  }, [phase, router]);

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
