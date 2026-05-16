import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { memo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { TimelineEntry } from "../../features/history/useTimelineEntries";
import type { AppCurrencyCode } from "../../types/device";
import { formatCurrencyDisplay } from "../../utils/formatting";

type Props = {
  entries: TimelineEntry[];
  currency: AppCurrencyCode;
};

function labelFor(e: TimelineEntry, currency: AppCurrencyCode): string {
  if (e.kind === "shift") {
    return `Смена · ${formatCurrencyDisplay(e.shift.netProfit, currency)}`;
  }
  if (e.kind === "ocr") {
    return `OCR · ${e.record.platform.toUpperCase()}`;
  }
  return e.event.title;
}

function iconFor(e: TimelineEntry): keyof typeof MaterialIcons.glyphMap {
  if (e.kind === "shift") return "local-taxi";
  if (e.kind === "ocr") return "document-scanner";
  const t = e.event.type;
  if (t === "shift_paused") return "pause-circle-filled";
  if (t === "shift_resumed") return "play-circle-filled";
  if (t === "fuel_warning") return "local-gas-station";
  if (t === "milestone_reached") return "military-tech";
  if (t === "new_best_hour" || t === "efficiency_improved") return "trending-up";
  if (t === "ota_updated" || t === "ota_installed") return "system-update";
  if (t === "reconnect_completed" || t === "reconnected" || t === "sync_completed")
    return "cloud-done";
  if (t === "ai_recommendation") return "psychology";
  return "bolt";
}

function tagFor(e: TimelineEntry): string {
  if (e.kind === "shift") return "shift";
  if (e.kind === "ocr") return "ocr";
  return e.event.type;
}

export const DriverBriefTimeline = memo(function DriverBriefTimeline({
  entries,
  currency,
}: Props) {
  const slice = entries.slice(0, 12);

  if (slice.length === 0) {
    return (
      <View className="mb-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-6">
        <Text className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Лента активности</Text>
        <Text className="mt-2 text-base font-semibold text-slate-200">Пока тихо</Text>
        <Text className="mt-1 text-sm leading-5 text-slate-500">
          Запустите смену, импортируйте выплату или дождитесь синка — здесь появятся смены, OCR и системные события
          Driver OS.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Лента Driver OS</Text>
        <Pressable onPress={() => router.push("/driver/history")} hitSlop={8}>
          <Text className="text-xs font-semibold text-cyan-300">Вся история</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-1">
          {slice.map((e) => (
            <Pressable
              key={`${e.kind}-${e.id}`}
              onPress={() =>
                e.kind === "aion" ? router.push("/aion-diagnostics") : router.push("/driver/history")
              }
              className="min-w-[148] rounded-2xl border border-white/10 bg-slate-900/75 px-3 py-2.5 active:opacity-90"
            >
              <View className="flex-row items-center gap-1.5">
                <MaterialIcons name={iconFor(e)} size={16} color="#22d3ee" />
                <Text className="text-[9px] uppercase tracking-widest text-slate-500">{tagFor(e)}</Text>
              </View>
              <Text className="mt-1 text-xs font-semibold text-white" numberOfLines={2}>
                {labelFor(e, currency)}
              </Text>
              {e.kind === "aion" && e.event.detail ? (
                <Text className="mt-1 text-[10px] text-slate-500" numberOfLines={2}>
                  {e.event.detail}
                </Text>
              ) : null}
              <Text className="mt-1 text-[10px] text-slate-600">
                {new Date(e.kind === "aion" ? e.at : e.at).toLocaleString([], {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});
