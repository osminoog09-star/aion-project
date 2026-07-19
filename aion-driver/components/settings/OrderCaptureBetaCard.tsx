import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, Share, Text, View } from "react-native";
import { GlowCard } from "../ui/GlowCard";
import {
  isNotifCaptureAvailable,
  notifCaptureAccessGranted,
  notifCaptureOpenSettings,
  screenReaderAccessGranted,
  screenReaderOpenSettings,
  type CapturedRawNotif,
} from "../../services/aionNotifCaptureNative";
import {
  drainAndUploadBoltCapture,
  getRecentBoltCaptures,
  subscribeBoltCaptures,
} from "../../services/boltCaptureUpload";

const MAX_SHOWN = 25;
const POLL_MS = 3000;

/**
 * Бета «Захват заказов»: показывает СЫРЫЕ уведомления Bolt, которые словил
 * нативный слушатель — чтобы сверить реальные тексты и настроить авто-запись.
 * Пока НИЧЕГО не записывает в доход — только показывает. Инертно, пока
 * пользователь не дал доступ к уведомлениям.
 */
export function OrderCaptureBetaCard() {
  const available = isNotifCaptureAvailable();
  const [granted, setGranted] = useState(false);
  const [screenGranted, setScreenGranted] = useState(false);
  const [items, setItems] = useState<CapturedRawNotif[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const active = granted || screenGranted;

  const refreshAccess = useCallback(async () => {
    setGranted(await notifCaptureAccessGranted());
    setScreenGranted(await screenReaderAccessGranted());
  }, []);

  // Дренит буфер и заливает в облако ОДИН владелец — BoltCaptureUploaderBridge.
  // Карточка только подписана на его список (иначе оба дренили бы наперегонки).
  const poll = useCallback(async () => {
    await drainAndUploadBoltCapture();
    setItems(getRecentBoltCaptures().slice(0, MAX_SHOWN));
  }, []);

  const shareAll = useCallback(async () => {
    if (items.length === 0) return;
    const body = items
      .map((it) => {
        const src = it.source === "screen" ? "экран" : "увед.";
        const parts = [it.title, it.text].filter(Boolean).join(" — ");
        return `[${src}] ${parts}`;
      })
      .join("\n");
    try {
      await Share.share({ message: `AION — пойманное от Bolt:\n${body}` });
    } catch {
      /* пользователь закрыл окно — не ошибка */
    }
  }, [items]);

  // Список пойманного ведёт заливщик — подписываемся на его обновления.
  useEffect(() => {
    setItems(getRecentBoltCaptures().slice(0, MAX_SHOWN));
    return subscribeBoltCaptures(() => {
      setItems(getRecentBoltCaptures().slice(0, MAX_SHOWN));
    });
  }, []);

  useEffect(() => {
    if (!available) return;
    void refreshAccess();
    // Пере-проверяем доступ при возврате в приложение (пользователь мог включить).
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refreshAccess();
    });
    return () => sub.remove();
  }, [available, refreshAccess]);

  useEffect(() => {
    if (!available || !active) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    void poll();
    timerRef.current = setInterval(() => void poll(), POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [available, active, poll]);

  if (!available) {
    return (
      <GlowCard glow="neutral" className="mb-4">
        <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Захват заказов · бета
        </Text>
        <Text className="mt-2 text-sm leading-5 text-slate-400">
          Появится в новой сборке приложения. Позволит AION самому видеть заказы Bolt.
        </Text>
      </GlowCard>
    );
  }

  return (
    <GlowCard glow="violet" className="mb-4">
      <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
        Захват заказов · бета
      </Text>
      <Text className="mt-2 text-sm leading-5 text-slate-400">
        Пока только показывает, что присылает Bolt — чтобы настроить авто-запись заказов.
        Ничего в доход не пишется.
      </Text>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="flex-1 pr-2 text-sm text-white">
          Уведомления:{" "}
          <Text className={granted ? "text-emerald-300" : "text-amber-300"}>
            {granted ? "включены" : "выключены"}
          </Text>
        </Text>
        <Pressable
          onPress={() => void notifCaptureOpenSettings()}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5"
        >
          <Text className="text-xs font-semibold text-cyan-200">
            {granted ? "Настройки" : "Включить"}
          </Text>
        </Pressable>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="flex-1 pr-2 text-sm text-white">
          Читалка экрана (полнее):{" "}
          <Text className={screenGranted ? "text-emerald-300" : "text-amber-300"}>
            {screenGranted ? "включена" : "выключена"}
          </Text>
        </Text>
        <Pressable
          onPress={() => void screenReaderOpenSettings()}
          className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5"
        >
          <Text className="text-xs font-semibold text-violet-200">
            {screenGranted ? "Настройки" : "Включить"}
          </Text>
        </Pressable>
      </View>
      <Text className="mt-1 text-[10px] leading-4 text-slate-500">
        Читалка (Спец. возможности) видит сумму, адрес и оплату прямо с экрана Bolt —
        включай, если уведомлений мало.
      </Text>

      {active ? (
        items.length === 0 ? (
          <Text className="mt-4 text-xs text-slate-500">
            Ждём Bolt… Открой Bolt и прими/заверши заказ — тексты появятся здесь.
          </Text>
        ) : (
          <View className="mt-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                Пойманное от Bolt ({items.length})
              </Text>
              <Pressable
                onPress={() => void shareAll()}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1"
              >
                <Text className="text-xs font-semibold text-emerald-200">Поделиться</Text>
              </Pressable>
            </View>
            {items.map((it, i) => (
              <View
                key={`${it.postedAtMs}-${i}`}
                className="mb-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2"
              >
                <Text className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-violet-300/80">
                  {it.source === "screen" ? "экран" : "уведомление"}
                </Text>
                {it.title ? (
                  <Text className="text-xs font-semibold text-slate-200">{it.title}</Text>
                ) : null}
                {it.text ? (
                  <Text className="mt-0.5 text-xs text-slate-400">{it.text}</Text>
                ) : null}
                <Text className="mt-1 text-[10px] text-slate-600">
                  {new Date(it.postedAtMs).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        )
      ) : null}
    </GlowCard>
  );
}
