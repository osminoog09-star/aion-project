import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { GlowCard } from "../ui/GlowCard";
import {
  isNotifCaptureAvailable,
  notifCaptureAccessGranted,
  notifCaptureDrain,
  notifCaptureOpenSettings,
  type CapturedRawNotif,
} from "../../services/aionNotifCaptureNative";

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
  const [items, setItems] = useState<CapturedRawNotif[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshAccess = useCallback(async () => {
    setGranted(await notifCaptureAccessGranted());
  }, []);

  const poll = useCallback(async () => {
    const rows = await notifCaptureDrain();
    if (rows.length === 0) return;
    setItems((prev) => [...rows.reverse(), ...prev].slice(0, MAX_SHOWN));
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
    if (!available || !granted) {
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
  }, [available, granted, poll]);

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
        <Text className="text-sm text-white">
          Доступ к уведомлениям:{" "}
          <Text className={granted ? "text-emerald-300" : "text-amber-300"}>
            {granted ? "включён" : "выключен"}
          </Text>
        </Text>
        <Pressable
          onPress={() => void notifCaptureOpenSettings()}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5"
        >
          <Text className="text-xs font-semibold text-cyan-200">
            {granted ? "Настройки" : "Включить доступ"}
          </Text>
        </Pressable>
      </View>

      {granted ? (
        items.length === 0 ? (
          <Text className="mt-4 text-xs text-slate-500">
            Ждём уведомления Bolt… Открой Bolt и прими/заверши заказ — тексты появятся здесь.
          </Text>
        ) : (
          <View className="mt-4">
            <Text className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
              Пойманные уведомления Bolt ({items.length})
            </Text>
            {items.map((it, i) => (
              <View
                key={`${it.postedAtMs}-${i}`}
                className="mb-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2"
              >
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
