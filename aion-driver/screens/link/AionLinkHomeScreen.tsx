import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CockpitBackground } from "../../components/ui/CockpitBackground";
import { GlowCard } from "../../components/ui/GlowCard";
import { GradientButton } from "../../components/ui/GradientButton";
import { useDevice } from "../../hooks/useDevice";
import { useOnline } from "../../features/sync/hooks/useNetworkStatus";
import { peekSyncQueue } from "../../features/sync/services/offlineQueue";
import { loadAionLinkLocalState, saveAionLinkLocalState } from "../../features/aion-link/storage/linkLocalState";
import { startAionLinkScreenshotWatch } from "../../features/aion-link/services/screenshotWatchStub";
import type { AionLinkLocalPersisted } from "../../features/aion-link/types";
import { useAuth } from "../../features/auth/hooks/useAuth";

export function AionLinkHomeScreen() {
  const online = useOnline();
  const { session, isGuest, isConfigured } = useAuth();
  const { updateSettings } = useDevice();
  const [linkState, setLinkState] = useState<AionLinkLocalPersisted | null>(null);
  const [queueLen, setQueueLen] = useState(0);
  const [labelDraft, setLabelDraft] = useState("");

  const refresh = useCallback(async () => {
    const [st, q] = await Promise.all([loadAionLinkLocalState(), peekSyncQueue()]);
    setLinkState(st);
    setLabelDraft(st.thisDeviceLabel);
    setQueueLen(q.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const id = setInterval(() => void refresh(), 8000);
      return () => clearInterval(id);
    }, [refresh]),
  );

  useEffect(() => {
    const stop = startAionLinkScreenshotWatch({ onCandidatePaths: () => undefined });
    return stop;
  }, []);

  const cloudOk = isConfigured && !isGuest && !!session;
  const statusLine = !online
    ? "Нет сети — всё сохранится и уйдёт, когда связь вернётся"
    : cloudOk
      ? "Личный телефон увидит данные после синхронизации"
      : "Войдите в аккаунт — так надёжнее связать устройства";

  const onSaveLabel = useCallback(async () => {
    if (!linkState) return;
    const trimmed = labelDraft.trim() || linkState.thisDeviceLabel;
    const next = { ...linkState, thisDeviceLabel: trimmed };
    await saveAionLinkLocalState(next);
    setLinkState(next);
  }, [labelDraft, linkState]);

  const onExitLink = useCallback(async () => {
    await updateSettings({ aionLinkMode: false });
    router.replace("/home");
  }, [updateSettings]);

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "left", "right"]}>
      <CockpitBackground>
        <ScrollView className="flex-1 px-4 pt-2" keyboardShouldPersistTaps="handled">
        <Text className="text-center text-xs uppercase tracking-[0.35em] text-slate-500">
          AION Link
        </Text>
        <Text className="mt-3 text-center text-2xl font-semibold text-white">
          Рабочий телефон подключён
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-400">{statusLine}</Text>

        <GlowCard glow="cyan" className="mt-6 mb-4">
          <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">Синхронизация</Text>
          <Text className="mt-3 text-base text-slate-200">
            В очереди: {queueLen}{" "}
            {queueLen === 1 ? "шаг" : queueLen < 5 ? "шага" : "шагов"}
          </Text>
          <Text className="mt-2 text-xs text-slate-500">
            Обновляем счётчик раз в несколько секунд, без постоянного опроса.
          </Text>
        </GlowCard>

        <GlowCard glow="violet" className="mb-4">
          <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">Как это называется</Text>
          <Text className="mt-2 text-sm text-slate-400">
            Имя видно только вам — например «Bolt» или «Рабочий».
          </Text>
          <TextInput
            value={labelDraft}
            onChangeText={setLabelDraft}
            onEndEditing={() => void onSaveLabel()}
            placeholder="Имя устройства"
            placeholderTextColor="#64748b"
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
          />
        </GlowCard>

        <GlowCard glow="neutral" className="mb-4">
          <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">Снимки выплат</Text>
          <Text className="mt-2 text-sm text-slate-400">
            Автоимпорт из галереи подключим аккуратно в следующем шаге. Сейчас — один тап в импорт.
          </Text>
          <GradientButton
            title="Добавить из скриншота"
            variant="glass"
            className="mt-4"
            onPress={() => router.push("/driver/import")}
          />
        </GlowCard>

        <GlowCard glow="cyan" className="mb-4">
          <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">Личный телефон</Text>
          <Text className="mt-2 text-sm text-slate-400">
            Код или QR появятся на личном AION — здесь только подготовка.
          </Text>
          <GradientButton
            title="Подключение"
            variant="ghost"
            className="mt-3"
            onPress={() => router.push("/link/pair" as Href)}
          />
        </GlowCard>

        {linkState ? (
          <Text className="mb-6 text-center text-[10px] text-slate-600">
            Устройство: {linkState.thisDeviceId.slice(0, 12)}…
          </Text>
        ) : null}

        <Pressable onPress={() => void onExitLink()} className="mb-10 items-center py-4">
          <Text className="text-sm text-slate-500">Выйти из режима Link</Text>
        </Pressable>
      </ScrollView>
      </CockpitBackground>
    </SafeAreaView>
  );
}
