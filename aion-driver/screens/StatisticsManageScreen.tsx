import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppConfirmModal } from "../components/feedback/AppConfirmModal";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { GlowCard } from "../components/ui/GlowCard";
import { GradientButton } from "../components/ui/GradientButton";
import { useAuth } from "../features/auth/hooks/useAuth";
import { buildStatisticsInventory } from "../features/statistics/buildStatisticsInventory";
import { STAT_GROUP_LABELS } from "../features/statistics/catalog";
import type { StatElementInventoryItem, StatResetTarget, StatisticsInventory } from "../features/statistics/types";
import { useShift } from "../hooks/useShift";
import { isSupabaseConfigured } from "../lib/supabase";
import { colors } from "../tokens";

type PendingReset =
  | { kind: "element"; target: StatResetTarget; title: string }
  | { kind: "shift"; shiftId: string; label: string };

export function StatisticsManageScreen() {
  const { session, isGuest } = useAuth();
  const { resetStatisticElement } = useShift();
  const [inventory, setInventory] = useState<StatisticsInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingReset | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const inv = await buildStatisticsInventory();
      setInventory(inv);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const runReset = async (p: PendingReset) => {
    setPending(null);
    setBusy(true);
    const target: StatResetTarget =
      p.kind === "shift" ? { id: "shift_one", shiftId: p.shiftId } : p.target;
    const res = await resetStatisticElement(target, {
      userId: session?.user?.id && !isGuest ? session.user.id : null,
    });
    setBusy(false);
    if (res.ok) {
      showToast(res.message ?? "Готово");
      await reload();
    } else {
      showToast(res.error ?? "Ошибка");
    }
  };

  const groups = inventory
    ? groupElements(inventory.elements, session?.user?.id && !isGuest && isSupabaseConfigured())
    : [];

  return (
    <CockpitBackground variant="cockpit">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between py-3">
            <Pressable onPress={() => router.back()} className="rounded-xl bg-white/10 px-3 py-2">
              <Text className="text-sm font-semibold text-white">← Назад</Text>
            </Pressable>
            <Text className="text-xs uppercase tracking-widest text-violet-300/90">
              Управление данными
            </Text>
            <View style={{ width: 72 }} />
          </View>

          <Text className="text-2xl font-bold text-white">Статистика</Text>
          <Text className="mt-2 text-sm leading-5 text-slate-400">
            Каждый блок можно сбросить отдельно: смены по периоду, GPS, OCR, облако. Профиль и
            настройки не меняются.
          </Text>

          {toast ? <Text className="mt-3 text-sm text-cyan-300">{toast}</Text> : null}
          {inventory?.hasActiveShift ? (
            <Text className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Активная смена: часть пунктов недоступна, пока смена не завершена. «Текущая смена» —
              сбросит её без сохранения.
            </Text>
          ) : null}

          {loading ? (
            <ActivityIndicator className="mt-10" color={colors.violet400 ?? "#a78bfa"} />
          ) : (
            <>
              {groups.map(([groupKey, items]) => (
                <View key={groupKey} className="mt-6">
                  <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {STAT_GROUP_LABELS[groupKey] ?? groupKey}
                  </Text>
                  {items.map((item) => (
                    <StatElementRow
                      key={item.id}
                      item={item}
                      disabled={busy || isBlocked(item, inventory!)}
                      onReset={() =>
                        setPending({
                          kind: "element",
                          target: { id: item.id },
                          title: item.title,
                        })
                      }
                    />
                  ))}
                </View>
              ))}

              {inventory && inventory.recentShifts.length > 0 ? (
                <View className="mt-8">
                  <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Отдельные смены
                  </Text>
                  {inventory.recentShifts.map((s) => (
                    <GlowCard key={s.id} glow="neutral" className="mb-2">
                      <View className="flex-row items-center gap-3">
                        <View className="flex-1">
                          <Text className="text-sm text-white">{s.label}</Text>
                          <Text className="mt-1 font-mono text-[10px] text-slate-600">
                            {s.id.slice(0, 12)}…
                          </Text>
                        </View>
                        <Pressable
                          disabled={busy || inventory.hasActiveShift}
                          onPress={() =>
                            setPending({
                              kind: "shift",
                              shiftId: s.id,
                              label: s.label,
                            })
                          }
                          className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2"
                        >
                          <Text className="text-xs font-semibold text-rose-200">Сбросить</Text>
                        </Pressable>
                      </View>
                    </GlowCard>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <AppConfirmModal
          visible={pending != null}
          title={`Сбросить «${pending?.kind === "shift" ? pending.label : pending?.title}»?`}
          message="Данные удаляются без восстановления на этом устройстве."
          confirmLabel="Сбросить"
          cancelLabel="Отмена"
          destructive
          onCancel={() => setPending(null)}
          onConfirm={() => {
            if (pending) void runReset(pending);
          }}
        />
      </SafeAreaView>
    </CockpitBackground>
  );
}

function groupElements(
  elements: StatElementInventoryItem[],
  cloudOk: boolean,
): [string, StatElementInventoryItem[]][] {
  const filtered = elements.filter((e) => e.id !== "cloud_trips" || cloudOk);
  const map = new Map<string, StatElementInventoryItem[]>();
  for (const e of filtered) {
    const list = map.get(e.group) ?? [];
    list.push(e);
    map.set(e.group, list);
  }
  return Array.from(map.entries());
}

function isBlocked(item: StatElementInventoryItem, inv: StatisticsInventory): boolean {
  if (item.empty && item.id !== "active_shift" && item.id !== "cloud_trips") return true;
  if (item.blockedWhenActiveShift && inv.hasActiveShift && item.id !== "active_shift") {
    return true;
  }
  return false;
}

function StatElementRow({
  item,
  disabled,
  onReset,
}: {
  item: StatElementInventoryItem;
  disabled: boolean;
  onReset: () => void;
}) {
  return (
    <GlowCard glow="neutral" className="mb-2">
      <Text className="text-sm font-semibold text-white">{item.title}</Text>
      <Text className="mt-1 text-xs leading-4 text-slate-500">{item.description}</Text>
      <Text className="mt-2 text-xs text-slate-400">{item.preview}</Text>
      <GradientButton
        title="Сбросить этот блок"
        variant="ghost"
        className="mt-3"
        disabled={disabled}
        onPress={onReset}
        size="cockpit"
      />
    </GlowCard>
  );
}
