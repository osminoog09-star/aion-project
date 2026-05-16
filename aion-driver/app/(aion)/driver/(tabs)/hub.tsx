import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShift } from "../../../../contexts/ShiftContext";
import { buildLocalShiftInsight } from "../../../../features/ai/services/aiInsightsService";
import { useAuth } from "../../../../features/auth/hooks/useAuth";
import { useOnline } from "../../../../features/sync/hooks/useNetworkStatus";
import { peekSyncQueue } from "../../../../features/sync/services/offlineQueue";
import { isSupabaseConfigured } from "../../../../lib/supabase";

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const online = useOnline();
  const { user, session, signOut } = useAuth();
  const { history } = useShift();
  const insight = useMemo(() => buildLocalShiftInsight(history), [history]);
  const [queueLen, setQueueLen] = useState(0);

  const refreshQueue = useCallback(() => {
    void peekSyncQueue().then((q) => setQueueLen(q.length));
  }, []);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshQueue();
      return () => undefined;
    }, [refreshQueue]),
  );

  const cloud = isSupabaseConfigured();

  return (
    <ScrollView
      className="flex-1 bg-slate-950 px-5"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 140,
      }}
    >
      <Text className="mb-1 text-2xl font-bold text-white">Хаб</Text>
      <Text className="mb-6 text-sm text-slate-400">
        AI + облако + синк. Дорожная карта: docs/PLATFORM.md
      </Text>

      <Pressable
        onPress={() => router.push("/driver/profile")}
        className="mb-4 rounded-3xl border border-white/15 bg-slate-900/70 p-4 active:opacity-85"
      >
        <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
          Профиль водителя
        </Text>
        <Text className="text-base font-semibold text-white">Метрики и достижения</Text>
        <Text className="mt-1 text-xs text-slate-400">
          Заработок, км, расход, AI score — только из ваших смен.
        </Text>
      </Pressable>

      <View className="mb-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-200">
          Состояние
        </Text>
        <Text className="text-sm text-slate-200">
          Сеть: {online ? "онлайн" : "офлайн"}
        </Text>
        <Text className="text-sm text-slate-200">
          Supabase: {cloud ? "настроен" : "нет ключей (.env)"}
        </Text>
        <Text className="text-sm text-slate-200">
          Аккаунт: {user?.email ?? "гость (локально)"}
        </Text>
        <Text className="text-sm text-slate-200">
          Очередь синка: {queueLen} операций
        </Text>
        {user ? (
          <Pressable
            onPress={() => void signOut()}
            className="mt-3 self-start rounded-xl border border-white/15 px-3 py-2 active:opacity-80"
          >
            <Text className="text-xs font-semibold text-rose-200">Выйти</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            className="mt-3 self-start rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 active:opacity-80"
          >
            <Text className="text-xs font-semibold text-cyan-100">Войти</Text>
          </Pressable>
        )}
      </View>

      <View className="mb-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-200">
          AI (локальный слой)
        </Text>
        <Text className="text-sm leading-5 text-slate-200">{insight}</Text>
      </View>

      <View className="mb-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-200">
          Карта
        </Text>
        <Text className="mb-3 text-sm leading-5 text-slate-300">
          OSM: заправки и зоны (foundation). Демо-маркеры на экране карты.
        </Text>
        <Pressable
          onPress={() => router.push("/map")}
          className="self-start rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 active:opacity-80"
        >
          <Text className="text-xs font-semibold text-emerald-100">Открыть карту</Text>
        </Pressable>
      </View>

      <View className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          Синхронизация
        </Text>
        <Text className="text-sm leading-5 text-slate-400">
          Завершённые смены ставятся в очередь и уходят в таблицу trips при сети. TanStack
          Query кэш cloud:* персистится в AsyncStorage.
        </Text>
      </View>
    </ScrollView>
  );
}
